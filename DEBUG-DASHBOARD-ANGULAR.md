# 🐛 Debug del Dashboard Angular - Error 403

## ✅ Backend Verificado
El endpoint `/api/admin/upload/image` **funciona correctamente**. 
La autenticación JWT está operativa. ✅

## 🔍 Problema Detectado
El error 403 viene del **frontend (Angular)**, no del backend.

---

## 📋 Checklist de Debugging

### 1. Verificar que el token se guardó después del login

**Archivo: `auth.service.ts` o similar**

```typescript
login(email: string, password: string): Observable<any> {
  return this.http.post(`${this.apiUrl}/auth/admin-login`, { email, password })
    .pipe(
      tap((response: any) => {
        console.log('🔐 Respuesta del login:', response);
        
        if (response.success && response.data?.token) {
          // ✅ IMPORTANTE: Guardar el token
          localStorage.setItem('adminToken', response.data.token);
          localStorage.setItem('adminUser', JSON.stringify(response.data.user));
          console.log('✅ Token guardado:', response.data.token.substring(0, 50) + '...');
        }
      })
    );
}
```

### 2. Verificar que el interceptor envía el token

**Archivo: `auth.interceptor.ts`**

```typescript
import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Obtener token de localStorage
    const token = localStorage.getItem('adminToken');
    
    console.log('🔑 Interceptor - Token:', token ? token.substring(0, 50) + '...' : 'NO TOKEN');
    
    if (token) {
      // ✅ Clonar request y agregar header Authorization
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
      console.log('✅ Header Authorization agregado');
    } else {
      console.warn('⚠️ No se encontró token en localStorage');
    }
    
    return next.handle(request);
  }
}
```

**IMPORTANTE:** Asegúrate de que el interceptor esté registrado en `app.module.ts` o `app.config.ts`:

```typescript
// En app.module.ts (Angular 14-)
providers: [
  {
    provide: HTTP_INTERCEPTORS,
    useClass: AuthInterceptor,
    multi: true
  }
]

// En app.config.ts (Angular 15+)
export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(withInterceptors([authInterceptor]))
  ]
};
```

### 3. Verificar en el navegador (DevTools)

1. Abre **DevTools** (F12)
2. Ve a la pestaña **Network**
3. Intenta subir una imagen
4. Click en la petición `upload/image`
5. Ve a **Headers** → **Request Headers**
6. Verifica que exista: `Authorization: Bearer eyJhbGc...`

**Si NO ves el header Authorization:**
- ❌ El interceptor no está funcionando
- ❌ El token no se guardó en localStorage

**Si ves el header pero sigue dando 403:**
- ❌ El token podría estar expirado (válido 7 días)
- ❌ Haz logout y login nuevamente

### 4. Verificar el formato del FormData

**Archivo: `upload.service.ts` o similar**

```typescript
uploadImage(file: File, type: string = 'list'): Observable<any> {
  const formData = new FormData();
  formData.append('image', file);  // ✅ DEBE llamarse 'image', no 'file'
  formData.append('type', type);
  
  console.log('📤 Subiendo imagen:', file.name, 'tipo:', type);
  
  // ⚠️ NO especificar Content-Type para FormData (se agrega automáticamente)
  return this.http.post(`${this.apiUrl}/admin/upload/image`, formData);
}
```

---

## 🧪 Test Rápido en la Consola del Navegador

Abre la consola del navegador y ejecuta:

```javascript
// 1. Ver el token guardado
const token = localStorage.getItem('adminToken');
console.log('Token:', token);

// 2. Verificar que sea válido (no expirado)
if (token) {
  const payload = JSON.parse(atob(token.split('.')[1]));
  console.log('Token payload:', payload);
  console.log('Expira:', new Date(payload.exp * 1000));
  console.log('¿Expirado?', Date.now() > payload.exp * 1000);
}

// 3. Test manual de upload (sin archivo)
fetch('https://mumpabackend.vercel.app/api/admin/upload/image', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ type: 'test' })
})
.then(r => r.json())
.then(data => console.log('Respuesta:', data))
.catch(err => console.error('Error:', err));
```

**Resultado esperado:**
```json
{
  "success": false,
  "message": "No se proporcionó ninguna imagen"
}
```

Si recibes esto, ✅ **la autenticación funciona**.

---

## 🔧 Soluciones Rápidas

### Solución 1: Token expirado
```typescript
// Haz logout y login nuevamente
localStorage.removeItem('adminToken');
localStorage.removeItem('adminUser');
// Luego login nuevamente
```

### Solución 2: Interceptor no registrado
Verifica que el interceptor esté en `app.module.ts` o `app.config.ts`

### Solución 3: Token mal guardado
```typescript
// Después del login, verifica en consola:
console.log('Token guardado:', localStorage.getItem('adminToken'));
```

### Solución 4: Nombre del campo incorrecto
```typescript
// En el FormData, DEBE ser 'image', no 'file' o 'photo'
formData.append('image', file);
```

---

## 📞 ¿Sigue sin funcionar?

Envíame:
1. El código de tu `auth.service.ts` (función login)
2. El código de tu interceptor (si lo tienes)
3. Una captura del Network tab mostrando los headers de la petición
4. El resultado de ejecutar el test en la consola del navegador

---

## ✅ Resumen

El backend está 100% funcional. El problema está en el frontend:
- Token no se guarda correctamente
- Token no se envía en el header
- Token expiró
- Interceptor no está configurado
- Campo del FormData tiene nombre incorrecto

**Verifica el interceptor primero.** 🎯

