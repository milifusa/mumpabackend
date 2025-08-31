import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'https://mumpabackend-lyop389dp-mishu-lojans-projects.vercel.app';

// Crear instancia de axios
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token de autenticación
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('userData');
    }
    return Promise.reject(error);
  }
);

// ===== SERVICIOS DE APRENDIZAJE CONTINUO =====

export const learningService = {
  // ===== CHAT CON DOULI (MEJORADO CON RAG) =====
  chatWithDouli: async (message, conversationId = null) => {
    try {
      console.log('🤖 [DOULI] Enviando mensaje:', message);
      
      const response = await api.post('/api/doula/chat', {
        message,
        conversationId
      });
      
      console.log('✅ [DOULI] Respuesta recibida:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ [DOULI] Error en chat:', error.response?.data || error.message);
      throw error;
    }
  },

  // ===== FEEDBACK DEL USUARIO =====
  sendFeedback: async (conversationId, feedback, details = {}) => {
    try {
      console.log('📝 [FEEDBACK] Enviando feedback:', feedback);
      
      const response = await api.post('/api/doula/feedback', {
        conversationId,
        feedback, // 'positive' | 'negative'
        details
      });
      
      console.log('✅ [FEEDBACK] Feedback enviado:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ [FEEDBACK] Error enviando feedback:', error.response?.data || error.message);
      throw error;
    }
  },

  // ===== MEMORIA DEL USUARIO =====
  updateUserMemory: async (notes = [], preferences = {}) => {
    try {
      console.log('🧠 [MEMORY] Actualizando memoria del usuario');
      
      const response = await api.put('/api/doula/memory', {
        notes,
        preferences
      });
      
      console.log('✅ [MEMORY] Memoria actualizada:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ [MEMORY] Error actualizando memoria:', error.response?.data || error.message);
      throw error;
    }
  },

  // ===== AGREGAR CONOCIMIENTO (ADMIN) =====
  addKnowledge: async (text, metadata = {}) => {
    try {
      console.log('📚 [KNOWLEDGE] Agregando conocimiento:', metadata.topic);
      
      const response = await api.post('/api/doula/knowledge', {
        text,
        metadata
      });
      
      console.log('✅ [KNOWLEDGE] Conocimiento agregado:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ [KNOWLEDGE] Error agregando conocimiento:', error.response?.data || error.message);
      throw error;
    }
  },

  // ===== APRENDIZAJE VALIDADO (POST /learn) =====
  learnValidatedKnowledge: async (text, metadata, validation) => {
    try {
      console.log('🔍 [LEARN] Aprendizaje validado:', metadata.topic);
      
      const response = await api.post('/api/doula/learn', {
        text,
        metadata,
        validation
      });
      
      console.log('✅ [LEARN] Conocimiento validado y aprendido:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ [LEARN] Error en aprendizaje validado:', error.response?.data || error.message);
      throw error;
    }
  },

  // ===== TEST DE CALIDAD =====
  runQualityTest: async () => {
    try {
      console.log('🧪 [QUALITY] Ejecutando test de calidad...');
      
      const response = await api.post('/api/doula/quality-test');
      
      console.log('✅ [QUALITY] Test completado:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ [QUALITY] Error en test de calidad:', error.response?.data || error.message);
      throw error;
    }
  },

  // ===== BORRAR MEMORIA DEL USUARIO =====
  clearUserMemory: async () => {
    try {
      console.log('🗑️ [MEMORY] Borrando memoria del usuario...');
      
      const response = await api.delete('/api/doula/memory');
      
      console.log('✅ [MEMORY] Memoria borrada:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ [MEMORY] Error borrando memoria:', error.response?.data || error.message);
      throw error;
    }
  },

  // ===== INFORMACIÓN DE DESARROLLO INFANTIL =====
  getChildDevelopmentInfo: async (childId = null, name = null, ageInMonths = null, isUnborn = false, gestationWeeks = null) => {
    try {
      console.log('👶 [DEVELOPMENT] Obteniendo información de desarrollo...');
      
      const requestData = {};
      
      if (childId) {
        // Usar childId para obtener información automática
        requestData.childId = childId;
        console.log('👶 [DEVELOPMENT] Usando childId:', childId);
      } else if (name) {
        // Modo manual con parámetros específicos
        requestData.name = name;
        requestData.ageInMonths = ageInMonths;
        requestData.isUnborn = isUnborn;
        requestData.gestationWeeks = gestationWeeks;
        console.log('👶 [DEVELOPMENT] Usando parámetros manuales para:', name);
      } else {
        throw new Error('Se requiere childId o nombre del niño');
      }
      
      const response = await api.post('/api/children/development-info', requestData);
      
      console.log('✅ [DEVELOPMENT] Información obtenida:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ [DEVELOPMENT] Error obteniendo información:', error.response?.data || error.message);
      throw error;
    }
  },

  // ===== OBTENER INFORMACIÓN ACTUALIZADA DE HIJOS =====
  getChildrenCurrentInfo: async () => {
    try {
      console.log('👶 [CHILDREN] Obteniendo información actualizada de hijos...');
      
      const response = await api.get('/api/auth/children/current-info');
      
      console.log('✅ [CHILDREN] Información obtenida:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ [CHILDREN] Error obteniendo información:', error.response?.data || error.message);
      throw error;
    }
  },

  // ===== OBTENER CONOCIMIENTO BASE =====
  getBaseKnowledge: () => {
    return [
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
  },

  // ===== INICIALIZAR BASE DE CONOCIMIENTO =====
  initializeKnowledgeBase: async () => {
    try {
      console.log('🧠 [KNOWLEDGE] Inicializando base de conocimiento...');
      
      const baseKnowledge = learningService.getBaseKnowledge();
      let successCount = 0;
      let totalCount = baseKnowledge.length;
      
      for (const knowledgeItem of baseKnowledge) {
        try {
          await learningService.addKnowledge(knowledgeItem.text, knowledgeItem.metadata);
          successCount++;
          console.log(`✅ [KNOWLEDGE] ${successCount}/${totalCount} - ${knowledgeItem.metadata.topic}`);
          
          // Esperar un poco entre peticiones
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          console.log(`❌ [KNOWLEDGE] Error en ${knowledgeItem.metadata.topic}:`, error.message);
        }
      }
      
      console.log(`🎉 [KNOWLEDGE] Inicialización completada: ${successCount}/${totalCount}`);
      return { successCount, totalCount };
    } catch (error) {
      console.error('💥 [KNOWLEDGE] Error en inicialización:', error);
      throw error;
    }
  }
};

// ===== TIPOS DE DATOS (JSDoc) =====

/**
 * @typedef {Object} DouliMessage
 * @property {string} message - Mensaje del usuario
 * @property {string} response - Respuesta de Douli
 * @property {Date} timestamp - Fecha y hora del mensaje
 * @property {string} [conversationId] - ID de la conversación
 * @property {boolean} [usedFallback] - Si usó respuesta de respaldo
 * @property {'openai'|'fallback'} [source] - Fuente de la respuesta
 */

/**
 * @typedef {Object} FeedbackData
 * @property {string} conversationId - ID de la conversación
 * @property {'positive'|'negative'} feedback - Tipo de feedback
 */

/**
 * @typedef {Object} UserMemory
 * @property {string[]} notes - Notas del usuario
 * @property {Object} preferences - Preferencias del usuario
 */

/**
 * @typedef {Object} KnowledgeItem
 * @property {string} text - Texto del conocimiento
 * @property {Object} metadata - Metadatos del conocimiento
 * @property {string} metadata.source - Fuente del conocimiento
 * @property {string} metadata.topic - Tema del conocimiento
 * @property {string} metadata.stage - Etapa (embarazo/posparto)
 * @property {string} metadata.version - Versión del conocimiento
 * @property {string} metadata.language - Idioma
 * @property {number} metadata.qualityScore - Puntuación de calidad
 */

export default learningService;
