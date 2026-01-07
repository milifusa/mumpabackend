/**
 * 🧠 MODELO DE MACHINE LEARNING PARA PREDICCIÓN DE SUEÑO
 * 
 * Usa ML.js para aprender automáticamente de los datos del bebé
 * - Regresión múltiple para predecir horarios
 * - Aprendizaje continuo con cada nuevo dato
 * - Predicciones personalizadas por edad y patrones
 */

const { MultivariateLinearRegression } = require('ml-regression-multivariate');
const { Matrix } = require('ml-matrix');

class SleepMLModel {
  constructor() {
    this.napTimeModel = null;      // Modelo para predecir hora de siesta
    this.napDurationModel = null;   // Modelo para predecir duración de siesta
    this.bedtimeModel = null;       // Modelo para predecir hora de dormir
    this.minTrainingData = 7;       // Mínimo 7 días para entrenar
  }

  /**
   * 🎓 ENTRENA el modelo con historial de sueño
   */
  async train(sleepHistory, ageInMonths) {
    try {
      console.log(`🧠 [ML] Entrenando modelo con ${sleepHistory.length} eventos...`);

      if (sleepHistory.length < this.minTrainingData) {
        console.log(`⚠️ [ML] Datos insuficientes (${sleepHistory.length}). Mínimo: ${this.minTrainingData}`);
        return { success: false, reason: 'insufficient_data' };
      }

      // Separar naps y nights
      const naps = sleepHistory.filter(s => s.type === 'nap' && s.endTime);
      const nights = sleepHistory.filter(s => s.type === 'night' && s.endTime);

      if (naps.length < 5) {
        console.log(`⚠️ [ML] Pocas siestas (${naps.length}). Mínimo: 5`);
        return { success: false, reason: 'insufficient_naps' };
      }

      // 1. ENTRENAR MODELO DE TIEMPO DE SIESTA
      this.napTimeModel = this.trainNapTimeModel(naps, ageInMonths);

      // 2. ENTRENAR MODELO DE DURACIÓN DE SIESTA
      this.napDurationModel = this.trainNapDurationModel(naps, ageInMonths);

      // 3. ENTRENAR MODELO DE HORA DE DORMIR
      if (nights.length >= 3) {
        this.bedtimeModel = this.trainBedtimeModel(nights, naps, ageInMonths);
      }

      console.log(`✅ [ML] Modelos entrenados exitosamente`);
      return { 
        success: true, 
        models: {
          napTime: !!this.napTimeModel,
          napDuration: !!this.napDurationModel,
          bedtime: !!this.bedtimeModel
        }
      };

    } catch (error) {
      console.error(`❌ [ML] Error entrenando modelo:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * ⏰ MODELO: Predice HORA de siesta
   * Features: [edad_meses, hora_despertar, siesta_numero, dia_semana, hora_ultima_siesta]
   */
  trainNapTimeModel(naps, ageInMonths) {
    const features = [];
    const targets = [];

    // Agrupar siestas por día
    const napsByDay = this.groupByDay(naps);

    for (const [date, dayNaps] of Object.entries(napsByDay)) {
      dayNaps.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

      // Hora de despertar (primera siesta del día - 2 horas)
      const firstNapTime = new Date(dayNaps[0].startTime);
      const wakeTime = new Date(firstNapTime.getTime() - 2 * 60 * 60 * 1000);
      const wakeHour = wakeTime.getHours() + wakeTime.getMinutes() / 60;

      dayNaps.forEach((nap, index) => {
        const napStart = new Date(nap.startTime);
        const napHour = napStart.getHours() + napStart.getMinutes() / 60;
        const dayOfWeek = napStart.getDay();

        // Hora de última siesta (0 si es la primera)
        let lastNapHour = 0;
        if (index > 0) {
          const prevNap = dayNaps[index - 1];
          const prevNapEnd = new Date(prevNap.endTime);
          lastNapHour = prevNapEnd.getHours() + prevNapEnd.getMinutes() / 60;
        }

        features.push([
          ageInMonths,           // Edad del bebé
          wakeHour,              // Hora de despertar
          index + 1,             // Número de siesta (1, 2, 3...)
          dayOfWeek,             // Día de la semana
          lastNapHour            // Hora de última siesta
        ]);

        targets.push([napHour]); // Target: hora de la siesta
      });
    }

    if (features.length < 5) {
      return null;
    }

    const X = new Matrix(features);
    const Y = new Matrix(targets);

    const model = new MultivariateLinearRegression(X, Y);
    
    console.log(`✅ [ML] Modelo de tiempo entrenado con ${features.length} siestas`);
    return model;
  }

  /**
   * ⏱️ MODELO: Predice DURACIÓN de siesta
   * Features: [edad_meses, hora_siesta, numero_siesta, duracion_ultima_siesta]
   */
  trainNapDurationModel(naps, ageInMonths) {
    const features = [];
    const targets = [];

    const napsByDay = this.groupByDay(naps);

    for (const [date, dayNaps] of Object.entries(napsByDay)) {
      dayNaps.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

      dayNaps.forEach((nap, index) => {
        const napStart = new Date(nap.startTime);
        const napHour = napStart.getHours() + napStart.getMinutes() / 60;

        // Duración de última siesta (60 min por defecto)
        let lastNapDuration = 60;
        if (index > 0) {
          lastNapDuration = dayNaps[index - 1].duration || 60;
        }

        features.push([
          ageInMonths,           // Edad del bebé
          napHour,               // Hora de la siesta
          index + 1,             // Número de siesta
          lastNapDuration        // Duración de última siesta
        ]);

        targets.push([nap.duration || 60]); // Target: duración en minutos
      });
    }

    if (features.length < 5) {
      return null;
    }

    const X = new Matrix(features);
    const Y = new Matrix(targets);

    const model = new MultivariateLinearRegression(X, Y);
    
    console.log(`✅ [ML] Modelo de duración entrenado con ${features.length} siestas`);
    return model;
  }

  /**
   * 🌙 MODELO: Predice HORA DE DORMIR
   * Features: [edad_meses, hora_ultima_siesta, total_siestas_dia, duracion_total_siestas]
   */
  trainBedtimeModel(nights, naps, ageInMonths) {
    const features = [];
    const targets = [];

    nights.forEach(night => {
      const nightStart = new Date(night.startTime);
      const nightHour = nightStart.getHours() + nightStart.getMinutes() / 60;
      
      // Buscar siestas del mismo día
      const dateStr = nightStart.toISOString().split('T')[0];
      const dayNaps = naps.filter(nap => {
        const napDate = new Date(nap.startTime).toISOString().split('T')[0];
        return napDate === dateStr;
      });

      if (dayNaps.length > 0) {
        dayNaps.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
        const lastNap = dayNaps[dayNaps.length - 1];
        const lastNapEnd = new Date(lastNap.endTime);
        const lastNapHour = lastNapEnd.getHours() + lastNapEnd.getMinutes() / 60;

        const totalNaps = dayNaps.length;
        const totalNapDuration = dayNaps.reduce((sum, nap) => sum + (nap.duration || 0), 0);

        features.push([
          ageInMonths,           // Edad del bebé
          lastNapHour,           // Hora de última siesta
          totalNaps,             // Total de siestas del día
          totalNapDuration       // Duración total de siestas
        ]);

        targets.push([nightHour]); // Target: hora de dormir
      }
    });

    if (features.length < 3) {
      return null;
    }

    const X = new Matrix(features);
    const Y = new Matrix(targets);

    const model = new MultivariateLinearRegression(X, Y);
    
    console.log(`✅ [ML] Modelo de bedtime entrenado con ${features.length} noches`);
    return model;
  }

  /**
   * 🔮 PREDICE siestas del día
   */
  predictDailyNaps(wakeTime, ageInMonths, napsCompletedToday = []) {
    if (!this.napTimeModel || !this.napDurationModel) {
      console.log(`⚠️ [ML] Modelos no entrenados, usando defaults`);
      return null;
    }

    const predictions = [];
    const wakeHour = wakeTime.getHours() + wakeTime.getMinutes() / 60;
    const dayOfWeek = wakeTime.getDay();
    
    // Determinar número de siestas esperadas por edad
    const targetNaps = this.getExpectedNapsCount(ageInMonths);
    const napsAlreadyDone = napsCompletedToday.length;

    console.log(`🔮 [ML] Prediciendo ${targetNaps - napsAlreadyDone} siestas restantes...`);

    let lastNapHour = wakeHour;
    let lastNapDuration = 60;

    // Si ya hay siestas completadas, usar la última
    if (napsAlreadyDone > 0) {
      const lastCompletedNap = napsCompletedToday[napsCompletedToday.length - 1];
      const lastEnd = new Date(lastCompletedNap.endTime);
      lastNapHour = lastEnd.getHours() + lastEnd.getMinutes() / 60;
      lastNapDuration = lastCompletedNap.duration || 60;
    }

    for (let napNumber = napsAlreadyDone + 1; napNumber <= targetNaps; napNumber++) {
      try {
        // PREDECIR HORA
        const timeFeatures = [[
          ageInMonths,
          wakeHour,
          napNumber,
          dayOfWeek,
          lastNapHour
        ]];
        const timeMatrix = new Matrix(timeFeatures);
        const predictedHour = this.napTimeModel.predict(timeMatrix).get(0, 0);

        // PREDECIR DURACIÓN
        const durationFeatures = [[
          ageInMonths,
          predictedHour,
          napNumber,
          lastNapDuration
        ]];
        const durationMatrix = new Matrix(durationFeatures);
        const predictedDuration = Math.round(this.napDurationModel.predict(durationMatrix).get(0, 0));

        // Validar hora (debe ser entre 6 AM y 8 PM)
        const validHour = Math.max(6, Math.min(20, predictedHour));

        // Crear fecha de predicción
        const napDate = new Date(wakeTime);
        napDate.setHours(Math.floor(validHour));
        napDate.setMinutes(Math.round((validHour % 1) * 60));
        napDate.setSeconds(0);
        napDate.setMilliseconds(0);

        // Asegurar que sea en el futuro
        const now = new Date();
        if (napDate <= now) {
          napDate.setTime(now.getTime() + 30 * 60 * 1000); // +30 minutos
        }

        predictions.push({
          napNumber,
          time: napDate.toISOString(),
          duration: Math.max(20, Math.min(180, predictedDuration)), // Entre 20 y 180 min
          confidence: 85, // Alta confianza con ML
          source: 'ml_model',
          type: this.getNapType(validHour)
        });

        // Actualizar para siguiente iteración
        lastNapHour = validHour + (predictedDuration / 60);
        lastNapDuration = predictedDuration;

      } catch (error) {
        console.error(`❌ [ML] Error prediciendo siesta ${napNumber}:`, error);
      }
    }

    console.log(`✅ [ML] Predichas ${predictions.length} siestas con ML`);
    return predictions;
  }

  /**
   * 🌙 PREDICE hora de dormir
   */
  predictBedtime(ageInMonths, napsToday) {
    if (!this.bedtimeModel || napsToday.length === 0) {
      return null;
    }

    try {
      const lastNap = napsToday[napsToday.length - 1];
      const lastNapEnd = new Date(lastNap.endTime);
      const lastNapHour = lastNapEnd.getHours() + lastNapEnd.getMinutes() / 60;

      const totalNaps = napsToday.length;
      const totalNapDuration = napsToday.reduce((sum, nap) => sum + (nap.duration || 0), 0);

      const features = [[
        ageInMonths,
        lastNapHour,
        totalNaps,
        totalNapDuration
      ]];

      const X = new Matrix(features);
      const predictedHour = this.bedtimeModel.predict(X).get(0, 0);

      // Validar hora (entre 6 PM y 10 PM)
      const validHour = Math.max(18, Math.min(22, predictedHour));

      const bedtime = new Date();
      bedtime.setHours(Math.floor(validHour));
      bedtime.setMinutes(Math.round((validHour % 1) * 60));
      bedtime.setSeconds(0);
      bedtime.setMilliseconds(0);

      // Si ya pasó hoy, mover a mañana
      if (bedtime <= new Date()) {
        bedtime.setDate(bedtime.getDate() + 1);
      }

      console.log(`✅ [ML] Bedtime predicha: ${bedtime.toISOString()}`);

      return {
        time: bedtime.toISOString(),
        confidence: 80,
        source: 'ml_model',
        reason: `Basado en ${totalNaps} siestas del día (ML)`
      };

    } catch (error) {
      console.error(`❌ [ML] Error prediciendo bedtime:`, error);
      return null;
    }
  }

  /**
   * 📊 GENERA recomendaciones inteligentes basadas en ML
   */
  generateMLRecommendations(sleepHistory, predictions, ageInMonths) {
    const recommendations = [];

    // Analizar patrones con ML
    const naps = sleepHistory.filter(s => s.type === 'nap' && s.endTime);
    const nights = sleepHistory.filter(s => s.type === 'night' && s.endTime);

    if (naps.length >= 7) {
      // 1. CONSISTENCIA DE HORARIOS
      const napsByDay = this.groupByDay(naps);
      const dailyCounts = Object.values(napsByDay).map(dayNaps => dayNaps.length);
      const avgNapsPerDay = dailyCounts.reduce((a, b) => a + b, 0) / dailyCounts.length;
      const variance = dailyCounts.reduce((sum, count) => sum + Math.pow(count - avgNapsPerDay, 2), 0) / dailyCounts.length;

      if (variance > 1) {
        recommendations.push({
          type: 'warning',
          category: 'consistency',
          title: '📊 Variabilidad en número de siestas',
          message: `Algunos días tiene ${Math.max(...dailyCounts)} siestas y otros ${Math.min(...dailyCounts)}`,
          action: 'Intenta mantener un número consistente de siestas diarias',
          confidence: 90,
          source: 'ml_analysis'
        });
      }

      // 2. DURACIÓN ÓPTIMA
      const avgDuration = naps.reduce((sum, nap) => sum + (nap.duration || 0), 0) / naps.length;
      const expectedDuration = this.getExpectedNapDuration(ageInMonths);

      if (avgDuration < expectedDuration * 0.7) {
        recommendations.push({
          type: 'info',
          category: 'duration',
          title: '⏱️ Siestas más cortas de lo ideal',
          message: `Duración promedio: ${Math.round(avgDuration)} min. Ideal: ${expectedDuration} min`,
          action: 'Intenta crear un ambiente más oscuro y tranquilo',
          confidence: 85,
          source: 'ml_analysis'
        });
      }

      // 3. REGULARIDAD DE HORARIOS
      const napsByNumber = {};
      Object.values(napsByDay).forEach(dayNaps => {
        dayNaps.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
        dayNaps.forEach((nap, index) => {
          if (!napsByNumber[index + 1]) napsByNumber[index + 1] = [];
          const hour = new Date(nap.startTime).getHours() + new Date(nap.startTime).getMinutes() / 60;
          napsByNumber[index + 1].push(hour);
        });
      });

      Object.entries(napsByNumber).forEach(([napNum, hours]) => {
        if (hours.length >= 3) {
          const avg = hours.reduce((a, b) => a + b, 0) / hours.length;
          const stdDev = Math.sqrt(hours.reduce((sum, h) => sum + Math.pow(h - avg, 2), 0) / hours.length);
          
          if (stdDev > 1.5) {
            recommendations.push({
              type: 'tip',
              category: 'timing',
              title: `🕐 Siesta ${napNum} varía mucho`,
              message: `Oscila entre ${this.formatHour(Math.min(...hours))} y ${this.formatHour(Math.max(...hours))}`,
              action: 'Intenta mantener horarios más regulares para esta siesta',
              confidence: 80,
              source: 'ml_analysis'
            });
          }
        }
      });
    }

    // 4. CALIDAD DEL SUEÑO NOCTURNO
    if (nights.length >= 3) {
      const avgNightDuration = nights.reduce((sum, n) => sum + (n.duration || 0), 0) / nights.length;
      const expectedNightDuration = this.getExpectedNightDuration(ageInMonths);

      if (avgNightDuration < expectedNightDuration * 60 * 0.8) {
        recommendations.push({
          type: 'warning',
          category: 'night_sleep',
          title: '🌙 Sueño nocturno insuficiente',
          message: `Promedio: ${Math.round(avgNightDuration / 60)}h. Ideal: ${expectedNightDuration}h`,
          action: 'Adelanta la hora de dormir 30 minutos',
          confidence: 85,
          source: 'ml_analysis'
        });
      }
    }

    console.log(`✅ [ML] Generadas ${recommendations.length} recomendaciones ML`);
    return recommendations;
  }

  // ═══════════════════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════════════════

  groupByDay(sleepEvents) {
    const byDay = {};
    sleepEvents.forEach(event => {
      const date = new Date(event.startTime).toISOString().split('T')[0];
      if (!byDay[date]) byDay[date] = [];
      byDay[date].push(event);
    });
    return byDay;
  }

  getExpectedNapsCount(ageInMonths) {
    if (ageInMonths < 4) return 4;
    if (ageInMonths < 6) return 4;
    if (ageInMonths < 9) return 3;
    if (ageInMonths < 12) return 2;
    if (ageInMonths < 18) return 2;
    return 1;
  }

  getExpectedNapDuration(ageInMonths) {
    if (ageInMonths < 6) return 60;
    if (ageInMonths < 12) return 75;
    return 90;
  }

  getExpectedNightDuration(ageInMonths) {
    if (ageInMonths < 4) return 10;
    if (ageInMonths < 12) return 11;
    return 11;
  }

  getNapType(hour) {
    if (hour < 10) return 'morning';
    if (hour < 14) return 'midday';
    if (hour < 17) return 'afternoon';
    return 'evening';
  }

  formatHour(hour) {
    const h = Math.floor(hour);
    const m = Math.round((hour % 1) * 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  }
}

module.exports = new SleepMLModel();

