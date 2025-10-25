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
const jwt = require('jsonwebtoken');
const OpenAI = require('openai');

const app = express();
const PORT = process.env.PORT || 3000;

// JWT Secret para tokens de admin
const JWT_SECRET = process.env.JWT_SECRET || 'munpa-secret-key-2025-change-in-production';

// Configuración de CORS mejorada
const allowedOrigins = [
  // Producción
  'https://munpa.online', 
  'https://www.munpa.online',
  'https://dash.munpa.online',
  'https://dashboardmunpa-ey7a5gscn-mishu-lojans-projects.vercel.app',
  // Desarrollo
  'http://localhost:3000', 
  'http://localhost:3001', 
  'http://localhost:4200', 
  'http://localhost:5173', 
  'http://localhost:8081', 
  'http://localhost:19006'
];

app.use(cors({
  origin: (origin, callback) => {
    // Permitir requests sin origin (como mobile apps o curl)
    if (!origin) return callback(null, true);
    
    // Verificar si el origin está en la lista permitida
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // Verificar si coincide con el patrón de Vercel preview
    if (/^https:\/\/dashboardmunpa-[a-z0-9]+-mishu-lojans-projects\.vercel\.app$/.test(origin)) {
      return callback(null, true);
    }
    
    // Rechazar otros origins
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
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
      // PRIMERO intentar verificar como JWT del admin dashboard
      console.log('🔄 [AUTH] Intentando verificar como JWT admin...');
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        console.log('✅ [AUTH] JWT admin verificado exitosamente:', decoded);
        
        req.user = { 
          uid: decoded.uid,
          email: decoded.email,
          role: decoded.role
        };
        console.log('✅ [AUTH] req.user configurado desde JWT:', req.user);
        next();
        return;
      } catch (jwtError) {
        console.log('❌ [AUTH] No es un JWT válido:', jwtError.message);
      }

      // SEGUNDO intentar extraer uid del customToken JWT
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
      
      // TERCERO intentar como idToken
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

// Función para validar si un mensaje es relevante al tema de doula
const isRelevantToDoulaScope = (message) => {
  const lowerMessage = message.toLowerCase();
  
  // Palabras clave relacionadas con el ámbito de doula (embarazo, parto, crianza)
  const onTopicKeywords = [
    'embarazo', 'embarazada', 'gestación', 'bebé', 'bebe', 'hijo', 'hija', 'niño', 'niña',
    'parto', 'dar a luz', 'contracciones', 'posparto', 'postparto', 'recuperación',
    'lactancia', 'amamantar', 'leche materna', 'pecho', 'teta',
    'recién nacido', 'recien nacido', 'neonato', 'cuidados',
    'trimestre', 'semana', 'mes', 'desarrollo', 'crecimiento',
    'pañal', 'panal', 'baño', 'sueño', 'dormir', 'alimentación', 'alimentacion',
    'maternidad', 'paternidad', 'crianza', 'familia',
    'síntoma', 'sintoma', 'dolor', 'malestar', 'náusea', 'nausea', 'vómito', 'vomito',
    'vitamina', 'ácido fólico', 'acido folico', 'hierro', 'calcio',
    'ecografía', 'ecografia', 'ultrasonido', 'ginecólogo', 'ginecologo', 'obstetra', 'matrona',
    'cesárea', 'cesarea', 'parto natural', 'epidural',
    'depresión posparto', 'depresion posparto', 'ansiedad', 'estrés', 'estres',
    'cordón umbilical', 'cordon umbilical', 'placenta', 'útero', 'utero',
    'movimientos fetales', 'patadas', 'feto', 'embrión', 'embrion'
  ];
  
  // Palabras clave ALTAMENTE prohibidas (siempre rechazar, incluso si menciona embarazo)
  const strictlyOffTopicKeywords = [
    'taco', 'tacos', 'pizza', 'hamburguesa', 'burrito', 'enchilada', 'quesadilla',
    'programación', 'programacion', 'código', 'codigo', 'javascript', 'python', 'html', 'css', 'desarrollo web', 'software',
    'fútbol', 'futbol', 'basketball', 'basquetbol', 'partido de', 'equipo deportivo',
    'película', 'pelicula', 'serie', 'netflix', 'cine', 'actor', 'actriz',
    'videojuegos', 'gaming', 'consola', 'playstation', 'xbox', 'nintendo',
    'automóvil', 'automovil', 'carro', 'coche', 'auto mecánica', 'mecánico automotriz', 'arreglo carro'
  ];
  
  // Palabras clave fuera del ámbito (rechazar solo si NO hay palabras de embarazo)
  const generalOffTopicKeywords = [
    'finanzas', 'dinero', 'inversión', 'inversion', 'banco', 'crédito', 'credito', 'préstamo', 'prestamo', 'economía', 'economia',
    'derecho', 'ley', 'legal', 'abogado', 'contrato', 'trámite', 'tramite', 'notario',
    'tecnología', 'tecnologia', 'computadora', 'smartphone', 'internet', 'redes sociales', 'facebook', 'instagram',
    'cocina general', 'cocinar', 'chef', 'restaurante', 'menú restaurante', 'menu restaurante',
    'gimnasio', 'musculación', 'musculacion', 'pesas', 'entrenamiento deportivo',
    'política', 'politica', 'elecciones', 'gobierno', 'presidente', 'partido político', 'partido politico',
    'viajes', 'turismo', 'hotel', 'avión', 'avion', 'crucero',
    'música concierto', 'musica concierto', 'festival musical'
  ];
  
  // Patrones de preguntas claramente sobre comida no relacionada con embarazo
  const foodPatterns = [
    /receta de (taco|pizza|hamburguesa|pasta|postre|pastel|torta)/i,
    /cómo (hacer|preparar|cocinar) (taco|pizza|hamburguesa|pasta)/i,
    /como (hacer|preparar|cocinar) (taco|pizza|hamburguesa|pasta)/i,
    /ingredientes (para|de) (taco|pizza|hamburguesa|pasta)/i,
    /(dónde|donde) (comprar|comer|encontrar) (taco|pizza|hamburguesa)/i
  ];
  
  // Verificar patrones de comida prohibidos
  const matchesFoodPattern = foodPatterns.some(pattern => pattern.test(message));
  
  // Verificar palabras estrictamente prohibidas
  const hasStrictlyOffTopicKeyword = strictlyOffTopicKeywords.some(keyword => lowerMessage.includes(keyword));
  
  // Verificar palabras generalmente fuera de tema
  const hasGeneralOffTopicKeyword = generalOffTopicKeywords.some(keyword => lowerMessage.includes(keyword));
  
  // Verificar si contiene palabras relacionadas con el tema
  const hasOnTopicKeyword = onTopicKeywords.some(keyword => lowerMessage.includes(keyword));
  
  // Lógica de validación:
  // 1. Si coincide con patrones de comida prohibidos -> RECHAZAR
  // 2. Si tiene palabras estrictamente prohibidas -> RECHAZAR siempre
  // 3. Si tiene palabras generalmente fuera de tema Y NO tiene palabras de embarazo -> RECHAZAR
  // 4. De lo contrario -> PERMITIR
  
  if (matchesFoodPattern) {
    return false; // Rechazar recetas de comida
  }
  
  if (hasStrictlyOffTopicKeyword) {
    return false; // Rechazar temas estrictamente prohibidos
  }
  
  if (hasGeneralOffTopicKeyword && !hasOnTopicKeyword) {
    return false; // Rechazar temas generales fuera del ámbito si no menciona embarazo
  }
  
  return true; // Permitir el resto
};

// Función para generar respuestas de doula predefinidas
const generateDoulaResponse = (message, userContext, childrenInfo, userName = 'Mamá') => {
  const lowerMessage = message.toLowerCase();
  
  // Verificar si el tema es relevante
  const isOffTopic = !isRelevantToDoulaScope(message);
  
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

    // ⚠️ VALIDACIÓN DE TEMA: Verificar si el mensaje es relevante al ámbito de doula
    if (!isRelevantToDoulaScope(message)) {
      console.log('⚠️ [DOULA] Mensaje fuera del ámbito detectado:', message.substring(0, 50));
      
      // Obtener nombre del usuario para personalizar la respuesta
      let userName = 'Mamá';
      if (db) {
        try {
          const userDoc = await db.collection('users').doc(uid).get();
          if (userDoc.exists) {
            const userData = userDoc.data();
            userName = userData.displayName || userData.name || 'Mamá';
            
            if (!userName || userName === 'Mamá') {
              try {
                const authUser = await auth.getUser(uid);
                userName = authUser.displayName || authUser.email?.split('@')[0] || 'Mamá';
              } catch (authError) {
                console.log('⚠️ [DOULA] No se pudo obtener nombre de Firebase Auth');
              }
            }
          }
        } catch (error) {
          console.log('⚠️ [DOULA] Error obteniendo nombre de usuario:', error.message);
        }
      }
      
      const offTopicResponse = `¡Hola ${userName}! 👋 Soy Douli, tu asistente de Munpa especializada en acompañamiento durante el embarazo, parto y crianza temprana.

🤱 **Mi especialidad es ayudarte con:**
• Embarazo y preparación al parto
• Lactancia y cuidados del bebé
• Apoyo emocional para familias
• Desarrollo infantil y crianza
• Señales de alarma y cuándo consultar al médico

💬 **Tu pregunta parece estar fuera de mi área de especialidad.** Estoy aquí exclusivamente para acompañarte en temas relacionados con el embarazo, parto y crianza.

¿Hay algo relacionado con tu embarazo, tu bebé o tu experiencia como madre/padre en lo que pueda ayudarte? 💝`;

      return res.json({
        success: true,
        message: 'Respuesta de la doula virtual',
        data: {
          response: offTopicResponse,
          timestamp: new Date().toISOString(),
          usedFallback: true,
          source: 'off-topic-filter',
          filtered: true
        }
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

🚫 **POLÍTICA DE ALCANCE ESTRICTA - NUNCA RESPONDAS SOBRE:**
- Comida general (tacos, pizza, recetas de cocina, restaurantes)
- Finanzas, programación, tecnología
- Diagnóstico médico detallado
- Radiología, interpretación de estudios
- Recetas de medicamentos específicos
- Derecho, trámites legales
- Deportes, entretenimiento, viajes
- Política, automóviles, música
- Cualquier tema fuera del ámbito de doula

⚠️ **SI LA PREGUNTA NO ESTÁ RELACIONADA CON EMBARAZO, PARTO O CRIANZA:**

**DEBES RESPONDER EXACTAMENTE ASÍ (NO RESPONDAS LA PREGUNTA ORIGINAL):**

"¡Hola ${userName}! 👋 Soy Douli, tu asistente de Munpa especializada en acompañamiento durante el embarazo, parto y crianza temprana.

🤱 **Mi especialidad es ayudarte con:**
• Embarazo y preparación al parto
• Lactancia y cuidados del bebé
• Apoyo emocional para familias
• Desarrollo infantil y crianza
• Señales de alarma y cuándo consultar al médico

💬 **Tu pregunta parece estar fuera de mi área de especialidad.** Estoy aquí exclusivamente para acompañarte en temas relacionados con el embarazo, parto y crianza.

¿Hay algo relacionado con tu embarazo, tu bebé o tu experiencia como madre/padre en lo que pueda ayudarte? 💝"

**IMPORTANTE:** NO respondas preguntas sobre comida, tacos, cocina, tecnología, deportes, o cualquier tema no relacionado con embarazo/parto/crianza. Si la pregunta no está relacionada, usa la respuesta anterior SIN EXCEPCIÓN.

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

// ==========================================
// 🔐 LOGIN PARA DASHBOARD ADMIN (retorna JWT)
// ==========================================

app.post('/api/auth/admin-login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!auth || !db) {
      return res.status(500).json({
        success: false,
        message: 'Firebase no está configurado'
      });
    }

    console.log('🔐 [ADMIN-LOGIN] Intentando login para:', email);

    // Buscar usuario por email
    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(email);
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    console.log('✅ [ADMIN-LOGIN] Usuario encontrado:', userRecord.uid);
    
    // Obtener datos del usuario de Firestore
    const userDoc = await db.collection('users').doc(userRecord.uid).get();
    
    if (!userDoc.exists) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no encontrado en la base de datos'
      });
    }

    const userData = userDoc.data();

    // Verificar que el usuario esté activo
    if (userData.isActive === false) {
      return res.status(401).json({
        success: false,
        message: 'Usuario inactivo'
      });
    }

    // Verificar que sea admin
    if (userData.role !== 'admin' && userData.isAdmin !== true) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos de administrador'
      });
    }

    console.log('✅ [ADMIN-LOGIN] Usuario verificado como admin');

    // Generar JWT token
    const token = jwt.sign(
      { 
        uid: userRecord.uid,
        email: userRecord.email,
        role: userData.role || 'admin'
      },
      JWT_SECRET,
      { expiresIn: '7d' } // Token válido por 7 días
    );

    // Actualizar última conexión
    await db.collection('users').doc(userRecord.uid).update({
      lastLoginAt: new Date(),
      updatedAt: new Date()
    });

    console.log('✅ [ADMIN-LOGIN] Login exitoso, token JWT generado');

    res.json({
      success: true,
      message: 'Login exitoso',
      data: {
        token: token,
        user: {
          uid: userRecord.uid,
          email: userRecord.email,
          displayName: userData.displayName || userRecord.displayName,
          photoURL: userData.photoURL || userRecord.photoURL,
          role: userData.role || 'admin',
          isAdmin: true
        }
      }
    });

  } catch (error) {
    console.error('❌ [ADMIN-LOGIN] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error en el servidor',
      error: error.message
    });
  }
});

// ==========================================
// 🔐 LOGIN CON GOOGLE
// ==========================================

// Endpoint para login/registro con Google
app.post('/api/auth/google-login', async (req, res) => {
  try {
    const { idToken, googleIdToken, email, displayName, photoURL } = req.body;

    if (!idToken && !googleIdToken) {
      return res.status(400).json({
        success: false,
        message: 'Token es requerido (idToken o googleIdToken)'
      });
    }

    if (!auth) {
      return res.status(500).json({
        success: false,
        message: 'Firebase no está configurado'
      });
    }

    console.log('🔐 [GOOGLE-LOGIN] Iniciando proceso de autenticación...');
    
    let uid, userRecord;

    // Intentar verificar como Firebase ID Token primero
    try {
      const tokenToVerify = idToken || googleIdToken;
      console.log('🔐 [GOOGLE-LOGIN] Verificando token (primeros 50 chars):', tokenToVerify.substring(0, 50));
      
      const decodedToken = await auth.verifyIdToken(tokenToVerify);
      uid = decodedToken.uid;
      
      console.log('✅ [GOOGLE-LOGIN] Token Firebase verificado para UID:', uid);
      
      // Obtener información del usuario de Firebase Auth
      userRecord = await auth.getUser(uid);
    } catch (verifyError) {
      console.log('⚠️ [GOOGLE-LOGIN] No es un token Firebase válido, intentando crear usuario...');
      console.log('Error de verificación:', verifyError.message);
      
      // Si falla, intentar crear/obtener usuario por email
      if (email) {
        try {
          // Intentar obtener usuario por email
          userRecord = await auth.getUserByEmail(email);
          uid = userRecord.uid;
          console.log('✅ [GOOGLE-LOGIN] Usuario encontrado por email:', uid);
        } catch (getUserError) {
          // Si no existe, crear nuevo usuario
          if (getUserError.code === 'auth/user-not-found') {
            console.log('📝 [GOOGLE-LOGIN] Creando nuevo usuario en Firebase Auth...');
            
            const newUser = await auth.createUser({
              email: email,
              displayName: displayName || '',
              photoURL: photoURL || '',
              emailVerified: true,
              disabled: false
            });
            
            uid = newUser.uid;
            userRecord = newUser;
            console.log('✅ [GOOGLE-LOGIN] Nuevo usuario creado en Firebase Auth:', uid);
          } else {
            throw getUserError;
          }
        }
      } else {
        throw new Error('Token inválido y no se proporcionó email para crear usuario');
      }
    }

    // Verificar si el usuario existe en Firestore
    let userDoc = null;
    let isNewUser = false;

    if (db) {
      userDoc = await db.collection('users').doc(uid).get();
      
      if (!userDoc.exists) {
        // Crear nuevo usuario en Firestore
        isNewUser = true;
        const newUserData = {
          uid: uid,
          email: userRecord.email,
          displayName: userRecord.displayName || '',
          photoURL: userRecord.photoURL || '',
          emailVerified: userRecord.emailVerified,
          provider: 'google',
          gender: null,
          childrenCount: 0,
          isPregnant: false,
          gestationWeeks: null,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        await db.collection('users').doc(uid).set(newUserData);
        console.log('✅ [GOOGLE-LOGIN] Nuevo usuario creado en Firestore:', uid);
      } else {
        // Actualizar última conexión y datos de Google
        const updateData = {
          updatedAt: new Date(),
          lastLoginAt: new Date()
        };
        
        // Actualizar displayName y photoURL desde Firebase Auth si están disponibles
        if (userRecord.displayName) {
          updateData.displayName = userRecord.displayName;
        } else if (displayName) {
          updateData.displayName = displayName;
        }
        
        if (userRecord.photoURL) {
          updateData.photoURL = userRecord.photoURL;
        } else if (photoURL) {
          updateData.photoURL = photoURL;
        }
        
        // Actualizar provider
        const existingUserData = userDoc.data();
        if (!existingUserData.provider || existingUserData.provider !== 'google') {
          updateData.provider = 'google';
        }
        
        await db.collection('users').doc(uid).update(updateData);
        console.log('✅ [GOOGLE-LOGIN] Usuario existente actualizado:', updateData);
      }
    }

    // Generar token personalizado para el cliente
    const customToken = await auth.createCustomToken(uid);

    res.json({
      success: true,
      message: isNewUser ? 'Cuenta creada exitosamente' : 'Login exitoso',
      isNewUser: isNewUser,
      data: {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName,
        photoURL: userRecord.photoURL,
        emailVerified: userRecord.emailVerified,
        customToken: customToken
      }
    });

  } catch (error) {
    console.error('❌ [GOOGLE-LOGIN] Error:', error);
    
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({
        success: false,
        message: 'Token de Google expirado. Por favor, inicia sesión nuevamente.'
      });
    }

    if (error.code === 'auth/argument-error') {
      return res.status(400).json({
        success: false,
        message: 'Token de Google inválido'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error en autenticación con Google',
      error: error.message
    });
  }
});

// ==========================================
// 🔐 LOGIN CON GOOGLE - VERSIÓN SIMPLE
// ==========================================

// Endpoint simplificado para login con Google (solo requiere datos del usuario)
app.post('/api/auth/google-login-simple', async (req, res) => {
  try {
    const { email, displayName, photoURL, googleId } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email es requerido'
      });
    }

    if (!auth || !db) {
      return res.status(500).json({
        success: false,
        message: 'Firebase no está configurado'
      });
    }

    console.log('🔐 [GOOGLE-LOGIN-SIMPLE] Login para:', email);

    let uid, userRecord, isNewUser = false;

    try {
      // Intentar obtener usuario existente por email
      userRecord = await auth.getUserByEmail(email);
      uid = userRecord.uid;
      console.log('✅ [GOOGLE-LOGIN-SIMPLE] Usuario encontrado:', uid);
      
      // Actualizar Firebase Auth con los datos más recientes de Google
      const authUpdateData = {};
      if (displayName && displayName !== userRecord.displayName) {
        authUpdateData.displayName = displayName;
      }
      if (photoURL && photoURL !== userRecord.photoURL) {
        authUpdateData.photoURL = photoURL;
      }
      
      // Si hay datos para actualizar en Auth
      if (Object.keys(authUpdateData).length > 0) {
        await auth.updateUser(uid, authUpdateData);
        console.log('✅ [GOOGLE-LOGIN-SIMPLE] Firebase Auth actualizado:', authUpdateData);
        // Recargar el userRecord para tener los datos actualizados
        userRecord = await auth.getUser(uid);
      }
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        // Crear nuevo usuario en Firebase Auth
        console.log('📝 [GOOGLE-LOGIN-SIMPLE] Creando nuevo usuario...');
        
        userRecord = await auth.createUser({
          email: email,
          displayName: displayName || '',
          photoURL: photoURL || '',
          emailVerified: true,
          disabled: false,
          providerData: [{
            providerId: 'google.com',
            uid: googleId || email,
            displayName: displayName || '',
            email: email,
            photoURL: photoURL || ''
          }]
        });
        
        uid = userRecord.uid;
        isNewUser = true;
        console.log('✅ [GOOGLE-LOGIN-SIMPLE] Usuario creado en Auth:', uid);
      } else {
        throw error;
      }
    }

    // Verificar/crear en Firestore
    const userDocRef = db.collection('users').doc(uid);
    const userDoc = await userDocRef.get();

    if (!userDoc.exists) {
      // Crear en Firestore
      const newUserData = {
        uid: uid,
        email: email,
        displayName: displayName || '',
        photoURL: photoURL || '',
        emailVerified: true,
        provider: 'google',
        googleId: googleId || '',
        gender: null,
        childrenCount: 0,
        isPregnant: false,
        gestationWeeks: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await userDocRef.set(newUserData);
      isNewUser = true;
      console.log('✅ [GOOGLE-LOGIN-SIMPLE] Usuario creado en Firestore');
    } else {
      // Actualizar última conexión y datos de Google (siempre sobrescribir con datos actuales)
      const updateData = {
        updatedAt: new Date(),
        lastLoginAt: new Date()
      };
      
      // Actualizar displayName si viene de Google
      if (displayName) {
        updateData.displayName = displayName;
      }
      
      // Actualizar photoURL si viene de Google
      if (photoURL) {
        updateData.photoURL = photoURL;
      }
      
      // Actualizar provider si no está establecido
      const currentData = userDoc.data();
      if (!currentData.provider || currentData.provider !== 'google') {
        updateData.provider = 'google';
      }
      
      // Actualizar googleId si viene
      if (googleId && (!currentData.googleId || currentData.googleId !== googleId)) {
        updateData.googleId = googleId;
      }
      
      await userDocRef.update(updateData);
      console.log('✅ [GOOGLE-LOGIN-SIMPLE] Usuario actualizado en Firestore:', updateData);
    }

    // Generar token personalizado
    const customToken = await auth.createCustomToken(uid);

    res.json({
      success: true,
      message: isNewUser ? 'Cuenta creada exitosamente' : 'Login exitoso',
      isNewUser: isNewUser,
      data: {
        uid: uid,
        email: email,
        displayName: displayName || '',
        photoURL: photoURL || '',
        emailVerified: true,
        customToken: customToken
      }
    });

  } catch (error) {
    console.error('❌ [GOOGLE-LOGIN-SIMPLE] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error en autenticación con Google',
      error: error.message
    });
  }
});

// ==========================================
// 🍎 LOGIN CON APPLE
// ==========================================

// Endpoint para login/registro con Apple
app.post('/api/auth/apple-login', async (req, res) => {
  try {
    const { identityToken, user, email, fullName, appleUserId } = req.body;

    console.log('🍎 [APPLE-LOGIN] Datos recibidos:', {
      hasIdentityToken: !!identityToken,
      hasEmail: !!email,
      hasFullName: !!fullName,
      hasUser: !!user,
      hasAppleUserId: !!appleUserId
    });

    // Apple User ID es requerido para identificar al usuario
    const appleId = user || appleUserId;
    
    if (!appleId) {
      return res.status(400).json({
        success: false,
        message: 'Apple User ID es requerido'
      });
    }

    if (!auth || !db) {
      return res.status(500).json({
        success: false,
        message: 'Firebase no está configurado'
      });
    }

    console.log('🍎 [APPLE-LOGIN] Iniciando login con Apple...');
    console.log('🍎 [APPLE-LOGIN] Apple ID:', appleId);
    console.log('🍎 [APPLE-LOGIN] Email:', email);
    console.log('🍎 [APPLE-LOGIN] Full Name:', fullName);

    let uid, userRecord, isNewUser = false;

    // Paso 1: Buscar usuario existente por Apple ID en Firestore
    console.log('🔍 [APPLE-LOGIN] Buscando usuario por Apple ID en Firestore...');
    
    const usersSnapshot = await db.collection('users')
      .where('appleUserId', '==', appleId)
      .limit(1)
      .get();
    
    if (!usersSnapshot.empty) {
      // Usuario existente encontrado
      const userDoc = usersSnapshot.docs[0];
      uid = userDoc.id;
      const userData = userDoc.data();
      console.log('✅ [APPLE-LOGIN] Usuario encontrado por Apple ID:', uid);
      
      // Obtener/recrear en Firebase Auth si es necesario
      try {
        userRecord = await auth.getUser(uid);
      } catch (authError) {
        console.log('⚠️ [APPLE-LOGIN] Usuario no existe en Auth, recreando...');
        userRecord = await auth.createUser({
          uid: uid,
          email: email || userData.email,
          displayName: userData.displayName || '',
          emailVerified: true
        });
      }
    } else {
      // Usuario nuevo - crear en Firebase Auth
      console.log('📝 [APPLE-LOGIN] Usuario nuevo, creando...');
      isNewUser = true;
      
      // Preparar displayName
      const displayName = fullName 
        ? (fullName.givenName && fullName.familyName
          ? `${fullName.givenName} ${fullName.familyName}`
          : fullName.givenName || fullName.familyName || '')
        : '';
      
      // Crear en Firebase Auth
      // Nota: Si no hay email, usar el Apple ID como identificador temporal
      const userEmail = email || `${appleId}@apple.privaterelay.com`;
      
      userRecord = await auth.createUser({
        email: userEmail,
        displayName: displayName,
        emailVerified: true, // Apple verifica los emails
        disabled: false
      });
      
      uid = userRecord.uid;
      console.log('✅ [APPLE-LOGIN] Usuario creado en Firebase Auth:', uid);
    }

    // Verificar/crear en Firestore
    const userDocRef = db.collection('users').doc(uid);
    const userDoc = await userDocRef.get();

    if (!userDoc.exists) {
      // Crear en Firestore
      const displayName = fullName 
        ? (fullName.givenName && fullName.familyName
          ? `${fullName.givenName} ${fullName.familyName}`
          : fullName.givenName || fullName.familyName || '')
        : userRecord.displayName || '';

      const newUserData = {
        uid: uid,
        email: email || userRecord.email,
        displayName: displayName,
        photoURL: null, // Apple no proporciona foto
        emailVerified: true,
        provider: 'apple',
        appleUserId: appleId, // Guardar el Apple ID
        gender: null,
        childrenCount: 0,
        isPregnant: false,
        gestationWeeks: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await userDocRef.set(newUserData);
      console.log('✅ [APPLE-LOGIN] Usuario creado en Firestore');
    } else {
      // Actualizar última conexión y datos de Apple
      const updateData = {
        updatedAt: new Date(),
        lastLoginAt: new Date()
      };
      
      // Actualizar displayName si viene de Apple (solo primera vez, Apple solo lo envía una vez)
      if (fullName) {
        const displayName = fullName.givenName && fullName.familyName
          ? `${fullName.givenName} ${fullName.familyName}`
          : fullName.givenName || fullName.familyName || '';
        
        if (displayName) {
          updateData.displayName = displayName;
        }
      }
      
      // Actualizar provider si no está establecido
      const currentData = userDoc.data();
      if (!currentData.provider || currentData.provider !== 'apple') {
        updateData.provider = 'apple';
      }
      
      // Actualizar appleUserId si no está o es diferente
      if (!currentData.appleUserId || currentData.appleUserId !== appleId) {
        updateData.appleUserId = appleId;
      }
      
      // Actualizar email si viene y no está
      if (email && (!currentData.email || currentData.email.includes('@apple.privaterelay.com'))) {
        updateData.email = email;
      }
      
      await userDocRef.update(updateData);
      console.log('✅ [APPLE-LOGIN] Usuario actualizado en Firestore:', updateData);
    }

    // Generar token personalizado
    const customToken = await auth.createCustomToken(uid);

    res.json({
      success: true,
      message: isNewUser ? 'Cuenta creada exitosamente' : 'Login exitoso',
      isNewUser: isNewUser,
      data: {
        uid: uid,
        email: email || userRecord.email,
        displayName: userRecord.displayName || '',
        photoURL: null,
        emailVerified: true,
        customToken: customToken
      }
    });

  } catch (error) {
    console.error('❌ [APPLE-LOGIN] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error en autenticación con Apple',
      error: error.message
    });
  }
});

// ==========================================
// 👑 ADMIN DASHBOARD - ENDPOINTS DE ADMINISTRACIÓN
// ==========================================

// Middleware para verificar que el usuario es admin
const isAdmin = async (req, res, next) => {
  try {
    const { uid } = req.user;
    
    // Obtener usuario de Firestore
    const userDoc = await db.collection('users').doc(uid).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }
    
    const userData = userDoc.data();
    
    // Verificar si es admin
    if (userData.role !== 'admin' && userData.isAdmin !== true) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos de administrador'
      });
    }
    
    next();
  } catch (error) {
    console.error('❌ [ADMIN] Error verificando permisos:', error);
    res.status(500).json({
      success: false,
      message: 'Error verificando permisos de administrador'
    });
  }
};

// ========== ESTADÍSTICAS GENERALES ==========

// Obtener estadísticas del dashboard
app.get('/api/admin/stats', authenticateToken, isAdmin, async (req, res) => {
  try {
    console.log('📊 [ADMIN] Obteniendo estadísticas...');

    // Contar usuarios
    const usersSnapshot = await db.collection('users').get();
    const totalUsers = usersSnapshot.size;
    
    // Usuarios activos (últimos 30 días)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const activeUsers = usersSnapshot.docs.filter(doc => {
      const data = doc.data();
      return data.lastLoginAt && data.lastLoginAt.toDate() > thirtyDaysAgo;
    }).length;

    // Contar hijos
    const childrenSnapshot = await db.collection('children').get();
    const totalChildren = childrenSnapshot.size;

    // Contar comunidades
    const communitiesSnapshot = await db.collection('communities').get();
    const totalCommunities = communitiesSnapshot.size;

    // Contar posts
    const postsSnapshot = await db.collection('posts').get();
    const totalPosts = postsSnapshot.size;

    // Contar listas
    const listsSnapshot = await db.collection('lists').get();
    const totalLists = listsSnapshot.size;

    // Posts de últimos 7 días
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentPosts = postsSnapshot.docs.filter(doc => {
      const data = doc.data();
      return data.createdAt && data.createdAt.toDate() > sevenDaysAgo;
    }).length;

    res.json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          active: activeUsers,
          inactive: totalUsers - activeUsers
        },
        children: {
          total: totalChildren
        },
        communities: {
          total: totalCommunities
        },
        posts: {
          total: totalPosts,
          lastWeek: recentPosts
        },
        lists: {
          total: totalLists
        }
      }
    });

  } catch (error) {
    console.error('❌ [ADMIN] Error obteniendo estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo estadísticas',
      error: error.message
    });
  }
});

// ========== GESTIÓN DE USUARIOS ==========

// Obtener todos los usuarios (con paginación)
app.get('/api/admin/users', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', orderBy = 'createdAt', order = 'desc' } = req.query;
    
    console.log('👥 [ADMIN] Obteniendo usuarios:', { page, limit, search, orderBy, order });

    let query = db.collection('users');

    // Aplicar ordenamiento
    query = query.orderBy(orderBy, order);

    // Obtener todos los documentos
    const snapshot = await query.get();
    
    // Filtrar por búsqueda si existe
    let users = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
      lastLoginAt: doc.data().lastLoginAt?.toDate()
    }));

    if (search) {
      const searchLower = search.toLowerCase();
      users = users.filter(user => 
        user.email?.toLowerCase().includes(searchLower) ||
        user.displayName?.toLowerCase().includes(searchLower)
      );
    }

    // Aplicar paginación manual
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedUsers = users.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: paginatedUsers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: users.length,
        totalPages: Math.ceil(users.length / limit)
      }
    });

  } catch (error) {
    console.error('❌ [ADMIN] Error obteniendo usuarios:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo usuarios',
      error: error.message
    });
  }
});

// Crear nuevo usuario administrador
app.post('/api/admin/users', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { email, password, displayName, role = 'admin', isAdmin: isAdminUser = true } = req.body;
    
    console.log('➕ [ADMIN] Creando nuevo usuario administrador:', email);

    // Validaciones
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email y contraseña son requeridos'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'La contraseña debe tener al menos 6 caracteres'
      });
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Email inválido'
      });
    }

    // Verificar si el email ya existe
    try {
      const existingUser = await auth.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'El email ya está registrado'
        });
      }
    } catch (error) {
      // Si no existe, continuar (esto es lo esperado)
      if (error.code !== 'auth/user-not-found') {
        throw error;
      }
    }

    // Crear usuario en Firebase Auth
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: displayName || email.split('@')[0],
      emailVerified: false
    });

    console.log('✅ [ADMIN] Usuario creado en Firebase Auth:', userRecord.uid);

    // Crear documento en Firestore
    const userData = {
      email,
      displayName: displayName || email.split('@')[0],
      role: role, // 'admin' por defecto
      isAdmin: isAdminUser, // true por defecto
      isActive: true,
      photoURL: null,
      childrenCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLoginAt: null
    };

    await db.collection('users').doc(userRecord.uid).set(userData);

    console.log('✅ [ADMIN] Usuario creado en Firestore');

    res.json({
      success: true,
      message: 'Usuario administrador creado exitosamente',
      data: {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userData.displayName,
        role: userData.role,
        isAdmin: userData.isAdmin,
        createdAt: userData.createdAt
      }
    });

  } catch (error) {
    console.error('❌ [ADMIN] Error creando usuario:', error);
    
    let errorMessage = 'Error creando usuario';
    if (error.code === 'auth/email-already-exists') {
      errorMessage = 'El email ya está registrado';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Email inválido';
    } else if (error.code === 'auth/weak-password') {
      errorMessage = 'La contraseña es muy débil';
    }

    res.status(500).json({
      success: false,
      message: errorMessage,
      error: error.message
    });
  }
});

// Obtener detalle de un usuario específico
app.get('/api/admin/users/:userId', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    
    console.log('👤 [ADMIN] Obteniendo detalle del usuario:', userId);

    // Obtener usuario de Firestore
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Obtener hijos del usuario
    const childrenSnapshot = await db.collection('children')
      .where('parentId', '==', userId)
      .get();
    
    const children = childrenSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Obtener comunidades del usuario
    const communitiesSnapshot = await db.collection('communities')
      .where('members', 'array-contains', userId)
      .get();
    
    const communities = communitiesSnapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name
    }));

    // Obtener posts del usuario
    const postsSnapshot = await db.collection('posts')
      .where('authorId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get();
    
    const posts = postsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json({
      success: true,
      data: {
        user: {
          id: userDoc.id,
          ...userDoc.data(),
          createdAt: userDoc.data().createdAt?.toDate(),
          updatedAt: userDoc.data().updatedAt?.toDate(),
          lastLoginAt: userDoc.data().lastLoginAt?.toDate()
        },
        children,
        communities,
        posts,
        stats: {
          childrenCount: children.length,
          communitiesCount: communities.length,
          postsCount: postsSnapshot.size
        }
      }
    });

  } catch (error) {
    console.error('❌ [ADMIN] Error obteniendo detalle del usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo detalle del usuario',
      error: error.message
    });
  }
});

// Actualizar usuario (admin puede modificar cualquier campo)
app.put('/api/admin/users/:userId', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const updates = req.body;
    
    console.log('✏️ [ADMIN] Actualizando usuario:', userId, updates);

    // Verificar que el usuario existe
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Preparar datos de actualización
    const updateData = {
      ...updates,
      updatedAt: new Date()
    };

    // No permitir actualizar ciertos campos críticos
    delete updateData.uid;
    delete updateData.createdAt;

    // Actualizar en Firestore
    await db.collection('users').doc(userId).update(updateData);

    // Si se actualiza el email o displayName, también actualizar en Firebase Auth
    if (updates.email || updates.displayName) {
      const authUpdates = {};
      if (updates.email) authUpdates.email = updates.email;
      if (updates.displayName) authUpdates.displayName = updates.displayName;
      
      try {
        await auth.updateUser(userId, authUpdates);
      } catch (authError) {
        console.log('⚠️ [ADMIN] No se pudo actualizar Firebase Auth:', authError.message);
      }
    }

    res.json({
      success: true,
      message: 'Usuario actualizado exitosamente',
      data: {
        id: userId,
        ...updateData
      }
    });

  } catch (error) {
    console.error('❌ [ADMIN] Error actualizando usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error actualizando usuario',
      error: error.message
    });
  }
});

// Desactivar/activar usuario
app.patch('/api/admin/users/:userId/toggle-active', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    
    console.log('🔄 [ADMIN] Cambiando estado del usuario:', userId);

    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    const currentState = userDoc.data().isActive !== false; // Por defecto true
    const newState = !currentState;

    // Actualizar en Firestore
    await db.collection('users').doc(userId).update({
      isActive: newState,
      updatedAt: new Date()
    });

    // Actualizar en Firebase Auth
    try {
      await auth.updateUser(userId, {
        disabled: !newState
      });
    } catch (authError) {
      console.log('⚠️ [ADMIN] No se pudo actualizar Firebase Auth:', authError.message);
    }

    res.json({
      success: true,
      message: `Usuario ${newState ? 'activado' : 'desactivado'} exitosamente`,
      data: {
        isActive: newState
      }
    });

  } catch (error) {
    console.error('❌ [ADMIN] Error cambiando estado del usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error cambiando estado del usuario',
      error: error.message
    });
  }
});

// Eliminar usuario (soft delete)
app.delete('/api/admin/users/:userId', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { permanent = false } = req.query;
    
    console.log('🗑️ [ADMIN] Eliminando usuario:', userId, 'Permanente:', permanent);

    if (permanent === 'true') {
      // Eliminación permanente
      await db.collection('users').doc(userId).delete();
      
      try {
        await auth.deleteUser(userId);
      } catch (authError) {
        console.log('⚠️ [ADMIN] No se pudo eliminar de Firebase Auth:', authError.message);
      }
      
      res.json({
        success: true,
        message: 'Usuario eliminado permanentemente'
      });
    } else {
      // Soft delete
      await db.collection('users').doc(userId).update({
        isActive: false,
        deletedAt: new Date(),
        updatedAt: new Date()
      });
      
      res.json({
        success: true,
        message: 'Usuario desactivado (soft delete)'
      });
    }

  } catch (error) {
    console.error('❌ [ADMIN] Error eliminando usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error eliminando usuario',
      error: error.message
    });
  }
});

// ========== GESTIÓN DE COMUNIDADES ==========

// Obtener todas las comunidades
app.get('/api/admin/communities', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    
    console.log('🏘️ [ADMIN] Obteniendo comunidades');

    const snapshot = await db.collection('communities')
      .orderBy('createdAt', 'desc')
      .get();
    
    let communities = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate()
    }));

    if (search) {
      const searchLower = search.toLowerCase();
      communities = communities.filter(comm => 
        comm.name?.toLowerCase().includes(searchLower) ||
        comm.description?.toLowerCase().includes(searchLower)
      );
    }

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedCommunities = communities.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: paginatedCommunities,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: communities.length,
        totalPages: Math.ceil(communities.length / limit)
      }
    });

  } catch (error) {
    console.error('❌ [ADMIN] Error obteniendo comunidades:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo comunidades',
      error: error.message
    });
  }
});

// Crear nueva comunidad
app.post('/api/admin/communities', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { name, description, imageUrl, isPrivate = false } = req.body;
    
    console.log('➕ [ADMIN] Creando nueva comunidad:', name);

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'El nombre de la comunidad es requerido'
      });
    }

    const communityData = {
      name,
      description: description || '',
      imageUrl: imageUrl || null,
      isPrivate,
      members: [req.user.uid], // El admin es el primer miembro
      createdBy: req.user.uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      memberCount: 1,
      postCount: 0
    };

    const communityRef = await db.collection('communities').add(communityData);

    res.json({
      success: true,
      message: 'Comunidad creada exitosamente',
      data: {
        id: communityRef.id,
        ...communityData
      }
    });

  } catch (error) {
    console.error('❌ [ADMIN] Error creando comunidad:', error);
    res.status(500).json({
      success: false,
      message: 'Error creando comunidad',
      error: error.message
    });
  }
});

// Editar comunidad
app.put('/api/admin/communities/:communityId', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { communityId } = req.params;
    const { name, description, imageUrl, isPrivate } = req.body;
    
    console.log('✏️ [ADMIN] Editando comunidad:', communityId);

    const communityRef = db.collection('communities').doc(communityId);
    const communityDoc = await communityRef.get();

    if (!communityDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Comunidad no encontrada'
      });
    }

    const updateData = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
    if (isPrivate !== undefined) updateData.isPrivate = isPrivate;

    await communityRef.update(updateData);

    res.json({
      success: true,
      message: 'Comunidad actualizada exitosamente',
      data: {
        id: communityId,
        ...communityDoc.data(),
        ...updateData
      }
    });

  } catch (error) {
    console.error('❌ [ADMIN] Error editando comunidad:', error);
    res.status(500).json({
      success: false,
      message: 'Error editando comunidad',
      error: error.message
    });
  }
});

// Obtener detalle de una comunidad específica con sus posts
app.get('/api/admin/communities/:communityId', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { communityId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    
    console.log('🏘️ [ADMIN] Obteniendo detalle de comunidad:', communityId);

    // Obtener datos de la comunidad
    const communityDoc = await db.collection('communities').doc(communityId).get();
    
    if (!communityDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Comunidad no encontrada'
      });
    }

    // Obtener posts de la comunidad
    const postsSnapshot = await db.collection('posts')
      .where('communityId', '==', communityId)
      .orderBy('createdAt', 'desc')
      .get();
    
    const allPosts = postsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate()
    }));

    // Paginación
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedPosts = allPosts.slice(startIndex, endIndex);

    // Obtener información de miembros
    const communityData = communityDoc.data();
    const memberCount = communityData.members?.length || 0;

    res.json({
      success: true,
      data: {
        community: {
          id: communityDoc.id,
          ...communityData,
          createdAt: communityData.createdAt?.toDate(),
          updatedAt: communityData.updatedAt?.toDate()
        },
        posts: paginatedPosts,
        stats: {
          totalPosts: allPosts.length,
          memberCount: memberCount
        },
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: allPosts.length,
          totalPages: Math.ceil(allPosts.length / limit)
        }
      }
    });

  } catch (error) {
    console.error('❌ [ADMIN] Error obteniendo detalle de comunidad:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo detalle de comunidad',
      error: error.message
    });
  }
});

// Obtener miembros de una comunidad
app.get('/api/admin/communities/:communityId/members', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { communityId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    
    console.log('👥 [ADMIN] Obteniendo miembros de comunidad:', communityId);

    // Obtener la comunidad
    const communityDoc = await db.collection('communities').doc(communityId).get();
    
    if (!communityDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Comunidad no encontrada'
      });
    }

    const communityData = communityDoc.data();
    const memberIds = communityData.members || [];

    if (memberIds.length === 0) {
      return res.json({
        success: true,
        data: [],
        pagination: {
          page: 1,
          limit: parseInt(limit),
          total: 0,
          totalPages: 0
        }
      });
    }

    // Obtener información detallada de cada miembro
    const memberPromises = memberIds.map(async (memberId) => {
      try {
        const userDoc = await db.collection('users').doc(memberId).get();
        if (userDoc.exists) {
          const userData = userDoc.data();
          return {
            id: userDoc.id,
            displayName: userData.displayName || 'Sin nombre',
            email: userData.email || null,
            photoURL: userData.photoURL || null,
            isActive: userData.isActive !== false,
            createdAt: userData.createdAt?.toDate(),
            lastLoginAt: userData.lastLoginAt?.toDate()
          };
        }
        return null;
      } catch (error) {
        console.error(`Error obteniendo usuario ${memberId}:`, error);
        return null;
      }
    });

    const allMembers = (await Promise.all(memberPromises)).filter(m => m !== null);

    // Ordenar por displayName
    allMembers.sort((a, b) => {
      const nameA = a.displayName?.toLowerCase() || '';
      const nameB = b.displayName?.toLowerCase() || '';
      return nameA.localeCompare(nameB);
    });

    // Paginación
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedMembers = allMembers.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: paginatedMembers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: allMembers.length,
        totalPages: Math.ceil(allMembers.length / limit)
      },
      communityInfo: {
        id: communityId,
        name: communityData.name,
        memberCount: allMembers.length
      }
    });

  } catch (error) {
    console.error('❌ [ADMIN] Error obteniendo miembros:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo miembros de la comunidad',
      error: error.message
    });
  }
});

// Eliminar comunidad
app.delete('/api/admin/communities/:communityId', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { communityId } = req.params;
    
    console.log('🗑️ [ADMIN] Eliminando comunidad:', communityId);

    await db.collection('communities').doc(communityId).delete();

    res.json({
      success: true,
      message: 'Comunidad eliminada exitosamente'
    });

  } catch (error) {
    console.error('❌ [ADMIN] Error eliminando comunidad:', error);
    res.status(500).json({
      success: false,
      message: 'Error eliminando comunidad',
      error: error.message
    });
  }
});

// ========== GESTIÓN DE HIJOS ==========

// Obtener todos los hijos
app.get('/api/admin/children', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    
    console.log('👶 [ADMIN] Obteniendo hijos');

    const snapshot = await db.collection('children')
      .orderBy('createdAt', 'desc')
      .get();
    
    let children = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
      registeredAt: doc.data().registeredAt?.toDate()
    }));

    // Filtrar por búsqueda si existe
    if (search) {
      const searchLower = search.toLowerCase();
      children = children.filter(child => 
        child.name?.toLowerCase().includes(searchLower) ||
        child.parentId?.toLowerCase().includes(searchLower)
      );
    }

    // Paginación
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedChildren = children.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: paginatedChildren,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: children.length,
        totalPages: Math.ceil(children.length / limit)
      }
    });

  } catch (error) {
    console.error('❌ [ADMIN] Error obteniendo hijos:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo hijos',
      error: error.message
    });
  }
});

// Obtener un hijo específico
app.get('/api/admin/children/:childId', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { childId } = req.params;
    
    console.log('👶 [ADMIN] Obteniendo hijo:', childId);

    const childDoc = await db.collection('children').doc(childId).get();
    
    if (!childDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Hijo no encontrado'
      });
    }

    const childData = childDoc.data();

    // Obtener información del padre
    let parentInfo = null;
    if (childData.parentId) {
      try {
        const parentDoc = await db.collection('users').doc(childData.parentId).get();
        if (parentDoc.exists) {
          const parentData = parentDoc.data();
          parentInfo = {
            uid: childData.parentId,
            displayName: parentData.displayName || 'Usuario',
            email: parentData.email,
            photoURL: parentData.photoURL || null
          };
        }
      } catch (error) {
        console.log('⚠️ [ADMIN] Error obteniendo info del padre:', childData.parentId);
      }
    }

    res.json({
      success: true,
      data: {
        id: childDoc.id,
        ...childData,
        parent: parentInfo,
        createdAt: childData.createdAt?.toDate(),
        updatedAt: childData.updatedAt?.toDate(),
        registeredAt: childData.registeredAt?.toDate()
      }
    });

  } catch (error) {
    console.error('❌ [ADMIN] Error obteniendo hijo:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo hijo',
      error: error.message
    });
  }
});

// Editar hijo (admin puede editar cualquier hijo)
app.put('/api/admin/children/:childId', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { childId } = req.params;
    const { name, ageInMonths, isUnborn, gestationWeeks, photoUrl } = req.body;
    
    console.log('✏️ [ADMIN] Editando hijo:', childId);

    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Base de datos no disponible'
      });
    }

    // Verificar que el hijo existe
    const childDoc = await db.collection('children').doc(childId).get();
    if (!childDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Hijo no encontrado'
      });
    }

    // Validaciones
    if (isUnborn && gestationWeeks && (gestationWeeks < 1 || gestationWeeks > 42)) {
      return res.status(400).json({
        success: false,
        message: 'Las semanas de gestación deben estar entre 1 y 42'
      });
    }

    if (isUnborn === false && ageInMonths !== undefined && ageInMonths < 0) {
      return res.status(400).json({
        success: false,
        message: 'La edad en meses debe ser mayor o igual a 0'
      });
    }

    const updateData = {
      updatedAt: new Date()
    };

    if (name !== undefined) updateData.name = name.trim();
    if (ageInMonths !== undefined) updateData.ageInMonths = isUnborn ? null : parseInt(ageInMonths);
    if (isUnborn !== undefined) updateData.isUnborn = isUnborn;
    if (gestationWeeks !== undefined) updateData.gestationWeeks = isUnborn ? parseInt(gestationWeeks) : null;
    if (photoUrl !== undefined) updateData.photoUrl = photoUrl;

    // Limpiar campos según el estado
    if (isUnborn) {
      updateData.ageInMonths = null;
    } else {
      updateData.gestationWeeks = null;
    }

    await db.collection('children').doc(childId).update(updateData);

    res.json({
      success: true,
      message: 'Hijo actualizado exitosamente',
      data: {
        id: childId,
        ...childDoc.data(),
        ...updateData
      }
    });

  } catch (error) {
    console.error('❌ [ADMIN] Error editando hijo:', error);
    res.status(500).json({
      success: false,
      message: 'Error editando hijo',
      error: error.message
    });
  }
});

// Eliminar hijo (admin puede eliminar cualquier hijo)
app.delete('/api/admin/children/:childId', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { childId } = req.params;
    
    console.log('🗑️ [ADMIN] Eliminando hijo:', childId);

    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Base de datos no disponible'
      });
    }

    // Verificar que el hijo existe
    const childDoc = await db.collection('children').doc(childId).get();
    if (!childDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Hijo no encontrado'
      });
    }

    const childData = childDoc.data();
    const parentId = childData.parentId;

    // Eliminar el hijo
    await db.collection('children').doc(childId).delete();

    // Actualizar el contador de hijos del padre (solo si el padre existe)
    if (parentId) {
      try {
        // Verificar que el usuario padre existe
        const parentDoc = await db.collection('users').doc(parentId).get();
        
        if (parentDoc.exists) {
          const childrenSnapshot = await db.collection('children')
            .where('parentId', '==', parentId)
            .get();
          
          const actualChildrenCount = childrenSnapshot.size;
          
          await db.collection('users').doc(parentId).update({
            childrenCount: actualChildrenCount,
            updatedAt: new Date()
          });
          
          console.log(`✅ [ADMIN] Contador de hijos actualizado para usuario ${parentId}: ${actualChildrenCount}`);
        } else {
          console.log(`⚠️ [ADMIN] Usuario padre ${parentId} no encontrado, no se actualizará el contador`);
        }
      } catch (updateError) {
        // Si falla la actualización del padre, solo lo registramos pero no fallamos la operación
        console.error('⚠️ [ADMIN] Error actualizando contador del padre:', updateError.message);
      }
    }

    res.json({
      success: true,
      message: 'Hijo eliminado exitosamente'
    });

  } catch (error) {
    console.error('❌ [ADMIN] Error eliminando hijo:', error);
    res.status(500).json({
      success: false,
      message: 'Error eliminando hijo',
      error: error.message
    });
  }
});

// ========== GESTIÓN DE POSTS ==========

// Obtener todos los posts
app.get('/api/admin/posts', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    console.log('📝 [ADMIN] Obteniendo posts');

    const snapshot = await db.collection('posts')
      .orderBy('createdAt', 'desc')
      .get();
    
    const posts = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate()
    }));

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedPosts = posts.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: paginatedPosts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: posts.length,
        totalPages: Math.ceil(posts.length / limit)
      }
    });

  } catch (error) {
    console.error('❌ [ADMIN] Error obteniendo posts:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo posts',
      error: error.message
    });
  }
});

// Crear nuevo post
app.post('/api/admin/posts', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { content, imageUrl, communityId } = req.body;
    
    console.log('➕ [ADMIN] Creando nuevo post');

    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'El contenido del post es requerido'
      });
    }

    if (!communityId) {
      return res.status(400).json({
        success: false,
        message: 'El ID de la comunidad es requerido'
      });
    }

    // Verificar que la comunidad existe
    const communityDoc = await db.collection('communities').doc(communityId).get();
    if (!communityDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Comunidad no encontrada'
      });
    }

    const postData = {
      content,
      authorId: req.user.uid,
      communityId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      likes: [],
      commentCount: 0
    };

    // Solo agregar imageUrl si se proporciona
    if (imageUrl) {
      postData.imageUrl = imageUrl;
    }

    const postRef = await db.collection('posts').add(postData);

    // Incrementar el contador de posts en la comunidad
    await db.collection('communities').doc(communityId).update({
      postCount: admin.firestore.FieldValue.increment(1)
    });

    res.json({
      success: true,
      message: 'Post creado exitosamente',
      data: {
        id: postRef.id,
        ...postData
      }
    });

  } catch (error) {
    console.error('❌ [ADMIN] Error creando post:', error);
    res.status(500).json({
      success: false,
      message: 'Error creando post',
      error: error.message
    });
  }
});

// Editar post
app.put('/api/admin/posts/:postId', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { postId } = req.params;
    const { content, imageUrl } = req.body;
    
    console.log('✏️ [ADMIN] Editando post:', postId);

    const postRef = db.collection('posts').doc(postId);
    const postDoc = await postRef.get();

    if (!postDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Post no encontrado'
      });
    }

    const updateData = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    if (content !== undefined) updateData.content = content;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;

    await postRef.update(updateData);

    res.json({
      success: true,
      message: 'Post actualizado exitosamente',
      data: {
        id: postId,
        ...postDoc.data(),
        ...updateData
      }
    });

  } catch (error) {
    console.error('❌ [ADMIN] Error editando post:', error);
    res.status(500).json({
      success: false,
      message: 'Error editando post',
      error: error.message
    });
  }
});

// Eliminar post
app.delete('/api/admin/posts/:postId', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { postId } = req.params;
    
    console.log('🗑️ [ADMIN] Eliminando post:', postId);

    await db.collection('posts').doc(postId).delete();

    res.json({
      success: true,
      message: 'Post eliminado exitosamente'
    });

  } catch (error) {
    console.error('❌ [ADMIN] Error eliminando post:', error);
    res.status(500).json({
      success: false,
      message: 'Error eliminando post',
      error: error.message
    });
  }
});

// Obtener comentarios de un post
app.get('/api/admin/posts/:postId/comments', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { postId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    
    console.log('💬 [ADMIN] Obteniendo comentarios del post:', postId);

    // Obtener todos los comentarios del post
    const commentsSnapshot = await db.collection('comments')
      .where('postId', '==', postId)
      .get();

    const comments = [];
    for (const doc of commentsSnapshot.docs) {
      const data = doc.data();
      
      // Obtener información del autor del comentario
      let authorInfo = null;
      try {
        const userDoc = await db.collection('users').doc(data.authorId).get();
        if (userDoc.exists) {
          const userData = userDoc.data();
          authorInfo = {
            displayName: userData.displayName || 'Usuario',
            email: userData.email,
            photoURL: userData.photoURL || null
          };
        }
      } catch (error) {
        console.log('⚠️ [ADMIN] Error obteniendo info del autor:', data.authorId);
        authorInfo = {
          displayName: 'Usuario',
          email: null,
          photoURL: null
        };
      }

      comments.push({
        id: doc.id,
        postId: data.postId,
        authorId: data.authorId,
        author: authorInfo,
        content: data.content,
        likeCount: data.likeCount || 0,
        likes: data.likes || [],
        createdAt: data.createdAt
      });
    }

    // Ordenar por fecha (más recientes primero)
    comments.sort((a, b) => {
      const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt);
      const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt);
      return dateB - dateA;
    });

    // Paginación
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedComments = comments.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: paginatedComments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: comments.length,
        totalPages: Math.ceil(comments.length / limit)
      }
    });

  } catch (error) {
    console.error('❌ [ADMIN] Error obteniendo comentarios del post:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo comentarios',
      error: error.message
    });
  }
});

// Obtener likes de un post
app.get('/api/admin/posts/:postId/likes', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { postId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    
    console.log('❤️ [ADMIN] Obteniendo likes del post:', postId);

    // Obtener el post
    const postDoc = await db.collection('posts').doc(postId).get();
    
    if (!postDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Post no encontrado'
      });
    }

    const postData = postDoc.data();
    const likes = postData.likes || [];
    const likeCount = postData.likeCount || 0;

    console.log('📊 [ADMIN] Total likes:', likeCount);

    // Obtener información de los usuarios que dieron like
    const likesWithUserInfo = [];
    for (const userId of likes) {
      try {
        const userDoc = await db.collection('users').doc(userId).get();
        if (userDoc.exists) {
          const userData = userDoc.data();
          likesWithUserInfo.push({
            userId: userId,
            displayName: userData.displayName || 'Usuario',
            email: userData.email,
            photoURL: userData.photoURL || null
          });
        } else {
          likesWithUserInfo.push({
            userId: userId,
            displayName: 'Usuario desconocido',
            email: null,
            photoURL: null
          });
        }
      } catch (error) {
        console.log('⚠️ [ADMIN] Error obteniendo info del usuario:', userId);
        likesWithUserInfo.push({
          userId: userId,
          displayName: 'Usuario',
          email: null,
          photoURL: null
        });
      }
    }

    // Paginación
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedLikes = likesWithUserInfo.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: paginatedLikes,
      stats: {
        totalLikes: likeCount
      },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: likesWithUserInfo.length,
        totalPages: Math.ceil(likesWithUserInfo.length / limit)
      }
    });

  } catch (error) {
    console.error('❌ [ADMIN] Error obteniendo likes del post:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo likes',
      error: error.message
    });
  }
});

// Eliminar comentario de un post
app.delete('/api/admin/posts/:postId/comments/:commentId', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    
    console.log('🗑️ [ADMIN] Eliminando comentario:', commentId, 'del post:', postId);

    // Eliminar el comentario
    await db.collection('comments').doc(commentId).delete();

    // Decrementar el contador de comentarios en el post
    const postRef = db.collection('posts').doc(postId);
    await postRef.update({
      commentCount: admin.firestore.FieldValue.increment(-1)
    });

    res.json({
      success: true,
      message: 'Comentario eliminado exitosamente'
    });

  } catch (error) {
    console.error('❌ [ADMIN] Error eliminando comentario:', error);
    res.status(500).json({
      success: false,
      message: 'Error eliminando comentario',
      error: error.message
    });
  }
});

// ========== GESTIÓN DE CATEGORÍAS ==========

// ===== ENDPOINTS PARA LA APP (SOLO LECTURA) =====

// Obtener todas las categorías activas (para la app)
app.get('/api/categories', authenticateToken, async (req, res) => {
  try {
    console.log('📂 [APP] Obteniendo categorías');

    const snapshot = await db.collection('categories')
      .where('isActive', '==', true)
      .orderBy('order', 'asc')
      .get();

    const categories = snapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name,
      description: doc.data().description,
      imageUrl: doc.data().imageUrl,
      order: doc.data().order,
      icon: doc.data().icon
    }));

    res.json({
      success: true,
      data: categories
    });

  } catch (error) {
    console.error('❌ [APP] Error obteniendo categorías:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo categorías',
      error: error.message
    });
  }
});

// Obtener una categoría específica (para la app)
app.get('/api/categories/:categoryId', authenticateToken, async (req, res) => {
  try {
    const { categoryId } = req.params;
    
    console.log('📂 [APP] Obteniendo categoría:', categoryId);

    const categoryDoc = await db.collection('categories').doc(categoryId).get();

    if (!categoryDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Categoría no encontrada'
      });
    }

    const categoryData = categoryDoc.data();

    if (!categoryData.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Categoría no disponible'
      });
    }

    res.json({
      success: true,
      data: {
        id: categoryDoc.id,
        name: categoryData.name,
        description: categoryData.description,
        imageUrl: categoryData.imageUrl,
        order: categoryData.order,
        icon: categoryData.icon
      }
    });

  } catch (error) {
    console.error('❌ [APP] Error obteniendo categoría:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo categoría',
      error: error.message
    });
  }
});

// ===== ENDPOINTS ADMIN (CRUD COMPLETO) =====

// Obtener todas las categorías (admin)
app.get('/api/admin/categories', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    
    console.log('📂 [ADMIN] Obteniendo categorías');

    const snapshot = await db.collection('categories')
      .orderBy('order', 'asc')
      .get();

    let categories = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate()
    }));

    // Filtrar por búsqueda si existe
    if (search) {
      const searchLower = search.toLowerCase();
      categories = categories.filter(category => 
        category.name?.toLowerCase().includes(searchLower) ||
        category.description?.toLowerCase().includes(searchLower)
      );
    }

    // Paginación
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedCategories = categories.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: paginatedCategories,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: categories.length,
        totalPages: Math.ceil(categories.length / limit)
      }
    });

  } catch (error) {
    console.error('❌ [ADMIN] Error obteniendo categorías:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo categorías',
      error: error.message
    });
  }
});

// Obtener una categoría específica (admin)
app.get('/api/admin/categories/:categoryId', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { categoryId } = req.params;
    
    console.log('📂 [ADMIN] Obteniendo categoría:', categoryId);

    const categoryDoc = await db.collection('categories').doc(categoryId).get();

    if (!categoryDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Categoría no encontrada'
      });
    }

    const categoryData = categoryDoc.data();

    res.json({
      success: true,
      data: {
        id: categoryDoc.id,
        ...categoryData,
        createdAt: categoryData.createdAt?.toDate(),
        updatedAt: categoryData.updatedAt?.toDate()
      }
    });

  } catch (error) {
    console.error('❌ [ADMIN] Error obteniendo categoría:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo categoría',
      error: error.message
    });
  }
});

// Crear nueva categoría (admin)
app.post('/api/admin/categories', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { name, description, imageUrl, icon, order, isActive = true } = req.body;
    
    console.log('➕ [ADMIN] Creando nueva categoría:', name);

    // Validaciones
    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'El nombre de la categoría es requerido'
      });
    }

    // Si no se proporciona orden, obtener el siguiente número
    let categoryOrder = order;
    if (categoryOrder === undefined || categoryOrder === null) {
      const snapshot = await db.collection('categories').get();
      categoryOrder = snapshot.size;
    }

    const categoryData = {
      name: name.trim(),
      description: description ? description.trim() : '',
      imageUrl: imageUrl || null,
      icon: icon || null,
      order: parseInt(categoryOrder),
      isActive: isActive === true || isActive === 'true',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const categoryRef = await db.collection('categories').add(categoryData);

    console.log('✅ [ADMIN] Categoría creada:', categoryRef.id);

    res.json({
      success: true,
      message: 'Categoría creada exitosamente',
      data: {
        id: categoryRef.id,
        ...categoryData
      }
    });

  } catch (error) {
    console.error('❌ [ADMIN] Error creando categoría:', error);
    res.status(500).json({
      success: false,
      message: 'Error creando categoría',
      error: error.message
    });
  }
});

// Actualizar categoría (admin)
app.put('/api/admin/categories/:categoryId', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { name, description, imageUrl, icon, order, isActive } = req.body;
    
    console.log('✏️ [ADMIN] Actualizando categoría:', categoryId);

    const categoryRef = db.collection('categories').doc(categoryId);
    const categoryDoc = await categoryRef.get();

    if (!categoryDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Categoría no encontrada'
      });
    }

    const updateData = {
      updatedAt: new Date()
    };

    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description.trim();
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
    if (icon !== undefined) updateData.icon = icon;
    if (order !== undefined) updateData.order = parseInt(order);
    if (isActive !== undefined) updateData.isActive = isActive === true || isActive === 'true';

    await categoryRef.update(updateData);

    console.log('✅ [ADMIN] Categoría actualizada');

    res.json({
      success: true,
      message: 'Categoría actualizada exitosamente',
      data: {
        id: categoryId,
        ...categoryDoc.data(),
        ...updateData
      }
    });

  } catch (error) {
    console.error('❌ [ADMIN] Error actualizando categoría:', error);
    res.status(500).json({
      success: false,
      message: 'Error actualizando categoría',
      error: error.message
    });
  }
});

// Eliminar categoría (admin)
app.delete('/api/admin/categories/:categoryId', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { categoryId } = req.params;
    
    console.log('🗑️ [ADMIN] Eliminando categoría:', categoryId);

    const categoryDoc = await db.collection('categories').doc(categoryId).get();

    if (!categoryDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Categoría no encontrada'
      });
    }

    await db.collection('categories').doc(categoryId).delete();

    console.log('✅ [ADMIN] Categoría eliminada');

    res.json({
      success: true,
      message: 'Categoría eliminada exitosamente'
    });

  } catch (error) {
    console.error('❌ [ADMIN] Error eliminando categoría:', error);
    res.status(500).json({
      success: false,
      message: 'Error eliminando categoría',
      error: error.message
    });
  }
});

// Reordenar categorías (admin)
app.patch('/api/admin/categories/reorder', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { categories } = req.body; // Array de { id, order }
    
    console.log('🔄 [ADMIN] Reordenando categorías');

    if (!Array.isArray(categories)) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere un array de categorías'
      });
    }

    const batch = db.batch();

    categories.forEach(({ id, order }) => {
      const categoryRef = db.collection('categories').doc(id);
      batch.update(categoryRef, { 
        order: parseInt(order),
        updatedAt: new Date()
      });
    });

    await batch.commit();

    console.log('✅ [ADMIN] Categorías reordenadas:', categories.length);

    res.json({
      success: true,
      message: 'Categorías reordenadas exitosamente'
    });

  } catch (error) {
    console.error('❌ [ADMIN] Error reordenando categorías:', error);
    res.status(500).json({
      success: false,
      message: 'Error reordenando categorías',
      error: error.message
    });
  }
});

// ========== GESTIÓN DE LISTAS ==========

// Obtener todas las listas
app.get('/api/admin/lists', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    
    console.log('📋 [ADMIN] Obteniendo listas');

    const snapshot = await db.collection('lists')
      .orderBy('createdAt', 'desc')
      .get();
    
    // Obtener información de los usuarios dueños de las listas
    const listsWithOwners = await Promise.all(snapshot.docs.map(async (doc) => {
      const listData = doc.data();
      let ownerInfo = null;

      // Buscar el dueño usando userId o creatorId (compatibilidad con ambos formatos)
      const ownerId = listData.userId || listData.creatorId;

      if (ownerId) {
        try {
          const userDoc = await db.collection('users').doc(ownerId).get();
          if (userDoc.exists) {
            const userData = userDoc.data();
            ownerInfo = {
              id: userDoc.id,
              displayName: userData.displayName || 'Usuario sin nombre',
              email: userData.email || null
            };
          }
        } catch (error) {
          console.error(`Error obteniendo usuario ${ownerId}:`, error);
        }
      }

      return {
        id: doc.id,
        ...listData,
        owner: ownerInfo,
        createdAt: listData.createdAt?.toDate(),
        updatedAt: listData.updatedAt?.toDate()
      };
    }));

    // Filtrar por búsqueda si existe
    let lists = listsWithOwners;
    if (search) {
      const searchLower = search.toLowerCase();
      lists = listsWithOwners.filter(list => 
        list.title?.toLowerCase().includes(searchLower) ||
        list.description?.toLowerCase().includes(searchLower) ||
        list.owner?.displayName?.toLowerCase().includes(searchLower) ||
        list.owner?.email?.toLowerCase().includes(searchLower)
      );
    }

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedLists = lists.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: paginatedLists,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: lists.length,
        totalPages: Math.ceil(lists.length / limit)
      }
    });

  } catch (error) {
    console.error('❌ [ADMIN] Error obteniendo listas:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo listas',
      error: error.message
    });
  }
});

// Obtener detalle de una lista específica
app.get('/api/admin/lists/:listId', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { listId } = req.params;
    
    console.log('📋 [ADMIN] Obteniendo detalle de lista:', listId);

    const listDoc = await db.collection('lists').doc(listId).get();
    
    if (!listDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Lista no encontrada'
      });
    }

    const listData = listDoc.data();
    let ownerInfo = null;

    // Obtener información del dueño (compatibilidad con userId y creatorId)
    const ownerId = listData.userId || listData.creatorId;

    if (ownerId) {
      try {
        const userDoc = await db.collection('users').doc(ownerId).get();
        if (userDoc.exists) {
          const userData = userDoc.data();
          ownerInfo = {
            id: userDoc.id,
            displayName: userData.displayName || 'Usuario sin nombre',
            email: userData.email || null,
            photoURL: userData.photoURL || null
          };
        }
      } catch (error) {
        console.error(`Error obteniendo usuario ${ownerId}:`, error);
      }
    }

    res.json({
      success: true,
      data: {
        id: listDoc.id,
        ...listData,
        owner: ownerInfo,
        createdAt: listData.createdAt?.toDate(),
        updatedAt: listData.updatedAt?.toDate()
      }
    });

  } catch (error) {
    console.error('❌ [ADMIN] Error obteniendo detalle de lista:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo detalle de lista',
      error: error.message
    });
  }
});

// Crear nueva lista
app.post('/api/admin/lists', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { title, description, items = [], isPublic = true, imageUrl } = req.body;
    
    console.log('➕ [ADMIN] Creando nueva lista:', title);

    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'El título de la lista es requerido'
      });
    }

    // Procesar items con estructura completa
    const processedItems = items.map((item, index) => ({
      id: item.id || `item_${Date.now()}_${index}`,
      text: item.text ? item.text.trim() : '',
      imageUrl: item.imageUrl || null,
      priority: item.priority || 'medium',
      details: item.details || '',
      brand: item.brand || '',
      store: item.store || '',
      approximatePrice: item.approximatePrice || null,
      completed: item.completed || false,
      createdAt: item.createdAt || new Date()
    }));

    const listData = {
      title: title.trim(),
      description: description ? description.trim() : '',
      imageUrl: imageUrl || null,
      items: processedItems,
      isPublic,
      userId: req.user.uid,
      creatorId: req.user.uid, // Agregar también creatorId para compatibilidad
      completedItems: processedItems.filter(item => item.completed).length,
      totalItems: processedItems.length,
      stars: 0,
      comments: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const listRef = await db.collection('lists').add(listData);

    console.log('✅ [ADMIN] Lista creada con', processedItems.length, 'items');

    res.json({
      success: true,
      message: 'Lista creada exitosamente',
      data: {
        id: listRef.id,
        ...listData
      }
    });

  } catch (error) {
    console.error('❌ [ADMIN] Error creando lista:', error);
    res.status(500).json({
      success: false,
      message: 'Error creando lista',
      error: error.message
    });
  }
});

// Editar lista
app.put('/api/admin/lists/:listId', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { listId } = req.params;
    const { title, description, items, isPublic, imageUrl } = req.body;
    
    console.log('✏️ [ADMIN] Editando lista:', listId);

    const listRef = db.collection('lists').doc(listId);
    const listDoc = await listRef.get();

    if (!listDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Lista no encontrada'
      });
    }

    const oldListData = listDoc.data();
    const updateData = {
      updatedAt: new Date()
    };

    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description.trim();
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
    if (isPublic !== undefined) updateData.isPublic = isPublic;
    
    // Si se están actualizando los items, procesarlos con estructura completa
    if (items !== undefined) {
      const oldItems = oldListData.items || [];
      const itemIdMapping = {}; // Mapeo de itemId viejo -> itemId nuevo
      
      const processedItems = items.map((item, index) => {
        // Si el item ya tiene un ID, conservarlo sin cambios
        if (item.id) {
          return {
            id: item.id, // Mantener el ID existente
            text: item.text ? item.text.trim() : '',
            imageUrl: item.imageUrl || null,
            priority: item.priority || 'medium',
            details: item.details || '',
            brand: item.brand || '',
            store: item.store || '',
            approximatePrice: item.approximatePrice || null,
            completed: item.completed || false,
            createdAt: item.createdAt || new Date()
          };
        }
        
        // Si no tiene ID, intentar encontrar el item anterior por texto
        const newItemId = `item_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`;
        
        if (item.text) {
          const oldItem = oldItems.find(old => 
            old.text && old.text.toLowerCase().trim() === item.text.toLowerCase().trim()
          );
          
          if (oldItem && oldItem.id) {
            // Usar el ID del item anterior si se encuentra por texto
            console.log(`🔗 [ADMIN] Reutilizando itemId existente: ${oldItem.id} para "${item.text}"`);
            return {
              id: oldItem.id, // Reutilizar ID existente
              text: item.text.trim(),
              imageUrl: item.imageUrl || null,
              priority: item.priority || 'medium',
              details: item.details || '',
              brand: item.brand || '',
              store: item.store || '',
              approximatePrice: item.approximatePrice || null,
              completed: item.completed || false,
              createdAt: item.createdAt || oldItem.createdAt || new Date()
            };
          }
        }
        
        // Generar nuevo ID solo si es un item completamente nuevo
        console.log(`✨ [ADMIN] Generando nuevo itemId: ${newItemId} para "${item.text}"`);
        return {
          id: newItemId,
          text: item.text ? item.text.trim() : '',
          imageUrl: item.imageUrl || null,
          priority: item.priority || 'medium',
          details: item.details || '',
          brand: item.brand || '',
          store: item.store || '',
          approximatePrice: item.approximatePrice || null,
          completed: item.completed || false,
          createdAt: item.createdAt || new Date()
        };
      });
      
      updateData.items = processedItems;
      updateData.completedItems = processedItems.filter(item => item.completed).length;
      updateData.totalItems = processedItems.length;
      
      console.log('✅ [ADMIN] Items procesados:', processedItems.length);
      
      // Actualizar itemId en comentarios y ratings si hay mapeos
      if (Object.keys(itemIdMapping).length > 0) {
        console.log('🔄 [ADMIN] Actualizando itemIds en comentarios y ratings...');
        
        // Actualizar comentarios
        const commentsSnapshot = await db.collection('listComments')
          .where('listId', '==', listId)
          .get();
        
        const commentUpdates = [];
        commentsSnapshot.forEach(doc => {
          const oldItemId = doc.data().itemId;
          if (itemIdMapping[oldItemId]) {
            commentUpdates.push(
              doc.ref.update({ itemId: itemIdMapping[oldItemId] })
            );
            console.log(`  ✓ Comentario ${doc.id}: ${oldItemId} -> ${itemIdMapping[oldItemId]}`);
          }
        });
        
        // Actualizar ratings
        const ratingsSnapshot = await db.collection('itemRatings')
          .where('listId', '==', listId)
          .get();
        
        const ratingUpdates = [];
        ratingsSnapshot.forEach(doc => {
          const oldItemId = doc.data().itemId;
          if (itemIdMapping[oldItemId]) {
            ratingUpdates.push(
              doc.ref.update({ itemId: itemIdMapping[oldItemId] })
            );
            console.log(`  ✓ Rating ${doc.id}: ${oldItemId} -> ${itemIdMapping[oldItemId]}`);
          }
        });
        
        // Ejecutar todas las actualizaciones
        await Promise.all([...commentUpdates, ...ratingUpdates]);
        console.log(`✅ [ADMIN] Actualizados ${commentUpdates.length} comentarios y ${ratingUpdates.length} ratings`);
      }
    }

    await listRef.update(updateData);

    res.json({
      success: true,
      message: 'Lista actualizada exitosamente',
      data: {
        id: listId,
        ...listDoc.data(),
        ...updateData
      }
    });

  } catch (error) {
    console.error('❌ [ADMIN] Error editando lista:', error);
    res.status(500).json({
      success: false,
      message: 'Error editando lista',
      error: error.message
    });
  }
});

// Endpoint para sincronizar itemIds en comentarios y ratings con los items actuales de la lista
app.post('/api/admin/lists/:listId/sync-item-ids', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { listId } = req.params;
    
    console.log('🔄 [ADMIN] Sincronizando itemIds para lista:', listId);

    // Obtener la lista
    const listDoc = await db.collection('lists').doc(listId).get();
    if (!listDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Lista no encontrada'
      });
    }

    const listData = listDoc.data();
    const currentItems = listData.items || [];
    
    if (currentItems.length === 0) {
      return res.json({
        success: true,
        message: 'La lista no tiene items',
        data: {
          commentsUpdated: 0,
          ratingsUpdated: 0
        }
      });
    }

    // Crear mapeo de texto -> itemId actual
    const textToIdMap = {};
    currentItems.forEach(item => {
      if (item.text && item.id) {
        const normalizedText = item.text.toLowerCase().trim();
        textToIdMap[normalizedText] = item.id;
      }
    });

    console.log('📋 [ADMIN] Items encontrados:', currentItems.length);
    console.log('🗺️ [ADMIN] Mapeo de texto a ID:', Object.keys(textToIdMap).length);

    // Obtener todos los comentarios de esta lista
    const commentsSnapshot = await db.collection('listComments')
      .where('listId', '==', listId)
      .get();

    // Obtener todos los ratings de esta lista
    const ratingsSnapshot = await db.collection('itemRatings')
      .where('listId', '==', listId)
      .get();

    console.log('💬 [ADMIN] Comentarios encontrados:', commentsSnapshot.size);
    console.log('⭐ [ADMIN] Ratings encontrados:', ratingsSnapshot.size);

    const commentUpdates = [];
    const ratingUpdates = [];
    let commentsUpdated = 0;
    let ratingsUpdated = 0;

    // Actualizar comentarios
    for (const doc of commentsSnapshot.docs) {
      const commentData = doc.data();
      const currentItemId = commentData.itemId;
      
      // Buscar el item actual por su ID antiguo
      const matchingItem = currentItems.find(item => {
        // Intentar match por texto
        if (commentData.itemId && item.text) {
          // Buscar el item por itemId en el texto normalizado
          const normalizedText = item.text.toLowerCase().trim();
          return textToIdMap[normalizedText] && item.id !== currentItemId;
        }
        return false;
      });

      // Si encontramos un item que coincide por texto pero tiene diferente ID
      if (matchingItem && matchingItem.id !== currentItemId) {
        commentUpdates.push(
          doc.ref.update({ itemId: matchingItem.id })
            .then(() => {
              console.log(`  ✓ Comentario ${doc.id}: ${currentItemId} -> ${matchingItem.id}`);
              commentsUpdated++;
            })
        );
      }
    }

    // Actualizar ratings
    for (const doc of ratingsSnapshot.docs) {
      const ratingData = doc.data();
      const currentItemId = ratingData.itemId;
      
      // Buscar el item actual
      const matchingItem = currentItems.find(item => {
        if (ratingData.itemId && item.text) {
          const normalizedText = item.text.toLowerCase().trim();
          return textToIdMap[normalizedText] && item.id !== currentItemId;
        }
        return false;
      });

      if (matchingItem && matchingItem.id !== currentItemId) {
        ratingUpdates.push(
          doc.ref.update({ itemId: matchingItem.id })
            .then(() => {
              console.log(`  ✓ Rating ${doc.id}: ${currentItemId} -> ${matchingItem.id}`);
              ratingsUpdated++;
            })
        );
      }
    }

    // Ejecutar todas las actualizaciones
    await Promise.all([...commentUpdates, ...ratingUpdates]);

    console.log(`✅ [ADMIN] Sincronización completada: ${commentsUpdated} comentarios, ${ratingsUpdated} ratings`);

    res.json({
      success: true,
      message: 'ItemIds sincronizados exitosamente',
      data: {
        totalItems: currentItems.length,
        totalComments: commentsSnapshot.size,
        totalRatings: ratingsSnapshot.size,
        commentsUpdated,
        ratingsUpdated
      }
    });

  } catch (error) {
    console.error('❌ [ADMIN] Error sincronizando itemIds:', error);
    res.status(500).json({
      success: false,
      message: 'Error sincronizando itemIds',
      error: error.message
    });
  }
});

// Endpoint para sincronizar TODAS las listas (migración masiva)
app.post('/api/admin/lists/sync-all-item-ids', authenticateToken, isAdmin, async (req, res) => {
  try {
    console.log('🔄 [ADMIN] Sincronizando itemIds para TODAS las listas...');

    // Obtener todas las listas
    const listsSnapshot = await db.collection('lists').get();
    
    console.log('📋 [ADMIN] Total listas:', listsSnapshot.size);

    const results = [];
    
    for (const listDoc of listsSnapshot.docs) {
      const listId = listDoc.id;
      const listData = listDoc.data();
      const currentItems = listData.items || [];
      
      if (currentItems.length === 0) continue;

      // Crear mapeo de texto -> itemId actual
      const textToIdMap = {};
      currentItems.forEach(item => {
        if (item.text && item.id) {
          const normalizedText = item.text.toLowerCase().trim();
          textToIdMap[normalizedText] = item.id;
        }
      });

      // Obtener comentarios y ratings de esta lista
      const [commentsSnapshot, ratingsSnapshot] = await Promise.all([
        db.collection('listComments').where('listId', '==', listId).get(),
        db.collection('itemRatings').where('listId', '==', listId).get()
      ]);

      let commentsUpdated = 0;
      let ratingsUpdated = 0;
      const updates = [];

      // Procesar comentarios
      commentsSnapshot.forEach(doc => {
        const data = doc.data();
        if (data.itemId) {
          // Buscar item por texto del comentario (necesitaríamos el texto del item)
          const matchingItem = currentItems.find(item => item.id === data.itemId);
          if (!matchingItem && currentItems.length > 0) {
            // Si no coincide, intentar encontrar por índice o primer item
            const firstItem = currentItems[0];
            if (firstItem && firstItem.id !== data.itemId) {
              updates.push(
                doc.ref.update({ itemId: firstItem.id }).then(() => commentsUpdated++)
              );
            }
          }
        }
      });

      // Procesar ratings
      ratingsSnapshot.forEach(doc => {
        const data = doc.data();
        if (data.itemId) {
          const matchingItem = currentItems.find(item => item.id === data.itemId);
          if (!matchingItem && currentItems.length > 0) {
            const firstItem = currentItems[0];
            if (firstItem && firstItem.id !== data.itemId) {
              updates.push(
                doc.ref.update({ itemId: firstItem.id }).then(() => ratingsUpdated++)
              );
            }
          }
        }
      });

      await Promise.all(updates);

      if (commentsUpdated > 0 || ratingsUpdated > 0) {
        results.push({
          listId,
          listTitle: listData.title,
          commentsUpdated,
          ratingsUpdated
        });
        console.log(`  ✓ Lista "${listData.title}": ${commentsUpdated} comentarios, ${ratingsUpdated} ratings actualizados`);
      }
    }

    console.log(`✅ [ADMIN] Sincronización masiva completada: ${results.length} listas procesadas`);

    res.json({
      success: true,
      message: 'Sincronización masiva completada',
      data: {
        totalLists: listsSnapshot.size,
        listsUpdated: results.length,
        details: results
      }
    });

  } catch (error) {
    console.error('❌ [ADMIN] Error en sincronización masiva:', error);
    res.status(500).json({
      success: false,
      message: 'Error en sincronización masiva',
      error: error.message
    });
  }
});

// Eliminar lista
app.delete('/api/admin/lists/:listId', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { listId } = req.params;
    
    console.log('🗑️ [ADMIN] Eliminando lista:', listId);

    const listDoc = await db.collection('lists').doc(listId).get();
    
    if (!listDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Lista no encontrada'
      });
    }

    await db.collection('lists').doc(listId).delete();

    res.json({
      success: true,
      message: 'Lista eliminada exitosamente'
    });

  } catch (error) {
    console.error('❌ [ADMIN] Error eliminando lista:', error);
    res.status(500).json({
      success: false,
      message: 'Error eliminando lista',
      error: error.message
    });
  }
});

// Obtener calificaciones de una lista (items)
app.get('/api/admin/lists/:listId/ratings', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { listId } = req.params;
    
    console.log('⭐ [ADMIN] Obteniendo calificaciones de lista:', listId);

    const listDoc = await db.collection('lists').doc(listId).get();
    
    if (!listDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Lista no encontrada'
      });
    }

    // Obtener todas las calificaciones de items de esta lista
    const ratingsSnapshot = await db.collection('itemRatings')
      .where('listId', '==', listId)
      .get();

    const ratings = await Promise.all(ratingsSnapshot.docs.map(async (doc) => {
      const ratingData = doc.data();
      let userInfo = null;

      // Obtener información del usuario que calificó
      if (ratingData.userId) {
        try {
          const userDoc = await db.collection('users').doc(ratingData.userId).get();
          if (userDoc.exists) {
            const userData = userDoc.data();
            userInfo = {
              id: userDoc.id,
              displayName: userData.displayName || 'Usuario',
              email: userData.email || null
            };
          }
        } catch (error) {
          console.error(`Error obteniendo usuario ${ratingData.userId}:`, error);
        }
      }

      return {
        id: doc.id,
        ...ratingData,
        user: userInfo,
        createdAt: ratingData.createdAt?.toDate()
      };
    }));

    // Calcular estadísticas por item
    const itemStats = {};
    ratings.forEach(rating => {
      if (!itemStats[rating.itemId]) {
        itemStats[rating.itemId] = {
          itemId: rating.itemId,
          totalRatings: 0,
          sumRatings: 0,
          averageRating: 0
        };
      }
      itemStats[rating.itemId].totalRatings++;
      itemStats[rating.itemId].sumRatings += rating.rating;
    });

    // Calcular promedios
    Object.keys(itemStats).forEach(itemId => {
      const stats = itemStats[itemId];
      stats.averageRating = parseFloat((stats.sumRatings / stats.totalRatings).toFixed(1));
    });

    res.json({
      success: true,
      data: {
        ratings: ratings,
        stats: Object.values(itemStats),
        totalRatings: ratings.length
      }
    });

  } catch (error) {
    console.error('❌ [ADMIN] Error obteniendo calificaciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo calificaciones',
      error: error.message
    });
  }
});

// Obtener comentarios de una lista (items)
app.get('/api/admin/lists/:listId/comments', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { listId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    
    console.log('💬 [ADMIN] Obteniendo comentarios de lista:', listId);

    const listDoc = await db.collection('lists').doc(listId).get();
    
    if (!listDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Lista no encontrada'
      });
    }

    // Obtener todos los comentarios de items de esta lista
    const commentsSnapshot = await db.collection('listComments')
      .where('listId', '==', listId)
      .orderBy('createdAt', 'desc')
      .get();

    const allComments = await Promise.all(commentsSnapshot.docs.map(async (doc) => {
      const commentData = doc.data();
      let userInfo = null;

      // Obtener información del usuario que comentó
      if (commentData.userId) {
        try {
          const userDoc = await db.collection('users').doc(commentData.userId).get();
          if (userDoc.exists) {
            const userData = userDoc.data();
            userInfo = {
              id: userDoc.id,
              displayName: userData.displayName || 'Usuario',
              email: userData.email || null,
              photoURL: userData.photoURL || null
            };
          }
        } catch (error) {
          console.error(`Error obteniendo usuario ${commentData.userId}:`, error);
        }
      }

      return {
        id: doc.id,
        ...commentData,
        user: userInfo,
        createdAt: commentData.createdAt?.toDate()
      };
    }));

    // Paginación
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedComments = allComments.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: paginatedComments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: allComments.length,
        totalPages: Math.ceil(allComments.length / limit)
      }
    });

  } catch (error) {
    console.error('❌ [ADMIN] Error obteniendo comentarios:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo comentarios',
      error: error.message
    });
  }
});

// Eliminar calificación
app.delete('/api/admin/lists/:listId/ratings/:ratingId', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { ratingId } = req.params;
    
    console.log('🗑️ [ADMIN] Eliminando calificación:', ratingId);

    await db.collection('itemRatings').doc(ratingId).delete();

    res.json({
      success: true,
      message: 'Calificación eliminada exitosamente'
    });

  } catch (error) {
    console.error('❌ [ADMIN] Error eliminando calificación:', error);
    res.status(500).json({
      success: false,
      message: 'Error eliminando calificación',
      error: error.message
    });
  }
});

// Eliminar comentario
app.delete('/api/admin/lists/:listId/comments/:commentId', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { commentId } = req.params;
    
    console.log('🗑️ [ADMIN] Eliminando comentario:', commentId);

    await db.collection('listComments').doc(commentId).delete();

    res.json({
      success: true,
      message: 'Comentario eliminado exitosamente'
    });

  } catch (error) {
    console.error('❌ [ADMIN] Error eliminando comentario:', error);
    res.status(500).json({
      success: false,
      message: 'Error eliminando comentario',
      error: error.message
    });
  }
});

// Obtener calificaciones de un item específico
app.get('/api/admin/lists/:listId/items/:itemId/ratings', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { listId, itemId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    
    console.log('⭐ [ADMIN] Obteniendo ratings del item:', itemId, 'en lista:', listId);

    // Primero, obtener todos los ratings de la lista para debug
    const allRatingsSnapshot = await db.collection('itemRatings')
      .where('listId', '==', listId)
      .get();
    
    console.log('📊 [ADMIN] Total ratings en la lista:', allRatingsSnapshot.size);
    if (allRatingsSnapshot.size > 0) {
      console.log('🔍 [ADMIN] Ejemplo de itemIds encontrados:', 
        allRatingsSnapshot.docs.slice(0, 3).map(doc => doc.data().itemId)
      );
    }

    // Obtener todas las calificaciones del item
    const ratingsSnapshot = await db.collection('itemRatings')
      .where('listId', '==', listId)
      .where('itemId', '==', itemId)
      .get();

    console.log('✅ [ADMIN] Ratings encontrados para itemId', itemId, ':', ratingsSnapshot.size);

    const ratings = [];
    for (const doc of ratingsSnapshot.docs) {
      const data = doc.data();
      
      // Obtener información del usuario
      let userInfo = null;
      try {
        const userDoc = await db.collection('users').doc(data.userId).get();
        if (userDoc.exists) {
          const userData = userDoc.data();
          userInfo = {
            displayName: userData.displayName || 'Usuario',
            email: userData.email,
            photoURL: userData.photoURL || null
          };
        }
      } catch (error) {
        console.log('⚠️ [ADMIN] Error obteniendo info del usuario:', data.userId);
      }

      ratings.push({
        id: doc.id,
        listId: data.listId,
        itemId: data.itemId,
        userId: data.userId,
        user: userInfo,
        rating: data.rating,
        createdAt: data.createdAt
      });
    }

    // Ordenar por fecha (más recientes primero)
    ratings.sort((a, b) => {
      const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt);
      const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt);
      return dateB - dateA;
    });

    // Calcular estadísticas
    const totalRatings = ratings.length;
    const averageRating = totalRatings > 0 
      ? (ratings.reduce((sum, r) => sum + r.rating, 0) / totalRatings).toFixed(2)
      : 0;

    // Paginación
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedRatings = ratings.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: paginatedRatings,
      stats: {
        totalRatings,
        averageRating: parseFloat(averageRating),
        distribution: {
          5: ratings.filter(r => r.rating === 5).length,
          4: ratings.filter(r => r.rating === 4).length,
          3: ratings.filter(r => r.rating === 3).length,
          2: ratings.filter(r => r.rating === 2).length,
          1: ratings.filter(r => r.rating === 1).length
        }
      },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalRatings,
        totalPages: Math.ceil(totalRatings / limit)
      }
    });

  } catch (error) {
    console.error('❌ [ADMIN] Error obteniendo ratings del item:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo calificaciones del item',
      error: error.message
    });
  }
});

// Obtener comentarios de un item específico
app.get('/api/admin/lists/:listId/items/:itemId/comments', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { listId } = req.params;
    let { itemId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    
    // Decodificar el itemId por si viene con URL encoding
    itemId = decodeURIComponent(itemId);
    
    console.log('💬 [ADMIN] Obteniendo comentarios del item');
    console.log('   - ItemId recibido:', itemId);
    console.log('   - ItemId length:', itemId.length);
    console.log('   - ListId:', listId);

    // Primero, obtener todos los comentarios de la lista para debug
    const allCommentsSnapshot = await db.collection('listComments')
      .where('listId', '==', listId)
      .get();
    
    console.log('📊 [ADMIN] Total comentarios en la lista:', allCommentsSnapshot.size);
    
    if (allCommentsSnapshot.size > 0) {
      const exampleItemIds = allCommentsSnapshot.docs.slice(0, 5).map(doc => {
        const itemId = doc.data().itemId;
        return {
          id: itemId,
          length: itemId?.length,
          type: typeof itemId
        };
      });
      console.log('🔍 [ADMIN] Ejemplos de itemIds en Firestore:', JSON.stringify(exampleItemIds, null, 2));
    }

    // Obtener todos los comentarios del item
    const commentsSnapshot = await db.collection('listComments')
      .where('listId', '==', listId)
      .where('itemId', '==', itemId)
      .get();

    console.log('✅ [ADMIN] Comentarios encontrados para itemId exacto:', commentsSnapshot.size);
    
    // Si no se encontraron, intentar buscar con comparación flexible
    let allComments = [];
    if (commentsSnapshot.size === 0 && allCommentsSnapshot.size > 0) {
      console.log('⚠️ [ADMIN] No se encontró match exacto, buscando similares...');
      allCommentsSnapshot.forEach(doc => {
        const data = doc.data();
        if (data.itemId && data.itemId.toString() === itemId.toString()) {
          allComments.push({ id: doc.id, data });
          console.log('✅ [ADMIN] Match encontrado con conversión a string');
        }
      });
    }

    // Usar los comentarios encontrados (exactos o flexibles)
    const docsToProcess = commentsSnapshot.size > 0 
      ? commentsSnapshot.docs 
      : allComments.map(c => ({ id: c.id, data: () => c.data }));

    const comments = [];
    for (const doc of docsToProcess) {
      const data = typeof doc.data === 'function' ? doc.data() : doc.data;
      
      // Obtener información del usuario con foto
      let userInfo = null;
      try {
        const userDoc = await db.collection('users').doc(data.userId).get();
        if (userDoc.exists) {
          const userData = userDoc.data();
          userInfo = {
            displayName: userData.displayName || data.userName || 'Usuario',
            email: userData.email,
            photoURL: userData.photoURL || null
          };
        }
      } catch (error) {
        console.log('⚠️ [ADMIN] Error obteniendo info del usuario:', data.userId);
        userInfo = {
          displayName: data.userName || 'Usuario',
          email: null,
          photoURL: null
        };
      }

      comments.push({
        id: doc.id,
        listId: data.listId,
        itemId: data.itemId,
        userId: data.userId,
        user: userInfo,
        content: data.content,
        createdAt: data.createdAt
      });
    }

    // Ordenar por fecha (más recientes primero)
    comments.sort((a, b) => {
      const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt);
      const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt);
      return dateB - dateA;
    });

    // Paginación
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedComments = comments.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: paginatedComments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: comments.length,
        totalPages: Math.ceil(comments.length / limit)
      }
    });

  } catch (error) {
    console.error('❌ [ADMIN] Error obteniendo comentarios del item:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo comentarios del item',
      error: error.message
    });
  }
});

// ==========================================
// 📸 SUBIDA DE IMÁGENES GENERAL
// ==========================================

// Endpoint general para subir imágenes (usuarios autenticados)
app.post('/api/upload/image', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    const { uid } = req.user;
    const { type = 'general' } = req.body; // tipo: list, item, community, profile, etc.

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No se proporcionó ninguna imagen'
      });
    }

    const file = req.file;
    const timestamp = Date.now();
    const fileName = `${type}-${uid}-${timestamp}-${file.originalname}`;
    const bucket = admin.storage().bucket();
    const blob = bucket.file(`images/${type}/${fileName}`);
    
    const blobStream = blob.createWriteStream({
      metadata: {
        contentType: file.mimetype
      }
    });

    blobStream.on('error', (error) => {
      console.error('Error subiendo imagen:', error);
      res.status(500).json({
        success: false,
        message: 'Error al subir la imagen',
        error: error.message
      });
    });

    blobStream.on('finish', async () => {
      try {
        await blob.makePublic();
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
        
        res.json({
          success: true,
          message: 'Imagen subida exitosamente',
          imageUrl: publicUrl
        });
      } catch (error) {
        console.error('Error haciendo la imagen pública:', error);
        res.status(500).json({
          success: false,
          message: 'Error al hacer pública la imagen',
          error: error.message
        });
      }
    });

    blobStream.end(file.buffer);

  } catch (error) {
    console.error('Error en upload de imagen:', error);
    res.status(500).json({
      success: false,
      message: 'Error subiendo imagen',
      error: error.message
    });
  }
});

// Endpoint para subir imágenes desde el admin dashboard
app.post('/api/admin/upload/image', authenticateToken, isAdmin, upload.single('image'), async (req, res) => {
  try {
    const { uid } = req.user;
    const { type = 'general' } = req.body; // tipo: list, item, community, profile, etc.

    console.log('📤 [ADMIN] Subiendo imagen, tipo:', type);

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No se proporcionó ninguna imagen'
      });
    }

    const file = req.file;
    const timestamp = Date.now();
    const fileName = `${type}-admin-${uid}-${timestamp}-${file.originalname}`;
    const bucket = admin.storage().bucket();
    const blob = bucket.file(`images/${type}/${fileName}`);
    
    const blobStream = blob.createWriteStream({
      metadata: {
        contentType: file.mimetype
      }
    });

    blobStream.on('error', (error) => {
      console.error('❌ [ADMIN] Error subiendo imagen:', error);
      res.status(500).json({
        success: false,
        message: 'Error al subir la imagen',
        error: error.message
      });
    });

    blobStream.on('finish', async () => {
      try {
        await blob.makePublic();
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
        
        console.log('✅ [ADMIN] Imagen subida exitosamente:', publicUrl);
        
        res.json({
          success: true,
          message: 'Imagen subida exitosamente',
          imageUrl: publicUrl
        });
      } catch (error) {
        console.error('❌ [ADMIN] Error haciendo la imagen pública:', error);
        res.status(500).json({
          success: false,
          message: 'Error al hacer pública la imagen',
          error: error.message
        });
      }
    });

    blobStream.end(file.buffer);

  } catch (error) {
    console.error('❌ [ADMIN] Error en upload de imagen:', error);
    res.status(500).json({
      success: false,
      message: 'Error subiendo imagen',
      error: error.message
    });
  }
});

// ==========================================
// 📸 FOTO DE PERFIL DEL USUARIO
// ==========================================

// Endpoint para subir/actualizar foto de perfil del usuario
app.post('/api/auth/profile/photo', authenticateToken, upload.single('photo'), async (req, res) => {
  try {
    const { uid } = req.user;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No se proporcionó ninguna foto'
      });
    }

    console.log('📸 [PROFILE-PHOTO] Subiendo foto de perfil para usuario:', uid);
    console.log('📸 [PROFILE-PHOTO] Archivo:', req.file.originalname, req.file.size, 'bytes');

    // Subir a Firebase Storage
    const bucket = admin.storage().bucket();
    const fileName = `profile-photos/${uid}/${Date.now()}_${req.file.originalname}`;
    const file = bucket.file(fileName);

    await file.save(req.file.buffer, {
      metadata: {
        contentType: req.file.mimetype,
        metadata: {
          firebaseStorageDownloadTokens: uid
        }
      }
    });

    // Hacer el archivo público y obtener la URL
    await file.makePublic();
    const photoURL = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

    console.log('✅ [PROFILE-PHOTO] Foto subida:', photoURL);

    // Actualizar en Firebase Auth
    await auth.updateUser(uid, {
      photoURL: photoURL
    });

    // Actualizar en Firestore
    await db.collection('users').doc(uid).update({
      photoURL: photoURL,
      updatedAt: new Date()
    });

    console.log('✅ [PROFILE-PHOTO] Perfil actualizado en Auth y Firestore');

    res.json({
      success: true,
      message: 'Foto de perfil actualizada exitosamente',
      data: {
        photoURL: photoURL
      }
    });

  } catch (error) {
    console.error('❌ [PROFILE-PHOTO] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al subir la foto de perfil',
      error: error.message
    });
  }
});

// Endpoint para actualizar foto de perfil con URL externa (Google, Apple, etc.)
app.put('/api/auth/profile/photo', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { photoURL } = req.body;

    if (!photoURL) {
      return res.status(400).json({
        success: false,
        message: 'URL de la foto es requerida'
      });
    }

    console.log('📸 [PROFILE-PHOTO] Actualizando foto de perfil para usuario:', uid);
    console.log('📸 [PROFILE-PHOTO] Nueva URL:', photoURL);

    // Actualizar en Firebase Auth
    await auth.updateUser(uid, {
      photoURL: photoURL
    });

    // Actualizar en Firestore
    await db.collection('users').doc(uid).update({
      photoURL: photoURL,
      updatedAt: new Date()
    });

    console.log('✅ [PROFILE-PHOTO] Foto de perfil actualizada');

    res.json({
      success: true,
      message: 'Foto de perfil actualizada exitosamente',
      data: {
        photoURL: photoURL
      }
    });

  } catch (error) {
    console.error('❌ [PROFILE-PHOTO] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar la foto de perfil',
      error: error.message
    });
  }
});

// Endpoint para eliminar foto de perfil
app.delete('/api/auth/profile/photo', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;

    console.log('🗑️ [PROFILE-PHOTO] Eliminando foto de perfil para usuario:', uid);

    // Obtener la foto actual
    const userDoc = await db.collection('users').doc(uid).get();
    const userData = userDoc.data();
    const currentPhotoURL = userData?.photoURL;

    // Si la foto está en Firebase Storage, eliminarla
    if (currentPhotoURL && currentPhotoURL.includes('storage.googleapis.com')) {
      try {
        const bucket = admin.storage().bucket();
        // Extraer el nombre del archivo de la URL
        const filePathMatch = currentPhotoURL.match(/profile-photos\/.+/);
        if (filePathMatch) {
          const filePath = decodeURIComponent(filePathMatch[0]);
          const file = bucket.file(filePath);
          await file.delete();
          console.log('✅ [PROFILE-PHOTO] Archivo eliminado de Storage:', filePath);
        }
      } catch (storageError) {
        console.log('⚠️ [PROFILE-PHOTO] Error al eliminar de Storage (continuando):', storageError.message);
      }
    }

    // Actualizar en Firebase Auth
    await auth.updateUser(uid, {
      photoURL: null
    });

    // Actualizar en Firestore
    await db.collection('users').doc(uid).update({
      photoURL: null,
      updatedAt: new Date()
    });

    console.log('✅ [PROFILE-PHOTO] Foto de perfil eliminada');

    res.json({
      success: true,
      message: 'Foto de perfil eliminada exitosamente'
    });

  } catch (error) {
    console.error('❌ [PROFILE-PHOTO] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar la foto de perfil',
      error: error.message
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

    // Firebase enviará automáticamente el email usando sus plantillas configuradas
    // Nota: Debes configurar las plantillas en Firebase Console > Authentication > Templates
    await admin.auth().generatePasswordResetLink(email);
    
    console.log('✅ [FORGOT-PASSWORD] Email de restablecimiento enviado a:', email);
    
    res.json({
      success: true,
      message: 'Se ha enviado un email con instrucciones para restablecer tu contraseña. Revisa tu bandeja de entrada y spam.'
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
    const { tipType = 'general', childId } = req.body; // general, alimentacion, desarrollo, salud, etc.
    
    console.log('💡 [TIPS] Solicitud de tip:', { tipType, childId, userId: uid });

    // Verificar si ya se dio un tip recientemente para evitar repetición
    let recentTips = [];
    try {
      const recentTipsSnapshot = await db.collection('userTips')
        .where('userId', '==', uid)
        .where('tipType', '==', tipType)
        .orderBy('createdAt', 'desc')
        .limit(5)
        .get();
      
      recentTipsSnapshot.forEach(doc => {
        recentTips.push(doc.data().tip);
      });
    } catch (indexError) {
      console.log('⚠️ Índice no disponible aún, continuando sin verificación de duplicados:', indexError.message);
      // Continuar sin verificación de duplicados hasta que se cree el índice
      recentTips = [];
    }

    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Base de datos no disponible'
      });
    }

    // Obtener información actualizada de los hijos
    let children = [];
    
    if (childId) {
      // Si se proporciona childId, solo obtener ese hijo específico
      console.log('🔍 [TIPS] Obteniendo información del hijo específico:', childId);
      
      const childDoc = await db.collection('children').doc(childId).get();
      
      if (!childDoc.exists) {
        return res.status(404).json({
          success: false,
          message: 'Hijo no encontrado'
        });
      }
      
      const childData = childDoc.data();
      
      // Verificar que el hijo pertenece al usuario
      if (childData.parentId !== uid) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permiso para acceder a este hijo'
        });
      }
      
      const currentInfo = getChildCurrentInfo(childData);
      children.push({
        id: childDoc.id,
        name: childData.name,
        ageInMonths: childData.ageInMonths,
        currentAgeInMonths: currentInfo.currentAgeInMonths,
        isUnborn: childData.isUnborn,
        gestationWeeks: childData.gestationWeeks,
        currentGestationWeeks: currentInfo.currentGestationWeeks,
        daysSinceCreation: currentInfo.daysSinceCreation
      });
      
      console.log('✅ [TIPS] Hijo específico obtenido:', children[0]);
    } else {
      // Si no se proporciona childId, obtener todos los hijos
      console.log('🔍 [TIPS] Obteniendo todos los hijos del usuario');
      
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
      
      console.log('✅ [TIPS] Todos los hijos obtenidos:', children.length);
    }

    // Obtener perfil del usuario para verificar si está embarazada
    let isPregnant = false;
    let currentGestationWeeks = 0;
    
    try {
      const userProfileSnapshot = await db.collection('users').doc(uid).get();
      if (userProfileSnapshot.exists) {
        const userProfile = userProfileSnapshot.data();
        isPregnant = userProfile.isPregnant || false;
        currentGestationWeeks = userProfile.gestationWeeks || 0;
        console.log('👤 [PROFILE] Perfil del usuario:', { isPregnant, currentGestationWeeks });
      }
    } catch (profileError) {
      console.log('⚠️ [PROFILE] Error obteniendo perfil del usuario:', profileError.message);
      // Continuar con valores por defecto
    }

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

    console.log('👶 [CHILDREN] Contexto de hijos:', childrenContext);
    console.log('🤰 [PREGNANCY] Estado de embarazo:', { isPregnant, currentGestationWeeks });

    // Generar tips usando OpenAI - UN TIP POR CADA HIJO
    let tips = [];
    if (openai) {
      try {
        // Si hay tips específicos de hijos, generar uno por cada hijo
        const shouldGeneratePerChild = !['maternidad', 'crianza', 'embarazo'].includes(tipType);
        
        const prompt = shouldGeneratePerChild 
          ? `Eres una doula experta llamada "Douli". Necesito que generes tips personalizados para cada hijo.

INFORMACIÓN DE LOS HIJOS:
${children.map((child, index) => {
  if (child.isUnborn) {
    return `${index + 1}. ${child.name}: Por nacer, ${child.currentGestationWeeks} semanas de gestación`;
  } else {
    const years = Math.floor(child.currentAgeInMonths / 12);
    const months = child.currentAgeInMonths % 12;
    const ageText = years > 0 
      ? `${years} año${years > 1 ? 's' : ''}${months > 0 ? ` y ${months} mes${months > 1 ? 'es' : ''}` : ''}`
      : `${months} mes${months > 1 ? 'es' : ''}`;
    return `${index + 1}. ${child.name}: ${ageText} de edad`;
  }
}).join('\n')}

TIPO DE TIP SOLICITADO: ${tipType}

TIPS RECIENTES (NO REPITAS ESTOS):
${recentTips.length > 0 ? recentTips.map(tip => `- ${tip}`).join('\n') : 'Ninguno'}

INSTRUCCIONES ESTRICTAS:
- Genera EXACTAMENTE ${children.length} tip${children.length > 1 ? 's' : ''} (uno para cada hijo listado arriba)
- USA EXACTAMENTE el nombre que aparece arriba (NO inventes nombres)
- DEBES mencionar el nombre EXACTO del hijo en cada tip
- Formato OBLIGATORIO: emoji + NOMBRE EXACTO DEL HIJO + consejo
- En español
- Relacionado con el tipo "${tipType}"
- NO REPITAS ningún tip de la lista de "TIPS RECIENTES"
- Cada tip en una línea separada

⚠️ MUY IMPORTANTE - USAR NOMBRES EXACTOS:
${children.map((child, index) => `- Hijo ${index + 1}: DEBES usar "${child.name}" (NO uses otro nombre)`).join('\n')}

CONTEXTO POR EDAD:
- Si el hijo es bebé (0-12 meses), enfócate en desarrollo temprano
- Si el hijo es niño pequeño (1-3 años), enfócate en autonomía y lenguaje  
- Si el hijo es por nacer, enfócate en preparación

EJEMPLO CORRECTO de formato:
${children.length > 0 ? `🎨 ${children[0].name}: [consejo personalizado para ${children[0].name}]` : ''}

Genera ${children.length} tip${children.length > 1 ? 's' : ''} ahora usando los NOMBRES EXACTOS listados arriba:`
          : `Eres una doula experta llamada "Douli". Necesito que generes SOLO 1 tip general de ${tipType}.

ESTADO DE EMBARAZO:
${isPregnant ? `Actualmente embarazada de ${currentGestationWeeks} semanas` : 'No está embarazada actualmente'}

TIPS RECIENTES (NO REPITAS ESTOS):
${recentTips.length > 0 ? recentTips.map(tip => `- ${tip}`).join('\n') : 'Ninguno'}

INSTRUCCIONES:
- Genera SOLO 1 tip general de ${tipType}
- Formato: emoji + texto corto
- En español
- NO específico de ningún hijo en particular
- NO REPITAS ningún tip de la lista de "TIPS RECIENTES"
${tipType === 'embarazo' && isPregnant ? `\n- Específico para ${currentGestationWeeks} semanas de embarazo` : ''}

Genera el tip ahora:`;

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
          max_tokens: shouldGeneratePerChild ? 150 * children.length : 300, // Más tokens si hay múltiples hijos
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

    // Almacenar el tip generado para evitar repeticiones futuras
    if (tips.length > 0) {
      console.log('🔍 [STORAGE] Intentando almacenar tip:', {
        userId: uid,
        tipType: tipType,
        tip: tips[0],
        childrenContext: childrenContext,
        isPregnant: isPregnant,
        currentGestationWeeks: currentGestationWeeks
      });
      
      try {
        const tipData = {
          userId: uid,
          tipType: tipType,
          tip: tips[0],
          childrenContext: childrenContext,
          isPregnant: isPregnant,
          currentGestationWeeks: currentGestationWeeks,
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // Expira en 30 días
        };
        
        console.log('📝 [STORAGE] Datos del tip a almacenar:', tipData);
        
        const docRef = await db.collection('userTips').add(tipData);
        console.log('✅ [STORAGE] Tip almacenado exitosamente. Document ID:', docRef.id);
        console.log('✅ [STORAGE] Tip almacenado para usuario:', uid, 'tipo:', tipType);
      } catch (storageError) {
        console.error('❌ [STORAGE] Error almacenando tip:', storageError);
        console.error('❌ [STORAGE] Error completo:', JSON.stringify(storageError, null, 2));
        // Continuar aunque falle el almacenamiento
      }
    } else {
      console.log('⚠️ [STORAGE] No hay tips para almacenar');
    }

    res.json({
      success: true,
      data: {
        tips: tips.slice(0, 1), // Solo 1 tip
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

// ===== SISTEMA DE COMUNIDADES =====

// Endpoint para subir foto de comunidad
app.post('/api/communities/upload-photo', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    const { uid } = req.user;

    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Base de datos no disponible'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No se ha subido ninguna imagen. Asegúrate de usar el campo "image"'
      });
    }

    // Validar tipo de archivo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({
        success: false,
        message: 'Tipo de archivo no permitido. Solo se permiten: JPEG, JPG, PNG, GIF, WEBP'
      });
    }

    // Validar tamaño (máximo 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB en bytes
    if (req.file.size > maxSize) {
      return res.status(400).json({
        success: false,
        message: 'La imagen es demasiado grande. Máximo 5MB permitido'
      });
    }

    let imageUrl = null;
    
    try {
      const bucket = admin.storage().bucket();
      const fileName = `communities/photos/${Date.now()}-${req.file.originalname}`;
      const file = bucket.file(fileName);
      
      console.log('📤 [UPLOAD] Subiendo imagen:', {
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        fileName: fileName
      });

      await file.save(req.file.buffer, {
        metadata: {
          contentType: req.file.mimetype
        }
      });

      // Hacer la imagen pública
      await file.makePublic();
      imageUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
      
      console.log('✅ [UPLOAD] Imagen subida exitosamente:', imageUrl);

      // Guardar registro de la imagen en Firestore (opcional, para tracking)
      await db.collection('communityPhotos').add({
        userId: uid,
        fileName: fileName,
        originalName: req.file.originalname,
        imageUrl: imageUrl,
        fileSize: req.file.size,
        mimetype: req.file.mimetype,
        uploadedAt: new Date()
      });

      res.json({
        success: true,
        message: 'Imagen subida exitosamente',
        data: {
          photoUrl: imageUrl,
          fileName: fileName,
          originalName: req.file.originalname,
          fileSize: req.file.size,
          mimetype: req.file.mimetype
        }
      });

    } catch (uploadError) {
      console.error('❌ [UPLOAD] Error subiendo imagen:', uploadError);
      res.status(500).json({
        success: false,
        message: 'Error subiendo imagen',
        error: uploadError.message
      });
    }

  } catch (error) {
    console.error('❌ [UPLOAD] Error general:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// Endpoint para crear una comunidad
app.post('/api/communities', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { name, keywords, description, imageUrl, isPublic = true } = req.body;

    console.log('🏗️ [COMMUNITIES] Datos recibidos:', {
      name, keywords, description, imageUrl, isPublic
    });

    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Base de datos no disponible'
      });
    }

    // Validar campos obligatorios
    if (!name || !keywords || !description) {
      return res.status(400).json({
        success: false,
        message: 'Nombre, palabras clave y descripción son obligatorios'
      });
    }

    // Verificar si ya existe una comunidad con ese nombre
    const existingCommunity = await db.collection('communities')
      .where('name', '==', name.trim())
      .get();

    if (!existingCommunity.empty) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe una comunidad con ese nombre'
      });
    }

    // Usar la URL de imagen recibida directamente
    console.log('🖼️ [COMMUNITIES] URL de imagen recibida:', imageUrl);

    // Crear la comunidad
    const communityData = {
      name: name.trim(),
      keywords: keywords.split(',').map(k => k.trim()).filter(k => k),
      description: description.trim(),
      imageUrl: imageUrl || null, // Asegurar que no sea undefined
      isPublic: isPublic === 'true' || isPublic === true,
      creatorId: uid,
      members: [uid], // El creador es el primer miembro
      memberCount: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const communityRef = await db.collection('communities').add(communityData);
    
    console.log('✅ [COMMUNITY] Comunidad creada exitosamente:', communityRef.id);

    res.json({
      success: true,
      message: 'Comunidad creada exitosamente',
      data: {
        id: communityRef.id,
        ...communityData
      }
    });

  } catch (error) {
    console.error('❌ [COMMUNITY] Error creando comunidad:', error);
    res.status(500).json({
      success: false,
      message: 'Error creando comunidad',
      error: error.message
    });
  }
});

// Endpoint para buscar en todas las comunidades (públicas y privadas) incluyendo las del usuario
app.get('/api/communities/search', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { query, limit = 20 } = req.query;

    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Base de datos no disponible'
      });
    }

    if (!query || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'El término de búsqueda es obligatorio'
      });
    }

    const searchTerm = query.trim().toLowerCase();
    const searchLimit = Math.min(parseInt(limit), 50); // Máximo 50 resultados

    // Obtener TODAS las comunidades (incluyendo las del usuario)
    let communitiesSnapshot;
    try {
      // Intentar con ordenamiento - obtener TODAS las comunidades
      communitiesSnapshot = await db.collection('communities')
        .orderBy('createdAt', 'desc')
        .get();
    } catch (indexError) {
      console.log('⚠️ [COMMUNITIES SEARCH] Índice no disponible, obteniendo sin ordenamiento:', indexError.message);
      // Fallback: obtener sin ordenamiento
      communitiesSnapshot = await db.collection('communities').get();
    }

    const communities = [];
    communitiesSnapshot.forEach(doc => {
      const data = doc.data();
      
      // Buscar en nombre, palabras clave y descripción
      const nameMatch = data.name.toLowerCase().includes(searchTerm);
      const keywordsMatch = data.keywords && data.keywords.some(keyword => 
        keyword.toLowerCase().includes(searchTerm)
      );
      const descriptionMatch = data.description.toLowerCase().includes(searchTerm);
      
      if (nameMatch || keywordsMatch || descriptionMatch) {
        const isCreator = data.creatorId === uid;
        const isMember = data.members && data.members.includes(uid);
        
        communities.push({
          id: doc.id,
          name: data.name,
          keywords: data.keywords,
          description: data.description,
          imageUrl: data.imageUrl,
          isPublic: data.isPublic,
          memberCount: data.memberCount || 0,
          isCreator: isCreator,
          isMember: isMember,
          canJoin: !isMember && data.isPublic, // Solo si no es miembro y es pública
          joinType: !isMember ? (data.isPublic ? 'direct' : 'request') : null, // Tipo de unión si no es miembro
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          // Campos de relevancia para el ranking
          relevanceScore: calculateRelevanceScore(data, searchTerm)
        });
      }
    });

    // Ordenar por relevancia (exacto > parcial > fecha)
    communities.sort((a, b) => {
      if (a.relevanceScore !== b.relevanceScore) {
        return b.relevanceScore - a.relevanceScore;
      }
      // Si tienen la misma relevancia, ordenar por fecha de creación
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    // Limitar resultados
    const limitedResults = communities.slice(0, searchLimit);

    res.json({
      success: true,
      message: 'Búsqueda completada exitosamente',
      data: {
        results: limitedResults,
        totalFound: communities.length,
        searchTerm: searchTerm,
        limit: searchLimit
      }
    });

  } catch (error) {
    console.error('❌ [COMMUNITIES] Error en búsqueda:', error);
    res.status(500).json({
      success: false,
      message: 'Error en la búsqueda',
      error: error.message
    });
  }
});

// Endpoint para obtener todas las comunidades (públicas y privadas) excepto las del usuario
app.get('/api/communities', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;

    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Base de datos no disponible'
      });
    }

    let communitiesSnapshot;
    try {
      // Intentar con ordenamiento - obtener TODAS las comunidades excepto las del usuario
      communitiesSnapshot = await db.collection('communities')
        .where('creatorId', '!=', uid) // Excluir comunidades del usuario actual
        .orderBy('creatorId') // Necesario para la consulta !=
        .orderBy('createdAt', 'desc')
        .get();
    } catch (indexError) {
      console.log('⚠️ [COMMUNITIES] Índice no disponible, obteniendo sin ordenamiento:', indexError.message);
      // Fallback: obtener sin ordenamiento y filtrar en memoria
      communitiesSnapshot = await db.collection('communities').get();
    }

    const communities = [];
    communitiesSnapshot.forEach(doc => {
      const data = doc.data();
      
      // Filtrar en memoria si no se pudo usar el índice
      if (data.creatorId === uid) {
        return; // Saltar comunidades del usuario actual
      }
      
      communities.push({
        id: doc.id,
        name: data.name,
        keywords: data.keywords,
        description: data.description,
        imageUrl: data.imageUrl,
        isPublic: data.isPublic,
        memberCount: data.memberCount || 0,
        canJoin: data.isPublic, // Solo las públicas permiten unirse directamente
        joinType: data.isPublic ? 'direct' : 'request', // Tipo de unión permitida
        createdAt: data.createdAt,
        updatedAt: data.updatedAt
      });
    });

    res.json({
      success: true,
      data: communities
    });

  } catch (error) {
    console.error('❌ [COMMUNITY] Error obteniendo comunidades:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo comunidades',
      error: error.message
    });
  }
});

// Endpoint para unirse a una comunidad
app.post('/api/communities/:communityId/join', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { communityId } = req.params;

    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Base de datos no disponible'
      });
    }

    // Verificar que la comunidad existe
    const communityRef = db.collection('communities').doc(communityId);
    const communityDoc = await communityRef.get();

    if (!communityDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Comunidad no encontrada'
      });
    }

    const communityData = communityDoc.data();

    // Verificar si ya es miembro
    if (communityData.members && communityData.members.includes(uid)) {
      return res.status(400).json({
        success: false,
        message: 'Ya eres miembro de esta comunidad'
      });
    }

    // Si es pública, unirse directamente
    if (communityData.isPublic) {
      await communityRef.update({
        members: admin.firestore.FieldValue.arrayUnion(uid),
        memberCount: admin.firestore.FieldValue.increment(1),
        updatedAt: new Date()
      });

      console.log('✅ [COMMUNITY] Usuario se unió directamente a comunidad pública:', uid, communityId);

      res.json({
        success: true,
        message: 'Te has unido a la comunidad exitosamente'
      });
    } else {
      // Si es privada, crear solicitud de unión
      // Verificar que no haya una solicitud pendiente
      let existingRequest;
      try {
        // Intentar con ordenamiento - requiere índice compuesto
        existingRequest = await db.collection('joinRequests')
          .where('communityId', '==', communityId)
          .where('userId', '==', uid)
          .where('status', '==', 'pending')
          .get();
      } catch (indexError) {
        console.log('⚠️ [JOIN CHECK] Índice no disponible, verificando sin ordenamiento:', indexError.message);
        // Fallback: verificar sin ordenamiento
        existingRequest = await db.collection('joinRequests')
          .where('communityId', '==', communityId)
          .where('userId', '==', uid)
          .where('status', '==', 'pending')
          .get();
      }

      if (!existingRequest.empty) {
        return res.status(400).json({
          success: false,
          message: 'Ya tienes una solicitud pendiente para esta comunidad'
        });
      }

      const requestData = {
        userId: uid,
        communityId: communityId,
        userName: req.user.displayName || 'Usuario',
        status: 'pending', // pending, approved, rejected
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const joinRequestRef = await db.collection('joinRequests').add(requestData);
      
      console.log('✅ [COMMUNITY] Solicitud de unión creada:', uid, communityId);

      res.json({
        success: true,
        message: 'Solicitud de unión enviada. Espera la aprobación del administrador.',
        data: {
          communityId,
          requestId: joinRequestRef.id,
          status: 'pending'
        }
      });
    }

  } catch (error) {
    console.error('❌ [COMMUNITY] Error uniéndose a comunidad:', error);
    res.status(500).json({
      success: false,
      message: 'Error uniéndose a comunidad',
      error: error.message
    });
  }
});

// Endpoint para obtener solicitudes pendientes de una comunidad (solo para el owner)
app.get('/api/communities/:communityId/join-requests', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { communityId } = req.params;

    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Base de datos no disponible'
      });
    }

    // Verificar que la comunidad existe y el usuario es el owner
    const communityDoc = await db.collection('communities').doc(communityId).get();
    if (!communityDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Comunidad no encontrada'
      });
    }

    const communityData = communityDoc.data();
    if (communityData.creatorId !== uid) {
      return res.status(403).json({
        success: false,
        message: 'Solo el creador de la comunidad puede ver las solicitudes'
      });
    }

    // Obtener solicitudes pendientes
    let requestsSnapshot;
    try {
      // Intentar con ordenamiento - requiere índice compuesto
      requestsSnapshot = await db.collection('joinRequests')
        .where('communityId', '==', communityId)
        .where('status', '==', 'pending')
        .orderBy('createdAt', 'desc')
        .get();
    } catch (indexError) {
      console.log('⚠️ [JOIN REQUESTS] Índice no disponible, obteniendo sin ordenamiento:', indexError.message);
      // Fallback: obtener sin ordenamiento
      requestsSnapshot = await db.collection('joinRequests')
        .where('communityId', '==', communityId)
        .where('status', '==', 'pending')
        .get();
    }

    const requests = [];
    for (const doc of requestsSnapshot.docs) {
      const data = doc.data();
      
      // Obtener información completa del usuario
      let userProfile = null;
      try {
        const userDoc = await db.collection('users').doc(data.userId).get();
        if (userDoc.exists) {
          userProfile = userDoc.data();
        }
      } catch (userError) {
        console.log('⚠️ [JOIN REQUESTS] Error obteniendo perfil de usuario:', data.userId, userError.message);
      }
      
      requests.push({
        id: doc.id,
        userId: data.userId,
        userName: userProfile?.displayName || data.userName || 'Usuario',
        userPhoto: userProfile?.photoURL || null,
        userEmail: userProfile?.email || null,
        communityId: data.communityId,
        status: data.status,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        requestDate: data.createdAt // Fecha de la solicitud
      });
    }

    res.json({
      success: true,
      message: 'Solicitudes obtenidas exitosamente',
      data: requests
    });

  } catch (error) {
    console.error('❌ [COMMUNITY] Error obteniendo solicitudes:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo solicitudes',
      error: error.message
    });
  }
});

// Endpoint para aprobar/rechazar solicitudes de unión (solo para el owner)
app.put('/api/communities/:communityId/join-requests/:requestId', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { communityId, requestId } = req.params;
    const { action } = req.body; // 'approve' o 'reject'

    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Base de datos no disponible'
      });
    }

    if (!action || !['approve', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Acción debe ser "approve" o "reject"'
      });
    }

    // Verificar que la comunidad existe y el usuario es el owner
    const communityDoc = await db.collection('communities').doc(communityId).get();
    if (!communityDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Comunidad no encontrada'
      });
    }

    const communityData = communityDoc.data();
    if (communityData.creatorId !== uid) {
      return res.status(403).json({
        success: false,
        message: 'Solo el creador de la comunidad puede aprobar/rechazar solicitudes'
      });
    }

    // Obtener la solicitud
    const requestDoc = await db.collection('joinRequests').doc(requestId).get();
    if (!requestDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Solicitud no encontrada'
      });
    }

    const requestData = requestDoc.data();
    if (requestData.communityId !== communityId) {
      return res.status(400).json({
        success: false,
        message: 'La solicitud no pertenece a esta comunidad'
      });
    }

    if (requestData.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'La solicitud ya no está pendiente'
      });
    }

    const batch = db.batch();

    if (action === 'approve') {
      // Aprobar solicitud: agregar usuario a la comunidad
      const communityRef = db.collection('communities').doc(communityId);
      batch.update(communityRef, {
        members: admin.firestore.FieldValue.arrayUnion(requestData.userId),
        memberCount: admin.firestore.FieldValue.increment(1),
        updatedAt: new Date()
      });

      // Actualizar estado de la solicitud
      const requestRef = db.collection('joinRequests').doc(requestId);
      batch.update(requestRef, {
        status: 'approved',
        updatedAt: new Date()
      });

      await batch.commit();

      console.log('✅ [COMMUNITY] Solicitud aprobada:', requestId, communityId);

      res.json({
        success: true,
        message: 'Solicitud aprobada. El usuario se ha unido a la comunidad.',
        data: {
          requestId,
          status: 'approved',
          userId: requestData.userId
        }
      });
    } else {
      // Rechazar solicitud
      const requestRef = db.collection('joinRequests').doc(requestId);
      batch.update(requestRef, {
        status: 'rejected',
        updatedAt: new Date()
      });

      await batch.commit();

      console.log('✅ [COMMUNITY] Solicitud rechazada:', requestId, communityId);

      res.json({
        success: true,
        message: 'Solicitud rechazada',
        data: {
          requestId,
          status: 'rejected',
          userId: requestData.userId
        }
      });
    }

  } catch (error) {
    console.error('❌ [COMMUNITY] Error procesando solicitud:', error);
    res.status(500).json({
      success: false,
      message: 'Error procesando solicitud',
      error: error.message
    });
  }
});

// Endpoint para obtener solicitudes del usuario
app.get('/api/user/join-requests', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;

    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Base de datos no disponible'
      });
    }

    // Obtener todas las solicitudes del usuario
    let requestsSnapshot;
    try {
      // Intentar con ordenamiento - requiere índice compuesto
      requestsSnapshot = await db.collection('joinRequests')
        .where('userId', '==', uid)
        .orderBy('createdAt', 'desc')
        .get();
    } catch (indexError) {
      console.log('⚠️ [USER REQUESTS] Índice no disponible, obteniendo sin ordenamiento:', indexError.message);
      // Fallback: obtener sin ordenamiento
      requestsSnapshot = await db.collection('joinRequests')
        .where('userId', '==', uid)
        .get();
    }

    const requests = [];
    for (const doc of requestsSnapshot.docs) {
      const data = doc.data();
      
      // Obtener información de la comunidad
      const communityDoc = await db.collection('communities').doc(data.communityId).get();
      if (communityDoc.exists) {
        const communityData = communityDoc.data();
        requests.push({
          id: doc.id,
          communityId: data.communityId,
          communityName: communityData.name,
          communityImage: communityData.imageUrl,
          status: data.status,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt
        });
      }
    }

    res.json({
      success: true,
      message: 'Solicitudes obtenidas exitosamente',
      data: requests
    });

  } catch (error) {
    console.error('❌ [COMMUNITY] Error obteniendo solicitudes del usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo solicitudes',
      error: error.message
    });
  }
});

// Endpoint para buscar en las comunidades del usuario
app.get('/api/user/communities/search', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { query, limit = 20 } = req.query;

    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Base de datos no disponible'
      });
    }

    if (!query || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'El término de búsqueda es obligatorio'
      });
    }

    const searchTerm = query.trim().toLowerCase();
    const searchLimit = Math.min(parseInt(limit), 50); // Máximo 50 resultados

    // Obtener todas las comunidades del usuario
    const communitiesSnapshot = await db.collection('communities')
      .where('members', 'array-contains', uid)
      .get();

    const communities = [];
    communitiesSnapshot.forEach(doc => {
      const data = doc.data();
      
      // Buscar en nombre, palabras clave y descripción
      const nameMatch = data.name.toLowerCase().includes(searchTerm);
      const keywordsMatch = data.keywords && data.keywords.some(keyword => 
        keyword.toLowerCase().includes(searchTerm)
      );
      const descriptionMatch = data.description.toLowerCase().includes(searchTerm);
      
      if (nameMatch || keywordsMatch || descriptionMatch) {
        communities.push({
          id: doc.id,
          name: data.name,
          keywords: data.keywords,
          description: data.description,
          imageUrl: data.imageUrl,
          isPublic: data.isPublic,
          memberCount: data.memberCount || 0,
          isCreator: data.creatorId === uid,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          // Campos de relevancia para el ranking
          relevanceScore: calculateRelevanceScore(data, searchTerm)
        });
      }
    });

    // Ordenar por relevancia (exacto > parcial > fecha)
    communities.sort((a, b) => {
      if (a.relevanceScore !== b.relevanceScore) {
        return b.relevanceScore - a.relevanceScore;
      }
      // Si tienen la misma relevancia, ordenar por fecha de creación
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    // Limitar resultados
    const limitedResults = communities.slice(0, searchLimit);

    res.json({
      success: true,
      message: 'Búsqueda completada exitosamente',
      data: {
        results: limitedResults,
        totalFound: communities.length,
        searchTerm: searchTerm,
        limit: searchLimit
      }
    });

  } catch (error) {
    console.error('❌ [COMMUNITIES] Error en búsqueda:', error);
    res.status(500).json({
      success: false,
      message: 'Error en la búsqueda',
      error: error.message
    });
  }
});

// Función para calcular puntuación de relevancia
function calculateRelevanceScore(community, searchTerm) {
  let score = 0;
  const term = searchTerm.toLowerCase();
  
  // Búsqueda exacta en nombre (máxima puntuación)
  if (community.name.toLowerCase() === term) {
    score += 100;
  }
  // Búsqueda parcial en nombre
  else if (community.name.toLowerCase().includes(term)) {
    score += 50;
  }
  
  // Búsqueda en palabras clave
  if (community.keywords) {
    community.keywords.forEach(keyword => {
      if (keyword.toLowerCase() === term) {
        score += 30;
      } else if (keyword.toLowerCase().includes(term)) {
        score += 15;
      }
    });
  }
  
  // Búsqueda en descripción
  if (community.description.toLowerCase().includes(term)) {
    score += 10;
  }
  
  return score;
}

// Endpoint para obtener comunidades del usuario
app.get('/api/user/communities', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;

    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Base de datos no disponible'
      });
    }

    // Obtener comunidades donde el usuario es miembro
    const communitiesSnapshot = await db.collection('communities')
      .where('members', 'array-contains', uid)
      .get();

    const communities = [];
    communitiesSnapshot.forEach(doc => {
      const data = doc.data();
      communities.push({
        id: doc.id,
        name: data.name,
        keywords: data.keywords,
        description: data.description,
        imageUrl: data.imageUrl,
        isPublic: data.isPublic,
        memberCount: data.memberCount || 0,
        isCreator: data.creatorId === uid,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt
      });
    });

    res.json({
      success: true,
      data: communities
    });

  } catch (error) {
    console.error('❌ [COMMUNITY] Error obteniendo comunidades del usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo comunidades del usuario',
      error: error.message
    });
  }
});

// ===== SISTEMA DE LISTAS =====

// Endpoint para crear una lista
app.post('/api/lists', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { title, description, isPublic = false, items = [] } = req.body;

    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Base de datos no disponible'
      });
    }

    // Validar campos obligatorios
    if (!title || title.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'El título de la lista es obligatorio'
      });
    }

    // Crear la lista
    const listData = {
      title: title.trim(),
      description: description ? description.trim() : '',
      imageUrl: req.body.imageUrl || null, // URL de imagen de la lista
      isPublic: isPublic === 'true' || isPublic === true,
      creatorId: uid,
      items: items.map((item, index) => ({
        id: `item_${Date.now()}_${index}`,
        text: item.text ? item.text.trim() : '',
        imageUrl: item.imageUrl || null, // URL de imagen del item
        priority: item.priority || 'medium', // low, medium, high
        details: item.details || '', // Detalles adicionales
        brand: item.brand || '', // Marca
        store: item.store || '', // Tienda
        approximatePrice: item.approximatePrice || null, // Precio aproximado
        completed: false,
        createdAt: new Date()
      })),
      completedItems: 0,
      totalItems: items.length,
      stars: 0,
      comments: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const listRef = await db.collection('lists').add(listData);
    
    console.log('✅ [LISTS] Lista creada exitosamente:', listRef.id);

    res.json({
      success: true,
      message: 'Lista creada exitosamente',
      data: {
        id: listRef.id,
        ...listData
      }
    });

  } catch (error) {
    console.error('❌ [LISTS] Error creando lista:', error);
    res.status(500).json({
      success: false,
      message: 'Error creando lista',
      error: error.message
    });
  }
});

// Endpoint para obtener las listas del usuario
app.get('/api/user/lists', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { type = 'all' } = req.query; // 'all', 'public', 'private'

    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Base de datos no disponible'
      });
    }

    let query = db.collection('lists').where('creatorId', '==', uid);
    
    // Filtrar por tipo si se especifica
    if (type === 'public') {
      query = query.where('isPublic', '==', true);
    } else if (type === 'private') {
      query = query.where('isPublic', '==', false);
    }

    const listsSnapshot = await query.orderBy('updatedAt', 'desc').get();

    const lists = [];
    listsSnapshot.forEach(doc => {
      const data = doc.data();
      lists.push({
        id: doc.id,
        title: data.title,
        description: data.description,
        imageUrl: data.imageUrl || null,
        isPublic: data.isPublic,
        isOwner: data.creatorId === uid, // ← NUEVO: indicar si es el propietario
        items: data.items || [],
        completedItems: data.completedItems || 0,
        totalItems: data.totalItems || 0,
        stars: data.stars || 0,
        comments: data.comments || 0,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt
      });
    });

    res.json({
      success: true,
      message: 'Listas obtenidas exitosamente',
      data: lists
    });

  } catch (error) {
    console.error('❌ [LISTS] Error obteniendo listas:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo listas',
      error: error.message
    });
  }
});

// Endpoint para obtener listas públicas
app.get('/api/lists/public', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { limit = 20, offset = 0 } = req.query;

    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Base de datos no disponible'
      });
    }

    const listsSnapshot = await db.collection('lists')
      .where('isPublic', '==', true)
      .orderBy('stars', 'desc')
      .orderBy('createdAt', 'desc')
      .limit(parseInt(limit))
      .offset(parseInt(offset))
      .get();

    const lists = [];
    listsSnapshot.forEach(doc => {
      const data = doc.data();
      lists.push({
        id: doc.id,
        title: data.title,
        description: data.description,
        imageUrl: data.imageUrl || null,
        creatorId: data.creatorId,
        isOwner: data.creatorId === uid, // ← NUEVO: indicar si es el propietario
        items: data.items || [],
        completedItems: data.completedItems || 0,
        totalItems: data.totalItems || 0,
        stars: data.stars || 0,
        comments: data.comments || 0,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt
      });
    });

    res.json({
      success: true,
      message: 'Listas públicas obtenidas exitosamente',
      data: lists
    });

  } catch (error) {
    console.error('❌ [LISTS] Error obteniendo listas públicas:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo listas públicas',
      error: error.message
    });
  }
});

// Endpoint para actualizar una lista
app.put('/api/lists/:listId', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { listId } = req.params;
    const { title, description, isPublic } = req.body;

    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Base de datos no disponible'
      });
    }

    // Verificar que la lista existe y el usuario es el creador
    const listDoc = await db.collection('lists').doc(listId).get();
    if (!listDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Lista no encontrada'
      });
    }

    const listData = listDoc.data();
    if (listData.creatorId !== uid) {
      return res.status(403).json({
        success: false,
        message: 'Solo el creador puede editar la lista'
      });
    }

    // Actualizar la lista
    const updateData = {
      updatedAt: new Date()
    };

    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description.trim();
    if (req.body.imageUrl !== undefined) updateData.imageUrl = req.body.imageUrl || null;
    if (isPublic !== undefined) updateData.isPublic = isPublic === 'true' || isPublic === true;

    await db.collection('lists').doc(listId).update(updateData);

    console.log('✅ [LISTS] Lista actualizada exitosamente:', listId);

    res.json({
      success: true,
      message: 'Lista actualizada exitosamente',
      data: { listId, ...updateData }
    });

  } catch (error) {
    console.error('❌ [LISTS] Error actualizando lista:', error);
    res.status(500).json({
      success: false,
      message: 'Error actualizando lista',
      error: error.message
    });
  }
});

// Endpoint para agregar un item a una lista
app.post('/api/lists/:listId/items', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { listId } = req.params;
    const { text } = req.body;

    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Base de datos no disponible'
      });
    }

    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'El texto del item es obligatorio'
      });
    }

    // Verificar que la lista existe y el usuario es el creador
    const listDoc = await db.collection('lists').doc(listId).get();
    if (!listDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Lista no encontrada'
      });
    }

    const listData = listDoc.data();
    if (listData.creatorId !== uid) {
      return res.status(403).json({
        success: false,
        message: 'Solo el creador puede agregar items a la lista'
      });
    }

    // Crear el nuevo item
    const newItem = {
      id: `item_${Date.now()}_${Math.random()}`,
      text: text.trim(),
      imageUrl: req.body.imageUrl || null,
      priority: req.body.priority || 'medium',
      details: req.body.details || '',
      brand: req.body.brand || '',
      store: req.body.store || '',
      approximatePrice: req.body.approximatePrice || null,
      completed: false,
      createdAt: new Date()
    };

    // Actualizar la lista
    const updatedItems = [...(listData.items || []), newItem];
    
    await db.collection('lists').doc(listId).update({
      items: updatedItems,
      totalItems: updatedItems.length,
      updatedAt: new Date()
    });

    console.log('✅ [LISTS] Item agregado exitosamente:', newItem.id);

    res.json({
      success: true,
      message: 'Item agregado exitosamente',
      data: newItem
    });

  } catch (error) {
    console.error('❌ [LISTS] Error agregando item:', error);
    res.status(500).json({
      success: false,
      message: 'Error agregando item',
      error: error.message
    });
  }
});

// Endpoint para marcar/desmarcar un item como completado
app.put('/api/lists/:listId/items/:itemId/toggle', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { listId, itemId } = req.params;

    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Base de datos no disponible'
      });
    }

    // Verificar que la lista existe y el usuario es el creador
    const listDoc = await db.collection('lists').doc(listId).get();
    if (!listDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Lista no encontrada'
      });
    }

    const listData = listDoc.data();
    if (listData.creatorId !== uid) {
      return res.status(403).json({
        success: false,
        message: 'Solo el creador puede modificar items de la lista'
      });
    }

    // Encontrar y actualizar el item
    const items = listData.items || [];
    const itemIndex = items.findIndex(item => item.id === itemId);
    
    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Item no encontrado'
      });
    }

    // Toggle del estado completado
    items[itemIndex].completed = !items[itemIndex].completed;
    
    // Contar items completados
    const completedItems = items.filter(item => item.completed).length;

    // Actualizar la lista
    await db.collection('lists').doc(listId).update({
      items: items,
      completedItems: completedItems,
      updatedAt: new Date()
    });

    console.log('✅ [LISTS] Item actualizado exitosamente:', itemId);

    res.json({
      success: true,
      message: 'Item actualizado exitosamente',
      data: {
        itemId: itemId,
        completed: items[itemIndex].completed,
        completedItems: completedItems
      }
    });

  } catch (error) {
    console.error('❌ [LISTS] Error actualizando item:', error);
    res.status(500).json({
      success: false,
      message: 'Error actualizando item',
      error: error.message
    });
  }
});

// Endpoint para eliminar un item de una lista
app.delete('/api/lists/:listId/items/:itemId', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { listId, itemId } = req.params;

    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Base de datos no disponible'
      });
    }

    // Verificar que la lista existe y el usuario es el creador
    const listDoc = await db.collection('lists').doc(listId).get();
    if (!listDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Lista no encontrada'
      });
    }

    const listData = listDoc.data();
    if (listData.creatorId !== uid) {
      return res.status(403).json({
        success: false,
        message: 'Solo el creador puede eliminar items de la lista'
      });
    }

    // Encontrar y eliminar el item
    const items = listData.items || [];
    const filteredItems = items.filter(item => item.id !== itemId);
    
    if (filteredItems.length === items.length) {
      return res.status(404).json({
        success: false,
        message: 'Item no encontrado'
      });
    }

    // Contar items completados
    const completedItems = filteredItems.filter(item => item.completed).length;

    // Actualizar la lista
    await db.collection('lists').doc(listId).update({
      items: filteredItems,
      totalItems: filteredItems.length,
      completedItems: completedItems,
      updatedAt: new Date()
    });

    console.log('✅ [LISTS] Item eliminado exitosamente:', itemId);

    res.json({
      success: true,
      message: 'Item eliminado exitosamente',
      data: { itemId }
    });

  } catch (error) {
    console.error('❌ [LISTS] Error eliminando item:', error);
    res.status(500).json({
      success: false,
      message: 'Error eliminando item',
      error: error.message
    });
  }
});

// Endpoint para calificar un item de lista pública
app.post('/api/lists/:listId/items/:itemId/rate', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { listId, itemId } = req.params;
    const { rating } = req.body; // rating del 1 al 5

    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Base de datos no disponible'
      });
    }

    // Validar rating
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'El rating debe ser un número del 1 al 5'
      });
    }

    // Verificar que la lista existe y es pública
    const listDoc = await db.collection('lists').doc(listId).get();
    if (!listDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Lista no encontrada'
      });
    }

    const listData = listDoc.data();
    if (!listData.isPublic) {
      return res.status(403).json({
        success: false,
        message: 'Solo se pueden calificar items de listas públicas'
      });
    }

    // Verificar que el item existe
    const item = listData.items.find(item => item.id === itemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item no encontrado'
      });
    }

    // Verificar si el usuario ya calificó este item
    const existingRating = await db.collection('itemRatings')
      .where('listId', '==', listId)
      .where('itemId', '==', itemId)
      .where('userId', '==', uid)
      .get();

    let ratingData;
    if (existingRating.empty) {
      // Crear nueva calificación
      ratingData = {
        listId: listId,
        itemId: itemId,
        userId: uid,
        rating: parseInt(rating),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      await db.collection('itemRatings').add(ratingData);
    } else {
      // Actualizar calificación existente
      const ratingDoc = existingRating.docs[0];
      ratingData = {
        ...ratingDoc.data(),
        rating: parseInt(rating),
        updatedAt: new Date()
      };
      await db.collection('itemRatings').doc(ratingDoc.id).update({
        rating: parseInt(rating),
        updatedAt: new Date()
      });
    }

    // Calcular promedio de calificaciones para este item
    const allRatings = await db.collection('itemRatings')
      .where('listId', '==', listId)
      .where('itemId', '==', itemId)
      .get();

    let totalRating = 0;
    let ratingCount = 0;
    allRatings.forEach(doc => {
      totalRating += doc.data().rating;
      ratingCount++;
    });

    const averageRating = ratingCount > 0 ? (totalRating / ratingCount).toFixed(1) : 0;

    console.log('✅ [LISTS] Item calificado exitosamente:', itemId, 'Rating:', rating);

    res.json({
      success: true,
      message: 'Item calificado exitosamente',
      data: {
        listId: listId,
        itemId: itemId,
        rating: parseInt(rating),
        averageRating: parseFloat(averageRating),
        totalRatings: ratingCount,
        isNewRating: existingRating.empty
      }
    });

  } catch (error) {
    console.error('❌ [LISTS] Error calificando item:', error);
    res.status(500).json({
      success: false,
      message: 'Error calificando item',
      error: error.message
    });
  }
});

// Endpoint para obtener calificaciones de un item
app.get('/api/lists/:listId/items/:itemId/ratings', async (req, res) => {
  try {
    const { listId, itemId } = req.params;

    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Base de datos no disponible'
      });
    }

    // Verificar que la lista existe y es pública
    const listDoc = await db.collection('lists').doc(listId).get();
    if (!listDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Lista no encontrada'
      });
    }

    const listData = listDoc.data();
    if (!listData.isPublic) {
      return res.status(403).json({
        success: false,
        message: 'Solo se pueden ver calificaciones de items de listas públicas'
      });
    }

    // Obtener todas las calificaciones del item
    const ratingsSnapshot = await db.collection('itemRatings')
      .where('listId', '==', listId)
      .where('itemId', '==', itemId)
      .get();

    let totalRating = 0;
    let ratingCount = 0;
    const ratings = [];

    ratingsSnapshot.forEach(doc => {
      const data = doc.data();
      totalRating += data.rating;
      ratingCount++;
      ratings.push({
        id: doc.id,
        userId: data.userId,
        rating: data.rating,
        createdAt: data.createdAt
      });
    });

    const averageRating = ratingCount > 0 ? (totalRating / ratingCount).toFixed(1) : 0;

    res.json({
      success: true,
      message: 'Calificaciones obtenidas exitosamente',
      data: {
        itemId: itemId,
        averageRating: parseFloat(averageRating),
        totalRatings: ratingCount,
        ratings: ratings
      }
    });

  } catch (error) {
    console.error('❌ [LISTS] Error obteniendo calificaciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo calificaciones',
      error: error.message
    });
  }
});

// Endpoint para dar/quitar estrella a una lista pública
app.post('/api/lists/:listId/star', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { listId } = req.params;

    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Base de datos no disponible'
      });
    }

    // Verificar que la lista existe y es pública
    const listDoc = await db.collection('lists').doc(listId).get();
    if (!listDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Lista no encontrada'
      });
    }

    const listData = listDoc.data();
    if (!listData.isPublic) {
      return res.status(403).json({
        success: false,
        message: 'Solo se pueden calificar listas públicas'
      });
    }

    // Verificar si el usuario ya dio estrella
    const existingStar = await db.collection('listStars')
      .where('listId', '==', listId)
      .where('userId', '==', uid)
      .get();

    let newStarsCount = listData.stars || 0;

    if (existingStar.empty) {
      // Agregar estrella
      await db.collection('listStars').add({
        listId: listId,
        userId: uid,
        createdAt: new Date()
      });
      newStarsCount += 1;
    } else {
      // Quitar estrella
      await db.collection('listStars').doc(existingStar.docs[0].id).delete();
      newStarsCount = Math.max(0, newStarsCount - 1);
    }

    // Actualizar contador de estrellas en la lista
    await db.collection('lists').doc(listId).update({
      stars: newStarsCount,
      updatedAt: new Date()
    });

    console.log('✅ [LISTS] Estrella actualizada:', listId, newStarsCount);

    res.json({
      success: true,
      message: 'Estrella actualizada exitosamente',
      data: {
        listId: listId,
        stars: newStarsCount,
        hasStarred: existingStar.empty
      }
    });

  } catch (error) {
    console.error('❌ [LISTS] Error actualizando estrella:', error);
    res.status(500).json({
      success: false,
      message: 'Error actualizando estrella',
      error: error.message
    });
  }
});

// Endpoint para comentar en un item de lista pública
app.post('/api/lists/:listId/items/:itemId/comments', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { listId, itemId } = req.params;
    const { content } = req.body;

    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Base de datos no disponible'
      });
    }

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'El contenido del comentario es obligatorio'
      });
    }

    // Verificar que la lista existe y es pública
    const listDoc = await db.collection('lists').doc(listId).get();
    if (!listDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Lista no encontrada'
      });
    }

    const listData = listDoc.data();
    if (!listData.isPublic) {
      return res.status(403).json({
        success: false,
        message: 'Solo se pueden comentar listas públicas'
      });
    }

    // Verificar que el item existe
    const item = listData.items.find(item => item.id === itemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item no encontrado'
      });
    }

    // Crear el comentario
    const commentData = {
      listId: listId,
      itemId: itemId,
      userId: uid,
      userName: req.user.displayName || 'Usuario',
      content: content.trim(),
      createdAt: new Date()
    };

    const commentRef = await db.collection('listComments').add(commentData);

    // Actualizar contador de comentarios en la lista
    const newCommentsCount = (listData.comments || 0) + 1;
    await db.collection('lists').doc(listId).update({
      comments: newCommentsCount,
      updatedAt: new Date()
    });

    console.log('✅ [LISTS] Comentario agregado exitosamente:', commentRef.id);

    res.json({
      success: true,
      message: 'Comentario agregado exitosamente',
      data: {
        id: commentRef.id,
        ...commentData,
        commentsCount: newCommentsCount
      }
    });

  } catch (error) {
    console.error('❌ [LISTS] Error agregando comentario:', error);
    res.status(500).json({
      success: false,
      message: 'Error agregando comentario',
      error: error.message
    });
  }
});

// Endpoint para obtener comentarios de un item de lista pública
app.get('/api/lists/:listId/items/:itemId/comments', async (req, res) => {
  try {
    const { listId, itemId } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Base de datos no disponible'
      });
    }

    // Verificar que la lista existe y es pública
    const listDoc = await db.collection('lists').doc(listId).get();
    if (!listDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Lista no encontrada'
      });
    }

    const listData = listDoc.data();
    if (!listData.isPublic) {
      return res.status(403).json({
        success: false,
        message: 'Solo se pueden ver comentarios de listas públicas'
      });
    }

    // Obtener comentarios del item
    const commentsSnapshot = await db.collection('listComments')
      .where('listId', '==', listId)
      .where('itemId', '==', itemId)
      .orderBy('createdAt', 'desc')
      .limit(parseInt(limit))
      .offset(parseInt(offset))
      .get();

    const comments = [];
    
    // Obtener información de perfil para cada comentario
    for (const doc of commentsSnapshot.docs) {
      const data = doc.data();
      
      // Obtener información del perfil del usuario
      let userProfile = null;
      try {
        const userDoc = await db.collection('users').doc(data.userId).get();
        if (userDoc.exists) {
          const userData = userDoc.data();
          userProfile = {
            displayName: userData.displayName || data.userName || 'Usuario',
            photoURL: userData.photoURL || null
          };
        }
      } catch (error) {
        console.log('⚠️ [LISTS] Error obteniendo perfil del usuario:', data.userId, error.message);
        // Usar datos del comentario como fallback
        userProfile = {
          displayName: data.userName || 'Usuario',
          photoURL: null
        };
      }

      comments.push({
        id: doc.id,
        listId: data.listId,
        itemId: data.itemId,
        userId: data.userId,
        userName: userProfile.displayName,
        userPhoto: userProfile.photoURL,
        content: data.content,
        createdAt: data.createdAt
      });
    }

    res.json({
      success: true,
      message: 'Comentarios obtenidos exitosamente',
      data: comments
    });

  } catch (error) {
    console.error('❌ [LISTS] Error obteniendo comentarios:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo comentarios',
      error: error.message
    });
  }
});

// Endpoint para obtener detalles de una lista pública con información de interacción del usuario
app.get('/api/lists/:listId', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { listId } = req.params;

    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Base de datos no disponible'
      });
    }

    // Obtener la lista
    const listDoc = await db.collection('lists').doc(listId).get();
    if (!listDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Lista no encontrada'
      });
    }

    const listData = listDoc.data();

    // Verificar si el usuario puede ver la lista
    if (!listData.isPublic && listData.creatorId !== uid) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para ver esta lista'
      });
    }

    // Obtener información de interacción del usuario (solo para listas públicas)
    let hasStarred = false;
    if (listData.isPublic) {
      const userStar = await db.collection('listStars')
        .where('listId', '==', listId)
        .where('userId', '==', uid)
        .get();
      hasStarred = !userStar.empty;
    }

    // Obtener calificaciones y comentarios para cada item
    let itemsWithStats = [];
    if (listData.items && listData.items.length > 0) {
      itemsWithStats = await Promise.all(
        listData.items.map(async (item) => {
          // Si el item no tiene ID, retornar sin stats
          if (!item.id) {
            console.warn('⚠️ [LISTS] Item sin ID encontrado:', item);
            return {
              ...item,
              averageRating: 0,
              totalRatings: 0,
              commentCount: 0
            };
          }

          // Obtener calificaciones del item
          const ratingsSnapshot = await db.collection('itemRatings')
            .where('listId', '==', listId)
            .where('itemId', '==', item.id)
            .get();

          let totalRating = 0;
          let ratingCount = 0;
          ratingsSnapshot.forEach(doc => {
            totalRating += doc.data().rating;
            ratingCount++;
          });
          const averageRating = ratingCount > 0 ? (totalRating / ratingCount).toFixed(1) : 0;

          // Obtener comentarios del item
          const commentsSnapshot = await db.collection('listComments')
            .where('listId', '==', listId)
            .where('itemId', '==', item.id)
            .get();

          const commentCount = commentsSnapshot.size;

          return {
            ...item,
            averageRating: parseFloat(averageRating),
            totalRatings: ratingCount,
            commentCount: commentCount
          };
        })
      );
    }

    res.json({
      success: true,
      message: 'Lista obtenida exitosamente',
      data: {
        id: listDoc.id,
        title: listData.title,
        description: listData.description,
        imageUrl: listData.imageUrl || null,
        isPublic: listData.isPublic,
        creatorId: listData.creatorId,
        isOwner: listData.creatorId === uid, // ← NUEVO: indicar si es el propietario
        items: itemsWithStats, // ← NUEVO: items con estadísticas
        completedItems: listData.completedItems || 0,
        totalItems: listData.totalItems || 0,
        stars: listData.stars || 0,
        comments: listData.comments || 0,
        hasStarred: hasStarred,
        isCreator: listData.creatorId === uid, // Mantener por compatibilidad
        createdAt: listData.createdAt,
        updatedAt: listData.updatedAt
      }
    });

  } catch (error) {
    console.error('❌ [LISTS] Error obteniendo lista:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo lista',
      error: error.message
    });
  }
});

// Endpoint para copiar una lista pública
app.post('/api/lists/:listId/copy', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { listId } = req.params;

    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Base de datos no disponible'
      });
    }

    // Obtener la lista original
    const originalListDoc = await db.collection('lists').doc(listId).get();
    if (!originalListDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Lista no encontrada'
      });
    }

    const originalData = originalListDoc.data();
    
    // Verificar que la lista sea pública
    if (!originalData.isPublic) {
      return res.status(403).json({
        success: false,
        message: 'Solo se pueden copiar listas públicas'
      });
    }

    // Crear la copia
    const copiedListData = {
      title: `${originalData.title} (Copia)`,
      description: originalData.description,
      imageUrl: originalData.imageUrl, // Copiar imagen de la lista original
      isPublic: false, // La copia es privada por defecto
      creatorId: uid,
      originalListId: listId, // Referencia a la lista original
      items: originalData.items.map(item => ({
        ...item,
        id: `item_${Date.now()}_${Math.random()}`,
        completed: false, // Resetear estado de completado
        createdAt: new Date()
      })),
      completedItems: 0,
      totalItems: originalData.items.length,
      stars: 0,
      comments: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const copiedListRef = await db.collection('lists').add(copiedListData);
    
    console.log('✅ [LISTS] Lista copiada exitosamente:', copiedListRef.id);

    res.json({
      success: true,
      message: 'Lista copiada exitosamente',
      data: {
        id: copiedListRef.id,
        ...copiedListData
      }
    });

  } catch (error) {
    console.error('❌ [LISTS] Error copiando lista:', error);
    res.status(500).json({
      success: false,
      message: 'Error copiando lista',
      error: error.message
    });
  }
});

// ===== SISTEMA DE PUBLICACIONES EN COMUNIDADES =====

// Endpoint para crear una publicación en una comunidad (recibe URL de imagen)
app.post('/api/communities/:communityId/posts', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { communityId } = req.params;
    const { content, imageUrl } = req.body;

    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Base de datos no disponible'
      });
    }

    // Verificar que el usuario es miembro de la comunidad
    const communityRef = db.collection('communities').doc(communityId);
    const communityDoc = await communityRef.get();

    if (!communityDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Comunidad no encontrada'
      });
    }

    const communityData = communityDoc.data();
    if (!communityData.members || !communityData.members.includes(uid)) {
      return res.status(403).json({
        success: false,
        message: 'Debes ser miembro de la comunidad para publicar'
      });
    }

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'El contenido de la publicación es obligatorio'
      });
    }

    // Validar que la URL de imagen sea válida si se proporciona
    if (imageUrl && !imageUrl.startsWith('http')) {
      return res.status(400).json({
        success: false,
        message: 'La URL de la imagen debe ser válida'
      });
    }

    // Crear la publicación
    const postData = {
      communityId: communityId,
      authorId: uid,
      content: content.trim(),
      likes: [],
      likeCount: 0,
      commentCount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Solo agregar imageUrl si existe y no es undefined
    if (imageUrl) {
      postData.imageUrl = imageUrl;
    }

    const postRef = await db.collection('posts').add(postData);
    
    console.log('✅ [POST] Publicación creada exitosamente:', postRef.id);

    res.json({
      success: true,
      message: 'Publicación creada exitosamente',
      data: {
        id: postRef.id,
        ...postData
      }
    });

  } catch (error) {
    console.error('❌ [POST] Error creando publicación:', error);
    res.status(500).json({
      success: false,
      message: 'Error creando publicación',
      error: error.message
    });
  }
});

// Endpoint para obtener publicaciones de una comunidad
app.get('/api/communities/:communityId/posts', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { communityId } = req.params;

    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Base de datos no disponible'
      });
    }

    // Verificar que el usuario es miembro de la comunidad
    const communityRef = db.collection('communities').doc(communityId);
    const communityDoc = await communityRef.get();

    if (!communityDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Comunidad no encontrada'
      });
    }

    const communityData = communityDoc.data();
    if (!communityData.members || !communityData.members.includes(uid)) {
      return res.status(403).json({
        success: false,
        message: 'Debes ser miembro de la comunidad para ver las publicaciones'
      });
    }

    // Obtener publicaciones ordenadas por fecha
    let postsSnapshot;
    try {
      postsSnapshot = await db.collection('posts')
        .where('communityId', '==', communityId)
        .orderBy('createdAt', 'desc')
        .get();
    } catch (indexError) {
      console.log('⚠️ [POSTS] Índice no disponible, obteniendo sin ordenamiento:', indexError.message);
      // Fallback: obtener sin ordenamiento
      postsSnapshot = await db.collection('posts')
        .where('communityId', '==', communityId)
        .get();
    }

    const posts = [];
    for (const doc of postsSnapshot.docs) {
      const postData = doc.data();
      
      // Obtener información del autor
      let authorName = 'Usuario';
      try {
        const authorDoc = await db.collection('users').doc(postData.authorId).get();
        if (authorDoc.exists) {
          authorName = authorDoc.data().displayName || 'Usuario';
        }
      } catch (error) {
        console.log('⚠️ [POST] Error obteniendo nombre del autor:', error.message);
      }

      posts.push({
        id: doc.id,
        content: postData.content,
        imageUrl: postData.imageUrl,
        authorId: postData.authorId,
        authorName: authorName,
        likes: postData.likes || [],
        likeCount: postData.likeCount || 0,
        commentCount: postData.commentCount || 0,
        isLiked: postData.likes && postData.likes.includes(uid),
        createdAt: postData.createdAt,
        updatedAt: postData.updatedAt
      });
    }

    res.json({
      success: true,
      data: posts
    });

  } catch (error) {
    console.error('❌ [POST] Error obteniendo publicaciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo publicaciones',
      error: error.message
    });
  }
});

// Endpoint para dar like a una publicación
app.post('/api/posts/:postId/like', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { postId } = req.params;

    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Base de datos no disponible'
      });
    }

    const postRef = db.collection('posts').doc(postId);
    const postDoc = await postRef.get();

    if (!postDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Publicación no encontrada'
      });
    }

    const postData = postDoc.data();
    const isLiked = postData.likes && postData.likes.includes(uid);

    if (isLiked) {
      // Quitar like
      await postRef.update({
        likes: admin.firestore.FieldValue.arrayRemove(uid),
        likeCount: admin.firestore.FieldValue.increment(-1),
        updatedAt: new Date()
      });
      
      console.log('✅ [POST] Like removido:', uid, postId);
      
      res.json({
        success: true,
        message: 'Like removido',
        data: { liked: false }
      });
    } else {
      // Agregar like
      await postRef.update({
        likes: admin.firestore.FieldValue.arrayUnion(uid),
        likeCount: admin.firestore.FieldValue.increment(1),
        updatedAt: new Date()
      });
      
      console.log('✅ [POST] Like agregado:', uid, postId);
      
      res.json({
        success: true,
        message: 'Like agregado',
        data: { liked: true }
      });
    }

  } catch (error) {
    console.error('❌ [POST] Error manejando like:', error);
    res.status(500).json({
      success: false,
      message: 'Error manejando like',
      error: error.message
    });
  }
});

// Endpoint para comentar en una publicación
app.post('/api/posts/:postId/comments', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { postId } = req.params;
    const { content } = req.body;

    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Base de datos no disponible'
      });
    }

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'El contenido del comentario es obligatorio'
      });
    }

    // Verificar que la publicación existe
    const postRef = db.collection('posts').doc(postId);
    const postDoc = await postRef.get();

    if (!postDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Publicación no encontrada'
      });
    }

    // Crear el comentario
    const commentData = {
      postId: postId,
      authorId: uid,
      content: content.trim(),
      likes: [],
      likeCount: 0,
      createdAt: new Date()
    };

    const commentRef = await db.collection('comments').add(commentData);

    // Incrementar contador de comentarios en la publicación
    await postRef.update({
      commentCount: admin.firestore.FieldValue.increment(1),
      updatedAt: new Date()
    });

    console.log('✅ [COMMENT] Comentario creado exitosamente:', commentRef.id);

    res.json({
      success: true,
      message: 'Comentario creado exitosamente',
      data: {
        id: commentRef.id,
        ...commentData
      }
    });

  } catch (error) {
    console.error('❌ [COMMENT] Error creando comentario:', error);
    res.status(500).json({
      success: false,
      message: 'Error creando comentario',
      error: error.message
    });
  }
});

// Endpoint para obtener comentarios de una publicación
app.get('/api/posts/:postId/comments', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { postId } = req.params;

    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Base de datos no disponible'
      });
    }

    // Obtener comentarios ordenados por fecha
    let commentsSnapshot;
    try {
      commentsSnapshot = await db.collection('comments')
        .where('postId', '==', postId)
        .orderBy('createdAt', 'asc')
        .get();
    } catch (indexError) {
      console.log('⚠️ [COMMENTS] Índice no disponible, obteniendo sin ordenamiento:', indexError.message);
      // Fallback: obtener sin ordenamiento
      commentsSnapshot = await db.collection('comments')
        .where('postId', '==', postId)
        .get();
    }

    const comments = [];
    for (const doc of commentsSnapshot.docs) {
      const commentData = doc.data();
      
      // Obtener nombre del autor
      let authorName = 'Usuario';
      try {
        const authorDoc = await db.collection('users').doc(commentData.authorId).get();
        if (authorDoc.exists) {
          authorName = authorDoc.data().displayName || 'Usuario';
        }
      } catch (error) {
        console.log('⚠️ [COMMENT] Error obteniendo nombre del autor:', error.message);
      }

      comments.push({
        id: doc.id,
        content: commentData.content,
        authorId: commentData.authorId,
        authorName: authorName,
        likes: commentData.likes || [],
        likeCount: commentData.likeCount || 0,
        isLiked: commentData.likes && commentData.likes.includes(uid),
        createdAt: commentData.createdAt
      });
    }

    res.json({
      success: true,
      data: comments
    });

  } catch (error) {
    console.error('❌ [COMMENT] Error obteniendo comentarios:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo comentarios',
      error: error.message
    });
  }
});

// Endpoint para dar like a un comentario
app.post('/api/comments/:commentId/like', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { commentId } = req.params;

    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Base de datos no disponible'
      });
    }

    const commentRef = db.collection('comments').doc(commentId);
    const commentDoc = await commentRef.get();

    if (!commentDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Comentario no encontrado'
      });
    }

    const commentData = commentDoc.data();
    const isLiked = commentData.likes && commentData.likes.includes(uid);

    if (isLiked) {
      // Quitar like
      await commentRef.update({
        likes: admin.firestore.FieldValue.arrayRemove(uid),
        likeCount: admin.firestore.FieldValue.increment(-1),
        updatedAt: new Date()
      });
      
      console.log('✅ [COMMENT] Like removido del comentario:', uid, commentId);
      
      res.json({
        success: true,
        message: 'Like removido del comentario',
        data: { liked: false }
      });
    } else {
      // Agregar like
      await commentRef.update({
        likes: admin.firestore.FieldValue.arrayUnion(uid),
        likeCount: admin.firestore.FieldValue.increment(1),
        updatedAt: new Date()
      });
      
      console.log('✅ [COMMENT] Like agregado al comentario:', uid, commentId);
      
      res.json({
        success: true,
        message: 'Like agregado al comentario',
        data: { liked: true }
      });
    }

  } catch (error) {
    console.error('❌ [COMMENT] Error manejando like del comentario:', error);
    res.status(500).json({
      success: false,
      message: 'Error manejando like del comentario',
      error: error.message
    });
  }
});

// Endpoint de prueba para verificar almacenamiento de tips
app.post('/api/children/test-storage', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;
    
    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Base de datos no disponible'
      });
    }

    // Intentar crear un documento de prueba
    const testData = {
      userId: uid,
      tipType: 'test',
      tip: 'Este es un tip de prueba para verificar el almacenamiento',
      childrenContext: 'Test context',
      isPregnant: false,
      currentGestationWeeks: 0,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    };

    console.log('🧪 [TEST] Intentando crear documento de prueba:', testData);

    const docRef = await db.collection('userTips').add(testData);
    
    console.log('✅ [TEST] Documento de prueba creado exitosamente. ID:', docRef.id);

    // Verificar que se puede leer
    const readDoc = await db.collection('userTips').doc(docRef.id).get();
    
    if (readDoc.exists) {
      console.log('✅ [TEST] Documento leído exitosamente:', readDoc.data());
      
      // Limpiar el documento de prueba
      await db.collection('userTips').doc(docRef.id).delete();
      console.log('🧹 [TEST] Documento de prueba eliminado');
      
      res.json({
        success: true,
        message: 'Prueba de almacenamiento exitosa',
        data: {
          created: true,
          read: true,
          deleted: true,
          documentId: docRef.id
        }
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Error: El documento no se puede leer después de crearlo'
      });
    }

  } catch (error) {
    console.error('❌ [TEST] Error en prueba de almacenamiento:', error);
    res.status(500).json({
      success: false,
      message: 'Error en prueba de almacenamiento',
      error: error.message
    });
  }
});

// Endpoint para limpiar tips antiguos (opcional, para mantenimiento)
app.post('/api/children/cleanup-tips', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;
    
    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Base de datos no disponible'
      });
    }

    // Eliminar tips expirados (más de 30 días)
    const expiredDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const expiredTipsSnapshot = await db.collection('userTips')
      .where('userId', '==', uid)
      .where('expiresAt', '<', expiredDate)
      .get();

    let deletedCount = 0;
    const batch = db.batch();
    
    expiredTipsSnapshot.forEach(doc => {
      batch.delete(doc.ref);
      deletedCount++;
    });

    if (deletedCount > 0) {
      await batch.commit();
      console.log(`🧹 Limpieza de tips: ${deletedCount} tips expirados eliminados para usuario ${uid}`);
    }

    res.json({
      success: true,
      message: `Limpieza completada. ${deletedCount} tips expirados eliminados.`
    });

  } catch (error) {
    console.error('❌ Error en limpieza de tips:', error);
    res.status(500).json({
      success: false,
      message: 'Error en limpieza de tips'
    });
  }
});

// Función para generar tips de fallback (solo para hijos)
function generateFallbackTips(children, tipType) {
  // Rotar entre los hijos para dar variedad - usar timestamp + tipType para más variedad
  const now = Date.now();
  const timeAndType = now + tipType.length + tipType.charCodeAt(0);
  
  const childIndex = Math.floor((timeAndType / 30000) % children.length); // Cambia cada 30 segundos + variación por tipo
  const selectedChild = children[childIndex];
  let tip = '';
  
  if (tipType === 'general' || tipType === 'desarrollo') {
    if (selectedChild.isUnborn) {
      if (selectedChild.currentGestationWeeks >= 40) {
        tip = `🤰 ¡${selectedChild.name} está listo para nacer! Mantén la calma y confía en tu cuerpo.`;
      } else if (selectedChild.currentGestationWeeks >= 37) {
        tip = `👶 ${selectedChild.name} ya no es prematuro desde las 37 semanas. ¡Estás en la recta final!`;
      } else if (selectedChild.currentGestationWeeks >= 28) {
        tip = `💕 ${selectedChild.name} ya puede soñar y reconocer tu voz. Habla con él/ella todos los días.`;
      } else {
        tip = `🌟 ${selectedChild.name} está creciendo bien en tu vientre. Mantén una alimentación saludable.`;
      }
    } else {
      if (selectedChild.currentAgeInMonths <= 6) {
        tip = `🍼 La leche materna es el mejor alimento para ${selectedChild.name}. Amamanta a demanda.`;
      } else if (selectedChild.currentAgeInMonths <= 12) {
        tip = `🥄 Introduce alimentos sólidos gradualmente a ${selectedChild.name}. Un alimento nuevo cada 3-4 días.`;
      } else if (selectedChild.currentAgeInMonths <= 24) {
        tip = `🚶 ${selectedChild.name} está explorando el mundo. Mantén tu casa segura para niños.`;
      } else if (selectedChild.currentAgeInMonths <= 36) {
        tip = `🎨 Fomenta la creatividad de ${selectedChild.name} con dibujos, manualidades y juegos imaginativos.`;
      } else {
        tip = `📚 Lee cuentos con ${selectedChild.name}. Es una excelente manera de fortalecer el vínculo.`;
      }
    }
  } else if (tipType === 'alimentacion') {
    if (!selectedChild.isUnborn) {
      if (selectedChild.currentAgeInMonths <= 6) {
        tip = `🤱 Amamanta exclusivamente a ${selectedChild.name} hasta los 6 meses. No necesita agua ni otros alimentos.`;
      } else if (selectedChild.currentAgeInMonths <= 12) {
        tip = `🥑 Introduce frutas y verduras de colores variados a ${selectedChild.name} para una nutrición completa.`;
      } else if (selectedChild.currentAgeInMonths <= 24) {
        tip = `🥛 Ofrece a ${selectedChild.name} 3 comidas principales y 2-3 refrigerios saludables al día.`;
      } else {
        tip = `🍎 Incluye en la dieta de ${selectedChild.name} proteínas magras, granos enteros y muchas frutas y verduras.`;
      }
    } else {
      tip = `🤰 Para ${selectedChild.name}, mantén una alimentación rica en ácido fólico, hierro y calcio durante el embarazo.`;
    }
  } else if (tipType === 'salud') {
    if (!selectedChild.isUnborn) {
      if (selectedChild.currentAgeInMonths <= 12) {
        tip = `💉 Mantén al día el calendario de vacunación de ${selectedChild.name}. Es fundamental para su salud.`;
      } else if (selectedChild.currentAgeInMonths <= 24) {
        tip = `🦷 Cepilla los dientes de ${selectedChild.name} 2 veces al día con pasta dental con flúor.`;
      } else {
        tip = `🏃 Fomenta en ${selectedChild.name} al menos 1 hora de actividad física diaria para un desarrollo saludable.`;
      }
    } else {
      tip = `🏥 Asiste a todas las citas prenatales para monitorear el desarrollo saludable de ${selectedChild.name}.`;
    }
  } else if (tipType === 'sueño') {
    if (!selectedChild.isUnborn) {
      if (selectedChild.currentAgeInMonths <= 6) {
        tip = `😴 ${selectedChild.name} necesita 14-17 horas de sueño total al día. Respeta sus ritmos naturales.`;
      } else if (selectedChild.currentAgeInMonths <= 12) {
        tip = `🌙 Establece una rutina de sueño consistente para ${selectedChild.name}: baño, cuento y cuna a la misma hora.`;
      } else if (selectedChild.currentAgeInMonths <= 24) {
        tip = `🛏️ ${selectedChild.name} necesita 11-14 horas de sueño, incluyendo 1-2 siestas durante el día.`;
      } else {
        tip = `💤 ${selectedChild.name} necesita 10-13 horas de sueño. Mantén horarios regulares para un descanso óptimo.`;
      }
    } else {
      tip = `😴 Descansa bien durante el embarazo. Tu descanso también beneficia el desarrollo de ${selectedChild.name}.`;
    }
  } else if (tipType === 'actividades') {
    if (!selectedChild.isUnborn) {
      if (selectedChild.currentAgeInMonths <= 6) {
        tip = `🎵 Canta canciones y haz movimientos rítmicos con ${selectedChild.name}. Estimula su desarrollo auditivo y motor.`;
      } else if (selectedChild.currentAgeInMonths <= 12) {
        tip = `🧸 Juega a esconder objetos con ${selectedChild.name}. Desarrolla su memoria y comprensión de permanencia.`;
      } else if (selectedChild.currentAgeInMonths <= 24) {
        tip = `🏗️ Construye torres con bloques junto a ${selectedChild.name}. Mejora su coordinación y pensamiento espacial.`;
      } else {
        tip = `🎭 Juega a disfrazarse con ${selectedChild.name}. Fomenta la imaginación y la expresión creativa.`;
      }
    } else {
      tip = `💕 Habla, canta y acaricia tu vientre. ${selectedChild.name} puede sentir tu amor desde el útero.`;
    }
  }

  // Si no hay tip específico, generar uno general personalizado
  if (!tip) {
    tip = `💕 ${selectedChild.name} es único. Confía en tu instinto maternal/paternal para criarlo.`;
  }

  return [tip]; // Retornar solo 1 tip
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

// ==========================================
// 📋 ENDPOINTS DE PERFIL COMPLETO DE HIJOS
// ==========================================

// ==========================================
// 1. VACUNAS
// ==========================================

// Obtener vacunas de un hijo
app.get('/api/children/:childId/vaccines', authenticateToken, async (req, res) => {
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
    if (!childDoc.exists || childDoc.data().parentId !== uid) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para acceder a este hijo'
      });
    }

    const vaccinesSnapshot = await db.collection('children').doc(childId)
      .collection('vaccines')
      .orderBy('scheduledDate', 'asc')
      .get();

    const vaccines = [];
    vaccinesSnapshot.forEach(doc => {
      vaccines.push({
        id: doc.id,
        ...doc.data()
      });
    });

    res.json({
      success: true,
      data: vaccines
    });

  } catch (error) {
    console.error('❌ Error obteniendo vacunas:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo vacunas',
      error: error.message
    });
  }
});

// Agregar/actualizar vacuna
app.post('/api/children/:childId/vaccines', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { childId } = req.params;
    const { 
      name, 
      scheduledDate, 
      appliedDate, 
      status, // 'pending', 'applied', 'skipped'
      location,
      batch,
      notes
    } = req.body;

    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Base de datos no disponible'
      });
    }

    // Verificar que el hijo pertenece al usuario
    const childDoc = await db.collection('children').doc(childId).get();
    if (!childDoc.exists || childDoc.data().parentId !== uid) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para acceder a este hijo'
      });
    }

    const vaccineData = {
      name,
      scheduledDate: new Date(scheduledDate),
      appliedDate: appliedDate ? new Date(appliedDate) : null,
      status: status || 'pending',
      location: location || '',
      batch: batch || '',
      notes: notes || '',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const vaccineRef = await db.collection('children').doc(childId)
      .collection('vaccines')
      .add(vaccineData);

    res.json({
      success: true,
      message: 'Vacuna registrada exitosamente',
      data: {
        id: vaccineRef.id,
        ...vaccineData
      }
    });

  } catch (error) {
    console.error('❌ Error registrando vacuna:', error);
    res.status(500).json({
      success: false,
      message: 'Error registrando vacuna',
      error: error.message
    });
  }
});

// ==========================================
// 2. CITAS MÉDICAS
// ==========================================

// Obtener citas médicas
app.get('/api/children/:childId/appointments', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { childId } = req.params;

    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Base de datos no disponible'
      });
    }

    // Verificar permisos
    const childDoc = await db.collection('children').doc(childId).get();
    if (!childDoc.exists || childDoc.data().parentId !== uid) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para acceder a este hijo'
      });
    }

    const appointmentsSnapshot = await db.collection('children').doc(childId)
      .collection('appointments')
      .orderBy('date', 'desc')
      .get();

    const appointments = [];
    appointmentsSnapshot.forEach(doc => {
      appointments.push({
        id: doc.id,
        ...doc.data()
      });
    });

    res.json({
      success: true,
      data: appointments
    });

  } catch (error) {
    console.error('❌ Error obteniendo citas:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo citas',
      error: error.message
    });
  }
});

// Agregar cita médica
app.post('/api/children/:childId/appointments', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { childId } = req.params;
    const { 
      type, // 'checkup', 'specialist', 'emergency', 'vaccine'
      date,
      doctor,
      location,
      reason,
      notes,
      status // 'scheduled', 'completed', 'cancelled'
    } = req.body;

    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Base de datos no disponible'
      });
    }

    // Verificar permisos
    const childDoc = await db.collection('children').doc(childId).get();
    if (!childDoc.exists || childDoc.data().parentId !== uid) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para acceder a este hijo'
      });
    }

    const appointmentData = {
      type: type || 'checkup',
      date: new Date(date),
      doctor: doctor || '',
      location: location || '',
      reason: reason || '',
      notes: notes || '',
      status: status || 'scheduled',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const appointmentRef = await db.collection('children').doc(childId)
      .collection('appointments')
      .add(appointmentData);

    res.json({
      success: true,
      message: 'Cita registrada exitosamente',
      data: {
        id: appointmentRef.id,
        ...appointmentData
      }
    });

  } catch (error) {
    console.error('❌ Error registrando cita:', error);
    res.status(500).json({
      success: false,
      message: 'Error registrando cita',
      error: error.message
    });
  }
});

// ==========================================
// 3. MEDICAMENTOS
// ==========================================

// Obtener medicamentos
app.get('/api/children/:childId/medications', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { childId } = req.params;

    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Base de datos no disponible'
      });
    }

    const childDoc = await db.collection('children').doc(childId).get();
    if (!childDoc.exists || childDoc.data().parentId !== uid) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso'
      });
    }

    const medicationsSnapshot = await db.collection('children').doc(childId)
      .collection('medications')
      .orderBy('startDate', 'desc')
      .get();

    const medications = [];
    medicationsSnapshot.forEach(doc => {
      medications.push({
        id: doc.id,
        ...doc.data()
      });
    });

    res.json({
      success: true,
      data: medications
    });

  } catch (error) {
    console.error('❌ Error obteniendo medicamentos:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo medicamentos',
      error: error.message
    });
  }
});

// Agregar medicamento
app.post('/api/children/:childId/medications', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { childId } = req.params;
    const { 
      name,
      dosage,
      frequency,
      startDate,
      endDate,
      reason,
      prescribedBy,
      notes,
      status // 'active', 'completed', 'discontinued'
    } = req.body;

    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Base de datos no disponible'
      });
    }

    const childDoc = await db.collection('children').doc(childId).get();
    if (!childDoc.exists || childDoc.data().parentId !== uid) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso'
      });
    }

    const medicationData = {
      name,
      dosage,
      frequency,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
      reason: reason || '',
      prescribedBy: prescribedBy || '',
      notes: notes || '',
      status: status || 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const medicationRef = await db.collection('children').doc(childId)
      .collection('medications')
      .add(medicationData);

    res.json({
      success: true,
      message: 'Medicamento registrado exitosamente',
      data: {
        id: medicationRef.id,
        ...medicationData
      }
    });

  } catch (error) {
    console.error('❌ Error registrando medicamento:', error);
    res.status(500).json({
      success: false,
      message: 'Error registrando medicamento',
      error: error.message
    });
  }
});

// ==========================================
// 4. ALERGIAS (actualizar hijo con campo allergies)
// ==========================================

// Actualizar alergias del hijo
app.put('/api/children/:childId/allergies', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { childId } = req.params;
    const { allergies } = req.body; // array de strings

    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Base de datos no disponible'
      });
    }

    const childDoc = await db.collection('children').doc(childId).get();
    if (!childDoc.exists || childDoc.data().parentId !== uid) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso'
      });
    }

    await db.collection('children').doc(childId).update({
      allergies: allergies || [],
      updatedAt: new Date()
    });

    res.json({
      success: true,
      message: 'Alergias actualizadas exitosamente',
      data: {
        allergies
      }
    });

  } catch (error) {
    console.error('❌ Error actualizando alergias:', error);
    res.status(500).json({
      success: false,
      message: 'Error actualizando alergias',
      error: error.message
    });
  }
});

// ==========================================
// 5. HISTORIAL MÉDICO
// ==========================================

// Obtener historial médico
app.get('/api/children/:childId/medical-history', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { childId } = req.params;

    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Base de datos no disponible'
      });
    }

    const childDoc = await db.collection('children').doc(childId).get();
    if (!childDoc.exists || childDoc.data().parentId !== uid) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso'
      });
    }

    const historySnapshot = await db.collection('children').doc(childId)
      .collection('medical_history')
      .orderBy('date', 'desc')
      .get();

    const history = [];
    historySnapshot.forEach(doc => {
      history.push({
        id: doc.id,
        ...doc.data()
      });
    });

    res.json({
      success: true,
      data: history
    });

  } catch (error) {
    console.error('❌ Error obteniendo historial médico:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo historial médico',
      error: error.message
    });
  }
});

// Agregar entrada al historial médico
app.post('/api/children/:childId/medical-history', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { childId } = req.params;
    const { 
      type, // 'diagnosis', 'treatment', 'surgery', 'hospitalization', 'other'
      date,
      title,
      description,
      doctor,
      location,
      attachments // URLs de documentos/imágenes
    } = req.body;

    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Base de datos no disponible'
      });
    }

    const childDoc = await db.collection('children').doc(childId).get();
    if (!childDoc.exists || childDoc.data().parentId !== uid) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso'
      });
    }

    const historyData = {
      type: type || 'other',
      date: new Date(date),
      title,
      description: description || '',
      doctor: doctor || '',
      location: location || '',
      attachments: attachments || [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const historyRef = await db.collection('children').doc(childId)
      .collection('medical_history')
      .add(historyData);

    res.json({
      success: true,
      message: 'Historial médico actualizado exitosamente',
      data: {
        id: historyRef.id,
        ...historyData
      }
    });

  } catch (error) {
    console.error('❌ Error actualizando historial médico:', error);
    res.status(500).json({
      success: false,
      message: 'Error actualizando historial médico',
      error: error.message
    });
  }
});

// ==========================================
// 6. MEDICIONES (Peso, Altura, Perímetro Cefálico)
// ==========================================

// Obtener mediciones
app.get('/api/children/:childId/measurements', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { childId } = req.params;

    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Base de datos no disponible'
      });
    }

    const childDoc = await db.collection('children').doc(childId).get();
    if (!childDoc.exists || childDoc.data().parentId !== uid) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso'
      });
    }

    const measurementsSnapshot = await db.collection('children').doc(childId)
      .collection('measurements')
      .orderBy('date', 'desc')
      .get();

    const measurements = [];
    measurementsSnapshot.forEach(doc => {
      measurements.push({
        id: doc.id,
        ...doc.data()
      });
    });

    res.json({
      success: true,
      data: measurements
    });

  } catch (error) {
    console.error('❌ Error obteniendo mediciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo mediciones',
      error: error.message
    });
  }
});

// Agregar medición
app.post('/api/children/:childId/measurements', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { childId } = req.params;
    const { 
      date,
      weight, // en kg
      height, // en cm
      headCircumference, // en cm
      notes
    } = req.body;

    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Base de datos no disponible'
      });
    }

    const childDoc = await db.collection('children').doc(childId).get();
    if (!childDoc.exists || childDoc.data().parentId !== uid) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso'
      });
    }

    const measurementData = {
      date: new Date(date),
      weight: weight || null,
      height: height || null,
      headCircumference: headCircumference || null,
      notes: notes || '',
      createdAt: new Date()
    };

    const measurementRef = await db.collection('children').doc(childId)
      .collection('measurements')
      .add(measurementData);

    res.json({
      success: true,
      message: 'Medición registrada exitosamente',
      data: {
        id: measurementRef.id,
        ...measurementData
      }
    });

  } catch (error) {
    console.error('❌ Error registrando medición:', error);
    res.status(500).json({
      success: false,
      message: 'Error registrando medición',
      error: error.message
    });
  }
});

// ==========================================
// 7. SEGUIMIENTO DE SUEÑO
// ==========================================

// Obtener registros de sueño
app.get('/api/children/:childId/sleep-tracking', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { childId } = req.params;
    const { startDate, endDate } = req.query;

    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Base de datos no disponible'
      });
    }

    const childDoc = await db.collection('children').doc(childId).get();
    if (!childDoc.exists || childDoc.data().parentId !== uid) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso'
      });
    }

    let query = db.collection('children').doc(childId).collection('sleep_tracking');
    
    if (startDate) {
      query = query.where('date', '>=', new Date(startDate));
    }
    if (endDate) {
      query = query.where('date', '<=', new Date(endDate));
    }

    const sleepSnapshot = await query.orderBy('date', 'desc').get();

    const sleepRecords = [];
    sleepSnapshot.forEach(doc => {
      sleepRecords.push({
        id: doc.id,
        ...doc.data()
      });
    });

    res.json({
      success: true,
      data: sleepRecords
    });

  } catch (error) {
    console.error('❌ Error obteniendo registros de sueño:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo registros de sueño',
      error: error.message
    });
  }
});

// Agregar registro de sueño
app.post('/api/children/:childId/sleep-tracking', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { childId } = req.params;
    const { 
      date,
      sleepTime, // hora de dormir
      wakeTime, // hora de despertar
      duration, // duración en minutos
      quality, // 'good', 'fair', 'poor'
      naps, // array de siestas [{time, duration}]
      notes
    } = req.body;

    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Base de datos no disponible'
      });
    }

    const childDoc = await db.collection('children').doc(childId).get();
    if (!childDoc.exists || childDoc.data().parentId !== uid) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso'
      });
    }

    const sleepData = {
      date: new Date(date),
      sleepTime: sleepTime ? new Date(sleepTime) : null,
      wakeTime: wakeTime ? new Date(wakeTime) : null,
      duration: duration || 0,
      quality: quality || 'fair',
      naps: naps || [],
      notes: notes || '',
      createdAt: new Date()
    };

    const sleepRef = await db.collection('children').doc(childId)
      .collection('sleep_tracking')
      .add(sleepData);

    res.json({
      success: true,
      message: 'Registro de sueño guardado exitosamente',
      data: {
        id: sleepRef.id,
        ...sleepData
      }
    });

  } catch (error) {
    console.error('❌ Error guardando registro de sueño:', error);
    res.status(500).json({
      success: false,
      message: 'Error guardando registro de sueño',
      error: error.message
    });
  }
});

// ==========================================
// 8. REGISTRO DE ALIMENTACIÓN
// ==========================================

// Obtener registros de alimentación
app.get('/api/children/:childId/feeding-log', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { childId } = req.params;
    const { startDate, endDate } = req.query;

    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Base de datos no disponible'
      });
    }

    const childDoc = await db.collection('children').doc(childId).get();
    if (!childDoc.exists || childDoc.data().parentId !== uid) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso'
      });
    }

    let query = db.collection('children').doc(childId).collection('feeding_log');
    
    if (startDate) {
      query = query.where('date', '>=', new Date(startDate));
    }
    if (endDate) {
      query = query.where('date', '<=', new Date(endDate));
    }

    const feedingSnapshot = await query.orderBy('date', 'desc').get();

    const feedingRecords = [];
    feedingSnapshot.forEach(doc => {
      feedingRecords.push({
        id: doc.id,
        ...doc.data()
      });
    });

    res.json({
      success: true,
      data: feedingRecords
    });

  } catch (error) {
    console.error('❌ Error obteniendo registros de alimentación:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo registros de alimentación',
      error: error.message
    });
  }
});

// Agregar registro de alimentación
app.post('/api/children/:childId/feeding-log', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { childId } = req.params;
    const { 
      date,
      type, // 'breastfeeding', 'bottle', 'solid', 'water'
      amount, // ml o gramos
      duration, // minutos (para lactancia)
      food, // descripción del alimento
      breast, // 'left', 'right', 'both' (para lactancia)
      notes
    } = req.body;

    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Base de datos no disponible'
      });
    }

    const childDoc = await db.collection('children').doc(childId).get();
    if (!childDoc.exists || childDoc.data().parentId !== uid) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso'
      });
    }

    const feedingData = {
      date: new Date(date),
      type,
      amount: amount || null,
      duration: duration || null,
      food: food || '',
      breast: breast || null,
      notes: notes || '',
      createdAt: new Date()
    };

    const feedingRef = await db.collection('children').doc(childId)
      .collection('feeding_log')
      .add(feedingData);

    res.json({
      success: true,
      message: 'Registro de alimentación guardado exitosamente',
      data: {
        id: feedingRef.id,
        ...feedingData
      }
    });

  } catch (error) {
    console.error('❌ Error guardando registro de alimentación:', error);
    res.status(500).json({
      success: false,
      message: 'Error guardando registro de alimentación',
      error: error.message
    });
  }
});

// ==========================================
// 9. HITOS DEL DESARROLLO
// ==========================================

// Obtener hitos
app.get('/api/children/:childId/milestones', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { childId } = req.params;

    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Base de datos no disponible'
      });
    }

    const childDoc = await db.collection('children').doc(childId).get();
    if (!childDoc.exists || childDoc.data().parentId !== uid) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso'
      });
    }

    const milestonesSnapshot = await db.collection('children').doc(childId)
      .collection('milestones')
      .orderBy('date', 'desc')
      .get();

    const milestones = [];
    milestonesSnapshot.forEach(doc => {
      milestones.push({
        id: doc.id,
        ...doc.data()
      });
    });

    res.json({
      success: true,
      data: milestones
    });

  } catch (error) {
    console.error('❌ Error obteniendo hitos:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo hitos',
      error: error.message
    });
  }
});

// Agregar hito
app.post('/api/children/:childId/milestones', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { childId } = req.params;
    const { 
      type, // 'first_smile', 'first_word', 'first_step', 'first_tooth', 'custom'
      title,
      date,
      description,
      photos, // array de URLs
      celebrationEmoji
    } = req.body;

    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Base de datos no disponible'
      });
    }

    const childDoc = await db.collection('children').doc(childId).get();
    if (!childDoc.exists || childDoc.data().parentId !== uid) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso'
      });
    }

    const milestoneData = {
      type,
      title,
      date: new Date(date),
      description: description || '',
      photos: photos || [],
      celebrationEmoji: celebrationEmoji || '🎉',
      createdAt: new Date()
    };

    const milestoneRef = await db.collection('children').doc(childId)
      .collection('milestones')
      .add(milestoneData);

    res.json({
      success: true,
      message: 'Hito registrado exitosamente',
      data: {
        id: milestoneRef.id,
        ...milestoneData
      }
    });

  } catch (error) {
    console.error('❌ Error registrando hito:', error);
    res.status(500).json({
      success: false,
      message: 'Error registrando hito',
      error: error.message
    });
  }
});

// ==========================================
// 10. DIARIO DEL BEBÉ
// ==========================================

// Obtener entradas del diario
app.get('/api/children/:childId/diary', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { childId } = req.params;

    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Base de datos no disponible'
      });
    }

    const childDoc = await db.collection('children').doc(childId).get();
    if (!childDoc.exists || childDoc.data().parentId !== uid) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso'
      });
    }

    const diarySnapshot = await db.collection('children').doc(childId)
      .collection('diary')
      .orderBy('date', 'desc')
      .limit(50)
      .get();

    const diaryEntries = [];
    diarySnapshot.forEach(doc => {
      diaryEntries.push({
        id: doc.id,
        ...doc.data()
      });
    });

    res.json({
      success: true,
      data: diaryEntries
    });

  } catch (error) {
    console.error('❌ Error obteniendo diario:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo diario',
      error: error.message
    });
  }
});

// Agregar entrada al diario
app.post('/api/children/:childId/diary', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { childId } = req.params;
    const { 
      date,
      title,
      content,
      mood, // 'happy', 'sad', 'neutral', 'excited'
      photos,
      tags
    } = req.body;

    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Base de datos no disponible'
      });
    }

    const childDoc = await db.collection('children').doc(childId).get();
    if (!childDoc.exists || childDoc.data().parentId !== uid) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso'
      });
    }

    const diaryData = {
      date: new Date(date),
      title: title || '',
      content,
      mood: mood || 'neutral',
      photos: photos || [],
      tags: tags || [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const diaryRef = await db.collection('children').doc(childId)
      .collection('diary')
      .add(diaryData);

    res.json({
      success: true,
      message: 'Entrada del diario guardada exitosamente',
      data: {
        id: diaryRef.id,
        ...diaryData
      }
    });

  } catch (error) {
    console.error('❌ Error guardando entrada del diario:', error);
    res.status(500).json({
      success: false,
      message: 'Error guardando entrada del diario',
      error: error.message
    });
  }
});

// ==========================================
// 11. ÁLBUMES DE FOTOS
// ==========================================

// Obtener álbumes
app.get('/api/children/:childId/albums', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { childId } = req.params;

    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Base de datos no disponible'
      });
    }

    const childDoc = await db.collection('children').doc(childId).get();
    if (!childDoc.exists || childDoc.data().parentId !== uid) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso'
      });
    }

    const albumsSnapshot = await db.collection('children').doc(childId)
      .collection('albums')
      .orderBy('createdAt', 'desc')
      .get();

    const albums = [];
    albumsSnapshot.forEach(doc => {
      albums.push({
        id: doc.id,
        ...doc.data()
      });
    });

    res.json({
      success: true,
      data: albums
    });

  } catch (error) {
    console.error('❌ Error obteniendo álbumes:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo álbumes',
      error: error.message
    });
  }
});

// Crear álbum
app.post('/api/children/:childId/albums', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { childId } = req.params;
    const { 
      name,
      description,
      coverPhoto,
      photos, // array de {url, caption, date}
      theme // 'birthday', 'first_year', 'vacation', 'custom'
    } = req.body;

    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Base de datos no disponible'
      });
    }

    const childDoc = await db.collection('children').doc(childId).get();
    if (!childDoc.exists || childDoc.data().parentId !== uid) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso'
      });
    }

    const albumData = {
      name,
      description: description || '',
      coverPhoto: coverPhoto || '',
      photos: photos || [],
      theme: theme || 'custom',
      photoCount: (photos || []).length,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const albumRef = await db.collection('children').doc(childId)
      .collection('albums')
      .add(albumData);

    res.json({
      success: true,
      message: 'Álbum creado exitosamente',
      data: {
        id: albumRef.id,
        ...albumData
      }
    });

  } catch (error) {
    console.error('❌ Error creando álbum:', error);
    res.status(500).json({
      success: false,
      message: 'Error creando álbum',
      error: error.message
    });
  }
});

// Agregar fotos a un álbum
app.post('/api/children/:childId/albums/:albumId/photos', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { childId, albumId } = req.params;
    const { photos } = req.body; // array de {url, caption, date}

    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Base de datos no disponible'
      });
    }

    const childDoc = await db.collection('children').doc(childId).get();
    if (!childDoc.exists || childDoc.data().parentId !== uid) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso'
      });
    }

    const albumRef = db.collection('children').doc(childId).collection('albums').doc(albumId);
    const albumDoc = await albumRef.get();

    if (!albumDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Álbum no encontrado'
      });
    }

    const currentPhotos = albumDoc.data().photos || [];
    const updatedPhotos = [...currentPhotos, ...photos];

    await albumRef.update({
      photos: updatedPhotos,
      photoCount: updatedPhotos.length,
      updatedAt: new Date()
    });

    res.json({
      success: true,
      message: 'Fotos agregadas al álbum exitosamente',
      data: {
        photoCount: updatedPhotos.length
      }
    });

  } catch (error) {
    console.error('❌ Error agregando fotos al álbum:', error);
    res.status(500).json({
      success: false,
      message: 'Error agregando fotos al álbum',
      error: error.message
    });
  }
});

// ==========================================
// 12. CUIDADORES (Compartir acceso)
// ==========================================

// Obtener cuidadores
app.get('/api/children/:childId/caregivers', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { childId } = req.params;

    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Base de datos no disponible'
      });
    }

    const childDoc = await db.collection('children').doc(childId).get();
    if (!childDoc.exists || childDoc.data().parentId !== uid) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso'
      });
    }

    const caregiversSnapshot = await db.collection('children').doc(childId)
      .collection('caregivers')
      .get();

    const caregivers = [];
    caregiversSnapshot.forEach(doc => {
      caregivers.push({
        id: doc.id,
        ...doc.data()
      });
    });

    res.json({
      success: true,
      data: caregivers
    });

  } catch (error) {
    console.error('❌ Error obteniendo cuidadores:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo cuidadores',
      error: error.message
    });
  }
});

// Agregar cuidador
app.post('/api/children/:childId/caregivers', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { childId } = req.params;
    const { 
      email,
      name,
      relationship, // 'father', 'mother', 'grandparent', 'other'
      permissions // {canEdit: bool, canViewMedical: bool, canViewPhotos: bool}
    } = req.body;

    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Base de datos no disponible'
      });
    }

    const childDoc = await db.collection('children').doc(childId).get();
    if (!childDoc.exists || childDoc.data().parentId !== uid) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso'
      });
    }

    // Verificar si el email ya existe como cuidador
    const existingCaregiver = await db.collection('children').doc(childId)
      .collection('caregivers')
      .where('email', '==', email)
      .get();

    if (!existingCaregiver.empty) {
      return res.status(400).json({
        success: false,
        message: 'Este email ya está registrado como cuidador'
      });
    }

    const caregiverData = {
      email,
      name: name || '',
      relationship: relationship || 'other',
      permissions: permissions || {
        canEdit: false,
        canViewMedical: true,
        canViewPhotos: true
      },
      status: 'pending', // 'pending', 'active', 'declined'
      invitedAt: new Date(),
      invitedBy: uid
    };

    const caregiverRef = await db.collection('children').doc(childId)
      .collection('caregivers')
      .add(caregiverData);

    res.json({
      success: true,
      message: 'Cuidador invitado exitosamente',
      data: {
        id: caregiverRef.id,
        ...caregiverData
      }
    });

  } catch (error) {
    console.error('❌ Error agregando cuidador:', error);
    res.status(500).json({
      success: false,
      message: 'Error agregando cuidador',
      error: error.message
    });
  }
});

// ==========================================
// 13. EXPORTAR A PDF
// ==========================================

// Exportar información completa del hijo a PDF
app.get('/api/children/:childId/export-pdf', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { childId } = req.params;

    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Base de datos no disponible'
      });
    }

    const childDoc = await db.collection('children').doc(childId).get();
    if (!childDoc.exists || childDoc.data().parentId !== uid) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso'
      });
    }

    const childData = childDoc.data();

    // Recopilar toda la información
    const vaccinesSnapshot = await db.collection('children').doc(childId).collection('vaccines').get();
    const appointmentsSnapshot = await db.collection('children').doc(childId).collection('appointments').get();
    const milestonesSnapshot = await db.collection('children').doc(childId).collection('milestones').get();
    const measurementsSnapshot = await db.collection('children').doc(childId).collection('measurements').get();

    const exportData = {
      child: {
        name: childData.name,
        birthDate: childData.birthDate,
        ageInMonths: childData.currentAgeInMonths,
        allergies: childData.allergies || []
      },
      vaccines: [],
      appointments: [],
      milestones: [],
      measurements: []
    };

    vaccinesSnapshot.forEach(doc => exportData.vaccines.push(doc.data()));
    appointmentsSnapshot.forEach(doc => exportData.appointments.push(doc.data()));
    milestonesSnapshot.forEach(doc => exportData.milestones.push(doc.data()));
    measurementsSnapshot.forEach(doc => exportData.measurements.push(doc.data()));

    // Por ahora devolver JSON (puedes integrar una librería de PDF como PDFKit o Puppeteer)
    res.json({
      success: true,
      message: 'Datos recopilados para exportar',
      data: exportData,
      note: 'Integrar librería de PDF para generar documento descargable'
    });

  } catch (error) {
    console.error('❌ Error exportando datos:', error);
    res.status(500).json({
      success: false,
      message: 'Error exportando datos',
      error: error.message
    });
  }
});

// ==========================================
// FIN DE ENDPOINTS DE PERFIL DE HIJOS


// ==========================================
// 📝 ENDPOINTS CRUD - UPDATE & DELETE
// ==========================================

// PUT (actualizar) y DELETE (eliminar) para todos los recursos

// ==========================================
// 1. VACUNAS - UPDATE & DELETE
// ==========================================

// Actualizar vacuna
app.put('/api/children/:childId/vaccines/:vaccineId', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { childId, vaccineId } = req.params;
    const { 
      name, 
      scheduledDate, 
      appliedDate, 
      status,
      location,
      batch,
      notes
    } = req.body;

    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Base de datos no disponible'
      });
    }

    // Verificar permisos
    const childDoc = await db.collection('children').doc(childId).get();
    if (!childDoc.exists || childDoc.data().parentId !== uid) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso'
      });
    }

    const updateData = {
      updatedAt: new Date()
    };

    if (name !== undefined) updateData.name = name;
    if (scheduledDate !== undefined) updateData.scheduledDate = new Date(scheduledDate);
    if (appliedDate !== undefined) updateData.appliedDate = appliedDate ? new Date(appliedDate) : null;
    if (status !== undefined) updateData.status = status;
    if (location !== undefined) updateData.location = location;
    if (batch !== undefined) updateData.batch = batch;
    if (notes !== undefined) updateData.notes = notes;

    await db.collection('children').doc(childId)
      .collection('vaccines').doc(vaccineId)
      .update(updateData);

    res.json({
      success: true,
      message: 'Vacuna actualizada exitosamente',
      data: updateData
    });

  } catch (error) {
    console.error('❌ Error actualizando vacuna:', error);
    res.status(500).json({
      success: false,
      message: 'Error actualizando vacuna',
      error: error.message
    });
  }
});

// Eliminar vacuna
app.delete('/api/children/:childId/vaccines/:vaccineId', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { childId, vaccineId } = req.params;

    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Base de datos no disponible'
      });
    }

    const childDoc = await db.collection('children').doc(childId).get();
    if (!childDoc.exists || childDoc.data().parentId !== uid) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso'
      });
    }

    await db.collection('children').doc(childId)
      .collection('vaccines').doc(vaccineId)
      .delete();

    res.json({
      success: true,
      message: 'Vacuna eliminada exitosamente'
    });

  } catch (error) {
    console.error('❌ Error eliminando vacuna:', error);
    res.status(500).json({
      success: false,
      message: 'Error eliminando vacuna',
      error: error.message
    });
  }
});

// ==========================================
// 2. CITAS MÉDICAS - UPDATE & DELETE
// ==========================================

// Actualizar cita médica
app.put('/api/children/:childId/appointments/:appointmentId', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { childId, appointmentId } = req.params;
    const { type, date, doctor, location, reason, notes, status } = req.body;

    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Base de datos no disponible'
      });
    }

    const childDoc = await db.collection('children').doc(childId).get();
    if (!childDoc.exists || childDoc.data().parentId !== uid) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso'
      });
    }

    const updateData = { updatedAt: new Date() };
    if (type !== undefined) updateData.type = type;
    if (date !== undefined) updateData.date = new Date(date);
    if (doctor !== undefined) updateData.doctor = doctor;
    if (location !== undefined) updateData.location = location;
    if (reason !== undefined) updateData.reason = reason;
    if (notes !== undefined) updateData.notes = notes;
    if (status !== undefined) updateData.status = status;

    await db.collection('children').doc(childId)
      .collection('appointments').doc(appointmentId)
      .update(updateData);

    res.json({
      success: true,
      message: 'Cita actualizada exitosamente',
      data: updateData
    });

  } catch (error) {
    console.error('❌ Error actualizando cita:', error);
    res.status(500).json({
      success: false,
      message: 'Error actualizando cita',
      error: error.message
    });
  }
});

// Eliminar cita médica
app.delete('/api/children/:childId/appointments/:appointmentId', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { childId, appointmentId } = req.params;

    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Base de datos no disponible'
      });
    }

    const childDoc = await db.collection('children').doc(childId).get();
    if (!childDoc.exists || childDoc.data().parentId !== uid) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso'
      });
    }

    await db.collection('children').doc(childId)
      .collection('appointments').doc(appointmentId)
      .delete();

    res.json({
      success: true,
      message: 'Cita eliminada exitosamente'
    });

  } catch (error) {
    console.error('❌ Error eliminando cita:', error);
    res.status(500).json({
      success: false,
      message: 'Error eliminando cita',
      error: error.message
    });
  }
});

// ==========================================
// 3. MEDICAMENTOS - UPDATE & DELETE
// ==========================================

// Actualizar medicamento
app.put('/api/children/:childId/medications/:medicationId', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { childId, medicationId } = req.params;
    const { name, dosage, frequency, startDate, endDate, reason, prescribedBy, notes, status } = req.body;

    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Base de datos no disponible'
      });
    }

    const childDoc = await db.collection('children').doc(childId).get();
    if (!childDoc.exists || childDoc.data().parentId !== uid) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso'
      });
    }

    const updateData = { updatedAt: new Date() };
    if (name !== undefined) updateData.name = name;
    if (dosage !== undefined) updateData.dosage = dosage;
    if (frequency !== undefined) updateData.frequency = frequency;
    if (startDate !== undefined) updateData.startDate = new Date(startDate);
    if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null;
    if (reason !== undefined) updateData.reason = reason;
    if (prescribedBy !== undefined) updateData.prescribedBy = prescribedBy;
    if (notes !== undefined) updateData.notes = notes;
    if (status !== undefined) updateData.status = status;

    await db.collection('children').doc(childId)
      .collection('medications').doc(medicationId)
      .update(updateData);

    res.json({
      success: true,
      message: 'Medicamento actualizado exitosamente',
      data: updateData
    });

  } catch (error) {
    console.error('❌ Error actualizando medicamento:', error);
    res.status(500).json({
      success: false,
      message: 'Error actualizando medicamento',
      error: error.message
    });
  }
});

// Eliminar medicamento
app.delete('/api/children/:childId/medications/:medicationId', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { childId, medicationId } = req.params;

    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Base de datos no disponible'
      });
    }

    const childDoc = await db.collection('children').doc(childId).get();
    if (!childDoc.exists || childDoc.data().parentId !== uid) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso'
      });
    }

    await db.collection('children').doc(childId)
      .collection('medications').doc(medicationId)
      .delete();

    res.json({
      success: true,
      message: 'Medicamento eliminado exitosamente'
    });

  } catch (error) {
    console.error('❌ Error eliminando medicamento:', error);
    res.status(500).json({
      success: false,
      message: 'Error eliminando medicamento',
      error: error.message
    });
  }
});

// ==========================================
// 4. HISTORIAL MÉDICO - UPDATE & DELETE
// ==========================================

// Actualizar historial médico
app.put('/api/children/:childId/medical-history/:historyId', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { childId, historyId } = req.params;
    const { type, date, title, description, doctor, location, attachments } = req.body;

    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Base de datos no disponible'
      });
    }

    const childDoc = await db.collection('children').doc(childId).get();
    if (!childDoc.exists || childDoc.data().parentId !== uid) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso'
      });
    }

    const updateData = { updatedAt: new Date() };
    if (type !== undefined) updateData.type = type;
    if (date !== undefined) updateData.date = new Date(date);
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (doctor !== undefined) updateData.doctor = doctor;
    if (location !== undefined) updateData.location = location;
    if (attachments !== undefined) updateData.attachments = attachments;

    await db.collection('children').doc(childId)
      .collection('medical_history').doc(historyId)
      .update(updateData);

    res.json({
      success: true,
      message: 'Historial médico actualizado exitosamente',
      data: updateData
    });

  } catch (error) {
    console.error('❌ Error actualizando historial médico:', error);
    res.status(500).json({
      success: false,
      message: 'Error actualizando historial médico',
      error: error.message
    });
  }
});

// Eliminar historial médico
app.delete('/api/children/:childId/medical-history/:historyId', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { childId, historyId } = req.params;

    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Base de datos no disponible'
      });
    }

    const childDoc = await db.collection('children').doc(childId).get();
    if (!childDoc.exists || childDoc.data().parentId !== uid) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso'
      });
    }

    await db.collection('children').doc(childId)
      .collection('medical_history').doc(historyId)
      .delete();

    res.json({
      success: true,
      message: 'Historial médico eliminado exitosamente'
    });

  } catch (error) {
    console.error('❌ Error eliminando historial médico:', error);
    res.status(500).json({
      success: false,
      message: 'Error eliminando historial médico',
      error: error.message
    });
  }
});

// ==========================================
// 5. MEDICIONES - UPDATE & DELETE
// ==========================================

// Actualizar medición
app.put('/api/children/:childId/measurements/:measurementId', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { childId, measurementId } = req.params;
    const { date, weight, height, headCircumference, notes } = req.body;

    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Base de datos no disponible'
      });
    }

    const childDoc = await db.collection('children').doc(childId).get();
    if (!childDoc.exists || childDoc.data().parentId !== uid) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso'
      });
    }

    const updateData = {};
    if (date !== undefined) updateData.date = new Date(date);
    if (weight !== undefined) updateData.weight = weight;
    if (height !== undefined) updateData.height = height;
    if (headCircumference !== undefined) updateData.headCircumference = headCircumference;
    if (notes !== undefined) updateData.notes = notes;

    await db.collection('children').doc(childId)
      .collection('measurements').doc(measurementId)
      .update(updateData);

    res.json({
      success: true,
      message: 'Medición actualizada exitosamente',
      data: updateData
    });

  } catch (error) {
    console.error('❌ Error actualizando medición:', error);
    res.status(500).json({
      success: false,
      message: 'Error actualizando medición',
      error: error.message
    });
  }
});

// Eliminar medición
app.delete('/api/children/:childId/measurements/:measurementId', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { childId, measurementId } = req.params;

    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Base de datos no disponible'
      });
    }

    const childDoc = await db.collection('children').doc(childId).get();
    if (!childDoc.exists || childDoc.data().parentId !== uid) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso'
      });
    }

    await db.collection('children').doc(childId)
      .collection('measurements').doc(measurementId)
      .delete();

    res.json({
      success: true,
      message: 'Medición eliminada exitosamente'
    });

  } catch (error) {
    console.error('❌ Error eliminando medición:', error);
    res.status(500).json({
      success: false,
      message: 'Error eliminando medición',
      error: error.message
    });
  }
});

// ==========================================
// 6. HITOS - UPDATE & DELETE
// ==========================================

// Actualizar hito
app.put('/api/children/:childId/milestones/:milestoneId', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { childId, milestoneId } = req.params;
    const { type, title, date, description, photos, celebrationEmoji } = req.body;

    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Base de datos no disponible'
      });
    }

    const childDoc = await db.collection('children').doc(childId).get();
    if (!childDoc.exists || childDoc.data().parentId !== uid) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso'
      });
    }

    const updateData = {};
    if (type !== undefined) updateData.type = type;
    if (title !== undefined) updateData.title = title;
    if (date !== undefined) updateData.date = new Date(date);
    if (description !== undefined) updateData.description = description;
    if (photos !== undefined) updateData.photos = photos;
    if (celebrationEmoji !== undefined) updateData.celebrationEmoji = celebrationEmoji;

    await db.collection('children').doc(childId)
      .collection('milestones').doc(milestoneId)
      .update(updateData);

    res.json({
      success: true,
      message: 'Hito actualizado exitosamente',
      data: updateData
    });

  } catch (error) {
    console.error('❌ Error actualizando hito:', error);
    res.status(500).json({
      success: false,
      message: 'Error actualizando hito',
      error: error.message
    });
  }
});

// Eliminar hito
app.delete('/api/children/:childId/milestones/:milestoneId', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { childId, milestoneId } = req.params;

    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Base de datos no disponible'
      });
    }

    const childDoc = await db.collection('children').doc(childId).get();
    if (!childDoc.exists || childDoc.data().parentId !== uid) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso'
      });
    }

    await db.collection('children').doc(childId)
      .collection('milestones').doc(milestoneId)
      .delete();

    res.json({
      success: true,
      message: 'Hito eliminado exitosamente'
    });

  } catch (error) {
    console.error('❌ Error eliminando hito:', error);
    res.status(500).json({
      success: false,
      message: 'Error eliminando hito',
      error: error.message
    });
  }
});

// ==========================================
// 7. DIARIO - UPDATE & DELETE
// ==========================================

// Actualizar entrada del diario
app.put('/api/children/:childId/diary/:diaryId', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { childId, diaryId } = req.params;
    const { date, title, content, mood, photos, tags } = req.body;

    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Base de datos no disponible'
      });
    }

    const childDoc = await db.collection('children').doc(childId).get();
    if (!childDoc.exists || childDoc.data().parentId !== uid) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso'
      });
    }

    const updateData = { updatedAt: new Date() };
    if (date !== undefined) updateData.date = new Date(date);
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (mood !== undefined) updateData.mood = mood;
    if (photos !== undefined) updateData.photos = photos;
    if (tags !== undefined) updateData.tags = tags;

    await db.collection('children').doc(childId)
      .collection('diary').doc(diaryId)
      .update(updateData);

    res.json({
      success: true,
      message: 'Entrada del diario actualizada exitosamente',
      data: updateData
    });

  } catch (error) {
    console.error('❌ Error actualizando entrada del diario:', error);
    res.status(500).json({
      success: false,
      message: 'Error actualizando entrada del diario',
      error: error.message
    });
  }
});

// Eliminar entrada del diario
app.delete('/api/children/:childId/diary/:diaryId', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { childId, diaryId } = req.params;

    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Base de datos no disponible'
      });
    }

    const childDoc = await db.collection('children').doc(childId).get();
    if (!childDoc.exists || childDoc.data().parentId !== uid) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso'
      });
    }

    await db.collection('children').doc(childId)
      .collection('diary').doc(diaryId)
      .delete();

    res.json({
      success: true,
      message: 'Entrada del diario eliminada exitosamente'
    });

  } catch (error) {
    console.error('❌ Error eliminando entrada del diario:', error);
    res.status(500).json({
      success: false,
      message: 'Error eliminando entrada del diario',
      error: error.message
    });
  }
});

// ==========================================
// 8. ÁLBUMES - UPDATE & DELETE
// ==========================================

// Actualizar álbum
app.put('/api/children/:childId/albums/:albumId', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { childId, albumId } = req.params;
    const { name, description, coverPhoto, theme } = req.body;

    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Base de datos no disponible'
      });
    }

    const childDoc = await db.collection('children').doc(childId).get();
    if (!childDoc.exists || childDoc.data().parentId !== uid) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso'
      });
    }

    const updateData = { updatedAt: new Date() };
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (coverPhoto !== undefined) updateData.coverPhoto = coverPhoto;
    if (theme !== undefined) updateData.theme = theme;

    await db.collection('children').doc(childId)
      .collection('albums').doc(albumId)
      .update(updateData);

    res.json({
      success: true,
      message: 'Álbum actualizado exitosamente',
      data: updateData
    });

  } catch (error) {
    console.error('❌ Error actualizando álbum:', error);
    res.status(500).json({
      success: false,
      message: 'Error actualizando álbum',
      error: error.message
    });
  }
});

// Eliminar álbum
app.delete('/api/children/:childId/albums/:albumId', authenticateToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const { childId, albumId } = req.params;

    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Base de datos no disponible'
      });
    }

    const childDoc = await db.collection('children').doc(childId).get();
    if (!childDoc.exists || childDoc.data().parentId !== uid) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso'
      });
    }

    await db.collection('children').doc(childId)
      .collection('albums').doc(albumId)
      .delete();

    res.json({
      success: true,
      message: 'Álbum eliminado exitosamente'
    });

  } catch (error) {
    console.error('❌ Error eliminando álbum:', error);
    res.status(500).json({
      success: false,
      message: 'Error eliminando álbum',
      error: error.message
    });
  }
});

// ==========================================
// FIN DE ENDPOINTS CRUD ADICIONALES
// ==========================================





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


