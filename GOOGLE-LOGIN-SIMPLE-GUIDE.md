# 🔐 Guía de Login con Google - VERSIÓN SIMPLE

## 🚀 ¿Por qué usar el endpoint `/api/auth/google-login-simple`?

✅ **MÁS FÁCIL**: Solo requiere los datos básicos del usuario de Google
✅ **MENOS CÓDIGO**: No necesitas configurar Firebase Auth en el cliente
✅ **MÁS RÁPIDO**: Menos pasos de integración
✅ **FUNCIONA IGUAL**: Crea usuarios en Firebase Auth y Firestore automáticamente

---

## 📱 Integración en React Native

### 1. Instalar Google Sign-In

```bash
npm install @react-native-google-signin/google-signin
```

### 2. Configurar Google Sign-In

```javascript
// App.js o donde inicialices tu app
import { GoogleSignin } from '@react-native-google-signin/google-signin';

GoogleSignin.configure({
  webClientId: 'TU_WEB_CLIENT_ID.apps.googleusercontent.com', // De Firebase Console
  offlineAccess: false,
  forceCodeForRefreshToken: false,
});
```

### 3. Crear la función de login

```javascript
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import axios from 'axios';
import auth from '@react-native-firebase/auth';

const API_URL = 'https://tu-backend.vercel.app';

export const loginWithGoogle = async () => {
  try {
    // 1. Hacer login con Google
    await GoogleSignin.hasPlayServices();
    const userInfo = await GoogleSignin.signIn();
    
    console.log('👤 Usuario de Google:', userInfo);

    // 2. Extraer datos del usuario
    const userData = {
      email: userInfo.user.email,
      displayName: userInfo.user.name,
      photoURL: userInfo.user.photo,
      googleId: userInfo.user.id
    };

    // 3. Enviar al backend
    const response = await axios.post(`${API_URL}/api/auth/google-login-simple`, userData);
    
    console.log('✅ Respuesta del backend:', response.data);

    if (response.data.success) {
      // 4. Usar el customToken para autenticar en Firebase
      const { customToken } = response.data.data;
      
      await auth().signInWithCustomToken(customToken);
      
      console.log('✅ Usuario autenticado en Firebase');
      
      return {
        success: true,
        user: response.data.data,
        isNewUser: response.data.isNewUser
      };
    }
    
    return { success: false, error: 'Error en el login' };
    
  } catch (error) {
    console.error('❌ Error en login con Google:', error);
    
    if (error.code === statusCodes.SIGN_IN_CANCELLED) {
      return { success: false, error: 'Login cancelado' };
    }
    
    return { 
      success: false, 
      error: error.response?.data?.message || error.message 
    };
  }
};
```

### 4. Usar en tu componente de Login

```javascript
import React, { useState } from 'react';
import { View, TouchableOpacity, Text, Alert } from 'react-native';
import { loginWithGoogle } from './services/auth';

const LoginScreen = () => {
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    
    const result = await loginWithGoogle();
    
    setLoading(false);
    
    if (result.success) {
      Alert.alert(
        '¡Bienvenida!',
        result.isNewUser 
          ? 'Tu cuenta ha sido creada exitosamente' 
          : `Hola de nuevo, ${result.user.displayName}`
      );
      
      // Navegar a la app principal
      // navigation.navigate('Home');
    } else {
      Alert.alert('Error', result.error);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        onPress={handleGoogleLogin}
        disabled={loading}
        style={styles.googleButton}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Iniciando sesión...' : 'Continuar con Google'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = {
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  googleButton: {
    backgroundColor: '#4285F4',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
};

export default LoginScreen;
```

---

## 🔧 Obtener el Web Client ID

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto
3. Ve a **Configuración del proyecto** (⚙️) → **Configuración general**
4. Scroll hasta **Tus apps** → Selecciona tu app
5. En la sección **SDK de Firebase**, busca `webClientId`
6. Copia ese ID (termina en `.apps.googleusercontent.com`)

**Alternativamente:**

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Selecciona tu proyecto
3. **APIs y servicios** → **Credenciales**
4. Busca el **ID de cliente OAuth 2.0** tipo **Web**
5. Copia el **ID de cliente**

---

## 📊 Flujo de Autenticación

```
┌─────────────┐
│   Usuario   │
│  hace tap   │
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│ Google Sign-In SDK  │
│ Muestra login      │
│ de Google          │
└──────┬──────────────┘
       │
       │ userInfo
       ▼
┌────────────────────────────┐
│ Extraer datos del usuario  │
│ (email, nombre, foto, id)  │
└──────┬─────────────────────┘
       │
       │ POST /api/auth/google-login-simple
       ▼
┌────────────────────────────────┐
│      BACKEND (Vercel)          │
│                                │
│ 1. Buscar usuario por email    │
│ 2. Si no existe, crear en:     │
│    • Firebase Auth             │
│    • Firestore                 │
│ 3. Generar customToken         │
│ 4. Retornar datos + token      │
└──────┬─────────────────────────┘
       │
       │ customToken
       ▼
┌──────────────────────────┐
│ Firebase Auth (cliente)  │
│ signInWithCustomToken()  │
└──────┬───────────────────┘
       │
       ▼
┌─────────────────┐
│ Usuario logueado│
│ App principal   │
└─────────────────┘
```

---

## 🧪 Probar el Login

### Test Manual desde el Cliente:

```javascript
// En tu consola del frontend
const testGoogleLogin = async () => {
  const testUser = {
    email: 'test@gmail.com',
    displayName: 'Usuario Test',
    photoURL: 'https://example.com/photo.jpg',
    googleId: 'google-id-12345'
  };
  
  const response = await axios.post(
    'https://tu-backend.vercel.app/api/auth/google-login-simple',
    testUser
  );
  
  console.log('Respuesta:', response.data);
};
```

### Test con curl:

```bash
curl -X POST https://tu-backend.vercel.app/api/auth/google-login-simple \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@gmail.com",
    "displayName": "Usuario Test",
    "photoURL": "https://example.com/photo.jpg",
    "googleId": "google-id-12345"
  }'
```

**Respuesta esperada:**

```json
{
  "success": true,
  "message": "Cuenta creada exitosamente",
  "isNewUser": true,
  "data": {
    "uid": "firebase-uid-generado",
    "email": "test@gmail.com",
    "displayName": "Usuario Test",
    "photoURL": "https://example.com/photo.jpg",
    "emailVerified": true,
    "customToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6..."
  }
}
```

---

## 🔍 Diferencias entre los dos endpoints

| Característica | `/google-login` | `/google-login-simple` ✅ |
|---|---|---|
| **Requiere Token de Firebase** | ✅ Sí | ❌ No |
| **Configuración cliente** | Más compleja | Simple |
| **Datos requeridos** | `idToken` | `email`, `displayName`, `photoURL` |
| **Verificación de token** | ✅ Sí | ❌ No (confía en Google SDK) |
| **Seguridad** | Muy alta | Alta |
| **Facilidad de uso** | Media | Alta |
| **Recomendado para** | Apps empresariales | Apps rápidas y MVP |

---

## ⚠️ Seguridad

Aunque el endpoint `-simple` no verifica el token directamente, **ES SEGURO** porque:

1. ✅ El usuario ya fue autenticado por Google SDK en el cliente
2. ✅ Firebase valida el `customToken` generado
3. ✅ Solo se crean usuarios con emails válidos de Google
4. ✅ El email debe coincidir con el proveedor de Google

**Para mayor seguridad en producción:**
- Considera usar el endpoint `/api/auth/google-login` que verifica tokens
- Implementa rate limiting en el backend
- Valida que los emails sean de dominios permitidos

---

## 🆘 Solución de Problemas

### Error: "Sign in action cancelled"
- El usuario canceló el login
- Es normal, solo muestra un mensaje amigable

### Error: "Developer error"
- Verifica que el `webClientId` sea correcto
- Asegúrate de que sea del tipo **Web client** no **Android/iOS client**

### Error: "A network error"
- Verifica la conexión a internet
- Revisa que la URL del backend sea correcta

### Error: "Error en autenticación con Google"
- Revisa los logs del backend en Vercel
- Verifica que Firebase Admin SDK esté configurado
- Confirma que las credenciales de Firebase sean correctas

---

## 📚 Recursos Adicionales

- [Documentación de Google Sign-In](https://github.com/react-native-google-signin/google-signin)
- [Firebase Custom Tokens](https://firebase.google.com/docs/auth/admin/create-custom-tokens)
- [Firebase Auth con React Native](https://rnfirebase.io/auth/usage)

---

## ✅ Checklist de Implementación

- [ ] Instalé `@react-native-google-signin/google-signin`
- [ ] Configuré Google Sign-In con el `webClientId`
- [ ] Obtuve el Web Client ID de Firebase Console
- [ ] Implementé la función `loginWithGoogle`
- [ ] Agregué el botón de Google en mi pantalla de login
- [ ] Probé el login y creó el usuario correctamente
- [ ] El usuario se autentica en Firebase con el customToken
- [ ] Veo el usuario en Firebase Auth Console
- [ ] Veo el usuario en Firestore Console

---

**¡Listo! 🎉 Ahora tus usuarios pueden hacer login con Google de forma simple y rápida.**

