# 🏷️ Sistema de Categorías Dinámicas para Marketplace

## 📋 Descripción

Sistema que permite al administrador crear y gestionar categorías con imágenes desde el dashboard, y a los usuarios consumirlas en la app para crear productos.

---

## 🗂️ Colección en Firestore

### `marketplace_categories`

```javascript
{
  id: "cat_123",
  name: "Transporte",              // Nombre de la categoría
  slug: "transporte",              // Slug único para URLs
  description: "Carriolas, sillas de auto, portabebés",
  icon: "🚗",                      // Emoji o icono
  imageUrl: "https://...",         // URL de la imagen
  imageStoragePath: "marketplace/categories/transporte.jpg",
  
  order: 1,                        // Orden de visualización
  isActive: true,                  // Si está activa o no
  
  productCount: 45,                // Número de productos en esta categoría
  
  createdAt: Timestamp,
  updatedAt: Timestamp,
  createdBy: "admin_uid"           // ID del admin que la creó
}
```

---

## 🔗 Endpoints

### Para Usuarios (2 endpoints)

#### 1. **GET /api/marketplace/categories**
Obtener todas las categorías activas

**Query Parameters:**
- `includeInactive` (opcional): Incluir categorías inactivas (solo admin)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "cat_123",
      "name": "Transporte",
      "slug": "transporte",
      "description": "Carriolas, sillas de auto",
      "icon": "🚗",
      "imageUrl": "https://...",
      "order": 1,
      "productCount": 45
    }
  ]
}
```

#### 2. **GET /api/marketplace/categories/:id**
Obtener detalle de una categoría

---

### Para Administradores (5 endpoints)

#### 1. **POST /api/admin/marketplace/categories**
Crear nueva categoría

**Body:**
```json
{
  "name": "Transporte",
  "slug": "transporte",
  "description": "Carriolas, sillas de auto",
  "icon": "🚗",
  "imageUrl": "https://...",
  "imageStoragePath": "marketplace/categories/transporte.jpg",
  "order": 1,
  "isActive": true
}
```

#### 2. **PUT /api/admin/marketplace/categories/:id**
Actualizar categoría

#### 3. **DELETE /api/admin/marketplace/categories/:id**
Eliminar categoría (solo si no tiene productos)

#### 4. **PATCH /api/admin/marketplace/categories/:id/toggle**
Activar/desactivar categoría

#### 5. **POST /api/admin/marketplace/categories/upload-image**
Subir imagen de categoría a Firebase Storage

**Form Data:**
- `image`: Archivo de imagen
- `categoryId` (opcional): ID de categoría existente

---

## 📸 Subida de Imágenes

Las imágenes se guardan en Firebase Storage:

**Path:** `/marketplace/categories/{categoryId}.jpg`

**Validaciones:**
- Formato: JPG, PNG, WEBP
- Tamaño máximo: 2MB
- Dimensiones recomendadas: 400x400px
- Se genera thumbnail automático

---

## 🔄 Flujo de Creación de Categoría

1. Admin sube imagen → `POST /api/admin/marketplace/categories/upload-image`
2. Recibe URL de la imagen
3. Admin crea categoría con la URL → `POST /api/admin/marketplace/categories`
4. Categoría disponible inmediatamente en la app

---

## 📱 Uso en la App

### Ejemplo: Listar Categorías

```javascript
// React
const [categories, setCategories] = useState([]);

useEffect(() => {
  fetch('/api/marketplace/categories')
    .then(res => res.json())
    .then(data => setCategories(data.data));
}, []);

// Renderizar
{categories.map(cat => (
  <div key={cat.id}>
    <img src={cat.imageUrl} alt={cat.name} />
    <h3>{cat.icon} {cat.name}</h3>
    <p>{cat.description}</p>
  </div>
))}
```

### Ejemplo: Crear Producto

```javascript
// Al crear producto, seleccionar de categorías disponibles
const handleSubmit = async () => {
  await fetch('/api/marketplace/products', {
    method: 'POST',
    body: JSON.stringify({
      title: 'Mi producto',
      category: selectedCategory.slug, // Usar el slug
      // ... otros campos
    })
  });
};
```

---

## ✅ Validación Dinámica

Cuando se crea un producto, el backend valida que la categoría exista y esté activa:

```javascript
// En POST /api/marketplace/products
const categoryExists = await db.collection('marketplace_categories')
  .where('slug', '==', category)
  .where('isActive', '==', true)
  .get();

if (categoryExists.empty) {
  return res.status(400).json({
    success: false,
    message: 'Categoría no válida'
  });
}
```

---

## 🔢 Contador de Productos

El sistema mantiene automáticamente el contador de productos por categoría:

- Al crear producto: incrementa `productCount`
- Al eliminar producto: decrementa `productCount`
- Al cambiar categoría: actualiza ambas categorías

---

## 🎨 Categorías por Defecto

Al iniciar el sistema, se crean categorías predeterminadas:

```javascript
const defaultCategories = [
  {
    name: 'Transporte',
    slug: 'transporte',
    description: 'Carriolas, sillas de auto, portabebés',
    icon: '🚗',
    order: 1
  },
  {
    name: 'Ropa',
    slug: 'ropa',
    description: 'Ropa de bebé y mamá',
    icon: '👕',
    order: 2
  },
  // ... más categorías
];
```

Script: `POST /api/admin/marketplace/categories/init-defaults`

---

## 🔐 Seguridad

- ✅ Solo admin puede crear/editar/eliminar categorías
- ✅ Validación de formatos de imagen
- ✅ Slugs únicos
- ✅ No se puede eliminar categoría con productos
- ✅ Soft delete opcional

---

## 📊 Dashboard de Admin

El dashboard debe mostrar:

1. **Lista de Categorías**
   - Imagen miniatura
   - Nombre
   - Número de productos
   - Estado (activa/inactiva)
   - Acciones (editar, eliminar, toggle)

2. **Formulario de Creación/Edición**
   - Upload de imagen con preview
   - Campos de texto
   - Toggle activo/inactivo
   - Ordenamiento

3. **Estadísticas**
   - Total de categorías
   - Categorías más usadas
   - Categorías sin productos

---

## 🚀 Migración de Datos Existentes

Para productos existentes con categorías hardcodeadas:

```javascript
// Script de migración
const migrateProductCategories = async () => {
  // 1. Crear categorías en Firestore
  // 2. Los productos existentes seguirán funcionando
  // 3. Nuevos productos usan categorías de Firestore
};
```

---

¡Sistema de categorías dinámicas listo! 🎉

