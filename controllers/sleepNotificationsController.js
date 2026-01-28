const admin = require('firebase-admin');
const { differenceInMinutes, addMinutes, format } = require('date-fns');
const TimezoneHelper = require('../utils/timezoneHelper');

const db = admin.firestore();

/**
 * 🔔 SISTEMA DE NOTIFICACIONES INTELIGENTES DE SUEÑO
 * 
 * Tipos de notificaciones:
 * 1. ⏰ 30min antes de siesta - "Prepara al bebé para la siesta"
 * 2. 💤 Hora de siesta - "Es hora de dormir al bebé"
 * 3. ⚠️ 30min tarde - "No has registrado la siesta"
 * 4. 🚨 Siesta larga (4h+) - "Siesta muy larga, considera despertar"
 */

// =====================================================
// 🎯 1. NOTIFICACIÓN: 30 MINUTOS ANTES DE SIESTA
// =====================================================
const schedulePreNapNotifications = async (req, res) => {
  try {
    const { childId } = req.params;
    const userId = req.user.uid;

    console.log(`[PRE-NAP NOTIFICATIONS] Configurando para child: ${childId}`);

    // Obtener información del niño
    const childDoc = await db.collection('children').doc(childId).get();
    if (!childDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Niño no encontrado'
      });
    }

    const childData = childDoc.data();
    const childName = childData.name || 'tu bebé';
    const userTimezone = childData.timezone || 'UTC';

    // Obtener predicciones del día
    const todayInfo = TimezoneHelper.getTodayInUserTimezone(userTimezone);
    const todayStr = format(todayInfo.userLocalTime, 'yyyy-MM-dd');

    const predictionsDoc = await db
      .collection('sleepPredictions')
      .doc(`${childId}_${todayStr}`)
      .get();

    // Verificar que existen predicciones válidas
    if (!predictionsDoc.exists || !predictionsDoc.data().predictedNaps || predictionsDoc.data().predictedNaps.length === 0) {
      console.log(`⚠️ [PRE-NAP] No hay predicciones para ${todayStr}`);
      
      return res.status(200).json({
        success: false,
        message: 'No hay predicciones para hoy',
        suggestion: 'Obtén las predicciones primero llamando a /api/sleep/predict/:childId',
        info: {
          childId,
          date: todayStr,
          timezone: userTimezone
        }
      });
    }

    const predictions = predictionsDoc.data();
    const predictedNaps = predictions.predictedNaps || [];

    // Crear notificaciones para cada siesta
    const notifications = [];
    const now = new Date();

    for (const nap of predictedNaps) {
      const napTime = new Date(nap.time);
      const notifyTime = addMinutes(napTime, -30); // 30 minutos antes

      // Solo programar si la notificación es futura
      if (notifyTime > now) {
        const napTimeLocal = TimezoneHelper.formatInUserTimezone(napTime, userTimezone, 'h:mm a');
        const wakeWindow = nap.wakeWindow || 'pronto';

        notifications.push({
          userId,
          childId,
          childName,
          type: 'pre_nap_reminder',
          napNumber: nap.napNumber,
          title: `⏰ ${childName} dormirá en 30 minutos`,
          body: `Siesta #${nap.napNumber} a las ${napTimeLocal}. ${wakeWindow} despierto.`,
          scheduledFor: notifyTime,
          napTime: napTime,
          data: {
            type: 'pre_nap_reminder',
            childId,
            napNumber: nap.napNumber,
            napTime: napTime.toISOString(),
            screen: 'SleepScreen'
          },
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }
    }

    // Guardar en Firestore
    const batch = db.batch();
    notifications.forEach(notif => {
      const docRef = db.collection('scheduled_sleep_notifications').doc();
      batch.set(docRef, notif);
    });
    await batch.commit();

    console.log(`[PRE-NAP] ${notifications.length} notificaciones programadas`);

    res.status(200).json({
      success: true,
      message: `${notifications.length} recordatorios programados`,
      notifications: notifications.map(n => ({
        napNumber: n.napNumber,
        scheduledFor: n.scheduledFor,
        title: n.title
      }))
    });

  } catch (error) {
    console.error('[PRE-NAP ERROR]', error);
    res.status(500).json({
      success: false,
      error: 'Error programando recordatorios',
      details: error.message
    });
  }
};

// =====================================================
// 💤 2. NOTIFICACIÓN: HORA DE DORMIR
// =====================================================
const scheduleNapTimeNotifications = async (req, res) => {
  try {
    const { childId } = req.params;
    const userId = req.user.uid;

    console.log(`[NAP-TIME NOTIFICATIONS] Configurando para child: ${childId}`);

    const childDoc = await db.collection('children').doc(childId).get();
    if (!childDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Niño no encontrado'
      });
    }

    const childData = childDoc.data();
    const childName = childData.name || 'tu bebé';
    const userTimezone = childData.timezone || 'UTC';

    const todayInfo = TimezoneHelper.getTodayInUserTimezone(userTimezone);
    const todayStr = format(todayInfo.userLocalTime, 'yyyy-MM-dd');

    const predictionsDoc = await db
      .collection('sleepPredictions')
      .doc(`${childId}_${todayStr}`)
      .get();

    // Verificar que existen predicciones válidas
    if (!predictionsDoc.exists || !predictionsDoc.data().predictedNaps || predictionsDoc.data().predictedNaps.length === 0) {
      console.log(`⚠️ [NAP-TIME] No hay predicciones para ${todayStr}`);
      
      return res.status(200).json({
        success: false,
        message: 'No hay predicciones para hoy',
        suggestion: 'Obtén las predicciones primero llamando a /api/sleep/predict/:childId',
        info: {
          childId,
          date: todayStr,
          timezone: userTimezone
        }
      });
    }

    const predictions = predictionsDoc.data();
    const predictedNaps = predictions.predictedNaps || [];
    const bedtime = predictions.predictedBedtime;

    const notifications = [];
    const now = new Date();

    // Notificaciones para siestas
    for (const nap of predictedNaps) {
      const napTime = new Date(nap.time);
      
      if (napTime > now) {
        const napTimeLocal = TimezoneHelper.formatInUserTimezone(napTime, userTimezone, 'h:mm a');
        const reason = nap.aiReason || `Siesta #${nap.napNumber}`;

        notifications.push({
          userId,
          childId,
          childName,
          type: 'nap_time',
          napNumber: nap.napNumber,
          title: `💤 Es hora de dormir a ${childName}`,
          body: `${reason}. Duración esperada: ${nap.expectedDuration}min.`,
          scheduledFor: napTime,
          data: {
            type: 'nap_time',
            childId,
            napNumber: nap.napNumber,
            napTime: napTime.toISOString(),
            expectedDuration: nap.expectedDuration,
            screen: 'SleepScreen'
          },
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }
    }

    // Notificación para hora de dormir (bedtime)
    if (bedtime && bedtime.time) {
      const bedtimeDate = new Date(bedtime.time);
      
      if (bedtimeDate > now) {
        const bedtimeLocal = TimezoneHelper.formatInUserTimezone(bedtimeDate, userTimezone, 'h:mm a');
        const reason = bedtime.aiReason || 'Hora de dormir';

        notifications.push({
          userId,
          childId,
          childName,
          type: 'bedtime',
          title: `🌙 Hora de dormir para ${childName}`,
          body: `${reason}. Hora recomendada: ${bedtimeLocal}.`,
          scheduledFor: bedtimeDate,
          data: {
            type: 'bedtime',
            childId,
            bedtime: bedtimeDate.toISOString(),
            screen: 'SleepScreen'
          },
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }
    }

    // Guardar en Firestore
    const batch = db.batch();
    notifications.forEach(notif => {
      const docRef = db.collection('scheduled_sleep_notifications').doc();
      batch.set(docRef, notif);
    });
    await batch.commit();

    console.log(`[NAP-TIME] ${notifications.length} notificaciones programadas`);

    res.status(200).json({
      success: true,
      message: `${notifications.length} notificaciones de hora de dormir programadas`,
      notifications: notifications.map(n => ({
        type: n.type,
        napNumber: n.napNumber,
        scheduledFor: n.scheduledFor,
        title: n.title
      }))
    });

  } catch (error) {
    console.error('[NAP-TIME ERROR]', error);
    res.status(500).json({
      success: false,
      error: 'Error programando notificaciones',
      details: error.message
    });
  }
};

// =====================================================
// ⚠️ 3. NOTIFICACIÓN: 30 MIN TARDE SIN REGISTRO
// =====================================================
const checkLateNapRegistration = async (req, res) => {
  try {
    const { childId } = req.params;
    const userId = req.user.uid;

    console.log(`[LATE NAP CHECK] Verificando para child: ${childId}`);

    const childDoc = await db.collection('children').doc(childId).get();
    if (!childDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Niño no encontrado'
      });
    }

    const childData = childDoc.data();
    const childName = childData.name || 'tu bebé';
    const userTimezone = childData.timezone || 'UTC';

    const todayInfo = TimezoneHelper.getTodayInUserTimezone(userTimezone);
    const todayStr = format(todayInfo.userLocalTime, 'yyyy-MM-dd');

    // Obtener predicciones
    const predictionsDoc = await db
      .collection('sleepPredictions')
      .doc(`${childId}_${todayStr}`)
      .get();

    if (!predictionsDoc.exists || !predictionsDoc.data().predictedNaps) {
      console.log(`⚠️ [LATE NAP CHECK] No hay predicciones para ${todayStr}`);
      
      return res.status(200).json({
        success: true,
        message: 'No hay predicciones para verificar',
        lateNaps: []
      });
    }

    const predictions = predictionsDoc.data();
    const predictedNaps = predictions.predictedNaps || [];
    const now = new Date();

    const lateNaps = [];

    // Verificar cada siesta predicha
    for (const nap of predictedNaps) {
      const napTime = new Date(nap.time);
      const minutesLate = differenceInMinutes(now, napTime);

      // Si han pasado más de 30 minutos desde la hora predicha
      if (minutesLate >= 30 && minutesLate <= 120) { // Máximo 2 horas
        // Verificar si ya fue registrada
        const sleepDoc = await db
          .collection('sleepEvents')
          .where('childId', '==', childId)
          .where('startTime', '>=', napTime)
          .where('startTime', '<=', addMinutes(napTime, 60))
          .limit(1)
          .get();

        if (sleepDoc.empty) {
          // No se registró la siesta
          const napTimeLocal = TimezoneHelper.formatInUserTimezone(napTime, userTimezone, 'h:mm a');
          
          lateNaps.push({
            napNumber: nap.napNumber,
            expectedTime: napTime,
            minutesLate,
            notification: {
              userId,
              childId,
              childName,
              type: 'late_nap_registration',
              napNumber: nap.napNumber,
              title: `⚠️ ¿Olvidaste registrar la siesta de ${childName}?`,
              body: `La siesta #${nap.napNumber} estaba programada para las ${napTimeLocal}. ${minutesLate}min de retraso.`,
              data: {
                type: 'late_nap_registration',
                childId,
                napNumber: nap.napNumber,
                expectedTime: napTime.toISOString(),
                minutesLate,
                screen: 'SleepScreen'
              },
              createdAt: admin.firestore.FieldValue.serverTimestamp()
            }
          });
        }
      }
    }

    // Enviar notificaciones de siestas tarde
    if (lateNaps.length > 0) {
      const tokens = await getUserFCMTokens(userId);
      
      if (tokens.length > 0) {
        for (const late of lateNaps) {
          const notif = late.notification;
          
          // Enviar push notification
          await sendMulticastSafe({
            tokens,
            notification: {
              title: notif.title,
              body: notif.body
            },
            data: toStringMap({
              ...notif.data,
              childId: notif.data.childId,
              type: notif.data.type,
              screen: notif.data.screen
            })
          });

          // Guardar en historial
          await db.collection('notifications').add(notif);
        }
      }
    }

    res.status(200).json({
      success: true,
      message: lateNaps.length > 0 
        ? `${lateNaps.length} notificaciones de siesta tarde enviadas`
        : 'Todas las siestas al día',
      lateNaps: lateNaps.map(l => ({
        napNumber: l.napNumber,
        minutesLate: l.minutesLate,
        expectedTime: l.expectedTime
      }))
    });

  } catch (error) {
    console.error('[LATE NAP ERROR]', error);
    res.status(500).json({
      success: false,
      error: 'Error verificando siestas tarde',
      details: error.message
    });
  }
};

// =====================================================
// 🚨 4. NOTIFICACIÓN: SIESTA LARGA (4+ HORAS)
// =====================================================
const checkLongNaps = async (req, res) => {
  try {
    const { childId } = req.params;
    const userId = req.user.uid;

    console.log(`[LONG NAP CHECK] Verificando para child: ${childId}`);

    const childDoc = await db.collection('children').doc(childId).get();
    if (!childDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Niño no encontrado'
      });
    }

    const childData = childDoc.data();
    const childName = childData.name || 'tu bebé';
    const userTimezone = childData.timezone || 'UTC';

    const now = new Date();

    // Buscar siestas activas (sin endTime)
    const activeSleepsSnapshot = await db
      .collection('sleepEvents')
      .where('childId', '==', childId)
      .where('endTime', '==', null)
      .orderBy('startTime', 'desc')
      .limit(5)
      .get();

    const longNaps = [];

    activeSleepsSnapshot.forEach(doc => {
      const sleep = doc.data();
      const startTime = sleep.startTime.toDate();
      const durationMinutes = differenceInMinutes(now, startTime);
      const durationHours = (durationMinutes / 60).toFixed(1);

      // Si la siesta dura más de 4 horas
      if (durationMinutes >= 240) { // 4 horas = 240 minutos
        const startTimeLocal = TimezoneHelper.formatInUserTimezone(startTime, userTimezone, 'h:mm a');
        
        longNaps.push({
          sleepId: doc.id,
          startTime,
          durationMinutes,
          durationHours,
          notification: {
            userId,
            childId,
            childName,
            type: 'long_nap_alert',
            sleepId: doc.id,
            title: `🚨 ${childName} lleva ${durationHours}h durmiendo`,
            body: `Siesta muy larga desde las ${startTimeLocal}. ¿Quizás es hora de despertar?`,
            data: {
              type: 'long_nap_alert',
              childId,
              sleepId: doc.id,
              startTime: startTime.toISOString(),
              durationMinutes,
              durationHours,
              screen: 'SleepScreen'
            },
            createdAt: admin.firestore.FieldValue.serverTimestamp()
          }
        });
      }
    });

    // Enviar notificaciones de siestas largas
    if (longNaps.length > 0) {
      const tokens = await getUserFCMTokens(userId);
      
      if (tokens.length > 0) {
        for (const longNap of longNaps) {
          const notif = longNap.notification;
          
          // Verificar que no hayamos enviado notificación reciente
          const recentNotif = await db
            .collection('notifications')
            .where('userId', '==', userId)
            .where('type', '==', 'long_nap_alert')
            .where('data.sleepId', '==', longNap.sleepId)
            .where('createdAt', '>=', addMinutes(now, -60)) // Últimos 60 min
            .limit(1)
            .get();

          if (recentNotif.empty) {
            // Enviar push notification
            await sendMulticastSafe({
              tokens,
              notification: {
                title: notif.title,
                body: notif.body
              },
              data: toStringMap({
                ...notif.data,
                childId: notif.data.childId,
                type: notif.data.type,
                screen: notif.data.screen
              }),
              android: {
                priority: 'high',
                notification: {
                  sound: 'default',
                  priority: 'high'
                }
              },
              apns: {
                payload: {
                  aps: {
                    sound: 'default',
                    badge: 1
                  }
                }
              }
            });

            // Guardar en historial
            await db.collection('notifications').add(notif);
          }
        }
      }
    }

    res.status(200).json({
      success: true,
      message: longNaps.length > 0 
        ? `${longNaps.length} notificaciones de siesta larga enviadas`
        : 'No hay siestas largas activas',
      longNaps: longNaps.map(l => ({
        sleepId: l.sleepId,
        durationHours: l.durationHours,
        startTime: l.startTime
      }))
    });

  } catch (error) {
    console.error('[LONG NAP ERROR]', error);
    res.status(500).json({
      success: false,
      error: 'Error verificando siestas largas',
      details: error.message
    });
  }
};

// =====================================================
// 🔧 UTILIDADES
// =====================================================

/**
 * Convertir data a string map para FCM
 */
const toStringMap = (data = {}) => {
  return Object.fromEntries(
    Object.entries(data)
      .filter(([, value]) => value !== undefined && value !== null)
      .map(([key, value]) => {
        if (typeof value === 'string') return [key, value];
        if (value instanceof Date) return [key, value.toISOString()];
        if (typeof value === 'object') return [key, JSON.stringify(value)];
        return [key, String(value)];
      })
  );
};

/**
 * Enviar multicast con fallback si falla el endpoint /batch
 */
let multicastBatchUnavailable = false;
let multicastBatchDisabledUntil = 0;
const sendMulticastSafe = async (message) => {
  try {
    const now = Date.now();
    if (multicastBatchUnavailable && now < multicastBatchDisabledUntil) {
      return await sendPerToken(message);
    }
    return await admin.messaging().sendMulticast(message);
  } catch (error) {
    const msg = error?.message || '';
    const isBatch404 = msg.includes('/batch') && msg.includes('404');
    if (!isBatch404) {
      throw error;
    }

    multicastBatchUnavailable = true;
    multicastBatchDisabledUntil = Date.now() + (6 * 60 * 60 * 1000); // 6 horas
    console.warn('⚠️ [FCM] sendMulticast falló con /batch 404. Usando send() por token.');
    return await sendPerToken(message);
  }
};

/**
 * Enviar notificaciones a través de Expo Push Notification Service
 */
const sendExpoNotifications = async (tokens, notification, data) => {
  try {
    const messages = tokens.map(token => ({
      to: token,
      sound: 'default',
      title: notification.title || 'Munpa',
      body: notification.body || '',
      data: {
        ...data,
        timestamp: new Date().toISOString()
      },
      badge: 1,
      priority: 'high'
    }));

    const chunks = [];
    for (let i = 0; i < messages.length; i += 100) {
      chunks.push(messages.slice(i, i + 100));
    }

    let successCount = 0;
    let failureCount = 0;
    const failedTokens = [];

    for (const chunk of chunks) {
      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(chunk)
      });

      const result = await response.json();
      if (result.data) {
        result.data.forEach((item, index) => {
          if (item.status === 'ok') {
            successCount++;
          } else {
            failureCount++;
            failedTokens.push(chunk[index].to);
          }
        });
      } else {
        failureCount += chunk.length;
        failedTokens.push(...chunk.map(msg => msg.to));
      }
    }

    return { successCount, failureCount, failedTokens };
  } catch (error) {
    console.error('❌ [EXPO] Error enviando notificaciones Expo:', error);
    return { successCount: 0, failureCount: tokens.length, failedTokens: tokens };
  }
};

/**
 * Enviar notificaciones combinadas (Expo + FCM)
 */
const sendPushToTokens = async ({ tokens, notification, data, android, apns }) => {
  const expoTokens = (tokens || []).filter(token => token.startsWith('ExponentPushToken['));
  const fcmTokens = (tokens || []).filter(token => !token.startsWith('ExponentPushToken['));

  let successCount = 0;
  let failureCount = 0;

  if (expoTokens.length > 0) {
    const expoResult = await sendExpoNotifications(expoTokens, notification, data);
    successCount += expoResult.successCount;
    failureCount += expoResult.failureCount;
  }

  if (fcmTokens.length > 0) {
    const fcmResult = await sendMulticastSafe({
      tokens: fcmTokens,
      notification,
      data,
      android,
      apns
    });
    successCount += fcmResult.successCount || 0;
    failureCount += fcmResult.failureCount || 0;
  }

  return { successCount, failureCount };
};

const sendPerToken = async (message) => {
  let successCount = 0;
  let failureCount = 0;
  const errors = [];

  for (const token of message.tokens || []) {
    try {
      await admin.messaging().send({
        token,
        notification: message.notification,
        data: message.data,
        android: message.android,
        apns: message.apns
      });
      successCount++;
    } catch (err) {
      failureCount++;
      errors.push(err?.message || String(err));
    }
  }

  return { successCount, failureCount, errors };
};

/**
 * Obtener tokens FCM del usuario
 */
const getUserFCMTokens = async (userId) => {
  try {
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) return [];
    
    const userData = userDoc.data();
    return userData.fcmTokens || [];
  } catch (error) {
    console.error('[GET TOKENS ERROR]', error);
    return [];
  }
};

/**
 * Enviar notificación push inmediata
 */
const sendSleepNotification = async (req, res) => {
  try {
    const { userId, childId, title, body, type, data } = req.body;

    if (!userId || !title || !body) {
      return res.status(400).json({
        success: false,
        error: 'userId, title y body son requeridos'
      });
    }

    const tokens = await getUserFCMTokens(userId);
    
    if (tokens.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no tiene tokens FCM registrados'
      });
    }

    // Enviar notificación
    const response = await sendPushToTokens({
      tokens,
      notification: {
        title,
        body
      },
      data: toStringMap({
        type: type || 'sleep_notification',
        childId: childId || '',
        screen: 'SleepScreen',
        ...(data || {})
      })
    });

    // Guardar en historial
    await db.collection('notifications').add({
      userId,
      childId: childId || null,
      type: type || 'sleep_notification',
      title,
      body,
      data: data || {},
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log(`[SEND NOTIFICATION] Enviada a ${tokens.length} dispositivos`);

    res.status(200).json({
      success: true,
      message: 'Notificación enviada',
      result: {
        successCount: response.successCount,
        failureCount: response.failureCount
      }
    });

  } catch (error) {
    console.error('[SEND NOTIFICATION ERROR]', error);
    res.status(500).json({
      success: false,
      error: 'Error enviando notificación',
      details: error.message
    });
  }
};

/**
 * Procesar todas las notificaciones pendientes (para cron job)
 */
const processScheduledCollection = async (collectionName) => {
  const now = new Date();
  const fiveMinutesAgo = addMinutes(now, -5);

  const pendingSnapshot = await db
    .collection(collectionName)
    .where('scheduledFor', '<=', now)
    .where('scheduledFor', '>=', fiveMinutesAgo)
    .limit(100)
    .get();

  let sentCount = 0;
  let errorCount = 0;

  const scheduleMedicationFollowup = async (notif, originalDocId) => {
    if (!notif || notif.type !== 'medication_reminder') return;
    const followUpMinutes = Number.isFinite(notif.followUpMinutes) ? notif.followUpMinutes : 120;
    if (!followUpMinutes || followUpMinutes <= 0) return;

    const scheduledForDate = notif.scheduledFor?.toDate
      ? notif.scheduledFor.toDate()
      : new Date(notif.scheduledFor);
    if (Number.isNaN(scheduledForDate.getTime())) return;

    const followupAt = addMinutes(scheduledForDate, followUpMinutes);
    if (followupAt <= now) return;

    const title = '⏰ Recuerda el medicamento';
    const body = `Recuerda darle ${notif.medicationName}: ${notif.dose} ${notif.doseUnit} a ${notif.childName}.`;

    const followupRef = db.collection('scheduled_med_notifications').doc();
    await followupRef.set({
      userId: notif.userId,
      childId: notif.childId,
      childName: notif.childName,
      medicationId: notif.medicationId,
      medicationName: notif.medicationName,
      dose: notif.dose,
      doseUnit: notif.doseUnit,
      type: 'medication_reminder_followup',
      title,
      body,
      scheduledFor: followupAt,
      followupForReminderId: notif.reminderId || originalDocId,
      data: {
        type: 'medication_reminder_followup',
        childId: notif.childId,
        medicationId: notif.medicationId,
        medicationName: notif.medicationName,
        dose: String(notif.dose),
        doseUnit: notif.doseUnit,
        time: followupAt.toISOString(),
        reminderId: followupRef.id,
        originalReminderId: notif.reminderId || originalDocId,
        screen: 'MedicationScreen'
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
  };

  for (const doc of pendingSnapshot.docs) {
    try {
      const notif = doc.data();
      const tokens = await getUserFCMTokens(notif.userId);

      if (tokens.length > 0) {
        await sendPushToTokens({
          tokens,
          notification: {
            title: notif.title,
            body: notif.body
          },
          data: toStringMap(notif.data || {}),
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
          userId: notif.userId,
          childId: notif.childId,
          type: notif.type,
          title: notif.title,
          body: notif.body,
          data: notif.data,
          read: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        sentCount++;

        if (collectionName === 'scheduled_med_notifications') {
          await scheduleMedicationFollowup(notif, doc.id);
        }
      }

      await doc.ref.delete();
    } catch (error) {
      console.error(`[CRON ERROR] ${collectionName} doc ${doc.id}:`, error);
      errorCount++;
    }
  }

  return { sentCount, errorCount };
};

const processScheduledNotifications = async (req, res) => {
  try {
    console.log('[CRON] Procesando notificaciones programadas...');

    const sleepResult = await processScheduledCollection('scheduled_sleep_notifications');
    const medResult = await processScheduledCollection('scheduled_med_notifications');

    const sentCount = sleepResult.sentCount + medResult.sentCount;
    const errorCount = sleepResult.errorCount + medResult.errorCount;

    console.log(`[CRON] Procesadas: ${sentCount} enviadas, ${errorCount} errores`);

    res.status(200).json({
      success: true,
      message: `${sentCount} notificaciones enviadas`,
      stats: {
        sent: sentCount,
        errors: errorCount
      }
    });

  } catch (error) {
    console.error('[CRON ERROR]', error);
    res.status(500).json({
      success: false,
      error: 'Error procesando notificaciones',
      details: error.message
    });
  }
};

module.exports = {
  schedulePreNapNotifications,
  scheduleNapTimeNotifications,
  checkLateNapRegistration,
  checkLongNaps,
  sendSleepNotification,
  processScheduledNotifications,
  getUserFCMTokens,
  sendPushToTokens,
  toStringMap
};
