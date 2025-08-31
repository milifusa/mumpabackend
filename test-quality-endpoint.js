// Script simple para probar el endpoint de quality-test
const axios = require('axios');

const API_BASE_URL = 'https://mumpabackend-lyop389dp-mishu-lojans-projects.vercel.app';

// Función para probar el endpoint
const testQualityEndpoint = async (authToken) => {
  try {
    console.log('🧪 [TEST] Probando endpoint de quality-test...');
    
    const response = await axios.post(`${API_BASE_URL}/api/doula/quality-test`, {}, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    console.log('✅ [TEST] Endpoint funciona correctamente');
    console.log('📊 Resultados:', response.data);
    
    return true;
  } catch (error) {
    console.error('❌ [TEST] Error en endpoint:', error.response?.data || error.message);
    return false;
  }
};

// Ejecutar prueba
const args = process.argv.slice(2);
const authToken = args[0];

if (!authToken) {
  console.log('⚠️ Proporciona un token de autenticación:');
  console.log('   node test-quality-endpoint.js tu_token_aqui');
} else {
  testQualityEndpoint(authToken);
}
