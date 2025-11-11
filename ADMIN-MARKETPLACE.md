# 🛠️ Sistema de Administración del Marketplace - Munpa

## 📋 Resumen

Sistema completo de administración para moderar y gestionar el marketplace, incluyendo productos, vendedores, mensajes y estadísticas.

### Características

✅ **Gestión de productos** - Ver, aprobar, rechazar y eliminar productos  
✅ **Moderación** - Sistema de aprobación con razones y timestamps  
✅ **Gestión de vendedores** - Lista de usuarios con estadísticas  
✅ **Mensajería** - Ver todos los chats del marketplace  
✅ **Estadísticas** - Dashboard completo con métricas en tiempo real  
✅ **Soft delete** - Los productos eliminados se marcan, no se borran  

---

## 🔧 API - Endpoints de Administración

### 1. Listar Todos los Productos

```http
GET /api/admin/marketplace/items
Authorization: Bearer {token}
```

**Query Parameters:**

| Parámetro | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| `page` | number | 1 | Número de página |
| `limit` | number | 100 | Productos por página |
| `search` | string | "" | Buscar en título, descripción, usuario, categoría |
| `status` | string | "" | disponible, vendido, reservado, eliminado |
| `type` | string | "" | venta, donacion, trueque |
| `category` | string | "" | Slug o ID de categoría |
| `userId` | string | "" | ID del usuario vendedor |
| `orderBy` | string | createdAt | Campo para ordenar |
| `order` | string | desc | asc o desc |

**Ejemplos:**

```bash
# Todos los productos
GET /api/admin/marketplace/items?page=1&limit=100

# Productos disponibles
GET /api/admin/marketplace/items?status=disponible

# Productos de venta
GET /api/admin/marketplace/items?type=venta

# Buscar productos
GET /api/admin/marketplace/items?search=carriola

# Productos de un usuario
GET /api/admin/marketplace/items?userId=user_123

# Combinar filtros
GET /api/admin/marketplace/items?status=disponible&type=venta&search=carriola&page=1&limit=50
```

**Respuesta:**

```json
{
  "success": true,
  "data": [
    {
      "id": "VFSg46dNjaFcrHwf7DFF",
      "userId": "yN6kt0TZjdPWF7eem1TfQTNv49m2",
      "userName": "María López",
      "userPhoto": "https://...",
      "title": "Carriola evenflo",
      "description": "Carriola en excelente estado",
      "category": "WMQp2dNXIawHPmuAmybA",
      "categoryName": "Carriolas",
      "categorySlug": "carriolas",
      "condition": "como_nuevo",
      "photos": [
        "https://storage.googleapis.com/.../photo1.jpg",
        "https://storage.googleapis.com/.../photo2.jpg"
      ],
      "type": "venta",
      "price": 100,
      "tradeFor": null,
      "location": {
        "latitude": 37.785834,
        "longitude": -122.406417,
        "address": "Stockton St, 1-99",
        "city": "San Francisco",
        "state": "CA",
        "country": "United States"
      },
      "status": "disponible",
      "views": 45,
      "favorites": 12,
      "messages": 8,
      "isApproved": true,
      "isReported": false,
      "reportCount": 0,
      "createdAt": { "_seconds": 1762793678 },
      "updatedAt": { "_seconds": 1762793678 }
    }
  ],
  "pagination": {
    "total": 150,
    "page": 1,
    "limit": 100,
    "totalPages": 2
  }
}
```

---

### 2. Ver Detalles de un Producto

```http
GET /api/admin/marketplace/items/:id
Authorization: Bearer {token}
```

**Ejemplo:**

```bash
GET /api/admin/marketplace/items/VFSg46dNjaFcrHwf7DFF
```

**Respuesta:**

```json
{
  "success": true,
  "data": {
    "product": {
      "id": "VFSg46dNjaFcrHwf7DFF",
      "title": "Carriola evenflo",
      "description": "Carriola en excelente estado",
      "price": 100,
      "photos": ["url1", "url2"],
      "location": {
        "latitude": 37.785834,
        "longitude": -122.406417,
        "city": "San Francisco"
      },
      "status": "disponible",
      "views": 45,
      "favorites": 12,
      "messages": 8,
      "isApproved": true,
      "isReported": false,
      "reportCount": 0,
      "createdAt": { "_seconds": 1762793678 }
    },
    "user": {
      "id": "yN6kt0TZjdPWF7eem1TfQTNv49m2",
      "name": "María López",
      "email": "maria@ejemplo.com",
      "phone": "+521234567890",
      "photoUrl": "https://...",
      "createdAt": { "_seconds": 1750000000 }
    }
  }
}
```

---

### 3. Aprobar/Rechazar Producto (Moderación)

```http
PATCH /api/admin/marketplace/items/:id/approve
Authorization: Bearer {token}
```

**Body:**

```json
{
  "isApproved": true,
  "reason": "Producto cumple con las políticas de la comunidad"
}
```

**Para aprobar:**
```json
{
  "isApproved": true,
  "reason": "Producto verificado y aprobado"
}
```

**Para rechazar:**
```json
{
  "isApproved": false,
  "reason": "Contenido inapropiado - Imágenes no relacionadas con productos para bebés"
}
```

**Respuesta:**

```json
{
  "success": true,
  "message": "Producto aprobado exitosamente"
}
```

**Campos que se actualizan:**
- `isApproved` - true/false
- `moderationReason` - Razón de la decisión
- `moderatedAt` - Timestamp de cuándo se moderó
- `moderatedBy` - ID del admin que moderó
- `updatedAt` - Timestamp de actualización

---

### 4. Eliminar Producto

```http
DELETE /api/admin/marketplace/items/:id
Authorization: Bearer {token}
```

**Ejemplo:**

```bash
DELETE /api/admin/marketplace/items/VFSg46dNjaFcrHwf7DFF
```

**Respuesta:**

```json
{
  "success": true,
  "message": "Producto eliminado exitosamente"
}
```

**Nota importante:**
- Es un **soft delete** (no se borra el producto)
- El producto se marca con `status: "eliminado"`
- Se registra quién lo eliminó (`deletedBy`) y cuándo (`deletedAt`)
- Útil para mantener histórico y estadísticas

---

### 5. Ver Mensajes/Chats del Marketplace

```http
GET /api/admin/marketplace/messages
Authorization: Bearer {token}
```

**Query Parameters:**

| Parámetro | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| `page` | number | 1 | Número de página |
| `limit` | number | 50 | Mensajes por página |
| `productId` | string | "" | Filtrar por producto específico |
| `userId` | string | "" | Filtrar por usuario específico |
| `orderBy` | string | createdAt | Campo para ordenar |
| `order` | string | desc | asc o desc |

**Ejemplos:**

```bash
# Todos los mensajes
GET /api/admin/marketplace/messages?page=1&limit=50

# Mensajes de un producto
GET /api/admin/marketplace/messages?productId=prod_123

# Mensajes de un usuario
GET /api/admin/marketplace/messages?userId=user_123
```

**Respuesta:**

```json
{
  "success": true,
  "data": [
    {
      "id": "msg_123",
      "productId": "prod_456",
      "participants": ["user_123", "user_456"],
      "senderId": "user_123",
      "receiverId": "user_456",
      "message": "¿Aún está disponible?",
      "createdAt": { "_seconds": 1762793678 },
      "read": false
    }
  ],
  "pagination": {
    "total": 250,
    "page": 1,
    "limit": 50,
    "totalPages": 5
  }
}
```

---

### 6. Estadísticas del Marketplace

```http
GET /api/admin/marketplace/stats
Authorization: Bearer {token}
```

**Respuesta:**

```json
{
  "success": true,
  "data": {
    "productStats": {
      "total": 150,
      "disponible": 89,
      "vendido": 42,
      "reservado": 15,
      "eliminado": 4,
      "venta": 90,
      "donacion": 40,
      "trueque": 20,
      "pendientesAprobacion": 5,
      "reportados": 2
    },
    "topSellers": [
      {
        "userId": "user_123",
        "name": "María López",
        "email": "maria@ejemplo.com",
        "photoUrl": "https://...",
        "productsCount": 15
      },
      {
        "userId": "user_456",
        "name": "Juan Pérez",
        "email": "juan@ejemplo.com",
        "photoUrl": "https://...",
        "productsCount": 12
      }
    ],
    "topCategories": [
      {
        "category": "Carriolas",
        "count": 25
      },
      {
        "category": "Ropa",
        "count": 20
      },
      {
        "category": "Juguetes",
        "count": 18
      }
    ]
  }
}
```

---

### 7. Listar Vendedores

```http
GET /api/admin/marketplace/sellers
Authorization: Bearer {token}
```

**Query Parameters:**

| Parámetro | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| `page` | number | 1 | Número de página |
| `limit` | number | 20 | Vendedores por página |
| `search` | string | "" | Buscar por nombre o email |

**Ejemplos:**

```bash
# Todos los vendedores
GET /api/admin/marketplace/sellers?page=1&limit=20

# Buscar vendedor
GET /api/admin/marketplace/sellers?search=maria
```

**Respuesta:**

```json
{
  "success": true,
  "data": [
    {
      "id": "user_123",
      "name": "María López",
      "email": "maria@ejemplo.com",
      "phone": "+521234567890",
      "photoUrl": "https://...",
      "createdAt": { "_seconds": 1750000000 },
      "stats": {
        "total": 15,
        "disponible": 10,
        "vendido": 5
      }
    },
    {
      "id": "user_456",
      "name": "Juan Pérez",
      "email": "juan@ejemplo.com",
      "phone": "+529876543210",
      "photoUrl": "https://...",
      "createdAt": { "_seconds": 1750000000 },
      "stats": {
        "total": 12,
        "disponible": 8,
        "vendido": 4
      }
    }
  ],
  "pagination": {
    "total": 50,
    "page": 1,
    "limit": 20,
    "totalPages": 3
  }
}
```

---

## 💻 Integración en el Dashboard

### 1. Tabla de Productos

```typescript
// ProductsTable.tsx

import React, { useState, useEffect } from 'react';

const ProductsTable = () => {
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({
    page: 1,
    limit: 50,
    search: '',
    status: '',
    type: ''
  });

  useEffect(() => {
    loadProducts();
  }, [filters]);

  const loadProducts = async () => {
    const params = new URLSearchParams(filters);
    const response = await fetch(
      `https://api.munpa.online/api/admin/marketplace/items?${params}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    const data = await response.json();
    
    if (data.success) {
      setProducts(data.data);
      setPagination(data.pagination);
    }
  };

  const handleApprove = async (productId, isApproved, reason) => {
    const response = await fetch(
      `https://api.munpa.online/api/admin/marketplace/items/${productId}/approve`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isApproved, reason })
      }
    );
    
    const data = await response.json();
    if (data.success) {
      alert('Producto moderado exitosamente');
      loadProducts(); // Recargar lista
    }
  };

  const handleDelete = async (productId) => {
    if (!confirm('¿Estás seguro de eliminar este producto?')) return;
    
    const response = await fetch(
      `https://api.munpa.online/api/admin/marketplace/items/${productId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    const data = await response.json();
    if (data.success) {
      alert('Producto eliminado exitosamente');
      loadProducts();
    }
  };

  return (
    <div>
      <h2>Gestión de Productos</h2>
      
      {/* Filtros */}
      <div className="filters">
        <input
          type="text"
          placeholder="Buscar..."
          value={filters.search}
          onChange={(e) => setFilters({...filters, search: e.target.value, page: 1})}
        />
        
        <select
          value={filters.status}
          onChange={(e) => setFilters({...filters, status: e.target.value, page: 1})}
        >
          <option value="">Todos los estados</option>
          <option value="disponible">Disponible</option>
          <option value="vendido">Vendido</option>
          <option value="reservado">Reservado</option>
          <option value="eliminado">Eliminado</option>
        </select>
        
        <select
          value={filters.type}
          onChange={(e) => setFilters({...filters, type: e.target.value, page: 1})}
        >
          <option value="">Todos los tipos</option>
          <option value="venta">Venta</option>
          <option value="donacion">Donación</option>
          <option value="trueque">Trueque</option>
        </select>
      </div>
      
      {/* Tabla */}
      <table>
        <thead>
          <tr>
            <th>Imagen</th>
            <th>Título</th>
            <th>Vendedor</th>
            <th>Categoría</th>
            <th>Precio</th>
            <th>Estado</th>
            <th>Tipo</th>
            <th>Vistas</th>
            <th>Aprobado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {products.map(product => (
            <tr key={product.id}>
              <td>
                <img 
                  src={product.photos[0] || '/placeholder.png'} 
                  alt={product.title}
                  style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                />
              </td>
              <td>
                <strong>{product.title}</strong>
                <br />
                <small>{product.description?.substring(0, 50)}...</small>
              </td>
              <td>
                <div>
                  <img 
                    src={product.userPhoto || '/default-avatar.png'} 
                    alt={product.userName}
                    style={{ width: '30px', height: '30px', borderRadius: '50%' }}
                  />
                  {product.userName}
                </div>
              </td>
              <td>{product.categoryName}</td>
              <td>{product.price ? `$${product.price}` : '-'}</td>
              <td>
                <span className={`badge badge-${product.status}`}>
                  {product.status}
                </span>
              </td>
              <td>{product.type}</td>
              <td>{product.views}</td>
              <td>
                {product.isApproved ? (
                  <span className="badge badge-success">✓</span>
                ) : (
                  <span className="badge badge-warning">Pendiente</span>
                )}
              </td>
              <td>
                <button onClick={() => window.open(`/admin/marketplace/products/${product.id}`, '_blank')}>
                  Ver
                </button>
                
                {!product.isApproved && (
                  <>
                    <button 
                      onClick={() => handleApprove(product.id, true, 'Producto aprobado')}
                      className="btn-success"
                    >
                      Aprobar
                    </button>
                    <button 
                      onClick={() => {
                        const reason = prompt('Razón del rechazo:');
                        if (reason) handleApprove(product.id, false, reason);
                      }}
                      className="btn-warning"
                    >
                      Rechazar
                    </button>
                  </>
                )}
                
                <button 
                  onClick={() => handleDelete(product.id)}
                  className="btn-danger"
                >
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {/* Paginación */}
      <div className="pagination">
        <button 
          disabled={filters.page === 1}
          onClick={() => setFilters({...filters, page: filters.page - 1})}
        >
          Anterior
        </button>
        
        <span>Página {pagination.page} de {pagination.totalPages}</span>
        
        <button 
          disabled={filters.page === pagination.totalPages}
          onClick={() => setFilters({...filters, page: filters.page + 1})}
        >
          Siguiente
        </button>
      </div>
    </div>
  );
};

export default ProductsTable;
```

---

### 2. Dashboard de Estadísticas

```typescript
// MarketplaceStats.tsx

import React, { useState, useEffect } from 'react';

const MarketplaceStats = () => {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    const response = await fetch(
      'https://api.munpa.online/api/admin/marketplace/stats',
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    const data = await response.json();
    
    if (data.success) {
      setStats(data.data);
    }
  };

  if (!stats) return <div>Cargando...</div>;

  return (
    <div className="marketplace-stats">
      <h2>Estadísticas del Marketplace</h2>
      
      {/* Estadísticas de Productos */}
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total de Productos</h3>
          <p className="stat-number">{stats.productStats.total}</p>
        </div>
        
        <div className="stat-card">
          <h3>Disponibles</h3>
          <p className="stat-number">{stats.productStats.disponible}</p>
        </div>
        
        <div className="stat-card">
          <h3>Vendidos</h3>
          <p className="stat-number">{stats.productStats.vendido}</p>
        </div>
        
        <div className="stat-card">
          <h3>Donaciones</h3>
          <p className="stat-number">{stats.productStats.donacion}</p>
        </div>
        
        <div className="stat-card alert">
          <h3>Pendientes de Aprobación</h3>
          <p className="stat-number">{stats.productStats.pendientesAprobacion}</p>
        </div>
        
        <div className="stat-card danger">
          <h3>Reportados</h3>
          <p className="stat-number">{stats.productStats.reportados}</p>
        </div>
      </div>
      
      {/* Top Vendedores */}
      <div className="section">
        <h3>Top 10 Vendedores</h3>
        <table>
          <thead>
            <tr>
              <th>Vendedor</th>
              <th>Email</th>
              <th>Productos</th>
            </tr>
          </thead>
          <tbody>
            {stats.topSellers.map(seller => (
              <tr key={seller.userId}>
                <td>
                  <img 
                    src={seller.photoUrl || '/default-avatar.png'} 
                    alt={seller.name}
                    style={{ width: '30px', height: '30px', borderRadius: '50%', marginRight: '10px' }}
                  />
                  {seller.name}
                </td>
                <td>{seller.email}</td>
                <td><strong>{seller.productsCount}</strong></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Categorías Populares */}
      <div className="section">
        <h3>Top 10 Categorías</h3>
        <div className="categories-chart">
          {stats.topCategories.map((cat, index) => (
            <div key={index} className="category-bar">
              <span className="category-name">{cat.category}</span>
              <div className="bar-container">
                <div 
                  className="bar-fill" 
                  style={{ width: `${(cat.count / stats.topCategories[0].count) * 100}%` }}
                />
              </div>
              <span className="category-count">{cat.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MarketplaceStats;
```

---

### 3. Lista de Vendedores

```typescript
// SellersTable.tsx

const SellersTable = () => {
  const [sellers, setSellers] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});

  useEffect(() => {
    loadSellers();
  }, [search, page]);

  const loadSellers = async () => {
    const response = await fetch(
      `https://api.munpa.online/api/admin/marketplace/sellers?page=${page}&limit=20&search=${search}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    const data = await response.json();
    
    if (data.success) {
      setSellers(data.data);
      setPagination(data.pagination);
    }
  };

  return (
    <div>
      <h2>Vendedores del Marketplace</h2>
      
      <input
        type="text"
        placeholder="Buscar vendedor..."
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setPage(1);
        }}
      />
      
      <table>
        <thead>
          <tr>
            <th>Vendedor</th>
            <th>Email</th>
            <th>Teléfono</th>
            <th>Total Productos</th>
            <th>Disponibles</th>
            <th>Vendidos</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {sellers.map(seller => (
            <tr key={seller.id}>
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <img 
                    src={seller.photoUrl || '/default-avatar.png'} 
                    alt={seller.name}
                    style={{ width: '40px', height: '40px', borderRadius: '50%' }}
                  />
                  <div>
                    <strong>{seller.name}</strong>
                    <br />
                    <small>Desde: {new Date(seller.createdAt._seconds * 1000).toLocaleDateString()}</small>
                  </div>
                </div>
              </td>
              <td>{seller.email}</td>
              <td>{seller.phone || '-'}</td>
              <td><strong>{seller.stats.total}</strong></td>
              <td>{seller.stats.disponible}</td>
              <td>{seller.stats.vendido}</td>
              <td>
                <button onClick={() => window.open(`/admin/users/${seller.id}`, '_blank')}>
                  Ver Perfil
                </button>
                <button onClick={() => window.open(`/admin/marketplace/items?userId=${seller.id}`, '_blank')}>
                  Ver Productos
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      <div className="pagination">
        <button 
          disabled={page === 1}
          onClick={() => setPage(page - 1)}
        >
          Anterior
        </button>
        <span>Página {pagination.page} de {pagination.totalPages}</span>
        <button 
          disabled={page === pagination.totalPages}
          onClick={() => setPage(page + 1)}
        >
          Siguiente
        </button>
      </div>
    </div>
  );
};
```

---

## 🎯 Flujos de Trabajo

### Flujo de Moderación

```
1. Usuario publica producto
   └─> isApproved: true (auto-aprobado)

2. Si hay reportes
   └─> isReported: true
   └─> reportCount: incrementa

3. Admin revisa producto
   └─> GET /api/admin/marketplace/items?status=disponible&search=...

4. Admin ve detalles
   └─> GET /api/admin/marketplace/items/:id
   └─> Ve producto + info del vendedor

5. Admin decide:
   
   A) Aprobar:
      PATCH /api/admin/marketplace/items/:id/approve
      { "isApproved": true, "reason": "Cumple políticas" }
   
   B) Rechazar:
      PATCH /api/admin/marketplace/items/:id/approve
      { "isApproved": false, "reason": "Contenido inapropiado" }
   
   C) Eliminar:
      DELETE /api/admin/marketplace/items/:id
      (Soft delete: status = "eliminado")
```

---

## 📊 Casos de Uso

### 1. Ver productos pendientes de aprobación

```bash
GET /api/admin/marketplace/items?status=disponible
# Filtrar manualmente por isApproved: false en el frontend
```

### 2. Ver productos reportados

```bash
GET /api/admin/marketplace/items
# Filtrar por isReported: true en el frontend
```

### 3. Ver todos los productos de un vendedor

```bash
GET /api/admin/marketplace/items?userId=user_123
```

### 4. Buscar producto específico

```bash
GET /api/admin/marketplace/items?search=carriola
```

### 5. Ver mensajes de un producto

```bash
GET /api/admin/marketplace/messages?productId=prod_123
```

### 6. Ver actividad de un usuario

```bash
# Productos del usuario
GET /api/admin/marketplace/items?userId=user_123

# Mensajes del usuario
GET /api/admin/marketplace/messages?userId=user_123
```

---

## 📝 Resumen de Endpoints

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/admin/marketplace/items` | GET | Listar productos con filtros |
| `/api/admin/marketplace/items/:id` | GET | Ver detalles + info vendedor |
| `/api/admin/marketplace/items/:id/approve` | PATCH | Aprobar/rechazar producto |
| `/api/admin/marketplace/items/:id` | DELETE | Eliminar producto (soft delete) |
| `/api/admin/marketplace/messages` | GET | Ver todos los chats |
| `/api/admin/marketplace/stats` | GET | Estadísticas del marketplace |
| `/api/admin/marketplace/sellers` | GET | Listar vendedores |

---

## 🔒 Autenticación

Todos los endpoints requieren:
- Header `Authorization: Bearer {token}`
- Usuario debe tener rol de **admin** (`isAdmin: true`)

---

## 🎉 ¡Sistema Completo!

El dashboard de administración está listo para:
- ✅ Gestionar productos
- ✅ Moderar contenido
- ✅ Ver estadísticas
- ✅ Supervisar vendedores
- ✅ Monitorear chats
- ✅ Eliminar contenido inapropiado

