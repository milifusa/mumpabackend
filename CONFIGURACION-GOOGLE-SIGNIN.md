# 🔧 Configuración Completa de Google Sign-In

## ⚠️ ERROR QUE ESTABAS TENIENDO

```
❌ Token inválido y no se proporcionó email para crear usuario
```

**Causa:** Estabas usando el endpoint `/api/auth/google-login` (avanzado) sin enviar los datos necesarios.

**Solución:** Usar `/api/auth/google-login-simple` con los datos del usuario de Google.

---

## 📋 Pasos de Configuración

### 1️⃣ Instalar Dependencias en React Native

```bash
npm install @react-native-google-signin/google-signin
npm install @react-native-firebase/auth
npm install axios
```

### 2️⃣ Configurar Firebase (si aún no lo has hecho)

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto
3. Ve a **Authentication** → **Sign-in method**
4. Habilita **Google** como proveedor
5. Guarda los cambios

### 3️⃣ Obtener el Web Client ID

**Opción A: Desde Firebase Console**

1. Ve a **Configuración del proyecto** (⚙️)
2. Scroll hasta **Tus apps**
3. Selecciona tu app
4. Busca `webClientId` en el SDK de Firebase
5. Copia el ID (termina en `.apps.googleusercontent.com`)

**Opción B: Desde Google Cloud Console**

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Selecciona tu proyecto
3. **APIs y servicios** → **Credenciales**
4. Busca el **ID de cliente OAuth 2.0** tipo **Web**
5. Copia el **ID de cliente**

**Ejemplo de Web Client ID:**
```
123456789012-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com
```

### 4️⃣ Configurar en tu App.js (o donde inicialices)

```javascript
import { GoogleSignin } from '@react-native-google-signin/google-signin';

// Configurar Google Sign-In al inicio de tu app
GoogleSignin.configure({
  webClientId: 'TU_WEB_CLIENT_ID.apps.googleusercontent.com', // ⭐ IMPORTANTE
  offlineAccess: false,
  forceCodeForRefreshToken: false,
});
```

### 5️⃣ Crear el servicio de autenticación

Crea un archivo `services/auth.js` y copia el contenido de `CODIGO-FRONTEND-GOOGLE-LOGIN.js`

**⭐ PUNTO CLAVE:** El archivo usa el endpoint correcto:

```javascript
// ✅ CORRECTO - Endpoint SIMPLE
const response = await axios.post(
  `${API_URL}/api/auth/google-login-simple`,  // <-- Con -simple
  {
    email: userInfo.user.email,
    displayName: userInfo.user.name,
    photoURL: userInfo.user.photo,
    googleId: userInfo.user.id
  }
);
```

```javascript
// ❌ INCORRECTO - Lo que estabas usando antes
const response = await axios.post(
  `${API_URL}/api/auth/google-login`,  // Sin -simple
  { idToken: someToken }  // Falta el email
);
```

### 6️⃣ Usar en tu pantalla de Login

Copia el contenido de `EJEMPLO-PANTALLA-LOGIN.jsx` y ajusta según tu diseño.

---

## 🔍 Debugging - Cómo Ver Qué Está Pasando

### En el Frontend

Agrega estos logs en tu función de login:

```javascript
const loginWithGoogle = async () => {
  try {
    // 1. Login con Google
    const userInfo = await GoogleSignin.signIn();
    console.log('📱 [FRONTEND] Usuario de Google:', userInfo.user);

    // 2. Preparar datos
    const userData = {
      email: userInfo.user.email,
      displayName: userInfo.user.name,
      photoURL: userInfo.user.photo,
      googleId: userInfo.user.id
    };
    console.log('📤 [FRONTEND] Datos a enviar:', userData);

    // 3. Enviar al backend
    console.log('🌐 [FRONTEND] Llamando a:', `${API_URL}/api/auth/google-login-simple`);
    const response = await axios.post(
      `${API_URL}/api/auth/google-login-simple`,
      userData
    );
    console.log('✅ [FRONTEND] Respuesta:', response.data);

    // ... resto del código
  } catch (error) {
    console.error('❌ [FRONTEND] Error completo:', error);
    console.error('❌ [FRONTEND] Respuesta del servidor:', error.response?.data);
  }
};
```

### En el Backend (Vercel)

Para ver los logs del backend:

```bash
# Opción 1: Ver logs en tiempo real
vercel logs --follow

# Opción 2: Ver logs en Vercel Dashboard
# https://vercel.com/tu-proyecto/deployments
# Click en tu deployment → Logs
```

Busca estos mensajes:

```
✅ [GOOGLE-LOGIN-SIMPLE] Login para: usuario@gmail.com
✅ [GOOGLE-LOGIN-SIMPLE] Usuario encontrado: uid-123
✅ [GOOGLE-LOGIN-SIMPLE] Usuario actualizado en Firestore
```

---

## 🧪 Probar el Endpoint Manualmente

### Con curl:

```bash
curl -X POST https://mumpabackend-r4mvj15so-mishu-lojans-projects.vercel.app/api/auth/google-login-simple \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@gmail.com",
    "displayName": "Usuario Test",
    "photoURL": "https://lh3.googleusercontent.com/a/default-user",
    "googleId": "google-id-12345"
  }'
```

### Con Postman:

**POST** `https://mumpabackend-r4mvj15so-mishu-lojans-projects.vercel.app/api/auth/google-login-simple`

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "email": "test@gmail.com",
  "displayName": "Usuario Test",
  "photoURL": "https://lh3.googleusercontent.com/a/default-user",
  "googleId": "google-id-12345"
}
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
    "photoURL": "https://lh3.googleusercontent.com/a/default-user",
    "emailVerified": true,
    "customToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

## ✅ Checklist de Verificación

Antes de probar en tu app, verifica:

- [ ] **Firebase tiene Google habilitado** en Authentication
- [ ] **Web Client ID está configurado** en GoogleSignin.configure()
- [ ] **El archivo de servicio usa** `/api/auth/google-login-simple`
- [ ] **Se envían los 4 campos**: email, displayName, photoURL, googleId
- [ ] **La URL del backend es correcta** (Vercel production URL)
- [ ] **Tienes instaladas las dependencias**: @react-native-google-signin, @react-native-firebase/auth

---

## 🆘 Solución de Problemas Comunes

### Error: "Sign in action cancelled"
✅ **Normal** - El usuario canceló el login
✅ **Solución** - Solo muestra un mensaje amigable

### Error: "Developer error"
❌ **Problema** - Web Client ID incorrecto o no configurado
✅ **Solución** - Verifica que usas el Web Client ID (no Android/iOS)

### Error: "Network error"
❌ **Problema** - No hay conexión o la URL es incorrecta
✅ **Solución** - Verifica la URL del backend en `API_URL`

### Error: "Token inválido y no se proporcionó email"
❌ **Problema** - Estás usando el endpoint equivocado
✅ **Solución** - Cambia a `/api/auth/google-login-simple`

### Error: "Request failed with status code 500"
❌ **Problema** - Error en el backend
✅ **Solución** - Revisa los logs de Vercel con `vercel logs --follow`

### Error: "Firebase not configured"
❌ **Problema** - Variables de entorno no están en Vercel
✅ **Solución** - Verifica que las env vars de Firebase estén en Vercel

---

## 📊 Flujo Completo

```
┌─────────────────┐
│ Usuario hace    │
│ tap en botón    │
└────────┬────────┘
         │
         ▼
┌─────────────────────────┐
│ GoogleSignin.signIn()   │
│ Muestra diálogo Google  │
└────────┬────────────────┘
         │
         │ userInfo (email, name, photo, id)
         ▼
┌──────────────────────────────────┐
│ Preparar objeto userData:        │
│ {                                │
│   email: userInfo.user.email,    │
│   displayName: userInfo.user.name│
│   photoURL: userInfo.user.photo, │
│   googleId: userInfo.user.id     │
│ }                                │
└────────┬─────────────────────────┘
         │
         │ POST /api/auth/google-login-simple
         ▼
┌────────────────────────────────────┐
│ BACKEND (Vercel)                   │
│                                    │
│ 1. Buscar usuario en Firebase Auth│
│    por email                       │
│ 2. Si no existe:                   │
│    • Crear en Firebase Auth        │
│    • Crear en Firestore           │
│ 3. Si existe:                      │
│    • Actualizar updatedAt         │
│ 4. Generar customToken            │
│ 5. Retornar datos + token         │
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

## 🎯 Próximos Pasos

1. **Copia** `CODIGO-FRONTEND-GOOGLE-LOGIN.js` a tu proyecto como `services/auth.js`
2. **Reemplaza** `API_URL` con tu URL de Vercel
3. **Configura** el `webClientId` en tu App.js
4. **Usa** la función `loginWithGoogle()` en tu pantalla de login
5. **Prueba** el login y revisa los logs

---

## 📞 Si Sigues Teniendo Problemas

Comparte:

1. Los logs del frontend (console.log)
2. Los logs del backend (vercel logs)
3. El código exacto que estás usando para llamar al endpoint
4. El mensaje de error completo

---

**¡Con estos cambios debería funcionar perfectamente! 🚀**

