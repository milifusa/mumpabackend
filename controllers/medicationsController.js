const admin = require('firebase-admin');
const { addDays } = require('date-fns');
const TimezoneHelper = require('../utils/timezoneHelper');
const {
  getUserFCMTokens,
  sendPushToTokens,
  toStringMap
} = require('./sleepNotificationsController');

const db = admin.firestore();
const FOLLOW_UP_MINUTES = 120;

const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

const parseTime = (timeStr) => {
  const match = timeStr.match(TIME_REGEX);
  if (!match) return null;
  return { hours: parseInt(match[1], 10), minutes: parseInt(match[2], 10) };
};

const buildLocalDate = (dateStr) => {
  const [year, month, day] = dateStr.split('-').map((part) => parseInt(part, 10));
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day, 0, 0, 0, 0);
};

const buildTimesFromInterval = (startTime, endTime, intervalMinutes) => {
  const start = parseTime(startTime);
  const end = parseTime(endTime);
  if (!start || !end || !intervalMinutes || intervalMinutes < 5) return [];

  const startTotal = start.hours * 60 + start.minutes;
  const endTotal = end.hours * 60 + end.minutes;

  if (endTotal <= startTotal) return [];

  const times = [];
  for (let minutes = startTotal; minutes <= endTotal; minutes += intervalMinutes) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    times.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
  }
  return times;
};

const clearMedicationReminders = async (medicationId) => {
  const snapshot = await db
    .collection('scheduled_med_notifications')
    .where('medicationId', '==', medicationId)
    .limit(200)
    .get();

  if (snapshot.empty) return 0;

  const batch = db.batch();
  snapshot.docs.forEach((doc) => batch.delete(doc.ref));
  await batch.commit();
  return snapshot.size;
};

const cleanupOrphanReminders = async (userId, childId, validMedicationIds) => {
  const snapshot = await db
    .collection('scheduled_med_notifications')
    .where('userId', '==', userId)
    .where('childId', '==', childId)
    .get();

  if (snapshot.empty) return 0;

  const toDelete = snapshot.docs.filter(doc => {
    const medId = doc.data().medicationId;
    return !validMedicationIds.has(medId);
  });

  if (toDelete.length === 0) return 0;

  const batches = [];
  for (let i = 0; i < toDelete.length; i += 400) {
    const batch = db.batch();
    toDelete.slice(i, i + 400).forEach(doc => batch.delete(doc.ref));
    batches.push(batch.commit());
  }

  await Promise.all(batches);
  return toDelete.length;
};

const scheduleMedicationReminders = async ({
  userId,
  childId,
  childName,
  medicationId,
  medicationName,
  dose,
  doseUnit,
  times,
  timezone,
  startDate,
  endDate,
  scheduleDays = 7,
  repeatEveryMinutes,
  startTime,
  endTime
}) => {
  const now = new Date();
  const nowLocal = TimezoneHelper.getNowInUserTimezone(timezone);
  const startLocal = startDate ? buildLocalDate(startDate) : new Date(nowLocal);
  if (!startLocal) {
    throw new Error('Fecha de inicio inválida');
  }
  startLocal.setHours(0, 0, 0, 0);

  const endLocal = endDate ? buildLocalDate(endDate) : null;
  if (endDate && !endLocal) {
    throw new Error('Fecha de fin inválida');
  }

  const reminders = [];
  const daysToSchedule = Math.min(Math.max(scheduleDays, 1), 60);

  for (let dayOffset = 0; dayOffset < daysToSchedule; dayOffset++) {
    const dayLocal = addDays(startLocal, dayOffset);
    if (endLocal && dayLocal > endLocal) break;

    const dayTimes = repeatEveryMinutes
      ? buildTimesFromInterval(startTime, endTime, repeatEveryMinutes)
      : times;

    for (const timeStr of dayTimes) {
      const parsed = parseTime(timeStr);
      if (!parsed) continue;

      const localDateTime = new Date(dayLocal);
      localDateTime.setHours(parsed.hours, parsed.minutes, 0, 0);

      const scheduledFor = TimezoneHelper.userTimeToUtc(localDateTime, timezone);
      if (scheduledFor <= now) continue;

      const timeLabel = TimezoneHelper.formatInUserTimezone(scheduledFor, timezone, 'h:mm a');
      reminders.push({
        userId,
        childId,
        childName,
        medicationId,
        medicationName,
        dose,
        doseUnit,
        type: 'medication_reminder',
        followUpMinutes: FOLLOW_UP_MINUTES,
        title: `💊 Momento de ${medicationName}`,
        body: `Es hora de ${medicationName}: ${dose} ${doseUnit} para ${childName} a las ${timeLabel}.`,
        scheduledFor,
        sent: false,
        sentAt: null,
        data: {
          type: 'medication_reminder',
          childId,
          medicationId,
          medicationName,
          dose: String(dose),
          doseUnit,
          time: scheduledFor.toISOString(),
          screen: 'MedicationScreen'
        },
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
  }

  if (reminders.length === 0) return 0;

  const batch = db.batch();
  reminders.forEach((reminder) => {
    const docRef = db.collection('scheduled_med_notifications').doc();
    batch.set(docRef, {
      ...reminder,
      reminderId: docRef.id,
      data: {
        ...(reminder.data || {}),
        reminderId: docRef.id
      }
    });
  });
  await batch.commit();

  return reminders.length;
};

const createMedication = async (req, res) => {
  try {
    const userId = req.user.uid;
    const {
      childId,
      name,
      dose,
      doseUnit,
      times,
      startDate,
      endDate,
      notes,
      timezone,
      scheduleDays,
      repeatEveryHours,
      repeatEveryMinutes,
      startTime,
      endTime
    } = req.body;

    if (!childId || !name || dose === undefined || !doseUnit) {
      return res.status(400).json({
        success: false,
        message: 'childId, name, dose y doseUnit son requeridos'
      });
    }

    const childDoc = await db.collection('children').doc(childId).get();
    if (!childDoc.exists || childDoc.data().parentId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para este hijo'
      });
    }

    const intervalMinutes = repeatEveryMinutes !== undefined
      ? Math.round(parseFloat(repeatEveryMinutes))
      : (repeatEveryHours !== undefined ? Math.round(parseFloat(repeatEveryHours) * 60) : null);

    if (intervalMinutes) {
      if (!startTime || !endTime) {
        return res.status(400).json({
          success: false,
          message: 'startTime y endTime son requeridos para recordatorios periódicos'
        });
      }
      if (!parseTime(startTime) || !parseTime(endTime)) {
        return res.status(400).json({
          success: false,
          message: 'startTime y endTime deben tener formato HH:mm'
        });
      }
      if (intervalMinutes < 5) {
        return res.status(400).json({
          success: false,
          message: 'El intervalo mínimo es de 5 minutos'
        });
      }
      const dayTimes = buildTimesFromInterval(startTime, endTime, intervalMinutes);
      if (dayTimes.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Intervalo inválido: verifica startTime, endTime y repeatEveryMinutes'
        });
      }
      if (dayTimes.length > 200) {
        return res.status(400).json({
          success: false,
          message: 'Demasiadas tomas en un día. Ajusta el intervalo o la ventana.'
        });
      }
    } else {
      if (!Array.isArray(times) || times.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'times es requerido cuando no se usan recordatorios periódicos'
        });
      }
      const invalidTime = times.find((timeStr) => !parseTime(timeStr));
      if (invalidTime) {
        return res.status(400).json({
          success: false,
          message: `Formato de hora inválido: ${invalidTime}. Usa HH:mm`
        });
      }
    }

    const childData = childDoc.data();
    const userTimezone = timezone || childData.timezone || 'UTC';
    const childName = childData.name || 'tu bebé';

    const parsedScheduleDays = scheduleDays !== undefined ? parseInt(scheduleDays, 10) : 7;
    const safeScheduleDays = Number.isNaN(parsedScheduleDays)
      ? 7
      : Math.min(Math.max(parsedScheduleDays, 1), 60);

    const medicationData = {
      userId,
      childId,
      name: name.trim(),
      dose,
      doseUnit,
      times: Array.isArray(times) ? times : [],
      startDate: startDate || null,
      endDate: endDate || null,
      notes: notes || '',
      timezone: userTimezone,
      scheduleDays: safeScheduleDays,
      repeatEveryMinutes: intervalMinutes || null,
      startTime: startTime || null,
      endTime: endTime || null,
      active: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const medicationRef = await db.collection('medications').add(medicationData);

    const scheduledCount = await scheduleMedicationReminders({
      userId,
      childId,
      childName,
      medicationId: medicationRef.id,
      medicationName: medicationData.name,
      dose,
      doseUnit,
      times: medicationData.times,
      timezone: userTimezone,
      startDate,
      endDate,
      scheduleDays: safeScheduleDays,
      repeatEveryMinutes: intervalMinutes || null,
      startTime,
      endTime
    });

    res.status(201).json({
      success: true,
      message: 'Medicamento registrado',
      data: {
        id: medicationRef.id,
        ...medicationData,
        scheduledReminders: scheduledCount
      }
    });
  } catch (error) {
    console.error('❌ Error creando medicamento:', error);
    res.status(500).json({
      success: false,
      message: 'Error creando medicamento',
      error: error.message
    });
  }
};

const listMedications = async (req, res) => {
  try {
    const userId = req.user.uid;
    const { childId } = req.params;

    const snapshot = await db
      .collection('medications')
      .where('childId', '==', childId)
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();

    const medications = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json({
      success: true,
      data: medications
    });
  } catch (error) {
    console.error('❌ Error listando medicamentos:', error);
    res.status(500).json({
      success: false,
      message: 'Error listando medicamentos',
      error: error.message
    });
  }
};

const updateMedication = async (req, res) => {
  try {
    const userId = req.user.uid;
    const { medicationId } = req.params;
    const {
      name,
      dose,
      doseUnit,
      times,
      startDate,
      endDate,
      notes,
      active,
      timezone,
      scheduleDays,
      repeatEveryHours,
      repeatEveryMinutes,
      startTime,
      endTime
    } = req.body;

    const medDoc = await db.collection('medications').doc(medicationId).get();
    if (!medDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Medicamento no encontrado'
      });
    }

    const medData = medDoc.data();
    if (medData.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'No autorizado'
      });
    }

    const intervalMinutes = repeatEveryMinutes !== undefined
      ? Math.round(parseFloat(repeatEveryMinutes))
      : (repeatEveryHours !== undefined ? Math.round(parseFloat(repeatEveryHours) * 60) : null);

    if (intervalMinutes) {
      if (!startTime || !endTime) {
        return res.status(400).json({
          success: false,
          message: 'startTime y endTime son requeridos para recordatorios periódicos'
        });
      }
      if (!parseTime(startTime) || !parseTime(endTime)) {
        return res.status(400).json({
          success: false,
          message: 'startTime y endTime deben tener formato HH:mm'
        });
      }
      if (intervalMinutes < 5) {
        return res.status(400).json({
          success: false,
          message: 'El intervalo mínimo es de 5 minutos'
        });
      }
      const dayTimes = buildTimesFromInterval(startTime, endTime, intervalMinutes);
      if (dayTimes.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Intervalo inválido: verifica startTime, endTime y repeatEveryMinutes'
        });
      }
      if (dayTimes.length > 200) {
        return res.status(400).json({
          success: false,
          message: 'Demasiadas tomas en un día. Ajusta el intervalo o la ventana.'
        });
      }
    } else if (times) {
      const invalidTime = times.find((timeStr) => !parseTime(timeStr));
      if (invalidTime) {
        return res.status(400).json({
          success: false,
          message: `Formato de hora inválido: ${invalidTime}. Usa HH:mm`
        });
      }
    }

    const updateData = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    if (name !== undefined) updateData.name = name.trim();
    if (dose !== undefined) updateData.dose = dose;
    if (doseUnit !== undefined) updateData.doseUnit = doseUnit;
    if (times !== undefined) updateData.times = times;
    if (startDate !== undefined) updateData.startDate = startDate;
    if (endDate !== undefined) updateData.endDate = endDate;
    if (notes !== undefined) updateData.notes = notes;
    if (active !== undefined) updateData.active = active;
    if (timezone !== undefined) updateData.timezone = timezone;
    if (scheduleDays !== undefined) {
      const parsedScheduleDays = parseInt(scheduleDays, 10);
      if (!Number.isNaN(parsedScheduleDays)) {
        updateData.scheduleDays = Math.min(Math.max(parsedScheduleDays, 1), 60);
      }
    }
    if (repeatEveryMinutes !== undefined || repeatEveryHours !== undefined) {
      updateData.repeatEveryMinutes = intervalMinutes || null;
    }
    if (startTime !== undefined) updateData.startTime = startTime;
    if (endTime !== undefined) updateData.endTime = endTime;

    await db.collection('medications').doc(medicationId).update(updateData);

    const childDoc = await db.collection('children').doc(medData.childId).get();
    const childData = childDoc.exists ? childDoc.data() : {};
    const childName = childData.name || 'tu bebé';
    const userTimezone = updateData.timezone || medData.timezone || childData.timezone || 'UTC';

    await clearMedicationReminders(medicationId);

    let scheduledCount = 0;
    const finalActive = active !== undefined ? active : medData.active;
    if (finalActive) {
      scheduledCount = await scheduleMedicationReminders({
        userId,
        childId: medData.childId,
        childName,
        medicationId,
        medicationName: updateData.name || medData.name,
        dose: updateData.dose !== undefined ? updateData.dose : medData.dose,
        doseUnit: updateData.doseUnit || medData.doseUnit,
        times: updateData.times || medData.times,
        timezone: userTimezone,
        startDate: updateData.startDate || medData.startDate,
        endDate: updateData.endDate || medData.endDate,
        scheduleDays: updateData.scheduleDays || medData.scheduleDays || 7,
        repeatEveryMinutes: updateData.repeatEveryMinutes !== undefined
          ? updateData.repeatEveryMinutes
          : (medData.repeatEveryMinutes || null),
        startTime: updateData.startTime || medData.startTime,
        endTime: updateData.endTime || medData.endTime
      });
    }

    res.json({
      success: true,
      message: 'Medicamento actualizado',
      data: {
        id: medicationId,
        scheduledReminders: scheduledCount
      }
    });
  } catch (error) {
    console.error('❌ Error actualizando medicamento:', error);
    res.status(500).json({
      success: false,
      message: 'Error actualizando medicamento',
      error: error.message
    });
  }
};

const deleteMedication = async (req, res) => {
  try {
    const userId = req.user.uid;
    const { medicationId } = req.params;

    const medDoc = await db.collection('medications').doc(medicationId).get();
    if (!medDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Medicamento no encontrado'
      });
    }

    const medData = medDoc.data();
    if (medData.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'No autorizado'
      });
    }

    await clearMedicationReminders(medicationId);
    await db.collection('medications').doc(medicationId).delete();

    // Limpieza de recordatorios huérfanos para este usuario/hijo
    const medsSnapshot = await db
      .collection('medications')
      .where('userId', '==', userId)
      .where('childId', '==', medData.childId)
      .get();
    const validIds = new Set(medsSnapshot.docs.map(doc => doc.id));
    const deletedOrphans = await cleanupOrphanReminders(userId, medData.childId, validIds);

    res.json({
      success: true,
      message: 'Medicamento eliminado',
      deletedOrphanReminders: deletedOrphans
    });
  } catch (error) {
    console.error('❌ Error eliminando medicamento:', error);
    res.status(500).json({
      success: false,
      message: 'Error eliminando medicamento',
      error: error.message
    });
  }
};

const deleteFollowupReminders = async (reminderId) => {
  const snapshot = await db
    .collection('scheduled_med_notifications')
    .where('followupForReminderId', '==', reminderId)
    .limit(200)
    .get();

  if (snapshot.empty) return 0;

  const batch = db.batch();
  snapshot.docs.forEach(doc => batch.delete(doc.ref));
  await batch.commit();
  return snapshot.size;
};

const fetchReminderFromNotifications = async (reminderId, userId) => {
  const candidates = ['data.reminderId', 'data.originalReminderId'];
  for (const field of candidates) {
    const snapshot = await db
      .collection('notifications')
      .where(field, '==', reminderId)
      .limit(5)
      .get();

    if (snapshot.empty) continue;

    const match = snapshot.docs
      .map(doc => doc.data())
      .find(doc => doc.userId === userId && (doc.type || '').includes('medication'));

    if (match) {
      const data = match.data || {};
      return {
        userId: match.userId,
        childId: match.childId || data.childId || null,
        childName: data.childName || match.childName || null,
        medicationId: data.medicationId || null,
        medicationName: data.medicationName || null,
        dose: data.dose || null,
        doseUnit: data.doseUnit || null,
        type: data.type || match.type || 'medication_reminder',
        reminderId: data.reminderId || reminderId
      };
    }
  }

  return null;
};

const markMedicationTaken = async (req, res) => {
  try {
    const userId = req.user.uid;
    const { reminderId } = req.params;
    const { taken, status: rawStatus, note } = req.body || {};

    const reminderDoc = await db.collection('scheduled_med_notifications').doc(reminderId).get();
    let reminder = null;

    if (reminderDoc.exists) {
      reminder = reminderDoc.data();
      if (reminder.userId !== userId) {
        return res.status(403).json({
          success: false,
          message: 'No autorizado'
        });
      }
    } else {
      const historySnapshot = await db
        .collection('medication_reminders_history')
        .where('reminderId', '==', reminderId)
        .limit(1)
        .get();

      if (!historySnapshot.empty) {
        const history = historySnapshot.docs[0].data();
        if (history.userId !== userId) {
          return res.status(403).json({
            success: false,
            message: 'No autorizado'
          });
        }
        return res.json({
          success: true,
          message: 'Recordatorio ya registrado',
          status: history.status || 'taken'
        });
      }

      reminder = await fetchReminderFromNotifications(reminderId, userId);
      if (!reminder) {
        return res.status(404).json({
          success: false,
          message: 'Recordatorio no encontrado'
        });
      }
    }

    const normalizedStatus = rawStatus ? String(rawStatus).trim().toLowerCase() : null;
    let finalStatus = 'taken';
    if (normalizedStatus) {
      if (!['taken', 'missed', 'skipped'].includes(normalizedStatus)) {
        return res.status(400).json({
          success: false,
          message: 'status invalido. Usa taken, missed o skipped'
        });
      }
      finalStatus = normalizedStatus;
    } else if (taken === false) {
      finalStatus = 'missed';
    }

    const now = admin.firestore.FieldValue.serverTimestamp();
    const historyData = {
      ...reminder,
      status: finalStatus,
      respondedAt: now
    };
    if (finalStatus === 'taken') {
      historyData.takenAt = now;
    }
    if (note) {
      historyData.note = String(note).trim();
    }

    await db.collection('medication_reminders_history').add(historyData);

    if (reminderDoc.exists) {
      await reminderDoc.ref.delete();
    }
    await deleteFollowupReminders(reminderId);

    if (finalStatus !== 'taken') {
      const tokens = await getUserFCMTokens(userId);
      if (tokens.length > 0) {
        const safeMedicationName = reminder.medicationName || 'el medicamento';
        const safeDose = reminder.dose || '';
        const safeDoseUnit = reminder.doseUnit || '';
        const doseLabel = safeDose ? `${safeDose} ${safeDoseUnit}`.trim() : '';
        const title = `⏰ Recuerda el medicamento`;
        const body = reminder.childName
          ? `Recuerda darle ${safeMedicationName}${doseLabel ? `: ${doseLabel}` : ''} a ${reminder.childName}.`
          : `Recuerda darle ${safeMedicationName}${doseLabel ? `: ${doseLabel}` : ''}.`;
        await sendPushToTokens({
          tokens,
          notification: { title, body },
          data: toStringMap({
            type: 'medication_reminder_followup',
            childId: reminder.childId,
            medicationId: reminder.medicationId,
            medicationName: reminder.medicationName,
            dose: reminder.dose ? String(reminder.dose) : undefined,
            doseUnit: reminder.doseUnit,
            reminderId,
            screen: 'MedicationScreen'
          }),
          android: {
            priority: 'high',
            notification: {
              sound: 'default',
              channelId: 'default'
            }
          },
          apns: {
            headers: {
              'apns-priority': '10'
            },
            payload: {
              aps: {
                sound: 'default',
                'content-available': 1
              }
            }
          }
        });

        await db.collection('notifications').add({
          userId,
          childId: reminder.childId,
          type: 'medication_reminder_followup',
          title,
          body,
          data: {
            childId: reminder.childId,
            medicationId: reminder.medicationId,
            medicationName: reminder.medicationName,
            dose: String(reminder.dose),
            doseUnit: reminder.doseUnit,
            reminderId,
            screen: 'MedicationScreen'
          },
          read: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }
    }

    res.json({
      success: true,
      message: finalStatus === 'taken' ? 'Medicamento marcado como tomado' : 'Medicamento marcado como no tomado',
      status: finalStatus
    });
  } catch (error) {
    console.error('❌ Error marcando medicamento tomado:', error);
    res.status(500).json({
      success: false,
      message: 'Error marcando medicamento tomado',
      error: error.message
    });
  }
};

module.exports = {
  createMedication,
  listMedications,
  updateMedication,
  deleteMedication,
  markMedicationTaken
};
