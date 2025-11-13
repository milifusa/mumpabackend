# 🔴 SOLUCIÓN URGENTE: DEVELOPER_ERROR (Código 10)

## ⚡ ACCIÓN INMEDIATA - Sigue estos pasos en ORDEN

---

## PASO 1: Obtener SHA-1 y SHA-256 CORRECTOS

### Para la versión DEBUG (la que usas ahora):

```bash
cd android
./gradlew signingReport
```

**Busca la sección que dice:**
```
Variant: debug
Config: debug
```

**Copia ESTOS VALORES:**
```
SHA1: AB:CD:EF:12:34:56:78:90:AB:CD:EF:12:34:56:78:90:AB:CD:EF:12
SHA-256: 12:34:56:78:90:AB:CD:EF:12:34:56:78:90:AB:CD:EF:12:34:56:78:90:AB:CD:EF:12:34:56:78:90:AB:CD:EF:12
```

📝 **ANÓTALOS EN UN ARCHIVO DE TEXTO** - Los necesitarás en el siguiente paso.

---

## PASO 2: Verificar/Agregar SHA en Firebase Console

### 🌐 Abre: https://console.firebase.google.com/

1. Selecciona tu proyecto **Munpa** (o como se llame)

2. Click en **⚙️ (ícono de engranaje)** > **Project Settings**

3. Baja hasta la sección **Your apps** (Tus aplicaciones)

4. Busca tu app Android (debería tener un ícono de Android 🤖)
   - Si NO VES ninguna app Android, tienes que agregarla primero:
     - Click **Add app** > **Android**
     - Package name: lo encuentras en `android/app/build.gradle` en `applicationId`
     - Ejemplo: `com.munpa` o `com.myapp.munpa`

5. **Click en la app Android** para expandir

6. Baja hasta **SHA certificate fingerprints**

7. ¿Ya hay SHA agregados?
   - **SI:** Verifica que coincidan con los del Paso 1
   - **NO:** Click **Add fingerprint**

8. **Agregar SHA-1:**
   - Click **Add fingerprint**
   - Pega el SHA-1 del Paso 1
   - Click **Save**

9. **Agregar SHA-256:**
   - Click **Add fingerprint** de nuevo
   - Pega el SHA-256 del Paso 1
   - Click **Save**

✅ **Deberías ver 2 fingerprints ahora:** uno SHA-1 y uno SHA-256

---

## PASO 3: Descargar NUEVO google-services.json

**⚠️ MUY IMPORTANTE:** Esto es crítico después de agregar los SHA.

1. **En la misma página** de Firebase Console (donde agregaste los SHA)

2. Busca el botón **google-services.json** o **Download google-services.json**

3. Click y descarga el archivo

4. **Reemplaza el archivo** en tu proyecto:
   ```bash
   # Ruta donde debe estar:
   # android/app/google-services.json
   ```

5. **Verifica que se reemplazó:**
   ```bash
   ls -la android/app/google-services.json
   ```
   Debe mostrar la fecha/hora actual.

---

## PASO 4: Obtener el Web Client ID CORRECTO

1. En Firebase Console, ve a **Authentication**

2. Click en la pestaña **Sign-in method**

3. Click en **Google** (debe estar habilitado con un toggle verde)

4. Si NO está habilitado:
   - Click en **Google**
   - Click **Enable**
   - Selecciona un **Support email**
   - Click **Save**

5. **Expande la sección de Google** (click en Google otra vez si se cerró)

6. Verás algo como:
   ```
   Web SDK configuration
   Web client ID: 123456789-abcdefg12345hijklmno.apps.googleusercontent.com
   ```

7. **COPIA ese Web client ID COMPLETO**

---

## PASO 5: Configurar en tu Código

### En tu archivo donde configuras Google Sign-In (probablemente App.tsx o similar):

```typescript
import { GoogleSignin } from '@react-native-google-signin/google-signin';

// ANTES del return, al inicio del componente
useEffect(() => {
  GoogleSignin.configure({
    webClientId: '123456789-abcdefg12345hijklmno.apps.googleusercontent.com', // ⬅️ PEGA TU WEB CLIENT ID AQUÍ
    offlineAccess: true,
    forceCodeForRefreshToken: true,
  });
}, []);
```

**⚠️ IMPORTANTE:** Reemplaza `123456789-abcdefg12345hijklmno.apps.googleusercontent.com` con tu Web Client ID real del Paso 4.

---

## PASO 6: LIMPIAR TODO (CRÍTICO)

```bash
# 1. Limpiar Android
cd android
./gradlew clean
cd ..

# 2. Limpiar node_modules
rm -rf node_modules
rm -rf android/.gradle
rm -rf android/app/build

# 3. Reinstalar
npm install

# 4. Opcional pero recomendado - reiniciar Metro
npx react-native start --reset-cache
```

---

## PASO 7: Desinstalar App del Dispositivo

**Esto es MUY importante:**

1. **Desinstala completamente** la app de tu dispositivo/emulador
   - Ve a Settings > Apps > Munpa > Uninstall
   - O: `adb uninstall com.munpa` (reemplaza con tu package name)

2. **Reinstala desde cero:**
   ```bash
   npx react-native run-android
   ```

---

## PASO 8: Probar

```bash
# En una terminal:
npx react-native start

# En otra terminal:
npx react-native run-android
```

Prueba el login con Google.

---

## 🔍 VERIFICACIÓN ADICIONAL

### Verificar Package Name coincide:

**En `android/app/build.gradle`:**
```gradle
defaultConfig {
    applicationId "com.munpa"  // ⬅️ Este es tu package name
}
```

**En Firebase Console:**
- Ve a Project Settings > Your apps
- La app Android debe tener el MISMO package name

---

## 🆘 SI AÚN FALLA

### Verifica que los SHA en Firebase coincidan:

```bash
# En tu terminal:
cd android
./gradlew signingReport | grep SHA

# La salida debe coincidir EXACTAMENTE con lo que ves en Firebase Console
```

### Verifica el google-services.json:

```bash
# Ver el contenido
cat android/app/google-services.json
```

Debe contener:
- Tu package name
- Los client IDs
- Fecha reciente de modificación

### Logs más detallados:

```bash
# Ejecutar con logs:
npx react-native run-android

# En otra terminal, ver logs específicos:
adb logcat | grep -i "google"
```

Busca mensajes como:
- `Status{statusCode=DEVELOPER_ERROR}` ❌ Error de configuración
- `Successfully signed in` ✅ Funcionó

---

## 📋 CHECKLIST FINAL

Antes de probar de nuevo, verifica que TODOS estos puntos estén ✅:

- [ ] SHA-1 agregado en Firebase Console
- [ ] SHA-256 agregado en Firebase Console
- [ ] Los SHA en Firebase coinciden con los de `./gradlew signingReport`
- [ ] `google-services.json` descargado DESPUÉS de agregar SHA
- [ ] `google-services.json` reemplazado en `android/app/`
- [ ] Web Client ID correcto en `GoogleSignin.configure()`
- [ ] Google habilitado en Firebase Console > Authentication
- [ ] Package name coincide entre app y Firebase
- [ ] `./gradlew clean` ejecutado
- [ ] `node_modules` borrado y reinstalado
- [ ] App desinstalada del dispositivo
- [ ] App reinstalada desde cero

---

## 🎯 PROBLEMA MÁS COMÚN

El 90% de las veces el error es por:

1. **No descargar el nuevo google-services.json** después de agregar los SHA
2. **No limpiar y rebuilder** después de actualizar el google-services.json
3. **No desinstalar la app vieja** antes de instalar la nueva

**Asegúrate de hacer los 3.**

---

## 📱 CÓDIGO COMPLETO DE LOGIN

Si necesitas verificar tu implementación:

```typescript
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import auth from '@react-native-firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configurar (una sola vez, al inicio de la app)
GoogleSignin.configure({
  webClientId: 'TU_WEB_CLIENT_ID.apps.googleusercontent.com',
  offlineAccess: true,
  forceCodeForRefreshToken: true,
});

// Función de login
const signInWithGoogle = async () => {
  try {
    console.log('📱 Verificando Google Play Services...');
    await GoogleSignin.hasPlayServices({ 
      showPlayServicesUpdateDialog: true 
    });
    
    console.log('📱 Iniciando Google Sign-In...');
    const { idToken } = await GoogleSignin.signIn();
    console.log('✅ Token de Google obtenido');

    console.log('📱 Creando credencial de Firebase...');
    const googleCredential = auth.GoogleAuthProvider.credential(idToken);
    
    console.log('📱 Autenticando con Firebase...');
    const userCredential = await auth().signInWithCredential(googleCredential);
    console.log('✅ Usuario autenticado:', userCredential.user.email);
    
    console.log('📱 Obteniendo token de Firebase...');
    const firebaseToken = await userCredential.user.getIdToken();
    
    console.log('📱 Enviando a backend Munpa...');
    const response = await fetch('https://api.munpa.online/api/auth/google', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ idToken: firebaseToken })
    });

    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Login exitoso en Munpa:', data.data.email);
      
      await AsyncStorage.setItem('userToken', data.data.customToken);
      await AsyncStorage.setItem('userData', JSON.stringify(data.data));
      
      return data.data;
    } else {
      throw new Error(data.message);
    }

  } catch (error) {
    console.error('❌ Error en Google Sign-In:', error);
    
    if (error.code === 'DEVELOPER_ERROR') {
      Alert.alert(
        'Error de Configuración',
        'Por favor contacta al desarrollador. Código: DEVELOPER_ERROR'
      );
    }
    
    throw error;
  }
};
```

---

## 🔗 RECURSOS

- [Troubleshooting oficial](https://react-native-google-signin.github.io/docs/troubleshooting)
- [Obtener SHA](https://developers.google.com/android/guides/client-auth)
- [Firebase Authentication](https://rnfirebase.io/auth/social-auth#google)

---

## 💬 ¿NECESITAS AYUDA?

Si después de seguir TODOS estos pasos sigue sin funcionar, envíame:

1. Output de: `cd android && ./gradlew signingReport | grep SHA`
2. Screenshot de Firebase Console > Project Settings > Your apps > Android app (mostrando los SHA agregados)
3. Contenido del `applicationId` de `android/app/build.gradle`
4. Logs de: `adb logcat | grep -i "google"` cuando intentas hacer login

¡Con eso puedo ayudarte más específicamente! 🚀

