// Script para verificar el estado de api.munpa.online
const axios = require('axios');

const API_URLS = [
  'https://api.munpa.online',
  'https://mumpabackend-7mbnlpjg6-mishu-lojans-projects.vercel.app'
];

async function checkAPIStatus() {
  try {
    console.log('🔍 [CHECK] Verificando estado de APIs...\n');
    
    for (const apiUrl of API_URLS) {
      console.log(`🌐 [API] Verificando: ${apiUrl}`);
      
      try {
        // Probar endpoint básico
        const response = await axios.get(`${apiUrl}/api/health`, { timeout: 5000 });
        console.log(`   ✅ Status: ${response.status}`);
        console.log(`   📊 Response: ${JSON.stringify(response.data).substring(0, 100)}...`);
      } catch (error) {
        if (error.code === 'ECONNREFUSED') {
          console.log(`   ❌ Error: Conexión rechazada`);
        } else if (error.response) {
          console.log(`   ⚠️ Status: ${error.response.status}`);
          console.log(`   📊 Response: ${JSON.stringify(error.response.data).substring(0, 100)}...`);
        } else {
          console.log(`   ❌ Error: ${error.message}`);
        }
      }
      
      // Probar endpoint de tips (con método OPTIONS para ver si existe)
      try {
        const optionsResponse = await axios.options(`${apiUrl}/api/children/tips`, { timeout: 5000 });
        console.log(`   🎯 Tips endpoint: ✅ Existe (Status: ${optionsResponse.status})`);
      } catch (error) {
        if (error.response && error.response.status === 404) {
          console.log(`   🎯 Tips endpoint: ❌ No existe (404)`);
        } else if (error.response && error.response.status === 405) {
          console.log(`   🎯 Tips endpoint: ✅ Existe pero no acepta OPTIONS (405)`);
        } else {
          console.log(`   🎯 Tips endpoint: ❓ Error: ${error.message}`);
        }
      }
      
      console.log('');
    }
    
    console.log('📋 [ANALYSIS] Análisis:');
    console.log('   • Si api.munpa.online devuelve 404 en tips, no tiene el endpoint');
    console.log('   • Si devuelve 405, existe pero no acepta OPTIONS');
    console.log('   • Si devuelve error de conexión, el dominio no está activo');
    
    console.log('\n🎯 [RECOMMENDATION] Recomendaciones:');
    console.log('   1. Verificar si api.munpa.online es tu backend principal');
    console.log('   2. Si es el principal, agregar el endpoint de tips allí');
    console.log('   3. Si no es el principal, actualizar la URL en el frontend');
    console.log('   4. Considerar configurar dominio personalizado en Vercel');

  } catch (error) {
    console.error('❌ [CHECK] Error general:', error.message);
  }
}

// Ejecutar la verificación
checkAPIStatus();
