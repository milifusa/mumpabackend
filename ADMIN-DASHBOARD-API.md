# 👑 API del Munpa Dashboard de Administración

## 📋 Tabla de Contenidos

1. [Autenticación](#autenticación)
2. [Estadísticas](#estadísticas)
3. [Gestión de Usuarios](#gestión-de-usuarios)
4. [Gestión de Hijos](#gestión-de-hijos) ✨ **¡NUEVO!**
5. [Gestión de Comunidades](#gestión-de-comunidades) ✨ **¡Con CREATE y UPDATE!**
6. [Gestión de Posts](#gestión-de-posts) ✨ **¡Con CREATE y UPDATE!**
7. [Gestión de Listas](#gestión-de-listas)
8. [Cómo Hacer un Usuario Admin](#cómo-hacer-un-usuario-admin)

> 📝 **Documentación detallada:**
> - [ADMIN-CRUD-COMUNIDADES-POSTS.md](./ADMIN-CRUD-COMUNIDADES-POSTS.md) - Crear y editar comunidades y posts
> - [ADMIN-GESTION-HIJOS.md](./ADMIN-GESTION-HIJOS.md) - ✨ **NUEVO**: Gestión completa de hijos

---

## 🔐 Autenticación

Todos los endpoints requieren:
1. **Token JWT** en el header `Authorization: Bearer TOKEN`
2. **Rol de administrador** (`role: 'admin'` o `isAdmin: true` en Firestore)

```typescript
// Angular Service
import { HttpHeaders } from '@angular/common/http';

getHeaders(): HttpHeaders {
  const token = localStorage.getItem('authToken');
  return new HttpHeaders({
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  });
}
```

---

## 📊 Estadísticas

### GET `/api/admin/stats`

Obtiene estadísticas generales del sistema.

**Response:**
```json
{
  "success": true,
  "data": {
    "users": {
      "total": 150,
      "active": 120,
      "inactive": 30
    },
    "children": {
      "total": 180
    },
    "communities": {
      "total": 25
    },
    "posts": {
      "total": 450,
      "lastWeek": 35
    },
    "lists": {
      "total": 60
    }
  }
}
```

**Código Angular:**
```typescript
// admin.service.ts
getStats(): Observable<any> {
  return this.http.get(`${this.API_URL}/api/admin/stats`, {
    headers: this.getHeaders()
  });
}

// dashboard.component.ts
ngOnInit() {
  this.adminService.getStats().subscribe({
    next: (response) => {
      this.stats = response.data;
    },
    error: (error) => console.error('Error:', error)
  });
}
```

---

## 👥 Gestión de Usuarios

### GET `/api/admin/users`

Obtiene lista de usuarios con paginación y búsqueda.

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 20)
- `search` (string, opcional)
- `orderBy` (string, default: 'createdAt')
- `order` ('asc' | 'desc', default: 'desc')

**Example:**
```
GET /api/admin/users?page=1&limit=20&search=maria&orderBy=email&order=asc
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "user-id-123",
      "email": "maria@example.com",
      "displayName": "María García",
      "photoURL": "https://...",
      "isActive": true,
      "role": "user",
      "childrenCount": 2,
      "createdAt": "2025-01-15T10:30:00.000Z",
      "updatedAt": "2025-01-20T15:45:00.000Z",
      "lastLoginAt": "2025-01-22T08:20:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

**Código Angular:**
```typescript
getUsers(page: number = 1, limit: number = 20, search: string = ''): Observable<any> {
  const params = new HttpParams()
    .set('page', page.toString())
    .set('limit', limit.toString())
    .set('search', search);
    
  return this.http.get(`${this.API_URL}/api/admin/users`, {
    headers: this.getHeaders(),
    params: params
  });
}
```

---

### GET `/api/admin/users/:userId`

Obtiene detalle completo de un usuario específico.

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-id-123",
      "email": "maria@example.com",
      "displayName": "María García",
      // ... otros campos
    },
    "children": [
      {
        "id": "child-id-1",
        "name": "Sofía",
        "ageInMonths": 24
      }
    ],
    "communities": [
      {
        "id": "comm-id-1",
        "name": "Mamás Primerizas"
      }
    ],
    "posts": [
      // últimos 10 posts
    ],
    "stats": {
      "childrenCount": 2,
      "communitiesCount": 3,
      "postsCount": 15
    }
  }
}
```

**Código Angular:**
```typescript
getUserDetail(userId: string): Observable<any> {
  return this.http.get(`${this.API_URL}/api/admin/users/${userId}`, {
    headers: this.getHeaders()
  });
}
```

---

### PUT `/api/admin/users/:userId`

Actualiza información de un usuario.

**Request Body:**
```json
{
  "displayName": "Nuevo Nombre",
  "email": "nuevo@email.com",
  "isPregnant": true,
  "gestationWeeks": 12,
  "gender": "female",
  "isActive": true,
  "role": "admin"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Usuario actualizado exitosamente",
  "data": {
    "id": "user-id-123",
    // ... campos actualizados
  }
}
```

**Código Angular:**
```typescript
updateUser(userId: string, data: any): Observable<any> {
  return this.http.put(`${this.API_URL}/api/admin/users/${userId}`, data, {
    headers: this.getHeaders()
  });
}
```

---

### PATCH `/api/admin/users/:userId/toggle-active`

Activa o desactiva un usuario.

**Response:**
```json
{
  "success": true,
  "message": "Usuario desactivado exitosamente",
  "data": {
    "isActive": false
  }
}
```

**Código Angular:**
```typescript
toggleUserActive(userId: string): Observable<any> {
  return this.http.patch(
    `${this.API_URL}/api/admin/users/${userId}/toggle-active`, 
    {}, 
    { headers: this.getHeaders() }
  );
}
```

---

### DELETE `/api/admin/users/:userId`

Elimina un usuario (soft delete por defecto, permanente con query param).

**Query Parameters:**
- `permanent` (boolean, opcional): Si es `true`, elimina permanentemente

**Examples:**
```
DELETE /api/admin/users/user-id-123           # Soft delete
DELETE /api/admin/users/user-id-123?permanent=true  # Permanente
```

**Response:**
```json
{
  "success": true,
  "message": "Usuario desactivado (soft delete)"
}
```

**Código Angular:**
```typescript
deleteUser(userId: string, permanent: boolean = false): Observable<any> {
  const params = permanent ? new HttpParams().set('permanent', 'true') : new HttpParams();
  
  return this.http.delete(`${this.API_URL}/api/admin/users/${userId}`, {
    headers: this.getHeaders(),
    params: params
  });
}
```

---

## 👶 Gestión de Hijos

El dashboard permite gestionar los perfiles de hijos de todos los usuarios.

### GET `/api/admin/children`

Obtiene todos los hijos registrados en la plataforma.

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 20)
- `search` (string, opcional): Buscar por nombre o ID del padre

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "child123",
      "parentId": "user456",
      "name": "Sofía García",
      "ageInMonths": 8,
      "gestationWeeks": null,
      "isUnborn": false,
      "photoUrl": "https://...",
      "createdAt": "2025-01-10T10:30:00.000Z",
      "updatedAt": "2025-01-15T14:20:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 156,
    "totalPages": 8
  }
}
```

---

### PUT `/api/admin/children/:childId`

Edita la información de cualquier hijo (sin restricciones de ownership).

**Body:**
```json
{
  "name": "Sofía María García",
  "ageInMonths": 9,
  "isUnborn": false,
  "photoUrl": "https://..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Hijo actualizado exitosamente",
  "data": { ... }
}
```

---

### DELETE `/api/admin/children/:childId`

Elimina permanentemente el perfil de un hijo.

**Response:**
```json
{
  "success": true,
  "message": "Hijo eliminado exitosamente"
}
```

> 📚 **Documentación completa**: [ADMIN-GESTION-HIJOS.md](./ADMIN-GESTION-HIJOS.md)

---

## 🏘️ Gestión de Comunidades

### GET `/api/admin/communities`

Obtiene todas las comunidades con paginación.

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 20)
- `search` (string, opcional)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "comm-id-123",
      "name": "Mamás Primerizas",
      "description": "Comunidad para mamás primerizas",
      "imageUrl": "https://...",
      "isPublic": true,
      "creatorId": "user-id-123",
      "members": ["user-id-1", "user-id-2"],
      "memberCount": 45,
      "createdAt": "2025-01-10T12:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 25,
    "totalPages": 2
  }
}
```

**Código Angular:**
```typescript
getCommunities(page: number = 1, limit: number = 20, search: string = ''): Observable<any> {
  const params = new HttpParams()
    .set('page', page.toString())
    .set('limit', limit.toString())
    .set('search', search);
    
  return this.http.get(`${this.API_URL}/api/admin/communities`, {
    headers: this.getHeaders(),
    params: params
  });
}
```

---

### POST `/api/admin/communities` ✨ **NUEVO**

Crea una nueva comunidad.

**Body:**
```json
{
  "name": "Mamás Primerizas 2025",
  "description": "Comunidad para mamás que esperan su primer bebé",
  "imageUrl": "https://example.com/image.jpg",
  "isPrivate": false
}
```

**Response:**
```json
{
  "success": true,
  "message": "Comunidad creada exitosamente",
  "data": {
    "id": "abc123",
    "name": "Mamás Primerizas 2025",
    "description": "Comunidad para mamás que esperan su primer bebé",
    "imageUrl": "https://example.com/image.jpg",
    "isPrivate": false,
    "members": ["user123"],
    "memberCount": 1,
    "postCount": 0
  }
}
```

---

### PUT `/api/admin/communities/:communityId` ✨ **NUEVO**

Edita una comunidad existente.

**Body (todos los campos son opcionales):**
```json
{
  "name": "Nuevo nombre",
  "description": "Nueva descripción",
  "imageUrl": "https://example.com/new-image.jpg",
  "isPrivate": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Comunidad actualizada exitosamente",
  "data": {
    "id": "abc123",
    "name": "Nuevo nombre",
    "description": "Nueva descripción"
  }
}
```

---

### DELETE `/api/admin/communities/:communityId`

Elimina una comunidad permanentemente.

**Response:**
```json
{
  "success": true,
  "message": "Comunidad eliminada exitosamente"
}
```

**Código Angular:**
```typescript
deleteCommunity(communityId: string): Observable<any> {
  return this.http.delete(`${this.API_URL}/api/admin/communities/${communityId}`, {
    headers: this.getHeaders()
  });
}
```

---

## 📝 Gestión de Posts

### GET `/api/admin/posts`

Obtiene todos los posts con paginación.

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 20)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "post-id-123",
      "communityId": "comm-id-123",
      "authorId": "user-id-123",
      "content": "Contenido del post...",
      "imageUrl": "https://...",
      "likes": ["user-id-1", "user-id-2"],
      "likeCount": 2,
      "commentCount": 5,
      "createdAt": "2025-01-22T14:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 450,
    "totalPages": 23
  }
}
```

**Código Angular:**
```typescript
getPosts(page: number = 1, limit: number = 20): Observable<any> {
  const params = new HttpParams()
    .set('page', page.toString())
    .set('limit', limit.toString());
    
  return this.http.get(`${this.API_URL}/api/admin/posts`, {
    headers: this.getHeaders(),
    params: params
  });
}
```

---

### POST `/api/admin/posts` ✨ **NUEVO**

Crea un nuevo post en una comunidad.

**Body:**
```json
{
  "content": "¡Bienvenidas a la comunidad! Aquí pueden compartir sus experiencias.",
  "imageUrl": "https://example.com/post-image.jpg",
  "communityId": "abc123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Post creado exitosamente",
  "data": {
    "id": "post123",
    "content": "¡Bienvenidas a la comunidad!",
    "imageUrl": "https://example.com/post-image.jpg",
    "authorId": "user123",
    "communityId": "abc123",
    "likes": [],
    "commentCount": 0
  }
}
```

---

### PUT `/api/admin/posts/:postId` ✨ **NUEVO**

Edita un post existente.

**Body (todos los campos son opcionales):**
```json
{
  "content": "Contenido actualizado del post",
  "imageUrl": "https://example.com/updated-image.jpg"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Post actualizado exitosamente",
  "data": {
    "id": "post123",
    "content": "Contenido actualizado del post",
    "imageUrl": "https://example.com/updated-image.jpg"
  }
}
```

---

### DELETE `/api/admin/posts/:postId`

Elimina un post permanentemente.

**Response:**
```json
{
  "success": true,
  "message": "Post eliminado exitosamente"
}
```

**Código Angular:**
```typescript
deletePost(postId: string): Observable<any> {
  return this.http.delete(`${this.API_URL}/api/admin/posts/${postId}`, {
    headers: this.getHeaders()
  });
}
```

---

## 📋 Gestión de Listas

### GET `/api/admin/lists`

Obtiene todas las listas con paginación.

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 20)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "list-id-123",
      "title": "Lista del Hospital",
      "description": "Cosas para llevar al hospital",
      "userId": "user-id-123",
      "isPublic": true,
      "items": [
        {
          "text": "Pañales",
          "completed": false
        }
      ],
      "createdAt": "2025-01-18T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 60,
    "totalPages": 3
  }
}
```

**Código Angular:**
```typescript
getLists(page: number = 1, limit: number = 20): Observable<any> {
  const params = new HttpParams()
    .set('page', page.toString())
    .set('limit', limit.toString());
    
  return this.http.get(`${this.API_URL}/api/admin/lists`, {
    headers: this.getHeaders(),
    params: params
  });
}
```

---

## 🔑 Cómo Hacer un Usuario Admin

Para hacer a un usuario administrador, debes actualizar su documento en Firestore:

### Opción 1: Desde Firebase Console

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto
3. Ve a **Firestore Database**
4. Busca la colección `users`
5. Encuentra el documento del usuario
6. Agrega o edita el campo:
   - `role`: `"admin"` (string)
   - O `isAdmin`: `true` (boolean)

### Opción 2: Desde código (primera vez)

Crea un endpoint temporal o un script:

```javascript
// Script para hacer admin al primer usuario
const admin = require('firebase-admin');

async function makeAdmin(email) {
  const db = admin.firestore();
  
  // Buscar usuario por email
  const usersSnapshot = await db.collection('users')
    .where('email', '==', email)
    .limit(1)
    .get();
  
  if (usersSnapshot.empty) {
    console.log('Usuario no encontrado');
    return;
  }
  
  const userDoc = usersSnapshot.docs[0];
  
  // Actualizar a admin
  await db.collection('users').doc(userDoc.id).update({
    role: 'admin',
    isAdmin: true,
    updatedAt: new Date()
  });
  
  console.log('✅ Usuario es ahora admin');
}

// Usar:
makeAdmin('tu-email@ejemplo.com');
```

---

## 📦 Servicio Completo de Angular

```typescript
// admin.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private API_URL = 'https://mumpabackend.vercel.app';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('authToken');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  // Estadísticas
  getStats(): Observable<any> {
    return this.http.get(`${this.API_URL}/api/admin/stats`, {
      headers: this.getHeaders()
    });
  }

  // Usuarios
  getUsers(page: number = 1, limit: number = 20, search: string = ''): Observable<any> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString())
      .set('search', search);
    return this.http.get(`${this.API_URL}/api/admin/users`, {
      headers: this.getHeaders(),
      params: params
    });
  }

  getUserDetail(userId: string): Observable<any> {
    return this.http.get(`${this.API_URL}/api/admin/users/${userId}`, {
      headers: this.getHeaders()
    });
  }

  updateUser(userId: string, data: any): Observable<any> {
    return this.http.put(`${this.API_URL}/api/admin/users/${userId}`, data, {
      headers: this.getHeaders()
    });
  }

  toggleUserActive(userId: string): Observable<any> {
    return this.http.patch(
      `${this.API_URL}/api/admin/users/${userId}/toggle-active`,
      {},
      { headers: this.getHeaders() }
    );
  }

  deleteUser(userId: string, permanent: boolean = false): Observable<any> {
    const params = permanent ? new HttpParams().set('permanent', 'true') : new HttpParams();
    return this.http.delete(`${this.API_URL}/api/admin/users/${userId}`, {
      headers: this.getHeaders(),
      params: params
    });
  }

  // Comunidades
  getCommunities(page: number = 1, limit: number = 20, search: string = ''): Observable<any> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString())
      .set('search', search);
    return this.http.get(`${this.API_URL}/api/admin/communities`, {
      headers: this.getHeaders(),
      params: params
    });
  }

  deleteCommunity(communityId: string): Observable<any> {
    return this.http.delete(`${this.API_URL}/api/admin/communities/${communityId}`, {
      headers: this.getHeaders()
    });
  }

  // Posts
  getPosts(page: number = 1, limit: number = 20): Observable<any> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    return this.http.get(`${this.API_URL}/api/admin/posts`, {
      headers: this.getHeaders(),
      params: params
    });
  }

  deletePost(postId: string): Observable<any> {
    return this.http.delete(`${this.API_URL}/api/admin/posts/${postId}`, {
      headers: this.getHeaders()
    });
  }

  // Listas
  getLists(page: number = 1, limit: number = 20): Observable<any> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    return this.http.get(`${this.API_URL}/api/admin/lists`, {
      headers: this.getHeaders(),
      params: params
    });
  }
}
```

---

## 🛡️ Manejo de Errores

```typescript
// error-handler.service.ts
handleError(error: any): string {
  if (error.status === 403) {
    return 'No tienes permisos de administrador';
  } else if (error.status === 401) {
    return 'Sesión expirada. Por favor inicia sesión nuevamente';
  } else if (error.status === 404) {
    return 'Recurso no encontrado';
  } else {
    return error.error?.message || 'Error desconocido';
  }
}
```

---

## ✅ Checklist de Implementación

- [ ] Crear servicio `AdminService` en Angular
- [ ] Implementar guard de autenticación admin
- [ ] Crear componente de dashboard con estadísticas
- [ ] Crear tabla de usuarios con paginación
- [ ] Implementar búsqueda de usuarios
- [ ] Crear modal/página de detalle de usuario
- [ ] Implementar botones de activar/desactivar
- [ ] Implementar eliminación con confirmación
- [ ] Crear tablas para comunidades, posts y listas
- [ ] Hacer admin al primer usuario en Firestore

---

**¡Tu dashboard de administración está listo para usar! 🎉**

