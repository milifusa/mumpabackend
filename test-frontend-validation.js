// Script para probar el sistema de validación desde el frontend
const axios = require('axios');

// Configuración
const API_BASE_URL = 'https://mumpabackend-lyop389dp-mishu-lojans-projects.vercel.app';

// Crear instancia de axios
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Función para probar aprendizaje validado
const testValidatedLearning = async (authToken) => {
  try {
    console.log('🔍 [TEST] Probando aprendizaje validado...');
    
    const knowledgeData = {
      text: "La posición de lado izquierdo durante el sueño es la más recomendada en el tercer trimestre, ya que mejora el flujo sanguíneo al bebé y reduce la presión sobre la vena cava inferior.",
      metadata: {
        source: 'medical_guidelines',
        topic: 'postura_sueño',
        stage: 'embarazo',
        version: '1.0',
        language: 'es',
        qualityScore: 0.95
      },
      validation: {
        approved: true,
        approvedBy: 'admin',
        approvedAt: new Date(),
        checklist: {
          sourceVerified: true,
          medicalAccuracy: true,
          toneAppropriate: true,
          contentRelevant: true
        }
      }
    };
    
    const response = await api.post('/api/doula/learn', knowledgeData, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    console.log('✅ [TEST] Aprendizaje validado exitoso:', response.data.message);
    return response.data;
  } catch (error) {
    console.error('❌ [TEST] Error en aprendizaje validado:', error.response?.data || error.message);
    return null;
  }
};

// Función para probar test de calidad
const testQualityTest = async (authToken) => {
  try {
    console.log('🧪 [TEST] Probando test de calidad...');
    
    const response = await api.post('/api/doula/quality-test', {}, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    if (response.data.success) {
      const data = response.data.data;
      console.log('✅ [TEST] Test de calidad exitoso:');
      console.log(`   📊 Puntuación: ${(data.averageScore * 100).toFixed(1)}%`);
      console.log(`   🏆 Estado: ${data.qualityStatus}`);
      console.log(`   📋 Tests ejecutados: ${data.totalTests}`);
      return data;
    } else {
      console.log('❌ [TEST] Error en test de calidad');
      return null;
    }
  } catch (error) {
    console.error('❌ [TEST] Error en test de calidad:', error.response?.data || error.message);
    return null;
  }
};

// Función para probar borrado de memoria
const testMemoryDeletion = async (authToken) => {
  try {
    console.log('🗑️ [TEST] Probando borrado de memoria...');
    
    const response = await api.delete('/api/doula/memory', {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    console.log('✅ [TEST] Memoria borrada exitosamente:', response.data.message);
    return response.data;
  } catch (error) {
    console.error('❌ [TEST] Error borrando memoria:', error.response?.data || error.message);
    return null;
  }
};

// Función para probar feedback detallado
const testDetailedFeedback = async (authToken) => {
  try {
    console.log('📝 [TEST] Probando feedback detallado...');
    
    const feedbackData = {
      conversationId: `test_conv_${Date.now()}`,
      feedback: 'positive',
      details: {
        question: '¿Qué ejercicios puedo hacer durante el embarazo?',
        answer: 'Los ejercicios seguros incluyen caminar, yoga prenatal, natación...',
        tags: ['ejercicios', 'embarazo', 'seguridad']
      }
    };
    
    const response = await api.post('/api/doula/feedback', feedbackData, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    console.log('✅ [TEST] Feedback detallado enviado:', response.data.message);
    return response.data;
  } catch (error) {
    console.error('❌ [TEST] Error enviando feedback:', error.response?.data || error.message);
    return null;
  }
};

// Función para probar chat con conocimiento validado
const testChatWithValidatedKnowledge = async (authToken) => {
  try {
    console.log('🤖 [TEST] Probando chat con conocimiento validado...');
    
    const testQuestions = [
      "¿Cuál es la mejor posición para dormir durante el embarazo?",
      "¿Qué ejercicios de Kegel puedo hacer?",
      "¿Cuáles son los signos de alarma durante el embarazo?"
    ];
    
    for (const question of testQuestions) {
      console.log(`\n📨 Pregunta: "${question}"`);
      
      const response = await api.post('/api/doula/chat', {
        message: question
      }, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      if (response.data.success) {
        console.log('✅ Respuesta recibida');
        console.log(`   🔍 Fuente: ${response.data.source}`);
        console.log(`   ⚡ Fallback: ${response.data.usedFallback}`);
        console.log(`   📝 Respuesta: ${response.data.response.substring(0, 100)}...`);
      } else {
        console.log('❌ Error en chat');
      }
      
      // Esperar entre preguntas
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    return true;
  } catch (error) {
    console.error('❌ [TEST] Error en chat:', error.response?.data || error.message);
    return false;
  }
};

// Función principal
const runFrontendValidationTests = async () => {
  try {
    console.log('🧪 [FRONTEND] Iniciando pruebas del sistema de validación...\n');
    
    // 1. Verificar token de autenticación
    const args = process.argv.slice(2);
    const authToken = args[0];
    
    if (!authToken) {
      console.log('⚠️ [FRONTEND] Para ejecutar las pruebas, proporciona un token de autenticación:');
      console.log('   node test-frontend-validation.js tu_token_aqui');
      return;
    }
    
    // 2. Probar aprendizaje validado
    console.log('=' .repeat(60));
    console.log('PRUEBA 1: APRENDIZAJE VALIDADO');
    console.log('=' .repeat(60));
    
    const learningResult = await testValidatedLearning(authToken);
    
    // 3. Probar test de calidad
    console.log('\n' + '=' .repeat(60));
    console.log('PRUEBA 2: TEST DE CALIDAD');
    console.log('=' .repeat(60));
    
    const qualityResult = await testQualityTest(authToken);
    
    // 4. Probar feedback detallado
    console.log('\n' + '=' .repeat(60));
    console.log('PRUEBA 3: FEEDBACK DETALLADO');
    console.log('=' .repeat(60));
    
    const feedbackResult = await testDetailedFeedback(authToken);
    
    // 5. Probar chat con conocimiento validado
    console.log('\n' + '=' .repeat(60));
    console.log('PRUEBA 4: CHAT CON CONOCIMIENTO VALIDADO');
    console.log('=' .repeat(60));
    
    const chatResult = await testChatWithValidatedKnowledge(authToken);
    
    // 6. Probar borrado de memoria
    console.log('\n' + '=' .repeat(60));
    console.log('PRUEBA 5: BORRADO DE MEMORIA');
    console.log('=' .repeat(60));
    
    const memoryResult = await testMemoryDeletion(authToken);
    
    // 7. Resumen de resultados
    console.log('\n' + '=' .repeat(60));
    console.log('RESUMEN DE PRUEBAS');
    console.log('=' .repeat(60));
    
    const results = {
      'Aprendizaje Validado': learningResult ? '✅' : '❌',
      'Test de Calidad': qualityResult ? '✅' : '❌',
      'Feedback Detallado': feedbackResult ? '✅' : '❌',
      'Chat con Conocimiento': chatResult ? '✅' : '❌',
      'Borrado de Memoria': memoryResult ? '✅' : '❌'
    };
    
    Object.entries(results).forEach(([test, result]) => {
      console.log(`${result} ${test}`);
    });
    
    const successCount = Object.values(results).filter(r => r === '✅').length;
    const totalTests = Object.keys(results).length;
    
    console.log(`\n🎯 Resultado: ${successCount}/${totalTests} pruebas exitosas`);
    
    if (successCount === totalTests) {
      console.log('🎉 ¡Todas las pruebas del sistema de validación funcionan correctamente!');
    } else {
      console.log('⚠️ Algunas pruebas fallaron. Revisa los logs para más detalles.');
    }
    
  } catch (error) {
    console.error('\n💥 [FRONTEND] Error en las pruebas:', error.message);
  }
};

// Ejecutar pruebas
if (require.main === module) {
  runFrontendValidationTests();
}

// Exportar funciones
module.exports = {
  testValidatedLearning,
  testQualityTest,
  testMemoryDeletion,
  testDetailedFeedback,
  testChatWithValidatedKnowledge,
  runFrontendValidationTests
};

/*
INSTRUCCIONES DE USO:

1. Ejecutar todas las pruebas:
   node test-frontend-validation.js tu_token_aqui

2. Ejecutar prueba específica:
   const { testQualityTest } = require('./test-frontend-validation');
   testQualityTest(token);

PRUEBAS INCLUIDAS:

✅ Aprendizaje validado (POST /learn)
✅ Test de calidad automático
✅ Feedback detallado con Q&A
✅ Chat con conocimiento validado
✅ Borrado de memoria del usuario

RESULTADO:

Verifica que todo el sistema de validación
funcione correctamente desde el frontend.
*/
