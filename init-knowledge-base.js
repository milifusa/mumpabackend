// Script para inicializar la base de conocimiento de Douli
const axios = require('axios');

// Configuración
const API_BASE_URL = 'https://mumpabackend-oyna30wfh-mishu-lojans-projects.vercel.app';

// Crear instancia de axios
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Conocimiento base para Douli
const baseKnowledge = [
  {
    text: "Durante el primer trimestre del embarazo, es normal experimentar náuseas matutinas, fatiga extrema y sensibilidad en los senos. Estos síntomas son causados por los cambios hormonales y generalmente mejoran después del primer trimestre.",
    metadata: {
      source: 'medical_guidelines',
      topic: 'síntomas_embarazo',
      stage: 'embarazo',
      version: '1.0',
      language: 'es',
      qualityScore: 0.9
    }
  },
  {
    text: "Los ejercicios seguros durante el embarazo incluyen caminar, yoga prenatal, natación y pilates adaptado. Es importante escuchar a tu cuerpo y consultar con tu médico antes de comenzar cualquier rutina de ejercicios.",
    metadata: {
      source: 'medical_guidelines',
      topic: 'ejercicios_embarazo',
      stage: 'embarazo',
      version: '1.0',
      language: 'es',
      qualityScore: 0.9
    }
  },
  {
    text: "La lactancia materna proporciona nutrición perfecta para el bebé, fortalece su sistema inmunológico y crea un vínculo especial entre madre e hijo. Se recomienda amamantar a demanda y buscar ayuda profesional si hay dificultades.",
    metadata: {
      source: 'medical_guidelines',
      topic: 'lactancia',
      stage: 'posparto',
      version: '1.0',
      language: 'es',
      qualityScore: 0.9
    }
  },
  {
    text: "El postparto es un período de recuperación física y emocional. Es normal sentir emociones intensas, fatiga y cambios de humor. Es importante descansar cuando el bebé duerme y pedir ayuda a familiares y amigos.",
    metadata: {
      source: 'medical_guidelines',
      topic: 'postparto',
      stage: 'posparto',
      version: '1.0',
      language: 'es',
      qualityScore: 0.9
    }
  },
  {
    text: "La nutrición durante el embarazo debe incluir frutas y verduras frescas, proteínas magras, granos enteros y lácteos bajos en grasa. Es importante evitar pescado alto en mercurio, carne cruda y alcohol.",
    metadata: {
      source: 'medical_guidelines',
      topic: 'nutrición_embarazo',
      stage: 'embarazo',
      version: '1.0',
      language: 'es',
      qualityScore: 0.9
    }
  },
  {
    text: "Las técnicas de respiración durante el parto incluyen respiración lenta y profunda, respiración de jadeo para el pujo y respiración de relajación. Practicar estas técnicas antes del parto ayuda a estar preparada.",
    metadata: {
      source: 'medical_guidelines',
      topic: 'técnicas_parto',
      stage: 'embarazo',
      version: '1.0',
      language: 'es',
      qualityScore: 0.9
    }
  },
  {
    text: "Los bebés recién nacidos necesitan alimentarse cada 2-3 horas, incluyendo durante la noche. Es normal que duerman entre 14-17 horas al día, pero en períodos cortos.",
    metadata: {
      source: 'medical_guidelines',
      topic: 'cuidado_bebé',
      stage: 'posparto',
      version: '1.0',
      language: 'es',
      qualityScore: 0.9
    }
  },
  {
    text: "La depresión postparto es una condición médica real que puede afectar a las madres. Los síntomas incluyen tristeza persistente, pérdida de interés en actividades, cambios en el apetito y pensamientos de hacer daño.",
    metadata: {
      source: 'medical_guidelines',
      topic: 'salud_mental',
      stage: 'posparto',
      version: '1.0',
      language: 'es',
      qualityScore: 0.9
    }
  }
];

// Función para agregar conocimiento
const addKnowledge = async (authToken, knowledgeItem) => {
  try {
    console.log('📝 [KNOWLEDGE] Agregando conocimiento:', knowledgeItem.metadata.topic);
    
    const response = await api.post('/api/doula/knowledge', {
      text: knowledgeItem.text,
      metadata: knowledgeItem.metadata
    }, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    if (response.data.success) {
      console.log('✅ [KNOWLEDGE] Conocimiento agregado:', knowledgeItem.metadata.topic);
      return true;
    } else {
      console.log('❌ [KNOWLEDGE] Error agregando:', knowledgeItem.metadata.topic);
      return false;
    }
  } catch (error) {
    console.error('❌ [KNOWLEDGE] Error:', error.response?.data || error.message);
    return false;
  }
};

// Función principal
const initializeKnowledgeBase = async () => {
  try {
    console.log('🧠 [KNOWLEDGE] Iniciando base de conocimiento de Douli...\n');
    
    // 1. Verificar token de autenticación
    const args = process.argv.slice(2);
    const authToken = args[0];
    
    if (!authToken) {
      console.log('⚠️ [KNOWLEDGE] Para inicializar, proporciona un token de autenticación:');
      console.log('   node init-knowledge-base.js tu_token_aqui');
      return;
    }
    
    // 2. Agregar conocimiento base
    console.log('=' .repeat(60));
    console.log('AGREGANDO CONOCIMIENTO BASE');
    console.log('=' .repeat(60));
    
    let successCount = 0;
    let totalCount = baseKnowledge.length;
    
    for (const knowledgeItem of baseKnowledge) {
      const success = await addKnowledge(authToken, knowledgeItem);
      if (success) {
        successCount++;
      }
      
      // Esperar un poco entre peticiones
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('\n🎉 [KNOWLEDGE] Inicialización completada!');
    console.log(`✅ [KNOWLEDGE] Conocimiento agregado: ${successCount}/${totalCount}`);
    
    if (successCount === totalCount) {
      console.log('🎯 [KNOWLEDGE] ¡Toda la base de conocimiento se agregó correctamente!');
    } else {
      console.log('⚠️ [KNOWLEDGE] Algunos elementos no se pudieron agregar');
    }
    
  } catch (error) {
    console.error('\n💥 [KNOWLEDGE] Error en la inicialización:', error.message);
  }
};

// Ejecutar inicialización
if (require.main === module) {
  initializeKnowledgeBase();
}

// Exportar funciones
module.exports = {
  baseKnowledge,
  addKnowledge,
  initializeKnowledgeBase
};

/*
INSTRUCCIONES DE USO:

1. Inicializar base de conocimiento:
   node init-knowledge-base.js tu_token_aqui

2. Ejemplo:
   node init-knowledge-base.js eyJhbGciOiJSUzI1NiIsImtpZCI6Ij..." 

CONOCIMIENTO INCLUIDO:

✅ Síntomas del embarazo
✅ Ejercicios seguros
✅ Lactancia materna
✅ Cuidado postparto
✅ Nutrición durante el embarazo
✅ Técnicas de parto
✅ Cuidado del bebé
✅ Salud mental postparto

RESULTADO:

Douli tendrá acceso a conocimiento médico validado
para responder preguntas de manera más precisa y útil.
*/
