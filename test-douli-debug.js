// Script para diagnosticar por qué Douli siempre responde lo mismo
const axios = require('axios');

// Configuración
const API_BASE_URL = 'https://mumpabackend-4q02bcxf5-mishu-lojans-projects.vercel.app';

// Crear instancia de axios
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Función para probar chat con Douli y verificar la fuente
const testDouliSource = async (authToken, message) => {
  try {
    console.log('🤱 [DEBUG] Probando chat con Douli...');
    console.log('📝 [DEBUG] Mensaje:', message);
    
    const response = await api.post('/api/doula/chat', {
      message: message
    }, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    console.log('✅ [DEBUG] Chat exitoso');
    console.log('📋 [DEBUG] Fuente de respuesta:', response.data.data?.source || 'desconocida');
    console.log('📋 [DEBUG] Usó fallback:', response.data.data?.usedFallback || 'desconocido');
    console.log('📋 [DEBUG] Respuesta:');
    console.log('=' .repeat(80));
    console.log(response.data.data?.response);
    console.log('=' .repeat(80));
    
    return response.data;
  } catch (error) {
    console.error('❌ [DEBUG] Error en chat:', error.response?.data || error.message);
    throw error;
  }
};

// Función para probar múltiples preguntas diferentes
const testMultipleQuestions = async (authToken) => {
  const questions = [
    "Hola Douli, ¿cómo estás?",
    "¿Qué ejercicios puedo hacer durante el embarazo?",
    "Tengo náuseas, ¿es normal?",
    "¿Cómo me preparo para el parto?",
    "¿Qué me aconsejas sobre la lactancia?",
    "¿Cómo está Java?",
    "¿Qué tal Mona?",
    "¿Cómo preparo todo para Maximo?",
    "Me siento muy cansada",
    "¿Qué debo comer durante el embarazo?"
  ];
  
  console.log('🚀 [DEBUG] Probando múltiples preguntas para verificar variedad...\n');
  
  for (let i = 0; i < questions.length; i++) {
    const question = questions[i];
    console.log(`📋 [DEBUG] Pregunta ${i + 1}: ${question}`);
    console.log('=' .repeat(60));
    
    try {
      const result = await testDouliSource(authToken, question);
      
      // Verificar si la respuesta es diferente
      if (i > 0) {
        console.log(`🔍 [DEBUG] ¿Respuesta diferente a la anterior? ${result.data.response !== previousResponse ? 'SÍ' : 'NO'}`);
      }
      
      previousResponse = result.data.response;
      console.log(`✅ [DEBUG] Pregunta ${i + 1} completada\n`);
      
      // Esperar entre preguntas
      if (i < questions.length - 1) {
        console.log('⏳ [DEBUG] Esperando 2 segundos...\n');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } catch (error) {
      console.log(`❌ [DEBUG] Error en pregunta ${i + 1}\n`);
    }
  }
  
  console.log('🎉 [DEBUG] Todas las preguntas probadas!');
};

// Función para verificar estado del servidor
const checkServerStatus = async () => {
  try {
    console.log('🏥 [DEBUG] Verificando estado del servidor...');
    
    const response = await api.get('/health');
    
    console.log('✅ [DEBUG] Servidor funcionando');
    console.log('📋 [DEBUG] OpenAI:', response.data.openai?.ready ? '✅ Configurado' : '❌ No configurado');
    console.log('📋 [DEBUG] OpenAI Status:', response.data.openai?.status);
    console.log('📋 [DEBUG] Firebase:', response.data.firebase?.ready ? '✅ Configurado' : '❌ No configurado');
    
    return response.data;
  } catch (error) {
    console.error('❌ [DEBUG] Error verificando servidor:', error.message);
    throw error;
  }
};

// Función para verificar datos del usuario
const checkUserContext = async (authToken) => {
  try {
    console.log('👤 [DEBUG] Verificando contexto del usuario...');
    
    const profileResponse = await api.get('/api/auth/profile', {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    const childrenResponse = await api.get('/api/auth/children', {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    console.log('✅ [DEBUG] Datos del usuario obtenidos');
    console.log('📋 [DEBUG] Perfil:', {
      gender: profileResponse.data.data.gender,
      childrenCount: profileResponse.data.data.childrenCount,
      isPregnant: profileResponse.data.data.isPregnant,
      gestationWeeks: profileResponse.data.data.gestationWeeks
    });
    
    console.log('📋 [DEBUG] Hijos:', childrenResponse.data.data.map(child => ({
      name: child.name,
      ageInMonths: child.ageInMonths,
      isUnborn: child.isUnborn,
      gestationWeeks: child.gestationWeeks
    })));
    
    return {
      profile: profileResponse.data.data,
      children: childrenResponse.data.data
    };
  } catch (error) {
    console.error('❌ [DEBUG] Error obteniendo contexto:', error.response?.data || error.message);
    throw error;
  }
};

// Función principal de diagnóstico
const runDiagnosis = async () => {
  try {
    console.log('🔍 [DEBUG] Iniciando diagnóstico de Douli...\n');
    
    // 1. Verificar token de autenticación
    const args = process.argv.slice(2);
    const authToken = args[0];
    
    if (!authToken) {
      console.log('⚠️ [DEBUG] Para diagnosticar Douli, proporciona un token de autenticación:');
      console.log('   node test-douli-debug.js tu_token_aqui');
      return;
    }
    
    // 2. Verificar estado del servidor
    console.log('=' .repeat(60));
    console.log('1. VERIFICACIÓN DEL SERVIDOR');
    console.log('=' .repeat(60));
    await checkServerStatus();
    
    // 3. Verificar contexto del usuario
    console.log('\n' + '=' .repeat(60));
    console.log('2. VERIFICACIÓN DEL CONTEXTO');
    console.log('=' .repeat(60));
    await checkUserContext(authToken);
    
    // 4. Probar preguntas diferentes
    console.log('\n' + '=' .repeat(60));
    console.log('3. PRUEBA DE VARIEDAD DE RESPUESTAS');
    console.log('=' .repeat(60));
    await testMultipleQuestions(authToken);
    
    console.log('\n🎉 [DEBUG] Diagnóstico completado!');
    console.log('\n💡 [DEBUG] CONCLUSIONES:');
    console.log('- Si todas las respuestas vienen de "fallback", OpenAI no está funcionando');
    console.log('- Si todas las respuestas vienen de "openai", el sistema está bien');
    console.log('- Si las respuestas son siempre iguales, hay un problema en el prompt');
    
  } catch (error) {
    console.error('\n💥 [DEBUG] Error en el diagnóstico:', error.message);
  }
};

// Función para prueba simple
const simpleTest = async (authToken, message) => {
  try {
    console.log('🔍 [DEBUG] Prueba simple de diagnóstico...\n');
    
    await testDouliSource(authToken, message || "Hola Douli, ¿cómo estás?");
    
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
  } else if (args.length === 2) {
    simpleTest(args[0], args[1]);
  }
}

// Exportar funciones
module.exports = {
  testDouliSource,
  testMultipleQuestions,
  checkServerStatus,
  checkUserContext,
  runDiagnosis,
  simpleTest
};

/*
INSTRUCCIONES DE USO:

1. Diagnóstico completo:
   node test-douli-debug.js tu_token_aqui

2. Prueba simple:
   node test-douli-debug.js tu_token_aqui "Hola Douli"

PROBLEMAS POSIBLES:

❌ "Siempre responde lo mismo":
   - OpenAI no está funcionando (usando fallback)
   - Prompt muy genérico
   - Error en la configuración

❌ "Siempre usa fallback":
   - Cuota de OpenAI agotada
   - Error en la API key
   - Problema de conectividad

❌ "Respuestas sin personalización":
   - No se está leyendo el contexto del usuario
   - Error en la obtención de datos de Firebase

SOLUCIONES:

✅ Si OpenAI no funciona:
   - Verificar API key en Vercel
   - Agregar método de pago a OpenAI
   - Verificar conectividad

✅ Si siempre usa fallback:
   - Revisar logs del servidor
   - Verificar configuración de OpenAI
   - Probar con nueva API key

✅ Si respuestas genéricas:
   - Verificar datos del usuario en Firebase
   - Revisar prompt del sistema
   - Verificar contexto personalizado
*/
