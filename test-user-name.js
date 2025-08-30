// Script para diagnosticar por qué no se obtiene el nombre correcto del usuario
const axios = require('axios');

// Configuración
const API_BASE_URL = 'https://mumpabackend-gb0iami8w-mishu-lojans-projects.vercel.app';

// Crear instancia de axios
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Función para verificar datos del usuario
const checkUserData = async (authToken) => {
  try {
    console.log('👤 [DEBUG] Verificando datos del usuario...');
    
    const response = await api.get('/api/auth/profile', {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    console.log('✅ [DEBUG] Datos del usuario obtenidos');
    console.log('📋 [DEBUG] Datos completos:', JSON.stringify(response.data.data, null, 2));
    
    return response.data.data;
  } catch (error) {
    console.error('❌ [DEBUG] Error obteniendo datos del usuario:', error.response?.data || error.message);
    throw error;
  }
};

// Función para probar pregunta sobre el nombre
const testNameQuestion = async (authToken) => {
  try {
    console.log('🎯 [DEBUG] Probando pregunta sobre el nombre...');
    
    const response = await api.post('/api/doula/chat', {
      message: '¿Cómo me llamo?'
    }, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    console.log('✅ [DEBUG] Respuesta de Douli obtenida');
    console.log('📋 [DEBUG] Fuente de respuesta:', response.data.data?.source || 'desconocida');
    console.log('📋 [DEBUG] Usó fallback:', response.data.data?.usedFallback || 'desconocido');
    console.log('📋 [DEBUG] Respuesta:');
    console.log('=' .repeat(80));
    console.log(response.data.data?.response);
    console.log('=' .repeat(80));
    
    return response.data;
  } catch (error) {
    console.error('❌ [DEBUG] Error en pregunta sobre nombre:', error.response?.data || error.message);
    throw error;
  }
};

// Función para verificar logs del servidor
const checkServerLogs = async () => {
  try {
    console.log('📋 [DEBUG] Verificando logs del servidor...');
    
    const response = await api.get('/health');
    
    console.log('✅ [DEBUG] Servidor funcionando');
    console.log('📋 [DEBUG] Estado del servidor:', response.data);
    
    return response.data;
  } catch (error) {
    console.error('❌ [DEBUG] Error verificando servidor:', error.message);
    throw error;
  }
};

// Función principal de diagnóstico
const runDiagnosis = async () => {
  try {
    console.log('🔍 [DEBUG] Iniciando diagnóstico del nombre del usuario...\n');
    
    // 1. Verificar token de autenticación
    const args = process.argv.slice(2);
    const authToken = args[0];
    
    if (!authToken) {
      console.log('⚠️ [DEBUG] Para diagnosticar, proporciona un token de autenticación:');
      console.log('   node test-user-name.js tu_token_aqui');
      return;
    }
    
    // 2. Verificar estado del servidor
    console.log('=' .repeat(60));
    console.log('1. VERIFICACIÓN DEL SERVIDOR');
    console.log('=' .repeat(60));
    await checkServerLogs();
    
    // 3. Verificar datos del usuario
    console.log('\n' + '=' .repeat(60));
    console.log('2. VERIFICACIÓN DE DATOS DEL USUARIO');
    console.log('=' .repeat(60));
    const userData = await checkUserData(authToken);
    
    // 4. Probar pregunta sobre el nombre
    console.log('\n' + '=' .repeat(60));
    console.log('3. PRUEBA DE PREGUNTA SOBRE EL NOMBRE');
    console.log('=' .repeat(60));
    await testNameQuestion(authToken);
    
    console.log('\n🎉 [DEBUG] Diagnóstico completado!');
    console.log('\n💡 [DEBUG] CONCLUSIONES:');
    console.log('- Si el nombre en userData es incorrecto, hay un problema en el registro');
    console.log('- Si Douli no usa el nombre correcto, hay un problema en la lógica');
    console.log('- Si usa fallback, OpenAI no está funcionando');
    
  } catch (error) {
    console.error('\n💥 [DEBUG] Error en el diagnóstico:', error.message);
  }
};

// Función para prueba simple
const simpleTest = async (authToken) => {
  try {
    console.log('🔍 [DEBUG] Prueba simple del nombre...\n');
    
    await checkUserData(authToken);
    
  } catch (error) {
    console.error('❌ [DEBUG] Error:', error.message);
  }
};

// Ejecutar diagnóstico
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    runDiagnosis();
  } else if (args.length === 1) {
    simpleTest(args[0]);
  }
}

// Exportar funciones
module.exports = {
  checkUserData,
  testNameQuestion,
  checkServerLogs,
  runDiagnosis,
  simpleTest
};

/*
INSTRUCCIONES DE USO:

1. Diagnóstico completo:
   node test-user-name.js tu_token_aqui

2. Prueba simple:
   node test-user-name.js tu_token_aqui

PROBLEMAS POSIBLES:

❌ "Nombre incorrecto en userData":
   - El nombre no se guardó correctamente durante el registro
   - Hay un problema en el endpoint de signup
   - Los datos están corruptos en Firebase

❌ "Douli no usa el nombre correcto":
   - Error en la lógica de obtención del nombre
   - El fallback no está funcionando
   - OpenAI está devolviendo nombre incorrecto

❌ "No encuentra el nombre":
   - El usuario no está registrado correctamente
   - Problema de permisos en Firebase
   - Error en la consulta a Firestore

SOLUCIONES:

✅ Si el nombre está mal en userData:
   - Verificar el proceso de registro
   - Revisar el endpoint de signup
   - Actualizar el nombre en Firebase

✅ Si Douli no lo usa:
   - Revisar la lógica de obtención
   - Verificar el fallback
   - Mejorar el prompt de OpenAI

✅ Si no encuentra el nombre:
   - Verificar permisos de Firebase
   - Revisar la estructura de datos
   - Diagnosticar la consulta a Firestore
*/
