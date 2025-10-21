// ============================================
// 📱 EJEMPLO DE PANTALLA DE LOGIN
// ============================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
  Image
} from 'react-native';
import { loginWithGoogle, checkCurrentUser } from './services/auth';
import { useNavigation } from '@react-navigation/native';

const LoginScreen = () => {
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const navigation = useNavigation();

  // Verificar si ya hay un usuario logueado al cargar la pantalla
  useEffect(() => {
    checkIfUserLoggedIn();
  }, []);

  const checkIfUserLoggedIn = async () => {
    setChecking(true);
    const result = await checkCurrentUser();
    
    if (result.success) {
      // Usuario ya está logueado, navegar a Home
      console.log('✅ Usuario ya logueado, redirigiendo...');
      navigation.replace('Home');
    }
    
    setChecking(false);
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    
    console.log('🔐 Iniciando proceso de login...');
    const result = await loginWithGoogle();
    
    setLoading(false);
    
    if (result.success) {
      // Login exitoso
      console.log('✅ Login exitoso:', result.user);
      
      Alert.alert(
        '¡Bienvenida! 🎉',
        result.isNewUser 
          ? `Tu cuenta ha sido creada exitosamente.\n\n¡Bienvenida a Mumpa, ${result.user.displayName}!`
          : `¡Hola de nuevo, ${result.user.displayName}! 😊`,
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
    } else {
      // Error en el login
      console.error('❌ Error en login:', result.error);
      
      Alert.alert(
        'Error al iniciar sesión',
        result.error || 'Ocurrió un error inesperado. Por favor intenta de nuevo.',
        [{ text: 'OK' }]
      );
    }
  };

  // Mostrar loading mientras verifica si hay usuario
  if (checking) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF69B4" />
        <Text style={styles.loadingText}>Verificando sesión...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Logo de la app */}
      <View style={styles.logoContainer}>
        <Text style={styles.appName}>Mumpa</Text>
        <Text style={styles.tagline}>Tu compañera en la maternidad</Text>
      </View>

      {/* Ilustración o imagen */}
      <View style={styles.illustrationContainer}>
        {/* Aquí puedes poner una imagen o ilustración */}
        <Text style={styles.emoji}>👶💕</Text>
      </View>

      {/* Botones de login */}
      <View style={styles.buttonsContainer}>
        {/* Botón de Google */}
        <TouchableOpacity 
          onPress={handleGoogleLogin}
          disabled={loading}
          style={[
            styles.googleButton,
            loading && styles.buttonDisabled
          ]}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.googleIcon}>G</Text>
              <Text style={styles.googleButtonText}>
                Continuar con Google
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Separador */}
        <View style={styles.dividerContainer}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>o</Text>
          <View style={styles.divider} />
        </View>

        {/* Botón de login con email (si tienes) */}
        <TouchableOpacity 
          onPress={() => navigation.navigate('EmailLogin')}
          style={styles.emailButton}
          activeOpacity={0.8}
        >
          <Text style={styles.emailButtonText}>
            Iniciar sesión con email
          </Text>
        </TouchableOpacity>

        {/* Link de registro */}
        <TouchableOpacity 
          onPress={() => navigation.navigate('Register')}
          style={styles.registerLink}
        >
          <Text style={styles.registerLinkText}>
            ¿No tienes cuenta? <Text style={styles.registerLinkBold}>Regístrate</Text>
          </Text>
        </TouchableOpacity>
      </View>

      {/* Términos y condiciones */}
      <View style={styles.termsContainer}>
        <Text style={styles.termsText}>
          Al continuar, aceptas nuestros{' '}
          <Text style={styles.termsLink}>Términos de Servicio</Text>
          {' '}y{' '}
          <Text style={styles.termsLink}>Política de Privacidad</Text>
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 24,
    justifyContent: 'space-between',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 60,
  },
  appName: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FF69B4',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  illustrationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  emoji: {
    fontSize: 80,
  },
  buttonsContainer: {
    marginBottom: 20,
  },
  googleButton: {
    backgroundColor: '#4285F4',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  googleIcon: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginRight: 12,
    backgroundColor: '#fff',
    color: '#4285F4',
    width: 28,
    height: 28,
    textAlign: 'center',
    lineHeight: 28,
    borderRadius: 4,
  },
  googleButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#999',
    fontSize: 14,
  },
  emailButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#FF69B4',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  emailButtonText: {
    color: '#FF69B4',
    fontSize: 16,
    fontWeight: '600',
  },
  registerLink: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  registerLinkText: {
    color: '#666',
    fontSize: 14,
  },
  registerLinkBold: {
    color: '#FF69B4',
    fontWeight: '600',
  },
  termsContainer: {
    paddingVertical: 16,
  },
  termsText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    lineHeight: 18,
  },
  termsLink: {
    color: '#FF69B4',
    textDecoration: 'underline',
  },
});

export default LoginScreen;

