# 🔧 Configurar CORS en Firebase Storage

## 🐛 El Problema

Cuando intentas acceder a las imágenes desde el dashboard, obtienes este error:

```
Access to image at 'https://storage.googleapis.com/...' from origin 'https://dash.munpa.online' 
has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present
```

Esto sucede porque **Firebase Storage no tiene configurado CORS** para permitir peticiones desde tu dominio.

---

## ✅ Solución - Opción 1: Configuración Manual (Más Fácil)

### Paso 1: Ir a Firebase Console

1. Ve a: https://console.firebase.google.com/project/mumpabackend/storage
2. Verás tu bucket de Storage

### Paso 2: Abrir Configuración CORS

3. Click en los **3 puntos verticales** (⋮) junto al nombre del bucket
4. Selecciona **"Editar configuración de CORS"** o **"Edit CORS configuration"**

### Paso 3: Pegar Configuración

5. Copia y pega esta configuración:

```json
[
  {
    "origin": [
      "http://localhost:4200",
      "https://munpa.online",
      "https://www.munpa.online",
      "https://dash.munpa.online"
    ],
    "method": ["GET", "HEAD", "PUT", "POST", "DELETE"],
    "responseHeader": ["Content-Type", "Authorization", "Content-Length"],
    "maxAgeSeconds": 3600
  }
]
```

6. Click en **"Guardar"** o **"Save"**

### Paso 4: Verificar

7. Recarga tu dashboard (`dash.munpa.online`)
8. Las imágenes deberían cargar sin problemas

---

## ✅ Solución - Opción 2: Usando gsutil (Más Técnico)

### Requisitos Previos

Necesitas tener instalado Google Cloud SDK:

```bash
# macOS
brew install google-cloud-sdk

# Después de instalar
gcloud init
gcloud auth login
```

### Ejecutar Script

```bash
# Dar permisos de ejecución
chmod +x configure-storage-cors.sh

# Ejecutar
./configure-storage-cors.sh
```

O manualmente:

```bash
gsutil cors set cors-storage-config.json gs://mumpabackend.firebasestorage.app
```

### Verificar Configuración

```bash
gsutil cors get gs://mumpabackend.firebasestorage.app
```

---

## 📋 ¿Qué Hace esta Configuración?

La configuración CORS permite que tu bucket de Firebase Storage responda a peticiones desde estos orígenes:

- ✅ `http://localhost:4200` - Desarrollo local
- ✅ `https://munpa.online` - App en producción
- ✅ `https://www.munpa.online` - App con www
- ✅ `https://dash.munpa.online` - Dashboard de admin

### Métodos Permitidos

- **GET** - Leer/descargar imágenes
- **HEAD** - Verificar si existe
- **PUT** - Subir imágenes
- **POST** - Crear recursos
- **DELETE** - Eliminar imágenes

### Headers de Respuesta

- `Content-Type` - Tipo de archivo
- `Authorization` - Para autenticación
- `Content-Length` - Tamaño del archivo

### Cache

- `maxAgeSeconds: 3600` - Cache de 1 hora

---

## 🧪 Probar que Funciona

### Test 1: Desde el Navegador

1. Abre el dashboard: https://dash.munpa.online
2. Sube una imagen de categoría
3. Verifica que se muestre correctamente

### Test 2: Desde DevTools

```javascript
// Abre la consola del navegador (F12)
// Ejecuta este código:

fetch('https://storage.googleapis.com/mumpabackend.firebasestorage.app/marketplace/categories/test.png')
  .then(res => console.log('✅ CORS configurado correctamente', res))
  .catch(err => console.error('❌ CORS no configurado', err));
```

Si ves "✅ CORS configurado correctamente", todo funciona.

---

## 🔒 Seguridad

### ¿Es Seguro?

**Sí**, esta configuración es segura porque:

1. **Solo permite tus dominios específicos** - No cualquier sitio puede acceder
2. **Las reglas de Firebase siguen aplicándose** - CORS no da acceso de escritura
3. **Solo afecta al navegador** - No afecta tu backend

### Hacer Imágenes Públicas

Para que las imágenes sean accesibles **sin CORS** (públicas para todo el mundo):

**Opción A: Al subir (en el código)**

Ya está implementado en `server.js`:

```javascript
stream.on('finish', async () => {
  await file.makePublic();  // ← Hace la imagen pública
  const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;
  // ...
});
```

**Opción B: Desde Firebase Console**

1. Ve a Firebase Console → Storage
2. Click derecho en la imagen
3. Selecciona "Make public"

---

## 🚨 Solución de Problemas

### Problema 1: "gsutil: command not found"

**Solución:** Usa la Opción 1 (manual desde Firebase Console)

### Problema 2: "Permission denied"

**Solución:** 
```bash
gcloud auth login
gcloud config set project mumpabackend
```

### Problema 3: Las imágenes siguen sin cargar

**Verificar:**

1. ✅ CORS está configurado (Opción 1 o 2)
2. ✅ Las imágenes son públicas (`file.makePublic()`)
3. ✅ La URL es correcta
4. ✅ No hay errores en el servidor

**Limpiar caché del navegador:**
```
Ctrl + Shift + R (Windows)
Cmd + Shift + R (Mac)
```

### Problema 4: "Access Denied"

Las imágenes necesitan ser públicas. Verifica que al subir se llame `makePublic()`:

```javascript
// En server.js, línea ~17890
stream.on('finish', async () => {
  await file.makePublic();  // ← Esto debe estar
  // ...
});
```

---

## 📝 Configuración Actual

Tu archivo `cors-storage-config.json` ya está correcto:

```json
[
  {
    "origin": [
      "http://localhost:4200",
      "https://munpa.online",
      "https://www.munpa.online",
      "https://dash.munpa.online"
    ],
    "method": ["GET", "HEAD", "PUT", "POST", "DELETE"],
    "responseHeader": ["Content-Type", "Authorization", "Content-Length"],
    "maxAgeSeconds": 3600
  }
]
```

Solo necesitas **aplicarlo** siguiendo la Opción 1 o 2.

---

## 🎯 Resumen Rápido

### Opción A: Usar el proxy de imágenes (inmediato, sin configurar CORS)

El backend tiene un proxy que evita CORS. En tu dashboard, transforma las URLs:

```javascript
// Antes (genera error CORS)
const imageUrl = "https://storage.googleapis.com/mumpabackend.firebasestorage.app/images/recommendation/xxx.png";

// Después (usa el proxy)
const imageUrl = `https://api.munpa.online/api/storage-proxy?url=${encodeURIComponent(originalUrl)}`;
```

O crea un pipe/helper en Angular:
```typescript
transformStorageUrl(url: string): string {
  if (!url || !url.includes('storage.googleapis.com')) return url;
  return `https://api.munpa.online/api/storage-proxy?url=${encodeURIComponent(url)}`;
}
```

### Opción B: Configurar CORS en el bucket (solución definitiva)

1. Instala Google Cloud SDK: `brew install google-cloud-sdk`
2. Autentica: `gcloud auth login` y `gcloud config set project mumpabackend`
3. Aplica CORS: `gsutil cors set cors-storage-config.json gs://mumpabackend.firebasestorage.app`
4. O con gcloud: `gcloud storage buckets update gs://mumpabackend.firebasestorage.app --cors-file=cors-storage-config.json`

**¡Listo!** 🎉

---

## 💡 Agregar Más Dominios

Si en el futuro necesitas agregar más dominios:

```json
{
  "origin": [
    "http://localhost:4200",
    "https://munpa.online",
    "https://www.munpa.online",
    "https://dash.munpa.online",
    "https://nuevo-dominio.com"  // ← Agregar aquí
  ],
  // ...
}
```

Luego vuelve a aplicar la configuración.

---

## 📞 Ayuda Adicional

Si sigues teniendo problemas:

1. Verifica en Network tab (DevTools) los headers de respuesta
2. Busca el header `Access-Control-Allow-Origin`
3. Si no está presente, CORS no está configurado correctamente

---

¡Con esto deberías poder ver las imágenes sin problemas! 🖼️✨

