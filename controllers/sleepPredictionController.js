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
   * Registrar hora de despertar del día
   * POST /api/sleep/wake-time
   */
  async recordWakeTime(req, res) {
    try {
      const userId = req.user.uid;
      const { childId, wakeTime } = req.body;

      // Validaciones
      if (!childId || !wakeTime) {
        return res.status(400).json({
          error: 'childId y wakeTime son requeridos'
        });
      }

      const wakeTimeData = {
        userId,
        childId,
        wakeTime: admin.firestore.Timestamp.fromDate(new Date(wakeTime)),
        type: 'wake',
        createdAt: admin.firestore.Timestamp.now()
      };

      const docRef = await this.db.collection('wakeEvents').add(wakeTimeData);

      res.json({
        success: true,
        id: docRef.id,
        message: 'Hora de despertar registrada exitosamente',
        wakeTime: wakeTime
      });

    } catch (error) {
      console.error('❌ Error al registrar hora de despertar:', error);
      res.status(500).json({
        error: 'Error al registrar hora de despertar',
        details: error.message
      });
    }
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

      // Generar predicción (pasar userId y childId)
      const childInfo = {
        id: childId,
        userId: userId,
        name: childData.name,
        ageInMonths: ageInMonths
      };
      
      const prediction = await this.generateSleepPrediction(
        sleepHistory,
        ageInMonths,
        childInfo
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
   * Obtener hora de despertar de hoy o predecirla
   */
  async getWakeTimeForToday(childId, userId) {
    try {
      const todayStart = startOfDay(new Date());
      
      // Buscar hora de despertar registrada HOY
      const wakeSnapshot = await this.db
        .collection('wakeEvents')
        .where('userId', '==', userId)
        .where('childId', '==', childId)
        .where('wakeTime', '>=', admin.firestore.Timestamp.fromDate(todayStart))
        .orderBy('wakeTime', 'desc')
        .limit(1)
        .get();

      if (!wakeSnapshot.empty) {
        const wakeData = wakeSnapshot.docs[0].data();
        return {
          time: wakeData.wakeTime.toDate(),
          source: 'recorded'
        };
      }

      // Si no hay registro de hoy, predecir basándose en historial
      const last30Days = subDays(new Date(), 30);
      const historicalWakes = await this.db
        .collection('wakeEvents')
        .where('userId', '==', userId)
        .where('childId', '==', childId)
        .where('wakeTime', '>=', admin.firestore.Timestamp.fromDate(last30Days))
        .orderBy('wakeTime', 'desc')
        .limit(30)
        .get();

      if (!historicalWakes.empty) {
        // Calcular hora promedio de despertar
        const wakeTimes = historicalWakes.docs.map(doc => {
          const wakeDate = doc.data().wakeTime.toDate();
          return wakeDate.getHours() + wakeDate.getMinutes() / 60;
        });
        
        const avgWakeHour = stats.mean(wakeTimes);
        const wakeDate = new Date(todayStart);
        wakeDate.setHours(Math.floor(avgWakeHour));
        wakeDate.setMinutes(Math.round((avgWakeHour % 1) * 60));
        
        return {
          time: wakeDate,
          source: 'predicted-historical'
        };
      }

      // Sin historial, usar default por edad
      const defaultWakeHour = 7; // 7 AM por defecto
      const wakeDate = new Date(todayStart);
      wakeDate.setHours(defaultWakeHour, 0, 0, 0);
      
      return {
        time: wakeDate,
        source: 'default'
      };
    } catch (error) {
      console.error('Error obteniendo hora de despertar:', error);
      const todayStart = startOfDay(new Date());
      return {
        time: new Date(todayStart.setHours(7, 0, 0, 0)),
        source: 'error-default'
      };
    }
  }

  /**
   * Generar predicción inteligente de sueño
   */
  async generateSleepPrediction(sleepHistory, ageInMonths, childData) {
    const now = new Date();

    // Obtener hora de despertar de hoy
    const wakeTimeInfo = await this.getWakeTimeForToday(childData.id, childData.userId);

    // Separar siestas y sueño nocturno
    const naps = sleepHistory.filter(s => s.type === 'nap');
    const nightSleeps = sleepHistory.filter(s => s.type === 'nightsleep');

    // 1. PREDECIR TODAS LAS SIESTAS DEL DÍA (usando hora de despertar)
    const dailyNapSchedule = this.predictDailyNaps(naps, now, ageInMonths, wakeTimeInfo);

    // 2. PREDECIR PRÓXIMA SIESTA (la más cercana que no ha pasado)
    const napPrediction = dailyNapSchedule.naps.find(nap => {
      const napTime = parseISO(nap.time);
      return napTime > now;
    }) || null;

    // 3. PREDECIR HORA DE DORMIR NOCTURNA (pasar historial completo para mejor predicción)
    const bedtimePrediction = this.predictBedtime(nightSleeps, ageInMonths, sleepHistory);

    // 4. ANALIZAR PATRONES DE SUEÑO
    const patterns = this.analyzeSleepPatterns(sleepHistory, ageInMonths);

    // 5. GENERAR RECOMENDACIONES
    const recommendations = this.generateRecommendations(
      patterns,
      ageInMonths,
      sleepHistory
    );

    // 6. CALCULAR PRESIÓN DE SUEÑO
    const sleepPressure = this.calculateSleepPressure(sleepHistory, now);

    // 7. OBTENER SIESTAS YA REGISTRADAS HOY (HECHOS)
    const todayStart = startOfDay(now);
    const napsToday = naps.filter(nap => {
      const napDate = parseISO(nap.startTime);
      return napDate >= todayStart;
    }).map((nap, index) => ({
      id: nap.id,
      time: nap.startTime,
      startTime: nap.startTime,
      endTime: nap.endTime,
      duration: nap.duration,
      actualDuration: nap.duration,
      quality: nap.quality,
      location: nap.location,
      pauses: nap.pauses || [],
      napNumber: index + 1,
      type: 'completed',
      status: 'completed',
      isReal: true
    }));

    // 8. OBTENER PREDICCIONES FUTURAS DEL DÍA ACTUAL
    const futurePredictions = dailyNapSchedule.naps
      .filter(predictedNap => {
        const predTime = parseISO(predictedNap.time);
        return predTime > now;
      })
      .map((predictedNap, index) => ({
        ...predictedNap,
        napNumber: napsToday.length + index + 1,
        type: 'prediction',
        status: 'upcoming',
        isReal: false
      }));

    // 9. COMBINAR HECHOS + PREDICCIONES EN UN SOLO ARRAY
    const allNapsOfDay = [
      ...napsToday,           // HECHOS (ya sucedieron)
      ...futurePredictions    // PREDICCIONES (futuras)
    ].sort((a, b) => parseISO(a.time).getTime() - parseISO(b.time).getTime());

    // 10. CALCULAR PROGRESO DEL DÍA
    const totalExpectedNaps = napsToday.length + futurePredictions.length;

    return {
      nextNap: napPrediction,
      dailySchedule: {
        date: format(now, 'yyyy-MM-dd'),
        allNaps: allNapsOfDay,  // ✅ Hechos + Predicciones juntos
        totalExpected: totalExpectedNaps,
        completed: napsToday.length,
        remaining: allNapsOfDay.filter(n => n.status === 'upcoming').length,
        progress: {
          completed: napsToday.length,
          total: totalExpectedNaps,
          percentage: Math.round((napsToday.length / totalExpectedNaps) * 100)
        }
      },
      bedtime: bedtimePrediction,
      patterns,
      recommendations,
      sleepPressure,
      predictedAt: now.toISOString(),
      confidence: this.calculateConfidence(sleepHistory, ageInMonths)
    };
  }

  /**
   * Predecir TODAS las siestas del día (horario completo)
   * Ahora usa la hora de despertar + wake windows por edad
   */
  predictDailyNaps(naps, now, ageInMonths, wakeTimeInfo = null) {
    // IMPORTANTE: Las fechas ya vienen en UTC desde Firestore
    // Pero necesitamos considerar la hora LOCAL del usuario
    
    // Obtener hora UTC actual
    const utcHour = now.getUTCHours() + now.getUTCMinutes() / 60;
    
    // Ajustar a UTC-6 (zona horaria del usuario)
    const localHour = ((utcHour - 6) + 24) % 24;
    
    // ✅ CAMBIO: Solo predecir para mañana si ya es MUY tarde (después de las 9 PM)
    // Porque aún falta la hora de dormir de hoy (6-9 PM)
    const predictionDate = localHour >= 21 ? addDays(now, 1) : now;
    const todayStart = startOfDay(predictionDate);

    // Obtener número esperado de siestas por edad
    const expectedNaps = this.getExpectedNapsPerDay(ageInMonths);
    
    // Calcular número de siestas basado en patrones reales o edad
    let targetNapCount;
    
    // Si hay suficiente historial, analizar patrón real
    if (naps.length >= 21) {  // ✅ Aumentar a 21 (3 semanas) para mejor análisis
      // Contar siestas por día en el historial
      const napsByDay = {};
      naps.forEach(nap => {
        const day = format(parseISO(nap.startTime), 'yyyy-MM-dd');
        napsByDay[day] = (napsByDay[day] || 0) + 1;
      });
      
      const napsPerDay = Object.values(napsByDay);
      const avgNapsPerDay = Math.round(stats.mean(napsPerDay));
      
      // Usar el promedio real, pero dentro del rango esperado por edad
      targetNapCount = Math.min(
        Math.max(avgNapsPerDay, expectedNaps.min),
        expectedNaps.max
      );
    } else {
      // ✅ Sin suficiente historial, usar el MÁXIMO esperado por edad
      // Porque es mejor predecir más siestas y que no las tome, que predecir menos
      targetNapCount = expectedNaps.max;
      
      console.log(`[PREDICCIÓN] Poco historial (${naps.length} siestas). Usando máximo por edad: ${targetNapCount} siestas`);
    }

    // Obtener siestas ya registradas del día de predicción
    const napsOfPredictionDay = naps.filter(nap => {
      const napDate = parseISO(nap.startTime);
      return napDate >= todayStart && napDate < addDays(todayStart, 1);
    });

    // ✅ NUEVA LÓGICA: Si hay hora de despertar, calcular basándose en wake windows
    if (wakeTimeInfo && wakeTimeInfo.source !== 'error-default') {
      return this.predictDailyNapsFromWakeTime(wakeTimeInfo.time, predictionDate, ageInMonths, napsOfPredictionDay, targetNapCount, naps);
    }

    // Si hay suficiente historial, usar patrones aprendidos
    if (naps.length >= 7) {
      return this.predictDailyNapsFromPatterns(naps, predictionDate, ageInMonths, napsOfPredictionDay, targetNapCount);
    }

    // Si no hay suficiente historial, usar horarios por defecto (pero pasar naps para aprender duraciones)
    return this.predictDailyNapsFromDefaults(predictionDate, ageInMonths, napsOfPredictionDay, targetNapCount, naps);
  }

  /**
   * Predecir siestas basándose en hora de despertar + wake windows
   */
  predictDailyNapsFromWakeTime(wakeTime, predictionDate, ageInMonths, napsOfDay, targetNapCount, allNaps) {
    const wakeWindows = this.getWakeWindows(ageInMonths);
    const predictedNaps = [];
    
    console.log(`[WAKE TIME] Predicción basada en despertar: ${wakeTime.toISOString()}`);
    console.log(`[WAKE TIME] Wake windows: ${JSON.stringify(wakeWindows)}`);
    console.log(`[WAKE TIME] Target nap count: ${targetNapCount}`);
    
    // Comenzar desde la hora de despertar
    let currentTime = new Date(wakeTime);
    
    // Generar siestas basándose en wake windows
    for (let i = 0; i < targetNapCount; i++) {
      // Primera siesta: desde despertar + wake window
      // Siguientes: desde fin de siesta anterior + wake window
      const wakeWindow = wakeWindows.optimal;
      const napTime = new Date(currentTime);
      napTime.setMinutes(napTime.getMinutes() + (wakeWindow * 60));
      
      // Validar hora en UTC (considerar zona horaria)
      const napHourUTC = napTime.getUTCHours();
      const napHourLocal = ((napHourUTC - 6) + 24) % 24;
      
      console.log(`[WAKE TIME] Siesta ${i + 1}: ${napTime.toISOString()} (${napHourLocal}:${napTime.getUTCMinutes()} local)`);
      
      // Solo si es dentro de horario razonable (7 AM - 7 PM local)
      if (napHourLocal < 7 || napHourLocal >= 19) {
        console.log(`[WAKE TIME] Siesta ${i + 1} fuera de rango (${napHourLocal}h local), deteniendo`);
        break;
      }
      
      const napType = this.getNapTypeByTime(napHourLocal);
      
      // Aprender duración para este tipo de siesta
      const durationLearned = this.learnNapDuration(allNaps, napType, ageInMonths);
      const expectedDuration = typeof durationLearned === 'object' 
        ? durationLearned.duration 
        : durationLearned;
      
      predictedNaps.push({
        time: napTime.toISOString(),
        windowStart: addMinutes(napTime, -20).toISOString(),
        windowEnd: addMinutes(napTime, 20).toISOString(),
        expectedDuration,
        confidence: 80,
        napNumber: i + 1,
        type: napType,
        status: 'upcoming',
        basedOn: 'wake-time-windows'
      });
      
      // Actualizar currentTime para la próxima siesta
      // (hora actual de siesta + duración de siesta)
      currentTime = new Date(napTime);
      currentTime.setMinutes(currentTime.getMinutes() + expectedDuration);
    }
    
    console.log(`[WAKE TIME] Total siestas predichas: ${predictedNaps.length}`);
    
    return {
      naps: predictedNaps,
      totalNaps: predictedNaps.length,
      basedOn: 'wake-time',
      wakeTime: wakeTime.toISOString()
    };
  }

  /**
   * Predecir siestas basándose en patrones históricos REALES
   */
  predictDailyNapsFromPatterns(naps, predictionDate, ageInMonths, napsOfDay, targetNapCount) {
    const dayStart = startOfDay(predictionDate);
    const dayEnd = new Date(predictionDate);
    dayEnd.setHours(23, 59, 59, 999);
    
    // Analizar últimos 30 días para encontrar patrones
    const thirtyDaysAgo = subDays(now, 30);
    const recentNaps = naps.filter(nap => {
      const napDate = parseISO(nap.startTime);
      return napDate >= thirtyDaysAgo;
    });

    // Agrupar siestas por "slot" del día (mañana, mediodía, tarde)
    // usando clustering simple basado en hora
    const napSlots = [];
    
    recentNaps.forEach(nap => {
      const napDate = parseISO(nap.startTime);
      const napHour = napDate.getHours() + napDate.getMinutes() / 60;
      
      // Buscar si pertenece a un slot existente (±2 horas de tolerancia)
      let foundSlot = false;
      for (let slot of napSlots) {
        const avgSlotHour = stats.mean(slot.hours);
        if (Math.abs(napHour - avgSlotHour) <= 2) {
          slot.hours.push(napHour);
          slot.durations.push(nap.duration || 60);
          slot.count++;
          foundSlot = true;
          break;
        }
      }
      
      // Si no pertenece a ningún slot, crear uno nuevo
      if (!foundSlot) {
        napSlots.push({
          hours: [napHour],
          durations: [nap.duration || 60],
          count: 1
        });
      }
    });

    // Calcular promedios de cada slot y ordenar por hora
    const predictedSlots = napSlots
      .map(slot => ({
        avgHour: stats.mean(slot.hours),
        avgDuration: Math.round(stats.mean(slot.durations)),
        confidence: Math.min(90, 60 + slot.count * 5),
        frequency: slot.count
      }))
      .filter(slot => slot.avgHour >= 7 && slot.avgHour < 19) // Solo 7 AM - 7 PM
      .sort((a, b) => a.avgHour - b.avgHour)
      .slice(0, targetNapCount);

    // Generar predicciones para el día de predicción usando horarios REALES
    const predictedNaps = predictedSlots
      .map((slot, index) => {
        const napDate = new Date(predictionDate);
        napDate.setHours(Math.floor(slot.avgHour));
        napDate.setMinutes(Math.round((slot.avgHour % 1) * 60));
        napDate.setSeconds(0);

        const napType = this.getNapTypeByTime(slot.avgHour);
        
        // APRENDER duración específica para este tipo
        const durationLearned = this.learnNapDuration(naps, napType, ageInMonths);
        const expectedDuration = typeof durationLearned === 'object' 
          ? durationLearned.duration 
          : durationLearned;

        return {
          time: napDate.toISOString(),
          windowStart: addMinutes(napDate, -30).toISOString(),
          windowEnd: addMinutes(napDate, 30).toISOString(),
          expectedDuration,
          confidence: slot.confidence,
          napNumber: index + 1,
          type: napType,
          status: 'upcoming',
          basedOnFrequency: slot.frequency
        };
      });

    return {
      naps: predictedNaps,
      totalNaps: predictedNaps.length,
      basedOn: 'learned-patterns'
    };
  }

  /**
   * Predecir siestas usando horarios por defecto
   */
  predictDailyNapsFromDefaults(predictionDate, ageInMonths, napsOfDay, targetNapCount, allNaps = []) {
    const dayStart = startOfDay(predictionDate);
    const dayEnd = new Date(predictionDate);
    dayEnd.setHours(23, 59, 59, 999);
    
    const schedule = this.getDefaultScheduleByAge(ageInMonths);
    const defaultNaps = schedule.naps;

    // IMPORTANTE: Tomar solo la cantidad de siestas esperadas por edad
    // Si targetNapCount es mayor que las siestas por defecto, usar todas las disponibles
    const napsToUse = Math.min(targetNapCount, defaultNaps.length);

    const predictedNaps = defaultNaps
      .slice(0, napsToUse)  // ✅ Usar el número correcto por edad
      .map((napTime, index) => {
        const napDate = this.parseDefaultTime(napTime, predictionDate);
        
        const hour = napDate.getHours() + napDate.getMinutes() / 60;
        const napType = this.getNapTypeByTime(hour);

        // ✅ APRENDER duración real del bebé (si hay historial)
        const durationLearned = this.learnNapDuration(allNaps, napType, ageInMonths);
        const expectedDuration = typeof durationLearned === 'object' 
          ? durationLearned.duration 
          : durationLearned;

        return {
          time: napDate.toISOString(),
          windowStart: addMinutes(napDate, -30).toISOString(),
          windowEnd: addMinutes(napDate, 30).toISOString(),
          expectedDuration,
          confidence: 40,
          napNumber: index + 1,
          type: napType,
          status: 'upcoming'
        };
      });

    return {
      naps: predictedNaps,
      totalNaps: predictedNaps.length,
      basedOn: 'defaults',
      expectedByAge: targetNapCount
    };
  }

  /**
   * Obtener tipo de siesta según la hora
   */
  getNapTypeByTime(hour) {
    if (hour >= 7 && hour < 11) return 'Siesta de la mañana';
    if (hour >= 11 && hour < 15) return 'Siesta del mediodía';
    if (hour >= 15 && hour < 19) return 'Siesta de la tarde';
    return 'Siesta';
  }

  /**
   * Parsear tiempo por defecto (ej: "9:00 AM")
   */
  parseDefaultTime(timeStr, baseDate) {
    const [hourMin, period] = timeStr.split(' ');
    const [hour, min] = hourMin.split(':');
    let hour24 = parseInt(hour);
    
    if (period === 'PM' && hour24 !== 12) hour24 += 12;
    if (period === 'AM' && hour24 === 12) hour24 = 0;
    
    const date = new Date(baseDate);
    date.setHours(hour24, parseInt(min) || 0, 0, 0);
    return date;
  }

  /**
   * Predecir próxima siesta usando ventanas de sueño
   */
  predictNextNap(naps, now, ageInMonths) {
    // Si no hay siestas registradas, usar horarios por defecto
    if (naps.length === 0) {
      const defaults = this.getDefaultNapSchedule(ageInMonths);
      const nextDefault = this.findNextDefaultNap(defaults, now);
      
      // ✅ APRENDER duración incluso sin historial (usa edad por defecto)
      const durationLearned = this.learnNapDuration(naps, null, ageInMonths);
      const expectedDuration = typeof durationLearned === 'object' 
        ? durationLearned.duration 
        : durationLearned;
      
      return {
        time: nextDefault,
        confidence: 30,
        reason: 'Basado en horarios típicos para la edad',
        windowStart: addMinutes(parseISO(nextDefault), -30).toISOString(),
        windowEnd: addMinutes(parseISO(nextDefault), 30).toISOString(),
        expectedDuration,
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
        
        // ✅ APRENDER duración para siesta de la mañana
        const durationLearned = this.learnNapDuration(naps, 'Mañana', ageInMonths);
        const expectedDuration = typeof durationLearned === 'object' 
          ? durationLearned.duration 
          : durationLearned;
        
        return {
          time: tomorrowMorning.toISOString(),
          windowStart: addMinutes(tomorrowMorning, -30).toISOString(),
          windowEnd: addMinutes(tomorrowMorning, 30).toISOString(),
          expectedDuration,
          confidence: 70,
          type: 'Próxima siesta (mañana)',
          reason: `Última siesta fue tarde (${lastNapEnd.toLocaleTimeString()}). Próxima siesta mañana por la mañana`
        };
      }
      
      // ✅ APRENDER duración general
      const durationLearned = this.learnNapDuration(naps, null, ageInMonths);
      const expectedDuration = typeof durationLearned === 'object' 
        ? durationLearned.duration 
        : durationLearned;
      
      return {
        time: nextNapTime.toISOString(),
        windowStart: addMinutes(nextNapTime, -20).toISOString(),
        windowEnd: addMinutes(nextNapTime, 20).toISOString(),
        expectedDuration,
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

      // ✅ APRENDER duración del tipo de siesta específico
      const durationLearned = this.learnNapDuration(naps, napType, ageInMonths);
      const expectedDuration = typeof durationLearned === 'object' 
        ? durationLearned.duration 
        : durationLearned;

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
        // ✅ APRENDER duración
        const durationLearned = this.learnNapDuration(naps, null, ageInMonths);
        const expectedDuration = typeof durationLearned === 'object' 
          ? durationLearned.duration 
          : durationLearned;
        
        return {
          time: nextNapByWindow.toISOString(),
          windowStart: addMinutes(nextNapByWindow, -20).toISOString(),
          windowEnd: addMinutes(nextNapByWindow, 20).toISOString(),
          expectedDuration,
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

    // ✅ APRENDER duración del tipo de siesta específico
    const durationLearned = this.learnNapDuration(naps, napType, ageInMonths);
    const expectedDuration = typeof durationLearned === 'object' 
      ? durationLearned.duration 
      : durationLearned;

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
  predictBedtime(nightSleeps, ageInMonths, allSleepHistory = []) {
    // PRIMERO: Calcular basándose en las siestas de HOY
    const today = startOfDay(new Date());
    const napsToday = allSleepHistory
      .filter(s => s.type === 'nap' && s.endTime)
      .filter(s => {
        const napDate = parseISO(s.startTime);
        return napDate >= today;
      })
      .sort((a, b) => parseISO(b.endTime).getTime() - parseISO(a.endTime).getTime());
    
    // Si hay siestas HOY, calcular hora de dormir basándose en la ÚLTIMA siesta
    if (napsToday.length > 0) {
      const lastNapToday = napsToday[0];
      const lastNapEnd = parseISO(lastNapToday.endTime);
      const lastNapHour = lastNapEnd.getHours() + lastNapEnd.getMinutes() / 60;
      
      // Calcular hora de dormir: última siesta + 2.5-3 horas
      // Ajustar según edad (bebés más pequeños duermen antes)
      let hoursAfterNap = 2.75; // Por defecto
      if (ageInMonths <= 3) hoursAfterNap = 2.5;
      if (ageInMonths >= 12) hoursAfterNap = 3.0;
      
      let bedtimeHour = lastNapHour + hoursAfterNap;
      
      // Ajustar al rango válido (6 PM - 9 PM) EN HORA LOCAL
      if (bedtimeHour < 18) bedtimeHour = 18;
      if (bedtimeHour > 21) bedtimeHour = 21;
      
      // ✅ Crear fecha para HOY en UTC
      // lastNapEnd ya está en UTC, así que usamos su fecha base
      const bedtimeDate = new Date(lastNapEnd);
      bedtimeDate.setUTCHours(Math.floor(bedtimeHour), Math.round((bedtimeHour % 1) * 60), 0, 0);
      
      // Si ya pasó, programar para mañana
      const now = new Date();
      if (bedtimeDate <= now) {
        bedtimeDate.setUTCDate(bedtimeDate.getUTCDate() + 1);
      }
      
      const lastNapEndFormatted = format(lastNapEnd, 'h:mm a');
      
      return {
        time: bedtimeDate.toISOString(),
        confidence: 75,
        reason: `Última siesta hoy: ${lastNapEndFormatted} + ${hoursAfterNap}h`,
        basedOn: 'today-naps',
        lastNapEnd: lastNapEnd.toISOString()
      };
    }
    
    // SEGUNDO: Si no hay datos de sueño nocturno, usar horarios por defecto
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
      '0-1': {
        naps: ['8:00 AM', '10:30 AM', '1:00 PM', '3:30 PM', '5:30 PM', '7:00 PM'],
        bedtime: '8:00 PM',
        totalSleep: 16
      },
      '2-3': {
        naps: ['8:30 AM', '11:00 AM', '1:30 PM', '4:00 PM', '6:00 PM'],
        bedtime: '7:30 PM',
        totalSleep: 15
      },
      '4-6': {
        naps: ['8:30 AM', '11:30 AM', '2:30 PM', '5:30 PM'],  // ✅ 4 siestas
        bedtime: '7:00 PM',
        totalSleep: 15
      },
      '7-9': {
        naps: ['9:30 AM', '1:30 PM', '5:00 PM'],
        bedtime: '7:00 PM',
        totalSleep: 14
      },
      '10-12': {
        naps: ['10:00 AM', '2:30 PM'],
        bedtime: '7:00 PM',
        totalSleep: 14
      },
      '13-18': {
        naps: ['12:30 PM', '4:30 PM'],
        bedtime: '7:30 PM',
        totalSleep: 13
      },
      '19-36': {
        naps: ['1:00 PM'],
        bedtime: '8:00 PM',
        totalSleep: 12
      },
      '37+': {
        naps: ['2:00 PM'],
        bedtime: '8:00 PM',
        totalSleep: 11
      }
    };

    if (ageInMonths <= 1) return schedules['0-1'];
    if (ageInMonths <= 3) return schedules['2-3'];
    if (ageInMonths <= 6) return schedules['4-6'];
    if (ageInMonths <= 9) return schedules['7-9'];
    if (ageInMonths <= 12) return schedules['10-12'];
    if (ageInMonths <= 18) return schedules['13-18'];
    if (ageInMonths <= 36) return schedules['19-36'];
    return schedules['37+'];
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

  /**
   * Obtener duración típica de siesta por defecto (cuando no hay historial)
   */
  getTypicalNapDuration(ageInMonths) {
    if (ageInMonths <= 3) return 45;
    if (ageInMonths <= 6) return 60;
    if (ageInMonths <= 12) return 75;
    if (ageInMonths <= 24) return 90;
    return 60; // Niños mayores tienden a dormir siestas más cortas
  }

  /**
   * APRENDER duración real de siestas del bebé basándose en historial
   */
  learnNapDuration(naps, napType, ageInMonths) {
    // Si no hay historial suficiente, usar duración por defecto
    if (!naps || naps.length < 3) {
      return this.getTypicalNapDuration(ageInMonths);
    }

    // Filtrar solo siestas recientes (últimos 30 días)
    const thirtyDaysAgo = subDays(new Date(), 30);
    const recentNaps = naps.filter(nap => {
      const napDate = parseISO(nap.startTime);
      return napDate >= thirtyDaysAgo && nap.type === 'nap' && nap.duration > 0;
    });

    if (recentNaps.length === 0) {
      return this.getTypicalNapDuration(ageInMonths);
    }

    // Si se especifica un tipo de siesta (mañana, mediodía, tarde), filtrar por hora
    let relevantNaps = recentNaps;
    
    if (napType) {
      const napTypeHour = this.getNapTypeHour(napType);
      if (napTypeHour) {
        relevantNaps = recentNaps.filter(nap => {
          const hour = parseISO(nap.startTime).getHours();
          return Math.abs(hour - napTypeHour) <= 3; // ±3 horas de tolerancia
        });
      }
    }

    // Si después del filtro no hay siestas, usar todas las recientes
    if (relevantNaps.length === 0) {
      relevantNaps = recentNaps;
    }

    // Calcular duración promedio REAL del bebé
    const durations = relevantNaps.map(nap => nap.duration || nap.netDuration || 0);
    const avgDuration = Math.round(stats.mean(durations));
    const stdDev = durations.length > 1 ? Math.round(stats.standardDeviation(durations)) : 0;

    // Si la desviación estándar es muy alta, dar más peso al promedio
    const confidence = durations.length >= 5 ? 85 : 65;

    return {
      duration: avgDuration,
      min: Math.max(15, avgDuration - stdDev), // Mínimo 15 minutos
      max: avgDuration + stdDev,
      confidence,
      sampleSize: relevantNaps.length,
      basedOn: napType ? `Siestas tipo ${napType}` : 'Todas las siestas'
    };
  }

  /**
   * Obtener hora típica según tipo de siesta
   */
  getNapTypeHour(napType) {
    const typeMapping = {
      'Siesta de la mañana': 9,
      'Mañana': 9,
      'Siesta del mediodía': 13,
      'Mediodía': 13,
      'Siesta de la tarde': 16,
      'Tarde': 16,
      'Siesta de la noche': 18,
      'Noche': 18
    };
    return typeMapping[napType] || null;
  }

  getExpectedSleepByAge(ageInMonths) {
    if (ageInMonths <= 3) return { min: 840, max: 1020 }; // 14-17 horas
    if (ageInMonths <= 6) return { min: 780, max: 960 };  // 13-16 horas
    if (ageInMonths <= 12) return { min: 720, max: 900 }; // 12-15 horas
    if (ageInMonths <= 24) return { min: 660, max: 840 }; // 11-14 horas
    return { min: 600, max: 780 }; // 10-13 horas
  }

  getExpectedNapsPerDay(ageInMonths) {
    // Basado en recomendaciones pediátricas reales
    if (ageInMonths <= 1) return { min: 4, max: 6 };  // Recién nacidos: 4-6 siestas
    if (ageInMonths <= 3) return { min: 4, max: 5 };  // 2-3 meses: 4-5 siestas
    if (ageInMonths <= 6) return { min: 3, max: 4 };  // 4-6 meses: 3-4 siestas
    if (ageInMonths <= 9) return { min: 2, max: 3 };  // 7-9 meses: 2-3 siestas
    if (ageInMonths <= 12) return { min: 2, max: 2 }; // 10-12 meses: 2 siestas
    if (ageInMonths <= 18) return { min: 1, max: 2 }; // 13-18 meses: 1-2 siestas
    if (ageInMonths <= 36) return { min: 1, max: 1 }; // 19-36 meses: 1 siesta
    return { min: 0, max: 1 };                         // 3+ años: 0-1 siesta
  }

  mapQualityScore(score) {
    if (score >= 3.5) return 'Excelente';
    if (score >= 2.5) return 'Buena';
    if (score >= 1.5) return 'Regular';
    return 'Baja';
  }
}

module.exports = new SleepPredictionController();

