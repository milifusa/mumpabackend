// Script que simula exactamente la llamada del frontend
const axios = require('axios');

// Simular AsyncStorage
const mockAsyncStorage = {
  authToken: null
};

// Configuración exacta del frontend
const API_BASE_URL = 'https://mumpabackend-lyop389dp-mishu-lojans-projects.vercel.app';

// Crear instancia de axios (igual que en el frontend)
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token (igual que en el frontend)
api.interceptors.request.use(
  async (config) => {
    const token = mockAsyncStorage.authToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Debug logs
    console.log('🔍 [DEBUG] URL completa:', config.baseURL + config.url);
    console.log('🔍 [DEBUG] Token enviado:', token ? 'Sí' : 'No');
    console.log('🔍 [DEBUG] Headers:', config.headers);
    
    return config;
  },
  (error) => {
    console.error('❌ [DEBUG] Error en interceptor:', error);
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores (igual que en el frontend)
api.interceptors.response.use(
  (response) => {
    console.log('✅ [DEBUG] Respuesta exitosa:', response.status);
    return response;
  },
  async (error) => {
    console.error('❌ [DEBUG] Error de respuesta:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    
    if (error.response?.status === 401) {
      console.log('🔐 [DEBUG] Token expirado, limpiando...');
      mockAsyncStorage.authToken = null;
    }
    return Promise.reject(error);
  }
);

// Función para ejecutar quality test (igual que en el frontend)
const runQualityTest = async () => {
  try {
    console.log('🧪 [QUALITY] Ejecutando test de calidad...');
    
    const response = await api.post('/api/doula/quality-test');
    
    console.log('✅ [QUALITY] Test completado:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ [QUALITY] Error en test de calidad:', error.response?.data || error.message);
    throw error;
  }
};

// Función principal
const testFrontendQuality = async () => {
  try {
    console.log('🎯 [FRONTEND TEST] Simulando llamada del frontend...\n');
    
    // 1. Probar sin token
    console.log('=' .repeat(60));
    console.log('PRUEBA 1: Sin token de autenticación');
    console.log('=' .repeat(60));
    
    try {
      await runQualityTest();
    } catch (error) {
      console.log('✅ [TEST] Error esperado sin token:', error.response?.data?.message);
    }
    
    // 2. Probar con token válido
    console.log('\n' + '=' .repeat(60));
    console.log('PRUEBA 2: Con token de autenticación');
    console.log('=' .repeat(60));
    
    const args = process.argv.slice(2);
    const authToken = args[0];
    
    if (!authToken) {
      console.log('⚠️ Para probar con token, ejecuta:');
      console.log('   node test-frontend-quality.js tu_token_aqui');
      return;
    }
    
    // Simular token en AsyncStorage
    mockAsyncStorage.authToken = authToken;
    console.log('🔐 [TEST] Token configurado:', authToken.substring(0, 20) + '...');
    
    await runQualityTest();
    
    console.log('\n🎉 [TEST] ¡Prueba completada exitosamente!');
    
  } catch (error) {
    console.error('\n💥 [TEST] Error en la prueba:', error.message);
  }
};

// Ejecutar prueba
testFrontendQuality();

/*
INSTRUCCIONES DE USO:

1. Probar sin token (para ver el error de autenticación):
   node test-frontend-quality.js

2. Probar con token válido:
   node test-frontend-quality.js tu_token_aqui

Este script simula exactamente lo que hace tu app React Native
y te ayudará a identificar dónde está el problema.
*/
