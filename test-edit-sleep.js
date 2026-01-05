/**
 * 🧪 Script de Prueba - Edición de Siestas y Pausas
 * 
 * Prueba las funcionalidades de edición de eventos de sueño
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
  cyan: '\x1b[36m'
};

function log(color, symbol, message, data = null) {
  console.log(`${color}${symbol} ${message}${colors.reset}`);
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
}

// Crear evento de prueba
async function createTestEvent() {
  log(colors.cyan, '📝', 'Creando evento de sueño de prueba...');
  
  try {
    const now = new Date();
    const startTime = new Date(now.getTime() - 2 * 3600000); // Hace 2 horas
    const endTime = new Date(now.getTime() - 30 * 60000); // Hace 30 min
    
    const response = await api.post('/api/sleep/record', {
      childId: TEST_CHILD_ID,
      type: 'nap',
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      quality: 'good',
      location: 'crib'
    });

    log(colors.green, '✅', 'Evento creado exitosamente');
    console.log('  ID:', response.data.sleepEventId);
    console.log('  Duración:', response.data.sleepEvent.duration, 'minutos');
    
    return response.data.sleepEventId;
  } catch (error) {
    log(colors.red, '❌', 'Error creando evento');
    console.error('  Error:', error.response?.data || error.message);
    return null;
  }
}

// Test 1: Editar hora de inicio
async function testEditStartTime(eventId) {
  log(colors.cyan, '📝', 'Test 1: Editando hora de inicio (empezó 15 min antes)...');
  
  try {
    const newStartTime = new Date(Date.now() - 2.25 * 3600000); // 15 min antes
    
    const response = await api.patch(`/api/sleep/${eventId}/times`, {
      startTime: newStartTime.toISOString()
    });

    log(colors.green, '✅', 'Hora de inicio actualizada');
    console.log('  Nueva duración:', response.data.sleepEvent.duration, 'minutos');
    console.log('  Duración bruta:', response.data.sleepEvent.grossDuration, 'minutos');
    
    return true;
  } catch (error) {
    log(colors.red, '❌', 'Error editando hora de inicio');
    console.error('  Error:', error.response?.data || error.message);
    return false;
  }
}

// Test 2: Editar hora de fin
async function testEditEndTime(eventId) {
  log(colors.cyan, '📝', 'Test 2: Editando hora de fin (terminó 10 min después)...');
  
  try {
    const newEndTime = new Date(Date.now() - 20 * 60000); // 10 min más tarde
    
    const response = await api.patch(`/api/sleep/${eventId}/times`, {
      endTime: newEndTime.toISOString()
    });

    log(colors.green, '✅', 'Hora de fin actualizada');
    console.log('  Nueva duración:', response.data.sleepEvent.duration, 'minutos');
    
    return true;
  } catch (error) {
    log(colors.red, '❌', 'Error editando hora de fin');
    console.error('  Error:', error.response?.data || error.message);
    return false;
  }
}

// Test 3: Agregar pausa
async function testAddPause(eventId) {
  log(colors.cyan, '📝', 'Test 3: Agregando pausa de 5 minutos...');
  
  try {
    const response = await api.post(`/api/sleep/${eventId}/pause`, {
      duration: 5,
      reason: 'Despertó brevemente - Test'
    });

    log(colors.green, '✅', 'Pausa agregada exitosamente');
    console.log('  ID de pausa:', response.data.pause.id);
    console.log('  Total pausas:', response.data.totalPauses);
    console.log('  Duración neta:', response.data.netDuration, 'minutos');
    
    return response.data.pause.id;
  } catch (error) {
    log(colors.red, '❌', 'Error agregando pausa');
    console.error('  Error:', error.response?.data || error.message);
    return null;
  }
}

// Test 4: Agregar segunda pausa
async function testAddSecondPause(eventId) {
  log(colors.cyan, '📝', 'Test 4: Agregando segunda pausa de 8 minutos...');
  
  try {
    const pauseStart = new Date(Date.now() - 90 * 60000);
    const pauseEnd = new Date(pauseStart.getTime() + 8 * 60000);
    
    const response = await api.post(`/api/sleep/${eventId}/pause`, {
      startTime: pauseStart.toISOString(),
      endTime: pauseEnd.toISOString(),
      reason: 'Cambio de pañal - Test'
    });

    log(colors.green, '✅', 'Segunda pausa agregada');
    console.log('  ID de pausa:', response.data.pause.id);
    console.log('  Total pausas:', response.data.totalPauses);
    console.log('  Duración neta:', response.data.netDuration, 'minutos');
    
    return response.data.pause.id;
  } catch (error) {
    log(colors.red, '❌', 'Error agregando segunda pausa');
    console.error('  Error:', error.response?.data || error.message);
    return null;
  }
}

// Test 5: Ver evento completo
async function testGetEvent(eventId) {
  log(colors.cyan, '📝', 'Test 5: Obteniendo evento actualizado...');
  
  try {
    const response = await api.get(`/api/sleep/history/${TEST_CHILD_ID}?days=1`);
    const event = response.data.sleepHistory.find(e => e.id === eventId);
    
    if (event) {
      log(colors.green, '✅', 'Evento obtenido exitosamente');
      console.log('\n  📊 RESUMEN DEL EVENTO:');
      console.log('  ├─ ID:', event.id);
      console.log('  ├─ Inicio:', new Date(event.startTime).toLocaleString());
      console.log('  ├─ Fin:', new Date(event.endTime).toLocaleString());
      console.log('  ├─ Duración bruta:', event.grossDuration || event.duration, 'min');
      console.log('  ├─ Duración neta:', event.netDuration || event.duration, 'min');
      console.log('  ├─ Pausas:', (event.pauses || []).length);
      
      if (event.pauses && event.pauses.length > 0) {
        console.log('  └─ Detalle de pausas:');
        event.pauses.forEach((pause, i) => {
          console.log(`      ${i + 1}. ${pause.duration} min - ${pause.reason}`);
        });
      }
    } else {
      log(colors.yellow, '⚠️', 'Evento no encontrado en historial');
    }
    
    return event;
  } catch (error) {
    log(colors.red, '❌', 'Error obteniendo evento');
    console.error('  Error:', error.response?.data || error.message);
    return null;
  }
}

// Test 6: Eliminar una pausa
async function testDeletePause(eventId, pauseId) {
  log(colors.cyan, '📝', 'Test 6: Eliminando primera pausa...');
  
  try {
    const response = await api.delete(`/api/sleep/${eventId}/pause/${pauseId}`);

    log(colors.green, '✅', 'Pausa eliminada exitosamente');
    console.log('  Total pausas restantes:', response.data.totalPauses);
    console.log('  Nueva duración neta:', response.data.netDuration, 'minutos');
    
    return true;
  } catch (error) {
    log(colors.red, '❌', 'Error eliminando pausa');
    console.error('  Error:', error.response?.data || error.message);
    return false;
  }
}

// Test 7: Actualización completa
async function testCompleteUpdate(eventId) {
  log(colors.cyan, '📝', 'Test 7: Actualización completa del evento...');
  
  try {
    const response = await api.put(`/api/sleep/${eventId}`, {
      quality: 'excellent',
      wakeUps: 2,
      notes: 'Evento actualizado completamente en test',
      location: 'stroller'
    });

    log(colors.green, '✅', 'Evento actualizado completamente');
    console.log('  Calidad:', 'excellent');
    console.log('  Despertares:', 2);
    console.log('  Ubicación:', 'stroller');
    
    return true;
  } catch (error) {
    log(colors.red, '❌', 'Error en actualización completa');
    console.error('  Error:', error.response?.data || error.message);
    return false;
  }
}

// Test 8: Editar ambos horarios
async function testEditBothTimes(eventId) {
  log(colors.cyan, '📝', 'Test 8: Editando ambos horarios simultáneamente...');
  
  try {
    const newStart = new Date(Date.now() - 2.5 * 3600000);
    const newEnd = new Date(Date.now() - 15 * 60000);
    
    const response = await api.patch(`/api/sleep/${eventId}/times`, {
      startTime: newStart.toISOString(),
      endTime: newEnd.toISOString()
    });

    log(colors.green, '✅', 'Ambos horarios actualizados');
    console.log('  Nueva duración:', response.data.sleepEvent.duration, 'minutos');
    
    return true;
  } catch (error) {
    log(colors.red, '❌', 'Error editando ambos horarios');
    console.error('  Error:', error.response?.data || error.message);
    return false;
  }
}

// Ejecutar todos los tests
async function runAllTests() {
  console.log('\n');
  log(colors.blue, '🧪', '═══════════════════════════════════════════════════');
  log(colors.blue, '🧪', '   PRUEBAS DE EDICIÓN DE SIESTAS Y PAUSAS');
  log(colors.blue, '🧪', '═══════════════════════════════════════════════════');
  console.log('\n');

  // Verificar configuración
  if (!TEST_TOKEN) {
    log(colors.red, '❌', 'ERROR: TEST_TOKEN no configurado');
    console.log('  Uso: TEST_TOKEN=tu_token TEST_CHILD_ID=child_id node test-edit-sleep.js');
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
    // 1. Crear evento de prueba
    const eventId = await createTestEvent();
    if (!eventId) {
      log(colors.red, '❌', 'No se pudo crear evento de prueba');
      return;
    }
    console.log('\n');
    
    // Esperar un poco
    await new Promise(resolve => setTimeout(resolve, 500));

    // 2. Editar hora de inicio
    await testEditStartTime(eventId);
    console.log('\n');
    await new Promise(resolve => setTimeout(resolve, 500));

    // 3. Editar hora de fin
    await testEditEndTime(eventId);
    console.log('\n');
    await new Promise(resolve => setTimeout(resolve, 500));

    // 4. Agregar primera pausa
    const pauseId1 = await testAddPause(eventId);
    console.log('\n');
    await new Promise(resolve => setTimeout(resolve, 500));

    // 5. Agregar segunda pausa
    const pauseId2 = await testAddSecondPause(eventId);
    console.log('\n');
    await new Promise(resolve => setTimeout(resolve, 500));

    // 6. Ver evento completo
    await testGetEvent(eventId);
    console.log('\n');
    await new Promise(resolve => setTimeout(resolve, 500));

    // 7. Eliminar una pausa
    if (pauseId1) {
      await testDeletePause(eventId, pauseId1);
      console.log('\n');
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // 8. Actualización completa
    await testCompleteUpdate(eventId);
    console.log('\n');
    await new Promise(resolve => setTimeout(resolve, 500));

    // 9. Editar ambos horarios
    await testEditBothTimes(eventId);
    console.log('\n');
    await new Promise(resolve => setTimeout(resolve, 500));

    // 10. Ver resultado final
    log(colors.cyan, '📊', 'Resultado Final:');
    await testGetEvent(eventId);

    console.log('\n');
    log(colors.green, '✅', '═══════════════════════════════════════════════════');
    log(colors.green, '✅', '   TODAS LAS PRUEBAS COMPLETADAS EXITOSAMENTE');
    log(colors.green, '✅', '═══════════════════════════════════════════════════');
    console.log('\n');
    
    log(colors.yellow, '💡', 'TIP: Puedes ver este evento en tu app con ID:', eventId);

  } catch (error) {
    console.log('\n');
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
  createTestEvent,
  testEditStartTime,
  testEditEndTime,
  testAddPause,
  testDeletePause,
  testCompleteUpdate
};

