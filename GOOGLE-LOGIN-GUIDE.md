# 🔐 Guía de Implementación - Google Login

## ✅ Backend Implementado

Se ha agregado el endpoint `/api/auth/google-login` que:
- ✅ Verifica el token de Google
- ✅ Crea automáticamente usuarios nuevos
- ✅ Actualiza usuarios existentes
- ✅ Genera token personalizado para la sesión

---

## 📡 Endpoint

### POST `/api/auth/google-login`

**Request:**
```json
{
  "idToken": "eyJhbGciOiJSUzI1NiIsImtpZCI6IjE4MmU0..."
}
```

**Response (Nuevo Usuario):**
```json
{
  "success": true,
  "message": "Cuenta creada exitosamente",
  "isNewUser": true,
  "data": {
    "uid": "abc123...",
    "email": "usuario@gmail.com",
    "displayName": "Juan Pérez",
    "photoURL": "https://lh3.googleusercontent.com/...",
    "emailVerified": true,
    "customToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6..."
  }
}
```

**Response (Usuario Existente):**
```json
{
  "success": true,
  "message": "Login exitoso",
  "isNewUser": false,
  "data": {
    ...
  }
}
```

---

## 🚀 Implementación en React Native / Expo

### 1. Instalar Dependencias

```bash
# Para Expo
npx expo install @react-native-google-signin/google-signin firebase

# O para React Native puro
npm install @react-native-google-signin/google-signin
npm install @react-native-firebase/app @react-native-firebase/auth
```

### 2. Configurar Google Sign-In

#### 2.1 Obtener credenciales de Google

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un proyecto nuevo o selecciona uno existente
3. Habilita **Google Sign-In API**
4. Ve a **Credenciales** → **Crear credenciales** → **ID de cliente de OAuth 2.0**
5. Configura:
   - **Android**: Agrega el nombre del paquete y SHA-1
   - **iOS**: Agrega el Bundle ID
   - **Web**: Para desarrollo

6. Descarga el archivo `google-services.json` (Android) y `GoogleService-Info.plist` (iOS)

#### 2.2 Configurar en Firebase Console

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto
3. Ve a **Authentication** → **Sign-in method**
4. Habilita **Google**
5. Agrega tu **Web Client ID** de Google Cloud

---

## 📱 Código de Implementación

### Opción 1: Con Expo (Recomendado)

```javascript
// config/googleConfig.js
export const GOOGLE_WEB_CLIENT_ID = '123456789-abc.apps.googleusercontent.com';

// screens/LoginScreen.js
import React, { useState } from 'react';
import { View, Button, Alert } from 'react-native';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import auth from '@react-native-firebase/auth';
import axios from 'axios';
import { GOOGLE_WEB_CLIENT_ID } from '../config/googleConfig';

// Configurar Google Sign-In
GoogleSignin.configure({
  webClientId: GOOGLE_WEB_CLIENT_ID,
  offlineAccess: true,
});

export default function LoginScreen() {
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);

      // 1. Iniciar sesión con Google
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      
      console.log('✅ Usuario de Google:', userInfo.user.email);

      // 2. Crear credencial de Firebase
      const googleCredential = auth.GoogleAuthProvider.credential(
        userInfo.idToken
      );

      // 3. Iniciar sesión en Firebase
      const userCredential = await auth().signInWithCredential(googleCredential);
      
      console.log('✅ Usuario autenticado en Firebase:', userCredential.user.uid);

      // 4. Obtener ID Token de Firebase
      const idToken = await userCredential.user.getIdToken();

      // 5. Enviar al backend
      const response = await axios.post(
        'https://tu-backend.com/api/auth/google-login',
        { idToken },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        console.log('✅ Login exitoso en backend');
        
        // Guardar datos del usuario
        const { uid, email, displayName, photoURL, customToken } = response.data.data;
        
        // Guardar en AsyncStorage o Context
        await AsyncStorage.setItem('userToken', customToken);
        await AsyncStorage.setItem('userData', JSON.stringify({
          uid,
          email,
          displayName,
          photoURL
        }));

        // Navegar a la app
        navigation.navigate('Home');
        
        if (response.data.isNewUser) {
          Alert.alert('¡Bienvenido!', 'Tu cuenta ha sido creada exitosamente');
        }
      }

    } catch (error) {
      console.error('❌ Error en Google Login:', error);
      
      if (error.code === 'sign_in_cancelled') {
        Alert.alert('Cancelado', 'Inicio de sesión cancelado');
      } else if (error.code === 'in_progress') {
        Alert.alert('Error', 'Ya hay un inicio de sesión en progreso');
      } else if (error.code === 'play_services_not_available') {
        Alert.alert('Error', 'Google Play Services no disponible');
      } else {
        Alert.alert('Error', 'No se pudo iniciar sesión con Google');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 20 }}>
      <Button
        title={loading ? 'Cargando...' : 'Iniciar sesión con Google'}
        onPress={handleGoogleLogin}
        disabled={loading}
      />
    </View>
  );
}
```

### Opción 2: Con Expo (usando expo-auth-session)

```javascript
// screens/LoginScreen.js
import React, { useState } from 'react';
import { View, Button, Alert } from 'react-native';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import axios from 'axios';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const [loading, setLoading] = useState(false);

  const [request, response, promptAsync] = Google.useAuthRequest({
    expoClientId: 'YOUR_EXPO_CLIENT_ID',
    iosClientId: 'YOUR_IOS_CLIENT_ID',
    androidClientId: 'YOUR_ANDROID_CLIENT_ID',
    webClientId: 'YOUR_WEB_CLIENT_ID',
  });

  React.useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      handleGoogleResponse(id_token);
    }
  }, [response]);

  const handleGoogleResponse = async (idToken) => {
    try {
      setLoading(true);

      // Enviar al backend
      const res = await axios.post(
        'https://tu-backend.com/api/auth/google-login',
        { idToken }
      );

      if (res.data.success) {
        // Guardar token y datos
        await AsyncStorage.setItem('userToken', res.data.data.customToken);
        await AsyncStorage.setItem('userData', JSON.stringify(res.data.data));

        // Navegar
        navigation.navigate('Home');
      }

    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'No se pudo completar el inicio de sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 20 }}>
      <Button
        title="Iniciar sesión con Google"
        disabled={!request || loading}
        onPress={() => promptAsync()}
      />
    </View>
  );
}
```

---

## 🎨 Componente de Botón de Google Personalizado

```javascript
// components/GoogleSignInButton.js
import React from 'react';
import { TouchableOpacity, Text, Image, StyleSheet } from 'react-native';

export default function GoogleSignInButton({ onPress, loading }) {
  return (
    <TouchableOpacity
      style={styles.button}
      onPress={onPress}
      disabled={loading}
      activeOpacity={0.8}
    >
      <Image
        source={require('../assets/google-logo.png')}
        style={styles.logo}
      />
      <Text style={styles.text}>
        {loading ? 'Iniciando sesión...' : 'Continuar con Google'}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#dadce0',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logo: {
    width: 24,
    height: 24,
    marginRight: 12,
  },
  text: {
    fontSize: 16,
    fontWeight: '500',
    color: '#3c4043',
  },
});
```

---

## 🔧 Configuración de Firebase (app.json para Expo)

```json
{
  "expo": {
    "plugins": [
      "@react-native-firebase/app",
      [
        "@react-native-google-signin/google-signin",
        {
          "iosUrlScheme": "com.googleusercontent.apps.YOUR_IOS_CLIENT_ID"
        }
      ]
    ],
    "android": {
      "googleServicesFile": "./google-services.json",
      "package": "com.tuapp.munpa"
    },
    "ios": {
      "googleServicesFile": "./GoogleService-Info.plist",
      "bundleIdentifier": "com.tuapp.munpa"
    }
  }
}
```

---

## 🧪 Testing

### Probar con Postman

```bash
# 1. Obtener un ID Token de Google (desde tu app o web)
# 2. Hacer request:

POST https://tu-backend.com/api/auth/google-login
Content-Type: application/json

{
  "idToken": "eyJhbGciOiJSUzI1NiIsImtpZCI6..."
}
```

### Probar con curl

```bash
curl -X POST \
  https://tu-backend.com/api/auth/google-login \
  -H 'Content-Type: application/json' \
  -d '{
    "idToken": "TU_ID_TOKEN_DE_GOOGLE"
  }'
```

---

## ⚠️ Errores Comunes y Soluciones

### 1. "Token de Google expirado"
**Solución:** El usuario debe volver a iniciar sesión con Google

### 2. "Token de Google inválido"
**Solución:** 
- Verifica que el Web Client ID sea correcto
- Asegúrate de enviar el `idToken` y no el `accessToken`

### 3. "Firebase no está configurado"
**Solución:** Verifica que Firebase esté correctamente inicializado en el backend

### 4. "Play Services not available" (Android)
**Solución:** 
- Asegúrate de que Google Play Services esté instalado
- Verifica permisos en AndroidManifest.xml

### 5. "Invalid client ID" (iOS)
**Solución:**
- Verifica que el Bundle ID coincida con el de Google Console
- Asegúrate de tener el archivo GoogleService-Info.plist

---

## 🔐 Seguridad

### En el Backend:
- ✅ Verifica siempre el ID Token con Firebase Admin
- ✅ No confíes en datos del cliente sin verificar
- ✅ Usa HTTPS en producción
- ✅ Valida que el token no esté expirado

### En el Frontend:
- ✅ Guarda tokens de forma segura (AsyncStorage encriptado o Keychain)
- ✅ No expongas Client IDs en el código fuente público
- ✅ Usa variables de entorno para configuración
- ✅ Implementa logout correcto

---

## 📊 Flujo Completo

```
1. Usuario presiona "Iniciar sesión con Google"
   ↓
2. App abre Google Sign-In nativo
   ↓
3. Usuario selecciona cuenta de Google
   ↓
4. Google devuelve ID Token
   ↓
5. App envía ID Token a Firebase Auth
   ↓
6. Firebase verifica y autentica
   ↓
7. App obtiene ID Token de Firebase
   ↓
8. App envía ID Token al backend (/api/auth/google-login)
   ↓
9. Backend verifica token con Firebase Admin
   ↓
10. Backend crea/actualiza usuario en Firestore
   ↓
11. Backend devuelve Custom Token + datos del usuario
   ↓
12. App guarda token y navega a Home
```

---

## ✅ Checklist de Implementación

### Backend:
- [x] Endpoint `/api/auth/google-login` creado
- [x] Verificación de ID Token implementada
- [x] Creación automática de usuarios
- [x] Generación de Custom Token

### Frontend (Pendiente):
- [ ] Instalar dependencias de Google Sign-In
- [ ] Configurar Google Cloud Console
- [ ] Configurar Firebase Console
- [ ] Agregar archivos de configuración (google-services.json, GoogleService-Info.plist)
- [ ] Implementar botón de Google Sign-In
- [ ] Manejar respuesta del backend
- [ ] Guardar token en AsyncStorage
- [ ] Implementar navegación post-login

### Configuración:
- [ ] Obtener Web Client ID
- [ ] Obtener iOS Client ID
- [ ] Obtener Android Client ID
- [ ] Configurar dominios autorizados en Firebase
- [ ] Probar en desarrollo
- [ ] Probar en producción

---

## 🆘 Soporte

Si tienes problemas:

1. **Revisa los logs** del backend en Vercel
2. **Verifica la configuración** de Google Cloud Console
3. **Confirma** que Firebase Authentication esté habilitado
4. **Asegúrate** de usar los Client IDs correctos
5. **Prueba** primero en modo desarrollo antes de producción

---

**¡Google Login está listo en el backend! 🎉**

Ahora solo necesitas implementar el flujo en tu app React Native/Expo siguiendo esta guía.

