# 🍎 Guía de Integración: Login con Apple

## 📋 Backend Configurado

El backend ya tiene el endpoint `/api/auth/apple-login` que:

1. ✅ Verifica el identity token de Apple (opcional)
2. ✅ Acepta email y nombre del usuario
3. ✅ Crea o actualiza el usuario en Firebase Auth
4. ✅ Crea o actualiza el usuario en Firestore
5. ✅ Genera un customToken para autenticación
6. ✅ Retorna los datos del usuario

---

## 🔑 Características Importantes de Apple Sign-In

⚠️ **Apple solo envía el nombre completo UNA VEZ** (en el primer login)
⚠️ **Apple puede ocultar el email** (genera un email relay de Apple)
✅ **Apple verifica automáticamente los emails**
✅ **No proporciona foto de perfil**

---

## 📱 Configuración del Frontend en React Native

### 1. Instalar Dependencias

```bash
npm install @invertase/react-native-apple-authentication
npm install @react-native-firebase/auth
npm install axios
```

### 2. Configurar Permisos (iOS)

**En `ios/YourApp/Info.plist`:**

```xml
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>com.yourapp</string>
    </array>
  </dict>
</array>
```

### 3. Habilitar Sign in with Apple en Xcode

1. Abre tu proyecto en Xcode
2. Selecciona tu target
3. Ve a **Signing & Capabilities**
4. Click en **+ Capability**
5. Busca y agrega **Sign in with Apple**

### 4. Configurar Firebase Console

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto
3. Ve a **Authentication** → **Sign-in method**
4. Habilita **Apple** como proveedor
5. Sigue las instrucciones para configurar:
   - **Services ID** (Bundle ID de tu app)
   - **Team ID** (de tu cuenta de Apple Developer)
   - **Key ID** y **Private Key** (de Apple Developer)

---

## 💻 Código del Frontend

### Crear servicio de autenticación

Crea `services/appleAuth.js`:

```javascript
import appleAuth from '@invertase/react-native-apple-authentication';
import auth from '@react-native-firebase/auth';
import axios from 'axios';

const API_URL = 'https://mumpabackend-4aj667ejx-mishu-lojans-projects.vercel.app';

/**
 * Login con Apple
 * @returns {Promise<{success: boolean, user?: object, error?: string}>}
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
    });

    // 2. Verificar que recibimos los datos necesarios
    const { identityToken, email, fullName, user } = appleAuthRequestResponse;

    if (!identityToken) {
      throw new Error('No se recibió el identity token de Apple');
    }

    // 3. Preparar datos para enviar al backend
    const userData = {
      identityToken: identityToken,
      email: email,
      fullName: fullName, // { givenName, familyName }
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
          email: response.data.data.email,
          displayName: displayName,
          photoURL: null
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
      return { 
        success: false, 
        error: 'Login cancelado por el usuario' 
      };
    }
    
    if (error.code === appleAuth.Error.FAILED) {
      return { 
        success: false, 
        error: 'Error al autenticar con Apple' 
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
        error: 'Login con Apple no configurado correctamente' 
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
    
    // Error de red u otro
    return { 
      success: false, 
      error: error.message || 'Error desconocido al iniciar sesión' 
    };
  }
};

/**
 * Verificar si Sign in with Apple está disponible
 * @returns {Promise<boolean>}
 */
export const isAppleAuthAvailable = async () => {
  try {
    return await appleAuth.isSupported();
  } catch (error) {
    console.error('Error verificando disponibilidad de Apple Auth:', error);
    return false;
  }
};
```

---

## 🎨 Componente de Botón de Apple

```javascript
import React, { useEffect, useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, Platform, Alert } from 'react-native';
import { loginWithApple, isAppleAuthAvailable } from './services/appleAuth';

const AppleLoginButton = ({ onSuccess, onError }) => {
  const [isAvailable, setIsAvailable] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkAvailability();
  }, []);

  const checkAvailability = async () => {
    // Apple Sign-In solo está disponible en iOS 13+
    if (Platform.OS === 'ios') {
      const available = await isAppleAuthAvailable();
      setIsAvailable(available);
    }
  };

  const handleAppleLogin = async () => {
    setLoading(true);
    
    const result = await loginWithApple();
    
    setLoading(false);
    
    if (result.success) {
      Alert.alert(
        '¡Bienvenida! 🎉',
        result.isNewUser 
          ? `Tu cuenta ha sido creada exitosamente.\n\n¡Bienvenida a Mumpa!`
          : `¡Hola de nuevo${result.user.displayName ? ', ' + result.user.displayName : ''}! 😊`,
        [
          {
            text: 'Continuar',
            onPress: () => onSuccess && onSuccess(result)
          }
        ]
      );
    } else {
      Alert.alert('Error', result.error);
      onError && onError(result.error);
    }
  };

  // No mostrar el botón si Apple Sign-In no está disponible
  if (!isAvailable) {
    return null;
  }

  return (
    <TouchableOpacity 
      onPress={handleAppleLogin}
      disabled={loading}
      style={[styles.appleButton, loading && styles.buttonDisabled]}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <>
          <Text style={styles.appleIcon}></Text>
          <Text style={styles.appleButtonText}>
            Continuar con Apple
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  appleButton: {
    backgroundColor: '#000000',
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
  appleIcon: {
    fontSize: 20,
    color: '#fff',
    marginRight: 12,
  },
  appleButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AppleLoginButton;
```

---

## 🔄 Flujo de Autenticación

```
┌─────────────────┐
│ Usuario hace    │
│ tap en botón    │
└────────┬────────┘
         │
         ▼
┌──────────────────────────┐
│ appleAuth.performRequest│
│ Muestra diálogo Apple   │
└────────┬─────────────────┘
         │
         │ { identityToken, email, fullName, user }
         ▼
┌────────────────────────────────┐
│ Preparar objeto userData:      │
│ {                              │
│   identityToken: token,        │
│   email: email,                │
│   fullName: { givenName, ... },│
│   user: appleUserId            │
│ }                              │
└────────┬───────────────────────┘
         │
         │ POST /api/auth/apple-login
         ▼
┌────────────────────────────────────┐
│ BACKEND (Vercel)                   │
│                                    │
│ 1. Verificar identity token        │
│ 2. Buscar usuario por email        │
│ 3. Si no existe:                   │
│    • Crear en Firebase Auth        │
│    • Crear en Firestore           │
│ 4. Si existe:                      │
│    • Actualizar updatedAt         │
│ 5. Generar customToken            │
│ 6. Retornar datos + token         │
└────────┬───────────────────────────┘
         │
         │ { success, data: { customToken, uid, ... } }
         ▼
┌──────────────────────────────────┐
│ FRONTEND                         │
│ auth().signInWithCustomToken()   │
└────────┬─────────────────────────┘
         │
         ▼
┌────────────────────┐
│ Usuario autenticado│
│ en Firebase        │
│                    │
│ ✅ Login completo  │
└────────────────────┘
```

---

## ⚠️ Consideraciones Importantes

### 1. Nombre del Usuario

Apple **solo envía el nombre completo en el primer login**. En logins posteriores, `fullName` será `null`.

**Solución:** Guardar el nombre en el backend en el primer login.

```javascript
// Primera vez
{
  email: "user@privaterelay.appleid.com",
  fullName: {
    givenName: "María",
    familyName: "González"
  }
}

// Logins posteriores
{
  email: "user@privaterelay.appleid.com",
  fullName: null  // ⚠️ Apple no lo vuelve a enviar
}
```

### 2. Email Oculto

Los usuarios pueden elegir ocultar su email real. Apple generará un email relay:

```
usuario123456@privaterelay.appleid.com
```

Este email funciona perfectamente y reenvía correos al email real del usuario.

### 3. Disponibilidad

Sign in with Apple solo está disponible en:
- ✅ iOS 13+
- ✅ macOS 10.15+
- ❌ Android (no disponible nativamente)

### 4. Requerimiento de Apple

Si tu app tiene otros métodos de login social (Google, Facebook), **Apple requiere** que también ofrezcas Sign in with Apple.

---

## 🧪 Probar el Login

### Test Manual:

1. Ejecuta tu app en un dispositivo iOS real (iOS 13+)
2. Toca el botón de "Continuar con Apple"
3. Aparecerá el diálogo nativo de Apple
4. Selecciona una cuenta de Apple ID
5. Elige si quieres compartir o ocultar tu email
6. Confirma

### En Simulador:

El simulador de iOS soporta Sign in with Apple, pero necesitas:
1. Tener una sesión activa de iCloud en el simulador
2. iOS 13+ en el simulador

---

## 🔍 Debugging

### Ver logs en el frontend:

```javascript
const result = await loginWithApple();
console.log('🍎 Resultado completo:', result);
```

### Ver logs del backend:

```bash
vercel logs --follow
```

Busca:
```
🍎 [APPLE-LOGIN] Iniciando login con Apple...
✅ [APPLE-LOGIN] Usuario creado en Firebase Auth
✅ [APPLE-LOGIN] Usuario creado en Firestore
```

---

## 🆘 Solución de Problemas

### Error: "Sign in with Apple no está disponible"
**Causa:** iOS < 13 o no configurado en Xcode
**Solución:** 
- Verifica que el dispositivo tenga iOS 13+
- Agrega la capability en Xcode

### Error: "Login cancelado"
**Causa:** Usuario canceló el proceso
**Solución:** Normal, solo muestra un mensaje amigable

### Error: "Invalid response"
**Causa:** Configuración incorrecta en Firebase
**Solución:** Verifica la configuración de Apple en Firebase Console

### Error: "Not handled"
**Causa:** Falta la capability en Xcode
**Solución:** Agrega "Sign in with Apple" en Capabilities

---

## 📊 Comparación: Google vs Apple

| Característica | Google | Apple |
|---|---|---|
| **Nombre de usuario** | Siempre disponible | Solo primera vez |
| **Email** | Siempre real | Puede ser relay |
| **Foto de perfil** | ✅ Sí | ❌ No |
| **Plataformas** | iOS, Android, Web | Solo iOS/macOS |
| **Email verificado** | Depende de cuenta | Siempre ✅ |
| **Privacidad** | Estándar | Muy alta |

---

## ✅ Checklist de Implementación

- [ ] Instalé `@invertase/react-native-apple-authentication`
- [ ] Agregué la capability "Sign in with Apple" en Xcode
- [ ] Configuré Apple como proveedor en Firebase Console
- [ ] Implementé la función `loginWithApple`
- [ ] Agregué el botón de Apple en mi pantalla de login
- [ ] El botón solo se muestra en iOS 13+
- [ ] Probé el login en un dispositivo iOS real
- [ ] El usuario se crea correctamente en Firebase Auth
- [ ] El usuario se crea correctamente en Firestore
- [ ] El nombre se guarda en el primer login

---

## 📚 Recursos

- [Documentación de Apple Sign-In](https://github.com/invertase/react-native-apple-authentication)
- [Guía de Firebase](https://firebase.google.com/docs/auth/ios/apple)
- [Human Interface Guidelines de Apple](https://developer.apple.com/design/human-interface-guidelines/sign-in-with-apple/overview/)

---

**¡Listo! 🎉 Ahora tus usuarios de iOS pueden hacer login con Apple de forma segura y privada.**

