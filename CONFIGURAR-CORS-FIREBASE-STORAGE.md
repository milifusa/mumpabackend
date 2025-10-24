# 🔧 Configurar CORS en Firebase Storage

## ❌ Problema
```
Access to image at 'https://firebasestorage.googleapis.com/...' from origin 'http://localhost:4200' 
has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

Este error ocurre porque Firebase Storage tiene su propia configuración de CORS independiente del backend Express.

---

## ✅ Solución 1: Configuración Manual (Recomendada)

### Paso 1: Ir a Google Cloud Console

1. Abre: https://console.cloud.google.com/storage/browser?project=mumpabackend
2. Busca el bucket: `mumpabackend.appspot.com` o `mumpabackend.firebasestorage.app`
3. Haz clic en los **3 puntos verticales (⋮)** al lado del nombre del bucket
4. Selecciona **"Edit CORS configuration"**

### Paso 2: Agregar Configuración CORS

Pega esta configuración JSON:

```json
[
  {
    "origin": [
      "http://localhost:4200",
      "https://mumpa.online",
      "https://www.mumpa.online"
    ],
    "method": ["GET", "HEAD", "PUT", "POST", "DELETE"],
    "responseHeader": ["Content-Type", "Authorization"],
    "maxAgeSeconds": 3600
  }
]
```

### Paso 3: Guardar

Los cambios se aplican inmediatamente.

---

## ✅ Solución 2: Con gsutil (Línea de Comandos)

### Paso 1: Instalar Google Cloud SDK

```bash
# macOS con Homebrew
brew install google-cloud-sdk

# O descarga desde:
# https://cloud.google.com/sdk/docs/install
```

### Paso 2: Autenticar

```bash
gcloud auth login
gcloud config set project mumpabackend
```

### Paso 3: Crear archivo de configuración

Crea un archivo `cors-config.json`:

```json
[
  {
    "origin": [
      "http://localhost:4200",
      "https://mumpa.online",
      "https://www.mumpa.online"
    ],
    "method": ["GET", "HEAD", "PUT", "POST", "DELETE"],
    "responseHeader": ["Content-Type", "Authorization"],
    "maxAgeSeconds": 3600
  }
]
```

### Paso 4: Aplicar la configuración

```bash
gsutil cors set cors-config.json gs://mumpabackend.appspot.com
```

---

## ✅ Solución 3: Verificar Reglas de Seguridad

Asegúrate de que las reglas de Firebase Storage permitan lectura pública:

1. Ve a: https://console.firebase.google.com/project/mumpabackend/storage/rules
2. Configura las reglas:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      // Permitir lectura pública para todas las imágenes
      allow read: if true;
      
      // Solo usuarios autenticados pueden escribir
      allow write: if request.auth != null;
    }
  }
}
```

3. Haz clic en **"Publicar"** o **"Publish"**

---

## 🔍 Verificar que CORS está Configurado

### Con curl:

```bash
curl -H "Origin: http://localhost:4200" \
  -H "Access-Control-Request-Method: GET" \
  -X OPTIONS \
  "https://firebasestorage.googleapis.com/v0/b/mumpabackend.appspot.com/o/test.jpg?alt=media" \
  -v
```

Deberías ver en la respuesta:
```
Access-Control-Allow-Origin: http://localhost:4200
```

### Desde el navegador:

Abre la consola de desarrollo (F12) y ejecuta:

```javascript
fetch('https://firebasestorage.googleapis.com/v0/b/mumpabackend.firebasestorage.app/o/tu-imagen.jpg?alt=media', {
  method: 'GET',
  mode: 'cors'
})
  .then(res => console.log('✅ CORS configurado correctamente'))
  .catch(err => console.error('❌ Error CORS:', err));
```

---

## 🎯 Solución Temporal para Desarrollo

Si necesitas una solución rápida mientras configuras CORS, usa Firebase SDK en Angular:

### Instalar Firebase en Angular:

```bash
npm install firebase
```

### Configurar Firebase en tu proyecto:

```typescript
// src/environments/environment.ts
export const environment = {
  firebase: {
    apiKey: "tu-api-key",
    authDomain: "mumpabackend.firebaseapp.com",
    projectId: "mumpabackend",
    storageBucket: "mumpabackend.appspot.com",
    messagingSenderId: "tu-sender-id",
    appId: "tu-app-id"
  }
};
```

### Servicio para cargar imágenes:

```typescript
import { Injectable } from '@angular/core';
import { getStorage, ref, getDownloadURL } from 'firebase/storage';
import { initializeApp } from 'firebase/app';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ImageService {
  private storage;

  constructor() {
    const app = initializeApp(environment.firebase);
    this.storage = getStorage(app);
  }

  async getImageUrl(path: string): Promise<string> {
    const imageRef = ref(this.storage, path);
    return await getDownloadURL(imageRef);
  }
}
```

### Usar en tu componente:

```typescript
export class CommunityComponent {
  imageUrl: string = '';

  constructor(private imageService: ImageService) {}

  async loadImage(firebaseUrl: string) {
    // Extraer el path de la URL de Firebase
    const path = this.extractPathFromUrl(firebaseUrl);
    this.imageUrl = await this.imageService.getImageUrl(path);
  }

  extractPathFromUrl(url: string): string {
    // https://firebasestorage.googleapis.com/v0/b/bucket/o/path%2Fto%2Ffile.jpg?alt=media
    const match = url.match(/\/o\/(.+?)\?/);
    return match ? decodeURIComponent(match[1]) : '';
  }
}
```

---

## 📋 Configuración Completa de CORS (Producción)

Para producción, agrega todos tus dominios:

```json
[
  {
    "origin": [
      "http://localhost:4200",
      "http://localhost:4000",
      "https://mumpa.online",
      "https://www.mumpa.online",
      "https://dashboard.mumpa.online"
    ],
    "method": ["GET", "HEAD", "PUT", "POST", "DELETE"],
    "responseHeader": [
      "Content-Type",
      "Authorization",
      "Content-Length",
      "User-Agent",
      "X-Requested-With"
    ],
    "maxAgeSeconds": 3600
  }
]
```

---

## 🚨 Troubleshooting

### Error persiste después de configurar CORS

1. **Limpia la caché del navegador**: Presiona `Ctrl+Shift+Delete` o `Cmd+Shift+Delete`
2. **Reinicia el servidor Angular**: `ng serve --port 4200`
3. **Verifica que la URL del origin sea exacta**: `http://localhost:4200` (sin barra final)
4. **Espera 5-10 minutos**: Los cambios de CORS pueden tardar en propagarse

### "gsutil: command not found"

Instala Google Cloud SDK:
```bash
brew install google-cloud-sdk
```

O descarga desde: https://cloud.google.com/sdk/docs/install

### No tienes permisos en Google Cloud Console

Asegúrate de estar autenticado con la cuenta correcta que tiene permisos de administrador en el proyecto Firebase.

---

## ✅ Checklist

- [ ] Configurar CORS en Google Cloud Console o con gsutil
- [ ] Verificar reglas de seguridad en Firebase Storage
- [ ] Agregar todos los dominios necesarios (desarrollo y producción)
- [ ] Limpiar caché del navegador
- [ ] Probar con curl o desde el navegador
- [ ] Documentar los dominios permitidos para el equipo

---

## 📚 Referencias

- [Firebase Storage CORS Configuration](https://firebase.google.com/docs/storage/web/download-files#cors_configuration)
- [Google Cloud Storage CORS](https://cloud.google.com/storage/docs/configuring-cors)
- [gsutil cors command](https://cloud.google.com/storage/docs/gsutil/commands/cors)

**¡Una vez configurado, las imágenes cargarán sin problemas desde tu dashboard Angular! 🎉**

