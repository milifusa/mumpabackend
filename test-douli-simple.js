// Script simple para probar Douli y verificar si está usando OpenAI o fallback
const axios = require('axios');

// Configuración
const API_BASE_URL = 'https://mumpabackend-jky636szt-mishu-lojans-projects.vercel.app';

// Crear instancia de axios
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Función para probar chat con Douli
const testDouli = async (message) => {
  try {
    console.log('🤱 [TEST] Probando chat con Douli...');
    console.log('📝 [TEST] Mensaje:', message);
    console.log('⏳ [TEST] Enviando a:', API_BASE_URL);
    
    const response = await api.post('/api/doula/chat', {
      message: message
    });
    
    console.log('✅ [TEST] Chat exitoso');
    console.log('📋 [TEST] Fuente de respuesta:', response.data.data?.source || 'desconocida');
    console.log('📋 [TEST] Usó fallback:', response.data.data?.usedFallback || 'desconocido');
    console.log('📋 [TEST] Respuesta:');
    console.log('=' .repeat(80));
    console.log(response.data.data?.response);
    console.log('=' .repeat(80));
    
    return response.data;
  } catch (error) {
    console.error('❌ [TEST] Error en chat:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.log('🔐 [TEST] Error de autenticación - Necesitas un token válido');
    }
    
    throw error;
  }
};

// Función para probar múltiples preguntas
const testMultipleQuestions = async () => {
  const questions = [
    "Hola Douli, ¿cómo estás?",
    "¿Qué ejercicios puedo hacer durante el embarazo?",
    "Tengo náuseas, ¿es normal?",
    "¿Cómo me preparo para el parto?",
    "¿Qué me aconsejas sobre la lactancia?"
  ];
  
  console.log('🚀 [TEST] Probando múltiples preguntas...\n');
  
  for (let i = 0; i < questions.length; i++) {
    const question = questions[i];
    console.log(`📋 [TEST] Pregunta ${i + 1}: ${question}`);
    console.log('=' .repeat(60));
    
    try {
      const result = await testDouli(question);
      
      // Verificar si la respuesta es diferente
      if (i > 0) {
        console.log(`🔍 [TEST] ¿Respuesta diferente a la anterior? ${result.data.response !== previousResponse ? 'SÍ' : 'NO'}`);
      }
      
      previousResponse = result.data.response;
      console.log(`✅ [TEST] Pregunta ${i + 1} completada\n`);
      
      // Esperar entre preguntas
      if (i < questions.length - 1) {
        console.log('⏳ [TEST] Esperando 2 segundos...\n');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } catch (error) {
      console.log(`❌ [TEST] Error en pregunta ${i + 1}\n`);
    }
  }
  
  console.log('🎉 [TEST] Todas las preguntas probadas!');
};

// Función para verificar estado del servidor
const checkServerStatus = async () => {
  try {
    console.log('🏥 [TEST] Verificando estado del servidor...');
    
    const response = await api.get('/health');
    
    console.log('✅ [TEST] Servidor funcionando');
    console.log('📋 [TEST] OpenAI:', response.data.openai?.ready ? '✅ Configurado' : '❌ No configurado');
    console.log('📋 [TEST] OpenAI Status:', response.data.openai?.status);
    console.log('📋 [TEST] Firebase:', response.data.firebase?.ready ? '✅ Configurado' : '❌ No configurado');
    
    return response.data;
  } catch (error) {
    console.error('❌ [TEST] Error verificando servidor:', error.message);
    throw error;
  }
};

// Función principal
const runTest = async () => {
  try {
    console.log('🔍 [TEST] Iniciando prueba de Douli...\n');
    
    // 1. Verificar estado del servidor
    console.log('=' .repeat(60));
    console.log('1. VERIFICACIÓN DEL SERVIDOR');
    console.log('=' .repeat(60));
    await checkServerStatus();
    
    // 2. Probar una pregunta simple
    console.log('\n' + '=' .repeat(60));
    console.log('2. PRUEBA SIMPLE');
    console.log('=' .repeat(60));
    
    const args = process.argv.slice(2);
    const customMessage = args[0];
    
    if (customMessage) {
      await testDouli(customMessage);
    } else {
      await testDouli("Hola Douli, ¿cómo estás?");
    }
    
    console.log('\n💡 [TEST] NOTA:');
    console.log('- Si ves "Error de autenticación", necesitas un token válido');
    console.log('- Si ves "fallback", OpenAI no está funcionando');
    console.log('- Si ves "openai", el sistema está bien');
    
  } catch (error) {
    console.error('\n💥 [TEST] Error en la prueba:', error.message);
  }
};

// Ejecutar prueba
if (require.main === module) {
  runTest();
}

module.exports = {
  testDouli,
  testMultipleQuestions,
  checkServerStatus,
  runTest
};
