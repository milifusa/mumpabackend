const { auth, db } = require('../config/firebase');
const bcrypt = require('bcryptjs');

// Controlador de autenticación
const authController = {
  // Registro de usuario
  async signup(req, res) {
    try {
      const { email, password, displayName } = req.body;

      // Verificar si el usuario ya existe
      try {
        const existingUser = await auth.getUserByEmail(email);
        return res.status(400).json({
          success: false,
          message: 'El usuario ya existe con este email'
        });
      } catch (error) {
        // El usuario no existe, continuar con el registro
      }

      // Crear usuario en Firebase Auth
      const userRecord = await auth.createUser({
        email,
        password,
        displayName,
        emailVerified: false
      });

      // Crear documento adicional en Firestore
      await db.collection('users').doc(userRecord.uid).set({
        email,
        displayName,
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true
      });

      // Generar token personalizado
      const customToken = await auth.createCustomToken(userRecord.uid);

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
      console.error('Error en signup:', error);
      res.status(500).json({
        success: false,
        message: 'Error al registrar usuario',
        error: error.message
      });
    }
  },

  // Login de usuario
  async login(req, res) {
    try {
      const { email, password } = req.body;

      // Firebase Auth maneja la autenticación automáticamente
      // En un entorno real, el cliente debería usar Firebase Auth SDK
      // Este endpoint es principalmente para verificar credenciales
      
      // Buscar usuario por email
      const userRecord = await auth.getUserByEmail(email);
      
      // Verificar que el usuario esté activo
      const userDoc = await db.collection('users').doc(userRecord.uid).get();
      
      if (!userDoc.exists || !userDoc.data().isActive) {
        return res.status(401).json({
          success: false,
          message: 'Usuario inactivo o no encontrado'
        });
      }

      // Generar token personalizado
      const customToken = await auth.createCustomToken(userRecord.uid);

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
      console.error('Error en login:', error);
      res.status(401).json({
        success: false,
        message: 'Credenciales inválidas',
        error: error.message
      });
    }
  },

  // Obtener perfil del usuario
  async getProfile(req, res) {
    try {
      const { uid } = req.user;

      const userRecord = await auth.getUser(uid);
      const userDoc = await db.collection('users').doc(uid).get();

      if (!userDoc.exists) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      res.json({
        success: true,
        data: {
          uid: userRecord.uid,
          email: userRecord.email,
          displayName: userRecord.displayName,
          emailVerified: userRecord.emailVerified,
          createdAt: userRecord.metadata.creationTime,
          lastSignIn: userRecord.metadata.lastSignInTime,
          ...userDoc.data()
        }
      });

    } catch (error) {
      console.error('Error al obtener perfil:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener perfil del usuario',
        error: error.message
      });
    }
  },

  // Actualizar perfil del usuario
  async updateProfile(req, res) {
    try {
      const { uid } = req.user;
      const { displayName } = req.body;

      // Actualizar en Firebase Auth
      await auth.updateUser(uid, {
        displayName
      });

      // Actualizar en Firestore
      await db.collection('users').doc(uid).update({
        displayName,
        updatedAt: new Date()
      });

      res.json({
        success: true,
        message: 'Perfil actualizado exitosamente'
      });

    } catch (error) {
      console.error('Error al actualizar perfil:', error);
      res.status(500).json({
        success: false,
        message: 'Error al actualizar perfil',
        error: error.message
      });
    }
  },

  // Cambiar contraseña
  async changePassword(req, res) {
    try {
      const { uid } = req.user;
      const { newPassword } = req.body;

      await auth.updateUser(uid, {
        password: newPassword
      });

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
  },

  // Eliminar cuenta
  async deleteAccount(req, res) {
    try {
      const { uid } = req.user;

      // Marcar como inactivo en Firestore
      await db.collection('users').doc(uid).update({
        isActive: false,
        deletedAt: new Date()
      });

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
  },

  // Verificar token
  async verifyToken(req, res) {
    try {
      const { uid } = req.user;
      
      res.json({
        success: true,
        message: 'Token válido',
        data: {
          uid,
          isValid: true
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
  }
};

module.exports = authController;
