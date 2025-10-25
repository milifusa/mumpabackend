# 📂 API de Categorías - Munpa

Sistema completo de gestión de categorías con endpoints para la app móvil (solo lectura) y el dashboard admin (CRUD completo).

---

## 📱 ENDPOINTS PARA LA APP (Solo Lectura)

### 1. Obtener todas las categorías activas

**GET** `/api/categories`

Obtiene todas las categorías activas ordenadas por `order`.

**Headers:**
```
Authorization: Bearer {token}
```

**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "id": "cat123",
      "name": "Embarazo",
      "description": "Todo sobre el embarazo",
      "imageUrl": "https://...",
      "icon": "pregnant-woman",
      "order": 0
    },
    {
      "id": "cat456",
      "name": "Bebés",
      "description": "Cuidado del bebé",
      "imageUrl": "https://...",
      "icon": "baby",
      "order": 1
    }
  ]
}
```

### 2. Obtener una categoría específica

**GET** `/api/categories/:categoryId`

Obtiene los detalles de una categoría activa.

**Headers:**
```
Authorization: Bearer {token}
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "id": "cat123",
    "name": "Embarazo",
    "description": "Todo sobre el embarazo",
    "imageUrl": "https://...",
    "icon": "pregnant-woman",
    "order": 0
  }
}
```

---

## 🔐 ENDPOINTS ADMIN (CRUD Completo)

### 1. Obtener todas las categorías (Admin)

**GET** `/api/admin/categories`

**Headers:**
```
Authorization: Bearer {admin-jwt-token}
```

**Query Params:**
- `page` (opcional, default: 1): Número de página
- `limit` (opcional, default: 20): Elementos por página
- `search` (opcional): Buscar por nombre o descripción

**Ejemplo:**
```
GET /api/admin/categories?page=1&limit=10&search=embarazo
```

**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "id": "cat123",
      "name": "Embarazo",
      "description": "Todo sobre el embarazo",
      "imageUrl": "https://...",
      "icon": "pregnant-woman",
      "order": 0,
      "isActive": true,
      "createdAt": "2025-01-20T...",
      "updatedAt": "2025-01-20T..."
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 15,
    "totalPages": 2
  }
}
```

### 2. Obtener una categoría específica (Admin)

**GET** `/api/admin/categories/:categoryId`

**Headers:**
```
Authorization: Bearer {admin-jwt-token}
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "id": "cat123",
    "name": "Embarazo",
    "description": "Todo sobre el embarazo",
    "imageUrl": "https://...",
    "icon": "pregnant-woman",
    "order": 0,
    "isActive": true,
    "createdAt": "2025-01-20T...",
    "updatedAt": "2025-01-20T..."
  }
}
```

### 3. Crear nueva categoría (Admin)

**POST** `/api/admin/categories`

**Headers:**
```
Authorization: Bearer {admin-jwt-token}
Content-Type: application/json
```

**Body:**
```json
{
  "name": "Embarazo",
  "description": "Todo sobre el embarazo y maternidad",
  "imageUrl": "https://storage.googleapis.com/.../imagen.jpg",
  "icon": "pregnant-woman",
  "order": 0,
  "isActive": true
}
```

**Campos:**
- `name` (requerido): Nombre de la categoría
- `description` (opcional): Descripción de la categoría
- `imageUrl` (opcional): URL de la imagen
- `icon` (opcional): Nombre del icono
- `order` (opcional): Orden de visualización (si no se proporciona, se asigna automáticamente)
- `isActive` (opcional, default: true): Si está activa

**Respuesta:**
```json
{
  "success": true,
  "message": "Categoría creada exitosamente",
  "data": {
    "id": "cat123",
    "name": "Embarazo",
    "description": "Todo sobre el embarazo y maternidad",
    "imageUrl": "https://...",
    "icon": "pregnant-woman",
    "order": 0,
    "isActive": true,
    "createdAt": "2025-01-20T...",
    "updatedAt": "2025-01-20T..."
  }
}
```

### 4. Actualizar categoría (Admin)

**PUT** `/api/admin/categories/:categoryId`

**Headers:**
```
Authorization: Bearer {admin-jwt-token}
Content-Type: application/json
```

**Body:**
```json
{
  "name": "Embarazo y Parto",
  "description": "Actualizada",
  "imageUrl": "https://nueva-imagen.jpg",
  "icon": "baby-carriage",
  "order": 1,
  "isActive": false
}
```

**Nota:** Todos los campos son opcionales. Solo se actualizarán los campos enviados.

**Respuesta:**
```json
{
  "success": true,
  "message": "Categoría actualizada exitosamente",
  "data": {
    "id": "cat123",
    "name": "Embarazo y Parto",
    "description": "Actualizada",
    "imageUrl": "https://nueva-imagen.jpg",
    "icon": "baby-carriage",
    "order": 1,
    "isActive": false,
    "createdAt": "2025-01-20T...",
    "updatedAt": "2025-01-20T..."
  }
}
```

### 5. Eliminar categoría (Admin)

**DELETE** `/api/admin/categories/:categoryId`

**Headers:**
```
Authorization: Bearer {admin-jwt-token}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Categoría eliminada exitosamente"
}
```

### 6. Reordenar categorías (Admin)

**PATCH** `/api/admin/categories/reorder`

Actualiza el orden de múltiples categorías de una vez.

**Headers:**
```
Authorization: Bearer {admin-jwt-token}
Content-Type: application/json
```

**Body:**
```json
{
  "categories": [
    { "id": "cat123", "order": 0 },
    { "id": "cat456", "order": 1 },
    { "id": "cat789", "order": 2 }
  ]
}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Categorías reordenadas exitosamente"
}
```

---

## 📊 Estructura de Datos en Firestore

**Colección:** `categories`

**Documento:**
```json
{
  "name": "Embarazo",
  "description": "Todo sobre el embarazo y maternidad",
  "imageUrl": "https://storage.googleapis.com/.../imagen.jpg",
  "icon": "pregnant-woman",
  "order": 0,
  "isActive": true,
  "createdAt": Timestamp,
  "updatedAt": Timestamp
}
```

**Índices requeridos en Firestore:**
- `isActive` (Ascending) + `order` (Ascending) - Para las consultas de la app

---

## 🎨 Ejemplo de Uso en React Native

```typescript
// services/categoryService.ts
import api from './api';

export const categoryService = {
  // Obtener todas las categorías (APP)
  getCategories: async () => {
    const response = await api.get('/api/categories');
    return response.data;
  },

  // Obtener una categoría específica (APP)
  getCategory: async (categoryId: string) => {
    const response = await api.get(`/api/categories/${categoryId}`);
    return response.data;
  }
};
```

**Componente de ejemplo:**
```tsx
import React, { useEffect, useState } from 'react';
import { View, Text, Image, FlatList, TouchableOpacity } from 'react-native';
import { categoryService } from '../services/categoryService';

const CategoriesScreen = ({ navigation }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await categoryService.getCategories();
      setCategories(response.data);
    } catch (error) {
      console.error('Error cargando categorías:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderCategory = ({ item }) => (
    <TouchableOpacity 
      style={styles.categoryCard}
      onPress={() => navigation.navigate('CategoryDetail', { categoryId: item.id })}
    >
      {item.imageUrl && (
        <Image 
          source={{ uri: item.imageUrl }} 
          style={styles.categoryImage}
        />
      )}
      <Text style={styles.categoryName}>{item.name}</Text>
      <Text style={styles.categoryDescription}>{item.description}</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return <Text>Cargando categorías...</Text>;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={categories}
        renderItem={renderCategory}
        keyExtractor={(item) => item.id}
        numColumns={2}
      />
    </View>
  );
};
```

---

## 💻 Ejemplo de Uso en Angular (Dashboard Admin)

```typescript
// services/admin-category.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AdminCategoryService {
  
  constructor(private http: HttpClient) {}

  // Obtener todas las categorías
  getCategories(page = 1, limit = 20, search = ''): Observable<any> {
    return this.http.get('/api/admin/categories', {
      params: { page, limit, search }
    });
  }

  // Obtener una categoría
  getCategory(categoryId: string): Observable<any> {
    return this.http.get(`/api/admin/categories/${categoryId}`);
  }

  // Crear categoría
  createCategory(data: any): Observable<any> {
    return this.http.post('/api/admin/categories', data);
  }

  // Actualizar categoría
  updateCategory(categoryId: string, data: any): Observable<any> {
    return this.http.put(`/api/admin/categories/${categoryId}`, data);
  }

  // Eliminar categoría
  deleteCategory(categoryId: string): Observable<any> {
    return this.http.delete(`/api/admin/categories/${categoryId}`);
  }

  // Reordenar categorías
  reorderCategories(categories: Array<{id: string, order: number}>): Observable<any> {
    return this.http.patch('/api/admin/categories/reorder', { categories });
  }
}
```

**Componente de lista:**
```typescript
// components/categories-list.component.ts
import { Component, OnInit } from '@angular/core';
import { AdminCategoryService } from '../services/admin-category.service';

@Component({
  selector: 'app-categories-list',
  templateUrl: './categories-list.component.html'
})
export class CategoriesListComponent implements OnInit {
  categories: any[] = [];
  loading = true;
  page = 1;
  limit = 20;
  search = '';

  constructor(private categoryService: AdminCategoryService) {}

  ngOnInit() {
    this.loadCategories();
  }

  loadCategories() {
    this.loading = true;
    this.categoryService.getCategories(this.page, this.limit, this.search)
      .subscribe({
        next: (response) => {
          this.categories = response.data;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error cargando categorías:', error);
          this.loading = false;
        }
      });
  }

  onSearch(search: string) {
    this.search = search;
    this.page = 1;
    this.loadCategories();
  }

  deleteCategory(categoryId: string) {
    if (confirm('¿Estás seguro de eliminar esta categoría?')) {
      this.categoryService.deleteCategory(categoryId).subscribe({
        next: () => {
          alert('✅ Categoría eliminada');
          this.loadCategories();
        },
        error: (error) => {
          alert(`❌ Error: ${error.error.message}`);
        }
      });
    }
  }
}
```

**Componente de crear/editar:**
```typescript
// components/category-form.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AdminCategoryService } from '../services/admin-category.service';

@Component({
  selector: 'app-category-form',
  templateUrl: './category-form.component.html'
})
export class CategoryFormComponent implements OnInit {
  categoryForm: FormGroup;
  categoryId: string | null = null;
  isEditMode = false;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private categoryService: AdminCategoryService
  ) {
    this.categoryForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      imageUrl: [''],
      icon: [''],
      order: [0],
      isActive: [true]
    });
  }

  ngOnInit() {
    this.categoryId = this.route.snapshot.paramMap.get('id');
    
    if (this.categoryId) {
      this.isEditMode = true;
      this.loadCategory();
    }
  }

  loadCategory() {
    this.categoryService.getCategory(this.categoryId!).subscribe({
      next: (response) => {
        this.categoryForm.patchValue(response.data);
      },
      error: (error) => {
        console.error('Error cargando categoría:', error);
      }
    });
  }

  onSubmit() {
    if (this.categoryForm.valid) {
      this.loading = true;
      
      const request = this.isEditMode
        ? this.categoryService.updateCategory(this.categoryId!, this.categoryForm.value)
        : this.categoryService.createCategory(this.categoryForm.value);

      request.subscribe({
        next: (response) => {
          alert(`✅ Categoría ${this.isEditMode ? 'actualizada' : 'creada'} exitosamente`);
          this.router.navigate(['/admin/categories']);
        },
        error: (error) => {
          alert(`❌ Error: ${error.error.message}`);
          this.loading = false;
        }
      });
    }
  }
}
```

---

## 🖼️ Subir Imagen para Categoría

Primero sube la imagen usando el endpoint de upload:

```typescript
// 1. Subir imagen
const formData = new FormData();
formData.append('image', imageFile);
formData.append('type', 'categories');

const uploadResponse = await fetch('/api/admin/upload/image', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${adminToken}`
  },
  body: formData
});

const { imageUrl } = await uploadResponse.json();

// 2. Crear categoría con la imagen
const categoryData = {
  name: 'Embarazo',
  description: 'Todo sobre embarazo',
  imageUrl: imageUrl, // URL de la imagen subida
  icon: 'pregnant-woman',
  order: 0,
  isActive: true
};

await categoryService.createCategory(categoryData);
```

---

## ✨ Características

✅ **CRUD completo** para administradores  
✅ **Solo lectura** para usuarios de la app  
✅ **Ordenamiento personalizado** (drag & drop recomendado en UI)  
✅ **Búsqueda** por nombre y descripción  
✅ **Paginación** para listas grandes  
✅ **Soporte para imágenes** e iconos  
✅ **Estado activo/inactivo** (solo las activas se muestran en la app)  
✅ **Validaciones** completas  

---

## 📝 Notas Importantes

1. **Índice de Firestore:** Necesitas crear un índice compuesto en Firebase Console:
   - Colección: `categories`
   - Campos: `isActive` (Ascending) + `order` (Ascending)

2. **Orden automático:** Si no se proporciona `order` al crear una categoría, se asigna automáticamente el siguiente número disponible.

3. **Reordenamiento:** Usa el endpoint `PATCH /api/admin/categories/reorder` para actualizar múltiples órdenes de una vez (ideal para drag & drop en el frontend).

4. **Imágenes:** Se recomienda subir imágenes usando `/api/admin/upload/image` con `type: 'categories'`.

