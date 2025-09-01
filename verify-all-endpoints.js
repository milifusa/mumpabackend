// Script para verificar que todos los endpoints estén usando la URL correcta
const axios = require('axios');

const API_BASE_URL = 'https://mumpabackend-mxjgwni3e-mishu-lojans-projects.vercel.app';

async function verifyAllEndpoints() {
  try {
    console.log('🧪 [VERIFY] Verificando todos los endpoints...\n');
    
    // Lista de endpoints que devuelven información de hijos
    const endpoints = [
      {
        name: 'GET /api/auth/children',
        method: 'get',
        url: '/api/auth/children',
        description: 'Lista de hijos con edades calculadas'
      },
      {
        name: 'GET /api/auth/children/current-info',
        method: 'get',
        url: '/api/auth/children/current-info',
        description: 'Información actualizada de hijos'
      },
      {
        name: 'GET /api/auth/profile',
        method: 'get',
        url: '/api/auth/profile',
        description: 'Perfil del usuario con semanas calculadas'
      }
    ];

    console.log('📋 [ENDPOINTS] Endpoints a verificar:');
    endpoints.forEach((endpoint, index) => {
      console.log(`   ${index + 1}. ${endpoint.name} - ${endpoint.description}`);
    });

    console.log('\n⚠️ [NOTE] Para probar estos endpoints necesitas:');
    console.log('   1. Un token de autenticación válido');
    console.log('   2. Usuario con hijos registrados');
    console.log('   3. Hacer las peticiones desde tu frontend');

    console.log('\n🔍 [CHECKLIST] Verificar en tu frontend:');
    console.log('   ✅ ¿Estás usando la URL correcta?');
    console.log('   ✅ ¿Los endpoints devuelven currentAgeInMonths y currentGestationWeeks?');
    console.log('   ✅ ¿Los valores calculados son diferentes a los registrados?');

    console.log('\n📊 [EXPECTED] Respuesta esperada para cada hijo:');
    console.log('   {');
    console.log('     "ageInMonths": 11,              // Original');
    console.log('     "currentAgeInMonths": 13,       // Calculado ✅');
    console.log('     "gestationWeeks": 39,           // Original');
    console.log('     "currentGestationWeeks": 41,    // Calculado ✅');
    console.log('     "daysSinceCreation": 61,        // Días desde registro');
    console.log('     "isOverdue": true               // Solo para no nacidos');
    console.log('   }');

    console.log('\n🎯 [ACTION] Acciones recomendadas:');
    console.log('   1. Verifica que tu frontend use la URL correcta');
    console.log('   2. Usa los campos "currentAgeInMonths" y "currentGestationWeeks"');
    console.log('   3. No uses los campos originales "ageInMonths" y "gestationWeeks"');

  } catch (error) {
    console.error('❌ [VERIFY] Error:', error.message);
  }
}

// Ejecutar la verificación
verifyAllEndpoints();
