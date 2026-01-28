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
const sleepMLModel = require('../ml/sleepMLModel'); // 🧠 MODELO DE MACHINE LEARNING
const TimezoneHelper = require('../utils/timezoneHelper'); // 🌍 HELPER DE ZONAS HORARIAS
const OpenAI = require('openai'); // 🤖 CHATGPT PARA MEJORAR PREDICCIONES
const { 
  parseISO, 
  differenceInMinutes, 
  differenceInHours,
  addMinutes,
  addHours,
  addDays,
  subDays,
  subHours,
  format,
  startOfDay,
  isToday
} = require('date-fns');

class SleepPredictionController {
  constructor() {
    this.db = admin.firestore();
    this.openai = null;
    this.initOpenAI();
  }

  /**
   * Inicializar conexión a OpenAI
   */
  initOpenAI() {
    try {
      if (process.env.OPENAI_API_KEY) {
        this.openai = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY
        });
        console.log('🤖 [SLEEP AI] OpenAI inicializado para predicciones mejoradas');
      } else {
        console.log('⚠️ [SLEEP AI] OpenAI no disponible - usando predicciones estadísticas');
      }
    } catch (error) {
      console.error('❌ [SLEEP AI] Error inicializando OpenAI:', error.message);
    }
  }

  /**
   * 🤖 CONSULTAR A CHATGPT PARA MEJORAR PREDICCIONES
   * Usa bases de datos de patrones de sueño infantil
   */
  async enhancePredictionsWithAI(childInfo, currentNaps, wakeTime, userTimezone) {
    // Si no hay OpenAI, retornar null (usar predicciones estadísticas)
    if (!this.openai) {
      console.log('⚠️ [AI PREDICTION] OpenAI no inicializado - usando fallback estadístico');
      return null;
    }

    try {
      const now = new Date();
      const localTime = TimezoneHelper.utcToUserTime(now, userTimezone);
      const currentHour = localTime.getHours() + localTime.getMinutes() / 60;
      const timezoneOffset = TimezoneHelper.getTimezoneOffset(userTimezone);

      // ✅ Obtener datos pediátricos específicos
      const expectedNaps = this.getExpectedNapsPerDay(childInfo.ageInMonths);
      const wakeWindows = this.getWakeWindows(childInfo.ageInMonths);

      // 🔄 CALCULAR CUÁNTAS SIESTAS CABEN REALMENTE basándose en hora de despertar
      const wakeTimeLocal = wakeTime ? TimezoneHelper.utcToUserTime(new Date(wakeTime), userTimezone) : null;
      const wakeHour = wakeTimeLocal ? wakeTimeLocal.getHours() + wakeTimeLocal.getMinutes() / 60 : 7; // Default 7 AM
      
      // Hora de dormir óptima para esta edad (7:30 PM para 4-6 meses)
      let optimalBedtime;
      if (childInfo.ageInMonths <= 6) {
        optimalBedtime = 19.5; // 7:30 PM
      } else if (childInfo.ageInMonths <= 12) {
        optimalBedtime = 20; // 8:00 PM
      } else {
        optimalBedtime = 20.5; // 8:30 PM
      }
      
      // Calcular horas disponibles TOTALES del día (desde despertar hasta bedtime)
      const totalHoursInDay = optimalBedtime - wakeHour;
      
      // Calcular cuántas siestas caben EN TOTAL en el día
      const avgNapDuration = childInfo.ageInMonths <= 6 ? 1.25 : 1.5; // horas
      const cycleTime = wakeWindows.optimal + avgNapDuration; // tiempo total entre siestas
      
      // ✅ REDONDEAR AL MÁS CERCANO en lugar de floor (más realista)
      // Si quedan 3.8 ciclos, es más realista recomendar 4 siestas que 3
      const theoreticalNapsTotalDay = Math.round(totalHoursInDay / cycleTime);
      
      // Ajustar al rango esperado por edad para obtener TOTAL de siestas del día
      const totalNapsForDay = Math.min(
        Math.max(theoreticalNapsTotalDay, expectedNaps.min),
        expectedNaps.max
      );
      
      // 🎯 CALCULAR SIESTAS RESTANTES (lo importante)
      const remainingNapsNeeded = Math.max(0, totalNapsForDay - currentNaps.length);

      console.log('🤖 [AI PREDICTION] Preparando consulta a ChatGPT...');
      console.log(`   - Edad: ${childInfo.ageInMonths} meses`);
      console.log(`   - Hora actual: ${localTime.toLocaleString('es-MX')}`);
      console.log(`   - Hora de despertar: ${wakeHour.toFixed(2)}h`);
      console.log(`   - Horas totales del día: ${totalHoursInDay.toFixed(2)}h`);
      console.log(`   - Siestas que caben en el día: ${theoreticalNapsTotalDay}`);
      console.log(`   - Total de siestas para HOY: ${totalNapsForDay} (ajustado de ${expectedNaps.min}-${expectedNaps.max})`);
      console.log(`   - Siestas completadas: ${currentNaps.length}`);
      console.log(`   - Siestas RESTANTES a predecir: ${remainingNapsNeeded}`);
      console.log(`   - Ventanas de vigilia: ${wakeWindows.min}-${wakeWindows.max}h`);

      // ✅ Construir prompt mejorado con datos pediátricos explícitos
      const prompt = `Eres un experto en patrones de sueño infantil con acceso a bases de datos pediátricas (AAP, NSF, CDC).

INFORMACIÓN DEL BEBÉ:
- Edad: ${childInfo.ageInMonths} meses
- Timezone: UTC${timezoneOffset >= 0 ? '+' : ''}${timezoneOffset}
- Hora actual: ${localTime.toLocaleString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: true })} (${currentHour.toFixed(2)}h)
- Hora de despertar hoy: ${wakeTimeLocal ? wakeTimeLocal.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: true }) : 'No registrada'} (${wakeHour.toFixed(2)}h)
- Hora de dormir objetivo: ${Math.floor(optimalBedtime)}:${Math.round((optimalBedtime % 1) * 60).toString().padStart(2, '0')} (${optimalBedtime.toFixed(2)}h)
- Horas totales del día: ${totalHoursInDay.toFixed(2)} horas

DATOS PEDIÁTRICOS PARA ${childInfo.ageInMonths} MESES:
- Siestas típicas por día: ${expectedNaps.min} a ${expectedNaps.max} siestas
- Ventana de vigilia óptima: ${wakeWindows.optimal} horas
- Ventana de vigilia mínima: ${wakeWindows.min} horas
- Ventana de vigilia máxima: ${wakeWindows.max} horas

ANÁLISIS DEL DÍA DE HOY:
- Despertó a las ${wakeHour.toFixed(2)}h
- Debe dormir a las ${optimalBedtime.toFixed(2)}h
- Tiempo total disponible: ${totalHoursInDay.toFixed(2)} horas
- Total de siestas para HOY: ${totalNapsForDay} siestas (considerando hora de despertar)
- Ya completó: ${currentNaps.length} siestas
- FALTAN: ${remainingNapsNeeded} siestas más

SIESTAS COMPLETADAS HOY (${currentNaps.length} de ${totalNapsForDay}):
${currentNaps.length > 0 ? currentNaps.map((nap, i) => {
  const startLocal = TimezoneHelper.utcToUserTime(new Date(nap.startTime), userTimezone);
  const endLocal = nap.endTime ? TimezoneHelper.utcToUserTime(new Date(nap.endTime), userTimezone) : null;
  const startTime = startLocal.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: true });
  const endTime = endLocal ? endLocal.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: true }) : 'en progreso';
  const endTimeHour = endLocal ? (endLocal.getHours() + endLocal.getMinutes() / 60).toFixed(2) : 'N/A';
  const status = nap.endTime ? '✅' : '🔄';
  return `  ${status} Siesta ${i + 1}: ${startTime} - ${endTime} (${nap.duration || nap.expectedDuration || 0} min) [${nap.endTime ? 'terminó a las ' + endTimeHour + 'h' : 'terminaría aprox a las ' + (() => {
    const estimatedEnd = addMinutes(new Date(nap.startTime), nap.expectedDuration || 75);
    const estimatedEndLocal = TimezoneHelper.utcToUserTime(estimatedEnd, userTimezone);
    return (estimatedEndLocal.getHours() + estimatedEndLocal.getMinutes() / 60).toFixed(2) + 'h';
  })()}]`;
}).join('\n') : '  Ninguna todavía'}

${currentNaps.length > 0 ? (() => {
  const napInProgress = currentNaps.find(n => !n.endTime);
  if (napInProgress) {
    const startLocal = TimezoneHelper.utcToUserTime(new Date(napInProgress.startTime), userTimezone);
    const estimatedDuration = napInProgress.expectedDuration || 75;
    const estimatedEnd = addMinutes(new Date(napInProgress.startTime), estimatedDuration);
    const estimatedEndLocal = TimezoneHelper.utcToUserTime(estimatedEnd, userTimezone);
    const endTimeStr = estimatedEndLocal.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: true });
    const endHour = estimatedEndLocal.getHours() + estimatedEndLocal.getMinutes() / 60;
    return `
🔄 SIESTA EN PROGRESO:
- Inició: ${startLocal.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: true })}
- Duración estimada: ${estimatedDuration} min
- TERMINARÍA aproximadamente: ${endTimeStr} (${endHour.toFixed(2)}h)
- Hora actual: ${localTime.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: true })}
- Tiempo transcurrido: ${Math.floor(differenceInMinutes(localTime, new Date(napInProgress.startTime)))} min
`;
  }
  
  const lastCompletedNap = currentNaps.filter(n => n.endTime).slice(-1)[0];
  if (lastCompletedNap) {
    const endLocal = TimezoneHelper.utcToUserTime(new Date(lastCompletedNap.endTime), userTimezone);
    const endTimeStr = endLocal.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: true });
    const endHour = endLocal.getHours() + endLocal.getMinutes() / 60;
    const minutesSince = Math.floor(differenceInMinutes(localTime, endLocal));
    const hours = Math.floor(minutesSince / 60);
    const mins = minutesSince % 60;
    return `
⏰ ÚLTIMA SIESTA COMPLETADA TERMINÓ: ${endTimeStr} (${endHour.toFixed(2)}h)
⏰ HORA ACTUAL: ${localTime.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: true })} (${currentHour.toFixed(2)}h)
⏰ TIEMPO DESDE ÚLTIMA SIESTA COMPLETADA: ${hours > 0 ? `${hours}h ${mins}min` : `${mins}min`}
`;
  }
  return '';
})() : ''}

PREGUNTA CRÍTICA:
Basándote en que el bebé despertó a las ${wakeHour.toFixed(2)}h y debe tener ${totalNapsForDay} siestas TOTALES hoy:

1. Ya completó ${currentNaps.length} siestas${currentNaps.length > 0 && currentNaps[currentNaps.length - 1].endTime ? ` (última terminó hace ${(() => {
  const lastNap = currentNaps[currentNaps.length - 1];
  const endLocal = TimezoneHelper.utcToUserTime(new Date(lastNap.endTime), userTimezone);
  const minutesSince = Math.floor((localTime - endLocal) / (1000 * 60));
  const hours = Math.floor(minutesSince / 60);
  const mins = minutesSince % 60;
  return hours > 0 ? `${hours}h ${mins}min` : `${mins}min`;
})()})` : ''}
2. DEBEN predecirse EXACTAMENTE ${remainingNapsNeeded} siestas MÁS (no más, no menos)
3. Cada siesta debe respetar ventanas de vigilia de ${wakeWindows.optimal}h (±30 min)
4. La última siesta debe terminar AL MENOS ${wakeWindows.optimal}h antes de bedtime (${optimalBedtime.toFixed(2)}h)
5. ${currentNaps.length > 0 && currentNaps[currentNaps.length - 1].endTime ? `La próxima siesta debe ser ${wakeWindows.optimal}h DESPUÉS de que terminó la última siesta (${(() => {
  const lastNap = currentNaps[currentNaps.length - 1];
  const endLocal = TimezoneHelper.utcToUserTime(new Date(lastNap.endTime), userTimezone);
  const nextNapTime = new Date(endLocal.getTime() + wakeWindows.optimal * 60 * 60 * 1000);
  return `${nextNapTime.getHours()}:${nextNapTime.getMinutes().toString().padStart(2, '0')} aprox`;
})()})` : 'La primera siesta debe ser después de las ' + Math.floor(currentHour) + 'h'}
5. ¿A qué HORAS LOCALES deberían ser las ${remainingNapsNeeded} siestas restantes? (formato 24h: "HH:MM")
6. ¿Cuánto deberían DURAR? (minutos)

REGLAS ESTRICTAS:
✅ DEBE predecir EXACTAMENTE ${remainingNapsNeeded} siestas (las que faltan para completar ${totalNapsForDay})
✅ Si ${remainingNapsNeeded} = 0, devuelve remainingNaps: [] (array vacío)
✅ Si ${remainingNapsNeeded} = 1, devuelve remainingNaps con SOLO 1 siesta
✅ Si ${remainingNapsNeeded} = 2, devuelve remainingNaps con SOLO 2 siestas
✅ NO puedes devolver 0 siestas si remainingNapsNeeded > 0
✅ Cada siesta debe estar separada por ${wakeWindows.optimal}h (±30 min) desde la última siesta
✅ Última siesta debe terminar antes de las ${(optimalBedtime - wakeWindows.optimal).toFixed(2)}h
✅ Solo predice siestas DESPUÉS de las ${Math.floor(currentHour)}h
✅ Todas las horas en formato 24h LOCAL (UTC${timezoneOffset >= 0 ? '+' : ''}${timezoneOffset})

FORMATO DE RESPUESTA (JSON estricto):
{
  "remainingNaps": [${remainingNapsNeeded === 0 ? '' : `
    {
      "napNumber": ${currentNaps.length + 1},
      "time": "${(() => {
        if (currentNaps.length > 0 && currentNaps[currentNaps.length - 1].endTime) {
          const lastNap = currentNaps[currentNaps.length - 1];
          const endLocal = TimezoneHelper.utcToUserTime(new Date(lastNap.endTime), userTimezone);
          const nextNapTime = new Date(endLocal.getTime() + wakeWindows.optimal * 60 * 60 * 1000);
          return `${nextNapTime.getHours().toString().padStart(2, '0')}:${nextNapTime.getMinutes().toString().padStart(2, '0')}`;
        }
        return '15:00';
      })()}",
      "duration": 60,
      "reason": "Siesta de tarde, ${wakeWindows.optimal}h después de última siesta"
    }`}${remainingNapsNeeded > 1 ? `,
    {
      "napNumber": ${currentNaps.length + 2},
      "time": "${(() => {
        if (currentNaps.length > 0 && currentNaps[currentNaps.length - 1].endTime) {
          const lastNap = currentNaps[currentNaps.length - 1];
          const endLocal = TimezoneHelper.utcToUserTime(new Date(lastNap.endTime), userTimezone);
          const nextNapTime = new Date(endLocal.getTime() + (wakeWindows.optimal * 2 + 1) * 60 * 60 * 1000);
          return `${nextNapTime.getHours().toString().padStart(2, '0')}:${nextNapTime.getMinutes().toString().padStart(2, '0')}`;
        }
        return '17:30';
      })()}",
      "duration": 45,
      "reason": "Última siesta del día"
    }` : ''}
  ],
  "bedtime": {
    "time": "${Math.floor(optimalBedtime)}:${Math.round((optimalBedtime % 1) * 60).toString().padStart(2, '0')}",
    "reason": "${wakeWindows.optimal}h después de última siesta"
  },
  "confidence": 85,
  "explanation": "Breve explicación del por qué"
}

CRÍTICO - CALCULAR HORARIOS CORRECTAMENTE:
- La próxima siesta debe ser ${wakeWindows.optimal}h DESPUÉS de que TERMINÓ la última siesta
- NO uses horarios fijos como 15:00 o 17:30
- CALCULA basándote en cuándo TERMINÓ la última siesta (${currentNaps.length > 0 && currentNaps[currentNaps.length - 1].endTime ? (() => {
  const lastNap = currentNaps[currentNaps.length - 1];
  const endLocal = TimezoneHelper.utcToUserTime(new Date(lastNap.endTime), userTimezone);
  return `${endLocal.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}`;
})() : 'N/A'})

🌙 CRÍTICO - CALCULAR BEDTIME CORRECTAMENTE:
${currentNaps.find(n => !n.endTime) ? (() => {
  const napInProgress = currentNaps.find(n => !n.endTime);
  const startLocal = TimezoneHelper.utcToUserTime(new Date(napInProgress.startTime), userTimezone);
  const estimatedDuration = napInProgress.expectedDuration || 75;
  const estimatedEnd = addMinutes(new Date(napInProgress.startTime), estimatedDuration);
  const estimatedEndLocal = TimezoneHelper.utcToUserTime(estimatedEnd, userTimezone);
  const bedtimeCalc = addMinutes(estimatedEnd, wakeWindows.optimal * 60);
  const bedtimeLocal = TimezoneHelper.utcToUserTime(bedtimeCalc, userTimezone);
  return `- HAY SIESTA EN PROGRESO que terminaría a las ${estimatedEndLocal.getHours()}:${estimatedEndLocal.getMinutes().toString().padStart(2, '0')}
- Bedtime debe ser ${wakeWindows.optimal}h DESPUÉS: ${bedtimeLocal.getHours()}:${bedtimeLocal.getMinutes().toString().padStart(2, '0')}
- NO uses ${Math.floor(optimalBedtime)}:${Math.round((optimalBedtime % 1) * 60).toString().padStart(2, '0')} si no coincide con el cálculo`;
})() : `- Bedtime debe ser ${Math.floor(optimalBedtime)}:${Math.round((optimalBedtime % 1) * 60).toString().padStart(2, '0')} (${wakeWindows.optimal}h después de última siesta)`}

IMPORTANTE: 
- Debes devolver EXACTAMENTE ${remainingNapsNeeded} siestas en remainingNaps[]
- Si remainingNapsNeeded = 1, remainingNaps debe tener 1 objeto
- Si remainingNapsNeeded = 2, remainingNaps debe tener 2 objetos
- Si remainingNapsNeeded = 0, remainingNaps debe ser un array vacío []
IMPORTANTE: 
- Debes devolver EXACTAMENTE ${remainingNapsNeeded} siestas en remainingNaps[]
- Si remainingNapsNeeded = 1, remainingNaps debe tener 1 objeto
- Si remainingNapsNeeded = 2, remainingNaps debe tener 2 objetos
- Si remainingNapsNeeded = 0, remainingNaps debe ser un array vacío []
- La hora de dormir (bedtime) SIEMPRE debe ser ${Math.floor(optimalBedtime)}:${Math.round((optimalBedtime % 1) * 60).toString().padStart(2, '0')}
- ${currentNaps.find(n => !n.endTime) ? `🔄 HAY UNA SIESTA EN PROGRESO: Calcula bedtime desde cuando TERMINARÍA la siesta (no desde cuando inició)` : 'Calcula bedtime desde cuando terminó la última siesta'}
- NUNCA devuelvas menos siestas de las solicitadas (${remainingNapsNeeded})`;

      console.log('🤖 [AI PREDICTION] Consultando a ChatGPT...');
      console.log(`🎯 [AI PREDICTION] Total de siestas para hoy: ${totalNapsForDay}, Completadas: ${currentNaps.length}, Restantes a predecir: ${remainingNapsNeeded}`);
      
      const startTime = Date.now();

      const response = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `Eres un experto en patrones de sueño infantil con conocimiento de bases de datos pediátricas (AAP, NSF, CDC). Respondes SOLO en formato JSON válido. CRÍTICO: Debes calcular dinámicamente cuántas siestas caben basándote en la hora de despertar real y el tiempo disponible hasta bedtime. Si ya hay siestas completadas, solo predice las RESTANTES. Por ejemplo: si el bebé debe tener 4 siestas totales y ya completó 2, predice SOLO 2 más. La hora de dormir (bedtime) siempre debe ser consistente y no cambiar.`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
        max_tokens: 1000
      });

      const elapsed = Date.now() - startTime;
      console.log(`✅ [AI PREDICTION] Respuesta recibida en ${elapsed}ms`);

      const aiResponse = JSON.parse(response.choices[0].message.content);
      
      console.log('✅ [AI PREDICTION] Respuesta de ChatGPT:', JSON.stringify(aiResponse, null, 2));
      console.log(`✅ [AI PREDICTION] Siestas sugeridas: ${aiResponse.remainingNaps?.length || 0}`);
      console.log(`✅ [AI PREDICTION] Confianza: ${aiResponse.confidence}%`);
      console.log(`✅ [AI PREDICTION] Explicación: ${aiResponse.explanation || 'N/A'}`);

      // ✅ Validar que es un número razonable de siestas
      if (aiResponse.remainingNaps) {
        const totalNapsActual = currentNaps.length + aiResponse.remainingNaps.length;
        console.log(`📊 [AI PREDICTION] Total de siestas para hoy: ${totalNapsActual} (${currentNaps.length} completadas + ${aiResponse.remainingNaps.length} predichas)`);
        
        if (totalNapsActual < expectedNaps.min) {
          console.warn(`⚠️ [AI PREDICTION] Total de siestas (${totalNapsActual}) es menor que el mínimo recomendado (${expectedNaps.min})`);
        } else if (totalNapsActual > expectedNaps.max) {
          console.warn(`⚠️ [AI PREDICTION] Total de siestas (${totalNapsActual}) excede el máximo recomendado (${expectedNaps.max})`);
        } else {
          console.log(`✅ [AI PREDICTION] Total de siestas dentro del rango esperado (${expectedNaps.min}-${expectedNaps.max})`);
        }
      }
      
      // ⚠️ Si ChatGPT devolvió menos siestas, COMPLETAR automáticamente
      if (aiResponse.remainingNaps && aiResponse.remainingNaps.length < remainingNapsNeeded) {
        console.warn(`⚠️ [AI PREDICTION] ChatGPT devolvió ${aiResponse.remainingNaps.length} siestas (se esperaban ${remainingNapsNeeded})`);
        console.warn(`⚠️ [AI PREDICTION] COMPLETANDO automáticamente las ${remainingNapsNeeded - aiResponse.remainingNaps.length} siestas faltantes...`);
        
        // ✅ Completar las siestas faltantes usando lógica estadística
        const missingSiestas = remainingNapsNeeded - aiResponse.remainingNaps.length;
        const lastNapFromAI = aiResponse.remainingNaps[aiResponse.remainingNaps.length - 1];
        
        // Calcular hora de inicio de la última siesta predicha por ChatGPT
        const [lastHours, lastMinutes] = lastNapFromAI.time.split(':').map(Number);
        let lastNapEndHour = lastHours + (lastNapFromAI.duration || 60) / 60; // Hora local
        
        // Agregar siestas faltantes con ventanas de vigilia correctas
        for (let i = 0; i < missingSiestas; i++) {
          const nextNapStartHour = lastNapEndHour + wakeWindows.optimal; // Siguiente siesta
          const nextHour = Math.floor(nextNapStartHour);
          const nextMinute = Math.round((nextNapStartHour % 1) * 60);
          const nextTimeStr = `${nextHour.toString().padStart(2, '0')}:${nextMinute.toString().padStart(2, '0')}`;
          
          const newNap = {
            napNumber: currentNaps.length + aiResponse.remainingNaps.length + i + 1,
            time: nextTimeStr,
            duration: childInfo.ageInMonths <= 6 ? 60 : 75, // Duración típica
            reason: `Siesta adicional (${wakeWindows.optimal}h después de siesta anterior)`
          };
          
          aiResponse.remainingNaps.push(newNap);
          lastNapEndHour = nextNapStartHour + newNap.duration / 60; // Actualizar para próxima iteración
          
          console.log(`✅ [AI PREDICTION] Siesta ${newNap.napNumber} agregada: ${nextTimeStr} (${newNap.duration} min)`);
        }
        
        // Recalcular bedtime basándose en la última siesta ajustada
        const finalNap = aiResponse.remainingNaps[aiResponse.remainingNaps.length - 1];
        const [finalHours, finalMinutes] = finalNap.time.split(':').map(Number);
        const finalNapEndHour = finalHours + (finalNap.duration || 60) / 60;
        const newBedtimeHour = finalNapEndHour + wakeWindows.optimal;
        const bedHour = Math.floor(newBedtimeHour);
        const bedMinute = Math.round((newBedtimeHour % 1) * 60);
        
        aiResponse.bedtime = {
          time: `${bedHour.toString().padStart(2, '0')}:${bedMinute.toString().padStart(2, '0')}`,
          reason: `${wakeWindows.optimal}h después de última siesta`
        };
        
        console.log(`✅ [AI PREDICTION] Bedtime ajustado: ${aiResponse.bedtime.time}`);
      }

      return aiResponse;

    } catch (error) {
      console.error('❌ [AI PREDICTION] Error consultando ChatGPT:', error.message);
      console.error('❌ [AI PREDICTION] Stack:', error.stack);
      return null;  // Fallar silenciosamente y usar predicciones estadísticas
    }
  }

  /**
   * Registrar hora de despertar del día
   * POST /api/sleep/wake-time
   */
  async recordWakeTime(req, res) {
    try {
      const userId = req.user.uid;
      const { childId, wakeTime, timezone } = req.body;

      console.log('🔍 [WAKE TIME DEBUG] ====================================');
      console.log('📥 Received wakeTime:', wakeTime);
      console.log('🌍 Received timezone:', timezone);

      // Validaciones
      if (!childId || !wakeTime) {
        return res.status(400).json({
          error: 'childId y wakeTime son requeridos'
        });
      }

      // Obtener información del niño para el timezone
      const childDoc = await this.db.collection('children').doc(childId).get();
      if (!childDoc.exists) {
        return res.status(404).json({
          error: 'Niño no encontrado'
        });
      }

      const childData = childDoc.data();
      const userTimezone = timezone || childData.timezone || 'UTC';

      console.log('👶 Child timezone:', userTimezone);

      // Parsear la hora de despertar
      let wakeTimeDate;
      let parsedSource = 'unknown';

      const hasTimezoneInfo = (value) =>
        typeof value === 'string' && /([zZ]|[+-]\d{2}:\d{2})$/.test(value);
      const isTimeOnly = (value) =>
        typeof value === 'string' && /^\d{1,2}:\d{2}(:\d{2})?$/.test(value);
      const parseLocalDateTime = (value) => {
        // Acepta "YYYY-MM-DD HH:mm" o "YYYY-MM-DDTHH:mm[:ss]"
        const match = value.match(
          /^(\d{4})-(\d{2})-(\d{2})[T\s](\d{1,2}):(\d{2})(?::(\d{2}))?$/
        );
        if (!match) return null;
        const [, y, m, d, hh, mm, ss] = match;
        return new Date(Date.UTC(
          Number(y),
          Number(m) - 1,
          Number(d),
          Number(hh),
          Number(mm),
          Number(ss || 0)
        ));
      };

      if (typeof wakeTime === 'string') {
        if (hasTimezoneInfo(wakeTime)) {
          wakeTimeDate = new Date(wakeTime);
          parsedSource = 'string-with-tz';

          // Heurística: si parece venir como UTC pero en realidad es hora local
          const localHour = TimezoneHelper.utcToUserTime(wakeTimeDate, userTimezone).getHours();
          const utcHour = wakeTimeDate.getUTCHours();
          const isSuspicious = localHour <= 4 && utcHour >= 10 && userTimezone !== 'UTC';
          if (isSuspicious) {
            const withoutZ = wakeTime.replace(/[zZ]$/, '');
            const localDate = parseLocalDateTime(withoutZ);
            if (localDate) {
              wakeTimeDate = TimezoneHelper.userTimeToUtc(localDate, userTimezone);
              parsedSource = 'string-with-tz-corrected-to-local';
            }
          }
        } else if (isTimeOnly(wakeTime)) {
          // Si llega solo hora (HH:mm), usar la fecha "hoy" del usuario
          const todayInfo = TimezoneHelper.getTodayInUserTimezone(userTimezone);
          const [h, m, s] = wakeTime.split(':').map(Number);
          const localDate = new Date(Date.UTC(
            todayInfo.userLocalTime.getFullYear(),
            todayInfo.userLocalTime.getMonth(),
            todayInfo.userLocalTime.getDate(),
            h,
            m,
            s || 0
          ));
          wakeTimeDate = TimezoneHelper.userTimeToUtc(localDate, userTimezone);
          parsedSource = 'time-only-local';
        } else {
          const localDate = parseLocalDateTime(wakeTime);
          if (localDate) {
            wakeTimeDate = TimezoneHelper.userTimeToUtc(localDate, userTimezone);
            parsedSource = 'string-no-tz-local';
          } else {
            wakeTimeDate = new Date(wakeTime);
            parsedSource = 'string-fallback';
          }
        }

        console.log('📅 Parsed Date Object:', wakeTimeDate);
        console.log('📅 ISO String:', wakeTimeDate.toISOString());
        console.log('📅 UTC String:', wakeTimeDate.toUTCString());
        console.log('📅 Hours (UTC):', wakeTimeDate.getUTCHours());
        console.log('📅 Hours (Local):', wakeTimeDate.getHours());
        console.log('📅 Parsed Source:', parsedSource);
      } else if (wakeTime._seconds) {
        // Si es un Timestamp de Firebase
        wakeTimeDate = new Date(wakeTime._seconds * 1000);
        parsedSource = 'firebase-timestamp';
      } else {
        // Intentar parsear
        wakeTimeDate = new Date(wakeTime);
        parsedSource = 'non-string';
      }

      // Validar que la fecha sea válida
      if (isNaN(wakeTimeDate.getTime())) {
        return res.status(400).json({
          error: 'wakeTime inválido',
          received: wakeTime,
          details: 'No se pudo parsear la fecha'
        });
      }

      // Validar que la hora esté en un rango razonable (5 AM - 12 PM)
      const hours = wakeTimeDate.getHours();
      const utcHours = wakeTimeDate.getUTCHours();
      
      console.log('⏰ Validation - Local Hours:', hours);
      console.log('⏰ Validation - UTC Hours:', utcHours);

      // Si la hora local está entre 2 AM y 5 AM, probablemente hay un error de AM/PM
      if (hours >= 2 && hours < 5) {
        console.warn('⚠️ ALERTA: Hora de despertar sospechosa (2 AM - 5 AM)');
        console.warn('⚠️ Es posible que haya un problema con AM/PM en el frontend');
      }

      const wakeTimeData = {
        userId,
        childId,
        wakeTime: admin.firestore.Timestamp.fromDate(wakeTimeDate),
        type: 'wake',
        timezone: userTimezone,
        createdAt: admin.firestore.Timestamp.now(),
        // Guardar debug info
        debugInfo: {
          receivedWakeTime: wakeTime,
          parsedISOString: wakeTimeDate.toISOString(),
          localHours: hours,
          utcHours: utcHours
        }
      };

      const docRef = await this.db.collection('wakeEvents').add(wakeTimeData);

      console.log('✅ [WAKE TIME] Registrado exitosamente');
      console.log('🔍 [WAKE TIME DEBUG] ====================================');

      res.json({
        success: true,
        id: docRef.id,
        message: 'Hora de despertar registrada exitosamente',
        wakeTime: wakeTimeDate.toISOString(),
        localTime: TimezoneHelper.formatInUserTimezone(wakeTimeDate, userTimezone, 'h:mm a'),
        debug: {
          receivedWakeTime: wakeTime,
          parsedISOString: wakeTimeDate.toISOString(),
          localHours: hours,
          utcHours: utcHours,
          timezone: userTimezone,
          parsedSource
        }
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
   * Convertir todas las fechas de la predicción a la zona horaria del usuario
   */
  localizePredictionDates(prediction, userTimezone) {
    console.log(`🌍 [LOCALIZE] Convirtiendo fechas a timezone: ${userTimezone}`);
    
    // Función helper para convertir una fecha ISO a la timezone del usuario
    // Devuelve ISO string que REPRESENTA la hora local (no UTC real)
    const convertDate = (isoDate) => {
      if (!isoDate) return null;
      
      const utcDate = new Date(isoDate);
      const localDate = TimezoneHelper.utcToUserTime(utcDate, userTimezone);
      
      // Crear ISO string que represente la hora LOCAL
      // Ejemplo: Si son las 8:03 AM local, devolver "2026-01-09T08:03:00.000Z"
      const year = localDate.getFullYear();
      const month = String(localDate.getMonth() + 1).padStart(2, '0');
      const day = String(localDate.getDate()).padStart(2, '0');
      const hours = String(localDate.getHours()).padStart(2, '0');
      const minutes = String(localDate.getMinutes()).padStart(2, '0');
      const seconds = String(localDate.getSeconds()).padStart(2, '0');
      
      return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.000Z`;
    };
    
    // Clonar predicción para no mutar el original
    const localized = JSON.parse(JSON.stringify(prediction));
    
    // Convertir nextNap
    if (localized.nextNap?.time) {
      localized.nextNap.time = convertDate(localized.nextNap.time);
      if (localized.nextNap.windowStart) localized.nextNap.windowStart = convertDate(localized.nextNap.windowStart);
      if (localized.nextNap.windowEnd) localized.nextNap.windowEnd = convertDate(localized.nextNap.windowEnd);
    }
    
    // Convertir dailySchedule.allNaps
    if (localized.dailySchedule?.allNaps) {
      localized.dailySchedule.allNaps = localized.dailySchedule.allNaps.map(nap => ({
        ...nap,
        time: convertDate(nap.time),
        startTime: nap.startTime ? convertDate(nap.startTime) : undefined,
        endTime: nap.endTime ? convertDate(nap.endTime) : undefined,
        windowStart: nap.windowStart ? convertDate(nap.windowStart) : undefined,
        windowEnd: nap.windowEnd ? convertDate(nap.windowEnd) : undefined
      }));
    }
    
    // Convertir bedtime
    if (localized.bedtime?.time) {
      localized.bedtime.time = convertDate(localized.bedtime.time);
      if (localized.bedtime.lastNapEnd) localized.bedtime.lastNapEnd = convertDate(localized.bedtime.lastNapEnd);
    }
    
    // Convertir sleepPressure.lastSleepTime
    if (localized.sleepPressure?.lastSleepTime) {
      localized.sleepPressure.lastSleepTime = convertDate(localized.sleepPressure.lastSleepTime);
    }
    
    console.log(`✅ [LOCALIZE] Fechas convertidas. Todas las horas ahora representan ${userTimezone}`);
    
    return localized;
  }

  /**
   * Sanitizar datos para Firestore (no permite undefined)
   */
  sanitizeForFirestore(value) {
    if (value === undefined) return null;
    if (value === null) return null;
    if (value instanceof Date) return value;
    if (Array.isArray(value)) {
      return value.map(item => this.sanitizeForFirestore(item));
    }
    if (typeof value === 'object') {
      const sanitized = {};
      Object.entries(value).forEach(([key, val]) => {
        const cleanVal = this.sanitizeForFirestore(val);
        // Mantener la llave aunque sea null para evitar undefined
        sanitized[key] = cleanVal;
      });
      return sanitized;
    }
    return value;
  }

  /**
   * Obtener hora de despertar del día
   * GET /api/sleep/wake-time/:childId
   */
  async getWakeTime(req, res) {
    try {
      const userId = req.user.uid;
      const { childId } = req.params;
      const userTimezone = TimezoneHelper.getUserTimezone(req);

      if (!childId) {
        return res.status(400).json({
          error: 'childId es requerido'
        });
      }

      console.log(`🌅 [GET WAKE TIME] Consultando hora de despertar para childId: ${childId}`);
      console.log(`🌍 [GET WAKE TIME] Timezone del usuario: ${userTimezone}`);

      const wakeTimeInfo = await this.getWakeTimeForToday(childId, userId, userTimezone);

      console.log(`✅ [GET WAKE TIME] Resultado:`, {
        hasTime: !!wakeTimeInfo.time,
        source: wakeTimeInfo.source,
        time: wakeTimeInfo.time ? wakeTimeInfo.time.toISOString() : null,
        timeInUserTZ: wakeTimeInfo.time ? TimezoneHelper.formatInUserTimezone(wakeTimeInfo.time, userTimezone, 'HH:mm') : null
      });

      res.json({
        success: true,
        wakeTime: wakeTimeInfo.time ? wakeTimeInfo.time.toISOString() : null,
        wakeTimeLocal: wakeTimeInfo.time ? TimezoneHelper.formatInUserTimezone(wakeTimeInfo.time, userTimezone) : null,
        source: wakeTimeInfo.source,
        hasRegisteredToday: wakeTimeInfo.source === 'recorded',
        timezone: userTimezone,
        message: wakeTimeInfo.source === 'recorded' 
          ? 'Hora de despertar registrada hoy'
          : wakeTimeInfo.source === 'predicted-historical'
          ? 'Hora de despertar predicha por historial'
          : 'Hora de despertar por defecto (7:00 AM)'
      });
    } catch (error) {
      console.error('❌ Error obteniendo hora de despertar:', error);
      res.status(500).json({
        error: 'Error al obtener hora de despertar',
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

      console.log(`✅ [RECORD SLEEP] Evento registrado: ${docRef.id}`);

      // Actualizar estadísticas del niño
      await this.updateChildSleepStats(userId, childId);

      // 🔄 RECALCULAR PREDICCIONES si la siesta tiene endTime
      let updatedPredictions = null;
      if (endTime && type === 'nap') {
        console.log(`🔄 [RECORD SLEEP] Recalculando predicciones después de registrar siesta...`);
        
        try {
          // Obtener información del niño para el timezone
          const childDoc = await this.db.collection('children').doc(childId).get();
          const childData = childDoc.data();
          const userTimezone = childData.timezone || 'UTC';
          const ageInMonths = this.calculateAgeInMonths(childData.birthDate.toDate());
          
          // Obtener historial actualizado
          const sleepHistory = await this.getSleepHistory(userId, childId, 14);
          
          const childInfo = {
            id: childId,
            userId: userId,
            name: childData.name,
            ageInMonths: ageInMonths
          };
          
          // Generar nuevas predicciones
          const prediction = await this.generateSleepPrediction(
            sleepHistory,
            childInfo,
            userTimezone
          );
          const localizedPrediction = this.localizePredictionDates(prediction, userTimezone);
          const sanitizedFullPrediction = this.sanitizeForFirestore(localizedPrediction);
          
          // Guardar predicciones actualizadas
          const todayInfo = TimezoneHelper.getTodayInUserTimezone(userTimezone);
          const todayStr = format(todayInfo.userLocalTime, 'yyyy-MM-dd');
          
          const predictionDocData = {
            ...prediction,
            childId,
            userId,
            date: todayStr,
            timezone: userTimezone,
            lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
            recalculatedAfter: 'nap_registration',
            sleepHistoryCount: sleepHistory.length,
            fullPrediction: sanitizedFullPrediction
          };
          const safePredictionDocData = this.sanitizeForFirestore(predictionDocData);

          await this.db
            .collection('sleepPredictions')
            .doc(`${childId}_${todayStr}`)
            .set(safePredictionDocData, { merge: true });
          
          updatedPredictions = localizedPrediction;
          console.log(`✅ [RECORD SLEEP] Predicciones recalculadas: ${prediction.predictedNaps?.length || 0} siestas restantes`);
          
        } catch (predError) {
          console.error(`⚠️ [RECORD SLEEP] Error recalculando predicciones:`, predError);
          // No fallar el registro de sueño por error en predicciones
        }
      }

      res.status(201).json({
        success: true,
        message: 'Evento de sueño registrado exitosamente',
        sleepEventId: docRef.id,
        sleepEvent: {
          id: docRef.id,
          ...sleepEvent,
          startTime: startTime,
          endTime: endTime
        },
        predictionsUpdated: updatedPredictions ? true : false,
        updatedPredictions: updatedPredictions
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
      const userId = req.user?.uid;
      // Intentar obtener childId de params (GET) o body (POST)
      let childId = req.params.childId || req.body?.childId;

      console.log(`📊 [PREDICT] ========================================`);
      console.log(`📊 [PREDICT] Solicitud de predicción`);
      console.log(`📊 [PREDICT] Método: ${req.method}`);
      console.log(`📊 [PREDICT] req.params:`, req.params);
      console.log(`📊 [PREDICT] req.body:`, req.body);
      console.log(`📊 [PREDICT] req.user:`, req.user ? `uid=${req.user.uid}` : 'undefined');
      console.log(`📊 [PREDICT] childId extraído: ${childId}`);
      console.log(`📊 [PREDICT] userId extraído: ${userId}`);
      
      // ✅ VALIDACIÓN PRIMERA: Asegurar que childId y userId existan
      if (!childId || !userId) {
        console.error(`❌ [PREDICT] ERROR: childId o userId undefined`);
        console.error(`❌ [PREDICT] childId: ${childId}`);
        console.error(`❌ [PREDICT] userId: ${userId}`);
        console.error(`❌ [PREDICT] req.params:`, JSON.stringify(req.params));
        console.error(`❌ [PREDICT] req.user:`, req.user);
        return res.status(400).json({
          error: 'childId o userId no válidos',
          childId: childId,
          userId: userId,
          details: 'Verifica que la URL incluya el childId y que el token de autenticación sea válido'
        });
      }

      // 🌍 Obtener timezone del usuario lo antes posible
      const userTimezone = TimezoneHelper.getUserTimezone(req);
      console.log(`🌍 [PREDICT] Usando timezone: ${userTimezone}`);

      // Obtener información del niño (en paralelo cuando sea posible)
      const childDocPromise = this.db
        .collection('children')
        .doc(childId)
        .get();

      const childDoc = await childDocPromise;
      if (!childDoc.exists) {
        return res.status(404).json({
          error: 'Niño no encontrado'
        });
      }

      const childData = childDoc.data();
      
      // Calcular edad en meses (con fallback seguro)
      let ageInMonths = null;
      let birthDate = null;
      if (childData.birthDate?.toDate) {
        birthDate = childData.birthDate.toDate();
      } else if (childData.birthDate) {
        const parsed = new Date(childData.birthDate);
        if (!isNaN(parsed.getTime())) birthDate = parsed;
      }

      if (birthDate) {
        ageInMonths = this.calculateAgeInMonths(birthDate);
      } else if (typeof childData.ageInMonths === 'number') {
        ageInMonths = childData.ageInMonths;
      }

      if (ageInMonths === null || ageInMonths === undefined) {
        return res.status(400).json({
          error: 'No se pudo determinar la edad del bebé',
          details: 'Falta birthDate o ageInMonths en el perfil del niño'
        });
      }

      // ⚡ Fast-cache: devolver predicción reciente si existe (evita ML/IA)
      const { format } = require('date-fns');
      const todayInfoForCache = TimezoneHelper.getTodayInUserTimezone(userTimezone);
      const cacheKeyDate = format(todayInfoForCache.userLocalTime, 'yyyy-MM-dd');
      const predictionDocRef = this.db
        .collection('sleepPredictions')
        .doc(`${childId}_${cacheKeyDate}`);
      const predictionDoc = await predictionDocRef.get();
      const forceRefresh = req.query?.force === 'true' || req.headers['x-force-refresh'] === 'true';
      const cacheTtlMinutes = 5;

      if (!forceRefresh && predictionDoc.exists) {
        const cached = predictionDoc.data();
        const lastUpdated = cached.lastUpdated?.toDate ? cached.lastUpdated.toDate() : null;
        const cacheAgeMinutes = lastUpdated
          ? differenceInMinutes(new Date(), lastUpdated)
          : null;
        if (cached.fullPrediction && cacheAgeMinutes !== null && cacheAgeMinutes <= cacheTtlMinutes) {
          console.log(`⚡ [PREDICT] Usando cache (${cacheAgeMinutes} min)`);
          return res.json({
            success: true,
            prediction: cached.fullPrediction,
            childInfo: {
              name: childData.name,
              ageInMonths,
              dataPoints: cached.sleepHistoryCount ?? null
            },
            timezone: userTimezone,
            cached: true
          });
        }
      }

      // Obtener historial de sueño (últimos 14 días)
      const sleepHistory = await this.getSleepHistory(userId, childId, 14);

      console.log(`📊 [PREDICT] Niño: ${childData.name} (${ageInMonths} meses)`);
      console.log(`📊 [PREDICT] Eventos en historial: ${sleepHistory.length}`);
      console.log(`📊 [PREDICT] ========================================`);

      // Generar predicción (pasar userId y childId)
      const childInfo = {
        id: childId,
        userId: userId,
        name: childData.name,
        ageInMonths: ageInMonths
      };
      
      console.log(`✅ [PREDICT] childInfo construido:`, JSON.stringify(childInfo));
      
      const prediction = await this.generateSleepPrediction(
        sleepHistory,
        ageInMonths,
        childInfo,
        userTimezone  // ✅ Pasar timezone
      );

      console.log(`✅ [PREDICT] Predicción generada exitosamente`);
      console.log(`✅ [PREDICT] Total de siestas predichas: ${prediction.dailySchedule?.allNaps?.length || 0}`);
      console.log(`✅ [PREDICT] Confianza: ${prediction.confidence}%`);

      // 🌍 Convertir todas las fechas a la zona horaria del usuario
      const localizedPrediction = this.localizePredictionDates(prediction, userTimezone);
      const sanitizedFullPrediction = this.sanitizeForFirestore(localizedPrediction);
      
      // 💾 GUARDAR PREDICCIONES EN FIRESTORE para notificaciones
      try {
        const todayInfo = TimezoneHelper.getTodayInUserTimezone(userTimezone);
        const todayStr = format(todayInfo.userLocalTime, 'yyyy-MM-dd');
        const predictionDocId = `${childId}_${todayStr}`;
        
        // Filtrar solo las siestas predichas (upcoming)
        const predictedNaps = prediction.dailySchedule?.allNaps
          ?.filter(nap => nap.status === 'upcoming')
          .map(nap => ({
            napNumber: nap.napNumber,
            time: nap.time,
            windowStart: nap.windowStart,
            windowEnd: nap.windowEnd,
            expectedDuration: nap.expectedDuration,
            confidence: nap.confidence,
            type: nap.type || nap.aiReason,
            aiReason: nap.aiReason,
            wakeWindow: nap.wakeWindow
          })) || [];
        
        const predictionData = {
          childId: childId,
          userId: userId,
          date: todayStr,
          predictedNaps: predictedNaps,
          predictedBedtime: prediction.bedtime ? {
            time: prediction.bedtime.time,
            confidence: prediction.bedtime.confidence,
            reason: prediction.bedtime.reason
          } : null,
          totalExpected: prediction.dailySchedule?.totalExpected || predictedNaps.length,
          completed: prediction.dailySchedule?.completed || 0,
          remaining: predictedNaps.length,
          confidence: prediction.confidence,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
          timezone: userTimezone,
          sleepHistoryCount: sleepHistory.length,
          fullPrediction: sanitizedFullPrediction
        };
        const safePredictionData = this.sanitizeForFirestore(predictionData);

        await this.db
          .collection('sleepPredictions')
          .doc(predictionDocId)
          .set(safePredictionData, { merge: true });
        
        console.log(`💾 [PREDICT] Predicciones guardadas en Firestore: ${predictionDocId}`);
        console.log(`💾 [PREDICT] Siestas predichas guardadas: ${predictedNaps.length}`);
      } catch (saveError) {
        console.error('⚠️ [PREDICT] Error guardando predicciones en Firestore:', saveError);
        // No fallar la petición si hay error al guardar
      }

      res.json({
        success: true,
        prediction: localizedPrediction,
        childInfo: {
          name: childData.name,
          ageInMonths,
          dataPoints: sleepHistory.length
        },
        timezone: userTimezone  // ✅ Indicar la timezone usada
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
   * Terminar automáticamente siestas que lleven más de 6 horas activas
   * Esto previene siestas "olvidadas" que distorsionen las predicciones
   */
  async autoTerminateLongSleeps(userId, childId) {
    try {
      const MAX_SLEEP_HOURS = 6;
      const now = new Date();
      const sixHoursAgo = subHours(now, MAX_SLEEP_HOURS);
      
      console.log(`🔍 [AUTO-TERMINATE] Buscando siestas activas mayores a ${MAX_SLEEP_HOURS}h para childId: ${childId}`);
      
      // Buscar eventos de sueño sin endTime que iniciaron hace más de 6 horas
      const snapshot = await this.db
        .collection('sleepEvents')
        .where('userId', '==', userId)
        .where('childId', '==', childId)
        .where('endTime', '==', null)
        .where('startTime', '<=', admin.firestore.Timestamp.fromDate(sixHoursAgo))
        .get();
      
      if (snapshot.empty) {
        console.log(`✅ [AUTO-TERMINATE] No hay siestas activas mayores a ${MAX_SLEEP_HOURS}h`);
        return 0;
      }
      
      console.log(`⚠️ [AUTO-TERMINATE] Encontradas ${snapshot.size} siestas activas mayores a ${MAX_SLEEP_HOURS}h`);
      
      let terminatedCount = 0;
      const batch = this.db.batch();
      
      snapshot.docs.forEach(doc => {
        const eventData = doc.data();
        const startTime = eventData.startTime.toDate();
        const durationHours = differenceInHours(now, startTime);
        
        console.log(`⚠️ [AUTO-TERMINATE] Siesta ID: ${doc.id}`);
        console.log(`   - Inicio: ${startTime.toISOString()}`);
        console.log(`   - Duración actual: ${durationHours.toFixed(1)}h`);
        console.log(`   - Tipo: ${eventData.type}`);
        
        // Terminarla automáticamente en startTime + 6 horas
        const autoEndTime = addHours(startTime, MAX_SLEEP_HOURS);
        const duration = MAX_SLEEP_HOURS * 60; // 360 minutos
        
        batch.update(doc.ref, {
          endTime: admin.firestore.Timestamp.fromDate(autoEndTime),
          duration: duration,
          grossDuration: duration,
          netDuration: duration,
          autoTerminated: true, // Marcar como terminada automáticamente
          autoTerminatedReason: `Siesta activa por más de ${MAX_SLEEP_HOURS} horas`,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        console.log(`✅ [AUTO-TERMINATE] Siesta ${doc.id} será terminada en: ${autoEndTime.toISOString()}`);
        terminatedCount++;
      });
      
      if (terminatedCount > 0) {
        await batch.commit();
        console.log(`✅ [AUTO-TERMINATE] ${terminatedCount} siestas terminadas automáticamente`);
        
        // Actualizar estadísticas del niño
        await this.updateChildSleepStats(userId, childId);
      }
      
      return terminatedCount;
      
    } catch (error) {
      console.error('❌ [AUTO-TERMINATE] Error:', error);
      // No lanzar error, solo loguearlo
      return 0;
    }
  }

  /**
   * Obtener historial de sueño de un niño
   */
  async getSleepHistory(userId, childId, days = 14) {
    // ✅ Primero, terminar automáticamente siestas mayores a 6 horas
    await this.autoTerminateLongSleeps(userId, childId);
    
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
  async getWakeTimeForToday(childId, userId, userTimezone = 'UTC') {
    try {
      // ✅ VALIDACIÓN CRÍTICA: Verificar que childId y userId no sean undefined
      if (!childId || !userId) {
        console.error(`❌ [WAKE TIME] ERROR: Parámetros inválidos`);
        console.error(`❌ [WAKE TIME] childId: ${childId}, userId: ${userId}`);
        throw new Error(`getWakeTimeForToday requiere childId y userId válidos. Recibido: childId=${childId}, userId=${userId}`);
      }
      
      // ✅ Obtener "hoy" según la timezone del usuario
      const today = TimezoneHelper.getTodayInUserTimezone(userTimezone);
      const todayStart = today.start;
      const todayStartTimestamp = admin.firestore.Timestamp.fromDate(todayStart);
      
      console.log(`🌅 [WAKE TIME] ==============================================`);
      console.log(`🌅 [WAKE TIME] Buscando hora de despertar para HOY`);
      console.log(`🌅 [WAKE TIME] todayStart (Date): ${todayStart.toISOString()}`);
      console.log(`🌅 [WAKE TIME] todayStart (Timestamp): ${todayStartTimestamp.toDate().toISOString()}`);
      console.log(`🌅 [WAKE TIME] childId: ${childId}`);
      console.log(`🌅 [WAKE TIME] userId: ${userId}`);
      console.log(`🌅 [WAKE TIME] ==============================================`);
      
      // Primero, ver TODOS los registros de wakeEvents para este niño
      const allWakeSnapshot = await this.db
        .collection('wakeEvents')
        .where('userId', '==', userId)
        .where('childId', '==', childId)
        .orderBy('wakeTime', 'desc')
        .limit(5)
        .get();
      
      console.log(`🔍 [WAKE TIME] Total de registros de despertar encontrados: ${allWakeSnapshot.size}`);
      
      if (!allWakeSnapshot.empty) {
        allWakeSnapshot.docs.forEach((doc, index) => {
          const data = doc.data();
          const wakeDate = data.wakeTime.toDate();
          console.log(`📅 [WAKE TIME] Registro ${index + 1}:`);
          console.log(`   - ID: ${doc.id}`);
          console.log(`   - Fecha: ${wakeDate.toISOString()}`);
          console.log(`   - ¿Es hoy?: ${wakeDate >= todayStart}`);
          console.log(`   - Diferencia con todayStart: ${(wakeDate - todayStart) / 1000 / 60 / 60} horas`);
        });
      } else {
        console.log(`⚠️ [WAKE TIME] NO hay NINGÚN registro de despertar en la BD`);
      }
      
      // Buscar hora de despertar registrada HOY
      const wakeSnapshot = await this.db
        .collection('wakeEvents')
        .where('userId', '==', userId)
        .where('childId', '==', childId)
        .where('wakeTime', '>=', todayStartTimestamp)
        .orderBy('wakeTime', 'desc')
        .limit(1)
        .get();

      if (!wakeSnapshot.empty) {
        const wakeData = wakeSnapshot.docs[0].data();
        const wakeTime = wakeData.wakeTime.toDate();
        console.log(`✅ [WAKE TIME] Hora de despertar REGISTRADA HOY encontrada: ${wakeTime.toISOString()}`);
        return {
          time: wakeTime,
          source: 'recorded'
        };
      }
      
      console.log(`⚠️ [WAKE TIME] No hay registro de despertar HOY (después de ${todayStart.toISOString()})`);
      console.log(`🔍 [WAKE TIME] Buscando historial de últimos 30 días...`);

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
        
        console.log(`📊 [WAKE TIME] Hora predicha por historial (${historicalWakes.size} registros): ${wakeDate.toISOString()}`);
        
        return {
          time: wakeDate,
          source: 'predicted-historical'
        };
      }

      // Sin historial, usar default por edad
      const defaultWakeHour = 7; // 7 AM por defecto
      const wakeDate = new Date(todayStart);
      wakeDate.setHours(defaultWakeHour, 0, 0, 0);
      
      console.log(`⚙️ [WAKE TIME] Usando hora por defecto: ${wakeDate.toISOString()}`);
      
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
  async generateSleepPrediction(sleepHistory, ageInMonths, childInfo, userTimezone = 'UTC') {
    const now = new Date();

    console.log(`🌍 [PREDICT] Timezone del usuario: ${userTimezone}`);

    // 🧠 INTENTAR USAR MACHINE LEARNING PRIMERO
    console.log(`🧠 [ML] Intentando entrenar modelo con ${sleepHistory.length} eventos...`);
    const mlTraining = await sleepMLModel.train(sleepHistory, ageInMonths);
    const useML = mlTraining.success;
    
    if (useML) {
      console.log(`✅ [ML] Usando predicciones con MACHINE LEARNING`);
    } else {
      console.log(`⚠️ [ML] Usando sistema estadístico (razón: ${mlTraining.reason})`);
    }

    // Obtener hora de despertar de hoy
    console.log(`🔍 [PREDICT] childInfo completo:`, JSON.stringify(childInfo));
    
    // ✅ VALIDACIÓN: Asegurar que childInfo tenga id y userId
    if (!childInfo || !childInfo.id || !childInfo.userId) {
      console.error(`❌ [PREDICT] ERROR: childInfo inválido:`, childInfo);
      throw new Error(`childInfo debe tener id y userId. Recibido: ${JSON.stringify(childInfo)}`);
    }
    
    console.log(`🔍 [PREDICT] Buscando hora de despertar para childId: ${childInfo.id}, userId: ${childInfo.userId}`);
    const wakeTimeInfo = await this.getWakeTimeForToday(childInfo.id, childInfo.userId, userTimezone);

    // Separar siestas y sueño nocturno
    console.log(`📊 [DEBUG] sleepHistory total: ${sleepHistory.length} eventos`);
    console.log(`📊 [DEBUG] Tipos encontrados:`, sleepHistory.map(s => ({ id: s.id, type: s.type, startTime: s.startTime })));
    
    const naps = sleepHistory.filter(s => s.type === 'nap');
    const nightSleeps = sleepHistory.filter(s => s.type === 'nightsleep');
    
    console.log(`📊 [DEBUG] Naps filtradas: ${naps.length}`);
    console.log(`📊 [DEBUG] Night sleeps filtradas: ${nightSleeps.length}`);

    // 1. PREDECIR TODAS LAS SIESTAS DEL DÍA
    let dailyNapSchedule;
    if (useML && wakeTimeInfo.wakeTime) {
      // USAR ML para predecir
      const todayStart = startOfDay(now);
      const napsToday = naps.filter(nap => {
        const napDate = parseISO(nap.startTime);
        return napDate >= todayStart && nap.endTime;
      });
      
      const mlPredictions = sleepMLModel.predictDailyNaps(
        wakeTimeInfo.wakeTime,
        ageInMonths,
        napsToday
      );
      
      if (mlPredictions && mlPredictions.length > 0) {
        dailyNapSchedule = {
          naps: mlPredictions,
          source: 'ml_model',
          confidence: 85
        };
      } else {
        // Fallback a estadístico
        dailyNapSchedule = await this.predictDailyNaps(naps, now, ageInMonths, wakeTimeInfo, userTimezone);
      }
    } else {
      // Usar sistema estadístico
      dailyNapSchedule = await this.predictDailyNaps(naps, now, ageInMonths, wakeTimeInfo, userTimezone);
    }

    // 2. PREDECIR PRÓXIMA SIESTA (se recalcula después de ajustes de bedtime)
    let napPrediction = null;

    // 3. PREDECIR HORA DE DORMIR NOCTURNA
    let bedtimePrediction;
    
    // 🤖 Si ChatGPT proporcionó bedtime, usarlo
    if (dailyNapSchedule.aiBedtime) {
      console.log('🤖 [BEDTIME] Usando hora de dormir de ChatGPT');
      bedtimePrediction = dailyNapSchedule.aiBedtime;
    } else if (useML) {
      // ML fallback
      const todayStart = startOfDay(now);
      const napsToday = naps.filter(nap => {
        const napDate = parseISO(nap.startTime);
        return napDate >= todayStart && nap.endTime;
      });
      
      const mlBedtime = sleepMLModel.predictBedtime(ageInMonths, napsToday);
      bedtimePrediction = mlBedtime || this.predictBedtime(nightSleeps, ageInMonths, sleepHistory, userTimezone);
    } else {
      // Estadístico fallback
      bedtimePrediction = this.predictBedtime(nightSleeps, ageInMonths, sleepHistory, userTimezone);
    }

    // ✅ Ajustar bedtime final a rango razonable por edad (aplica a TODOS los caminos)
    if (bedtimePrediction?.time) {
      const bedtimeUTC = new Date(bedtimePrediction.time);
      const bedtimeClamp = this.adjustBedtimeToAgeRange(bedtimeUTC, ageInMonths, userTimezone);
      if (bedtimeClamp.adjusted) {
        bedtimePrediction.time = bedtimeClamp.adjustedUTC.toISOString();
        bedtimePrediction.reason = bedtimePrediction.reason
          ? `${bedtimePrediction.reason} (ajustado a horario recomendado)`
          : 'Hora de dormir ajustada a horario recomendado por edad';
      }
    }

    // ✅ Ajustar siestas que terminan después del bedtime y asegurar bedtime > última siesta real
    const wakeWindows = this.getWakeWindows(ageInMonths);
    if (bedtimePrediction?.time) {
      let bedtimeUTC = new Date(bedtimePrediction.time);
      const lastRealNapEnd = this.getLatestNapEndForToday(naps, userTimezone);
      if (lastRealNapEnd && bedtimeUTC <= lastRealNapEnd) {
        const adjustedBedtime = addMinutes(lastRealNapEnd, wakeWindows.min * 60);
        bedtimePrediction.time = adjustedBedtime.toISOString();
        bedtimePrediction.reason = bedtimePrediction.reason
          ? `${bedtimePrediction.reason} (ajustado porque la última siesta terminó tarde)`
          : 'Hora de dormir ajustada porque la última siesta terminó tarde';
        bedtimeUTC = adjustedBedtime;
      }

      const minBufferMinutes = wakeWindows.min * 60;
      const latestAllowedEnd = addMinutes(bedtimeUTC, -minBufferMinutes);
      const beforeCount = dailyNapSchedule.naps.length;
      dailyNapSchedule.naps = dailyNapSchedule.naps.filter((nap) => {
        const napStart = new Date(nap.time);
        const duration = nap.expectedDuration || nap.duration || 60;
        const napEnd = addMinutes(napStart, duration);
        return napEnd <= latestAllowedEnd;
      });
      if (dailyNapSchedule.naps.length !== beforeCount) {
        console.warn(`⚠️ [BEDTIME] Removidas ${beforeCount - dailyNapSchedule.naps.length} siesta(s) por terminar después de bedtime`);
      }
    }

    // 2. PREDECIR PRÓXIMA SIESTA (la más cercana que no ha pasado)
    napPrediction = dailyNapSchedule.naps.find(nap => {
      const napTime = parseISO(nap.time);
      return napTime > now;
    }) || null;

    // 4. ANALIZAR PATRONES DE SUEÑO
    const patterns = this.analyzeSleepPatterns(sleepHistory, ageInMonths);

    // 5. GENERAR RECOMENDACIONES (usar ML si está disponible)
    let recommendations;
    if (useML) {
      const mlRecommendations = sleepMLModel.generateMLRecommendations(
        sleepHistory,
        dailyNapSchedule.naps,
        ageInMonths
      );
      const statisticalRecommendations = this.generateRecommendations(
        patterns,
        ageInMonths,
        sleepHistory
      );
      // Combinar ambas (priorizar ML)
      recommendations = [...mlRecommendations, ...statisticalRecommendations].slice(0, 5);
    } else {
      recommendations = this.generateRecommendations(
        patterns,
        ageInMonths,
        sleepHistory
      );
    }

    // 6. CALCULAR PRESIÓN DE SUEÑO
    const sleepPressure = this.calculateSleepPressure(sleepHistory, now);

    // 7. OBTENER SIESTAS YA REGISTRADAS HOY (HECHOS)
    // ✅ IMPORTANTE: Usar el inicio del día en la timezone del usuario, no en UTC
    const todayInfo = TimezoneHelper.getTodayInUserTimezone(userTimezone);
    const todayStartUTC = todayInfo.start; // Inicio del día en UTC que corresponde a medianoche local
    
    console.log(`📊 [DEBUG] todayStartUTC: ${todayStartUTC.toISOString()}`);
    console.log(`📊 [DEBUG] todayEndUTC: ${todayInfo.end.toISOString()}`);
    console.log(`📊 [DEBUG] now: ${now.toISOString()}`);
    console.log(`📊 [DEBUG] userTimezone: ${userTimezone}`);
    console.log(`📊 [DEBUG] Naps totales antes de filtrar por hoy: ${naps.length}`);
    
    const napsToday = naps.filter(nap => {
      const napDate = parseISO(nap.startTime);
      const isToday = napDate >= todayStartUTC && napDate <= todayInfo.end;
      console.log(`📊 [DEBUG] Nap ${nap.id}: startTime=${nap.startTime}, napDate=${napDate.toISOString()}, isToday=${isToday}`);
      return isToday;
    }).map((nap, index) => {
      // 🔄 Determinar si la siesta está completada o en progreso
      const isCompleted = !!nap.endTime;
      const status = isCompleted ? 'completed' : 'in_progress';
      
      // 🕐 Si está en progreso, calcular duración estimada basada en edad
      let expectedDuration = nap.duration;
      if (!isCompleted && !expectedDuration) {
        // Duración típica por edad si no está definida
        const ageInMonths = this.calculateAgeInMonths(new Date()); // Aproximado
        expectedDuration = ageInMonths <= 6 ? 75 : 90; // 75 min o 90 min
      }
      
      return {
        id: nap.id,
        time: nap.startTime,
        startTime: nap.startTime,
        endTime: nap.endTime,
        duration: nap.duration,
        actualDuration: nap.duration,
        expectedDuration: expectedDuration, // ✅ Mantener duración estimada
        quality: nap.quality,
        location: nap.location,
        pauses: nap.pauses || [],
        napNumber: index + 1,
        type: status, // ✅ 'completed' o 'in_progress'
        status: status, // ✅ Estado correcto
        isReal: true,
        isInProgress: !isCompleted // ✅ Flag adicional
      };
    });

    console.log(`📊 [DEBUG] napsToday después de map: ${napsToday.length} siestas`);
    console.log(`📊 [DEBUG] napsToday detalle:`, napsToday.map(n => ({
      id: n.id,
      type: n.type,
      status: n.status,
      time: n.time,
      duration: n.duration
    })));

    // 8. OBTENER PREDICCIONES FUTURAS DEL DÍA ACTUAL (solo las que NO han pasado)
    const futurePredictions = dailyNapSchedule.naps
      .filter(predictedNap => {
        const predTime = parseISO(predictedNap.time);
        return predTime > now;  // ✅ Solo siestas futuras
      })
      .map((predictedNap, index) => ({
        ...predictedNap,
        // ✅ Respetar napNumber si ya viene definido (desde wake-time)
        // Si no, calcularlo basándose en las siestas registradas
        napNumber: predictedNap.napNumber || (napsToday.length + index + 1),
        type: 'prediction',
        status: 'upcoming',
        isReal: false
      }));

    console.log(`📊 [PREDICT] Total de predicciones del día: ${dailyNapSchedule.naps.length}`);
    console.log(`📊 [PREDICT] Predicciones futuras (mostradas): ${futurePredictions.length}`);
    console.log(`📊 [PREDICT] Predicciones ya pasadas (ocultas): ${dailyNapSchedule.naps.length - futurePredictions.length}`);

    // 9. COMBINAR HECHOS + PREDICCIONES FUTURAS EN UN SOLO ARRAY
    const allNapsOfDay = [
      ...napsToday,           // HECHOS (siestas registradas)
      ...futurePredictions    // PREDICCIONES (solo futuras)
    ].sort((a, b) => parseISO(a.time).getTime() - parseISO(b.time).getTime());

    console.log(`📊 [PREDICT] Total en allNapsOfDay: ${allNapsOfDay.length}`);
    console.log(`📊 [PREDICT] Breakdown:`);
    const completedNaps = napsToday.filter(n => n.status === 'completed').length;
    const inProgressNaps = napsToday.filter(n => n.status === 'in_progress').length;
    console.log(`   - Registradas completadas: ${completedNaps}`);
    console.log(`   - Registradas en progreso: ${inProgressNaps}`);
    console.log(`   - Predichas futuras (upcoming): ${futurePredictions.length}`);

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
   * 🤖 CON MEJORA DE CHATGPT
   */
  async predictDailyNaps(naps, now, ageInMonths, wakeTimeInfo = null, userTimezone = 'UTC') {
    // IMPORTANTE: Las fechas ya vienen en UTC desde Firestore
    // Pero necesitamos considerar la hora LOCAL del usuario
    
    // 🌍 Convertir 'now' a hora local del usuario
    const userLocalTime = TimezoneHelper.utcToUserTime(now, userTimezone);
    const localHour = userLocalTime.getHours() + userLocalTime.getMinutes() / 60;
    
    console.log(`🌍 [PREDICT NAPS] UTC: ${now.toISOString()}, Local (${userTimezone}): ${userLocalTime.toLocaleString()}, Hour: ${localHour.toFixed(2)}`);
    
    // ✅ CAMBIO: Solo predecir para mañana si ya es MUY tarde (después de las 9 PM local)
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

    // Ajuste: para bebés <=6 meses con despertar temprano, preferir máximo de siestas
    if (wakeTimeInfo && wakeTimeInfo.time && ageInMonths <= 6 && expectedNaps.max >= 4) {
      const wakeLocal = TimezoneHelper.utcToUserTime(new Date(wakeTimeInfo.time), userTimezone);
      const wakeHourLocal = wakeLocal.getHours() + wakeLocal.getMinutes() / 60;
      if (wakeHourLocal <= 7.5 && targetNapCount < expectedNaps.max) {
        console.log(`⚠️ [PREDICT DAILY] Wake temprano (${wakeHourLocal.toFixed(2)}h). Ajustando siestas a ${expectedNaps.max}`);
        targetNapCount = expectedNaps.max;
      }
    }

    // Obtener siestas ya registradas del día de predicción
    // ✅ USAR TIMEZONE DEL USUARIO para filtrar correctamente
    const todayInfo = TimezoneHelper.getTodayInUserTimezone(userTimezone);
    const napsOfPredictionDay = naps.filter(nap => {
      const napDate = parseISO(nap.startTime);
      return napDate >= todayInfo.start && napDate <= todayInfo.end;
    });
    
    console.log(`📊 [PREDICT DAILY] napsOfPredictionDay: ${napsOfPredictionDay.length} (filtradas correctamente con timezone)`);


    // ✅ NUEVA LÓGICA: Si hay hora de despertar, calcular basándose en wake windows
    if (wakeTimeInfo && wakeTimeInfo.source !== 'error-default') {
      return await this.predictDailyNapsFromWakeTime(wakeTimeInfo.time, predictionDate, ageInMonths, napsOfPredictionDay, targetNapCount, naps, userTimezone);
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
   * 🤖 AHORA CON MEJORA DE CHATGPT
   */
  async predictDailyNapsFromWakeTime(wakeTime, predictionDate, ageInMonths, napsOfDay, targetNapCount, allNaps, userTimezone = 'UTC') {
    const wakeWindows = this.getWakeWindows(ageInMonths);
    let predictedNaps = [];
    
    console.log(`[WAKE TIME] Predicción basada en despertar: ${wakeTime.toISOString()}`);
    console.log(`[WAKE TIME] Wake windows: ${JSON.stringify(wakeWindows)}`);
    console.log(`[WAKE TIME] Target nap count: ${targetNapCount}`);
    console.log(`[WAKE TIME] Siestas ya registradas hoy: ${napsOfDay.length}`);
    console.log(`[WAKE TIME] Timezone: ${userTimezone}`);
    
    // 🔄 Si hay una siesta EN PROGRESO, calcular siestas DESPUÉS de que termine
    const napInProgress = napsOfDay.find(nap => !nap.endTime);
    let remainingNaps = targetNapCount - napsOfDay.length;
    
    if (napInProgress && remainingNaps > 0) {
      console.log(`⚠️ [WAKE TIME] Hay una siesta EN PROGRESO - calculando siestas DESPUÉS de que termine`);
      console.log(`⚠️ [WAKE TIME] Siesta en progreso: ${napInProgress.startTime}`);
      console.log(`⚠️ [WAKE TIME] Siestas RESTANTES a predecir: ${remainingNaps}`);
      
      // Calcular cuándo terminaría la siesta en progreso
      const napStartTime = new Date(napInProgress.startTime);
      const estimatedDuration = napInProgress.expectedDuration || 75; // minutos estimados
      const estimatedEndTime = addMinutes(napStartTime, estimatedDuration);
      
      console.log(`🔄 [WAKE TIME] Siesta en progreso terminaría: ${estimatedEndTime.toISOString()}`);
      console.log(`🔄 [WAKE TIME] Calculando ${remainingNaps} siesta(s) más desde ese punto...`);
      
      // Usar ChatGPT o cálculo estadístico para predecir las siestas restantes
      // Pasando el estimatedEndTime como "última siesta terminada"
    }
    
    // ✅ VALIDACIÓN: Si NO quedan siestas por predecir, solo calcular bedtime
    if (remainingNaps <= 0) {
      console.log(`✅ [WAKE TIME] Ya se completaron todas las ${targetNapCount} siestas del día`);
      
      // Calcular bedtime desde la última siesta (completada o en progreso)
      const lastNap = napsOfDay[napsOfDay.length - 1];
      let bedtimeBase;
      
      if (lastNap.endTime) {
        // Siesta completada: usar endTime
        bedtimeBase = new Date(lastNap.endTime);
      } else {
        // Siesta en progreso: usar tiempo estimado de fin
        const napStartTime = new Date(lastNap.startTime);
        const estimatedDuration = lastNap.expectedDuration || 75;
        bedtimeBase = addMinutes(napStartTime, estimatedDuration);
      }
      
      const wakeWindow = wakeWindows.optimal * 60; // Convertir a minutos
      const bedtimeTime = addMinutes(bedtimeBase, wakeWindow);
      
      console.log(`🌙 [BEDTIME] Calculado desde última siesta: ${bedtimeTime.toISOString()}`);
      
      return {
        naps: [],
        totalNaps: 0,
        basedOn: 'all-naps-completed',
        wakeTime: wakeTime.toISOString(),
        message: `Todas las ${targetNapCount} siestas del día ya están completadas`,
        aiBedtime: {
          time: bedtimeTime.toISOString(),
          confidence: 85,
          reason: `${wakeWindows.optimal}h después de última siesta`,
          basedOn: 'optimal-wake-window'
        }
      };
    }
    
    // 🤖 PASO 1: INTENTAR CON CHATGPT PRIMERO
    console.log('🤖 [PREDICTION] Intentando obtener predicciones con ChatGPT...');
    const aiPrediction = await this.enhancePredictionsWithAI(
      { ageInMonths, name: 'Bebé' },
      napsOfDay,
      wakeTime,
      userTimezone
    );

    console.log(`🤖 [PREDICTION] Resultado de IA: ${aiPrediction ? 'RECIBIDO ✅' : 'NULL ❌'}`);
    if (aiPrediction) {
      console.log(`🤖 [PREDICTION] IA devolvió ${aiPrediction.remainingNaps?.length || 0} siestas`);
      console.log(`🤖 [PREDICTION] Respuesta completa de IA:`, JSON.stringify(aiPrediction, null, 2));
    } else {
      console.log(`⚠️ [PREDICTION] IA retornó NULL, usará fallback estadístico`);
    }

    if (aiPrediction && (aiPrediction.remainingNaps?.length > 0 || aiPrediction.bedtime)) {
      console.log('🤖 [AI PREDICTION] ✅ Usando predicciones mejoradas con ChatGPT');
      
      // Convertir predicciones de ChatGPT al formato esperado
      const now = new Date();
      const localToday = TimezoneHelper.utcToUserTime(now, userTimezone);
      
      // ✅ Calcular tiempo desde última siesta o wake time
      let lastEventTime = wakeTime;
      if (napsOfDay.length > 0) {
        const lastNap = napsOfDay[napsOfDay.length - 1];
        lastEventTime = new Date(lastNap.endTime || lastNap.startTime);
      }
      
      // ✅ PROCESAR SIESTAS (si hay)
      if (aiPrediction.remainingNaps && aiPrediction.remainingNaps.length > 0) {
        predictedNaps = aiPrediction.remainingNaps.map((aiNap, index) => {
        // Parsear la hora de la respuesta de ChatGPT (formato "HH:MM")
        const [hours, minutes] = aiNap.time.split(':').map(Number);
        
        // Crear fecha en la timezone del usuario
        const napDate = new Date(localToday);
        napDate.setHours(hours, minutes, 0, 0);
        
        // Convertir a UTC para almacenar
        const napTimeUTC = TimezoneHelper.userTimeToUtc(napDate, userTimezone);
        
        // ✅ CALCULAR TIEMPO EXACTO desde el evento anterior
        let timeSinceLastEvent;
        let timeInHours;
        let timeInMinutes;
        
        // Limpiar el reason de ChatGPT: remover referencias a tiempo para evitar duplicación
        let cleanReason = aiNap.reason
          .replace(/\d+(\.\d+)?\s*h\s*(\d+\s*min)?\s*(después|after).*/gi, '')  // "2h después de..."
          .replace(/\d+(\.\d+)?\s*horas?\s*(después|after).*/gi, '')             // "2 horas después de..."
          .replace(/\d+\s*min(utos?)?\s*(después|after).*/gi, '')                // "30 min después de..."
          .replace(/,\s*$/, '')  // Remover coma final si queda
          .trim();
        
        let enhancedReason;
        
        if (index === 0) {
          // Primera siesta: calcular desde última siesta o wake time
          timeInMinutes = differenceInMinutes(napTimeUTC, lastEventTime);
          timeInHours = Math.floor(timeInMinutes / 60);
          const remainingMinutes = timeInMinutes % 60;
          
          if (timeInHours > 0 && remainingMinutes > 0) {
            timeSinceLastEvent = `${timeInHours}h ${remainingMinutes}min`;
          } else if (timeInHours > 0) {
            timeSinceLastEvent = `${timeInHours}h`;
          } else {
            timeSinceLastEvent = `${remainingMinutes}min`;
          }
          
          // Construir reason limpio
          const eventType = napsOfDay.length > 0 ? 'última siesta' : 'despertar';
          enhancedReason = cleanReason 
            ? `${cleanReason} (${timeSinceLastEvent} después de ${eventType})`
            : `Siesta recomendada (${timeSinceLastEvent} después de ${eventType})`;
        } else {
          // Siestas subsecuentes: calcular desde la siesta anterior predicha
          const prevNapTime = new Date(aiPrediction.remainingNaps[index - 1].time.split(':').map(Number));
          prevNapTime.setFullYear(localToday.getFullYear(), localToday.getMonth(), localToday.getDate());
          const prevNapDuration = aiPrediction.remainingNaps[index - 1].duration || 60;
          const prevNapEnd = addMinutes(TimezoneHelper.userTimeToUtc(prevNapTime, userTimezone), prevNapDuration);
          
          timeInMinutes = differenceInMinutes(napTimeUTC, prevNapEnd);
          timeInHours = Math.floor(timeInMinutes / 60);
          const remainingMinutes = timeInMinutes % 60;
          
          if (timeInHours > 0 && remainingMinutes > 0) {
            timeSinceLastEvent = `${timeInHours}h ${remainingMinutes}min`;
          } else if (timeInHours > 0) {
            timeSinceLastEvent = `${timeInHours}h`;
          } else {
            timeSinceLastEvent = `${remainingMinutes}min`;
          }
          
          // Construir reason limpio
          enhancedReason = cleanReason 
            ? `${cleanReason} (${timeSinceLastEvent} ventana de vigilia)`
            : `Siesta recomendada (${timeSinceLastEvent} ventana de vigilia)`;
        }
        
        console.log(`   Siesta ${aiNap.napNumber}: ${aiNap.time} - Ventana: ${timeSinceLastEvent}`);
        
        // 🚨 VALIDAR DURACIÓN MÁXIMA (no más de 2h para bebés de 0-6 meses, 2.5h para mayores)
        let validatedDuration = aiNap.duration;
        const maxDuration = ageInMonths <= 6 ? 120 : 150; // 2h o 2.5h
        
        if (validatedDuration > maxDuration) {
          console.warn(`⚠️ [AI PREDICTION] Duración muy alta (${validatedDuration} min) - limitando a ${maxDuration} min`);
          validatedDuration = maxDuration;
        }
        
        return {
          time: napTimeUTC.toISOString(),
          windowStart: addMinutes(napTimeUTC, -20).toISOString(),
          windowEnd: addMinutes(napTimeUTC, 20).toISOString(),
          expectedDuration: validatedDuration, // ✅ Usar duración validada
          confidence: aiPrediction.confidence || 85,
          napNumber: aiNap.napNumber,
          type: enhancedReason, // ✅ Usar reason mejorado con tiempo exacto
          status: 'upcoming',
          basedOn: 'chatgpt-enhanced',
          aiReason: enhancedReason, // ✅ CAMBIAR a enhancedReason con tiempo exacto
          wakeWindow: timeSinceLastEvent // ✅ Agregar ventana de vigilia
        };
      });

      console.log(`✅ [AI PREDICTION] ${predictedNaps.length} siestas predichas con IA`);
      } else {
        console.log(`ℹ️ [AI PREDICTION] No hay siestas pendientes (ya completadas)`);
        predictedNaps = [];
      }
      
      // 🌙 Procesar bedtime de ChatGPT (SIEMPRE, aunque no haya siestas)
      let aiBedtime = null;
      if (aiPrediction.bedtime && aiPrediction.bedtime.time) {
        const [bedHours, bedMinutes] = aiPrediction.bedtime.time.split(':').map(Number);
        const bedtimeDate = new Date(localToday);
        bedtimeDate.setHours(bedHours, bedMinutes, 0, 0);
        let bedtimeUTC = TimezoneHelper.userTimeToUtc(bedtimeDate, userTimezone);

        // ✅ Ajustar bedtime a un rango razonable por edad (hora local)
        const bedtimeClamp = this.adjustBedtimeToAgeRange(bedtimeUTC, ageInMonths, userTimezone);
        if (bedtimeClamp.adjusted) {
          console.log(`⚠️ [BEDTIME] Bedtime IA ajustado a rango por edad (${bedtimeClamp.minHourLocal}-${bedtimeClamp.maxHourLocal}h)`);
          bedtimeUTC = bedtimeClamp.adjustedUTC;
        }
        
        // ✅ CALCULAR TIEMPO desde la última siesta predicha
        let cleanBedtimeReason = (aiPrediction.bedtime.reason || 'Sugerido por IA')
          .replace(/\d+(\.\d+)?\s*h\s*(\d+\s*min)?\s*(después|after).*/gi, '')
          .replace(/\d+(\.\d+)?\s*horas?\s*(después|after).*/gi, '')
          .replace(/\d+\s*min(utos?)?\s*(después|after).*/gi, '')
          .replace(/,\s*$/, '')
          .trim();
        
        let enhancedBedtimeReason;
        
        // 🔄 Verificar si hay una siesta EN PROGRESO
        const napInProgress = napsOfDay.find(nap => !nap.endTime);
        
        if (napInProgress) {
          // Calcular desde cuándo TERMINARÍA la siesta en progreso
          const napStartTime = new Date(napInProgress.startTime);
          const estimatedDuration = napInProgress.expectedDuration || 75; // minutos
          const estimatedEndTime = addMinutes(napStartTime, estimatedDuration);
          
          const timeUntilBedtime = differenceInMinutes(bedtimeUTC, estimatedEndTime);
          const hours = Math.floor(timeUntilBedtime / 60);
          const minutes = timeUntilBedtime % 60;
          
          let timeDisplay;
          if (hours > 0 && minutes > 0) {
            timeDisplay = `${hours}h ${minutes}min`;
          } else if (hours > 0) {
            timeDisplay = `${hours}h`;
          } else {
            timeDisplay = `${minutes}min`;
          }
          
          enhancedBedtimeReason = `${cleanBedtimeReason} (${timeDisplay} después de que termine la siesta en progreso)`;
          
          console.log(`   Hora de dormir: ${aiPrediction.bedtime.time} - Ventana: ${timeDisplay} después de siesta en progreso`);
        } else if (predictedNaps.length > 0) {
          const lastPredictedNap = predictedNaps[predictedNaps.length - 1];
          const lastNapTime = new Date(lastPredictedNap.time);
          const lastNapEnd = addMinutes(lastNapTime, lastPredictedNap.expectedDuration || 60);
          
          const timeUntilBedtime = differenceInMinutes(bedtimeUTC, lastNapEnd);
          const hours = Math.floor(timeUntilBedtime / 60);
          const minutes = timeUntilBedtime % 60;
          
          let timeDisplay;
          if (hours > 0 && minutes > 0) {
            timeDisplay = `${hours}h ${minutes}min`;
          } else if (hours > 0) {
            timeDisplay = `${hours}h`;
          } else {
            timeDisplay = `${minutes}min`;
          }
          
          enhancedBedtimeReason = cleanBedtimeReason 
            ? `${cleanBedtimeReason} (${timeDisplay} después de última siesta)`
            : `Hora de dormir recomendada (${timeDisplay} después de última siesta)`;
          
          console.log(`   Hora de dormir: ${aiPrediction.bedtime.time} - Ventana: ${timeDisplay} después de siesta ${lastPredictedNap.napNumber}`);
        } else if (napsOfDay.length > 0) {
          // Calcular desde la última siesta completada
          const lastCompletedNap = napsOfDay[napsOfDay.length - 1];
          const lastNapEnd = new Date(lastCompletedNap.endTime);
          
          const timeUntilBedtime = differenceInMinutes(bedtimeUTC, lastNapEnd);
          const hours = Math.floor(timeUntilBedtime / 60);
          const minutes = timeUntilBedtime % 60;
          
          let timeDisplay;
          if (hours > 0 && minutes > 0) {
            timeDisplay = `${hours}h ${minutes}min`;
          } else if (hours > 0) {
            timeDisplay = `${hours}h`;
          } else {
            timeDisplay = `${minutes}min`;
          }
          
          enhancedBedtimeReason = cleanBedtimeReason 
            ? `${cleanBedtimeReason} (${timeDisplay} después de última siesta)`
            : `Hora de dormir recomendada (${timeDisplay} después de última siesta)`;
        } else {
          enhancedBedtimeReason = cleanBedtimeReason || 'Hora de dormir recomendada';
        }

        // ✅ Si el bedtime fue ajustado, aclarar en la razón
        if (bedtimeClamp.adjusted) {
          enhancedBedtimeReason = enhancedBedtimeReason
            ? `${enhancedBedtimeReason} (ajustado a horario recomendado)`
            : 'Hora de dormir ajustada a horario recomendado por edad';
        }

        // ✅ Quitar siestas que terminen muy cerca o después del bedtime
        if (predictedNaps.length > 0) {
          const minBufferMinutes = wakeWindows.min * 60;
          const latestAllowedEnd = addMinutes(bedtimeUTC, -minBufferMinutes);
          const beforeCount = predictedNaps.length;

          predictedNaps = predictedNaps.filter((nap) => {
            const napEnd = addMinutes(new Date(nap.time), nap.expectedDuration || 60);
            return napEnd <= latestAllowedEnd;
          });

          if (predictedNaps.length !== beforeCount) {
            console.warn(`⚠️ [BEDTIME] Se removieron ${beforeCount - predictedNaps.length} siesta(s) por terminar muy tarde`);
          }
        }
        
        aiBedtime = {
          time: bedtimeUTC.toISOString(),
          confidence: aiPrediction.confidence || 85,
          reason: enhancedBedtimeReason, // ✅ Reason mejorado con tiempo exacto
          basedOn: 'chatgpt-ai'
        };
        
        console.log(`✅ [AI PREDICTION] Hora de dormir sugerida: ${aiPrediction.bedtime.time} (${bedtimeUTC.toISOString()})`);
      }
      
      return {
        naps: predictedNaps,
        totalNaps: predictedNaps.length,
        basedOn: 'chatgpt-ai',
        wakeTime: wakeTime.toISOString(),
        aiExplanation: aiPrediction.explanation,
        aiBedtime: aiBedtime  // ✅ Incluir bedtime de IA
      };
    }
    
    // ⚠️ Si llegamos aquí, ChatGPT no proporcionó predicciones válidas
    console.warn(`⚠️ [PREDICTION] ChatGPT no proporcionó predicciones válidas`);
    console.warn(`⚠️ [PREDICTION] aiPrediction:`, aiPrediction);
    console.warn(`⚠️ [PREDICTION] aiPrediction?.remainingNaps:`, aiPrediction?.remainingNaps);
    console.warn(`⚠️ [PREDICTION] length:`, aiPrediction?.remainingNaps?.length);

    // 📊 PASO 2: SI NO HAY AI, USAR MÉTODO ESTADÍSTICO (FALLBACK)
    console.log('📊 [STATISTICAL] Usando método estadístico (ChatGPT no disponible)');
    
    // ✅ AJUSTE DINÁMICO: Si ya hay siestas registradas, usar la ÚLTIMA como punto de partida
    let currentTime;
    let startNapNumber;
    
    if (napsOfDay.length > 0) {
      // Ordenar por hora de inicio
      const sortedNaps = [...napsOfDay].sort((a, b) => 
        parseISO(a.startTime).getTime() - parseISO(b.startTime).getTime()
      );
      const lastNap = sortedNaps[sortedNaps.length - 1];
      
      // Empezar desde el fin de la última siesta registrada
      currentTime = lastNap.endTime ? parseISO(lastNap.endTime) : parseISO(lastNap.startTime);
      startNapNumber = napsOfDay.length + 1;  // La siguiente siesta será #4, #5, etc.
      
      console.log(`[WAKE TIME] ✅ Recalculando desde última siesta (#${napsOfDay.length})`);
      console.log(`[WAKE TIME] Última siesta terminó: ${currentTime.toISOString()}`);
    } else {
      // No hay siestas registradas, empezar desde el despertar
      currentTime = new Date(wakeTime);
      startNapNumber = 1;
      
      console.log(`[WAKE TIME] ✅ Calculando desde despertar (sin siestas registradas)`);
    }
    
    // ✅ AJUSTE: Determinar límite máximo de hora según edad
    // - Bebés pequeños (0-6 meses): última siesta puede ser hasta las 6 PM
    // - Bebés mayores (6+ meses): última siesta hasta 6:30 PM
    const maxNapHourLocal = ageInMonths <= 6 ? 18 : 18.5;
    
    // ✅ Calcular cuántas siestas FALTAN por predecir (ya declarado arriba, solo actualizar valor)
    remainingNaps = targetNapCount - napsOfDay.length;
    
    // 🚨 VALIDACIÓN: Si ya hay suficientes siestas, no predecir más
    if (remainingNaps <= 0) {
      console.log(`⚠️ [WAKE TIME] Ya hay ${napsOfDay.length} siestas (target: ${targetNapCount}) - no se predecirán más`);
      return {
        naps: [],
        totalNaps: 0,
        basedOn: 'target-reached',
        wakeTime: wakeTime.toISOString(),
        message: `Ya se completaron las ${targetNapCount} siestas del día`
      };
    }
    
    console.log(`[WAKE TIME] Siestas a predecir: ${remainingNaps} (target: ${targetNapCount}, registradas: ${napsOfDay.length})`);
    
    // Generar siestas basándose en wake windows
    for (let i = 0; i < remainingNaps; i++) {
      const napNumber = startNapNumber + i;
      
      // Calcular tiempo desde el último evento de sueño + wake window
      const wakeWindow = wakeWindows.optimal;
      const napTime = new Date(currentTime);
      napTime.setMinutes(napTime.getMinutes() + (wakeWindow * 60));
      
      // Validar hora usando TimezoneHelper
      const napTimeLocal = TimezoneHelper.utcToUserTime(napTime, userTimezone);
      const napHourLocal = napTimeLocal.getHours() + napTimeLocal.getMinutes() / 60;
      
      console.log(`[WAKE TIME] Siesta ${napNumber}: ${napTime.toISOString()} (${Math.floor(napHourLocal)}:${napTimeLocal.getMinutes()} local)`);
      
      // ✅ Solo validar que no sea DESPUÉS de la hora límite
      // No validar el mínimo (7 AM) porque podemos estar prediciendo para mañana
      if (napHourLocal >= maxNapHourLocal) {
        console.log(`[WAKE TIME] Siesta ${napNumber} después de límite (${Math.floor(napHourLocal)}h >= ${maxNapHourLocal}h local), deteniendo`);
        break;
      }
      
      const napType = this.getNapTypeByTime(Math.floor(napHourLocal));
      
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
        napNumber: napNumber,
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

  getLatestNapEndForToday(naps, userTimezone = 'UTC') {
    if (!naps || naps.length === 0) return null;
    const todayInfo = TimezoneHelper.getTodayInUserTimezone(userTimezone);
    const napsToday = naps.filter(nap => {
      const napDate = parseISO(nap.startTime);
      return napDate >= todayInfo.start && napDate <= todayInfo.end;
    });
    if (napsToday.length === 0) return null;

    let latestEnd = null;
    napsToday.forEach((nap) => {
      let napEnd = null;
      if (nap.endTime) {
        napEnd = parseISO(nap.endTime);
      } else if (nap.startTime) {
        const start = parseISO(nap.startTime);
        const duration = nap.expectedDuration || nap.duration || 75;
        napEnd = addMinutes(start, duration);
      }
      if (napEnd && (!latestEnd || napEnd > latestEnd)) {
        latestEnd = napEnd;
      }
    });
    return latestEnd;
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
  predictBedtime(nightSleeps, ageInMonths, allSleepHistory = [], userTimezone = 'UTC') {
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
      
      // 🌍 Convertir a hora local del usuario para cálculos
      const lastNapEndLocal = TimezoneHelper.utcToUserTime(lastNapEnd, userTimezone);
      const lastNapHour = lastNapEndLocal.getHours() + lastNapEndLocal.getMinutes() / 60;
      
      console.log(`🌙 [BEDTIME] Última siesta (local): ${lastNapEndLocal.toLocaleString()} (${lastNapHour.toFixed(2)}h)`);
      
      // Calcular hora de dormir: última siesta + 2.5-3 horas
      // Ajustar según edad (bebés más pequeños duermen antes)
      let hoursAfterNap = 2.75; // Por defecto
      if (ageInMonths <= 3) hoursAfterNap = 2.5;
      if (ageInMonths >= 12) hoursAfterNap = 3.0;
      
      let bedtimeHour = lastNapHour + hoursAfterNap;
      
      // Ajustar al rango válido (6 PM - 9 PM) EN HORA LOCAL
      if (bedtimeHour < 18) bedtimeHour = 18;
      if (bedtimeHour > 21) bedtimeHour = 21;
      
      const bedtimeHours = Math.floor(bedtimeHour);
      const bedtimeMinutes = Math.round((bedtimeHour % 1) * 60);
      
      console.log(`🌙 [BEDTIME] Hora calculada: ${bedtimeHour.toFixed(2)} (${bedtimeHours}:${bedtimeMinutes.toString().padStart(2, '0')})`);
      
      // ✅ CREAR FECHA EN HORA LOCAL DEL USUARIO
      // Copiar la fecha de la última siesta (en local)
      const bedtimeDateLocal = new Date(lastNapEndLocal);
      bedtimeDateLocal.setHours(bedtimeHours, bedtimeMinutes, 0, 0);
      
      console.log(`🌙 [BEDTIME] Fecha local calculada: ${bedtimeDateLocal.toLocaleString()}`);
      
      // ✅ CONVERTIR A UTC
      const bedtimeDateUTC = TimezoneHelper.userTimeToUtc(bedtimeDateLocal, userTimezone);
      
      console.log(`🌙 [BEDTIME] Fecha UTC final: ${bedtimeDateUTC.toISOString()}`);
      
      // Si ya pasó, programar para mañana
      const now = new Date();
      if (bedtimeDateUTC <= now) {
        bedtimeDateUTC.setUTCDate(bedtimeDateUTC.getUTCDate() + 1);
        console.log(`🌙 [BEDTIME] Ya pasó, movido a mañana: ${bedtimeDateUTC.toISOString()}`);
      }
      
      const lastNapEndFormatted = format(lastNapEndLocal, 'h:mm a');
      
      return {
        time: bedtimeDateUTC.toISOString(),
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
   * Ajustar bedtime a un rango razonable según la edad (hora local)
   */
  adjustBedtimeToAgeRange(bedtimeUTC, ageInMonths, userTimezone = 'UTC') {
    const schedule = this.getDefaultScheduleByAge(ageInMonths);
    const bedtimeStr = schedule.bedtime || '7:00 PM';
    const [hourMin, period] = bedtimeStr.split(' ');
    const [hour, min] = hourMin.split(':');
    let maxHour24 = parseInt(hour, 10);
    const minHour24 = 18; // 6:00 PM

    if (period === 'PM' && maxHour24 !== 12) {
      maxHour24 += 12;
    } else if (period === 'AM' && maxHour24 === 12) {
      maxHour24 = 0;
    }

    const maxMinutes = min ? parseInt(min, 10) : 0;
    const maxHourFloat = maxHour24 + maxMinutes / 60;

    const localBedtime = TimezoneHelper.utcToUserTime(bedtimeUTC, userTimezone);
    const localHourFloat = localBedtime.getHours() + localBedtime.getMinutes() / 60;

    let adjusted = false;
    let adjustedLocal = new Date(localBedtime);

    if (localHourFloat > maxHourFloat) {
      adjustedLocal.setHours(maxHour24, maxMinutes, 0, 0);
      adjusted = true;
    } else if (localHourFloat < minHour24) {
      adjustedLocal.setHours(minHour24, 0, 0, 0);
      adjusted = true;
    }

    const adjustedUTC = adjusted ? TimezoneHelper.userTimeToUtc(adjustedLocal, userTimezone) : bedtimeUTC;

    return {
      adjustedUTC,
      adjustedLocal,
      adjusted,
      maxHourLocal: maxHourFloat,
      minHourLocal: minHour24
    };
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

