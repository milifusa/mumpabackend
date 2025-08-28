// Cargar variables de entorno desde archivo .env
require('dotenv').config();

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://munpa.online', 'https://www.munpa.online'] 
    : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware de logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Configurar Firebase usando el archivo JSON
let auth = null;
let db = null;
let firebaseStatus = 'No inicializado';

const setupFirebase = () => {
  try {
    console.log('🔥 Configurando Firebase con variables de entorno...');
    
    const admin = require('firebase-admin');
    
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
        credential: admin.credential.cert(serviceAccount)
      });
      console.log('✅ Firebase Admin inicializado');
    } else {
      console.log('✅ Firebase Admin ya estaba inicializado');
    }
    
    auth = admin.auth();
    db = admin.firestore();
    
    console.log('✅ Firebase Auth y Firestore configurados');
    firebaseStatus = 'Configurado correctamente';
    return true;
  } catch (error) {
    console.error('❌ Error configurando Firebase:', error.message);
    firebaseStatus = `Error: ${error.message}`;
    return false;
  }
};

// Inicializar Firebase
const firebaseReady = setupFirebase();

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
      hasDb: !!db
    }
  });
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
    const { email, password, displayName } = req.body;

    if (!auth) {
      return res.status(500).json({
        success: false,
        message: 'Firebase no está configurado',
        error: 'Auth service not available',
        firebaseStatus: firebaseStatus
      });
    }

    console.log('📝 Intentando registrar usuario:', email);

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
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true
      });
      console.log('✅ Documento creado en Firestore');
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

// Middleware de autenticación
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
      // PRIMERO intentar como customToken
      console.log('🔄 [AUTH] Intentando verificar como customToken...');
      const decodedCustomToken = await auth.verifyCustomToken(token);
      console.log('✅ [AUTH] CustomToken verificado exitosamente');
      console.log('👤 [AUTH] UID del token:', decodedCustomToken.uid);
      
      req.user = {
        uid: decodedCustomToken.uid,
        ...decodedCustomToken
      };
      
      console.log('✅ [AUTH] req.user configurado:', req.user);
      next();
    } catch (customTokenError) {
      console.log('❌ [AUTH] Error verificando customToken:', customTokenError.message);
      
      // SEGUNDO intentar como idToken
      try {
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
    }
  } catch (error) {
    console.error('❌ [AUTH] Error general en autenticación:', error);
    return res.status(403).json({
      success: false,
      message: 'Token inválido o expirado'
    });
  }
};

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
      lastSignIn: userRecord.metadata.lastSignInTime
    };

    // Obtener datos adicionales de Firestore
    if (db) {
      const userDoc = await db.collection('users').doc(uid).get();
      if (userDoc.exists) {
        userData = { ...userData, ...userDoc.data() };
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
    const { displayName, email } = req.body;

    const updateData = {};
    if (displayName) updateData.displayName = displayName;
    if (email) updateData.email = email;

    // Actualizar en Firebase Auth
    await auth.updateUser(uid, updateData);

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
