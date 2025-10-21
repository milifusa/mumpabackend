// ============================================
// 🔐 FUNCIÓN DE LOGIN CON GOOGLE - LISTA PARA USAR
// ============================================

import { GoogleSignin } from '@react-native-google-signin/google-signin';
import axios from 'axios';
import auth from '@react-native-firebase/auth';

const API_URL = 'https://mumpabackend-r4mvj15so-mishu-lojans-projects.vercel.app';

/**
 * Función para hacer login con Google
 * @returns {Promise<{success: boolean, user?: object, error?: string, isNewUser?: boolean}>}
 */
export const loginWithGoogle = async () => {
  try {
    console.log('🔐 Iniciando login con Google...');

    // 1. Verificar que Google Play Services estén disponibles (solo Android)
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

    // 2. Hacer login con Google
    const userInfo = await GoogleSignin.signIn();
    
    console.log('✅ Usuario de Google obtenido:', {
      email: userInfo.user.email,
      name: userInfo.user.name,
      id: userInfo.user.id
    });

    // 3. Preparar datos para enviar al backend
    const userData = {
      email: userInfo.user.email,
      displayName: userInfo.user.name,
      photoURL: userInfo.user.photo,
      googleId: userInfo.user.id
    };

    console.log('📤 Enviando datos al backend...');

    // 4. Enviar al backend usando el endpoint SIMPLE
    const response = await axios.post(
      `${API_URL}/api/auth/google-login-simple`,  // ⭐ IMPORTANTE: usar -simple
      userData,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Respuesta del backend:', response.data);

    if (response.data.success) {
      // 5. Obtener el customToken
      const { customToken, uid, displayName } = response.data.data;
      
      console.log('🔑 Autenticando en Firebase con customToken...');

      // 6. Autenticar en Firebase usando el customToken
      const userCredential = await auth().signInWithCustomToken(customToken);
      
      console.log('✅ Usuario autenticado en Firebase:', userCredential.user.uid);
      
      // 7. Retornar resultado exitoso
      return {
        success: true,
        user: {
          uid: uid,
          email: userData.email,
          displayName: displayName,
          photoURL: userData.photoURL
        },
        isNewUser: response.data.isNewUser
      };
    } else {
      console.error('❌ Backend retornó error:', response.data.message);
      return { 
        success: false, 
        error: response.data.message || 'Error en el login' 
      };
    }
    
  } catch (error) {
    console.error('❌ Error en login con Google:', error);
    
    // Manejo de errores específicos de Google Sign-In
    if (error.code === 'SIGN_IN_CANCELLED') {
      return { 
        success: false, 
        error: 'Login cancelado por el usuario' 
      };
    }
    
    if (error.code === 'IN_PROGRESS') {
      return { 
        success: false, 
        error: 'Login en proceso, por favor espera' 
      };
    }
    
    if (error.code === 'PLAY_SERVICES_NOT_AVAILABLE') {
      return { 
        success: false, 
        error: 'Google Play Services no disponible' 
      };
    }

    // Error de la API del backend
    if (error.response) {
      console.error('❌ Error del backend:', error.response.data);
      return { 
        success: false, 
        error: error.response.data?.message || 'Error del servidor' 
      };
    }
    
    // Error de red u otro
    return { 
      success: false, 
      error: error.message || 'Error desconocido al iniciar sesión' 
    };
  }
};

/**
 * Función para cerrar sesión
 */
export const logoutFromGoogle = async () => {
  try {
    // Cerrar sesión en Google
    await GoogleSignin.signOut();
    
    // Cerrar sesión en Firebase
    await auth().signOut();
    
    console.log('✅ Sesión cerrada correctamente');
    return { success: true };
  } catch (error) {
    console.error('❌ Error al cerrar sesión:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Función para verificar si el usuario ya está logueado
 */
export const checkCurrentUser = async () => {
  try {
    const currentUser = auth().currentUser;
    
    if (currentUser) {
      console.log('✅ Usuario ya está logueado:', currentUser.uid);
      return {
        success: true,
        user: {
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName,
          photoURL: currentUser.photoURL
        }
      };
    }
    
    console.log('ℹ️ No hay usuario logueado');
    return { success: false };
  } catch (error) {
    console.error('❌ Error al verificar usuario:', error);
    return { success: false, error: error.message };
  }
};

