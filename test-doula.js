// Script de prueba para la Doula Virtual
// Prueba la integración con ChatGPT

const axios = require('axios');

// Configuración
const API_BASE_URL = 'https://mumpabackend-8wzg1xs4m-mishu-lojans-projects.vercel.app';
const AUTH_TOKEN = 'TU_TOKEN_AQUI'; // Reemplaza con tu token real

// Crear instancia de axios
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Authorization': `Bearer ${AUTH_TOKEN}`,
    'Content-Type': 'application/json'
  }
});

// Función para enviar mensaje a la doula
const sendMessageToDoula = async (message, context = null) => {
  try {
    console.log(`🤖 [DOULA] Enviando mensaje: "${message}"`);
    
    const response = await api.post('/api/doula/chat', {
      message: message,
      context: context
    });
    
    console.log('✅ [DOULA] Respuesta recibida:');
    console.log('📋 [DOULA] Respuesta:', response.data.data.response);
    
    return response.data;
  } catch (error) {
    console.error('❌ [DOULA] Error enviando mensaje:', error.response?.data || error.message);
    throw error;
  }
};

// Función para obtener historial
const getDoulaHistory = async () => {
  try {
    console.log('📚 [DOULA] Obteniendo historial...');
    
    const response = await api.get('/api/doula/history');
    
    console.log('✅ [DOULA] Historial obtenido');
    console.log(`📊 [DOULA] Total de conversaciones: ${response.data.data.length}`);
    
    return response.data;
  } catch (error) {
    console.error('❌ [DOULA] Error obteniendo historial:', error.response?.data || error.message);
    throw error;
  }
};

// Preguntas de ejemplo para probar
const preguntasEjemplo = [
  {
    pregunta: "¿Qué ejercicios son seguros durante el embarazo?",
    contexto: "Primer trimestre, 8 semanas"
  },
  {
    pregunta: "¿Cómo puedo prepararme para el parto?",
    contexto: "Tercer trimestre, 32 semanas"
  },
  {
    pregunta: "¿Cuáles son los síntomas normales del primer trimestre?",
    contexto: "Primer trimestre, 6 semanas"
  },
  {
    pregunta: "¿Qué debo empacar en mi maleta para el hospital?",
    contexto: "Tercer trimestre, 36 semanas"
  },
  {
    pregunta: "¿Cómo puedo aliviar las náuseas matutinas?",
    contexto: "Primer trimestre, 10 semanas"
  }
];

// Función principal de prueba
const runDoulaTests = async () => {
  try {
    console.log('🚀 [DOULA] Iniciando pruebas de la Doula Virtual...\n');
    
    // 1. Verificar estado del servidor
    console.log('🏥 [DOULA] Verificando estado del servidor...');
    try {
      const healthResponse = await axios.get(`${API_BASE_URL}/health`);
      console.log('✅ [DOULA] Servidor funcionando');
      console.log('🤖 [DOULA] OpenAI status:', healthResponse.data.openai?.status);
    } catch (error) {
      console.error('❌ [DOULA] Error verificando servidor:', error.message);
      return;
    }
    
    // 2. Obtener historial inicial
    console.log('\n📚 [DOULA] Obteniendo historial inicial...');
    try {
      const history = await getDoulaHistory();
      console.log(`📊 [DOULA] Conversaciones existentes: ${history.data.length}`);
    } catch (error) {
      console.log('⚠️ [DOULA] No se pudo obtener historial inicial');
    }
    
    // 3. Probar preguntas de ejemplo
    console.log('\n🤖 [DOULA] Probando preguntas de ejemplo...');
    
    for (let i = 0; i < preguntasEjemplo.length; i++) {
      const { pregunta, contexto } = preguntasEjemplo[i];
      
      console.log(`\n📝 [DOULA] Pregunta ${i + 1}: ${pregunta}`);
      console.log(`📋 [DOULA] Contexto: ${contexto}`);
      
      try {
        const result = await sendMessageToDoula(pregunta, contexto);
        console.log('✅ [DOULA] Respuesta exitosa');
        
        // Esperar un poco entre preguntas
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        console.error('❌ [DOULA] Error en pregunta:', error.message);
      }
    }
    
    // 4. Obtener historial final
    console.log('\n📚 [DOULA] Obteniendo historial final...');
    try {
      const finalHistory = await getDoulaHistory();
      console.log(`📊 [DOULA] Total de conversaciones: ${finalHistory.data.length}`);
      
      // Mostrar las últimas 3 conversaciones
      console.log('\n📋 [DOULA] Últimas conversaciones:');
      finalHistory.data.slice(0, 3).forEach((conv, index) => {
        console.log(`\n${index + 1}. Usuario: ${conv.userMessage.substring(0, 50)}...`);
        console.log(`   Doula: ${conv.doulaResponse.substring(0, 100)}...`);
        console.log(`   Fecha: ${conv.timestamp}`);
      });
      
    } catch (error) {
      console.error('❌ [DOULA] Error obteniendo historial final:', error.message);
    }
    
    console.log('\n🎉 [DOULA] Pruebas completadas exitosamente!');
    
  } catch (error) {
    console.error('\n💥 [DOULA] Error en las pruebas:', error.message);
  }
};

// Función para probar una pregunta específica
const testSpecificQuestion = async (question, context = null) => {
  try {
    console.log(`🚀 [DOULA] Probando pregunta específica: "${question}"`);
    
    const result = await sendMessageToDoula(question, context);
    
    console.log('\n✅ [DOULA] Respuesta de la Doula:');
    console.log('=' .repeat(50));
    console.log(result.data.response);
    console.log('=' .repeat(50));
    
  } catch (error) {
    console.error('\n❌ [DOULA] Error en la pregunta:', error.message);
  }
};

// Ejecutar pruebas
if (require.main === module) {
  // Verificar si se proporcionó un token
  if (AUTH_TOKEN === 'TU_TOKEN_AQUI') {
    console.log('❌ [DOULA] Error: Debes configurar AUTH_TOKEN en el script');
    console.log('📝 [DOULA] Reemplaza "TU_TOKEN_AQUI" con tu token real');
    process.exit(1);
  }
  
  // Verificar argumentos de línea de comandos
  const args = process.argv.slice(2);
  
  if (args.length > 0) {
    // Probar pregunta específica
    const question = args[0];
    const context = args[1] || null;
    testSpecificQuestion(question, context);
  } else {
    // Ejecutar todas las pruebas
    runDoulaTests();
  }
}

// Exportar funciones para uso en otros scripts
module.exports = {
  sendMessageToDoula,
  getDoulaHistory,
  runDoulaTests,
  testSpecificQuestion
};

/*
INSTRUCCIONES DE USO:

1. Configurar OpenAI API Key:
   - Obtén tu API key en: https://platform.openai.com/api-keys
   - Configúrala en Vercel como variable de entorno: OPENAI_API_KEY

2. Configurar token:
   - Reemplaza 'TU_TOKEN_AQUI' con tu token real
   - O configura como variable de entorno

3. Ejecutar todas las pruebas:
   node test-doula.js

4. Probar pregunta específica:
   node test-doula.js "¿Qué ejercicios son seguros durante el embarazo?"

5. Probar con contexto:
   node test-doula.js "¿Cómo prepararme para el parto?" "Tercer trimestre, 32 semanas"

CONFIGURACIÓN REQUERIDA:

1. OPENAI_API_KEY en Vercel:
   - Ve a Vercel Dashboard > Project Settings > Environment Variables
   - Agrega: OPENAI_API_KEY = tu_api_key_aqui

2. Verificar configuración:
   curl https://mumpabackend-8wzg1xs4m-mishu-lojans-projects.vercel.app/health

3. Ejemplos de preguntas:
   - "¿Qué ejercicios son seguros durante el embarazo?"
   - "¿Cómo puedo prepararme para el parto?"
   - "¿Cuáles son los síntomas normales del primer trimestre?"
   - "¿Qué debo empacar en mi maleta para el hospital?"
   - "¿Cómo puedo aliviar las náuseas matutinas?"

CARACTERÍSTICAS DE LA DOULA VIRTUAL:
✅ Respuestas personalizadas basadas en el perfil del usuario
✅ Información médica básica y consejos de bienestar
✅ Apoyo emocional y empático
✅ Historial de conversaciones guardado
✅ Recomendaciones de cuándo consultar profesionales
✅ Aclaraciones de que no reemplaza atención médica
*/
