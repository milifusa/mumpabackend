# 🛍️ API del Marketplace de Munpa

## 📋 Índice

1. [Productos](#productos)
2. [Favoritos](#favoritos)
3. [Mensajes](#mensajes)
4. [Transacciones](#transacciones)
5. [Reportes](#reportes)
6. [Admin](#admin)

---

## 🛒 Productos

### 1. Listar Productos (GET /api/marketplace/products)

**Descripción:** Obtiene una lista de productos con filtros y paginación

**Query Parameters:**
- `type`: Tipo (venta, donacion, trueque)
- `category`: Categoría del producto
- `status`: Estado (disponible, vendido, etc.)
- `minPrice`: Precio mínimo
- `maxPrice`: Precio máximo
- `search`: Búsqueda en título/descripción
- `orderBy`: Orden (reciente, precio_asc, precio_desc)
- `page`: Número de página (default: 1)
- `limit`: Items por página (default: 20)
- `userId`: Filtrar por usuario específico

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "prod_123",
      "userId": "user_abc",
      "userName": "María López",
      "userPhoto": "https://...",
      "title": "Carriola Evenflo",
      "description": "Carriola en excelente estado...",
      "category": "transporte",
      "condition": "como_nuevo",
      "photos": ["https://..."],
      "type": "venta",
      "price": 1500,
      "location": {
        "city": "Coyoacán",
        "state": "Ciudad de México",
        "country": "México",
        "latitude": 19.3467,
        "longitude": -99.1617
      },
      "status": "disponible",
      "views": 45,
      "favorites": 12,
      "messages": 8,
      "createdAt": "2025-01-15T10:00:00Z"
    }
  ],
  "pagination": {
    "total": 150,
    "page": 1,
    "limit": 20,
    "totalPages": 8
  }
}
```

### 2. Ver Detalle de Producto (GET /api/marketplace/products/:id)

**Descripción:** Obtiene los detalles completos de un producto

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "prod_123",
    "userId": "user_abc",
    "userName": "María López",
    "title": "Carriola Evenflo",
    "description": "...",
    "category": "transporte",
    "condition": "como_nuevo",
    "photos": ["https://..."],
    "type": "venta",
    "price": 1500,
    "location": {
      "city": "Coyoacán",
      "state": "Ciudad de México",
      "country": "México",
      "latitude": 19.3467,
      "longitude": -99.1617
    },
    "status": "disponible",
    "views": 46,
    "createdAt": "2025-01-15T10:00:00Z"
  }
}
```

### 3. Crear Producto (POST /api/marketplace/products)

**Requiere:** Autenticación

**Body:**
```json
{
  "title": "Carriola Evenflo",
  "description": "Carriola en excelente estado, poco uso, incluye lluvia...",
  "category": "transporte",
  "condition": "como_nuevo",
  "photos": [
    "https://storage.googleapis.com/...",
    "https://storage.googleapis.com/..."
  ],
  "type": "venta",
  "price": 1500,
  "location": {
    "city": "Coyoacán",
    "state": "Ciudad de México",
    "country": "México",
    "latitude": 19.3467,
    "longitude": -99.1617
  }
}
```

**Validaciones:**
- Título: 10-100 caracteres
- Descripción: 20-1000 caracteres
- Fotos: 1-5 imágenes
- Precio: requerido si type = "venta"
- tradeFor: requerido si type = "trueque"

**Response:**
```json
{
  "success": true,
  "message": "Producto publicado exitosamente",
  "data": {
    "id": "prod_123",
    "...": "datos del producto"
  }
}
```

### 4. Actualizar Producto (PUT /api/marketplace/products/:id)

**Requiere:** Autenticación (solo el dueño puede editar)

**Body:** (todos los campos son opcionales)
```json
{
  "title": "Carriola Evenflo actualizada",
  "price": 1400,
  "description": "Nueva descripción..."
}
```

### 5. Eliminar Producto (DELETE /api/marketplace/products/:id)

**Requiere:** Autenticación (solo el dueño puede eliminar)

**Descripción:** Realiza un "soft delete" - cambia el estado a "eliminado"

### 6. Cambiar Estado (PATCH /api/marketplace/products/:id/status)

**Requiere:** Autenticación

**Body:**
```json
{
  "status": "vendido",
  "buyerId": "user_xyz",
  "buyerName": "Juan Pérez"
}
```

**Estados válidos:**
- disponible
- reservado
- vendido
- donado
- intercambiado
- eliminado

### 7. Mis Productos (GET /api/marketplace/my-products)

**Requiere:** Autenticación

**Query Parameters:**
- `status`: Filtrar por estado

**Response:** Lista de productos del usuario autenticado

---

## ⭐ Favoritos

### 1. Listar Favoritos (GET /api/marketplace/favorites)

**Requiere:** Autenticación

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "prod_123",
      "title": "Carriola Evenflo",
      "...": "datos del producto"
    }
  ]
}
```

### 2. Agregar a Favoritos (POST /api/marketplace/favorites/:productId)

**Requiere:** Autenticación

### 3. Quitar de Favoritos (DELETE /api/marketplace/favorites/:productId)

**Requiere:** Autenticación

---

## 💬 Mensajes

### 1. Ver Conversaciones (GET /api/marketplace/messages)

**Requiere:** Autenticación

**Response:**
```json
{
  "success": true,
  "data": {
    "prod_123": [
      {
        "id": "msg_456",
        "productId": "prod_123",
        "senderId": "user_xyz",
        "senderName": "Juan Pérez",
        "message": "Hola, ¿aún está disponible?",
        "isRead": false,
        "createdAt": "2025-01-15T11:00:00Z"
      }
    ]
  }
}
```

### 2. Ver Mensajes de un Producto (GET /api/marketplace/messages/:productId)

**Requiere:** Autenticación

### 3. Enviar Mensaje (POST /api/marketplace/messages)

**Requiere:** Autenticación

**Body:**
```json
{
  "productId": "prod_123",
  "message": "Hola, ¿aún está disponible?"
}
```

**Validaciones:**
- Mensaje: máximo 500 caracteres

### 4. Marcar como Leído (PATCH /api/marketplace/messages/:id/read)

**Requiere:** Autenticación (solo el receptor puede marcar como leído)

---

## 📊 Transacciones

### 1. Mis Transacciones (GET /api/marketplace/transactions)

**Requiere:** Autenticación

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "trans_789",
      "productId": "prod_123",
      "productTitle": "Carriola Evenflo",
      "sellerId": "user_abc",
      "sellerName": "María López",
      "buyerId": "user_xyz",
      "buyerName": "Juan Pérez",
      "type": "venta",
      "amount": 1500,
      "status": "completada",
      "role": "vendedor",
      "createdAt": "2025-01-15T12:00:00Z"
    }
  ]
}
```

---

## 🚨 Reportes

### 1. Reportar Producto (POST /api/marketplace/reports)

**Requiere:** Autenticación

**Body:**
```json
{
  "productId": "prod_123",
  "reason": "spam",
  "description": "Este producto es spam..."
}
```

**Razones válidas:**
- spam
- fraude
- contenido_inapropiado
- precio_incorrecto
- informacion_falsa
- otro

---

## 🛠️ Endpoints de Administrador

### 1. Ver Todos los Productos (GET /api/admin/marketplace/products)

**Requiere:** Autenticación + Admin

**Query Parameters:**
- `status`: Filtrar por estado
- `isReported`: Filtrar reportados (true/false)

### 2. Aprobar Producto (PATCH /api/admin/marketplace/products/:id/approve)

**Requiere:** Autenticación + Admin

### 3. Rechazar Producto (PATCH /api/admin/marketplace/products/:id/reject)

**Requiere:** Autenticación + Admin

### 4. Eliminar Permanentemente (DELETE /api/admin/marketplace/products/:id)

**Requiere:** Autenticación + Admin

**Descripción:** Elimina permanentemente el producto de la base de datos

### 5. Ver Reportes (GET /api/admin/marketplace/reports)

**Requiere:** Autenticación + Admin

**Query Parameters:**
- `status`: pendiente, revisado, accion_tomada

### 6. Procesar Reporte (PATCH /api/admin/marketplace/reports/:id)

**Requiere:** Autenticación + Admin

**Body:**
```json
{
  "actionTaken": "producto_eliminado"
}
```

### 7. Estadísticas (GET /api/admin/marketplace/stats)

**Requiere:** Autenticación + Admin

**Response:**
```json
{
  "success": true,
  "data": {
    "totalProducts": 1250,
    "productsByType": {
      "venta": 800,
      "donacion": 300,
      "trueque": 150
    },
    "productsByStatus": {
      "disponible": 600,
      "vendido": 400,
      "donado": 150,
      "intercambiado": 80,
      "eliminado": 20
    },
    "productsByCategory": {
      "transporte": 200,
      "ropa": 450,
      "juguetes": 300,
      "...": "..."
    },
    "totalTransactions": 630,
    "totalRevenue": 450000,
    "reportedProducts": 15,
    "averageViews": 45
  }
}
```

### 8. Ver Todas las Transacciones (GET /api/admin/marketplace/transactions)

**Requiere:** Autenticación + Admin

---

## 📝 Categorías Disponibles

- `transporte` - Carriolas, sillas de auto
- `ropa` - Ropa de bebé, mamá
- `juguetes` - Juguetes educativos
- `alimentacion` - Biberones, extractores
- `muebles` - Cunas, cambiadores
- `higiene` - Bañeras, pañaleras
- `libros` - Libros infantiles
- `maternidad` - Ropa de embarazo
- `electronica` - Monitores, calentadores
- `otros` - Otros artículos

## 🏷️ Condiciones del Producto

- `nuevo` - Nuevo sin usar
- `como_nuevo` - Como nuevo
- `buen_estado` - Buen estado
- `usado` - Usado

## 📍 Estados del Producto

- `disponible` - Disponible para compra/donación/trueque
- `reservado` - Reservado por alguien
- `vendido` - Vendido
- `donado` - Donado
- `intercambiado` - Intercambiado
- `eliminado` - Eliminado (soft delete)

---

## 🔐 Autenticación

Todos los endpoints que requieren autenticación deben incluir el header:

```
Authorization: Bearer {token}
```

---

## ⚠️ Códigos de Error

- `400` - Bad Request (validación fallida)
- `401` - Unauthorized (no autenticado)
- `403` - Forbidden (no tienes permisos)
- `404` - Not Found (recurso no encontrado)
- `500` - Internal Server Error

---

## 📱 Ejemplo de Flujo Completo

### Publicar un Producto

1. Usuario sube fotos a Firebase Storage
2. Obtiene URLs de las fotos
3. Llama a `POST /api/marketplace/products` con los datos
4. Recibe confirmación con ID del producto

### Comprar un Producto

1. Usuario ve producto con `GET /api/marketplace/products/:id`
2. Envía mensaje al vendedor con `POST /api/marketplace/messages`
3. Coordinan entrega por mensajes
4. Vendedor marca como vendido con `PATCH /api/marketplace/products/:id/status`
5. Se crea automáticamente una transacción

### Donar un Producto

1. Usuario crea producto con `type: "donacion"` y `price: null`
2. Alguien interesado envía mensaje
3. Coordinan entrega
4. Vendedor marca como `donado`

### Hacer Trueque

1. Usuario crea producto con `type: "trueque"` y especifica `tradeFor`
2. Otro usuario con ese artículo se interesa
3. Envían mensajes para coordinar
4. Ambos marcan sus productos como `intercambiado`

---

## 🚀 Características Futuras

- [ ] Sistema de calificaciones/reviews
- [ ] Chat en tiempo real
- [ ] Notificaciones push
- [ ] Geolocalización avanzada
- [ ] Sistema de pagos integrado
- [ ] Envío a domicilio
- [ ] Verificación de identidad
- [ ] Historial de compra/venta
- [ ] Recomendaciones personalizadas
- [ ] Búsqueda por imagen

---

## 📞 Soporte

Para más información sobre la implementación, consulta:
- `MARKETPLACE-ESTRUCTURA.md` - Estructura de datos
- `marketplace-endpoints.js` - Código de endpoints completo
- `server.js` - Implementación actual

---

¡El marketplace de Munpa está listo para conectar a las familias! 🎉

