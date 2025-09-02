// Cargar variables de entorno desde archivo .env
require('dotenv').config();

// Función para validar URL
const isValidUrl = (string) => {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
};

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const OpenAI = require('openai');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración de CORS mejorada
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://munpa.online', 'https://www.munpa.online'] 
    : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173', 'http://localhost:8081', 'http://localhost:19006'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Configuración de multer para subida de archivos en memoria (compatible con Vercel)
const upload = multer({ 
  storage: multer.memoryStorage(), // Usar memoria en lugar de disco
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB máximo
  },
  fileFilter: function (req, file, cb) {
    // Solo permitir imágenes
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos de imagen'), false);
    }
  }
});

// Middleware para manejar peticiones OPTIONS (preflight)
app.options('*', cors());

// Middleware de logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  console.log('📋 Headers recibidos:', req.headers);
  next();
});

// Configurar Firebase usando el archivo JSON
let auth = null;
let db = null;
let admin = null;
let FieldValue = null;
let firebaseStatus = 'No inicializado';

// Configurar OpenAI
let openai = null;
let openaiStatus = 'No inicializado';

// Middleware de autenticación (declarado antes de su uso)
const authenticateToken = async (req, res, next) => {
  try {
    console.log('🔍 [AUTH] Iniciando verificación de token para:', req.path);
    
    if (!auth) {
      console.log('❌ [AUTH] Firebase no está configurado');
      return res.status(500).json({
        success: false,
        message: 'Firebase no está configurado'
      });
    }
    
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      console.log('❌ [AUTH] No se encontró token en headers');
      return res.status(401).json({
        success: false,
        message: 'Token de acceso requerido'
      });
    }

    console.log('🔑 [AUTH] Token encontrado, longitud:', token.length);

    try {
      // PRIMERO intentar extraer uid del customToken JWT
      console.log('🔄 [AUTH] Intentando extraer UID del customToken...');
      const tokenParts = token.split('.');
      
      if (tokenParts.length === 3) {
        try {
          const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
          console.log('🔍 [AUTH] Payload del token:', payload);
          
          if (payload.uid) {
            console.log('✅ [AUTH] UID extraído del customToken:', payload.uid);
            
            req.user = { uid: payload.uid };
            console.log('✅ [AUTH] req.user configurado:', req.user);
            next();
            return;
          }
        } catch (decodeError) {
          console.log('❌ [AUTH] Error decodificando customToken:', decodeError.message);
        }
      }
      
      // SEGUNDO intentar como idToken
      console.log('🔄 [AUTH] Intentando verificar como idToken...');
      const decodedIdToken = await auth.verifyIdToken(token);
      console.log('✅ [AUTH] IdToken verificado exitosamente');
      
      req.user = decodedIdToken;
      console.log('✅ [AUTH] req.user configurado:', req.user);
      next();
      
    } catch (idTokenError) {
      console.log('❌ [AUTH] Error verificando idToken:', idTokenError.message);
      return res.status(403).json({
        success: false,
        message: 'Token inválido o expirado'
      });
    }
  } catch (error) {
    console.error('❌ [AUTH] Error general en autenticación:', error);
    return res.status(403).json({
      success: false,
      message: 'Token inválido o expirado'
    });
  }
};

const setupFirebase = () => {
  try {
    console.log('🔥 Configurando Firebase con variables de entorno...');
    
    admin = require('firebase-admin');
    
    // Verificar que las variables de entorno estén disponibles
    const requiredEnvVars = [
      'FIREBASE_TYPE',
      'FIREBASE_PROJECT_ID',
      'FIREBASE_PRIVATE_KEY_ID',
      'FIREBASE_PRIVATE_KEY',
      'FIREBASE_CLIENT_EMAIL',
      'FIREBASE_CLIENT_ID',
      'FIREBASE_AUTH_URI',
      'FIREBASE_TOKEN_URI',
      'FIREBASE_AUTH_PROVIDER_X509_CERT_URL',
      'FIREBASE_CLIENT_X509_CERT_URL'
    ];

    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      throw new Error(`Variables de entorno faltantes: ${missingVars.join(', ')}`);
    }

    // Crear objeto de configuración desde variables de entorno
    const serviceAccount = {
      type: process.env.FIREBASE_TYPE,
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
      private_key: process.env.FIREBASE_PRIVATE_KEY
        .replace(/\\n/g, '\n')
        .replace(/"/g, '')
        .trim(),
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_CLIENT_ID,
      auth_uri: process.env.FIREBASE_AUTH_URI,
      token_uri: process.env.FIREBASE_TOKEN_URI,
      auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
      client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL
    };
    
    console.log('✅ Variables de entorno cargadas correctamente');

    // Inicializar Firebase
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: 'mumpabackend.firebasestorage.app'
      });
      console.log('✅ Firebase Admin inicializado con Storage Bucket: mumpabackend.firebasestorage.app');
    } else {
      console.log('✅ Firebase Admin ya estaba inicializado');
    }
    
    auth = admin.auth();
    db = admin.firestore();
    FieldValue = admin.firestore.FieldValue;
    
    console.log('✅ Firebase Auth y Firestore configurados');
    firebaseStatus = 'Configurado correctamente';
    return true;
  } catch (error) {
    console.error('❌ Error configurando Firebase:', error.message);
    firebaseStatus = `Error: ${error.message}`;
    return false;
  }
};

// Función para generar respuestas de doula predefinidas
const generateDoulaResponse = (message, userContext, childrenInfo, userName = 'Mamá') => {
  const lowerMessage = message.toLowerCase();
  
  // Detectar temas fuera del ámbito de doula
  const offTopicKeywords = [
    'programación', 'código', 'javascript', 'python', 'html', 'css', 'desarrollo', 'app', 'software',
    'finanzas', 'dinero', 'inversión', 'banco', 'crédito', 'préstamo', 'economía',
    'derecho', 'ley', 'legal', 'abogado', 'contrato', 'trámite',
    'medicina', 'diagnóstico', 'radiología', 'rayos x', 'análisis', 'medicamento', 'receta',
    'tecnología', 'computadora', 'celular', 'internet', 'redes sociales',
    'cocina', 'receta', 'comida', 'restaurante', 'cocinar',
    'deportes', 'fútbol', 'basketball', 'gimnasio', 'ejercicio físico',
    'política', 'elecciones', 'gobierno', 'presidente',
    'viajes', 'turismo', 'hotel', 'avión', 'vacaciones'
  ];
  
  const isOffTopic = offTopicKeywords.some(keyword => lowerMessage.includes(keyword));
  
  if (isOffTopic) {
    return `Soy Douli, tu asistente de Munpa especializada en acompañamiento durante el embarazo, parto y crianza temprana.

🤱 **Mi especialidad es:**
• Embarazo y preparación al parto
• Lactancia y cuidados del bebé
• Apoyo emocional para familias
• Señales de alarma y cuándo consultar

📞 **Para tu consulta sobre ${message}, te recomiendo:**
• Consultar con un profesional especializado
• Buscar información en fuentes oficiales
• Contactar servicios específicos para ese tema

¿Hay algo relacionado con tu embarazo, parto o crianza en lo que pueda ayudarte? 💝`;
  }
  
  // Extraer información de los hijos del contexto
  let childrenContext = '';
  let hasUnbornChildren = false;
  let hasYoungChildren = false;
  let hasMultipleChildren = false;
  let childrenNames = [];
  let unbornChildrenNames = [];
  let youngChildrenNames = [];
  
  if (childrenInfo) {
    const childrenMatch = childrenInfo.match(/Hijos nacidos: (\d+)/);
    const unbornMatch = childrenInfo.match(/Hijos por nacer: (\d+)/);
    
    if (childrenMatch && unbornMatch) {
      const bornCount = parseInt(childrenMatch[1]);
      const unbornCount = parseInt(unbornMatch[1]);
      
      hasUnbornChildren = unbornCount > 0;
      hasMultipleChildren = (bornCount + unbornCount) > 1;
      
      // Extraer nombres de los hijos
      const nameMatches = childrenInfo.matchAll(/- ([^:]+):/g);
      for (const match of nameMatches) {
        const name = match[1].trim();
        childrenNames.push(name);
        
        // Determinar si es hijo por nacer o nacido
        const lineAfterName = childrenInfo.substring(match.index).split('\n')[0];
        if (lineAfterName.includes('Por nacer')) {
          unbornChildrenNames.push(name);
        } else if (lineAfterName.includes('mes') || lineAfterName.includes('año')) {
          youngChildrenNames.push(name);
        }
      }
      
      // Determinar si tiene hijos pequeños (menos de 3 años)
      if (childrenInfo.includes('mes') || childrenInfo.includes('año')) {
        hasYoungChildren = true;
      }
    }
  }
  
  // Respuestas para síntomas del primer trimestre
  if (lowerMessage.includes('síntoma') || lowerMessage.includes('primer trimestre') || lowerMessage.includes('náusea')) {
    let personalizedIntro = `Soy Douli, tu asistente de Munpa. Te puedo ayudar con los síntomas del primer trimestre.`;
    
    if (hasUnbornChildren) {
      const unbornNames = unbornChildrenNames.join(' y ');
      personalizedIntro += ` Veo que tienes a ${unbornNames} en camino, ¡qué emoción!`;
    } else if (hasYoungChildren) {
      const youngNames = youngChildrenNames.join(' y ');
      personalizedIntro += ` Como ya has pasado por esto antes con ${youngNames}, sabes que cada embarazo es diferente.`;
    } else if (hasMultipleChildren) {
      const allNames = childrenNames.join(' y ');
      personalizedIntro += ` Con tu experiencia como madre de ${allNames}, sabes que cada embarazo tiene sus particularidades.`;
    }
    
    return `${personalizedIntro}

🤰 **Síntomas normales:**
• Náuseas matutinas
• Fatiga
• Sensibilidad en senos
• Cambios de humor

💡 **Para las náuseas:**
• Come poco y frecuente
• Galletas saladas en la cama
• Bebe mucha agua
• Evita comidas grasosas

⚠️ **Consulta al médico si:**
• Náuseas muy intensas
• Fiebre alta
• Sangrado

¿Qué síntoma te preocupa más?`;
  }
  
  // Respuestas para ejercicios durante el embarazo
  if (lowerMessage.includes('ejercicio') || lowerMessage.includes('actividad física') || lowerMessage.includes('deporte')) {
    return `¡Excelente pregunta! Soy Douli, tu asistente de Munpa. Te recomiendo mantenerte activa durante el embarazo, pero con precaución:

🏃‍♀️ **Ejercicios seguros durante el embarazo:**
• Caminar (30 minutos diarios)
• Yoga prenatal
• Natación
• Pilates adaptado
• Ejercicios de Kegel
• Estiramientos suaves

⚠️ **Ejercicios a evitar:**
• Deportes de contacto
• Ejercicios que requieran acostarse boca arriba después del primer trimestre
• Actividades con riesgo de caída
• Levantar pesos pesados

💡 **Consejos importantes:**
• Escucha a tu cuerpo
• Mantén una respiración constante
• Bebe mucha agua
• Detente si sientes dolor o mareos
• Consulta con tu médico antes de comenzar

¿Qué tipo de actividad física te gustaría practicar?`;
  }
  
  // Respuestas para preparación al parto
  if (lowerMessage.includes('parto') || lowerMessage.includes('dar a luz') || lowerMessage.includes('preparar')) {
    return `¡Qué emoción! Soy Douli, tu asistente de Munpa.

🤱 **Preparación física:**
• Ejercicios de respiración
• Técnicas de relajación
• Fortalece suelo pélvico
• Buena postura

🧘‍♀️ **Preparación mental:**
• Lee sobre el parto
• Visualiza tu parto ideal
• Practica meditación
• Confía en tu cuerpo

📋 **Preparación práctica:**
• Maleta para hospital
• Plan de parto
• Apoyo postparto
• Todo listo en casa

¿En qué aspecto necesitas ayuda?`;
  }
  
  // Respuestas para lactancia
  if (lowerMessage.includes('lactancia') || lowerMessage.includes('amamantar') || lowerMessage.includes('leche materna')) {
    return `¡La lactancia es maravillosa! Soy Douli, tu asistente de Munpa.

🤱 **Beneficios:**
• Nutrición perfecta
• Fortalece sistema inmune
• Crea vínculo especial
• Ayuda recuperación

💡 **Consejos:**
• Contacto piel con piel
• Amamanta a demanda
• Buen agarre
• Posición cómoda

⚠️ **Alerta si:**
• Dolor intenso
• Grietas en pezones
• Fiebre
• Bebé no gana peso

¿Qué te preocupa específicamente?`;
  }
  
  // Respuestas para alimentación durante el embarazo
  if (lowerMessage.includes('comida') || lowerMessage.includes('alimentación') || lowerMessage.includes('dieta') || lowerMessage.includes('nutrición')) {
    return `¡La nutrición es fundamental! Soy Douli, tu asistente de Munpa.

🥗 **Come:**
• Frutas y verduras
• Proteínas magras
• Granos enteros
• Lácteos bajos en grasa

⚠️ **Evita:**
• Pescado alto en mercurio
• Carne cruda
• Quesos sin pasteurizar
• Alcohol y cafeína

💡 **Consejos:**
• 5-6 comidas pequeñas
• 8-10 vasos de agua
• Vitaminas prenatales
• Escucha tu cuerpo

¿Qué alimento te preocupa?`;
  }
  
  // Respuestas para el postparto
  if (lowerMessage.includes('postparto') || lowerMessage.includes('después del parto') || lowerMessage.includes('recuperación')) {
    return `¡El postparto es un período muy importante! Soy Douli, tu asistente de Munpa. Te preparo para esta etapa:

🤱 **Primeras semanas postparto:**
• Descansa cuando el bebé duerma
• Pide ayuda a familiares y amigos
• Come alimentos nutritivos
• Bebe mucha agua
• No te presiones por "volver a la normalidad"

💙 **Cuidado emocional:**
• Es normal sentir emociones intensas
• Habla sobre tus sentimientos
• Busca apoyo si te sientes abrumada
• No te compares con otras madres
• Celebra cada pequeño logro

🏥 **Alerta si:**
• Fiebre alta
• Sangrado excesivo
• Dolor intenso
• Tristeza profunda

💡 **Consejos:**
• Comidas preparadas
• Organiza visitas
• Acepta ayuda
• No te olvides de ti

¿Cómo te sientes?`;
  }
  
  // Verificar si pregunta por un hijo específico o sobre edades
  const askedChildName = childrenNames.find(name => 
    lowerMessage.includes(name.toLowerCase())
  );
  
  // Verificar si pregunta sobre edad específica
  if (askedChildName && (lowerMessage.includes('año') || lowerMessage.includes('edad') || lowerMessage.includes('cuánto') || lowerMessage.includes('cuantos'))) {
    // Buscar la información específica del hijo en childrenInfo
    const childLine = childrenInfo.split('\n').find(line => line.includes(askedChildName));
    
    if (childLine) {
      if (childLine.includes('Por nacer')) {
        const gestationMatch = childLine.match(/\((\d+) semanas de gestación\)/);
        const weeks = gestationMatch ? gestationMatch[1] : 'desconocidas';
        return `Soy Douli, tu asistente de Munpa. 

🤱 **${askedChildName}:**
${askedChildName} está por nacer (${weeks} semanas de gestación).

💡 **Próximos pasos:**
• Prepara la maleta para el hospital
• Ten todo listo en casa
• Practica técnicas de respiración

¿Necesitas ayuda con la preparación?`;
      } else {
        // Extraer edad del texto
        const ageMatch = childLine.match(/: (.+?) de edad/);
        if (ageMatch) {
          const age = ageMatch[1];
          return `Soy Douli, tu asistente de Munpa. 

👶 **${askedChildName}:**
${askedChildName} tiene ${age}.

💡 **Consejos para esta edad:**
• Mantén rutinas estables
• Celebra sus logros
• Dedica tiempo individual

¿Qué aspecto específico te preocupa?`;
        }
      }
    }
  }
  
  // Verificar si pregunta por un hijo específico (sin edad)
  if (askedChildName) {
    const isUnborn = unbornChildrenNames.includes(askedChildName);
    const isYoung = youngChildrenNames.includes(askedChildName);
    
    if (isUnborn) {
      return `Soy Douli, tu asistente de Munpa.

🤱 **${askedChildName}:**
${askedChildName} está por nacer.

💡 **Preparación:**
• Todo listo para su llegada
• Prepara a tus otros hijos
• Maleta para hospital
• Técnicas de respiración

¿Qué necesitas saber específicamente?`;
    } else if (isYoung) {
      return `Soy Douli, tu asistente de Munpa.

👶 **${askedChildName}:**
${askedChildName} está en etapa de desarrollo.

💡 **Consejos:**
• Rutina estable
• Tiempo individual
• Celebra logros
• Paciencia

¿Qué te preocupa específicamente?`;
    } else {
      return `Soy Douli, tu asistente de Munpa.

👶 **${askedChildName}:**
${askedChildName} es parte de tu familia.

💡 **Consejos:**
• Necesidades únicas
• Tiempo individual
• Celebra logros
• Comunicación abierta

¿Qué necesitas saber?`;
    }
  }
  
  // Respuesta general para cualquier otra pregunta
  let personalizedIntro = `Soy Douli, tu asistente de Munpa.`;
  
  if (hasUnbornChildren) {
    const unbornNames = unbornChildrenNames.join(' y ');
    personalizedIntro += ` Veo que tienes a ${unbornNames} en camino. ¡Qué momento tan especial!`;
  } else if (hasYoungChildren) {
    const youngNames = youngChildrenNames.join(' y ');
    personalizedIntro += ` Como madre experimentada con ${youngNames}, sabes que cada día trae nuevos aprendizajes.`;
  } else if (hasMultipleChildren) {
    const allNames = childrenNames.join(' y ');
    personalizedIntro += ` Con tu experiencia criando a ${allNames}, eres una madre sabia.`;
  } else {
    personalizedIntro += ` Estoy aquí para acompañarte en este hermoso viaje del embarazo y la maternidad.`;
  }
  
  // Respuestas para preguntas sobre el nombre del usuario
  if (lowerMessage.includes('nombre') || lowerMessage.includes('llamas') || lowerMessage.includes('sabes mi nombre')) {
    return `¡Hola ${userName}! Soy Douli, tu asistente de Munpa.

💝 **Sobre tu nombre:**
Tu nombre es ${userName} y es hermoso. Me encanta poder llamarte por tu nombre para hacer nuestra conversación más personal y cercana.

🤱 **Como tu asistente:**
Estoy aquí para acompañarte en tu viaje de maternidad, ${userName}. Puedo ayudarte con consejos sobre embarazo, parto, lactancia y crianza.

¿En qué puedo ayudarte hoy ${userName}?`;
  }
  
  // Respuestas para preguntas generales sobre hijos
  if (lowerMessage.includes('hijo') || lowerMessage.includes('hijos') || lowerMessage.includes('cuántos') || lowerMessage.includes('nombres')) {
    if (childrenNames.length > 0) {
      const bornChildren = childrenNames.filter(name => !unbornChildrenNames.includes(name));
      const unbornChildren = unbornChildrenNames;
      
      let response = `Soy Douli, tu asistente de Munpa. 

👶 **Tu familia:**
Tienes ${childrenNames.length} hijo${childrenNames.length > 1 ? 's' : ''}.`;

      if (bornChildren.length > 0) {
        response += `\n\n👶 **Nacidos:**
${bornChildren.map(name => `• ${name}`).join('\n')}`;
      }
      
      if (unbornChildren.length > 0) {
        response += `\n\n🤱 **Por nacer:**
${unbornChildren.map(name => `• ${name}`).join('\n')}`;
      }
      
      response += `\n\n💡 **Puedo ayudarte con:**
• Consejos específicos por edad
• Preparación para nuevos bebés
• Manejo de múltiples hijos

¿Sobre cuál necesitas ayuda?`;
      
      return response;
    } else {
      return `¡Hola ${userName}! Soy Douli, tu asistente de Munpa. 

👶 **Sobre tu familia:**
Actualmente no tienes hijos registrados en el sistema, pero estoy aquí para acompañarte en tu viaje hacia la maternidad.

💝 **Puedo ayudarte con:**
• Preparación para el embarazo
• Información sobre el parto
• Cuidado postparto
• Lactancia materna
• Apoyo emocional

¿Te gustaría que te ayude con algún tema específico ${userName}?`;
    }
  }
  
  return `${personalizedIntro}

💡 **Puedo ayudarte con:**
• Embarazo y parto
• Lactancia
• Cuidado postparto
• Apoyo emocional
${hasMultipleChildren ? '• Múltiples hijos' : ''}
${hasYoungChildren ? '• Niños pequeños' : ''}
${hasUnbornChildren ? '• Preparación bebé' : ''}

¿En qué necesitas ayuda específicamente ${userName}?`;
};

// Función para configurar OpenAI
const setupOpenAI = () => {
  try {
    console.log('🤖 Configurando OpenAI...');
    
    if (!process.env.OPENAI_API_KEY) {
      console.log('⚠️ OPENAI_API_KEY no está configurada - OpenAI será opcional');
      openaiStatus = 'No configurado (opcional)';
      return false;
    }

    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    
    console.log('✅ OpenAI configurado correctamente');
    openaiStatus = 'Configurado correctamente';
    return true;
  } catch (error) {
    console.error('❌ Error configurando OpenAI:', error.message);
    openaiStatus = `Error: ${error.message}`;
    return false;
  }
};

// Inicializar Firebase
const firebaseReady = setupFirebase();

// Inicializar OpenAI
const openaiReady = setupOpenAI();

// Ruta de salud
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Servidor funcionando correctamente',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    firebase: {
      status: firebaseStatus,
      ready: firebaseReady,
      hasAuth: !!auth,
      hasDb: !!db,
      hasAdmin: !!admin,
      hasStorage: !!(admin && admin.storage)
    },
    openai: {
      status: openaiStatus,
      ready: openaiReady,
      hasClient: !!openai
    }
  });
});

// Endpoint de la Doula Virtual
app.post('/api/doula/chat', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { message, context } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'El mensaje es requerido'
      });
    }

    // Verificar que OpenAI esté configurado
    if (!openai) {
      return res.status(500).json({
        success: false,
        message: 'Servicio de IA no disponible'
      });
    }

    // Obtener información del usuario y sus hijos para contexto personalizado
    let userContext = '';
    let childrenInfo = '';
    let userName = '';
    let userMemory = null;
    let relevantKnowledge = [];
    
    if (db) {
      try {
        // Obtener datos del usuario desde Firestore
        const userDoc = await db.collection('users').doc(uid).get();
        if (userDoc.exists) {
          const userData = userDoc.data();
          // Obtener nombre del usuario
          userName = userData.displayName || userData.name || 'Mamá';
          
          // Si no hay nombre en Firestore, intentar obtenerlo de Firebase Auth
          if (!userName || userName === 'Mamá') {
            try {
              const authUser = await auth.getUser(uid);
              userName = authUser.displayName || authUser.email?.split('@')[0] || 'Mamá';
              console.log('📋 [DOULA] Nombre obtenido de Firebase Auth:', {
                authDisplayName: authUser.displayName,
                authEmail: authUser.email,
                userNameFinal: userName
              });
            } catch (authError) {
              console.log('⚠️ [DOULA] No se pudo obtener nombre de Firebase Auth:', authError.message);
            }
          }
          console.log('📋 [DOULA] Nombre del usuario obtenido:', {
            displayName: userData.displayName,
            name: userData.name,
            userNameFinal: userName,
            userDataKeys: Object.keys(userData)
          });
          
          // Obtener memoria del usuario
          userMemory = await getUserMemory(uid);
          
          // Determinar filtros para el conocimiento basado en el contexto del usuario
          let knowledgeFilters = { language: 'es' };
          if (userData.isPregnant) {
            knowledgeFilters.stage = 'embarazo';
          } else if (userData.childrenCount > 0) {
            knowledgeFilters.stage = 'posparto';
          }
          
          // Recuperar conocimiento relevante
          relevantKnowledge = await retrieveKnowledge(message, knowledgeFilters);
          
          // Obtener información actualizada de los hijos con edades calculadas
          const childrenSnapshot = await db.collection('children')
            .where('parentId', '==', uid)
            .orderBy('createdAt', 'desc')
            .get();
          
          const children = [];
          childrenSnapshot.forEach(doc => {
            const childData = doc.data();
            const currentInfo = getChildCurrentInfo(childData);
            children.push({
              id: doc.id,
              name: childData.name,
              ageInMonths: childData.ageInMonths,
              currentAgeInMonths: currentInfo.currentAgeInMonths,
              isUnborn: childData.isUnborn,
              gestationWeeks: childData.gestationWeeks,
              currentGestationWeeks: currentInfo.currentGestationWeeks,
              createdAt: childData.createdAt,
              registeredAt: childData.registeredAt,
              daysSinceRegistration: currentInfo.daysSinceRegistration
            });
          });
          
          // Crear contexto personalizado del usuario con semanas actualizadas
          let userGestationWeeks = userData.gestationWeeks;
          
          // Si el usuario está embarazada y tiene semanas registradas, calcular las actuales
          if (userData.isPregnant && userData.gestationWeeks && userData.createdAt) {
            const now = new Date();
            const createdDate = new Date(userData.createdAt);
            const diffTime = now - createdDate;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            const diffWeeks = Math.floor(diffDays / 7);
            const currentWeeks = userData.gestationWeeks + diffWeeks;
            
            // Aplicar límites
            if (currentWeeks > 42) {
              userGestationWeeks = 40; // Término completo
            } else if (currentWeeks < 4) {
              userGestationWeeks = 4; // Mínimo
            } else {
              userGestationWeeks = currentWeeks;
            }
            
            console.log(`📊 [USER GESTATION] Usuario: ${userData.gestationWeeks} semanas + ${diffWeeks} semanas = ${userGestationWeeks} semanas (${diffDays} días desde creación)`);
          }
          
          userContext = `
            Información del usuario:
            - Género: ${userData.gender === 'F' ? 'Mujer' : 'Hombre'}
            - Número de hijos: ${userData.childrenCount || 0}
            - Embarazada: ${userData.isPregnant ? 'Sí' : 'No'}
            ${userGestationWeeks ? `- Semanas de gestación: ${userGestationWeeks} (calculadas automáticamente)` : ''}
          `;
          
          // Crear contexto detallado de los hijos con edades actualizadas
          if (children.length > 0) {
            childrenInfo = `
            Información de los hijos (edades actualizadas automáticamente):
            ${children.map((child, index) => {
              if (child.isUnborn) {
                return `- ${child.name}: Por nacer (${child.currentGestationWeeks} semanas de gestación, registrado con ${child.gestationWeeks} semanas hace ${child.daysSinceCreation} días)`;
              } else {
                const years = Math.floor(child.currentAgeInMonths / 12);
                const months = child.currentAgeInMonths % 12;
                const ageText = years > 0 
                  ? `${years} año${years > 1 ? 's' : ''}${months > 0 ? ` y ${months} mes${months > 1 ? 'es' : ''}` : ''}`
                  : `${months} mes${months > 1 ? 'es' : ''}`;
                return `- ${child.name}: ${ageText} de edad (registrado con ${child.ageInMonths} meses hace ${child.daysSinceCreation} días)`;
              }
            }).join('\n            ')}
            
            Hijos nacidos: ${children.filter(c => !c.isUnborn).length}
            Hijos por nacer: ${children.filter(c => c.isUnborn).length}
            `;
          }
          
          console.log('📋 [DOULA] Contexto del usuario obtenido:', {
            userData: {
              gender: userData.gender,
              childrenCount: userData.childrenCount,
              isPregnant: userData.isPregnant,
              gestationWeeks: userData.gestationWeeks
            },
            children: children.map(c => ({
              name: c.name,
              registeredAge: c.isUnborn ? c.gestationWeeks + ' semanas' : c.ageInMonths + ' meses',
              currentAge: c.isUnborn ? c.currentGestationWeeks + ' semanas' : c.currentAgeInMonths + ' meses',
              isUnborn: c.isUnborn,
              daysSinceCreation: c.daysSinceCreation
            }))
          });
        }
      } catch (error) {
        console.log('⚠️ No se pudo obtener contexto del usuario:', error.message);
      }
    }

    // Crear contexto de conocimiento relevante
    let knowledgeContext = '';
    if (relevantKnowledge.length > 0) {
      knowledgeContext = `
📚 **CONOCIMIENTO RELEVANTE PARA ESTA CONSULTA:**
${relevantKnowledge.map((k, index) => `${index + 1}. ${k.text}`).join('\n')}
`;
    }
    
    // Crear contexto de memoria del usuario
    let memoryContext = '';
    if (userMemory) {
      memoryContext = `
🧠 **MEMORIA DE CONVERSACIONES ANTERIORES:**
${userMemory.notes.length > 0 ? `Notas importantes: ${userMemory.notes.join(', ')}` : ''}
${userMemory.preferences ? `Preferencias: ${JSON.stringify(userMemory.preferences)}` : ''}
`;
    }
    
    // Crear el prompt para la doula virtual
    const systemPrompt = `Eres una doula virtual experta y compasiva llamada "Douli, asistente de Munpa". Tu misión es acompañar a padres y madres durante el embarazo, parto y crianza temprana con amor, sabiduría y profesionalismo.

🎯 **TU IDENTIDAD COMO DOULA:**
- Eres cálida, empática y siempre comprensiva
- Hablas con el corazón de una madre experimentada
- Proporcionas información basada en evidencia médica
- Eres profesional pero cercana, como una amiga sabia
- Eres parte de la familia Munpa, dedicada a apoyar a las familias

💝 **TU ESTILO DE COMUNICACIÓN:**
- Usa emojis para hacer las respuestas más cálidas
- Sé específica y práctica en tus consejos
- Siempre ofrece apoyo emocional
- Usa un tono maternal y protector
- Sé alentadora y positiva
- Preséntate como "Douli, tu asistente de Munpa"
- Responde en español neutro, usa bullets cuando convenga
- Finaliza con una sugerencia práctica

📚 **ÁMBITO PERMITIDO - SOLO PUEDES RESPONDER SOBRE:**
- Embarazo (síntomas, cambios, cuidados)
- Preparación al parto (física y mental)
- Trabajo de parto (técnicas, respiración)
- Parto (proceso, acompañamiento)
- Posparto (recuperación, adaptación)
- Lactancia (técnicas, problemas comunes)
- Cuidados del recién nacido
- Apoyo emocional y de pareja
- Crianza temprana (cuidados, alimentación, desarrollo)
- Alimentación (lactancia)
- Salud mental (depresión, ansiedad, estrés)
- Maternidad (acompañamiento, recuperación, adaptación)
- Embarazo y parto (acompañamiento, recuperación, adaptación)
- Señales de alarma para derivar a profesionales de salud

🚫 **POLÍTICA DE ALCANCE - SI TE PREGUNTAN SOBRE:**
- Finanzas, programación, tecnología
- Diagnóstico médico detallado
- Radiología, interpretación de estudios
- Recetas de medicamentos
- Derecho, trámites legales
- Cualquier tema fuera del ámbito de doula

**RESPUESTA OBLIGATORIA:**
"¡Hola ${userName}! Soy Douli, tu asistente de Munpa especializada en acompañamiento durante el embarazo, parto y crianza temprana.

🤱 **Mi especialidad es:**
• Embarazo y preparación al parto
• Lactancia y cuidados del bebé
• Apoyo emocional para familias
• Señales de alarma y cuándo consultar

📞 **Para tu consulta sobre [tema fuera del ámbito], te recomiendo:**
• Consultar con un profesional especializado
• Buscar información en fuentes oficiales
• Contactar servicios específicos para ese tema

¿Hay algo relacionado con tu embarazo, parto o crianza en lo que pueda ayudarte? 💝"

⚠️ **LIMITACIONES MÉDICAS:**
- NO haces diagnóstico médico
- NO indicas fármacos
- NO interpretas estudios clínicos
- SIEMPRE aclara que no eres médico
- Si no sabes algo, sugiere hablar con gine/obstetra o matrona

🚨 **SEGURIDAD - URGENCIAS MÉDICAS:**
Ante cualquier síntoma de urgencia (sangrado abundante, disminución marcada de movimientos fetales, dolor intenso, fiebre alta, convulsiones, pérdida de conocimiento):
**"¡BUSCA ATENCIÓN MÉDICA INMEDIATA! Llama a servicios de emergencia o ve al hospital más cercano."**

${userContext}
${childrenInfo}
${knowledgeContext}
${memoryContext}

IMPORTANTE: 
- Usa esta información para personalizar tus respuestas
- Si hay conocimiento relevante, úsalo para mejorar tu respuesta
- Si hay memoria del usuario, considera sus preferencias y notas anteriores
- Si tiene hijos pequeños, da consejos específicos para esa edad
- Si está embarazada, enfócate en esa etapa específica
- SIEMPRE usa los nombres específicos de sus hijos cuando sea apropiado
- NO inventes datos; si no sabes, dilo y sugiere hablar con su gine/obstetra o matrona

Responde como Douli, tu asistente de Munpa, con amor, sabiduría y el corazón de una madre que ha acompañado a muchas mujeres en este hermoso viaje.`;

    console.log('🤖 [DOULA] Enviando mensaje a OpenAI:', message.substring(0, 100) + '...');

    // Enviar mensaje a OpenAI
    let response;
    let usedFallback = false;
    
    try {
      console.log('🤖 [DOULA] Enviando a OpenAI...');
      
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message }
        ],
        max_tokens: 800, // Más tokens para respuestas más completas
        temperature: 0.8, // Más creatividad pero manteniendo coherencia
        presence_penalty: 0.1, // Evita repeticiones
        frequency_penalty: 0.1, // Variedad en las respuestas
        top_p: 0.9 // Mantiene respuestas coherentes
      });

      response = completion.choices[0].message.content;
      console.log('✅ [DOULA] Respuesta de OpenAI recibida');
      
    } catch (openaiError) {
      console.error('❌ [DOULA] Error de OpenAI:', openaiError.message);
      
      // Fallback cuando se agota la cuota - Respuestas de doula predefinidas
      if (openaiError.message.includes('quota') || openaiError.message.includes('429')) {
        console.log('⚠️ [DOULA] Usando fallback por cuota agotada');
        response = generateDoulaResponse(message, userContext, childrenInfo, userName);
        usedFallback = true;
      } else {
        console.log('❌ [DOULA] Error no relacionado con cuota, usando fallback');
        response = generateDoulaResponse(message, userContext, childrenInfo, userName);
        usedFallback = true;
      }
    }

    // Guardar la conversación en Firestore (opcional)
    if (db) {
      try {
        await db.collection('doula_conversations').add({
          userId: uid,
          userMessage: message,
          doulaResponse: response,
          timestamp: new Date(),
          context: context || null
        });
        console.log('💾 [DOULA] Conversación guardada en Firestore');
      } catch (error) {
        console.log('⚠️ [DOULA] No se pudo guardar la conversación:', error.message);
      }
    }

    res.json({
      success: true,
      message: 'Respuesta de la doula virtual',
      data: {
        response: response,
        timestamp: new Date().toISOString(),
        usedFallback: usedFallback,
        source: usedFallback ? 'fallback' : 'openai'
      }
    });

  } catch (error) {
    console.error('❌ [DOULA] Error en chat con doula:', error);
    res.status(500).json({
      success: false,
      message: 'Error al procesar la consulta',
      error: error.message
    });
  }
});

// Endpoint para obtener historial de conversaciones
app.get('/api/doula/history', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;

    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Base de datos no disponible'
      });
    }

    const conversationsSnapshot = await db.collection('doula_conversations')
      .where('userId', '==', uid)
      .orderBy('timestamp', 'desc')
      .limit(10)
      .get();

    const conversations = [];
    conversationsSnapshot.forEach(doc => {
      conversations.push({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp.toDate().toISOString()
      });
    });

    res.json({
      success: true,
      data: conversations
    });

  } catch (error) {
    console.error('❌ [DOULA] Error obteniendo historial:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo historial',
      error: error.message
    });
  }
});

// Endpoint para debug de datos del usuario
app.get('/api/debug/user-data', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;
    
    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Base de datos no disponible'
      });
    }
    
    // Obtener datos de Firestore
    const userDoc = await db.collection('users').doc(uid).get();
    let firestoreData = null;
    if (userDoc.exists) {
      firestoreData = userDoc.data();
    }
    
    // Obtener datos de Firebase Auth
    let authData = null;
    try {
      const authUser = await auth.getUser(uid);
      authData = {
        displayName: authUser.displayName,
        email: authUser.email,
        uid: authUser.uid
      };
    } catch (authError) {
      console.log('⚠️ Error obteniendo datos de Auth:', authError.message);
    }
    
    res.json({
      success: true,
      data: {
        uid,
        firestore: firestoreData,
        auth: authData,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Error en debug user-data:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo datos de debug',
      error: error.message
    });
  }
});

// Endpoint para verificar Firebase Storage
app.get('/api/firebase/status', (req, res) => {
  try {
    if (!admin) {
      return res.json({
        success: false,
        message: 'Firebase Admin no está inicializado',
        admin: false,
        storage: false
      });
    }

    if (!admin.storage) {
      return res.json({
        success: false,
        message: 'Firebase Storage no está disponible',
        admin: true,
        storage: false
      });
    }

    const bucket = admin.storage().bucket();
    res.json({
      success: true,
      message: 'Firebase Storage está funcionando correctamente',
      admin: true,
      storage: true,
      bucketName: bucket.name,
      projectId: process.env.FIREBASE_PROJECT_ID,
      storageBucket: 'mumpabackend.firebasestorage.app'
    });
  } catch (error) {
    res.json({
      success: false,
      message: 'Error verificando Firebase Storage',
      error: error.message,
      admin: admin ? true : false,
      storage: false
    });
  }
});

// Ruta raíz
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'API de Autenticación con Firebase',
    version: '1.0.0',
    firebase: {
      status: firebaseStatus,
      ready: firebaseReady
    },
    endpoints: {
      health: '/health',
      signup: '/api/auth/signup',
      login: '/api/auth/login',
      profile: '/api/auth/profile (requiere auth)',
      'update-profile': '/api/auth/profile (PUT, requiere auth)',
      'change-password': '/api/auth/change-password (requiere auth)',
      'delete-account': '/api/auth/account (DELETE, requiere auth)',
      'verify-token': '/api/auth/verify-token (requiere auth)'
    }
  });
});

// Endpoint de registro
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password, displayName, gender, childrenCount, isPregnant, gestationWeeks } = req.body;

    if (!auth) {
      return res.status(500).json({
        success: false,
        message: 'Firebase no está configurado',
        error: 'Auth service not available',
        firebaseStatus: firebaseStatus
      });
    }

    console.log('📝 Intentando registrar usuario:', email, 'Género:', gender, 'Hijos:', childrenCount, 'Embarazada:', isPregnant, 'Semanas:', gestationWeeks);

    // Verificar si el usuario ya existe
    try {
      const existingUser = await auth.getUserByEmail(email);
      return res.status(400).json({
        success: false,
        message: 'El usuario ya existe con este email'
      });
    } catch (error) {
      // El usuario no existe, continuar con el registro
      console.log('✅ Usuario no existe, procediendo con registro');
    }

    // Validar gestación si es mujer
    if (gender === 'F' && isPregnant) {
      if (!gestationWeeks || gestationWeeks < 1 || gestationWeeks > 42) {
        return res.status(400).json({
          success: false,
          message: 'Para mujeres embarazadas, las semanas de gestación deben estar entre 1 y 42'
        });
      }
    }

    // Crear usuario en Firebase Auth
    const userRecord = await auth.createUser({
      email,
      password,
      displayName,
      emailVerified: false
    });

    console.log('✅ Usuario creado en Firebase Auth:', userRecord.uid);

    // Crear documento adicional en Firestore
    if (db) {
      await db.collection('users').doc(userRecord.uid).set({
        email,
        displayName,
        gender: gender || null, // Campo para M o F
        childrenCount: childrenCount || 0, // Contador de hijos
        isPregnant: gender === 'F' ? (isPregnant || false) : false, // Solo mujeres pueden estar embarazadas
        gestationWeeks: gender === 'F' && isPregnant ? gestationWeeks : null, // Semanas de gestación
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true
      });
      console.log('✅ Documento creado en Firestore con datos:', {
      email,
      displayName,
      gender,
      childrenCount,
      isPregnant: gender === 'F' ? (isPregnant || false) : false,
      gestationWeeks: gender === 'F' && isPregnant ? gestationWeeks : null
    });
    }

    // Generar token personalizado
    const customToken = await auth.createCustomToken(userRecord.uid);
    console.log('✅ Token personalizado generado');

    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      data: {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName,
        customToken
      }
    });

  } catch (error) {
    console.error('❌ Error en signup:', error);
    res.status(500).json({
      success: false,
      message: 'Error al registrar usuario',
      error: error.message,
      firebaseStatus: firebaseStatus
    });
  }
});

// Endpoint de login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!auth) {
      return res.status(500).json({
        success: false,
        message: 'Firebase no está configurado',
        error: 'Auth service not available',
        firebaseStatus: firebaseStatus
      });
    }

    console.log('🔐 Intentando login para:', email);

    // Buscar usuario por email
    const userRecord = await auth.getUserByEmail(email);
    console.log('✅ Usuario encontrado:', userRecord.uid);
    
    // Verificar que el usuario esté activo
    if (db) {
      const userDoc = await db.collection('users').doc(userRecord.uid).get();
      
      if (!userDoc.exists || !userDoc.data().isActive) {
        return res.status(401).json({
          success: false,
          message: 'Usuario inactivo o no encontrado'
        });
      }
      console.log('✅ Usuario verificado en Firestore');
    }

    // Generar token personalizado
    const customToken = await auth.createCustomToken(userRecord.uid);
    console.log('✅ Token personalizado generado para login');

    res.json({
      success: true,
      message: 'Login exitoso',
      data: {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName,
        customToken
      }
    });

  } catch (error) {
    console.error('❌ Error en login:', error);
    res.status(401).json({
      success: false,
      message: 'Credenciales inválidas',
      error: error.message,
      firebaseStatus: firebaseStatus
    });
  }
});



// Endpoint protegido - Perfil del usuario
app.get('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const userRecord = await auth.getUser(uid);
    
    let userData = {
      uid: userRecord.uid,
      email: userRecord.email,
      displayName: userRecord.displayName,
      emailVerified: userRecord.emailVerified,
      createdAt: userRecord.metadata.creationTime,
      lastSignIn: userRecord.metadata.lastSignInTime,
      gender: null, // M o F
      childrenCount: 0,
      isPregnant: false,
      gestationWeeks: null
    };

    // Obtener datos adicionales de Firestore
    if (db) {
      const userDoc = await db.collection('users').doc(uid).get();
      if (userDoc.exists) {
        const firestoreData = userDoc.data();
        
        // Calcular semanas de gestación actuales si está embarazada
        let currentGestationWeeks = firestoreData.gestationWeeks || null;
        let daysSinceRegistration = null;
        
        if (firestoreData.isPregnant && firestoreData.gestationWeeks && firestoreData.createdAt) {
          const now = new Date();
          const createdDate = new Date(firestoreData.createdAt);
          const diffTime = now - createdDate;
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          const diffWeeks = Math.floor(diffDays / 7);
          const calculatedWeeks = firestoreData.gestationWeeks + diffWeeks;
          
          // Aplicar límites
          if (calculatedWeeks > 42) {
            currentGestationWeeks = 40; // Término completo
          } else if (calculatedWeeks < 4) {
            currentGestationWeeks = 4; // Mínimo
          } else {
            currentGestationWeeks = calculatedWeeks;
          }
          
          daysSinceRegistration = diffDays;
          
          console.log(`📊 [PROFILE GESTATION] Usuario: ${firestoreData.gestationWeeks} semanas + ${diffWeeks} semanas = ${currentGestationWeeks} semanas (${diffDays} días desde registro)`);
        }
        
        userData = { 
          ...userData, 
          gender: firestoreData.gender || null,
          childrenCount: firestoreData.childrenCount || 0,
          isPregnant: firestoreData.isPregnant || false,
          gestationWeeks: firestoreData.gestationWeeks || null, // Semanas registradas originales
          currentGestationWeeks: currentGestationWeeks, // Semanas calculadas automáticamente
          daysSinceRegistration: daysSinceRegistration, // Días desde el registro
          isActive: firestoreData.isActive || true,
          updatedAt: firestoreData.updatedAt
        };
      }
    }

    res.json({
      success: true,
      data: userData
    });

  } catch (error) {
    console.error('Error al obtener perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener perfil del usuario',
      error: error.message
    });
  }
});

// Endpoint para actualizar perfil
app.put('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { displayName, email, gender, childrenCount, isPregnant, gestationWeeks } = req.body;

    const updateData = {};
    if (displayName) updateData.displayName = displayName;
    if (email) updateData.email = email;
    if (gender) updateData.gender = gender;
    if (childrenCount !== undefined) updateData.childrenCount = childrenCount;
    if (isPregnant !== undefined) updateData.isPregnant = isPregnant;
    if (gestationWeeks !== undefined) updateData.gestationWeeks = gestationWeeks;

    // Validar gestación solo para mujeres
    if (gender === 'F' && isPregnant && (!gestationWeeks || gestationWeeks < 1 || gestationWeeks > 42)) {
      return res.status(400).json({
        success: false,
        message: 'Para mujeres embarazadas, las semanas de gestación deben estar entre 1 y 42'
      });
    }

    // Limpiar campos de gestación si no está embarazada o es hombre
    if (gender === 'M' || !isPregnant) {
      updateData.isPregnant = false;
      updateData.gestationWeeks = null;
    }

    // Actualizar en Firebase Auth
    await auth.updateUser(uid, updateData);

    // Calcular el número real de hijos de la base de datos
    let actualChildrenCount = 0;
    if (db) {
      const childrenSnapshot = await db.collection('children')
        .where('parentId', '==', uid)
        .get();
      
      actualChildrenCount = childrenSnapshot.size;
      console.log('📊 [PROFILE] Número real de hijos en BD:', actualChildrenCount);
    }

    // Actualizar childrenCount con el valor real
    updateData.childrenCount = actualChildrenCount;

    // Actualizar en Firestore
    if (db) {
      await db.collection('users').doc(uid).update({
        ...updateData,
        updatedAt: new Date()
      });
    }

    res.json({
      success: true,
      message: 'Perfil actualizado exitosamente',
      data: { uid, ...updateData }
    });

  } catch (error) {
    console.error('Error al actualizar perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar perfil',
      error: error.message
    });
  }
});

// Endpoint para cambiar contraseña
app.put('/api/auth/change-password', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'La nueva contraseña debe tener al menos 6 caracteres'
      });
    }

    // Actualizar contraseña en Firebase Auth
    await auth.updateUser(uid, { password: newPassword });

    res.json({
      success: true,
      message: 'Contraseña actualizada exitosamente'
    });

  } catch (error) {
    console.error('Error al cambiar contraseña:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cambiar contraseña',
      error: error.message
    });
  }
});

// Endpoint para eliminar cuenta
app.delete('/api/auth/account', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;

    // Eliminar de Firestore
    if (db) {
      await db.collection('users').doc(uid).delete();
    }

    // Eliminar de Firebase Auth
    await auth.deleteUser(uid);

    res.json({
      success: true,
      message: 'Cuenta eliminada exitosamente'
    });

  } catch (error) {
    console.error('Error al eliminar cuenta:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar cuenta',
      error: error.message
    });
  }
});

// Ruta para solicitar restablecimiento de contraseña
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email es requerido'
      });
    }

    // Verificar que Firebase Auth esté disponible
    if (!auth) {
      console.error('❌ [FORGOT-PASSWORD] Firebase Auth no está disponible');
      return res.status(500).json({
        success: false,
        message: 'Servicio de autenticación no disponible'
      });
    }

    console.log('🔑 [FORGOT-PASSWORD] Solicitando restablecimiento para:', email);

    // Verificar si el usuario existe
    try {
      const userRecord = await auth.getUserByEmail(email);
      console.log('✅ [FORGOT-PASSWORD] Usuario encontrado:', userRecord.uid);
    } catch (userError) {
      if (userError.code === 'auth/user-not-found') {
        return res.status(404).json({
          success: false,
          message: 'No se encontró una cuenta con este email'
        });
      }
      throw userError;
    }

    // Generar link de restablecimiento
    const resetLink = await auth.generatePasswordResetLink(email, {
      url: process.env.FRONTEND_URL || 'https://munpa.online/reset-password',
      handleCodeInApp: true
    });

    console.log('✅ [FORGOT-PASSWORD] Link generado para:', email);

    // TODO: Aquí deberías enviar el email con el link
    // Por ahora, lo devolvemos en la respuesta para testing
    res.json({
      success: true,
      message: 'Se ha enviado un email con instrucciones para restablecer tu contraseña',
      resetLink: process.env.NODE_ENV === 'development' ? resetLink : undefined
    });

  } catch (error) {
    console.error('❌ [FORGOT-PASSWORD] Error:', error);
    
    if (error.code === 'auth/user-not-found') {
      return res.status(404).json({
        success: false,
        message: 'No se encontró una cuenta con este email'
      });
    }

    if (error.code === 'auth/unauthorized-continue-uri') {
      return res.status(400).json({
        success: false,
        message: 'URL de redirección no autorizada. Contacta al administrador.'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error al procesar la solicitud de restablecimiento',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Ruta para confirmar restablecimiento de contraseña
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { oobCode, newPassword } = req.body;

    if (!oobCode || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Código de restablecimiento y nueva contraseña son requeridos'
      });
    }

    // Verificar que Firebase Auth esté disponible
    if (!auth) {
      console.error('❌ [RESET-PASSWORD] Firebase Auth no está disponible');
      return res.status(500).json({
        success: false,
        message: 'Servicio de autenticación no disponible'
      });
    }

    console.log('🔑 [RESET-PASSWORD] Procesando restablecimiento...');

    // Verificar el código y cambiar la contraseña
    const email = await auth.verifyPasswordResetCode(oobCode);
    await auth.confirmPasswordReset(oobCode, newPassword);

    console.log('✅ [RESET-PASSWORD] Contraseña actualizada para:', email);

    res.json({
      success: true,
      message: 'Contraseña actualizada exitosamente'
    });

  } catch (error) {
    console.error('❌ [RESET-PASSWORD] Error:', error);
    
    if (error.code === 'auth/invalid-action-code') {
      return res.status(400).json({
        success: false,
        message: 'Código de restablecimiento inválido o expirado'
      });
    }

    if (error.code === 'auth/weak-password') {
      return res.status(400).json({
        success: false,
        message: 'La contraseña debe tener al menos 6 caracteres'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error al restablecer la contraseña',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Endpoint para obtener hijos del usuario
app.get('/api/auth/children', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;

    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Base de datos no disponible'
      });
    }

    const childrenSnapshot = await db.collection('children')
      .where('parentId', '==', uid)
      .orderBy('createdAt', 'desc')
      .get();

    const children = [];
    childrenSnapshot.forEach(doc => {
      const childData = doc.data();
      const currentInfo = getChildCurrentInfo(childData);
      
      children.push({
        id: doc.id,
        ...childData,
        // Información calculada automáticamente
        currentAgeInMonths: currentInfo.currentAgeInMonths,
        currentGestationWeeks: currentInfo.currentGestationWeeks,
        registeredAgeInMonths: currentInfo.registeredAgeInMonths,
        registeredGestationWeeks: currentInfo.registeredGestationWeeks,
        daysSinceCreation: currentInfo.daysSinceCreation,
        isOverdue: currentInfo.isOverdue || false
      });
    });

    res.json({
      success: true,
      data: children
    });

  } catch (error) {
    console.error('Error al obtener hijos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener hijos',
      error: error.message
    });
  }
});

// Endpoint para agregar un hijo
app.post('/api/auth/children', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { name, ageInMonths, isUnborn, gestationWeeks, photoUrl } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Nombre es requerido'
      });
    }

    // Validar que si es un bebé no nacido, tenga semanas de gestación
    if (isUnborn && (!gestationWeeks || gestationWeeks < 1 || gestationWeeks > 42)) {
      return res.status(400).json({
        success: false,
        message: 'Para bebés no nacidos, las semanas de gestación deben estar entre 1 y 42'
      });
    }

    // Validar que si es un bebé nacido, tenga edad en meses
    if (!isUnborn && (ageInMonths === undefined || ageInMonths < 0)) {
      return res.status(400).json({
        success: false,
        message: 'Para bebés nacidos, la edad en meses es requerida y debe ser mayor o igual a 0'
      });
    }

    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Base de datos no disponible'
      });
    }

    const now = new Date();
    const childData = {
      parentId: uid,
      name: name.trim(),
      ageInMonths: isUnborn ? null : parseInt(ageInMonths),
      gestationWeeks: isUnborn ? parseInt(gestationWeeks) : null,
      isUnborn: isUnborn || false,
      photoUrl: photoUrl || null,
      createdAt: now, // Fecha de registro
      registeredAt: now, // Fecha cuando se registró la edad/semanas
      updatedAt: now
    };

    const childRef = await db.collection('children').add(childData);
    
    // Calcular el número real de hijos después de agregar
    const childrenSnapshot = await db.collection('children')
      .where('parentId', '==', uid)
      .get();
    
    const actualChildrenCount = childrenSnapshot.size;
    console.log('📊 [CHILDREN] Número real de hijos después de agregar:', actualChildrenCount);
    
    // Actualizar contador de hijos en el perfil con el valor real
    const userRef = db.collection('users').doc(uid);
    await userRef.update({
      childrenCount: actualChildrenCount,
      updatedAt: new Date()
    });

    res.json({
      success: true,
      message: 'Hijo agregado exitosamente',
      data: {
        id: childRef.id,
        ...childData
      }
    });

  } catch (error) {
    console.error('Error al agregar hijo:', error);
    res.status(500).json({
      success: false,
      message: 'Error al agregar hijo',
      error: error.message
    });
  }
});

// Endpoint para actualizar un hijo
app.put('/api/auth/children/:childId', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { childId } = req.params;
    const { name, ageInMonths, isUnborn, gestationWeeks, photoUrl } = req.body;

    if (!name && ageInMonths === undefined && isUnborn === undefined && gestationWeeks === undefined && !photoUrl) {
      return res.status(400).json({
        success: false,
        message: 'Al menos un campo debe ser proporcionado'
      });
    }

    // Validar que si se cambia a bebé no nacido, tenga semanas de gestación
    if (isUnborn && (!gestationWeeks || gestationWeeks < 1 || gestationWeeks > 42)) {
      return res.status(400).json({
        success: false,
        message: 'Para bebés no nacidos, las semanas de gestación deben estar entre 1 y 42'
      });
    }

    // Validar que si se cambia a bebé nacido, tenga edad en meses
    if (isUnborn === false && (ageInMonths === undefined || ageInMonths < 0)) {
      return res.status(400).json({
        success: false,
        message: 'Para bebés nacidos, la edad en meses es requerida y debe ser mayor o igual a 0'
      });
    }

    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Base de datos no disponible'
      });
    }

    // Verificar que el hijo pertenece al usuario
    const childDoc = await db.collection('children').doc(childId).get();
    if (!childDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Hijo no encontrado'
      });
    }

    if (childDoc.data().parentId !== uid) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para modificar este hijo'
      });
    }

    const updateData = {
      updatedAt: new Date()
    };
    if (name) updateData.name = name.trim();
    if (ageInMonths !== undefined) updateData.ageInMonths = parseInt(ageInMonths);
    if (isUnborn !== undefined) updateData.isUnborn = isUnborn;
    if (gestationWeeks !== undefined) updateData.gestationWeeks = parseInt(gestationWeeks);
    if (photoUrl !== undefined) updateData.photoUrl = photoUrl;
    
    // Si se cambia el estado de gestación, limpiar campos no aplicables
    // Validar URL de foto si se proporciona
    if (photoUrl && !isValidUrl(photoUrl)) {
      return res.status(400).json({
        success: false,
        message: 'URL de foto inválida'
      });
    }

    if (isUnborn === true) {
      updateData.ageInMonths = null;
    } else if (isUnborn === false) {
      updateData.gestationWeeks = null;
    }

    await db.collection('children').doc(childId).update(updateData);

    res.json({
      success: true,
      message: 'Hijo actualizado exitosamente',
      data: {
        id: childId,
        ...updateData
      }
    });

  } catch (error) {
    console.error('Error al actualizar hijo:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar hijo',
      error: error.message
    });
  }
});

// Endpoint para subir foto de hijo usando Firebase Storage
app.post('/api/auth/children/upload-photo', authenticateToken, upload.single('photo'), async (req, res) => {
  try {
    const { uid } = req.user;
    const { childId } = req.body;

    if (!childId) {
      return res.status(400).json({
        success: false,
        message: 'ID del hijo es requerido'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No se proporcionó ningún archivo'
      });
    }

    // Verificar que Firebase Admin esté inicializado
    if (!admin) {
      console.error('❌ [STORAGE] Firebase Admin no está inicializado');
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor: Firebase no configurado'
      });
    }

    // Verificar que Firebase Storage esté disponible
    try {
      const bucket = admin.storage().bucket();
      console.log('✅ [STORAGE] Firebase Storage disponible');
      console.log('📦 [STORAGE] Bucket:', bucket.name);
    } catch (storageError) {
      console.error('❌ [STORAGE] Error accediendo a Firebase Storage:', storageError);
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor: Storage no disponible',
        error: storageError.message
      });
    }

    // Verificar que el hijo pertenece al usuario
    const childDoc = await db.collection('children').doc(childId).get();
    if (!childDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Hijo no encontrado'
      });
    }

    const childData = childDoc.data();
    if (childData.parentId !== uid) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para modificar este hijo'
      });
    }

    // Subir archivo a Firebase Storage usando buffer de memoria
    console.log('🔍 [STORAGE] Verificando admin:', admin ? '✅ Inicializado' : '❌ Null');
    console.log('🔍 [STORAGE] Verificando admin.storage:', admin.storage ? '✅ Disponible' : '❌ No disponible');
    console.log('🔍 [STORAGE] Project ID:', process.env.FIREBASE_PROJECT_ID);
    
    const bucket = admin.storage().bucket();
    console.log('📦 [STORAGE] Bucket obtenido:', bucket.name);
    
    const fileName = `children/${childId}/photo-${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(req.file.originalname)}`;
    
    console.log('📤 [STORAGE] Subiendo archivo a Firebase Storage:', fileName);

    // Usar el buffer de memoria directamente
    const file = bucket.file(fileName);
    await file.save(req.file.buffer, {
      metadata: {
        contentType: req.file.mimetype,
        metadata: {
          uploadedBy: uid,
          childId: childId,
          originalName: req.file.originalname
        }
      }
    });

    // Hacer el archivo público
    await file.makePublic();

    // Obtener URL pública
    const photoUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
    
    console.log('✅ [STORAGE] Archivo subido exitosamente:', photoUrl);

    // Actualizar el hijo con la nueva foto
    await db.collection('children').doc(childId).update({
      photoUrl: photoUrl,
      updatedAt: new Date()
    });

    res.json({
      success: true,
      message: 'Foto subida exitosamente',
      data: {
        photoUrl: photoUrl,
        fileName: fileName
      }
    });

  } catch (error) {
    console.error('Error subiendo foto a Firebase Storage:', error);
    
    res.status(500).json({
      success: false,
      message: 'Error subiendo foto',
      error: error.message
    });
  }
});



// Endpoint para sincronizar childrenCount
app.post('/api/auth/children/sync-count', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;

    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Base de datos no disponible'
      });
    }

    // Contar hijos reales en la base de datos
    const childrenSnapshot = await db.collection('children')
      .where('parentId', '==', uid)
      .get();
    
    const actualChildrenCount = childrenSnapshot.size;
    console.log('📊 [SYNC] Sincronizando childrenCount:', actualChildrenCount);

    // Actualizar el perfil con el número real
    await db.collection('users').doc(uid).update({
      childrenCount: actualChildrenCount,
      updatedAt: new Date()
    });

    res.json({
      success: true,
      message: 'ChildrenCount sincronizado correctamente',
      data: {
        childrenCount: actualChildrenCount
      }
    });

  } catch (error) {
    console.error('Error sincronizando childrenCount:', error);
    res.status(500).json({
      success: false,
      message: 'Error sincronizando childrenCount',
      error: error.message
    });
  }
});

// Endpoint para calcular edad en meses desde fecha de nacimiento
app.post('/api/auth/children/calculate-age', authenticateToken, async (req, res) => {
  try {
    const { birthDate } = req.body;

    if (!birthDate) {
      return res.status(400).json({
        success: false,
        message: 'Fecha de nacimiento es requerida'
      });
    }

    const birth = new Date(birthDate);
    const today = new Date();
    
    // Calcular diferencia en meses
    const monthsDiff = (today.getFullYear() - birth.getFullYear()) * 12 + 
                      (today.getMonth() - birth.getMonth());
    
    // Ajustar por días
    const daysDiff = today.getDate() - birth.getDate();
    const adjustedMonths = daysDiff < 0 ? monthsDiff - 1 : monthsDiff;

    res.json({
      success: true,
      data: {
        ageInMonths: Math.max(0, adjustedMonths),
        ageInDays: Math.max(0, Math.floor((today - birth) / (1000 * 60 * 60 * 24)))
      }
    });

  } catch (error) {
    console.error('Error calculando edad:', error);
    res.status(500).json({
      success: false,
      message: 'Error calculando edad',
      error: error.message
    });
  }
});

// Endpoint para eliminar foto de hijo de Firebase Storage
app.delete('/api/auth/children/:childId/photo', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { childId } = req.params;

    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Base de datos no disponible'
      });
    }

    // Verificar que el hijo pertenece al usuario
    const childDoc = await db.collection('children').doc(childId).get();
    if (!childDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Hijo no encontrado'
      });
    }

    const childData = childDoc.data();
    if (childData.parentId !== uid) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para modificar este hijo'
      });
    }

    // Si hay una foto existente, eliminarla de Firebase Storage
    if (childData.photoUrl) {
      try {
        const bucket = admin.storage().bucket();
        
        // Extraer el nombre del archivo de la URL
        const urlParts = childData.photoUrl.split('/');
        const fileName = urlParts.slice(-2).join('/'); // children/childId/filename
        
        console.log('🗑️ [STORAGE] Eliminando archivo de Firebase Storage:', fileName);
        
        await bucket.file(fileName).delete();
        console.log('✅ [STORAGE] Archivo eliminado exitosamente');
      } catch (storageError) {
        console.error('⚠️ [STORAGE] Error eliminando archivo de Storage (continuando):', storageError);
        // Continuar aunque falle la eliminación del archivo
      }
    }

    // Actualizar el hijo eliminando la foto
    await db.collection('children').doc(childId).update({
      photoUrl: null,
      updatedAt: new Date()
    });

    res.json({
      success: true,
      message: 'Foto eliminada exitosamente'
    });

  } catch (error) {
    console.error('Error eliminando foto:', error);
    res.status(500).json({
      success: false,
      message: 'Error eliminando foto',
      error: error.message
    });
  }
});

// Endpoint para eliminar un hijo
app.delete('/api/auth/children/:childId', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { childId } = req.params;

    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Base de datos no disponible'
      });
    }

    // Verificar que el hijo pertenece al usuario
    const childDoc = await db.collection('children').doc(childId).get();
    if (!childDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Hijo no encontrado'
      });
    }

    if (childDoc.data().parentId !== uid) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para eliminar este hijo'
      });
    }

    await db.collection('children').doc(childId).delete();

    // Calcular el número real de hijos después de eliminar
    const childrenSnapshot = await db.collection('children')
      .where('parentId', '==', uid)
      .get();
    
    const actualChildrenCount = childrenSnapshot.size;
    console.log('📊 [CHILDREN] Número real de hijos después de eliminar:', actualChildrenCount);
    
    // Actualizar contador de hijos en el perfil con el valor real
    const userRef = db.collection('users').doc(uid);
    await userRef.update({
      childrenCount: actualChildrenCount,
      updatedAt: new Date()
    });

    res.json({
      success: true,
      message: 'Hijo eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error al eliminar hijo:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar hijo',
      error: error.message
    });
  }
});

// Endpoint para verificar token
app.get('/api/auth/verify-token', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;

    // Obtener información del usuario
    const userRecord = await auth.getUser(uid);

    res.json({
      success: true,
      message: 'Token válido',
      data: {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName,
        emailVerified: userRecord.emailVerified
      }
    });

  } catch (error) {
    console.error('Error al verificar token:', error);
    res.status(401).json({
      success: false,
      message: 'Token inválido',
      error: error.message
    });
  }
});

// Endpoint para agregar conocimiento a la base de datos
app.post('/api/doula/knowledge', authenticateToken, async (req, res) => {
  try {
    const { text, metadata } = req.body;

    if (!text || text.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'El texto es requerido'
      });
    }

    const success = await saveKnowledge(text, metadata);
    
    if (success) {
      res.json({
        success: true,
        message: 'Conocimiento agregado correctamente'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Error al agregar conocimiento'
      });
    }

  } catch (error) {
    console.error('❌ Error agregando conocimiento:', error);
    res.status(500).json({
      success: false,
      message: 'Error al agregar conocimiento',
      error: error.message
    });
  }
});

// Endpoint para aprendizaje validado (POST /learn)
app.post('/api/doula/learn', authenticateToken, async (req, res) => {
  try {
    const { 
      text, 
      metadata, 
      validation = {
        approved: false,
        approvedBy: null,
        approvedAt: null,
        checklist: {
          sourceVerified: false,
          medicalAccuracy: false,
          toneAppropriate: false,
          contentRelevant: false
        }
      }
    } = req.body;

    if (!text || text.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'El texto es requerido'
      });
    }

    // Validar que el checklist esté completo
    const checklist = validation.checklist;
    const isFullyValidated = Object.values(checklist).every(item => item === true);

    if (!isFullyValidated) {
      return res.status(400).json({
        success: false,
        message: 'El conocimiento debe pasar todas las validaciones del checklist',
        checklist: checklist
      });
    }

    // Agregar metadatos de validación
    const validatedMetadata = {
      ...metadata,
      validation: {
        ...validation,
        approved: true,
        approvedAt: new Date(),
        approvedBy: req.user.uid
      },
      version: metadata.version || '1.0',
      createdAt: new Date(),
      isActive: true
    };

    const success = await saveKnowledge(text, validatedMetadata);
    
    if (success) {
      res.json({
        success: true,
        message: 'Conocimiento validado y agregado correctamente',
        data: {
          text: text.substring(0, 100) + '...',
          metadata: validatedMetadata
        }
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Error al agregar conocimiento validado'
      });
    }

  } catch (error) {
    console.error('❌ Error en aprendizaje validado:', error);
    res.status(500).json({
      success: false,
      message: 'Error en aprendizaje validado',
      error: error.message
    });
  }
});

// Endpoint para guardar feedback del usuario
app.post('/api/doula/feedback', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { conversationId, feedback, details } = req.body;

    if (!feedback || !['positive', 'negative'].includes(feedback)) {
      return res.status(400).json({
        success: false,
        message: 'Feedback debe ser "positive" o "negative"'
      });
    }

    const feedbackData = {
      userId: uid,
      conversationId: conversationId,
      feedback: feedback,
      details: details || {},
      timestamp: new Date(),
      processed: false
    };

    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Base de datos no disponible'
      });
    }

    await db.collection('user_feedback').add(feedbackData);
    
    console.log('💾 [FEEDBACK] Feedback guardado:', feedback);
    
    // Si es feedback positivo, considerar guardar como Q&A validado
    if (feedback === 'positive' && details && details.question && details.answer) {
      const qaData = {
        question: details.question,
        answer: details.answer,
        tags: details.tags || [],
        qualityScore: 0.9,
        createdAt: new Date(),
        isActive: true,
        usageCount: 0,
        source: 'user_feedback',
        validatedBy: uid
      };
      
      await db.collection('validated_qa').add(qaData);
      console.log('✅ [QA] Q&A validado guardado desde feedback');
    }
    
    res.json({
      success: true,
      message: 'Feedback guardado correctamente'
    });

  } catch (error) {
    console.error('❌ Error guardando feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Error al guardar feedback',
      error: error.message
    });
  }
});

// Endpoint para actualizar memoria del usuario
app.put('/api/doula/memory', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { notes, preferences } = req.body;

    const memoryData = {
      notes: notes || [],
      preferences: preferences || {}
    };

    const success = await saveUserMemory(uid, memoryData);
    
    if (success) {
      res.json({
        success: true,
        message: 'Memoria actualizada correctamente'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Error al actualizar memoria'
      });
    }

  } catch (error) {
    console.error('❌ Error actualizando memoria:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar memoria',
      error: error.message
    });
  }
});

// Endpoint para borrar memoria del usuario
app.delete('/api/doula/memory', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;
    
    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Base de datos no disponible'
      });
    }

    await db.collection('user_memory').doc(uid).delete();
    
    console.log('🗑️ [MEMORY] Memoria borrada para usuario:', uid);
    
    res.json({
      success: true,
      message: 'Memoria borrada correctamente'
    });

  } catch (error) {
    console.error('❌ Error borrando memoria:', error);
    res.status(500).json({
      success: false,
      message: 'Error al borrar memoria',
      error: error.message
    });
  }
});

// Endpoint para tests automáticos de calidad
app.post('/api/doula/quality-test', authenticateToken, async (req, res) => {
  try {
    const testQuestions = [
      {
        question: "¿Qué ejercicios puedo hacer durante el embarazo?",
        expectedCategory: "embarazo",
        expectedKeywords: ["caminar", "yoga", "natación", "seguro"]
      },
      {
        question: "¿Cómo puedo prepararme para la lactancia?",
        expectedCategory: "lactancia",
        expectedKeywords: ["contacto", "agarre", "demanda", "beneficios"]
      },
      {
        question: "¿Cuáles son los síntomas del primer trimestre?",
        expectedCategory: "embarazo",
        expectedKeywords: ["náuseas", "fatiga", "senos", "hormonas"]
      },
      {
        question: "¿Puedes ayudarme con programación en JavaScript?",
        expectedCategory: "off_topic",
        expectedResponse: "especializada en acompañamiento durante el embarazo"
      }
    ];

    const results = [];
    let totalScore = 0;

    for (const test of testQuestions) {
      try {
        // Simular llamada al chat
        const response = await generateDoulaResponse(test.question, '', '', 'TestUser');
        
        let score = 0;
        let feedback = '';

        if (test.expectedCategory === 'off_topic') {
          // Verificar que redirija correctamente
          if (response.includes(test.expectedResponse)) {
            score = 1;
            feedback = '✅ Redirección correcta para tema fuera del ámbito';
          } else {
            feedback = '❌ No redirigió correctamente tema fuera del ámbito';
          }
        } else {
          // Verificar palabras clave esperadas
          const keywordMatches = test.expectedKeywords.filter(keyword => 
            response.toLowerCase().includes(keyword.toLowerCase())
          );
          
          score = keywordMatches.length / test.expectedKeywords.length;
          feedback = `✅ Encontró ${keywordMatches.length}/${test.expectedKeywords.length} palabras clave`;
        }

        results.push({
          question: test.question,
          expectedCategory: test.expectedCategory,
          score: score,
          feedback: feedback,
          response: response.substring(0, 200) + '...'
        });

        totalScore += score;

      } catch (error) {
        results.push({
          question: test.question,
          expectedCategory: test.expectedCategory,
          score: 0,
          feedback: '❌ Error en test',
          error: error.message
        });
      }
    }

    const averageScore = totalScore / testQuestions.length;
    const qualityStatus = averageScore >= 0.8 ? 'EXCELENTE' : averageScore >= 0.6 ? 'BUENO' : 'NEEDS_IMPROVEMENT';

    res.json({
      success: true,
      data: {
        testDate: new Date(),
        totalTests: testQuestions.length,
        averageScore: averageScore,
        qualityStatus: qualityStatus,
        results: results
      }
    });

  } catch (error) {
    console.error('❌ Error en test de calidad:', error);
    res.status(500).json({
      success: false,
      message: 'Error en test de calidad',
      error: error.message
    });
  }
});

// Endpoint para obtener información de desarrollo infantil por edad
app.post('/api/children/development-info', authenticateToken, async (req, res) => {
  try {
    const { childId, name } = req.body;
    const userId = req.user.uid;

    let child = null;
    let currentAgeInMonths = null;
    let currentGestationWeeks = null;
    let isUnborn = false;

    // Si se proporciona childId, buscar el hijo en la base de datos
    if (childId) {
      const childDoc = await db.collection('children').doc(childId).get();
      if (!childDoc.exists) {
        return res.status(404).json({
          success: false,
          message: 'Hijo no encontrado'
        });
      }
      
      child = childDoc.data();
      
      // Verificar que el hijo pertenece al usuario
      if (child.parentId !== userId) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para acceder a este hijo'
        });
      }

      // Calcular edad actual basada en fecha de registro
      const childInfo = getChildCurrentInfo(child);
      currentAgeInMonths = childInfo.currentAgeInMonths;
      currentGestationWeeks = childInfo.currentGestationWeeks;
      isUnborn = child.isUnborn;
      
      console.log(`📊 [DEVELOPMENT] ${child.name}: ${isUnborn ? currentGestationWeeks + ' semanas' : currentAgeInMonths + ' meses'} (calculado desde ${childInfo.registeredAgeInMonths || childInfo.registeredGestationWeeks})`);
    } else if (name) {
      // Modo de compatibilidad: usar nombre y parámetros manuales
      const { ageInMonths, isUnborn: manualIsUnborn, gestationWeeks } = req.body;
      
      if (!name.trim()) {
        return res.status(400).json({
          success: false,
          message: 'El nombre del niño es requerido'
        });
      }

      if (manualIsUnborn && !gestationWeeks) {
        return res.status(400).json({
          success: false,
          message: 'Para niños por nacer, las semanas de gestación son requeridas'
        });
      }

      if (!manualIsUnborn && !ageInMonths && ageInMonths !== 0) {
        return res.status(400).json({
          success: false,
          message: 'Para niños nacidos, la edad en meses es requerida'
        });
      }

      currentAgeInMonths = manualIsUnborn ? null : ageInMonths;
      currentGestationWeeks = manualIsUnborn ? gestationWeeks : null;
      isUnborn = manualIsUnborn;
      
      console.log(`📊 [DEVELOPMENT] ${name}: ${isUnborn ? currentGestationWeeks + ' semanas' : currentAgeInMonths + ' meses'} (manual)`);
    } else {
      return res.status(400).json({
        success: false,
        message: 'Se requiere childId o nombre del niño'
      });
    }

    // Crear clave única para el historial
    const childKey = child ? `${child.id}_${isUnborn ? 'unborn' : 'born'}` : `${name.trim()}_${isUnborn ? 'unborn' : 'born'}`;
    const previousResponses = await getPreviousDevelopmentResponses(userId, childKey);

    // Obtener información variada desde OpenAI
    let developmentInfo = [];
    if (isUnborn) {
      developmentInfo = await getUnbornDevelopmentInfoFromAI(currentGestationWeeks, previousResponses, child ? child.name : name.trim());
    } else {
      developmentInfo = await getChildDevelopmentInfoFromAI(currentAgeInMonths, previousResponses, child ? child.name : name.trim());
    }

    // Guardar esta respuesta para futuras consultas
    await saveDevelopmentResponse(userId, childKey, {
      childName: child ? child.name : name.trim(),
      childId: child ? child.id : null,
      ageInMonths: currentAgeInMonths,
      gestationWeeks: currentGestationWeeks,
      isUnborn: isUnborn,
      developmentInfo: developmentInfo,
      timestamp: new Date()
    });

    res.json({
      success: true,
      data: {
        childName: child ? child.name : name.trim(),
        childId: child ? child.id : null,
        ageInMonths: currentAgeInMonths,
        gestationWeeks: currentGestationWeeks,
        isUnborn: isUnborn,
        developmentInfo: developmentInfo,
        timestamp: new Date(),
        responseCount: previousResponses.length + 1,
        isNewInfo: previousResponses.length === 0,
        calculatedAge: true,
        // Información detallada de edades
        registeredAge: child ? (child.isUnborn ? childInfo.registeredGestationWeeks : childInfo.registeredAgeInMonths) : null,
        currentAge: child ? (child.isUnborn ? childInfo.currentGestationWeeks : childInfo.currentAgeInMonths) : null,
        daysSinceCreation: child ? childInfo.daysSinceCreation : null,
        // Información adicional para bebés por nacer
        isOverdue: child ? childInfo.isOverdue : false,
        // Información de cálculo
        calculationInfo: child ? {
          registeredWeeks: child.isUnborn ? childInfo.registeredGestationWeeks : null,
          registeredMonths: child.isUnborn ? null : childInfo.registeredAgeInMonths,
          currentWeeks: child.isUnborn ? childInfo.currentGestationWeeks : null,
          currentMonths: child.isUnborn ? null : childInfo.currentAgeInMonths,
          daysSinceCreation: childInfo.daysSinceCreation
        } : null
      }
    });

  } catch (error) {
    console.error('❌ Error obteniendo información de desarrollo:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo información de desarrollo',
      error: error.message
    });
  }
});

// Función para calcular edad actual basada en fecha de creación
const calculateCurrentAge = (registeredAge, createdAt) => {
  const now = new Date();
  
  // Manejar Timestamp de Firestore
  let createdDate;
  if (createdAt && typeof createdAt === 'object' && createdAt._seconds) {
    // Es un Timestamp de Firestore
    createdDate = new Date(createdAt._seconds * 1000);
  } else {
    // Es una fecha normal
    createdDate = new Date(createdAt);
  }
  
  const diffTime = now - createdDate;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  // Calcular meses completos transcurridos
  const diffMonths = Math.floor(diffDays / 30.44); // Promedio de días por mes
  
  // Calcular edad actual sumando los meses transcurridos
  const currentAge = Math.max(0, registeredAge + diffMonths);
  
  console.log(`📊 [AGE CALCULATION] ${registeredAge} meses + ${diffMonths} meses = ${currentAge} meses (${diffDays} días desde creación)`);
  
  return currentAge;
};

// Función para calcular semanas de gestación actual basada en fecha de creación
const calculateCurrentGestationWeeks = (registeredWeeks, createdAt) => {
  const now = new Date();
  
  // Manejar Timestamp de Firestore
  let createdDate;
  if (createdAt && typeof createdAt === 'object' && createdAt._seconds) {
    // Es un Timestamp de Firestore
    createdDate = new Date(createdAt._seconds * 1000);
  } else {
    // Es una fecha normal
    createdDate = new Date(createdAt);
  }
  
  const diffTime = now - createdDate;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const diffWeeks = Math.floor(diffDays / 7);
  
  // Calcular semanas actuales sumando las semanas transcurridas
  const currentWeeks = registeredWeeks + diffWeeks;
  
  // Limitar a un rango realista (4-42 semanas)
  const finalWeeks = Math.max(4, Math.min(42, currentWeeks));
  
  console.log(`📊 [GESTATION CALCULATION] ${registeredWeeks} semanas + ${diffWeeks} semanas = ${finalWeeks} semanas (${diffDays} días desde creación)`);
  
  return finalWeeks;
};

// Función para obtener información actualizada de un hijo
const getChildCurrentInfo = (child) => {
  const now = new Date();
  
  // Manejar Timestamp de Firestore para daysSinceCreation
  let createdDate;
  if (child.createdAt && typeof child.createdAt === 'object' && child.createdAt._seconds) {
    // Es un Timestamp de Firestore
    createdDate = new Date(child.createdAt._seconds * 1000);
  } else {
    // Es una fecha normal
    createdDate = new Date(child.createdAt);
  }
  
  if (child.isUnborn) {
    const currentGestationWeeks = calculateCurrentGestationWeeks(child.gestationWeeks, child.createdAt);
    const daysSinceCreation = Math.floor((now - createdDate) / (1000 * 60 * 60 * 24));
    
    return {
      ...child,
      currentGestationWeeks: currentGestationWeeks,
      currentAgeInMonths: null,
      registeredGestationWeeks: child.gestationWeeks,
      daysSinceCreation: daysSinceCreation,
      isOverdue: currentGestationWeeks >= 40
    };
  } else {
    const currentAgeInMonths = calculateCurrentAge(child.ageInMonths, child.createdAt);
    const daysSinceCreation = Math.floor((now - createdDate) / (1000 * 60 * 60 * 24));
    
    return {
      ...child,
      currentAgeInMonths: currentAgeInMonths,
      currentGestationWeeks: null,
      registeredAgeInMonths: child.ageInMonths,
      daysSinceCreation: daysSinceCreation
    };
  }
};

// Función para obtener respuestas previas de desarrollo
const getPreviousDevelopmentResponses = async (userId, childKey) => {
  try {
    const response = await db.collection('development_responses')
      .doc(userId)
      .collection('children')
      .doc(childKey)
      .collection('responses')
      .orderBy('timestamp', 'desc')
      .limit(10)
      .get();

    return response.docs.map(doc => doc.data());
  } catch (error) {
    console.error('Error obteniendo respuestas previas:', error);
    return [];
  }
};

// Función para guardar respuesta de desarrollo
const saveDevelopmentResponse = async (userId, childKey, responseData) => {
  try {
    await db.collection('development_responses')
      .doc(userId)
      .collection('children')
      .doc(childKey)
      .collection('responses')
      .add({
        ...responseData,
        savedAt: new Date()
      });
  } catch (error) {
    console.error('Error guardando respuesta:', error);
  }
};

// Función para validar que las respuestas no se repitan
const validateResponseUniqueness = (newBullets, previousResponses, maxAttempts = 3) => {
  if (previousResponses.length === 0) {
    return { isValid: true, bullets: newBullets };
  }

  // Extraer todos los bullets previos
  const allPreviousBullets = previousResponses.flatMap(resp => resp.developmentInfo);
  
  // Función para calcular similitud entre dos bullets
  const calculateSimilarity = (bullet1, bullet2) => {
    const words1 = bullet1.toLowerCase().split(/\s+/);
    const words2 = bullet2.toLowerCase().split(/\s+/);
    const commonWords = words1.filter(word => words2.includes(word));
    return commonWords.length / Math.max(words1.length, words2.length);
  };

  // Verificar si hay repeticiones significativas
  let hasRepetition = false;
  for (const newBullet of newBullets) {
    for (const prevBullet of allPreviousBullets) {
      const similarity = calculateSimilarity(newBullet, prevBullet);
      if (similarity > 0.6) { // Si más del 60% de las palabras son iguales
        hasRepetition = true;
        console.log(`⚠️ Detected repetition: "${newBullet.substring(0, 50)}..." similar to "${prevBullet.substring(0, 50)}..." (${(similarity * 100).toFixed(1)}%)`);
        break;
      }
    }
    if (hasRepetition) break;
  }

  return { isValid: !hasRepetition, bullets: newBullets };
};

// Función para obtener información de desarrollo de bebés por nacer desde OpenAI
const getUnbornDevelopmentInfoFromAI = async (gestationWeeks, previousResponses, childName) => {
  try {
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      attempts++;
      console.log(`🤖 [OPENAI] Intento ${attempts}/${maxAttempts} para ${childName} (${gestationWeeks} semanas)`);

      // Crear contexto de respuestas previas
      const previousContext = previousResponses.length > 0 
        ? `\n\nInformación ya proporcionada anteriormente:\n${previousResponses.slice(0, 3).map((resp, index) => 
            `${index + 1}. ${resp.developmentInfo.join('\n   ')}`
          ).join('\n')}`
        : '';

      const systemPrompt = `Eres una doula experta especializada en desarrollo fetal. Tu tarea es proporcionar información relevante y variada sobre el desarrollo del bebé durante el embarazo.

IMPORTANTE:
- Proporciona EXACTAMENTE 3 bullets de información
- Cada bullet debe ser COMPLETAMENTE DIFERENTE a la información previa
- Evita repetir conceptos, temas o información ya proporcionada
- Usa emojis relevantes al inicio de cada bullet
- Mantén un tono cálido y profesional
- Incluye el nombre del bebé cuando sea apropiado
- Si es la consulta #${previousResponses.length + 1}, enfócate en aspectos NO mencionados anteriormente

FORMATO REQUERIDO:
1. 🫀 **Título del primer aspecto**: Descripción detallada...
2. 🧬 **Título del segundo aspecto**: Descripción detallada...
3. ⚠️ **Título del tercer aspecto**: Descripción detallada...

CONTEXTO ACTUAL:
- Bebé: ${childName}
- Semanas de gestación: ${gestationWeeks}
- Consulta #${previousResponses.length + 1}${previousContext}

${previousResponses.length > 0 ? 'IMPORTANTE: NO repitas ningún concepto, tema o información de las consultas anteriores. Busca aspectos completamente nuevos.' : 'Si es la primera consulta, proporciona información fundamental.'}`;

      const userPrompt = `Proporciona 3 bullets de información ÚNICA sobre el desarrollo fetal de ${childName} a las ${gestationWeeks} semanas de gestación.`;

      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 500,
        temperature: 0.8 + (attempts * 0.1), // Aumentar temperatura en cada intento
        presence_penalty: 0.8 + (attempts * 0.1), // Aumentar penalty en cada intento
        frequency_penalty: 0.9 + (attempts * 0.05)
      });

      const content = response.choices[0].message.content;
      
      // Extraer los 3 bullets del contenido
      const bullets = content.split('\n')
        .filter(line => line.trim().match(/^\d+\.\s*[🫀🧬⚠️👶👂📏🎵🫁👁️💪🧠💤🍎🎯📦⏰🤱🏥👶]/))
        .map(line => line.replace(/^\d+\.\s*/, '').trim())
        .slice(0, 3);

      // Si no se pudieron extraer bullets, usar fallback
      if (bullets.length < 3) {
        console.log('⚠️ No se pudieron extraer bullets de OpenAI, usando fallback');
        return getUnbornDevelopmentInfoFallback(gestationWeeks);
      }

      // Validar que no haya repeticiones
      const validation = validateResponseUniqueness(bullets, previousResponses);
      
      if (validation.isValid) {
        console.log(`✅ [OPENAI] Respuesta válida obtenida en intento ${attempts}`);
        return validation.bullets;
      } else {
        console.log(`⚠️ [OPENAI] Respuesta con repeticiones detectada, reintentando...`);
        if (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 1000)); // Esperar antes del siguiente intento
        }
      }
    }

    // Si se agotaron los intentos, usar fallback
    console.log(`⚠️ [OPENAI] Se agotaron los intentos, usando fallback`);
    return getUnbornDevelopmentInfoFallback(gestationWeeks);

  } catch (error) {
    console.error('❌ Error obteniendo información de OpenAI:', error);
    // Fallback a información predefinida
    return getUnbornDevelopmentInfoFallback(gestationWeeks);
  }
};

// Función para obtener información de desarrollo de niños nacidos desde OpenAI
const getChildDevelopmentInfoFromAI = async (ageInMonths, previousResponses, childName) => {
  try {
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      attempts++;
      console.log(`🤖 [OPENAI] Intento ${attempts}/${maxAttempts} para ${childName} (${ageInMonths} meses)`);

      // Crear contexto de respuestas previas
      const previousContext = previousResponses.length > 0 
        ? `\n\nInformación ya proporcionada anteriormente:\n${previousResponses.slice(0, 3).map((resp, index) => 
            `${index + 1}. ${resp.developmentInfo.join('\n   ')}`
          ).join('\n')}`
        : '';

      const systemPrompt = `Eres una doula experta especializada en desarrollo infantil. Tu tarea es proporcionar información relevante y variada sobre el desarrollo del niño.

IMPORTANTE:
- Proporciona EXACTAMENTE 3 bullets de información
- Cada bullet debe ser COMPLETAMENTE DIFERENTE a la información previa
- Evita repetir conceptos, temas o información ya proporcionada
- Usa emojis relevantes al inicio de cada bullet
- Mantén un tono cálido y profesional
- Incluye el nombre del niño cuando sea apropiado
- Si es la consulta #${previousResponses.length + 1}, enfócate en aspectos NO mencionados anteriormente

FORMATO REQUERIDO:
1. 👀 **Título del primer aspecto**: Descripción detallada...
2. 😊 **Título del segundo aspecto**: Descripción detallada...
3. 💪 **Título del tercer aspecto**: Descripción detallada...

CONTEXTO ACTUAL:
- Niño: ${childName}
- Edad: ${ageInMonths} meses
- Consulta #${previousResponses.length + 1}${previousContext}

${previousResponses.length > 0 ? 'IMPORTANTE: NO repitas ningún concepto, tema o información de las consultas anteriores. Busca aspectos completamente nuevos.' : 'Si es la primera consulta, proporciona información fundamental.'}`;

      const userPrompt = `Proporciona 3 bullets de información ÚNICA sobre el desarrollo de ${childName} a los ${ageInMonths} meses de edad.`;

      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 500,
        temperature: 0.8 + (attempts * 0.1), // Aumentar temperatura en cada intento
        presence_penalty: 0.8 + (attempts * 0.1), // Aumentar penalty en cada intento
        frequency_penalty: 0.9 + (attempts * 0.05)
      });

      const content = response.choices[0].message.content;
      
      // Extraer los 3 bullets del contenido
      const bullets = content.split('\n')
        .filter(line => line.trim().match(/^\d+\.\s*[👀😊💪🤱🦷🔄🎤👐🪑🤏🗣️🚶👋🍽️🏃🎯🎵🧩🎭📚🎨🤝🧮🏃‍♂️📖🔢🎯🎓🏃‍♂️🧠📚🎨👥]/))
        .map(line => line.replace(/^\d+\.\s*/, '').trim())
        .slice(0, 3);

      // Si no se pudieron extraer bullets, usar fallback
      if (bullets.length < 3) {
        console.log('⚠️ No se pudieron extraer bullets de OpenAI, usando fallback');
        return getChildDevelopmentInfoFallback(ageInMonths);
      }

      // Validar que no haya repeticiones
      const validation = validateResponseUniqueness(bullets, previousResponses);
      
      if (validation.isValid) {
        console.log(`✅ [OPENAI] Respuesta válida obtenida en intento ${attempts}`);
        return validation.bullets;
      } else {
        console.log(`⚠️ [OPENAI] Respuesta con repeticiones detectada, reintentando...`);
        if (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 1000)); // Esperar antes del siguiente intento
        }
      }
    }

    // Si se agotaron los intentos, usar fallback
    console.log(`⚠️ [OPENAI] Se agotaron los intentos, usando fallback`);
    return getChildDevelopmentInfoFallback(ageInMonths);

  } catch (error) {
    console.error('❌ Error obteniendo información de OpenAI:', error);
    // Fallback a información predefinida
    return getChildDevelopmentInfoFallback(ageInMonths);
  }
};

// Función de fallback para información de bebés por nacer
const getUnbornDevelopmentInfoFallback = (gestationWeeks) => {
  if (gestationWeeks <= 12) {
    return [
      "🫀 **Desarrollo del corazón**: El corazón de tu bebé ya late y se están formando los principales órganos. Es un período crítico de desarrollo.",
      "🧬 **Formación de órganos**: Se están desarrollando el cerebro, hígado, riñones y otros órganos vitales. La nutrición materna es fundamental.",
      "⚠️ **Cuidados especiales**: Evita alcohol, tabaco y medicamentos sin prescripción médica. Descansa lo suficiente y mantén una dieta equilibrada."
    ];
  } else if (gestationWeeks <= 24) {
    return [
      "👶 **Movimientos fetales**: Tu bebé ya se mueve y puedes sentir sus pataditas. Los movimientos son una señal de bienestar.",
      "👂 **Desarrollo sensorial**: Ya puede oír sonidos y responde a tu voz. Hablarle y cantarle fortalece el vínculo.",
      "📏 **Crecimiento acelerado**: Tu bebé crece rápidamente. Mantén una buena nutrición y control prenatal regular."
    ];
  } else if (gestationWeeks <= 36) {
    return [
      "🫁 **Maduración pulmonar**: Los pulmones se están preparando para respirar. El bebé practica movimientos respiratorios.",
      "👁️ **Desarrollo visual**: Los ojos se abren y puede distinguir entre luz y oscuridad. Responde a estímulos luminosos.",
      "💪 **Posición de parto**: El bebé se está posicionando para el nacimiento. Los movimientos pueden ser más limitados."
    ];
  } else {
    return [
      "🎯 **Listo para nacer**: Tu bebé está completamente desarrollado y listo para el nacimiento en cualquier momento.",
      "📦 **Posición final**: Probablemente esté en posición cefálica (cabeza abajo) preparándose para el parto.",
      "⏰ **Signos de parto**: Presta atención a contracciones regulares, rotura de aguas o pérdida del tapón mucoso."
    ];
  }
};

// Función de fallback para información de niños nacidos
const getChildDevelopmentInfoFallback = (ageInMonths) => {
  if (ageInMonths <= 3) {
    return [
      "👀 **Desarrollo visual**: Tu bebé puede seguir objetos con la mirada y reconoce tu rostro. El contacto visual es fundamental.",
      "😊 **Primeras sonrisas**: Aparecen las sonrisas sociales y el bebé responde a tu voz y caricias.",
      "💪 **Control de cabeza**: Comienza a sostener la cabeza cuando está boca abajo. El tiempo boca abajo es importante."
    ];
  } else if (ageInMonths <= 6) {
    return [
      "🤱 **Alimentación complementaria**: Está listo para comenzar con papillas. Introduce alimentos uno por uno.",
      "🦷 **Primeros dientes**: Pueden aparecer los primeros dientes. Ofrece mordedores fríos para aliviar las molestias.",
      "🔄 **Volteo**: Aprende a darse la vuelta de boca arriba a boca abajo y viceversa. Supervisa siempre."
    ];
  } else if (ageInMonths <= 9) {
    return [
      "🪑 **Sentarse solo**: Ya puede sentarse sin apoyo y mantenerse estable. El equilibrio mejora día a día.",
      "🤏 **Pinza fina**: Desarrolla la capacidad de agarrar objetos pequeños entre el pulgar y el índice.",
      "🗣️ **Balbuceo**: Produce sonidos como 'mamá', 'papá'. Responde a su nombre y entiende palabras simples."
    ];
  } else if (ageInMonths <= 12) {
    return [
      "🚶 **Primeros pasos**: Puede dar sus primeros pasos sosteniéndose de muebles o de tu mano. Cada bebé tiene su ritmo.",
      "👋 **Gestos comunicativos**: Hace gestos como saludar, señalar y aplaudir. La comunicación no verbal se desarrolla.",
      "🍽️ **Alimentación independiente**: Quiere comer solo y explorar texturas. Ofrece alimentos seguros y variados."
    ];
  } else if (ageInMonths <= 18) {
    return [
      "🏃 **Caminar estable**: Ya camina con seguridad y puede subir escaleras gateando. Supervisa en todo momento.",
      "🗣️ **Primeras palabras**: Dice entre 5-20 palabras y entiende muchas más. Lee cuentos y habla constantemente.",
      "🎯 **Juego simbólico**: Comienza a imitar acciones como hablar por teléfono o dar de comer a muñecos."
    ];
  } else if (ageInMonths <= 24) {
    return [
      "💬 **Explosión del lenguaje**: Aprende nuevas palabras cada día y forma frases de 2-3 palabras.",
      "🎨 **Creatividad**: Disfruta pintar, dibujar y crear. Ofrece materiales seguros para expresarse.",
      "👥 **Socialización**: Muestra interés por otros niños aunque aún juega en paralelo. Las citas de juego son beneficiosas."
    ];
  } else if (ageInMonths <= 36) {
    return [
      "🧩 **Pensamiento lógico**: Resuelve rompecabezas simples y entiende conceptos como grande/pequeño, arriba/abajo.",
      "🎭 **Juego de roles**: Imita roles como ser mamá, papá, doctor. El juego imaginativo se desarrolla.",
      "🎵 **Habilidades musicales**: Disfruta cantar, bailar y hacer música. La música estimula el desarrollo cerebral."
    ];
  } else if (ageInMonths <= 48) {
    return [
      "📚 **Preparación escolar**: Desarrolla habilidades pre-lectura como reconocer letras y contar.",
      "🎨 **Expresión artística**: Crea dibujos más detallados y puede representar personas y objetos.",
      "🤝 **Cooperación**: Aprende a compartir, esperar turnos y seguir reglas simples en grupo."
    ];
  } else if (ageInMonths <= 60) {
    return [
      "📖 **Lectura emergente**: Reconoce algunas palabras escritas y puede 'leer' cuentos conocidos.",
      "🔢 **Conceptos matemáticos**: Cuenta hasta 10, reconoce números y entiende conceptos básicos de cantidad.",
      "🎯 **Independencia**: Se viste solo, usa el baño independientemente y ayuda en tareas simples."
    ];
  } else {
    return [
      "🎓 **Desarrollo escolar**: Está listo para el aprendizaje formal. Las habilidades sociales y académicas se desarrollan.",
      "🏃‍♂️ **Actividad física**: Disfruta deportes y actividades físicas. El ejercicio regular es importante.",
      "🧠 **Pensamiento abstracto**: Comienza a entender conceptos más complejos y puede resolver problemas simples."
    ];
  }
};

// Función para obtener información de desarrollo de bebés por nacer
const getUnbornDevelopmentInfo = (gestationWeeks) => {
  if (gestationWeeks <= 12) {
    return [
      "🫀 **Desarrollo del corazón**: El corazón de tu bebé ya late y se están formando los principales órganos. Es un período crítico de desarrollo.",
      "🧬 **Formación de órganos**: Se están desarrollando el cerebro, hígado, riñones y otros órganos vitales. La nutrición materna es fundamental.",
      "⚠️ **Cuidados especiales**: Evita alcohol, tabaco y medicamentos sin prescripción médica. Descansa lo suficiente y mantén una dieta equilibrada."
    ];
  } else if (gestationWeeks <= 24) {
    return [
      "👶 **Movimientos fetales**: Tu bebé ya se mueve y puedes sentir sus pataditas. Los movimientos son una señal de bienestar.",
      "👂 **Desarrollo sensorial**: Ya puede oír sonidos y responde a tu voz. Hablarle y cantarle fortalece el vínculo.",
      "📏 **Crecimiento acelerado**: Tu bebé crece rápidamente. Mantén una buena nutrición y control prenatal regular."
    ];
  } else if (gestationWeeks <= 36) {
    return [
      "🫁 **Maduración pulmonar**: Los pulmones se están preparando para respirar. El bebé practica movimientos respiratorios.",
      "👁️ **Desarrollo visual**: Los ojos se abren y puede distinguir entre luz y oscuridad. Responde a estímulos luminosos.",
      "💪 **Posición de parto**: El bebé se está posicionando para el nacimiento. Los movimientos pueden ser más limitados."
    ];
  } else {
    return [
      "🎯 **Listo para nacer**: Tu bebé está completamente desarrollado y listo para el nacimiento en cualquier momento.",
      "📦 **Posición final**: Probablemente esté en posición cefálica (cabeza abajo) preparándose para el parto.",
      "⏰ **Signos de parto**: Presta atención a contracciones regulares, rotura de aguas o pérdida del tapón mucoso."
    ];
  }
};



// Función para obtener información de desarrollo de niños nacidos
const getChildDevelopmentInfo = (ageInMonths) => {
  if (ageInMonths <= 3) {
    return [
      "👀 **Desarrollo visual**: Tu bebé puede seguir objetos con la mirada y reconoce tu rostro. El contacto visual es fundamental.",
      "😊 **Primeras sonrisas**: Aparecen las sonrisas sociales y el bebé responde a tu voz y caricias.",
      "💪 **Control de cabeza**: Comienza a sostener la cabeza cuando está boca abajo. El tiempo boca abajo es importante."
    ];
  } else if (ageInMonths <= 6) {
    return [
      "🤱 **Alimentación complementaria**: Está listo para comenzar con papillas. Introduce alimentos uno por uno.",
      "🦷 **Primeros dientes**: Pueden aparecer los primeros dientes. Ofrece mordedores fríos para aliviar las molestias.",
      "🔄 **Volteo**: Aprende a darse la vuelta de boca arriba a boca abajo y viceversa. Supervisa siempre."
    ];
  } else if (ageInMonths <= 9) {
    return [
      "🪑 **Sentarse solo**: Ya puede sentarse sin apoyo y mantenerse estable. El equilibrio mejora día a día.",
      "🤏 **Pinza fina**: Desarrolla la capacidad de agarrar objetos pequeños entre el pulgar y el índice.",
      "🗣️ **Balbuceo**: Produce sonidos como 'mamá', 'papá'. Responde a su nombre y entiende palabras simples."
    ];
  } else if (ageInMonths <= 12) {
    return [
      "🚶 **Primeros pasos**: Puede dar sus primeros pasos sosteniéndose de muebles o de tu mano. Cada bebé tiene su ritmo.",
      "👋 **Gestos comunicativos**: Hace gestos como saludar, señalar y aplaudir. La comunicación no verbal se desarrolla.",
      "🍽️ **Alimentación independiente**: Quiere comer solo y explorar texturas. Ofrece alimentos seguros y variados."
    ];
  } else if (ageInMonths <= 18) {
    return [
      "🏃 **Caminar estable**: Ya camina con seguridad y puede subir escaleras gateando. Supervisa en todo momento.",
      "🗣️ **Primeras palabras**: Dice entre 5-20 palabras y entiende muchas más. Lee cuentos y habla constantemente.",
      "🎯 **Juego simbólico**: Comienza a imitar acciones como hablar por teléfono o dar de comer a muñecos."
    ];
  } else if (ageInMonths <= 24) {
    return [
      "💬 **Explosión del lenguaje**: Aprende nuevas palabras cada día y forma frases de 2-3 palabras.",
      "🎨 **Creatividad**: Disfruta pintar, dibujar y crear. Ofrece materiales seguros para expresarse.",
      "👥 **Socialización**: Muestra interés por otros niños aunque aún juega en paralelo. Las citas de juego son beneficiosas."
    ];
  } else if (ageInMonths <= 36) {
    return [
      "🧩 **Pensamiento lógico**: Resuelve rompecabezas simples y entiende conceptos como grande/pequeño, arriba/abajo.",
      "🎭 **Juego de roles**: Imita roles como ser mamá, papá, doctor. El juego imaginativo se desarrolla.",
      "🎵 **Habilidades musicales**: Disfruta cantar, bailar y hacer música. La música estimula el desarrollo cerebral."
    ];
  } else if (ageInMonths <= 48) {
    return [
      "📚 **Preparación escolar**: Desarrolla habilidades pre-lectura como reconocer letras y contar.",
      "🎨 **Expresión artística**: Crea dibujos más detallados y puede representar personas y objetos.",
      "🤝 **Cooperación**: Aprende a compartir, esperar turnos y seguir reglas simples en grupo."
    ];
  } else if (ageInMonths <= 60) {
    return [
      "📖 **Lectura emergente**: Reconoce algunas palabras escritas y puede 'leer' cuentos conocidos.",
      "🔢 **Conceptos matemáticos**: Cuenta hasta 10, reconoce números y entiende conceptos básicos de cantidad.",
      "🎯 **Independencia**: Se viste solo, usa el baño independientemente y ayuda en tareas simples."
    ];
  } else {
    return [
      "🎓 **Desarrollo escolar**: Está listo para el aprendizaje formal. Las habilidades sociales y académicas se desarrollan.",
      "🏃‍♂️ **Actividad física**: Disfruta deportes y actividades físicas. El ejercicio regular es importante.",
      "🧠 **Pensamiento abstracto**: Comienza a entender conceptos más complejos y puede resolver problemas simples."
    ];
  }
};

// Endpoint para obtener información actualizada de hijos
app.get('/api/auth/children/current-info', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;

    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Base de datos no disponible'
      });
    }

    // Obtener todos los hijos del usuario
    const childrenSnapshot = await db.collection('children')
      .where('parentId', '==', uid)
      .get();

    const children = [];
    childrenSnapshot.forEach(doc => {
      const childData = doc.data();
      const currentInfo = getChildCurrentInfo(childData);
      
              children.push({
          id: doc.id,
          ...currentInfo,
          // Información adicional calculada
          createdDate: childData.createdAt,
          daysSinceCreation: currentInfo.daysSinceCreation,
          isOverdue: currentInfo.isOverdue || false
        });
    });

    res.json({
      success: true,
      data: {
        children: children,
        totalChildren: children.length,
        timestamp: new Date()
      }
    });

  } catch (error) {
    console.error('❌ Error obteniendo información actualizada de hijos:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo información de hijos',
      error: error.message
    });
  }
});

// Endpoint para limpiar historial de respuestas de desarrollo
app.delete('/api/children/development-history', authenticateToken, async (req, res) => {
  try {
    const { childName, ageInMonths, isUnborn = false } = req.body;
    const userId = req.user.uid;

    if (!childName || !childName.trim()) {
      return res.status(400).json({
        success: false,
        message: 'El nombre del niño es requerido'
      });
    }

    const childKey = `${childName.trim()}_${isUnborn ? 'unborn' : ageInMonths}months`;

    // Obtener todas las respuestas para este niño
    const responsesRef = db.collection('development_responses')
      .doc(userId)
      .collection('children')
      .doc(childKey)
      .collection('responses');

    const responses = await responsesRef.get();

    // Eliminar todas las respuestas
    const batch = db.batch();
    responses.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();

    res.json({
      success: true,
      message: 'Historial de respuestas eliminado',
      data: {
        childName: childName.trim(),
        deletedCount: responses.docs.length
      }
    });

  } catch (error) {
    console.error('❌ Error eliminando historial:', error);
    res.status(500).json({
      success: false,
      message: 'Error eliminando historial',
      error: error.message
    });
  }
});
// Endpoint para obtener tips personalizados de los hijos
app.post('/api/children/tips', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { tipType = 'general' } = req.body; // general, alimentacion, desarrollo, salud, etc.

    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Base de datos no disponible'
      });
    }

    // Obtener información actualizada de los hijos
    const childrenSnapshot = await db.collection('children')
      .where('parentId', '==', uid)
      .orderBy('createdAt', 'desc')
      .get();

    if (childrenSnapshot.empty) {
      return res.status(404).json({
        success: false,
        message: 'No tienes hijos registrados'
      });
    }

    const children = [];
    childrenSnapshot.forEach(doc => {
      const childData = doc.data();
      const currentInfo = getChildCurrentInfo(childData);
      children.push({
        id: doc.id,
        name: childData.name,
        ageInMonths: childData.ageInMonths,
        currentAgeInMonths: currentInfo.currentAgeInMonths,
        isUnborn: childData.isUnborn,
        gestationWeeks: childData.gestationWeeks,
        currentGestationWeeks: currentInfo.currentGestationWeeks,
        daysSinceCreation: currentInfo.daysSinceCreation
      });
    });

    // Crear contexto para OpenAI
    const childrenContext = children.map(child => {
      if (child.isUnborn) {
        return `${child.name}: Por nacer, ${child.currentGestationWeeks} semanas de gestación`;
      } else {
        const years = Math.floor(child.currentAgeInMonths / 12);
        const months = child.currentAgeInMonths % 12;
        const ageText = years > 0 
          ? `${years} año${years > 1 ? 's' : ''}${months > 0 ? ` y ${months} mes${months > 1 ? 'es' : ''}` : ''}`
          : `${months} mes${months > 1 ? 'es' : ''}`;
        return `${child.name}: ${ageText} de edad`;
      }
    }).join(', ');

    // Generar tips usando OpenAI
    let tips = [];
    if (openai) {
      try {
        const prompt = `Eres una doula experta llamada "Douli". Necesito que generes 3-5 tips cortos y útiles para una madre/padre basándote en la información de sus hijos.

INFORMACIÓN DE LOS HIJOS:
${childrenContext}

TIPO DE TIP SOLICITADO: ${tipType}

REQUISITOS:
- Tips cortos (máximo 2 líneas cada uno)
- Específicos para la edad/gestación de los hijos
- Prácticos y accionables
- En español
- Formato: emoji + texto corto
- Relacionados con el tipo solicitado

Ejemplos de tipos:
- general: consejos generales de crianza
- alimentacion: consejos de alimentación
- desarrollo: hitos de desarrollo
- salud: consejos de salud
- sueño: consejos de sueño
- actividades: actividades recomendadas

Genera solo los tips, sin explicaciones adicionales.`;

        const completion = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: "Eres una doula experta y compasiva que da consejos prácticos y útiles para padres."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          max_tokens: 300,
          temperature: 0.7
        });

        const response = completion.choices[0].message.content;
        tips = response.split('\n').filter(tip => tip.trim().length > 0);

      } catch (openaiError) {
        console.error('❌ Error con OpenAI:', openaiError.message);
        // Fallback con tips predefinidos
        tips = generateFallbackTips(children, tipType);
      }
    } else {
      // Fallback si OpenAI no está disponible
      tips = generateFallbackTips(children, tipType);
    }

    res.json({
      success: true,
      data: {
        tips: tips,
        children: children.map(child => ({
          id: child.id,
          name: child.name,
          currentAge: child.isUnborn ? `${child.currentGestationWeeks} semanas` : `${child.currentAgeInMonths} meses`,
          isUnborn: child.isUnborn
        })),
        tipType: tipType,
        timestamp: new Date()
      }
    });

  } catch (error) {
    console.error('❌ Error obteniendo tips:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo tips',
      error: error.message
    });
  }
});

// Función para generar tips de fallback
function generateFallbackTips(children, tipType) {
  const tips = [];
  
  children.forEach(child => {
    if (tipType === 'general' || tipType === 'desarrollo') {
      if (child.isUnborn) {
        if (child.currentGestationWeeks >= 40) {
          tips.push('🤰 ¡Tu bebé está listo para nacer! Mantén la calma y confía en tu cuerpo.');
        } else if (child.currentGestationWeeks >= 37) {
          tips.push('👶 A partir de las 37 semanas tu bebé ya no es prematuro. ¡Estás en la recta final!');
        } else if (child.currentGestationWeeks >= 28) {
          tips.push('💕 Tu bebé ya puede soñar y reconocer tu voz. Habla con él/ella todos los días.');
        }
      } else {
        if (child.currentAgeInMonths <= 6) {
          tips.push('🍼 La leche materna es el mejor alimento para tu bebé. Amamanta a demanda.');
        } else if (child.currentAgeInMonths <= 12) {
          tips.push('🥄 Introduce alimentos sólidos gradualmente. Un alimento nuevo cada 3-4 días.');
        } else if (child.currentAgeInMonths <= 24) {
          tips.push('🚶 Tu pequeño está explorando el mundo. Mantén tu casa segura para niños.');
        } else if (child.currentAgeInMonths <= 36) {
          tips.push('🎨 Fomenta la creatividad con dibujos, manualidades y juegos imaginativos.');
        } else {
          tips.push('📚 Lee cuentos juntos. Es una excelente manera de fortalecer el vínculo.');
        }
      }
    } else if (tipType === 'alimentacion') {
      if (!child.isUnborn) {
        if (child.currentAgeInMonths <= 6) {
          tips.push('🤱 Amamanta exclusivamente hasta los 6 meses. No necesita agua ni otros alimentos.');
        } else if (child.currentAgeInMonths <= 12) {
          tips.push('🥑 Introduce frutas y verduras de colores variados para una nutrición completa.');
        } else if (child.currentAgeInMonths <= 24) {
          tips.push('🥛 Ofrece 3 comidas principales y 2-3 refrigerios saludables al día.');
        } else {
          tips.push('🍎 Incluye proteínas magras, granos enteros y muchas frutas y verduras.');
        }
      }
    } else if (tipType === 'salud') {
      if (!child.isUnborn) {
        if (child.currentAgeInMonths <= 12) {
          tips.push('💉 Mantén al día el calendario de vacunación. Es fundamental para su salud.');
        } else if (child.currentAgeInMonths <= 24) {
          tips.push('🦷 Cepilla sus dientes 2 veces al día con pasta dental con flúor.');
        } else {
          tips.push('🏃 Fomenta al menos 1 hora de actividad física diaria para un desarrollo saludable.');
        }
      }
    } else if (tipType === 'sueño') {
      if (!child.isUnborn) {
        if (child.currentAgeInMonths <= 6) {
          tips.push('😴 Los bebés necesitan 14-17 horas de sueño total al día. Respeta sus ritmos.');
        } else if (child.currentAgeInMonths <= 12) {
          tips.push('🌙 Establece una rutina de sueño consistente: baño, cuento y cuna a la misma hora.');
        } else if (child.currentAgeInMonths <= 24) {
          tips.push('🛏️ Los niños de 1-2 años necesitan 11-14 horas de sueño, incluyendo 1-2 siestas.');
        } else {
          tips.push('💤 Los niños de 3-5 años necesitan 10-13 horas de sueño. Mantén horarios regulares.');
        }
      }
    } else if (tipType === 'actividades') {
      if (!child.isUnborn) {
        if (child.currentAgeInMonths <= 6) {
          tips.push('🎵 Canta canciones y haz movimientos rítmicos. Estimula su desarrollo auditivo y motor.');
        } else if (child.currentAgeInMonths <= 12) {
          tips.push('🧸 Juega a esconder objetos. Desarrolla su memoria y comprensión de permanencia.');
        } else if (child.currentAgeInMonths <= 24) {
          tips.push('🏗️ Construye torres con bloques. Mejora su coordinación y pensamiento espacial.');
        } else {
          tips.push('🎭 Juega a disfrazarse. Fomenta la imaginación y la expresión creativa.');
        }
      }
    }
  });

  // Si no hay tips específicos, agregar tips generales
  if (tips.length === 0) {
    tips.push('💕 Cada hijo es único. Confía en tu instinto maternal/paternal.');
    tips.push('🤗 El amor y la paciencia son los mejores ingredientes para criar niños felices.');
    tips.push('📱 Limita el tiempo de pantalla y prioriza el juego activo y la interacción.');
  }

  return tips.slice(0, 5); // Máximo 5 tips
}

// Endpoint para actualizar el nombre del usuario
app.put('/api/auth/update-name', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { displayName } = req.body;

    if (!displayName || displayName.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'El nombre es requerido'
      });
    }

    if (!auth || !db) {
      return res.status(500).json({
        success: false,
        message: 'Servicios no disponibles'
      });
    }

    console.log('📝 Actualizando nombre del usuario:', uid, 'Nuevo nombre:', displayName);

    // Actualizar en Firebase Auth
    await auth.updateUser(uid, {
      displayName: displayName.trim()
    });

    // Actualizar en Firestore
    await db.collection('users').doc(uid).update({
      displayName: displayName.trim(),
      updatedAt: new Date()
    });

    console.log('✅ Nombre actualizado correctamente');

    res.json({
      success: true,
      message: 'Nombre actualizado correctamente',
      data: {
        displayName: displayName.trim()
      }
    });

  } catch (error) {
    console.error('❌ Error actualizando nombre:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar el nombre',
      error: error.message
    });
  }
});

// Middleware de manejo de errores
app.use((err, req, res, next) => {
  console.error('Error no manejado:', err);
  res.status(500).json({
    success: false,
    message: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Algo salió mal'
  });
});



// Middleware para rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Ruta no encontrada',
    path: req.originalUrl
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`📱 Ambiente: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 URL: http://localhost:${PORT}`);
  console.log(`🔥 Firebase: ${firebaseStatus}`);
});

// Manejo de señales para cierre graceful
process.on('SIGTERM', () => {
  console.log('SIGTERM recibido, cerrando servidor...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT recibido, cerrando servidor...');
  process.exit(0);
});

module.exports = app;

// ===== SISTEMA DE APRENDIZAJE CONTINUO (RAG) =====

// Función para guardar conocimiento en el vector store (simulado en Firestore)
const saveKnowledge = async (text, metadata = {}) => {
  try {
    if (!db) return false;
    
    const knowledgeDoc = {
      text: text,
      metadata: {
        source: metadata.source || 'manual',
        topic: metadata.topic || 'general',
        stage: metadata.stage || 'general', // embarazo|posparto|lactancia|general
        version: metadata.version || '1.0',
        language: metadata.language || 'es',
        createdBy: metadata.createdBy || 'system',
        createdAt: new Date(),
        qualityScore: metadata.qualityScore || 1.0
      },
      // Simulación de embedding (en producción usarías un servicio real)
      embedding: [0.1, 0.2, 0.3], // Placeholder
      isActive: true
    };
    
    await db.collection('knowledge_base').add(knowledgeDoc);
    console.log('💾 [RAG] Conocimiento guardado:', metadata.topic);
    return true;
  } catch (error) {
    console.error('❌ [RAG] Error guardando conocimiento:', error);
    return false;
  }
};

// Función para recuperar conocimiento relevante
const retrieveKnowledge = async (query, filters = {}) => {
  try {
    if (!db) return [];
    
    let queryRef = db.collection('knowledge_base').where('isActive', '==', true);
    
    // Aplicar filtros
    if (filters.stage) {
      queryRef = queryRef.where('metadata.stage', '==', filters.stage);
    }
    if (filters.topic) {
      queryRef = queryRef.where('metadata.topic', '==', filters.topic);
    }
    if (filters.language) {
      queryRef = queryRef.where('metadata.language', '==', filters.language);
    }
    
    const snapshot = await queryRef.orderBy('metadata.qualityScore', 'desc').limit(5).get();
    
    const knowledge = [];
    snapshot.forEach(doc => {
      knowledge.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    console.log('🔍 [RAG] Conocimiento recuperado:', knowledge.length, 'fragmentos');
    return knowledge;
  } catch (error) {
    console.error('❌ [RAG] Error recuperando conocimiento:', error);
    return [];
  }
};

// Función para guardar memoria del usuario
const saveUserMemory = async (userId, memoryData) => {
  try {
    if (!db) return false;
    
    const memoryDoc = {
      userId: userId,
      profile: memoryData.profile || {},
      notes: memoryData.notes || [],
      preferences: memoryData.preferences || {},
      lastUpdated: new Date()
    };
    
    await db.collection('user_memory').doc(userId).set(memoryDoc, { merge: true });
    console.log('💾 [MEMORY] Memoria guardada para usuario:', userId);
    return true;
  } catch (error) {
    console.error('❌ [MEMORY] Error guardando memoria:', error);
    return false;
  }
};

// Función para obtener memoria del usuario
const getUserMemory = async (userId) => {
  try {
    if (!db) return null;
    
    const memoryDoc = await db.collection('user_memory').doc(userId).get();
    
    if (memoryDoc.exists) {
      console.log('🔍 [MEMORY] Memoria recuperada para usuario:', userId);
      return memoryDoc.data();
    }
    
    return null;
  } catch (error) {
    console.error('❌ [MEMORY] Error obteniendo memoria:', error);
    return null;
  }
};

// Función para guardar Q&A validado
const saveValidatedQA = async (question, answer, tags = [], qualityScore = 1.0) => {
  try {
    if (!db) return false;
    
    const qaDoc = {
      question: question,
      answer: answer,
      tags: tags,
      qualityScore: qualityScore,
      createdAt: new Date(),
      isActive: true,
      usageCount: 0
    };
    
    await db.collection('validated_qa').add(qaDoc);
    console.log('💾 [QA] Q&A validado guardado');
    return true;
  } catch (error) {
    console.error('❌ [QA] Error guardando Q&A:', error);
    return false;
  }
};

// Función para guardar feedback del usuario
const saveFeedback = async (userId, conversationId, feedback) => {
  try {
    if (!db) return false;
    
    const feedbackDoc = {
      userId: userId,
      conversationId: conversationId,
      feedback: feedback, // 'positive' | 'negative'
      timestamp: new Date(),
      processed: false
    };
    
    await db.collection('user_feedback').add(feedbackDoc);
    console.log('💾 [FEEDBACK] Feedback guardado:', feedback);
    return true;
  } catch (error) {
    console.error('❌ [FEEDBACK] Error guardando feedback:', error);
    return false;
  }
};


