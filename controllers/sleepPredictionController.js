/**
 * ================================================
 * 🛌 SISTEMA DE PREDICCIÓN DE SUEÑO INTELIGENTE
 * ================================================
 * Sistema avanzado de predicción de patrones de sueño infantil
 * Similar a Napper - Predice siestas y hora de dormir
 * Usa análisis estadístico y patrones temporales
 */

const admin = require('firebase-admin');
const stats = require('simple-statistics');
const { 
  parseISO, 
  differenceInMinutes, 
  differenceInHours,
  addMinutes, 
  addDays,
  format,
  startOfDay,
  isToday,
  subDays
} = require('date-fns');

class SleepPredictionController {
  constructor() {
    this.db = admin.firestore();
  }

  /**
   * Registrar un nuevo evento de sueño
   * POST /api/sleep/record
   */
  async recordSleepEvent(req, res) {
    try {
      const userId = req.user.uid;
      const {
        childId,
        type, // 'nap' o 'nightsleep'
        startTime,
        endTime,
        duration, // en minutos
        quality, // 'poor', 'fair', 'good', 'excellent'
        wakeUps,
        notes,
        location, // 'crib', 'stroller', 'car', 'carrier'
        temperature,
        noiseLevel
      } = req.body;

      // Validaciones
      if (!childId || !type || !startTime) {
        return res.status(400).json({
          error: 'Faltan campos requeridos: childId, type, startTime'
        });
      }

      // Calcular duración
      let calculatedDuration = duration;
      let grossDuration = null;
      let netDuration = null;
      
      if (endTime && !duration) {
        const start = parseISO(startTime);
        const end = parseISO(endTime);
        grossDuration = differenceInMinutes(end, start); // Duración bruta (total)
        
        // Si hay pausas, calcular duración neta
        const pauses = req.body.pauses || [];
        const totalPauseTime = pauses.reduce((sum, pause) => sum + (pause.duration || 0), 0);
        netDuration = grossDuration - totalPauseTime;
        calculatedDuration = netDuration;
      }

      // Crear registro de sueño
      const sleepEvent = {
        userId,
        childId,
        type,
        startTime: admin.firestore.Timestamp.fromDate(parseISO(startTime)),
        endTime: endTime ? admin.firestore.Timestamp.fromDate(parseISO(endTime)) : null,
        duration: calculatedDuration || null,
        grossDuration: grossDuration || null, // Duración total (con pausas)
        netDuration: netDuration || calculatedDuration || null, // Duración efectiva (sin pausas)
        quality: quality || 'fair',
        wakeUps: wakeUps || 0,
        notes: notes || '',
        location: location || 'crib',
        temperature: temperature || null,
        noiseLevel: noiseLevel || 0.5,
        pauses: req.body.pauses || [], // Array de pausas
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      // Guardar en Firestore
      const docRef = await this.db.collection('sleepEvents').add(sleepEvent);

      // Actualizar estadísticas del niño
      await this.updateChildSleepStats(userId, childId);

      res.status(201).json({
        success: true,
        message: 'Evento de sueño registrado exitosamente',
        sleepEventId: docRef.id,
        sleepEvent: {
          id: docRef.id,
          ...sleepEvent,
          startTime: startTime,
          endTime: endTime
        }
      });

    } catch (error) {
      console.error('❌ Error al registrar evento de sueño:', error);
      res.status(500).json({
        error: 'Error al registrar evento de sueño',
        details: error.message
      });
    }
  }

  /**
   * Obtener predicción de próxima siesta y hora de dormir
   * GET /api/sleep/predict/:childId
   */
  async predictSleep(req, res) {
    try {
      const userId = req.user.uid;
      const { childId } = req.params;

      // Obtener información del niño
      const childDoc = await this.db
        .collection('children')
        .doc(childId)
        .get();

      if (!childDoc.exists) {
        return res.status(404).json({
          error: 'Niño no encontrado'
        });
      }

      const childData = childDoc.data();
      
      // Calcular edad en meses
      const birthDate = childData.birthDate.toDate();
      const ageInMonths = this.calculateAgeInMonths(birthDate);

      // Obtener historial de sueño (últimos 14 días)
      const sleepHistory = await this.getSleepHistory(userId, childId, 14);

      if (sleepHistory.length < 3) {
        return res.status(200).json({
          success: true,
          message: 'Necesitamos más datos para hacer predicciones precisas',
          recommendation: this.getDefaultScheduleByAge(ageInMonths),
          dataPoints: sleepHistory.length,
          minimumRequired: 3
        });
      }

      // Generar predicción
      const prediction = await this.generateSleepPrediction(
        sleepHistory,
        ageInMonths,
        childData
      );

      res.json({
        success: true,
        prediction,
        childInfo: {
          name: childData.name,
          ageInMonths,
          dataPoints: sleepHistory.length
        }
      });

    } catch (error) {
      console.error('❌ Error al predecir sueño:', error);
      res.status(500).json({
        error: 'Error al generar predicción',
        details: error.message
      });
    }
  }

  /**
   * Obtener historial de sueño
   * GET /api/sleep/history/:childId
   */
  async getSleepHistoryEndpoint(req, res) {
    try {
      const userId = req.user.uid;
      const { childId } = req.params;
      const { days = 7 } = req.query;

      const sleepHistory = await this.getSleepHistory(
        userId, 
        childId, 
        parseInt(days)
      );

      // Calcular estadísticas
      const statistics = this.calculateSleepStatistics(sleepHistory);

      res.json({
        success: true,
        sleepHistory,
        statistics,
        days: parseInt(days)
      });

    } catch (error) {
      console.error('❌ Error al obtener historial:', error);
      res.status(500).json({
        error: 'Error al obtener historial de sueño',
        details: error.message
      });
    }
  }

  /**
   * Actualizar evento de sueño
   * PUT /api/sleep/:eventId
   */
  async updateSleepEvent(req, res) {
    try {
      const userId = req.user.uid;
      const { eventId } = req.params;
      const updateData = req.body;

      // Verificar que el evento existe y pertenece al usuario
      const eventDoc = await this.db.collection('sleepEvents').doc(eventId).get();
      
      if (!eventDoc.exists) {
        return res.status(404).json({ error: 'Evento no encontrado' });
      }

      const eventData = eventDoc.data();
      if (eventData.userId !== userId) {
        return res.status(403).json({ error: 'No autorizado' });
      }

      // Preparar actualizaciones
      const updates = {
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      // Convertir fechas a Timestamp si existen
      if (updateData.startTime) {
        updates.startTime = admin.firestore.Timestamp.fromDate(parseISO(updateData.startTime));
      }
      if (updateData.endTime) {
        updates.endTime = admin.firestore.Timestamp.fromDate(parseISO(updateData.endTime));
      }

      // Agregar pausas si existen
      if (updateData.pauses !== undefined) {
        updates.pauses = updateData.pauses; // Array de pausas
      }

      // Agregar otros campos editables
      const editableFields = [
        'quality', 'wakeUps', 'notes', 'location', 
        'temperature', 'noiseLevel', 'type'
      ];
      
      editableFields.forEach(field => {
        if (updateData[field] !== undefined) {
          updates[field] = updateData[field];
        }
      });

      // Recalcular duración si hay cambios en horarios o pausas
      const newStartTime = updateData.startTime 
        ? parseISO(updateData.startTime) 
        : eventData.startTime.toDate();
      
      const newEndTime = updateData.endTime 
        ? parseISO(updateData.endTime) 
        : (eventData.endTime ? eventData.endTime.toDate() : null);

      if (newStartTime && newEndTime) {
        // Duración total en minutos
        let totalDuration = differenceInMinutes(newEndTime, newStartTime);
        
        // Restar pausas si existen
        const pauses = updateData.pauses || eventData.pauses || [];
        if (pauses && pauses.length > 0) {
          const totalPauseTime = pauses.reduce((sum, pause) => sum + (pause.duration || 0), 0);
          totalDuration -= totalPauseTime;
        }
        
        updates.duration = Math.max(0, totalDuration); // No permitir duraciones negativas
        updates.netDuration = updates.duration; // Duración neta (sin pausas)
        updates.grossDuration = differenceInMinutes(newEndTime, newStartTime); // Duración bruta
      }

      await this.db.collection('sleepEvents').doc(eventId).update(updates);

      // Actualizar estadísticas
      await this.updateChildSleepStats(userId, eventData.childId);

      // Obtener evento actualizado
      const updatedDoc = await this.db.collection('sleepEvents').doc(eventId).get();
      const updatedData = updatedDoc.data();

      res.json({
        success: true,
        message: 'Evento actualizado exitosamente',
        sleepEvent: {
          id: eventId,
          ...updatedData,
          startTime: updatedData.startTime.toDate().toISOString(),
          endTime: updatedData.endTime ? updatedData.endTime.toDate().toISOString() : null
        }
      });

    } catch (error) {
      console.error('❌ Error al actualizar evento:', error);
      res.status(500).json({
        error: 'Error al actualizar evento',
        details: error.message
      });
    }
  }

  /**
   * Eliminar evento de sueño
   * DELETE /api/sleep/:eventId
   */
  async deleteSleepEvent(req, res) {
    try {
      const userId = req.user.uid;
      const { eventId } = req.params;

      const eventDoc = await this.db.collection('sleepEvents').doc(eventId).get();
      
      if (!eventDoc.exists) {
        return res.status(404).json({ error: 'Evento no encontrado' });
      }

      const eventData = eventDoc.data();
      if (eventData.userId !== userId) {
        return res.status(403).json({ error: 'No autorizado' });
      }

      await this.db.collection('sleepEvents').doc(eventId).delete();

      res.json({
        success: true,
        message: 'Evento eliminado exitosamente'
      });

    } catch (error) {
      console.error('❌ Error al eliminar evento:', error);
      res.status(500).json({
        error: 'Error al eliminar evento',
        details: error.message
      });
    }
  }

  // ==========================================
  // MÉTODOS AUXILIARES
  // ==========================================

  /**
   * Obtener historial de sueño de un niño
   */
  async getSleepHistory(userId, childId, days = 14) {
    const startDate = subDays(new Date(), days);
    
    const snapshot = await this.db
      .collection('sleepEvents')
      .where('userId', '==', userId)
      .where('childId', '==', childId)
      .where('startTime', '>=', admin.firestore.Timestamp.fromDate(startDate))
      .orderBy('startTime', 'asc')
      .get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      startTime: doc.data().startTime.toDate().toISOString(),
      endTime: doc.data().endTime ? doc.data().endTime.toDate().toISOString() : null
    }));
  }

  /**
   * Generar predicción inteligente de sueño
   */
  async generateSleepPrediction(sleepHistory, ageInMonths, childData) {
    const now = new Date();

    // Separar siestas y sueño nocturno
    const naps = sleepHistory.filter(s => s.type === 'nap');
    const nightSleeps = sleepHistory.filter(s => s.type === 'nightsleep');

    // 1. PREDECIR PRÓXIMA SIESTA
    const napPrediction = this.predictNextNap(naps, now, ageInMonths);

    // 2. PREDECIR HORA DE DORMIR NOCTURNA
    const bedtimePrediction = this.predictBedtime(nightSleeps, ageInMonths);

    // 3. ANALIZAR PATRONES DE SUEÑO
    const patterns = this.analyzeSleepPatterns(sleepHistory, ageInMonths);

    // 4. GENERAR RECOMENDACIONES
    const recommendations = this.generateRecommendations(
      patterns,
      ageInMonths,
      sleepHistory
    );

    // 5. CALCULAR PRESIÓN DE SUEÑO
    const sleepPressure = this.calculateSleepPressure(sleepHistory, now);

    return {
      nextNap: napPrediction,
      bedtime: bedtimePrediction,
      patterns,
      recommendations,
      sleepPressure,
      predictedAt: now.toISOString(),
      confidence: this.calculateConfidence(sleepHistory, ageInMonths)
    };
  }

  /**
   * Predecir próxima siesta usando ventanas de sueño
   */
  predictNextNap(naps, now, ageInMonths) {
    // Si no hay siestas registradas, usar horarios por defecto
    if (naps.length === 0) {
      const defaults = this.getDefaultNapSchedule(ageInMonths);
      const nextDefault = this.findNextDefaultNap(defaults, now);
      return {
        time: nextDefault,
        confidence: 30,
        reason: 'Basado en horarios típicos para la edad',
        windowStart: addMinutes(parseISO(nextDefault), -30).toISOString(),
        windowEnd: addMinutes(parseISO(nextDefault), 30).toISOString(),
        expectedDuration: this.getTypicalNapDuration(ageInMonths),
        type: 'Horario sugerido'
      };
    }

    // Encontrar la última siesta
    const sortedNaps = [...naps].sort((a, b) => 
      parseISO(b.startTime).getTime() - parseISO(a.startTime).getTime()
    );
    const lastNap = sortedNaps[0];
    const lastNapEnd = parseISO(lastNap.endTime || lastNap.startTime);
    const hoursSinceLastNap = differenceInHours(now, lastNapEnd, { roundingMethod: 'floor' });
    const minutesSinceLastNap = differenceInMinutes(now, lastNapEnd);

    // Ventanas de sueño típicas por edad (en horas)
    const wakeWindows = this.getWakeWindows(ageInMonths);
    const minWakeWindow = wakeWindows.min;
    const maxWakeWindow = wakeWindows.max;
    const optimalWakeWindow = wakeWindows.optimal;

    // Si la última siesta fue hace muy poco, calcular cuándo debería ser la próxima
    if (minutesSinceLastNap < minWakeWindow * 60) {
      // Calcular próxima siesta basada en ventana de sueño óptima
      const nextNapTime = addMinutes(lastNapEnd, optimalWakeWindow * 60);
      
      // VALIDACIÓN CRÍTICA: Si la próxima siesta calculada es después de las 7 PM, predecir para mañana
      const nextNapHour = nextNapTime.getHours();
      
      if (nextNapHour >= 19 || nextNapHour < 6) {
        // Es muy tarde o muy temprano, predecir primera siesta de mañana
        const tomorrowMorning = addDays(now, 1);
        tomorrowMorning.setHours(9, 0, 0, 0); // 9:00 AM
        
        return {
          time: tomorrowMorning.toISOString(),
          windowStart: addMinutes(tomorrowMorning, -30).toISOString(),
          windowEnd: addMinutes(tomorrowMorning, 30).toISOString(),
          expectedDuration: this.getTypicalNapDuration(ageInMonths),
          confidence: 70,
          type: 'Próxima siesta (mañana)',
          reason: `Última siesta fue tarde (${lastNapEnd.toLocaleTimeString()}). Próxima siesta mañana por la mañana`
        };
      }
      
      return {
        time: nextNapTime.toISOString(),
        windowStart: addMinutes(nextNapTime, -20).toISOString(),
        windowEnd: addMinutes(nextNapTime, 20).toISOString(),
        expectedDuration: this.getTypicalNapDuration(ageInMonths),
        confidence: 75,
        type: 'Basado en ventana de sueño',
        reason: `Última siesta hace ${Math.round(minutesSinceLastNap)} minutos. Ventana óptima: ${optimalWakeWindow} horas`,
        hoursUntilNextNap: Math.max(0, (optimalWakeWindow * 60 - minutesSinceLastNap) / 60)
      };
    }

    // Analizar patrones de horario de siestas
    const napTimes = naps.map(n => {
      const date = parseISO(n.startTime);
      return {
        hour: date.getHours() + date.getMinutes() / 60,
        date: date
      };
    });

    // Agrupar siestas por horario (mañana, mediodía, tarde)
    const morningNaps = napTimes.filter(t => t.hour >= 7 && t.hour < 12);
    const afternoonNaps = napTimes.filter(t => t.hour >= 12 && t.hour < 16);
    const eveningNaps = napTimes.filter(t => t.hour >= 16 && t.hour < 20);

    // Calcular promedios
    const avgMorningNap = morningNaps.length > 0 ? stats.mean(morningNaps.map(n => n.hour)) : null;
    const avgAfternoonNap = afternoonNaps.length > 0 ? stats.mean(afternoonNaps.map(n => n.hour)) : null;
    const avgEveningNap = eveningNaps.length > 0 ? stats.mean(eveningNaps.map(n => n.hour)) : null;

    // Hora actual
    const currentHour = now.getHours() + now.getMinutes() / 60;
    let nextNapHour, confidence, napType;

    // Lógica mejorada: considerar si es razonable esperar otra siesta hoy
    const hourOfDay = now.getHours();
    
    // Si es muy tarde (después de las 7 PM), no predecir más siestas para hoy
    if (hourOfDay >= 19) {
      // Predecir primera siesta del día siguiente
      if (avgMorningNap) {
        nextNapHour = avgMorningNap;
        napType = 'Siesta de la mañana';
        confidence = 80;
      } else {
        // Usar horario por defecto para mañana
        const defaults = this.getDefaultNapSchedule(ageInMonths);
        const firstNap = parseISO(defaults[0]);
        nextNapHour = firstNap.getHours() + firstNap.getMinutes() / 60;
        napType = 'Horario sugerido';
        confidence = 40;
      }
      
      const nextNapDate = new Date(now);
      nextNapDate.setDate(nextNapDate.getDate() + 1);
      nextNapDate.setHours(Math.floor(nextNapHour));
      nextNapDate.setMinutes(Math.round((nextNapHour % 1) * 60));
      nextNapDate.setSeconds(0);

      const recentNapDurations = naps
        .slice(-5)
        .filter(n => n.duration && n.duration > 0)
        .map(n => n.duration);
      
      const expectedDuration = recentNapDurations.length > 0
        ? Math.round(stats.mean(recentNapDurations))
        : this.getTypicalNapDuration(ageInMonths);

      return {
        time: nextNapDate.toISOString(),
        windowStart: addMinutes(nextNapDate, -30).toISOString(),
        windowEnd: addMinutes(nextNapDate, 30).toISOString(),
        expectedDuration,
        confidence,
        type: napType,
        reason: `Ya es tarde. Próxima siesta mañana. ${naps.length} siestas en historial`
      };
    }

    // Determinar próxima siesta según hora actual y ventana de sueño
    if (currentHour < 12 && avgMorningNap && avgMorningNap > currentHour) {
      nextNapHour = avgMorningNap;
      napType = 'Siesta de la mañana';
      confidence = 85;
    } else if (currentHour < 16 && avgAfternoonNap && avgAfternoonNap > currentHour) {
      nextNapHour = avgAfternoonNap;
      napType = 'Siesta de la tarde';
      confidence = 90;
    } else if (currentHour < 18 && avgEveningNap && avgEveningNap > currentHour && ageInMonths < 9) {
      nextNapHour = avgEveningNap;
      napType = 'Siesta vespertina';
      confidence = 75;
    } else {
      // Si no hay patrón claro o ya pasaron todas las siestas, usar ventana de sueño
      const nextNapByWindow = addMinutes(lastNapEnd, optimalWakeWindow * 60);
      
      // Si la próxima por ventana es razonable (antes de las 7 PM)
      if (nextNapByWindow.getHours() < 19) {
        return {
          time: nextNapByWindow.toISOString(),
          windowStart: addMinutes(nextNapByWindow, -20).toISOString(),
          windowEnd: addMinutes(nextNapByWindow, 20).toISOString(),
          expectedDuration: this.getTypicalNapDuration(ageInMonths),
          confidence: 70,
          type: 'Basado en ventana de sueño',
          reason: `Basado en ventana óptima de ${optimalWakeWindow}h desde última siesta`
        };
      }
      
      // De lo contrario, predecir para mañana
      if (avgMorningNap) {
        nextNapHour = avgMorningNap;
        napType = 'Siesta de la mañana (mañana)';
        confidence = 75;
      } else {
        const defaults = this.getDefaultNapSchedule(ageInMonths);
        const firstNap = parseISO(defaults[0]);
        nextNapHour = firstNap.getHours() + firstNap.getMinutes() / 60;
        napType = 'Horario sugerido (mañana)';
        confidence = 50;
      }
    }

    // Calcular fecha y hora de la próxima siesta
    const nextNapDate = new Date(now);
    if (nextNapHour <= currentHour) {
      nextNapDate.setDate(nextNapDate.getDate() + 1);
    }
    nextNapDate.setHours(Math.floor(nextNapHour));
    nextNapDate.setMinutes(Math.round((nextNapHour % 1) * 60));
    nextNapDate.setSeconds(0);

    // Ventana de tiempo óptimo (±30 minutos)
    const windowStart = addMinutes(nextNapDate, -30);
    const windowEnd = addMinutes(nextNapDate, 30);

    // Duración esperada
    const recentNapDurations = naps
      .slice(-5)
      .filter(n => n.duration && n.duration > 0)
      .map(n => n.duration);
    
    const expectedDuration = recentNapDurations.length > 0
      ? Math.round(stats.mean(recentNapDurations))
      : this.getTypicalNapDuration(ageInMonths);

    return {
      time: nextNapDate.toISOString(),
      windowStart: windowStart.toISOString(),
      windowEnd: windowEnd.toISOString(),
      expectedDuration,
      confidence,
      type: napType,
      reason: `Basado en ${naps.length} siestas anteriores`
    };
  }

  /**
   * Obtener ventanas de sueño por edad (tiempo despierto entre siestas)
   */
  getWakeWindows(ageInMonths) {
    if (ageInMonths <= 1) {
      return { min: 0.75, optimal: 1, max: 1.5 }; // 45-90 min
    } else if (ageInMonths <= 3) {
      return { min: 1, optimal: 1.5, max: 2 }; // 1-2 horas
    } else if (ageInMonths <= 6) {
      return { min: 1.5, optimal: 2, max: 2.5 }; // 1.5-2.5 horas
    } else if (ageInMonths <= 9) {
      return { min: 2, optimal: 2.5, max: 3.5 }; // 2-3.5 horas
    } else if (ageInMonths <= 12) {
      return { min: 2.5, optimal: 3, max: 4 }; // 2.5-4 horas
    } else if (ageInMonths <= 18) {
      return { min: 3, optimal: 4, max: 5 }; // 3-5 horas
    } else {
      return { min: 4, optimal: 5, max: 6 }; // 4-6 horas
    }
  }

  /**
   * Encontrar el próximo horario por defecto que no haya pasado
   */
  findNextDefaultNap(defaults, now) {
    const currentHour = now.getHours() + now.getMinutes() / 60;
    
    for (const defaultTime of defaults) {
      const napTime = parseISO(defaultTime);
      const napHour = napTime.getHours() + napTime.getMinutes() / 60;
      
      if (napHour > currentHour && napHour < 19) {
        return defaultTime;
      }
    }
    
    // Si todos los horarios ya pasaron, devolver el primero del día siguiente
    const tomorrow = addDays(now, 1);
    const firstNap = parseISO(defaults[0]);
    tomorrow.setHours(firstNap.getHours());
    tomorrow.setMinutes(firstNap.getMinutes());
    tomorrow.setSeconds(0);
    
    return tomorrow.toISOString();
  }

  /**
   * Predecir hora de dormir nocturna
   */
  predictBedtime(nightSleeps, ageInMonths) {
    // Si no hay datos de sueño nocturno, usar horarios por defecto
    if (nightSleeps.length === 0) {
      const defaultBedtime = this.getDefaultBedtime(ageInMonths);
      return {
        time: defaultBedtime,
        confidence: 40,
        reason: 'Basado en horarios típicos para la edad'
      };
    }

    // Analizar horarios de dormir - SOLO LOS QUE SON REALMENTE NOCTURNOS
    const validBedtimes = nightSleeps
      .map(n => {
        const date = parseISO(n.startTime);
        const hour = date.getHours() + date.getMinutes() / 60;
        return { hour, date };
      })
      .filter(b => b.hour >= 18 || b.hour <= 4); // Entre 6 PM y 4 AM

    // Si no hay horarios nocturnos válidos, usar por defecto
    if (validBedtimes.length === 0) {
      const defaultBedtime = this.getDefaultBedtime(ageInMonths);
      return {
        time: defaultBedtime,
        confidence: 40,
        reason: 'Sin horarios nocturnos válidos. Usando horario típico'
      };
    }

    // Normalizar horarios (convertir horas después de medianoche a formato 24+)
    const normalizedHours = validBedtimes.map(b => {
      if (b.hour >= 0 && b.hour <= 4) {
        return b.hour + 24; // 1 AM = 25, 2 AM = 26, etc.
      }
      return b.hour;
    });

    const avgBedtime = stats.mean(normalizedHours);
    const stdBedtime = normalizedHours.length > 1 ? stats.standardDeviation(normalizedHours) : 0;

    // Desnormalizar (convertir de vuelta a 0-23)
    let finalBedtimeHour = avgBedtime;
    if (finalBedtimeHour >= 24) {
      finalBedtimeHour -= 24;
    }

    // Validación adicional: La hora de dormir DEBE estar entre 18:00 (6 PM) y 23:00 (11 PM)
    if (finalBedtimeHour < 18 || finalBedtimeHour > 23) {
      // Si el cálculo da un horario inválido, usar horario por defecto
      const defaultBedtime = this.getDefaultBedtime(ageInMonths);
      return {
        time: defaultBedtime,
        confidence: 40,
        reason: 'Horario calculado fuera de rango. Usando horario típico para la edad'
      };
    }

    // Calcular fecha
    const now = new Date();
    const bedtimeDate = new Date(now);
    bedtimeDate.setHours(Math.floor(finalBedtimeHour));
    bedtimeDate.setMinutes(Math.round((finalBedtimeHour % 1) * 60));
    bedtimeDate.setSeconds(0);
    bedtimeDate.setMilliseconds(0);

    // Si ya pasó la hora hoy, programar para mañana
    if (bedtimeDate <= now) {
      bedtimeDate.setDate(bedtimeDate.getDate() + 1);
    }

    // Confianza basada en consistencia
    const confidence = Math.max(50, Math.min(95, 100 - stdBedtime * 20));

    return {
      time: bedtimeDate.toISOString(),
      windowStart: addMinutes(bedtimeDate, -20).toISOString(),
      windowEnd: addMinutes(bedtimeDate, 20).toISOString(),
      confidence: Math.round(confidence),
      consistency: stdBedtime < 0.5 ? 'Alta' : stdBedtime < 1 ? 'Media' : 'Baja',
      reason: `Basado en ${validBedtimes.length} noches anteriores`
    };
  }

  /**
   * Analizar patrones de sueño
   */
  analyzeSleepPatterns(sleepHistory, ageInMonths) {
    const naps = sleepHistory.filter(s => s.type === 'nap' && s.duration);
    const nightSleeps = sleepHistory.filter(s => s.type === 'nightsleep' && s.duration);

    // Total de sueño diario
    const dailySleep = {};
    sleepHistory.forEach(sleep => {
      if (!sleep.duration) return;
      const day = format(parseISO(sleep.startTime), 'yyyy-MM-dd');
      dailySleep[day] = (dailySleep[day] || 0) + sleep.duration;
    });

    const totalSleepPerDay = Object.values(dailySleep);
    const avgDailySleep = totalSleepPerDay.length > 0 
      ? Math.round(stats.mean(totalSleepPerDay)) 
      : 0;

    // Promedio de siestas
    const napDurations = naps.map(n => n.duration);
    const avgNapDuration = napDurations.length > 0 
      ? Math.round(stats.mean(napDurations)) 
      : 0;
    const avgNapsPerDay = naps.length / 7;

    // Promedio de sueño nocturno
    const nightDurations = nightSleeps.map(n => n.duration);
    const avgNightSleep = nightDurations.length > 0 
      ? Math.round(stats.mean(nightDurations)) 
      : 0;

    // Calidad de sueño
    const qualityScores = sleepHistory.map(s => {
      const scores = { poor: 1, fair: 2, good: 3, excellent: 4 };
      return scores[s.quality] || 2;
    });
    const avgQuality = qualityScores.length > 0 
      ? stats.mean(qualityScores) 
      : 2;

    // Despertar nocturno promedio
    const wakeUps = nightSleeps.map(n => n.wakeUps || 0);
    const avgWakeUps = wakeUps.length > 0 
      ? stats.mean(wakeUps).toFixed(1) 
      : 0;

    return {
      totalDailySleep: avgDailySleep,
      napStats: {
        averageDuration: avgNapDuration,
        averagePerDay: parseFloat(avgNapsPerDay.toFixed(1)),
        totalNaps: naps.length
      },
      nightStats: {
        averageDuration: avgNightSleep,
        averageWakeUps: parseFloat(avgWakeUps),
        totalNights: nightSleeps.length
      },
      overallQuality: this.mapQualityScore(avgQuality),
      consistency: this.calculateConsistency(sleepHistory)
    };
  }

  /**
   * Generar recomendaciones personalizadas
   */
  generateRecommendations(patterns, ageInMonths, sleepHistory) {
    const recommendations = [];
    const expectedSleep = this.getExpectedSleepByAge(ageInMonths);

    // Recomendación 1: Total de sueño
    if (patterns.totalDailySleep < expectedSleep.min) {
      recommendations.push({
        type: 'warning',
        category: 'duration',
        title: 'Poco sueño total',
        message: `El bebé duerme ${Math.round(patterns.totalDailySleep / 60)} horas al día. Se recomiendan ${Math.round(expectedSleep.min / 60)}-${Math.round(expectedSleep.max / 60)} horas.`,
        action: 'Considera adelantar la hora de dormir o alargar las siestas.'
      });
    }

    // Recomendación 2: Número de siestas
    const expectedNaps = this.getExpectedNapsPerDay(ageInMonths);
    if (patterns.napStats.averagePerDay < expectedNaps.min) {
      recommendations.push({
        type: 'info',
        category: 'naps',
        title: 'Pocas siestas',
        message: `El bebé hace ${patterns.napStats.averagePerDay} siestas al día. Para su edad se recomiendan ${expectedNaps.min}-${expectedNaps.max}.`,
        action: 'Intenta agregar una siesta adicional en la rutina.'
      });
    }

    // Recomendación 3: Despertares nocturnos
    if (patterns.nightStats.averageWakeUps > 2 && ageInMonths > 6) {
      recommendations.push({
        type: 'tip',
        category: 'night_wakings',
        title: 'Múltiples despertares nocturnos',
        message: `Promedio de ${patterns.nightStats.averageWakeUps} despertares por noche.`,
        action: 'Considera implementar técnicas de auto-calmado y rutinas consistentes.'
      });
    }

    // Recomendación 4: Consistencia
    if (patterns.consistency < 70) {
      recommendations.push({
        type: 'tip',
        category: 'consistency',
        title: 'Horarios irregulares',
        message: 'Los horarios de sueño varían mucho día a día.',
        action: 'Intenta mantener horarios más consistentes para mejorar el ritmo circadiano.'
      });
    }

    // Recomendación 5: Calidad de sueño
    if (patterns.overallQuality === 'Baja' || patterns.overallQuality === 'Regular') {
      recommendations.push({
        type: 'tip',
        category: 'quality',
        title: 'Calidad de sueño mejorable',
        message: 'La calidad general del sueño puede mejorarse.',
        action: 'Optimiza el ambiente: temperatura, oscuridad, ruido blanco.'
      });
    }

    // Si todo va bien
    if (recommendations.length === 0) {
      recommendations.push({
        type: 'success',
        category: 'general',
        title: '¡Excelente trabajo!',
        message: 'Los patrones de sueño son saludables y consistentes.',
        action: 'Continúa con la rutina actual.'
      });
    }

    return recommendations;
  }

  /**
   * Calcular presión de sueño (cuánto necesita dormir)
   */
  calculateSleepPressure(sleepHistory, now) {
    // Encontrar el último evento de sueño
    const lastSleep = sleepHistory
      .filter(s => parseISO(s.endTime || s.startTime) < now)
      .sort((a, b) => parseISO(b.startTime) - parseISO(a.startTime))[0];

    if (!lastSleep) {
      return {
        level: 'unknown',
        hoursSinceLastSleep: null,
        recommendation: 'Sin datos suficientes'
      };
    }

    const lastSleepEnd = parseISO(lastSleep.endTime || lastSleep.startTime);
    const hoursSinceSleep = differenceInHours(now, lastSleepEnd);

    let level, recommendation;

    if (hoursSinceSleep < 1.5) {
      level = 'low';
      recommendation = 'Momento ideal para actividades y estimulación';
    } else if (hoursSinceSleep < 3) {
      level = 'medium';
      recommendation = 'Comienza a preparar el ambiente para dormir';
    } else if (hoursSinceSleep < 4) {
      level = 'high';
      recommendation = 'Es hora de dormir pronto';
    } else {
      level = 'critical';
      recommendation = '¡El bebé necesita dormir urgentemente!';
    }

    return {
      level,
      hoursSinceLastSleep: parseFloat(hoursSinceSleep.toFixed(1)),
      lastSleepTime: lastSleepEnd.toISOString(),
      recommendation
    };
  }

  /**
   * Calcular confianza de las predicciones
   */
  calculateConfidence(sleepHistory, ageInMonths) {
    const dataPoints = sleepHistory.length;
    let baseConfidence = Math.min(95, 40 + dataPoints * 4);

    // Reducir confianza si los datos son muy inconsistentes
    const consistency = this.calculateConsistency(sleepHistory);
    baseConfidence = baseConfidence * (consistency / 100);

    return Math.round(baseConfidence);
  }

  /**
   * Calcular consistencia de patrones
   */
  calculateConsistency(sleepHistory) {
    if (sleepHistory.length < 3) return 50;

    const times = sleepHistory.map(s => {
      const date = parseISO(s.startTime);
      return date.getHours() + date.getMinutes() / 60;
    });

    const stdDev = stats.standardDeviation(times);
    
    // Convertir desviación estándar a score de consistencia
    // Menor desviación = mayor consistencia
    const consistencyScore = Math.max(0, Math.min(100, 100 - stdDev * 15));
    
    return Math.round(consistencyScore);
  }

  /**
   * Actualizar estadísticas de sueño del niño
   */
  async updateChildSleepStats(userId, childId) {
    try {
      const sleepHistory = await this.getSleepHistory(userId, childId, 7);
      const statistics = this.calculateSleepStatistics(sleepHistory);

      await this.db.collection('children').doc(childId).update({
        sleepStats: statistics,
        lastSleepUpdate: admin.firestore.FieldValue.serverTimestamp()
      });
    } catch (error) {
      console.error('Error actualizando estadísticas:', error);
    }
  }

  /**
   * Calcular estadísticas generales
   */
  calculateSleepStatistics(sleepHistory) {
    const naps = sleepHistory.filter(s => s.type === 'nap' && s.duration);
    const nights = sleepHistory.filter(s => s.type === 'nightsleep' && s.duration);

    return {
      totalEvents: sleepHistory.length,
      totalNaps: naps.length,
      totalNights: nights.length,
      avgNapDuration: naps.length > 0 
        ? Math.round(stats.mean(naps.map(n => n.duration))) 
        : 0,
      avgNightDuration: nights.length > 0 
        ? Math.round(stats.mean(nights.map(n => n.duration))) 
        : 0,
      lastUpdated: new Date().toISOString()
    };
  }

  // ==========================================
  // MÉTODOS DE DATOS POR EDAD
  // ==========================================

  calculateAgeInMonths(birthDate) {
    const now = new Date();
    const months = (now.getFullYear() - birthDate.getFullYear()) * 12 + 
                   (now.getMonth() - birthDate.getMonth());
    return months;
  }

  getDefaultScheduleByAge(ageInMonths) {
    const schedules = {
      '0-3': {
        naps: ['9:00 AM', '12:00 PM', '3:00 PM', '5:30 PM'],
        bedtime: '7:30 PM',
        totalSleep: 16
      },
      '4-6': {
        naps: ['9:00 AM', '1:00 PM', '4:30 PM'],
        bedtime: '7:00 PM',
        totalSleep: 15
      },
      '7-12': {
        naps: ['9:30 AM', '2:00 PM'],
        bedtime: '7:00 PM',
        totalSleep: 14
      },
      '13-18': {
        naps: ['1:00 PM'],
        bedtime: '7:30 PM',
        totalSleep: 13
      },
      '19+': {
        naps: ['1:30 PM'],
        bedtime: '8:00 PM',
        totalSleep: 12
      }
    };

    if (ageInMonths <= 3) return schedules['0-3'];
    if (ageInMonths <= 6) return schedules['4-6'];
    if (ageInMonths <= 12) return schedules['7-12'];
    if (ageInMonths <= 18) return schedules['13-18'];
    return schedules['19+'];
  }

  getDefaultNapSchedule(ageInMonths) {
    const schedule = this.getDefaultScheduleByAge(ageInMonths);
    const today = new Date();
    
    return schedule.naps.map(time => {
      const [hourMin, period] = time.split(' ');
      const [hour, min] = hourMin.split(':');
      let hour24 = parseInt(hour);
      if (period === 'PM' && hour24 !== 12) hour24 += 12;
      if (period === 'AM' && hour24 === 12) hour24 = 0;
      
      const napTime = new Date(today);
      napTime.setHours(hour24, parseInt(min), 0, 0);
      return napTime.toISOString();
    });
  }

  getDefaultBedtime(ageInMonths) {
    const schedule = this.getDefaultScheduleByAge(ageInMonths);
    const now = new Date();
    
    // Parsear el horario (ej: "7:30 PM")
    const bedtimeStr = schedule.bedtime;
    const [hourMin, period] = bedtimeStr.split(' ');
    const [hour, min] = hourMin.split(':');
    let hour24 = parseInt(hour);
    
    // Convertir a formato 24 horas
    if (period === 'PM' && hour24 !== 12) {
      hour24 += 12;
    } else if (period === 'AM' && hour24 === 12) {
      hour24 = 0;
    }
    
    // VALIDACIÓN: La hora de dormir DEBE estar entre 18:00 y 23:00
    if (hour24 < 18 || hour24 > 23) {
      console.warn(`⚠️ Hora de dormir inválida: ${hour24}:${min}. Usando 19:00 por defecto.`);
      hour24 = 19; // 7:00 PM por defecto
    }
    
    const bedtime = new Date(now);
    bedtime.setHours(hour24, min ? parseInt(min) : 0, 0, 0);
    
    // Si ya pasó la hora hoy, mover a mañana
    if (bedtime <= now) {
      bedtime.setDate(bedtime.getDate() + 1);
    }
    
    return bedtime.toISOString();
  }

  getTypicalNapDuration(ageInMonths) {
    if (ageInMonths <= 3) return 45;
    if (ageInMonths <= 6) return 60;
    if (ageInMonths <= 12) return 75;
    return 90;
  }

  getExpectedSleepByAge(ageInMonths) {
    if (ageInMonths <= 3) return { min: 840, max: 1020 }; // 14-17 horas
    if (ageInMonths <= 6) return { min: 780, max: 960 };  // 13-16 horas
    if (ageInMonths <= 12) return { min: 720, max: 900 }; // 12-15 horas
    if (ageInMonths <= 24) return { min: 660, max: 840 }; // 11-14 horas
    return { min: 600, max: 780 }; // 10-13 horas
  }

  getExpectedNapsPerDay(ageInMonths) {
    if (ageInMonths <= 3) return { min: 4, max: 5 };
    if (ageInMonths <= 6) return { min: 3, max: 4 };
    if (ageInMonths <= 12) return { min: 2, max: 3 };
    if (ageInMonths <= 18) return { min: 1, max: 2 };
    return { min: 1, max: 1 };
  }

  mapQualityScore(score) {
    if (score >= 3.5) return 'Excelente';
    if (score >= 2.5) return 'Buena';
    if (score >= 1.5) return 'Regular';
    return 'Baja';
  }
}

module.exports = new SleepPredictionController();

