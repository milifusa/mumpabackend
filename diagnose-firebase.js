// Script de diagnóstico para Firebase
// Verifica el estado de Firebase Admin y Storage

const axios = require('axios');

// Configuración
const API_BASE_URL = 'https://mumpabackend-kgeylyolz-mishu-lojans-projects.vercel.app';

// Crear instancia de axios
const api = axios.create({
  baseURL: API_BASE_URL
});

// Función para verificar el estado de salud
const checkHealth = async () => {
  try {
    console.log('🏥 [DIAGNOSE] Verificando estado de salud del servidor...');
    
    const response = await api.get('/health');
    
    console.log('✅ [DIAGNOSE] Estado de salud:');
    console.log('📋 [DIAGNOSE] Respuesta:', JSON.stringify(response.data, null, 2));
    
    return response.data;
  } catch (error) {
    console.error('❌ [DIAGNOSE] Error verificando salud:', error.response?.data || error.message);
    throw error;
  }
};

// Función para verificar Firebase Storage
const checkFirebaseStorage = async () => {
  try {
    console.log('\n🔥 [DIAGNOSE] Verificando Firebase Storage...');
    
    const response = await api.get('/api/firebase/status');
    
    console.log('✅ [DIAGNOSE] Estado de Firebase Storage:');
    console.log('📋 [DIAGNOSE] Respuesta:', JSON.stringify(response.data, null, 2));
    
    return response.data;
  } catch (error) {
    console.error('❌ [DIAGNOSE] Error verificando Firebase Storage:', error.response?.data || error.message);
    throw error;
  }
};

// Función principal de diagnóstico
const runDiagnosis = async () => {
  try {
    console.log('🔍 [DIAGNOSE] Iniciando diagnóstico de Firebase...\n');
    
    // 1. Verificar estado de salud
    const health = await checkHealth();
    
    // 2. Verificar Firebase Storage
    const storage = await checkFirebaseStorage();
    
    // 3. Análisis de resultados
    console.log('\n📊 [DIAGNOSE] Análisis de resultados:');
    
    if (health.firebase && health.firebase.hasAdmin) {
      console.log('✅ Firebase Admin: Inicializado correctamente');
    } else {
      console.log('❌ Firebase Admin: No está inicializado');
    }
    
    if (health.firebase && health.firebase.hasStorage) {
      console.log('✅ Firebase Storage: Disponible');
    } else {
      console.log('❌ Firebase Storage: No disponible');
    }
    
    if (storage.success) {
      console.log('✅ Firebase Storage: Funcionando correctamente');
      console.log(`📦 Bucket: ${storage.bucketName}`);
    } else {
      console.log('❌ Firebase Storage: Error');
      console.log(`💬 Mensaje: ${storage.message}`);
    }
    
    // 4. Recomendaciones
    console.log('\n💡 [DIAGNOSE] Recomendaciones:');
    
    if (!health.firebase.hasAdmin) {
      console.log('1. 🔧 Verificar variables de entorno de Firebase');
      console.log('2. 🔧 Asegurar que FIREBASE_PRIVATE_KEY esté correctamente formateado');
      console.log('3. 🔧 Verificar que todas las variables FIREBASE_* estén configuradas');
    }
    
    if (!health.firebase.hasStorage) {
      console.log('1. 🔧 Habilitar Firebase Storage en Firebase Console');
      console.log('2. 🔧 Configurar reglas de Storage');
      console.log('3. 🔧 Verificar permisos del proyecto');
    }
    
    if (!storage.success) {
      console.log('1. 🔧 Revisar logs del servidor para más detalles');
      console.log('2. 🔧 Verificar configuración de Firebase Storage');
      console.log('3. 🔧 Asegurar que el proyecto tenga Storage habilitado');
    }
    
    console.log('\n🎉 [DIAGNOSE] Diagnóstico completado!');
    
  } catch (error) {
    console.error('\n💥 [DIAGNOSE] Error en el diagnóstico:', error.message);
  }
};

// Ejecutar diagnóstico
if (require.main === module) {
  runDiagnosis();
}

// Exportar funciones para uso en otros scripts
module.exports = {
  checkHealth,
  checkFirebaseStorage,
  runDiagnosis
};

/*
INSTRUCCIONES DE USO:

1. Ejecutar diagnóstico completo:
   node diagnose-firebase.js

2. Verificar manualmente:
   curl https://mumpabackend-kgeylyolz-mishu-lojans-projects.vercel.app/health
   curl https://mumpabackend-kgeylyolz-mishu-lojans-projects.vercel.app/api/firebase/status

3. Si Firebase Admin no está inicializado:
   - Verificar variables de entorno en Vercel
   - Asegurar que FIREBASE_PRIVATE_KEY esté correcto
   - Verificar que todas las variables FIREBASE_* estén configuradas

4. Si Firebase Storage no está disponible:
   - Habilitar Firebase Storage en Firebase Console
   - Configurar reglas de Storage (test mode)
   - Verificar permisos del proyecto

5. Variables de entorno requeridas:
   - FIREBASE_TYPE
   - FIREBASE_PROJECT_ID
   - FIREBASE_PRIVATE_KEY_ID
   - FIREBASE_PRIVATE_KEY
   - FIREBASE_CLIENT_EMAIL
   - FIREBASE_CLIENT_ID
   - FIREBASE_AUTH_URI
   - FIREBASE_TOKEN_URI
   - FIREBASE_AUTH_PROVIDER_X509_CERT_URL
   - FIREBASE_CLIENT_X509_CERT_URL
*/
