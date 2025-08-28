# 🚀 Guía de Despliegue - Backend Firebase

## 📋 Opciones de Despliegue

### 1. **Vercel** ⭐ (Recomendado - Gratis)

**Ventajas:**
- ✅ Gratis para proyectos personales
- ✅ Despliegue automático desde GitHub
- ✅ Excelente rendimiento
- ✅ Fácil configuración
- ✅ SSL automático

**Pasos:**
1. Instala Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Inicia sesión:
   ```bash
   vercel login
   ```

3. Despliega:
   ```bash
   vercel
   ```

4. Configura variables de entorno en el dashboard de Vercel:
   - Ve a tu proyecto en vercel.com
   - Settings > Environment Variables
   - Agrega todas las variables de Firebase del archivo `.env`

5. Tu URL será: `https://tu-proyecto.vercel.app`

---

### 2. **Heroku** ⭐ (Excelente)

**Ventajas:**
- ✅ Confiable y estable
- ✅ Integración con GitHub
- ✅ Escalable
- ✅ SSL automático

**Pasos:**
1. Instala Heroku CLI:
   ```bash
   # macOS
   brew tap heroku/brew && brew install heroku
   ```

2. Inicia sesión:
   ```bash
   heroku login
   ```

3. Crea la app:
   ```bash
   heroku create tu-app-name
   ```

4. Configura variables de entorno:
   ```bash
   heroku config:set FIREBASE_PROJECT_ID=mumpabackend
   heroku config:set FIREBASE_PRIVATE_KEY_ID=0c400d3af79bb9f492211edef3d63ef7dbb21fa1
   heroku config:set FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC2EeAdzux+/FoK\ncE4TLh2uu3IrJS9bSYzqeMl6axMJ5O9avoHZXR9ghznVsM1gl9t/lRnCKst8Elfg\nvWKS6sRCd7Z8vBZMh7OrjMQVQSgKOyzkUqgVG+VOJm8zVZks4bA4dvHNas64GB8O\nUREdEjhaOxLH8c1cRFqztVkqtHO6lHLUjQ3eq1IpEyZQnlzlBNv9NU7fQULEOd5V\n9nnMt9ulNW47MKxBjwr7pmlwOXM4mFTBI2voE8Bpl7Dt23FvDB7YWjujg/B+FimR\noQSf+28qhhBF7RJT9yF+VROlJRhTw/6PlJx1MGVGDQLPfZSYvHojdEmZyp3Kfgum\nfNBbUWN5AgMBAAECggEAEd7KSRK0yrf5HHouZ5qIpkxWpd51+fdLof3uBJp62WdD\niPwW4Z9Ow5oyNoOufNMa47heOV0a8NgaEQB1qubpEX8PhcmuRJ+zJlzgKBfnlq19\nOAHW5o+A371M/9RgfvO96KTgEeHwXUhcz/pr/Bb8Ofr/Wmmk1vAMmQPtNxBUJZVf\nFvNTI7P+fMuRlPBgaGQQ+p3uc6+QIql3gq5WUQrrvH/qRgg1mAbl+YLqvnLBMv5y\nIOzJg4QpeDxUOTubo0K28aKzc8Jm598G9xBaoZzFPVUh0AaivRvRUtQdClAiYwR/\nwHAV6n5tV4TVgaRFww/GAzIHHzkBTrJsH46fo31FuwKBgQDbjpiZ1f9GZ+/jaiCx\n1t2Sd83EwUoMD8Xb61Aqwaeq3DqcCQBy13mOzYpVZXKXztVJeaLjFjeAKcv2aMIu\ndGBrv+RJIu+ZEHmqy5Q+PUSZ9zgd62Khkihuo6WVd8w9H3C1JSyclXCRx6ph5myP\nfaxVQwpAKpTnD4hYn5KjzLp3LwKBgQDUSmA47tFol2hLsgTeJShd7h3FeJCkR4rJ\ncKUxy+oXxndq3Obzii5mBCrA6N54pQ4UAAxd59JhtBLKFBRP2+mtOzfrM2/hTBB5\nCgMTjhkKPzWLeEWZdekbdQtP1d1GnOYcRHcl/0ufcLATAxA1OlzZ/4PA6aScBJOk\n+qrEqPql1wKBgBaXAl55pS1CTm1QoxKJL/z89J/030CEcvAgsvvjNvQeeq1JQ9GN\nGAW4Yi5NJNA3yLwplrfUtlsqccDloG0VLkKH2N4piQtvpYUMMzGALknFJPH3IQvM\ntPpFPik1zT7QuFD7BS8LNSzapU4zXiIZZRzUq/5UI0Pu1jGAIZ9W1iyjAoGAW9lO\nJnPVcJ5Jhq6gAokrHPDAOsb+NcWqW5t8Lb5fKyg4VKj815QKnSLiaJKYZrRrEeYv\nc5WwZYtmsb3cR+0K/mNnv0CDAIRLgEL/r79EQDW28f/4hPwJ/lI2sbUDRuDtgn9w\n2aTKUFKOK7ugkJcOw1cU5ytvh/1G8BNwPSQrRgMCgYEAzKwklbGlXAcb6wMrKWjv\nJELI6g3DOoSFgPwxAzN5dz4yPL2FkoeBjrIf+FMXEm723RRqsuATgI+AuFJs4Zxs\nM+z8lPAwcB6SpCpC5LYlFZ+I7OEKpZCJOhnymktO/FiqJYyoV0PImiBsXj8Q9850\nlpJOBb0FnuZAqMns9obPsDI=\n-----END PRIVATE KEY-----\n"
   heroku config:set FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@mumpabackend.iam.gserviceaccount.com
   heroku config:set FIREBASE_CLIENT_ID=108237327464240518768
   heroku config:set FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
   heroku config:set FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
   heroku config:set FIREBASE_AUTH_PROVIDER_X509_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
   heroku config:set FIREBASE_CLIENT_X509_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40mumpabackend.iam.gserviceaccount.com
   heroku config:set NODE_ENV=production
   ```

5. Despliega:
   ```bash
   git add .
   git commit -m "Deploy to Heroku"
   git push heroku main
   ```

6. Tu URL será: `https://tu-app-name.herokuapp.com`

---

### 3. **Railway** ⭐ (Moderno y Fácil)

**Ventajas:**
- ✅ Muy fácil de usar
- ✅ Despliegue automático
- ✅ Precios justos
- ✅ Excelente para proyectos pequeños

**Pasos:**
1. Ve a [railway.app](https://railway.app)
2. Conecta tu cuenta de GitHub
3. Crea un nuevo proyecto
4. Selecciona tu repositorio
5. Configura las variables de entorno en el dashboard
6. ¡Listo! Despliegue automático

---

### 4. **Render** ⭐ (Excelente Alternativa)

**Ventajas:**
- ✅ Gratis para proyectos personales
- ✅ Fácil configuración
- ✅ SSL automático
- ✅ Despliegue automático

**Pasos:**
1. Ve a [render.com](https://render.com)
2. Conecta tu cuenta de GitHub
3. Crea un nuevo Web Service
4. Selecciona tu repositorio
5. Configura las variables de entorno
6. ¡Listo!

---

## 🔧 Configuración de Variables de Entorno

**IMPORTANTE:** En todos los servicios, necesitas configurar estas variables:

```env
FIREBASE_PROJECT_ID=mumpabackend
FIREBASE_PRIVATE_KEY_ID=0c400d3af79bb9f492211edef3d63ef7dbb21fa1
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC2EeAdzux+/FoK\ncE4TLh2uu3IrJS9bSYzqeMl6axMJ5O9avoHZXR9ghznVsM1gl9t/lRnCKst8Elfg\nvWKS6sRCd7Z8vBZMh7OrjMQVQSgKOyzkUqgVG+VOJm8zVZks4bA4dvHNas64GB8O\nUREdEjhaOxLH8c1cRFqztVkqtHO6lHLUjQ3eq1IpEyZQnlzlBNv9NU7fQULEOd5V\n9nnMt9ulNW47MKxBjwr7pmlwOXM4mFTBI2voE8Bpl7Dt23FvDB7YWjujg/B+FimR\noQSf+28qhhBF7RJT9yF+VROlJRhTw/6PlJx1MGVGDQLPfZSYvHojdEmZyp3Kfgum\nfNBbUWN5AgMBAAECggEAEd7KSRK0yrf5HHouZ5qIpkxWpd51+fdLof3uBJp62WdD\niPwW4Z9Ow5oyNoOufNMa47heOV0a8NgaEQB1qubpEX8PhcmuRJ+zJlzgKBfnlq19\nOAHW5o+A371M/9RgfvO96KTgEeHwXUhcz/pr/Bb8Ofr/Wmmk1vAMmQPtNxBUJZVf\nFvNTI7P+fMuRlPBgaGQQ+p3uc6+QIql3gq5WUQrrvH/qRgg1mAbl+YLqvnLBMv5y\nIOzJg4QpeDxUOTubo0K28aKzc8Jm598G9xBaoZzFPVUh0AaivRvRUtQdClAiYwR/\nwHAV6n5tV4TVgaRFww/GAzIHHzkBTrJsH46fo31FuwKBgQDbjpiZ1f9GZ+/jaiCx\n1t2Sd83EwUoMD8Xb61Aqwaeq3DqcCQBy13mOzYpVZXKXztVJeaLjFjeAKcv2aMIu\ndGBrv+RJIu+ZEHmqy5Q+PUSZ9zgd62Khkihuo6WVd8w9H3C1JSyclXCRx6ph5myP\nfaxVQwpAKpTnD4hYn5KjzLp3LwKBgQDUSmA47tFol2hLsgTeJShd7h3FeJCkR4rJ\ncKUxy+oXxndq3Obzii5mBCrA6N54pQ4UAAxd59JhtBLKFBRP2+mtOzfrM2/hTBB5\nCgMTjhkKPzWLeEWZdekbdQtP1d1GnOYcRHcl/0ufcLATAxA1OlzZ/4PA6aScBJOk\n+qrEqPql1wKBgBaXAl55pS1CTm1QoxKJL/z89J/030CEcvAgsvvjNvQeeq1JQ9GN\nGAW4Yi5NJNA3yLwplrfUtlsqccDloG0VLkKH2N4piQtvpYUMMzGALknFJPH3IQvM\ntPpFPik1zT7QuFD7BS8LNSzapU4zXiIZZRzUq/5UI0Pu1jGAIZ9W1iyjAoGAW9lO\nJnPVcJ5Jhq6gAokrHPDAOsb+NcWqW5t8Lb5fKyg4VKj815QKnSLiaJKYZrRrEeYv\nc5WwZYtmsb3cR+0K/mNnv0CDAIRLgEL/r79EQDW28f/4hPwJ/lI2sbUDRuDtgn9w\n2aTKUFKOK7ugkJcOw1cU5ytvh/1G8BNwPSQrRgMCgYEAzKwklbGlXAcb6wMrKWjv\nJELI6g3DOoSFgPwxAzN5dz4yPL2FkoeBjrIf+FMXEm723RRqsuATgI+AuFJs4Zxs\nM+z8lPAwcB6SpCpC5LYlFZ+I7OEKpZCJOhnymktO/FiqJYyoV0PImiBsXj8Q9850\nlpJOBb0FnuZAqMns9obPsDI=\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@mumpabackend.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=108237327464240518768
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
FIREBASE_AUTH_PROVIDER_X509_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
FIREBASE_CLIENT_X509_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40mumpabackend.iam.gserviceaccount.com
NODE_ENV=production
```

## 🎯 Recomendación

**Para empezar, te recomiendo Vercel** porque:
- Es completamente gratis
- Muy fácil de configurar
- Excelente rendimiento
- Despliegue automático desde GitHub

## 📱 Uso en Frontend

Una vez desplegado, tu frontend podrá usar la API así:

```javascript
// Ejemplo con fetch
const API_URL = 'https://tu-app.vercel.app/api';

// Registro
const signup = async (userData) => {
  const response = await fetch(`${API_URL}/auth/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(userData)
  });
  return response.json();
};

// Login
const login = async (credentials) => {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(credentials)
  });
  return response.json();
};
```

## 🔒 Seguridad

Recuerda:
- ✅ Nunca subas el archivo `.env` a GitHub
- ✅ Configura las variables de entorno en el servicio de despliegue
- ✅ Usa HTTPS en producción
- ✅ Configura CORS correctamente para tu dominio
