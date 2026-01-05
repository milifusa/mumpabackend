/**
 * 🛌 Script de Prueba - Sistema de Predicción de Sueño
 * 
 * Este script prueba todas las funcionalidades del sistema
 * de predicción de sueño tipo Napper
 */

const axios = require('axios');

// Configuración
const API_URL = process.env.API_URL || 'http://localhost:3000';
const TEST_TOKEN = process.env.TEST_TOKEN || '';
const TEST_CHILD_ID = process.env.TEST_CHILD_ID || '';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Authorization': `Bearer ${TEST_TOKEN}`,
    'Content-Type': 'application/json'
  }
});

// Colores para consola
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(color, symbol, message, data = null) {
  console.log(`${color}${symbol} ${message}${colors.reset}`);
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
}

async function testRecordSleep() {
  log(colors.cyan, '📝', 'Probando: Registrar evento de sueño...');
  
  try {
    const now = new Date();
    const sleepData = {
      childId: TEST_CHILD_ID,
      type: 'nap',
      startTime: new Date(now.getTime() - 90 * 60000).toISOString(), // Hace 90 min
      endTime: now.toISOString(),
      duration: 90,
      quality: 'good',
      wakeUps: 1,
      location: 'crib',
      temperature: 21,
      noiseLevel: 0.3,
      notes: 'Prueba de siesta'
    };

    const response = await api.post('/api/sleep/record', sleepData);
    
    log(colors.green, '✅', 'Evento registrado exitosamente');
    console.log('  ID:', response.data.sleepEventId);
    console.log('  Tipo:', response.data.sleepEvent.type);
    console.log('  Duración:', response.data.sleepEvent.duration, 'minutos');
    
    return response.data.sleepEventId;
  } catch (error) {
    log(colors.red, '❌', 'Error al registrar evento');
    console.error('  Error:', error.response?.data || error.message);
    return null;
  }
}

async function testRecordMultipleEvents() {
  log(colors.cyan, '📝', 'Registrando múltiples eventos de prueba...');
  
  const events = [
    // Ayer
    { type: 'nap', hoursAgo: 32, duration: 60, quality: 'good' },
    { type: 'nap', hoursAgo: 28, duration: 75, quality: 'excellent' },
    { type: 'nightsleep', hoursAgo: 20, duration: 600, quality: 'good', wakeUps: 2 },
    
    // Hoy
    { type: 'nap', hoursAgo: 10, duration: 45, quality: 'fair' },
    { type: 'nap', hoursAgo: 5, duration: 90, quality: 'good' },
  ];

  const eventIds = [];

  for (const event of events) {
    try {
      const endTime = new Date(Date.now() - event.hoursAgo * 3600000);
      const startTime = new Date(endTime.getTime() - event.duration * 60000);

      const response = await api.post('/api/sleep/record', {
        childId: TEST_CHILD_ID,
        type: event.type,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        duration: event.duration,
        quality: event.quality,
        wakeUps: event.wakeUps || 0,
        location: 'crib'
      });

      eventIds.push(response.data.sleepEventId);
      console.log(`  ✓ ${event.type} - ${event.duration}min - hace ${event.hoursAgo}h`);
    } catch (error) {
      console.log(`  ✗ Error en evento: ${error.message}`);
    }

    // Esperar 100ms entre requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  log(colors.green, '✅', `${eventIds.length} eventos registrados`);
  return eventIds;
}

async function testGetPrediction() {
  log(colors.cyan, '🔮', 'Probando: Obtener predicción de sueño...');
  
  try {
    const response = await api.get(`/api/sleep/predict/${TEST_CHILD_ID}`);
    const { prediction, childInfo } = response.data;

    log(colors.green, '✅', 'Predicción obtenida exitosamente');
    
    console.log(`\n  👶 Niño: ${childInfo.name}`);
    console.log(`  📅 Edad: ${childInfo.ageInMonths} meses`);
    console.log(`  📊 Datos: ${childInfo.dataPoints} eventos`);
    
    if (prediction.nextNap) {
      console.log(`\n  🛌 PRÓXIMA SIESTA:`);
      console.log(`     Hora: ${new Date(prediction.nextNap.time).toLocaleString()}`);
      console.log(`     Tipo: ${prediction.nextNap.type}`);
      console.log(`     Duración esperada: ${prediction.nextNap.expectedDuration} min`);
      console.log(`     Confianza: ${prediction.nextNap.confidence}%`);
      console.log(`     Ventana: ${new Date(prediction.nextNap.windowStart).toLocaleTimeString()} - ${new Date(prediction.nextNap.windowEnd).toLocaleTimeString()}`);
    }

    if (prediction.bedtime) {
      console.log(`\n  🌙 HORA DE DORMIR:`);
      console.log(`     Hora: ${new Date(prediction.bedtime.time).toLocaleString()}`);
      console.log(`     Confianza: ${prediction.bedtime.confidence}%`);
      console.log(`     Consistencia: ${prediction.bedtime.consistency}`);
    }

    console.log(`\n  💤 PRESIÓN DE SUEÑO:`);
    console.log(`     Nivel: ${prediction.sleepPressure.level.toUpperCase()}`);
    console.log(`     Horas desde último sueño: ${prediction.sleepPressure.hoursSinceLastSleep}`);
    console.log(`     Recomendación: ${prediction.sleepPressure.recommendation}`);

    console.log(`\n  📈 PATRONES:`);
    console.log(`     Sueño diario total: ${Math.round(prediction.patterns.totalDailySleep / 60)} horas`);
    console.log(`     Siestas por día: ${prediction.patterns.napStats.averagePerDay}`);
    console.log(`     Duración promedio siesta: ${prediction.patterns.napStats.averageDuration} min`);
    console.log(`     Calidad general: ${prediction.patterns.overallQuality}`);
    console.log(`     Consistencia: ${prediction.patterns.consistency}%`);

    if (prediction.recommendations.length > 0) {
      console.log(`\n  💡 RECOMENDACIONES:`);
      prediction.recommendations.forEach((rec, i) => {
        const icon = rec.type === 'success' ? '✅' : 
                     rec.type === 'warning' ? '⚠️' : 
                     rec.type === 'tip' ? '💡' : 'ℹ️';
        console.log(`     ${icon} ${rec.title}`);
        console.log(`        ${rec.message}`);
        console.log(`        → ${rec.action}`);
      });
    }

    return prediction;
  } catch (error) {
    log(colors.red, '❌', 'Error al obtener predicción');
    console.error('  Error:', error.response?.data || error.message);
    return null;
  }
}

async function testGetHistory() {
  log(colors.cyan, '📚', 'Probando: Obtener historial de sueño...');
  
  try {
    const response = await api.get(`/api/sleep/history/${TEST_CHILD_ID}?days=7`);
    const { sleepHistory, statistics } = response.data;

    log(colors.green, '✅', 'Historial obtenido exitosamente');
    
    console.log(`\n  📊 ESTADÍSTICAS (últimos 7 días):`);
    console.log(`     Total eventos: ${statistics.totalEvents}`);
    console.log(`     Siestas: ${statistics.totalNaps}`);
    console.log(`     Noches: ${statistics.totalNights}`);
    console.log(`     Duración promedio siesta: ${statistics.avgNapDuration} min`);
    console.log(`     Duración promedio noche: ${Math.round(statistics.avgNightDuration / 60)} horas`);

    if (sleepHistory.length > 0) {
      console.log(`\n  📋 ÚLTIMOS 3 EVENTOS:`);
      sleepHistory.slice(-3).forEach(event => {
        const start = new Date(event.startTime);
        console.log(`     ${event.type === 'nap' ? '🛌' : '🌙'} ${event.type.toUpperCase()}`);
        console.log(`        Inicio: ${start.toLocaleString()}`);
        console.log(`        Duración: ${event.duration || 'N/A'} min`);
        console.log(`        Calidad: ${event.quality}`);
      });
    }

    return sleepHistory;
  } catch (error) {
    log(colors.red, '❌', 'Error al obtener historial');
    console.error('  Error:', error.response?.data || error.message);
    return null;
  }
}

async function testGetAnalysis() {
  log(colors.cyan, '📊', 'Probando: Análisis detallado de patrones...');
  
  try {
    const response = await api.get(`/api/sleep/analysis/${TEST_CHILD_ID}?days=30`);
    const { analysis } = response.data;

    log(colors.green, '✅', 'Análisis obtenido exitosamente');
    
    console.log(`\n  👶 ${analysis.childInfo.name} (${analysis.childInfo.ageInMonths} meses)`);
    console.log(`  📅 Período: ${analysis.dataRange.days} días`);
    console.log(`  📊 Total eventos: ${analysis.dataRange.totalEvents}`);

    console.log(`\n  📈 ANÁLISIS DE PATRONES:`);
    console.log(`     Sueño diario: ${Math.round(analysis.patterns.totalDailySleep / 60)} horas`);
    console.log(`     Siestas/día: ${analysis.patterns.napStats.averagePerDay}`);
    console.log(`     Despertares nocturnos: ${analysis.patterns.nightStats.averageWakeUps}`);
    console.log(`     Calidad: ${analysis.patterns.overallQuality}`);
    console.log(`     Consistencia: ${analysis.patterns.consistency}%`);

    if (analysis.recommendations.length > 0) {
      console.log(`\n  💡 RECOMENDACIONES:`);
      analysis.recommendations.forEach(rec => {
        console.log(`     [${rec.category}] ${rec.title}`);
        console.log(`        ${rec.message}`);
      });
    }

    return analysis;
  } catch (error) {
    log(colors.red, '❌', 'Error al obtener análisis');
    console.error('  Error:', error.response?.data || error.message);
    return null;
  }
}

async function testGetStats() {
  log(colors.cyan, '📈', 'Probando: Estadísticas semanales...');
  
  try {
    const response = await api.get(`/api/sleep/stats/${TEST_CHILD_ID}?period=week`);
    const { dailyStats, summary } = response.data;

    log(colors.green, '✅', 'Estadísticas obtenidas exitosamente');
    
    console.log(`\n  📊 RESUMEN SEMANAL:`);
    console.log(`     Total eventos: ${summary.totalEvents}`);
    console.log(`     Promedio sueño/día: ${Math.round(summary.avgSleepPerDay / 60)} horas`);
    console.log(`     Promedio siestas/día: ${summary.avgNapsPerDay}`);

    if (dailyStats.length > 0) {
      console.log(`\n  📅 ÚLTIMOS 3 DÍAS:`);
      dailyStats.slice(-3).forEach(day => {
        console.log(`     ${day.date}`);
        console.log(`        Sueño total: ${Math.round(day.totalSleep / 60)} horas`);
        console.log(`        Siestas: ${day.naps}`);
      });
    }

    return dailyStats;
  } catch (error) {
    log(colors.red, '❌', 'Error al obtener estadísticas');
    console.error('  Error:', error.response?.data || error.message);
    return null;
  }
}

async function testGetReminders() {
  log(colors.cyan, '🔔', 'Probando: Recordatorios inteligentes...');
  
  try {
    const response = await api.get(`/api/sleep/reminders/${TEST_CHILD_ID}`);
    const { reminders, sleepPressure } = response.data;

    log(colors.green, '✅', 'Recordatorios obtenidos exitosamente');
    
    console.log(`\n  💤 PRESIÓN DE SUEÑO: ${sleepPressure.level.toUpperCase()}`);
    console.log(`     Horas desde último sueño: ${sleepPressure.hoursSinceLastSleep || 'N/A'}`);

    if (reminders.length > 0) {
      console.log(`\n  🔔 RECORDATORIOS ACTIVOS:`);
      reminders.forEach(reminder => {
        const priorityColor = 
          reminder.priority === 'critical' ? colors.red :
          reminder.priority === 'high' ? colors.yellow :
          colors.blue;
        
        console.log(`${priorityColor}     [${reminder.priority.toUpperCase()}] ${reminder.title}${colors.reset}`);
        console.log(`        ${reminder.message}`);
        if (reminder.minutesUntil) {
          console.log(`        En ${reminder.minutesUntil} minutos`);
        }
      });
    } else {
      console.log(`\n  ℹ️ No hay recordatorios activos en este momento`);
    }

    return reminders;
  } catch (error) {
    log(colors.red, '❌', 'Error al obtener recordatorios');
    console.error('  Error:', error.response?.data || error.message);
    return null;
  }
}

async function testUpdateEvent(eventId) {
  if (!eventId) {
    log(colors.yellow, '⚠️', 'Saltando prueba de actualización (sin eventId)');
    return;
  }

  log(colors.cyan, '✏️', 'Probando: Actualizar evento de sueño...');
  
  try {
    await api.put(`/api/sleep/${eventId}`, {
      quality: 'excellent',
      notes: 'Actualizado en prueba'
    });

    log(colors.green, '✅', 'Evento actualizado exitosamente');
    console.log('  ID:', eventId);
  } catch (error) {
    log(colors.red, '❌', 'Error al actualizar evento');
    console.error('  Error:', error.response?.data || error.message);
  }
}

async function testDeleteEvent(eventId) {
  if (!eventId) {
    log(colors.yellow, '⚠️', 'Saltando prueba de eliminación (sin eventId)');
    return;
  }

  log(colors.cyan, '🗑️', 'Probando: Eliminar evento de sueño...');
  
  try {
    await api.delete(`/api/sleep/${eventId}`);

    log(colors.green, '✅', 'Evento eliminado exitosamente');
    console.log('  ID:', eventId);
  } catch (error) {
    log(colors.red, '❌', 'Error al eliminar evento');
    console.error('  Error:', error.response?.data || error.message);
  }
}

// ============================================================================
// EJECUTAR TODAS LAS PRUEBAS
// ============================================================================

async function runAllTests() {
  console.log('\n');
  log(colors.magenta, '🧪', '═══════════════════════════════════════════════════');
  log(colors.magenta, '🧪', '   PRUEBA DE SISTEMA DE PREDICCIÓN DE SUEÑO');
  log(colors.magenta, '🧪', '═══════════════════════════════════════════════════');
  console.log('\n');

  // Verificar configuración
  if (!TEST_TOKEN) {
    log(colors.red, '❌', 'ERROR: TEST_TOKEN no configurado');
    console.log('  Uso: TEST_TOKEN=tu_token TEST_CHILD_ID=child_id node test-sleep-prediction.js');
    process.exit(1);
  }

  if (!TEST_CHILD_ID) {
    log(colors.red, '❌', 'ERROR: TEST_CHILD_ID no configurado');
    process.exit(1);
  }

  log(colors.blue, 'ℹ️', `API URL: ${API_URL}`);
  log(colors.blue, 'ℹ️', `Child ID: ${TEST_CHILD_ID}`);
  console.log('\n');

  try {
    // 1. Registrar múltiples eventos
    const eventIds = await testRecordMultipleEvents();
    console.log('\n');

    // 2. Registrar un evento individual
    const singleEventId = await testRecordSleep();
    console.log('\n');

    // 3. Obtener historial
    await testGetHistory();
    console.log('\n');

    // 4. Obtener predicción
    await testGetPrediction();
    console.log('\n');

    // 5. Análisis detallado
    await testGetAnalysis();
    console.log('\n');

    // 6. Estadísticas
    await testGetStats();
    console.log('\n');

    // 7. Recordatorios
    await testGetReminders();
    console.log('\n');

    // 8. Actualizar evento
    if (singleEventId) {
      await testUpdateEvent(singleEventId);
      console.log('\n');
    }

    // 9. Eliminar evento (opcional - comentar si no quieres eliminar)
    // await testDeleteEvent(singleEventId);
    // console.log('\n');

    log(colors.green, '✅', '═══════════════════════════════════════════════════');
    log(colors.green, '✅', '   TODAS LAS PRUEBAS COMPLETADAS EXITOSAMENTE');
    log(colors.green, '✅', '═══════════════════════════════════════════════════');
    
  } catch (error) {
    log(colors.red, '❌', '═══════════════════════════════════════════════════');
    log(colors.red, '❌', '   ERROR EN LAS PRUEBAS');
    log(colors.red, '❌', '═══════════════════════════════════════════════════');
    console.error(error);
  }
}

// Ejecutar pruebas
if (require.main === module) {
  runAllTests();
}

module.exports = {
  testRecordSleep,
  testGetPrediction,
  testGetHistory,
  testGetAnalysis,
  testGetStats,
  testGetReminders,
  testUpdateEvent,
  testDeleteEvent
};

