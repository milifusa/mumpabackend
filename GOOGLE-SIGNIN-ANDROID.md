# 🔐 Configurar Google Sign-In en Android

## ❌ Error: DEVELOPER_ERROR

El error `DEVELOPER_ERROR` en Android es un problema de **configuración** y se debe a que Android no puede verificar tu app con Google Cloud.

---

## 🛠️ Solución Paso a Paso

### 1️⃣ Obtener SHA-1 y SHA-256 de tu App

Estos son "fingerprints" únicos de tu app en Android que Google usa para verificar la autenticidad.

#### Para Debug (desarrollo):

```bash
cd android
./gradlew signingReport
```

Busca en la salida:

```
Variant: debug
Config: debug
Store: ~/.android/debug.keystore
Alias: androiddebugkey
MD5: XX:XX:XX...
SHA1: AB:CD:EF:12:34:56:78:90:AB:CD:EF:12:34:56:78:90:AB:CD:EF:12
SHA-256: 12:34:56:78:90:AB:CD:EF...
```

**Copia ambos:** SHA-1 y SHA-256

#### Para Release (producción):

Si ya tienes un keystore de producción:

```bash
keytool -list -v -keystore tu-release-key.keystore -alias tu-alias
```

---

### 2️⃣ Agregar SHA-1 y SHA-256 a Firebase Console

1. **Ir a Firebase Console:** https://console.firebase.google.com/
2. Seleccionar tu proyecto **Munpa**
3. Ir a **⚙️ Project Settings** (Configuración del proyecto)
4. Ir a la pestaña **General**
5. Bajar hasta **Your apps** (Tus aplicaciones)
6. Encontrar tu app Android (com.munpa o como se llame)
7. Click en **Add fingerprint** (Agregar huella digital)
8. Pegar el **SHA-1** y click **Save**
9. Click en **Add fingerprint** de nuevo
10. Pegar el **SHA-256** y click **Save**

**⚠️ IMPORTANTE:** Tienes que agregar **AMBOS** SHA-1 **Y** SHA-256

---

### 3️⃣ Descargar nuevo google-services.json

Después de agregar los SHA:

1. En la misma página de Firebase Console
2. Click en **Download google-services.json**
3. **Reemplazar** el archivo en tu proyecto:
   - Ruta: `android/app/google-services.json`
4. **Limpiar y recompilar** la app:

```bash
cd android
./gradlew clean
cd ..
npx react-native run-android
```

---

### 4️⃣ Verificar android/build.gradle

Asegúrate de tener estos plugins:

```gradle
buildscript {
    dependencies {
        // ...
        classpath 'com.google.gms:google-services:4.3.15'  // Versión actualizada
    }
}
```

---

### 5️⃣ Verificar android/app/build.gradle

Al final del archivo debe tener:

```gradle
apply plugin: 'com.google.gms.google-services'
```

Y en dependencies:

```gradle
dependencies {
    // ...
    implementation 'com.google.android.gms:play-services-auth:20.7.0'
}
```

---

### 6️⃣ Obtener el Web Client ID

1. Ve a **Firebase Console** > **Authentication**
2. Click en la pestaña **Sign-in method**
3. Click en **Google** (debe estar habilitado)
4. Expande la sección y copia el **Web client ID**

Se ve así: `123456789-abcdefghijklmnop.apps.googleusercontent.com`

---

### 7️⃣ Configurar Google Sign-In en tu App

#### Instalar el paquete:

```bash
npm install @react-native-google-signin/google-signin
```

#### Configurar en el código:

```typescript
import { GoogleSignin } from '@react-native-google-signin/google-signin';

// En tu componente principal o App.tsx, ANTES de render:
GoogleSignin.configure({
  webClientId: '123456789-abcdefghijklmnop.apps.googleusercontent.com', // Tu Web Client ID
  offlineAccess: true,
  forceCodeForRefreshToken: true,
});
```

---

### 8️⃣ Implementar Login con Google

```typescript
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import auth from '@react-native-firebase/auth';

const signInWithGoogle = async () => {
  try {
    console.log('🔐 Iniciando Google Sign-In...');
    
    // Verificar que Google Play Services esté disponible
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    
    // Obtener el usuario de Google
    const { idToken } = await GoogleSignin.signIn();
    console.log('✅ Token de Google obtenido');

    // Crear credencial de Firebase
    const googleCredential = auth.GoogleAuthProvider.credential(idToken);
    
    // Iniciar sesión en Firebase
    const userCredential = await auth().signInWithCredential(googleCredential);
    console.log('✅ Usuario autenticado en Firebase:', userCredential.user.uid);
    
    // Obtener el token de Firebase para tu backend
    const firebaseToken = await userCredential.user.getIdToken();
    console.log('✅ Token de Firebase obtenido');

    // Enviar al backend de Munpa
    const response = await fetch('https://api.munpa.online/api/auth/google', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        idToken: firebaseToken
      })
    });

    const data = await response.json();

    if (data.success) {
      console.log('✅ Login exitoso en Munpa:', data.data);
      
      // Guardar customToken y datos del usuario
      await AsyncStorage.setItem('userToken', data.data.customToken);
      await AsyncStorage.setItem('userData', JSON.stringify({
        uid: data.data.uid,
        email: data.data.email,
        displayName: data.data.displayName,
        photoUrl: data.data.photoUrl
      }));
      
      return data.data;
    } else {
      throw new Error(data.message);
    }

  } catch (error) {
    console.error('❌ Error en login con Google:', error);
    throw error;
  }
};
```

---

### 9️⃣ Verificar en Firebase Console > Authentication

1. Ir a **Authentication** > **Sign-in method**
2. Verificar que **Google** esté **Enabled (Habilitado)**
3. Si no está habilitado:
   - Click en **Google**
   - Click en **Enable**
   - Agregar un **Support email**
   - Click en **Save**

---

## 🔍 Debugging

Si sigue sin funcionar, verifica lo siguiente:

### Verificar SHA en Firebase:

```bash
cd android
./gradlew signingReport | grep SHA
```

Compara la salida con los SHA que agregaste en Firebase Console.

### Verificar Package Name:

En `android/app/build.gradle`:

```gradle
defaultConfig {
    applicationId "com.munpa"  // Este debe coincidir con Firebase
}
```

En Firebase Console debe estar registrada una app con el mismo **Package name**.

### Limpiar y Rebuilder:

```bash
cd android
./gradlew clean
cd ..
rm -rf node_modules
npm install
npx react-native run-android
```

---

## 📝 Backend Endpoint

### POST /api/auth/google

**Request:**
```json
{
  "idToken": "eyJhbGciOiJSUzI1NiIsImtpZCI6..."
}
```

**Response (Éxito):**
```json
{
  "success": true,
  "message": "Login con Google exitoso",
  "data": {
    "uid": "abc123",
    "email": "usuario@gmail.com",
    "displayName": "María López",
    "photoUrl": "https://lh3.googleusercontent.com/...",
    "customToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6...",
    "isNewUser": false
  }
}
```

**Response (Error):**
```json
{
  "success": false,
  "message": "Token de Google inválido",
  "error": "..."
}
```

---

## ✅ Checklist Final

- [ ] SHA-1 y SHA-256 agregados en Firebase Console
- [ ] Nuevo `google-services.json` descargado y reemplazado
- [ ] Web Client ID copiado y configurado en el código
- [ ] Google Sign-In habilitado en Firebase Console > Authentication
- [ ] Package name coincide entre app y Firebase
- [ ] App limpiada y recompilada (`./gradlew clean`)
- [ ] Código de login implementado correctamente

---

## 🆘 Si Aún No Funciona

1. **Desinstalar la app** del dispositivo completamente
2. **Limpiar todo:**
   ```bash
   cd android
   ./gradlew clean
   cd ..
   rm -rf node_modules
   rm -rf android/.gradle
   rm -rf android/app/build
   npm install
   ```
3. **Reinstalar:**
   ```bash
   npx react-native run-android
   ```
4. **Verificar logs de Android Studio:** Buscar mensajes de error específicos de Google Sign-In

---

## 📚 Recursos

- [Troubleshooting Google Sign-In](https://react-native-google-signin.github.io/docs/troubleshooting)
- [Firebase Authentication con Google](https://rnfirebase.io/auth/social-auth#google)
- [Obtener SHA Fingerprints](https://developers.google.com/android/guides/client-auth)

---

## 🎯 Resumen

El error `DEVELOPER_ERROR` se soluciona:

1. **Agregando los SHA-1 y SHA-256** de tu app en Firebase Console
2. **Descargando el nuevo google-services.json**
3. **Verificando que Google esté habilitado** en Firebase Authentication
4. **Usando el Web Client ID correcto** en GoogleSignin.configure()
5. **Limpiando y recompilando** la app

¡Con estos pasos debería funcionar! 🚀

