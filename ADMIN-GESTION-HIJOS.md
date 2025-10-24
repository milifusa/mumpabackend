# 👶 Gestión de Hijos - Dashboard Admin

## 📋 Endpoints para Administrar Hijos

El dashboard de administración permite ver, editar y eliminar los perfiles de los hijos de cualquier usuario, sin restricciones de ownership.

---

## 1. Obtener Todos los Hijos

```http
GET /api/admin/children?page=1&limit=20&search=nombre
```

**Headers:**
```
Authorization: Bearer {JWT_TOKEN}
```

**Query Parameters:**
- `page` (opcional): Número de página (default: 1)
- `limit` (opcional): Resultados por página (default: 20)
- `search` (opcional): Buscar por nombre del hijo o ID del padre

**Respuesta exitosa (200):**
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
      "photoUrl": "https://firebasestorage.googleapis.com/.../photo.jpg",
      "createdAt": "2025-01-10T10:30:00.000Z",
      "registeredAt": "2025-01-10T10:30:00.000Z",
      "updatedAt": "2025-01-15T14:20:00.000Z"
    },
    {
      "id": "child789",
      "parentId": "user123",
      "name": "Bebé López",
      "ageInMonths": null,
      "gestationWeeks": 28,
      "isUnborn": true,
      "photoUrl": null,
      "createdAt": "2025-01-12T15:45:00.000Z",
      "registeredAt": "2025-01-12T15:45:00.000Z",
      "updatedAt": "2025-01-20T09:10:00.000Z"
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

**Campos del hijo:**
- `id`: ID único del hijo
- `parentId`: ID del usuario padre/madre
- `name`: Nombre del hijo
- `ageInMonths`: Edad en meses (para nacidos)
- `gestationWeeks`: Semanas de gestación (para no nacidos)
- `isUnborn`: `true` si es un bebé no nacido, `false` si ya nació
- `photoUrl`: URL de la foto del hijo
- `createdAt`: Fecha de creación del registro
- `registeredAt`: Fecha cuando se registró la edad/semanas
- `updatedAt`: Última actualización

---

## 2. Editar Hijo

```http
PUT /api/admin/children/:childId
```

**Headers:**
```
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json
```

**Body (todos los campos son opcionales):**
```json
{
  "name": "Sofía María García",
  "ageInMonths": 9,
  "isUnborn": false,
  "gestationWeeks": null,
  "photoUrl": "https://firebasestorage.googleapis.com/.../new-photo.jpg"
}
```

**Campos editables:**
- `name` (string): Nombre del hijo
- `ageInMonths` (number): Edad en meses (solo para nacidos)
- `isUnborn` (boolean): Si el bebé ha nacido o no
- `gestationWeeks` (number): Semanas de gestación (solo para no nacidos, 1-42)
- `photoUrl` (string): URL de la foto

**Validaciones:**
- Si `isUnborn: true`, las `gestationWeeks` deben estar entre 1 y 42
- Si `isUnborn: false`, `ageInMonths` debe ser >= 0
- Al cambiar `isUnborn`, los campos incompatibles se limpian automáticamente:
  - `isUnborn: true` → `ageInMonths` se establece en `null`
  - `isUnborn: false` → `gestationWeeks` se establece en `null`

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "message": "Hijo actualizado exitosamente",
  "data": {
    "id": "child123",
    "parentId": "user456",
    "name": "Sofía María García",
    "ageInMonths": 9,
    "gestationWeeks": null,
    "isUnborn": false,
    "photoUrl": "https://firebasestorage.googleapis.com/.../new-photo.jpg",
    "updatedAt": "2025-01-22T16:30:00.000Z"
  }
}
```

**Errores:**
- `404`: Hijo no encontrado
- `400`: Validación fallida (ej: semanas de gestación fuera de rango)

---

## 3. Eliminar Hijo

```http
DELETE /api/admin/children/:childId
```

**Headers:**
```
Authorization: Bearer {JWT_TOKEN}
```

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "message": "Hijo eliminado exitosamente"
}
```

**Comportamiento:**
- Elimina el perfil del hijo de la base de datos
- Actualiza automáticamente el contador `childrenCount` del padre
- **Nota**: Esta acción es **permanente** y no se puede deshacer

**Errores:**
- `404`: Hijo no encontrado

---

## 🔑 Permisos del Administrador

- ✅ **El admin puede editar cualquier hijo**, sin importar quién sea el padre
- ✅ **El admin puede eliminar cualquier hijo**, sin restricciones
- ✅ **No hay verificación de ownership** en los endpoints del dashboard
- ✅ Al eliminar un hijo, se actualiza automáticamente el contador del padre
- ✅ Todos los endpoints están protegidos por el middleware `isAdmin`

---

## 🧪 Ejemplos de Uso en Angular

### Service para Hijos:

```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ChildrenService {
  private apiUrl = 'https://mumpabackend.vercel.app/api/admin/children';

  constructor(private http: HttpClient) {}

  // Obtener todos los hijos
  getChildren(page: number = 1, limit: number = 20, search: string = ''): Observable<any> {
    return this.http.get(`${this.apiUrl}?page=${page}&limit=${limit}&search=${search}`);
  }

  // Editar hijo
  updateChild(childId: string, data: Partial<{
    name: string;
    ageInMonths: number;
    isUnborn: boolean;
    gestationWeeks: number;
    photoUrl: string;
  }>): Observable<any> {
    return this.http.put(`${this.apiUrl}/${childId}`, data);
  }

  // Eliminar hijo
  deleteChild(childId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${childId}`);
  }
}
```

---

### Componente para Listar Hijos:

```typescript
import { Component, OnInit } from '@angular/core';
import { ChildrenService } from './children.service';

@Component({
  selector: 'app-children-list',
  template: `
    <div class="children-list">
      <h2>Gestión de Hijos</h2>

      <!-- Buscador -->
      <div class="search-box">
        <input 
          type="text" 
          [(ngModel)]="searchTerm" 
          (input)="onSearch()"
          placeholder="Buscar por nombre o ID del padre..."
        >
      </div>

      <!-- Lista de hijos -->
      <div class="children-table" *ngIf="children.length > 0">
        <table>
          <thead>
            <tr>
              <th>Foto</th>
              <th>Nombre</th>
              <th>Estado</th>
              <th>Edad/Gestación</th>
              <th>ID Padre</th>
              <th>Fecha Registro</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let child of children">
              <td>
                <img 
                  [src]="child.photoUrl || 'assets/default-baby.png'" 
                  alt="{{ child.name }}"
                  class="child-photo"
                >
              </td>
              <td>{{ child.name }}</td>
              <td>
                <span class="status-badge" [class.unborn]="child.isUnborn">
                  {{ child.isUnborn ? 'No nacido' : 'Nacido' }}
                </span>
              </td>
              <td>
                <span *ngIf="child.isUnborn">{{ child.gestationWeeks }} semanas</span>
                <span *ngIf="!child.isUnborn">{{ child.ageInMonths }} meses</span>
              </td>
              <td>
                <small>{{ child.parentId }}</small>
              </td>
              <td>{{ child.createdAt | date:'short' }}</td>
              <td>
                <button (click)="editChild(child)">✏️ Editar</button>
                <button (click)="deleteChild(child)" class="btn-danger">
                  🗑️ Eliminar
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Sin resultados -->
      <div *ngIf="children.length === 0 && !isLoading">
        <p>No se encontraron hijos.</p>
      </div>

      <!-- Paginación -->
      <div class="pagination" *ngIf="pagination.totalPages > 1">
        <button 
          [disabled]="pagination.page === 1"
          (click)="loadPage(pagination.page - 1)"
        >
          Anterior
        </button>
        <span>Página {{ pagination.page }} de {{ pagination.totalPages }}</span>
        <button 
          [disabled]="pagination.page === pagination.totalPages"
          (click)="loadPage(pagination.page + 1)"
        >
          Siguiente
        </button>
      </div>

      <!-- Loading -->
      <div *ngIf="isLoading" class="loading">
        Cargando hijos...
      </div>

      <!-- Error -->
      <div *ngIf="errorMessage" class="error-message">
        {{ errorMessage }}
      </div>
    </div>
  `,
  styles: [`
    .child-photo {
      width: 50px;
      height: 50px;
      border-radius: 50%;
      object-fit: cover;
    }
    .status-badge {
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 12px;
      background-color: #4caf50;
      color: white;
    }
    .status-badge.unborn {
      background-color: #ff9800;
    }
    .btn-danger {
      background-color: #f44336;
      color: white;
    }
  `]
})
export class ChildrenListComponent implements OnInit {
  children: any[] = [];
  searchTerm: string = '';
  pagination = {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  };
  isLoading = false;
  errorMessage = '';

  constructor(private childrenService: ChildrenService) {}

  ngOnInit() {
    this.loadChildren();
  }

  loadChildren(page: number = 1) {
    this.isLoading = true;
    this.errorMessage = '';

    this.childrenService.getChildren(page, 20, this.searchTerm)
      .subscribe({
        next: (response) => {
          this.children = response.data;
          this.pagination = response.pagination;
          this.isLoading = false;
        },
        error: (error) => {
          this.errorMessage = error.error?.message || 'Error cargando hijos';
          this.isLoading = false;
        }
      });
  }

  onSearch() {
    this.loadChildren(1); // Reset a página 1 al buscar
  }

  loadPage(page: number) {
    this.loadChildren(page);
  }

  editChild(child: any) {
    // Abrir modal o navegar a página de edición
    console.log('Editar hijo:', child);
  }

  deleteChild(child: any) {
    if (confirm(`¿Estás seguro de eliminar a ${child.name}? Esta acción no se puede deshacer.`)) {
      this.childrenService.deleteChild(child.id)
        .subscribe({
          next: () => {
            alert('Hijo eliminado exitosamente');
            this.loadChildren(this.pagination.page);
          },
          error: (error) => {
            alert(error.error?.message || 'Error eliminando hijo');
          }
        });
    }
  }
}
```

---

### Componente para Editar Hijo:

```typescript
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ChildrenService } from './children.service';

@Component({
  selector: 'app-edit-child',
  template: `
    <div class="edit-child-form">
      <h2>Editar Hijo</h2>
      
      <form [formGroup]="childForm" (ngSubmit)="onSubmit()">
        <div class="form-group">
          <label for="name">Nombre *</label>
          <input 
            type="text" 
            id="name" 
            formControlName="name" 
            placeholder="Nombre del hijo"
          >
        </div>

        <div class="form-group">
          <label>
            <input type="checkbox" formControlName="isUnborn">
            Bebé no nacido
          </label>
        </div>

        <div class="form-group" *ngIf="!childForm.value.isUnborn">
          <label for="ageInMonths">Edad en meses *</label>
          <input 
            type="number" 
            id="ageInMonths" 
            formControlName="ageInMonths" 
            min="0"
            placeholder="Edad en meses"
          >
        </div>

        <div class="form-group" *ngIf="childForm.value.isUnborn">
          <label for="gestationWeeks">Semanas de gestación *</label>
          <input 
            type="number" 
            id="gestationWeeks" 
            formControlName="gestationWeeks" 
            min="1"
            max="42"
            placeholder="1-42 semanas"
          >
        </div>

        <div class="form-group">
          <label for="photoUrl">URL de Foto</label>
          <input 
            type="url" 
            id="photoUrl" 
            formControlName="photoUrl" 
            placeholder="https://..."
          >
        </div>

        <div class="form-actions">
          <button 
            type="submit" 
            [disabled]="!childForm.valid || isLoading"
          >
            {{ isLoading ? 'Guardando...' : 'Guardar Cambios' }}
          </button>
          <button type="button" (click)="cancel()">
            Cancelar
          </button>
        </div>
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
export class EditChildComponent implements OnInit {
  childForm: FormGroup;
  childId: string = '';
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private childrenService: ChildrenService
  ) {
    this.childForm = this.fb.group({
      name: ['', Validators.required],
      isUnborn: [false],
      ageInMonths: [0, [Validators.min(0)]],
      gestationWeeks: [null, [Validators.min(1), Validators.max(42)]],
      photoUrl: ['']
    });

    // Ajustar validaciones según isUnborn
    this.childForm.get('isUnborn')?.valueChanges.subscribe(isUnborn => {
      if (isUnborn) {
        this.childForm.get('gestationWeeks')?.setValidators([Validators.required, Validators.min(1), Validators.max(42)]);
        this.childForm.get('ageInMonths')?.clearValidators();
      } else {
        this.childForm.get('ageInMonths')?.setValidators([Validators.required, Validators.min(0)]);
        this.childForm.get('gestationWeeks')?.clearValidators();
      }
      this.childForm.get('ageInMonths')?.updateValueAndValidity();
      this.childForm.get('gestationWeeks')?.updateValueAndValidity();
    });
  }

  ngOnInit() {
    this.childId = this.route.snapshot.paramMap.get('id') || '';
    // Cargar datos actuales del hijo...
  }

  onSubmit() {
    if (this.childForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';
      this.successMessage = '';

      const formData = this.childForm.value;

      this.childrenService.updateChild(this.childId, formData)
        .subscribe({
          next: (response) => {
            this.successMessage = 'Hijo actualizado exitosamente';
            this.isLoading = false;
            setTimeout(() => this.router.navigate(['/admin/children']), 1500);
          },
          error: (error) => {
            this.errorMessage = error.error?.message || 'Error actualizando hijo';
            this.isLoading = false;
          }
        });
    }
  }

  cancel() {
    this.router.navigate(['/admin/children']);
  }
}
```

---

## ⚠️ Consideraciones Importantes

### Diferencias entre Endpoints de Usuario y Admin

| Aspecto | Endpoint Usuario (`/api/auth/children/:id`) | Endpoint Admin (`/api/admin/children/:id`) |
|---------|---------------------------------------------|-------------------------------------------|
| **Autenticación** | Token de usuario | Token de admin |
| **Verificación de ownership** | ✅ Sí (solo su hijo) | ❌ No (cualquier hijo) |
| **Actualización del padre** | ✅ Automática | ✅ Automática |
| **Propósito** | Uso en la app móvil | Uso en dashboard admin |

### Seguridad

- ✅ Solo usuarios con `role: 'admin'` o `isAdmin: true` pueden acceder
- ✅ Todos los cambios se registran con `updatedAt`
- ✅ Al eliminar, se actualiza el contador del padre automáticamente
- ⚠️ **La eliminación es permanente** - considera implementar soft delete si es necesario

### Casos de Uso

1. **Corrección de datos**: El admin puede corregir errores en perfiles de hijos
2. **Eliminación de contenido inapropiado**: Eliminar perfiles con información incorrecta
3. **Soporte al usuario**: Ayudar a usuarios que no pueden editar sus propios hijos
4. **Moderación**: Gestionar el contenido de la plataforma

---

## ✅ Resumen de Endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/admin/children` | Listar todos los hijos con paginación y búsqueda |
| PUT | `/api/admin/children/:childId` | Editar cualquier hijo (sin restricciones) |
| DELETE | `/api/admin/children/:childId` | Eliminar cualquier hijo (sin restricciones) |

**¡Todos los endpoints están desplegados y listos para usar!** 🚀

