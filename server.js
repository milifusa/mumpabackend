// Cargar variables de entorno desde archivo .env
require('dotenv').config();

const express = require('express');
const cors = require('cors');

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

    console.log('🔑 [FORGOT-PASSWORD] Solicitando restablecimiento para:', email);

    // Verificar si el usuario existe
    const userRecord = await auth.getUserByEmail(email);
    
    if (!userRecord) {
      return res.status(404).json({
        success: false,
        message: 'No se encontró una cuenta con este email'
      });
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

    res.status(500).json({
      success: false,
      message: 'Error al procesar la solicitud de restablecimiento'
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
      message: 'Error al restablecer la contraseña'
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
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const childRef = await db.collection('children').add(childData);
    
    // Actualizar contador de hijos en el perfil
    const userRef = db.collection('users').doc(uid);
    await userRef.update({
      childrenCount: admin.firestore.FieldValue.increment(1),
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
    const { name, ageInMonths, isUnborn, gestationWeeks } = req.body;

    if (!name && ageInMonths === undefined && isUnborn === undefined && gestationWeeks === undefined) {
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
    
    // Si se cambia el estado de gestación, limpiar campos no aplicables
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

    // Actualizar contador de hijos en el perfil
    const userRef = db.collection('users').doc(uid);
    await userRef.update({
      childrenCount: admin.firestore.FieldValue.increment(-1),
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
