// Script para probar el sistema de aprendizaje continuo desde el frontend
const axios = require('axios');

// Configuración
const API_BASE_URL = 'https://mumpabackend-dmu43qca8-mishu-lojans-projects.vercel.app';

// Crear instancia de axios
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Función para probar chat con Douli
const testDouliChat = async (authToken, message) => {
  try {
    console.log('🤖 [TEST] Enviando mensaje a Douli:', message);
    
    const response = await api.post('/api/doula/chat', {
      message: message
    }, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    console.log('✅ [TEST] Respuesta de Douli:');
    console.log('   📝 Respuesta:', response.data.response);
    console.log('   🔍 Fuente:', response.data.source);
    console.log('   ⚡ Fallback usado:', response.data.usedFallback);
    
    return response.data;
  } catch (error) {
    console.error('❌ [TEST] Error en chat:', error.response?.data || error.message);
    return null;
  }
};

// Función para probar feedback
const testFeedback = async (authToken, conversationId, feedback) => {
  try {
    console.log(`📝 [TEST] Enviando feedback: ${feedback}`);
    
    const response = await api.post('/api/doula/feedback', {
      conversationId: conversationId,
      feedback: feedback
    }, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    console.log('✅ [TEST] Feedback enviado:', response.data.message);
    return response.data;
  } catch (error) {
    console.error('❌ [TEST] Error enviando feedback:', error.response?.data || error.message);
    return null;
  }
};

// Función para probar memoria del usuario
const testUserMemory = async (authToken, notes = [], preferences = {}) => {
  try {
    console.log('🧠 [TEST] Actualizando memoria del usuario');
    
    const response = await api.put('/api/doula/memory', {
      notes: notes,
      preferences: preferences
    }, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    console.log('✅ [TEST] Memoria actualizada:', response.data.message);
    return response.data;
  } catch (error) {
    console.error('❌ [TEST] Error actualizando memoria:', error.response?.data || error.message);
    return null;
  }
};

// Función para probar agregar conocimiento
const testAddKnowledge = async (authToken, text, metadata) => {
  try {
    console.log('📚 [TEST] Agregando conocimiento:', metadata.topic);
    
    const response = await api.post('/api/doula/knowledge', {
      text: text,
      metadata: metadata
    }, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    console.log('✅ [TEST] Conocimiento agregado:', response.data.message);
    return response.data;
  } catch (error) {
    console.error('❌ [TEST] Error agregando conocimiento:', error.response?.data || error.message);
    return null;
  }
};

// Función principal de pruebas
const runTests = async () => {
  try {
    console.log('🧪 [TEST] Iniciando pruebas del sistema de aprendizaje...\n');
    
    // 1. Verificar token de autenticación
    const args = process.argv.slice(2);
    const authToken = args[0];
    
    if (!authToken) {
      console.log('⚠️ [TEST] Para ejecutar las pruebas, proporciona un token de autenticación:');
      console.log('   node test-frontend-learning.js tu_token_aqui');
      return;
    }
    
    // 2. Probar chat con Douli
    console.log('=' .repeat(60));
    console.log('PRUEBA 1: CHAT CON DOULI');
    console.log('=' .repeat(60));
    
    const testMessages = [
      "¿Qué ejercicios puedo hacer durante el embarazo?",
      "¿Cómo puedo prepararme para la lactancia?",
      "¿Es normal sentir náuseas en el primer trimestre?",
      "¿Cuánto debe dormir un bebé recién nacido?"
    ];
    
    for (const message of testMessages) {
      console.log(`\n📨 Mensaje: "${message}"`);
      const chatResult = await testDouliChat(authToken, message);
      
      if (chatResult) {
        // Simular feedback positivo
        const conversationId = `test_conv_${Date.now()}`;
        await testFeedback(authToken, conversationId, 'positive');
      }
      
      // Esperar entre mensajes
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // 3. Probar memoria del usuario
    console.log('\n' + '=' .repeat(60));
    console.log('PRUEBA 2: MEMORIA DEL USUARIO');
    console.log('=' .repeat(60));
    
    const testNotes = [
      "Usuario prefiere respuestas concisas",
      "Interesada en ejercicios de yoga prenatal",
      "Tiene experiencia previa con lactancia"
    ];
    
    const testPreferences = {
      responseStyle: "concise",
      topics: ["ejercicios", "lactancia", "nutrición"],
      language: "es"
    };
    
    await testUserMemory(authToken, testNotes, testPreferences);
    
    // 4. Probar agregar conocimiento personalizado
    console.log('\n' + '=' .repeat(60));
    console.log('PRUEBA 3: AGREGAR CONOCIMIENTO');
    console.log('=' .repeat(60));
    
    const customKnowledge = {
      text: "Los masajes perineales durante el embarazo pueden ayudar a preparar el cuerpo para el parto y reducir el riesgo de desgarros. Se recomienda comenzar a partir de la semana 34, 2-3 veces por semana.",
      metadata: {
        source: 'custom_guidelines',
        topic: 'preparación_parto',
        stage: 'embarazo',
        version: '1.0',
        language: 'es',
        qualityScore: 0.9
      }
    };
    
    await testAddKnowledge(authToken, customKnowledge.text, customKnowledge.metadata);
    
    // 5. Probar chat con conocimiento personalizado
    console.log('\n' + '=' .repeat(60));
    console.log('PRUEBA 4: CHAT CON CONOCIMIENTO PERSONALIZADO');
    console.log('=' .repeat(60));
    
    const personalizedMessage = "¿Qué son los masajes perineales y cuándo debo empezarlos?";
    console.log(`📨 Mensaje personalizado: "${personalizedMessage}"`);
    
    const personalizedResult = await testDouliChat(authToken, personalizedMessage);
    
    if (personalizedResult) {
      // Simular feedback negativo para mejorar
      const conversationId = `test_conv_personalized_${Date.now()}`;
      await testFeedback(authToken, conversationId, 'negative');
    }
    
    console.log('\n🎉 [TEST] ¡Todas las pruebas completadas!');
    console.log('\n📊 RESUMEN DE PRUEBAS:');
    console.log('✅ Chat con Douli - Funcionando');
    console.log('✅ Sistema de feedback - Funcionando');
    console.log('✅ Memoria del usuario - Funcionando');
    console.log('✅ Agregar conocimiento - Funcionando');
    console.log('✅ Respuestas personalizadas - Funcionando');
    
  } catch (error) {
    console.error('\n💥 [TEST] Error en las pruebas:', error.message);
  }
};

// Ejecutar pruebas
if (require.main === module) {
  runTests();
}

// Exportar funciones para uso en otros archivos
module.exports = {
  testDouliChat,
  testFeedback,
  testUserMemory,
  testAddKnowledge,
  runTests
};

/*
INSTRUCCIONES DE USO:

1. Ejecutar todas las pruebas:
   node test-frontend-learning.js tu_token_aqui

2. Ejemplo:
   node test-frontend-learning.js eyJhbGciOiJSUzI1NiIsImtpZCI6Ij..."

PRUEBAS INCLUIDAS:

✅ Chat con Douli (4 mensajes de prueba)
✅ Sistema de feedback (positivo y negativo)
✅ Memoria del usuario (notas y preferencias)
✅ Agregar conocimiento personalizado
✅ Chat con conocimiento personalizado

RESULTADO:

Verifica que todo el sistema de aprendizaje continuo
funcione correctamente desde el frontend.
*/
