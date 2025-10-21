// ============================================
// 🍎 COMPONENTE DE BOTÓN DE APPLE LOGIN
// ============================================

import React, { useEffect, useState } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Platform,
  ActivityIndicator,
  View
} from 'react-native';
import { loginWithApple, isAppleAuthAvailable } from './services/appleAuth';

/**
 * Botón de Sign in with Apple
 * 
 * @param {Object} props
 * @param {Function} props.onSuccess - Callback cuando el login es exitoso
 * @param {Function} props.onError - Callback cuando hay un error
 * @param {string} props.buttonText - Texto personalizado del botón (opcional)
 * @param {Object} props.style - Estilos personalizados (opcional)
 */
const AppleLoginButton = ({ 
  onSuccess, 
  onError,
  buttonText = 'Continuar con Apple',
  style = {}
}) => {
  const [isAvailable, setIsAvailable] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkAvailability();
  }, []);

  const checkAvailability = async () => {
    setChecking(true);
    
    // Apple Sign-In solo está disponible en iOS 13+
    if (Platform.OS !== 'ios') {
      setIsAvailable(false);
      setChecking(false);
      return;
    }

    try {
      const available = await isAppleAuthAvailable();
      setIsAvailable(available);
    } catch (error) {
      console.error('Error verificando disponibilidad de Apple Auth:', error);
      setIsAvailable(false);
    } finally {
      setChecking(false);
    }
  };

  const handleAppleLogin = async () => {
    if (loading) return;
    
    setLoading(true);
    
    try {
      const result = await loginWithApple();
      
      if (result.success) {
        console.log('✅ Login con Apple exitoso:', result.user);
        onSuccess && onSuccess(result);
      } else {
        // No mostrar error si el usuario canceló
        if (!result.cancelled) {
          console.error('❌ Error en login con Apple:', result.error);
          onError && onError(result.error);
        }
      }
    } catch (error) {
      console.error('❌ Error inesperado en login:', error);
      onError && onError('Error inesperado al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  // No mostrar el botón mientras verifica disponibilidad
  if (checking) {
    return null;
  }

  // No mostrar el botón si Apple Sign-In no está disponible
  if (!isAvailable) {
    return null;
  }

  return (
    <TouchableOpacity 
      onPress={handleAppleLogin}
      disabled={loading}
      style={[styles.appleButton, loading && styles.buttonDisabled, style]}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color="#fff" size="small" />
      ) : (
        <View style={styles.buttonContent}>
          {/* Icono de Apple */}
          <View style={styles.iconContainer}>
            <Text style={styles.appleIcon}></Text>
          </View>
          
          {/* Texto del botón */}
          <Text style={styles.appleButtonText}>
            {buttonText}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  appleButton: {
    backgroundColor: '#000000',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginRight: 12,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appleIcon: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  appleButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});

export default AppleLoginButton;

// ============================================
// 📱 EJEMPLO DE USO EN PANTALLA DE LOGIN
// ============================================

/*

import React from 'react';
import { View, Alert } from 'react-native';
import AppleLoginButton from './components/AppleLoginButton';
import { useNavigation } from '@react-navigation/native';

const LoginScreen = () => {
  const navigation = useNavigation();

  const handleAppleSuccess = (result) => {
    Alert.alert(
      '¡Bienvenida! 🎉',
      result.isNewUser 
        ? `Tu cuenta ha sido creada exitosamente.\n\n¡Bienvenida a Mumpa!`
        : `¡Hola de nuevo${result.user.displayName ? ', ' + result.user.displayName : ''}! 😊`,
      [
        {
          text: 'Continuar',
          onPress: () => {
            // Navegar a la app principal
            navigation.replace('Home');
          }
        }
      ]
    );
  };

  const handleAppleError = (error) => {
    Alert.alert('Error', error);
  };

  return (
    <View style={{ padding: 20 }}>
      <AppleLoginButton 
        onSuccess={handleAppleSuccess}
        onError={handleAppleError}
      />
    </View>
  );
};

export default LoginScreen;

*/

