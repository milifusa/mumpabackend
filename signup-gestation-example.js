// Ejemplo de implementación para React Native - Registro con Gestación
// Actualizar tu authService.signup con esta estructura

// Tipos de datos para registro con gestación
export interface SignupData {
  email: string;
  password: string;
  displayName: string;
  gender?: 'M' | 'F'; // M = Papá, F = Mamá
  childrenCount?: number; // Número de hijos ya nacidos
  isPregnant?: boolean; // Solo para mujeres
  gestationWeeks?: number; // Solo si isPregnant = true
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
import { View, Text, TextInput, TouchableOpacity, Alert, Switch } from 'react-native';
import { authService } from './services/authService';

const SignupScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [gender, setGender] = useState('');
  const [childrenCount, setChildrenCount] = useState(0);
  const [isPregnant, setIsPregnant] = useState(false);
  const [gestationWeeks, setGestationWeeks] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    try {
      setLoading(true);
      
      // Validaciones básicas
      if (!email || !password || !displayName || !gender) {
        Alert.alert('Error', 'Todos los campos son requeridos');
        return;
      }

      if (password !== confirmPassword) {
        Alert.alert('Error', 'Las contraseñas no coinciden');
        return;
      }

      if (gender === 'F' && isPregnant && (!gestationWeeks || gestationWeeks < 1 || gestationWeeks > 42)) {
        Alert.alert('Error', 'Para mujeres embarazadas, las semanas de gestación deben estar entre 1 y 42');
        return;
      }

      const signupData = {
        email: email.trim(),
        password: password,
        displayName: displayName.trim(),
        gender: gender,
        childrenCount: childrenCount,
        isPregnant: gender === 'F' ? isPregnant : false,
        gestationWeeks: gender === 'F' && isPregnant ? parseInt(gestationWeeks) : undefined
      };

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
        Crea tu cuenta
      </Text>

      <TextInput
        placeholder="Nombre completo"
        value={displayName}
        onChangeText={setDisplayName}
        style={{ borderWidth: 1, padding: 10, marginBottom: 10 }}
      />

      <TextInput
        placeholder="Correo electrónico"
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

      <TextInput
        placeholder="Confirmar contraseña"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
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
            onPress={() => {
              setGender('M');
              setIsPregnant(false); // Los hombres no pueden estar embarazados
              setGestationWeeks('');
            }}
          >
            <Text style={{ color: gender === 'M' ? 'white' : 'black' }}>
              Papá
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
              Mamá
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Número de hijos existentes */}
      <View style={{ marginBottom: 15 }}>
        <Text style={{ marginBottom: 10 }}>Número de hijos ya nacidos:</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity
            onPress={() => setChildrenCount(Math.max(0, childrenCount - 1))}
            style={{
              padding: 10,
              backgroundColor: '#E5E5EA',
              borderRadius: 5,
              marginRight: 10
            }}
          >
            <Text>-</Text>
          </TouchableOpacity>
          
          <Text style={{ fontSize: 18, marginHorizontal: 20 }}>{childrenCount}</Text>
          
          <TouchableOpacity
            onPress={() => setChildrenCount(childrenCount + 1)}
            style={{
              padding: 10,
              backgroundColor: '#E5E5EA',
              borderRadius: 5,
              marginLeft: 10
            }}
          >
            <Text>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Opción de embarazo (solo para mujeres) */}
      {gender === 'F' && (
        <View style={{ marginBottom: 15 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
            <Text style={{ marginRight: 10 }}>¿Estás embarazada?</Text>
            <Switch
              value={isPregnant}
              onValueChange={setIsPregnant}
            />
          </View>
          
          {isPregnant && (
            <View>
              <Text style={{ marginBottom: 10 }}>Semanas de gestación:</Text>
              <TextInput
                placeholder="Ej: 24"
                value={gestationWeeks}
                onChangeText={setGestationWeeks}
                keyboardType="numeric"
                style={{ borderWidth: 1, padding: 10 }}
              />
            </View>
          )}
        </View>
      )}

      {/* Resumen de la cuenta */}
      <View style={{ 
        backgroundColor: '#F0F0F0', 
        padding: 15, 
        borderRadius: 5, 
        marginBottom: 20 
      }}>
        <Text style={{ fontWeight: 'bold', marginBottom: 5 }}>Resumen:</Text>
        <Text>• {gender === 'M' ? 'Papá' : 'Mamá'}</Text>
        <Text>• {childrenCount} hijo{childrenCount !== 1 ? 's' : ''} ya nacido{childrenCount !== 1 ? 's' : ''}</Text>
        {gender === 'F' && isPregnant && (
          <Text>• Embarazada de {gestationWeeks} semanas</Text>
        )}
        <Text>• Total de hijos: {childrenCount + (gender === 'F' && isPregnant ? 1 : 0)}</Text>
      </View>

      <TouchableOpacity
        onPress={handleSignup}
        disabled={loading}
        style={{
          backgroundColor: '#4CAF50',
          padding: 15,
          borderRadius: 5,
          alignItems: 'center'
        }}
      >
        <Text style={{ color: 'white', fontWeight: 'bold' }}>
          {loading ? 'Creando cuenta...' : 'CREAR CUENTA'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={{ marginTop: 15, alignItems: 'center' }}>
        <Text style={{ color: '#007AFF' }}>
          ¿Ya tienes una cuenta? Inicia sesión
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default SignupScreen;
*/

// Estructura de datos que se envía al servidor:

/*
// Para mujer con hijos existentes y embarazada:
POST /api/auth/signup
{
  "email": "mama@ejemplo.com",
  "password": "Mama123",
  "displayName": "María Lojan",
  "gender": "F",
  "childrenCount": 2,
  "isPregnant": true,
  "gestationWeeks": 24
}

// Para mujer solo con hijos existentes:
POST /api/auth/signup
{
  "email": "mama2@ejemplo.com",
  "password": "Mama123",
  "displayName": "Ana Lojan",
  "gender": "F",
  "childrenCount": 1,
  "isPregnant": false
}

// Para hombre:
POST /api/auth/signup
{
  "email": "papa@ejemplo.com",
  "password": "Papa123",
  "displayName": "Juan Lojan",
  "gender": "M",
  "childrenCount": 2,
  "isPregnant": false
}

// Respuesta del servidor:
{
  "success": true,
  "message": "Usuario registrado exitosamente",
  "data": {
    "uid": "user123",
    "email": "mama@ejemplo.com",
    "displayName": "María Lojan",
    "customToken": "eyJhbGciOiJSUzI1NiIs..."
  }
}
*/
