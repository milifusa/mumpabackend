// ============================================
// 🍎 CÓDIGO DE LOGIN CON APPLE - LISTO PARA USAR
// ============================================

import appleAuth from '@invertase/react-native-apple-authentication';
import auth from '@react-native-firebase/auth';
import axios from 'axios';

const API_URL = 'https://mumpabackend-4aj667ejx-mishu-lojans-projects.vercel.app';

/**
 * Login con Apple
 * @returns {Promise<{success: boolean, user?: object, error?: string, isNewUser?: boolean}>}
 */
export const loginWithApple = async () => {
  try {
    console.log('🍎 Iniciando login con Apple...');

    // 1. Hacer la petición de login a Apple
    const appleAuthRequestResponse = await appleAuth.performRequest({
      requestedOperation: appleAuth.Operation.LOGIN,
      requestedScopes: [
        appleAuth.Scope.EMAIL,
        appleAuth.Scope.FULL_NAME,
      ],
    });

    console.log('✅ Respuesta de Apple:', {
      user: appleAuthRequestResponse.user,
      email: appleAuthRequestResponse.email,
      fullName: appleAuthRequestResponse.fullName,
      hasIdentityToken: !!appleAuthRequestResponse.identityToken
    });

    // 2. Verificar que recibimos los datos necesarios
    const { identityToken, email, fullName, user } = appleAuthRequestResponse;

    if (!identityToken) {
      throw new Error('No se recibió el identity token de Apple');
    }

    // ⚠️ IMPORTANTE: Apple solo envía fullName en el PRIMER login
    // Después será null
    console.log('📝 Nombre completo (solo disponible en primer login):', fullName);

    // 3. Preparar datos para enviar al backend
    const userData = {
      identityToken: identityToken,
      email: email,
      fullName: fullName, // { givenName, familyName } o null
      user: user // Apple User ID
    };

    console.log('📤 Enviando datos al backend...');

    // 4. Enviar al backend
    const response = await axios.post(
      `${API_URL}/api/auth/apple-login`,
      userData,
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000 // 10 segundos de timeout
      }
    );

    console.log('✅ Respuesta del backend:', response.data);

    if (response.data.success) {
      // 5. Obtener el customToken
      const { customToken, uid, displayName, email: userEmail } = response.data.data;
      
      console.log('🔑 Autenticando en Firebase con customToken...');

      // 6. Autenticar en Firebase usando el customToken
      const userCredential = await auth().signInWithCustomToken(customToken);
      
      console.log('✅ Usuario autenticado en Firebase:', userCredential.user.uid);
      
      // 7. Retornar resultado exitoso
      return {
        success: true,
        user: {
          uid: uid,
          email: userEmail,
          displayName: displayName,
          photoURL: null // Apple no proporciona foto
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
    console.error('❌ Error en login con Apple:', error);
    
    // Manejo de errores específicos de Apple Sign-In
    if (error.code === appleAuth.Error.CANCELED) {
      console.log('ℹ️ Usuario canceló el login');
      return { 
        success: false, 
        error: 'Login cancelado por el usuario',
        cancelled: true
      };
    }
    
    if (error.code === appleAuth.Error.FAILED) {
      return { 
        success: false, 
        error: 'Error al autenticar con Apple. Por favor intenta de nuevo.' 
      };
    }
    
    if (error.code === appleAuth.Error.INVALID_RESPONSE) {
      return { 
        success: false, 
        error: 'Respuesta inválida de Apple' 
      };
    }
    
    if (error.code === appleAuth.Error.NOT_HANDLED) {
      return { 
        success: false, 
        error: 'Login con Apple no está configurado correctamente en esta app' 
      };
    }
    
    if (error.code === appleAuth.Error.UNKNOWN) {
      return { 
        success: false, 
        error: 'Error desconocido al iniciar sesión con Apple' 
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
    
    // Error de timeout
    if (error.code === 'ECONNABORTED') {
      return {
        success: false,
        error: 'Tiempo de espera agotado. Verifica tu conexión.'
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
 * Verificar si Sign in with Apple está disponible
 * Solo disponible en iOS 13+ y macOS 10.15+
 * @returns {Promise<boolean>}
 */
export const isAppleAuthAvailable = async () => {
  try {
    const isSupported = await appleAuth.isSupported();
    console.log('🍎 Apple Sign-In disponible:', isSupported);
    return isSupported;
  } catch (error) {
    console.error('❌ Error verificando disponibilidad de Apple Auth:', error);
    return false;
  }
};

/**
 * Obtener el estado de credenciales de Apple
 * Útil para verificar si el usuario sigue autenticado con Apple
 * @param {string} appleUserId - El user ID de Apple
 * @returns {Promise<number>} Estado de las credenciales
 */
export const getAppleCredentialState = async (appleUserId) => {
  try {
    const credentialState = await appleAuth.getCredentialStateForUser(appleUserId);
    
    console.log('🍎 Estado de credenciales:', {
      appleUserId,
      state: credentialState,
      authorized: credentialState === appleAuth.State.AUTHORIZED,
      revoked: credentialState === appleAuth.State.REVOKED,
      notFound: credentialState === appleAuth.State.NOT_FOUND,
    });
    
    return credentialState;
  } catch (error) {
    console.error('❌ Error obteniendo estado de credenciales:', error);
    return null;
  }
};

/**
 * Verificar si las credenciales de Apple siguen siendo válidas
 * @param {string} appleUserId - El user ID de Apple
 * @returns {Promise<boolean>}
 */
export const isAppleCredentialValid = async (appleUserId) => {
  if (!appleUserId) return false;
  
  try {
    const state = await getAppleCredentialState(appleUserId);
    return state === appleAuth.State.AUTHORIZED;
  } catch (error) {
    console.error('❌ Error verificando validez de credenciales:', error);
    return false;
  }
};

// Exportar constantes útiles
export const AppleAuthStates = {
  AUTHORIZED: appleAuth.State.AUTHORIZED,
  REVOKED: appleAuth.State.REVOKED,
  NOT_FOUND: appleAuth.State.NOT_FOUND,
  TRANSFERRED: appleAuth.State.TRANSFERRED,
};

export const AppleAuthErrors = {
  CANCELED: appleAuth.Error.CANCELED,
  FAILED: appleAuth.Error.FAILED,
  INVALID_RESPONSE: appleAuth.Error.INVALID_RESPONSE,
  NOT_HANDLED: appleAuth.Error.NOT_HANDLED,
  UNKNOWN: appleAuth.Error.UNKNOWN,
};

