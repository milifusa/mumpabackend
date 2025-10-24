# 📝 Endpoints CRUD para Comunidades y Posts - Dashboard Admin

## 🏘️ COMUNIDADES

### 1. Crear Nueva Comunidad
```http
POST /api/admin/communities
```

**Headers:**
```
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json
```

**Body:**
```json
{
  "name": "Mamás Primerizas 2025",
  "description": "Comunidad para mamás que esperan su primer bebé",
  "imageUrl": "https://example.com/image.jpg",
  "isPrivate": false
}
```

**Campos:**
- `name` (requerido): Nombre de la comunidad
- `description` (opcional): Descripción de la comunidad
- `imageUrl` (opcional): URL de la imagen de la comunidad
- `isPrivate` (opcional): Si la comunidad es privada (default: false)

**Respuesta exitosa (200):**
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
    "createdBy": "user123",
    "memberCount": 1,
    "postCount": 0
  }
}
```

---

### 2. Editar Comunidad
```http
PUT /api/admin/communities/:communityId
```

**Headers:**
```
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json
```

**Body (todos los campos son opcionales):**
```json
{
  "name": "Mamás Primerizas 2025 - Actualizado",
  "description": "Nueva descripción",
  "imageUrl": "https://example.com/new-image.jpg",
  "isPrivate": true
}
```

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "message": "Comunidad actualizada exitosamente",
  "data": {
    "id": "abc123",
    "name": "Mamás Primerizas 2025 - Actualizado",
    "description": "Nueva descripción",
    "imageUrl": "https://example.com/new-image.jpg",
    "isPrivate": true
  }
}
```

**Errores:**
- `404`: Comunidad no encontrada

---

### 3. Obtener Detalle de una Comunidad (con sus posts)
```http
GET /api/admin/communities/:communityId?page=1&limit=20
```

**Headers:**
```
Authorization: Bearer {JWT_TOKEN}
```

**Query Parameters:**
- `page` (opcional): Número de página para los posts (default: 1)
- `limit` (opcional): Posts por página (default: 20)

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": {
    "community": {
      "id": "abc123",
      "name": "Mamás Primerizas 2025",
      "description": "Comunidad para mamás que esperan su primer bebé",
      "imageUrl": "https://example.com/image.jpg",
      "isPrivate": false,
      "members": ["user1", "user2", "user3"],
      "createdBy": "user123",
      "memberCount": 25,
      "postCount": 150,
      "createdAt": "2025-01-15T10:30:00.000Z",
      "updatedAt": "2025-01-20T15:45:00.000Z"
    },
    "posts": [
      {
        "id": "post123",
        "content": "¡Bienvenidas a la comunidad!",
        "imageUrl": "https://example.com/post-image.jpg",
        "authorId": "user456",
        "communityId": "abc123",
        "likes": ["user1", "user2"],
        "commentCount": 5,
        "createdAt": "2025-01-20T10:30:00.000Z",
        "updatedAt": "2025-01-20T10:30:00.000Z"
      }
    ],
    "stats": {
      "totalPosts": 150,
      "memberCount": 25
    },
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "totalPages": 8
    }
  }
}
```

**Errores:**
- `404`: Comunidad no encontrada

**Uso:**
Este endpoint es perfecto para mostrar una vista detallada de una comunidad específica en el dashboard, incluyendo todos sus posts con paginación.

---

### 4. Obtener Todas las Comunidades
```http
GET /api/admin/communities?page=1&limit=20&search=mamás
```

**Headers:**
```
Authorization: Bearer {JWT_TOKEN}
```

**Query Parameters:**
- `page` (opcional): Número de página (default: 1)
- `limit` (opcional): Resultados por página (default: 20)
- `search` (opcional): Buscar por nombre o descripción

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "abc123",
      "name": "Mamás Primerizas 2025",
      "description": "Comunidad para mamás que esperan su primer bebé",
      "imageUrl": "https://example.com/image.jpg",
      "isPrivate": false,
      "memberCount": 25,
      "postCount": 150,
      "createdAt": "2025-01-15T10:30:00.000Z",
      "updatedAt": "2025-01-20T15:45:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

---

### 5. Eliminar Comunidad
```http
DELETE /api/admin/communities/:communityId
```

**Headers:**
```
Authorization: Bearer {JWT_TOKEN}
```

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "message": "Comunidad eliminada exitosamente"
}
```

---

## 📝 POSTS

### 1. Crear Nuevo Post
```http
POST /api/admin/posts
```

**Headers:**
```
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json
```

**Body:**
```json
{
  "content": "¡Bienvenidas a la comunidad! Aquí pueden compartir sus experiencias.",
  "imageUrl": "https://example.com/post-image.jpg",
  "communityId": "abc123"
}
```

**Campos:**
- `content` (requerido): Contenido del post
- `communityId` (requerido): ID de la comunidad donde se publicará
- `imageUrl` (opcional): URL de la imagen del post

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "message": "Post creado exitosamente",
  "data": {
    "id": "post123",
    "content": "¡Bienvenidas a la comunidad! Aquí pueden compartir sus experiencias.",
    "imageUrl": "https://example.com/post-image.jpg",
    "authorId": "user123",
    "communityId": "abc123",
    "likes": [],
    "commentCount": 0
  }
}
```

**Errores:**
- `400`: Contenido o communityId faltante
- `404`: Comunidad no encontrada

---

### 2. Editar Post
```http
PUT /api/admin/posts/:postId
```

**Headers:**
```
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json
```

**Body (todos los campos son opcionales):**
```json
{
  "content": "Contenido actualizado del post",
  "imageUrl": "https://example.com/updated-image.jpg"
}
```

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "message": "Post actualizado exitosamente",
  "data": {
    "id": "post123",
    "content": "Contenido actualizado del post",
    "imageUrl": "https://example.com/updated-image.jpg",
    "authorId": "user123",
    "communityId": "abc123"
  }
}
```

**Errores:**
- `404`: Post no encontrado

---

### 3. Obtener Todos los Posts
```http
GET /api/admin/posts?page=1&limit=20
```

**Headers:**
```
Authorization: Bearer {JWT_TOKEN}
```

**Query Parameters:**
- `page` (opcional): Número de página (default: 1)
- `limit` (opcional): Resultados por página (default: 20)

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "post123",
      "content": "¡Bienvenidas a la comunidad!",
      "imageUrl": "https://example.com/post-image.jpg",
      "authorId": "user123",
      "communityId": "abc123",
      "likes": ["user1", "user2"],
      "commentCount": 5,
      "createdAt": "2025-01-20T10:30:00.000Z",
      "updatedAt": "2025-01-20T10:30:00.000Z"
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

---

### 4. Eliminar Post
```http
DELETE /api/admin/posts/:postId
```

**Headers:**
```
Authorization: Bearer {JWT_TOKEN}
```

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "message": "Post eliminado exitosamente"
}
```

---

## 🔐 Autenticación

Todos los endpoints requieren:
1. Un token JWT válido obtenido del endpoint `/api/auth/admin-login`
2. Que el usuario tenga rol de administrador (`role: 'admin'` o `isAdmin: true`)

**Ejemplo de headers:**
```javascript
headers: {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
}
```

---

## 📋 Notas Importantes

### Permisos de Administrador:
- ✅ **El administrador puede editar CUALQUIER post**, sin importar quién lo haya creado
- ✅ **El administrador puede editar CUALQUIER comunidad**, sin importar quién sea el owner
- ✅ **No hay verificación de ownership** en los endpoints de edición y eliminación del dashboard
- ✅ Todos los endpoints están protegidos por el middleware `isAdmin`

### Comunidades:
- El administrador que crea la comunidad automáticamente se convierte en el primer miembro
- Los contadores `memberCount` y `postCount` se actualizan automáticamente
- La búsqueda funciona tanto en `name` como en `description`
- El endpoint de detalle (`GET /api/admin/communities/:id`) incluye todos los posts de la comunidad con paginación

### Posts:
- Al crear un post, se incrementa automáticamente el contador `postCount` de la comunidad
- El `authorId` se toma automáticamente del usuario autenticado (admin)
- Los campos `likes` y `commentCount` se inicializan vacíos/en 0
- **El admin puede editar posts de cualquier usuario en cualquier comunidad**

### Validaciones:
- Todos los endpoints verifican que el usuario sea administrador
- Los endpoints de edición verifican que el recurso exista antes de actualizar
- Los campos opcionales solo se actualizan si se proporcionan explícitamente

---

## 🧪 Ejemplos de Uso en Angular

### Service para Comunidades:

```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CommunityService {
  private apiUrl = 'https://mumpabackend.vercel.app/api/admin/communities';

  constructor(private http: HttpClient) {}

  // Obtener todas las comunidades
  getCommunities(page: number = 1, limit: number = 20, search: string = ''): Observable<any> {
    return this.http.get(`${this.apiUrl}?page=${page}&limit=${limit}&search=${search}`);
  }

  // Crear comunidad
  createCommunity(data: { name: string; description?: string; imageUrl?: string; isPrivate?: boolean }): Observable<any> {
    return this.http.post(this.apiUrl, data);
  }

  // Editar comunidad
  updateCommunity(communityId: string, data: Partial<{ name: string; description: string; imageUrl: string; isPrivate: boolean }>): Observable<any> {
    return this.http.put(`${this.apiUrl}/${communityId}`, data);
  }

  // Eliminar comunidad
  deleteCommunity(communityId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${communityId}`);
  }
}
```

### Service para Posts:

```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PostService {
  private apiUrl = 'https://mumpabackend.vercel.app/api/admin/posts';

  constructor(private http: HttpClient) {}

  // Obtener todos los posts
  getPosts(page: number = 1, limit: number = 20): Observable<any> {
    return this.http.get(`${this.apiUrl}?page=${page}&limit=${limit}`);
  }

  // Crear post
  createPost(data: { content: string; communityId: string; imageUrl?: string }): Observable<any> {
    return this.http.post(this.apiUrl, data);
  }

  // Editar post
  updatePost(postId: string, data: Partial<{ content: string; imageUrl: string }>): Observable<any> {
    return this.http.put(`${this.apiUrl}/${postId}`, data);
  }

  // Eliminar post
  deletePost(postId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${postId}`);
  }
}
```

### Ejemplo de Componente para Crear Comunidad:

```typescript
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommunityService } from './community.service';

@Component({
  selector: 'app-create-community',
  template: `
    <div class="create-community-form">
      <h2>Crear Nueva Comunidad</h2>
      <form [formGroup]="communityForm" (ngSubmit)="onSubmit()">
        <div class="form-group">
          <label for="name">Nombre *</label>
          <input 
            type="text" 
            id="name" 
            formControlName="name" 
            placeholder="Nombre de la comunidad"
          >
        </div>

        <div class="form-group">
          <label for="description">Descripción</label>
          <textarea 
            id="description" 
            formControlName="description" 
            placeholder="Descripción de la comunidad"
          ></textarea>
        </div>

        <div class="form-group">
          <label for="imageUrl">URL de Imagen</label>
          <input 
            type="url" 
            id="imageUrl" 
            formControlName="imageUrl" 
            placeholder="https://example.com/image.jpg"
          >
        </div>

        <div class="form-group checkbox">
          <label>
            <input type="checkbox" formControlName="isPrivate">
            Comunidad Privada
          </label>
        </div>

        <button 
          type="submit" 
          [disabled]="!communityForm.valid || isLoading"
        >
          {{ isLoading ? 'Creando...' : 'Crear Comunidad' }}
        </button>
      </form>

      <div *ngIf="errorMessage" class="error-message">
        {{ errorMessage }}
      </div>

      <div *ngIf="successMessage" class="success-message">
        {{ successMessage }}
      </div>
    </div>
  `
})
export class CreateCommunityComponent {
  communityForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private fb: FormBuilder,
    private communityService: CommunityService
  ) {
    this.communityForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      imageUrl: [''],
      isPrivate: [false]
    });
  }

  onSubmit() {
    if (this.communityForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';
      this.successMessage = '';

      this.communityService.createCommunity(this.communityForm.value)
        .subscribe({
          next: (response) => {
            this.successMessage = 'Comunidad creada exitosamente';
            this.communityForm.reset({ isPrivate: false });
            this.isLoading = false;
          },
          error: (error) => {
            this.errorMessage = error.error?.message || 'Error creando comunidad';
            this.isLoading = false;
          }
        });
    }
  }
}
```

---

## ✅ Resumen de Endpoints Agregados

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/admin/communities` | Crear nueva comunidad |
| GET | `/api/admin/communities/:communityId` | ✨ **NUEVO**: Obtener detalle de comunidad con posts |
| PUT | `/api/admin/communities/:communityId` | Editar comunidad |
| GET | `/api/admin/communities` | Obtener comunidades (ya existía) |
| DELETE | `/api/admin/communities/:communityId` | Eliminar comunidad (ya existía) |
| POST | `/api/admin/posts` | Crear nuevo post |
| PUT | `/api/admin/posts/:postId` | Editar post (sin verificación de ownership) |
| GET | `/api/admin/posts` | Obtener posts (ya existía) |
| DELETE | `/api/admin/posts/:postId` | Eliminar post (ya existía) |

### 🔑 Características Clave

- ✅ **Control total del admin**: Editar/eliminar cualquier contenido
- ✅ **Sin restricciones de ownership**: El admin no necesita ser el creador
- ✅ **Vista detallada de comunidades**: Incluye posts con paginación
- ✅ **CRUD completo**: Crear, Leer, Actualizar, Eliminar

**¡Todos los endpoints están desplegados y listos para usar!** 🚀

