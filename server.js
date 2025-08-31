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
    let personalizedIntro = `¡Hola ${userName}! Soy Douli, tu asistente de Munpa. Te puedo ayudar con los síntomas del primer trimestre.`;
    
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
    return `¡Excelente pregunta ${userName}! Soy Douli, tu asistente de Munpa. Te recomiendo mantenerte activa durante el embarazo, pero con precaución:

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
    return `¡Qué emoción ${userName}! Soy Douli, tu asistente de Munpa.

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
    return `¡La lactancia es maravillosa ${userName}! Soy Douli, tu asistente de Munpa.

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
    return `¡La nutrición es fundamental ${userName}! Soy Douli, tu asistente de Munpa.

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

¿Cómo te sientes ${userName}?`;
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
        return `¡Hola ${userName}! Soy Douli, tu asistente de Munpa. 

🤱 **${askedChildName}:**
${askedChildName} está por nacer (${weeks} semanas de gestación).

💡 **Próximos pasos:**
• Prepara la maleta para el hospital
• Ten todo listo en casa
• Practica técnicas de respiración

¿Necesitas ayuda con la preparación ${userName}?`;
      } else {
        // Extraer edad del texto
        const ageMatch = childLine.match(/: (.+?) de edad/);
        if (ageMatch) {
          const age = ageMatch[1];
          return `¡Hola ${userName}! Soy Douli, tu asistente de Munpa. 

👶 **${askedChildName}:**
${askedChildName} tiene ${age}.

💡 **Consejos para esta edad:**
• Mantén rutinas estables
• Celebra sus logros
• Dedica tiempo individual

¿Qué aspecto específico te preocupa ${userName}?`;
        }
      }
    }
  }
  
  // Verificar si pregunta por un hijo específico (sin edad)
  if (askedChildName) {
    const isUnborn = unbornChildrenNames.includes(askedChildName);
    const isYoung = youngChildrenNames.includes(askedChildName);
    
    if (isUnborn) {
      return `¡Hola ${userName}! Soy Douli, tu asistente de Munpa.

🤱 **${askedChildName}:**
${askedChildName} está por nacer.

💡 **Preparación:**
• Todo listo para su llegada
• Prepara a tus otros hijos
• Maleta para hospital
• Técnicas de respiración

¿Qué necesitas saber específicamente ${userName}?`;
    } else if (isYoung) {
      return `¡Hola ${userName}! Soy Douli, tu asistente de Munpa.

👶 **${askedChildName}:**
${askedChildName} está en etapa de desarrollo.

💡 **Consejos:**
• Rutina estable
• Tiempo individual
• Celebra logros
• Paciencia

¿Qué te preocupa específicamente ${userName}?`;
    } else {
      return `¡Hola ${userName}! Soy Douli, tu asistente de Munpa.

👶 **${askedChildName}:**
${askedChildName} es parte de tu familia.

💡 **Consejos:**
• Necesidades únicas
• Tiempo individual
• Celebra logros
• Comunicación abierta

¿Qué necesitas saber ${userName}?`;
    }
  }
  
  // Respuesta general para cualquier otra pregunta
  let personalizedIntro = `¡Hola ${userName}! Soy Douli, tu asistente de Munpa.`;
  
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
      
      let response = `¡Hola ${userName}! Soy Douli, tu asistente de Munpa. 

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

¿Sobre cuál necesitas ayuda ${userName}?`;
      
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
          
          // Obtener información de los hijos
          const childrenSnapshot = await db.collection('children')
            .where('parentId', '==', uid)
            .orderBy('createdAt', 'desc')
            .get();
          
          const children = [];
          childrenSnapshot.forEach(doc => {
            const childData = doc.data();
            children.push({
              id: doc.id,
              name: childData.name,
              ageInMonths: childData.ageInMonths,
              isUnborn: childData.isUnborn,
              gestationWeeks: childData.gestationWeeks,
              createdAt: childData.createdAt
            });
          });
          
          // Crear contexto personalizado del usuario
          userContext = `
            Información del usuario:
            - Género: ${userData.gender === 'F' ? 'Mujer' : 'Hombre'}
            - Número de hijos: ${userData.childrenCount || 0}
            - Embarazada: ${userData.isPregnant ? 'Sí' : 'No'}
            ${userData.gestationWeeks ? `- Semanas de gestación: ${userData.gestationWeeks}` : ''}
          `;
          
          // Crear contexto detallado de los hijos
          if (children.length > 0) {
            childrenInfo = `
            Información de los hijos:
            ${children.map((child, index) => {
              if (child.isUnborn) {
                return `- ${child.name}: Por nacer (${child.gestationWeeks} semanas de gestación)`;
              } else {
                const years = Math.floor(child.ageInMonths / 12);
                const months = child.ageInMonths % 12;
                const ageText = years > 0 
                  ? `${years} año${years > 1 ? 's' : ''}${months > 0 ? ` y ${months} mes${months > 1 ? 'es' : ''}` : ''}`
                  : `${months} mes${months > 1 ? 'es' : ''}`;
                return `- ${child.name}: ${ageText} de edad`;
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
              ageInMonths: c.ageInMonths,
              isUnborn: c.isUnborn,
              gestationWeeks: c.gestationWeeks
            }))
          });
        }
      } catch (error) {
        console.log('⚠️ No se pudo obtener contexto del usuario:', error.message);
      }
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

📚 **TUS ÁREAS DE EXPERTISE:**
- Síntomas del embarazo y cómo manejarlos
- Preparación física y mental para el parto
- Técnicas de respiración y relajación
- Lactancia materna y alimentación del bebé
- Cuidado postparto y recuperación
- Nutrición durante el embarazo
- Ejercicios seguros para embarazadas
- Apoyo emocional y bienestar mental

⚠️ **IMPORTANTE - LIMITACIONES MÉDICAS:**
- SIEMPRE aclara que no eres médico
- Recomienda consultar profesionales de la salud para decisiones médicas
- Si detectas síntomas graves, urge consulta médica inmediata
- No prescribas medicamentos ni tratamientos médicos

🤱 **TU ENFOQUE:**
- Cada embarazo es único y especial
- Escucha las preocupaciones con empatía
- Ofrece soluciones prácticas y realistas
- Celebra cada etapa del embarazo
- Fortalece la confianza de la madre en su cuerpo
- Eres parte del ecosistema Munpa para familias

${userContext}
${childrenInfo}

IMPORTANTE: Usa esta información para personalizar tus respuestas. Por ejemplo:
- Si tiene hijos pequeños, da consejos específicos para esa edad
- Si está embarazada, enfócate en esa etapa específica
- Si tiene múltiples hijos, considera la dinámica familiar
- Si tiene hijos por nacer, incluye preparación para la llegada
- SIEMPRE usa los nombres específicos de sus hijos cuando sea apropiado
- Si pregunta por un hijo específico, responde usando su nombre y edad
- Menciona a los hijos por nombre cuando des consejos personalizados

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
        userData = { 
          ...userData, 
          gender: firestoreData.gender || null,
          childrenCount: firestoreData.childrenCount || 0,
          isPregnant: firestoreData.isPregnant || false,
          gestationWeeks: firestoreData.gestationWeeks || null,
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
      children.push({
        id: doc.id,
        ...doc.data()
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
    const { name, ageInMonths, isUnborn, gestationWeeks } = req.body;

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

    const childData = {
      parentId: uid,
      name: name.trim(),
      ageInMonths: isUnborn ? null : parseInt(ageInMonths),
      isUnborn: isUnborn || false,
      gestationWeeks: isUnborn ? parseInt(gestationWeeks) : null,
      photoUrl: null, // Campo para foto (se puede actualizar después)
      createdAt: new Date(),
      updatedAt: new Date()
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
