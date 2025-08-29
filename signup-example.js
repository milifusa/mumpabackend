// Ejemplo de implementación para React Native - Registro con nuevos campos
// Actualizar tu authService.signup con esta estructura

// Tipos de datos para registro
export interface SignupData {
  email: string;
  password: string;
  displayName: string;
  gender?: 'M' | 'F'; // M = Mamá, F = Papá
  childrenCount?: number; // Número inicial de hijos
}

// Función de registro actualizada
const handleSignup = async (signupData: SignupData) => {
  try {
    console.log('📝 [SIGNUP] Iniciando registro con datos:', signupData);
    
    const response = await authService.signup(signupData);
    console.log('✅ [SIGNUP] Registro exitoso:', response.data);
    
    // Guardar token en AsyncStorage
    if (response.data.customToken) {
      await AsyncStorage.setItem('authToken', response.data.customToken);
      console.log('✅ [SIGNUP] Token guardado en AsyncStorage');
    }
    
    return response.data;
  } catch (error) {
    console.error('❌ [SIGNUP] Error en registro:', error);
    throw error;
  }
};

// Ejemplo de uso en componente React Native:

/*
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { authService } from './services/authService';

const SignupScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [gender, setGender] = useState('');
  const [childrenCount, setChildrenCount] = useState('0');
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    try {
      setLoading(true);
      
      const signupData = {
        email: email.trim(),
        password: password,
        displayName: displayName.trim(),
        gender: gender, // "M" o "F"
        childrenCount: parseInt(childrenCount) || 0
      };

      // Validaciones
      if (!signupData.email || !signupData.password || !signupData.displayName) {
        Alert.alert('Error', 'Todos los campos son requeridos');
        return;
      }

      if (!signupData.gender || !['M', 'F'].includes(signupData.gender)) {
        Alert.alert('Error', 'Debe seleccionar si es Mamá o Papá');
        return;
      }

      const response = await authService.signup(signupData);
      Alert.alert('Éxito', 'Usuario registrado correctamente');
      
      // Navegar a la siguiente pantalla
      // navigation.navigate('Home');
      
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Error en el registro');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>
        Registro
      </Text>

      <TextInput
        placeholder="Nombre completo"
        value={displayName}
        onChangeText={setDisplayName}
        style={{ borderWidth: 1, padding: 10, marginBottom: 10 }}
      />

      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        style={{ borderWidth: 1, padding: 10, marginBottom: 10 }}
      />

      <TextInput
        placeholder="Contraseña"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={{ borderWidth: 1, padding: 10, marginBottom: 10 }}
      />

      {/* Selector de género */}
      <View style={{ marginBottom: 15 }}>
        <Text style={{ marginBottom: 10 }}>Soy:</Text>
        <View style={{ flexDirection: 'row' }}>
          <TouchableOpacity
            style={{
              padding: 10,
              marginRight: 10,
              backgroundColor: gender === 'M' ? '#007AFF' : '#E5E5EA',
              borderRadius: 5
            }}
            onPress={() => setGender('M')}
          >
            <Text style={{ color: gender === 'M' ? 'white' : 'black' }}>
              Mamá
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={{
              padding: 10,
              backgroundColor: gender === 'F' ? '#007AFF' : '#E5E5EA',
              borderRadius: 5
            }}
            onPress={() => setGender('F')}
          >
            <Text style={{ color: gender === 'F' ? 'white' : 'black' }}>
              Papá
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Número de hijos */}
      <View style={{ marginBottom: 20 }}>
        <Text style={{ marginBottom: 10 }}>Número de hijos:</Text>
        <TextInput
          placeholder="0"
          value={childrenCount}
          onChangeText={setChildrenCount}
          keyboardType="numeric"
          style={{ borderWidth: 1, padding: 10 }}
        />
      </View>

      <TouchableOpacity
        onPress={handleSignup}
        disabled={loading}
        style={{
          backgroundColor: '#007AFF',
          padding: 15,
          borderRadius: 5,
          alignItems: 'center'
        }}
      >
        <Text style={{ color: 'white', fontWeight: 'bold' }}>
          {loading ? 'Registrando...' : 'Registrarse'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default SignupScreen;
*/

// Estructura de datos que se envía al servidor:
/*
POST /api/auth/signup
Content-Type: application/json

{
  "email": "lmishelle16@gmail.com",
  "password": "Mishu123",
  "displayName": "Michele Lojan",
  "gender": "M",
  "childrenCount": 2
}

// Respuesta del servidor:
{
  "success": true,
  "message": "Usuario registrado exitosamente",
  "data": {
    "uid": "user123",
    "email": "lmishelle16@gmail.com",
    "displayName": "Michele Lojan",
    "customToken": "eyJhbGciOiJSUzI1NiIs..."
  }
}
*/
