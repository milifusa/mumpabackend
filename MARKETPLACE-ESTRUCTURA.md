# 🛍️ Estructura del Marketplace de Munpa

## 📋 Resumen del Sistema

Un marketplace donde los usuarios pueden:
- **Vender** productos de bebés/mamás
- **Donar** artículos que ya no necesitan
- **Hacer trueque** (intercambio) con otros usuarios

---

## 🗂️ Estructura de Datos en Firestore

### Colección: `marketplace_products`

```javascript
{
  id: "prod_123",
  userId: "user_abc",              // ID del usuario que publica
  userName: "María López",          // Nombre del usuario
  userPhoto: "https://...",         // Foto del usuario
  
  // Información del producto
  title: "Carriola Evenflo",
  description: "Carriola en excelente estado...",
  category: "transporte",           // categorías predefinidas
  condition: "como_nuevo",          // nuevo, como_nuevo, buen_estado, usado
  photos: [                         // Array de URLs de fotos
    "https://...",
    "https://..."
  ],
  
  // Tipo de transacción
  type: "venta",                    // venta, donacion, trueque
  price: 1500,                      // Solo si es venta (en pesos)
  tradeFor: "Cuna para bebé",       // Solo si es trueque - qué busca a cambio
  
  // Ubicación
  location: {
    city: "Coyoacán",
    state: "Ciudad de México",
    country: "México",
    latitude: 19.3467,
    longitude: -99.1617
  },
  
  // Estado del producto
  status: "disponible",             // disponible, reservado, vendido, donado, intercambiado, eliminado
  
  // Interacciones
  views: 45,                        // Número de vistas
  favorites: 12,                    // Número de favoritos
  messages: 8,                      // Número de mensajes recibidos
  
  // Timestamps
  createdAt: Timestamp,
  updatedAt: Timestamp,
  publishedAt: Timestamp,           // Cuando se publicó
  soldAt: null,                     // Cuando se vendió/donó/intercambió
  
  // Moderación
  isApproved: true,                 // Aprobado por admin
  isReported: false,                // Si fue reportado
  reportCount: 0,                   // Número de reportes
}
```

### Colección: `marketplace_transactions`

```javascript
{
  id: "trans_456",
  productId: "prod_123",
  productTitle: "Carriola Evenflo",
  
  // Usuarios involucrados
  sellerId: "user_abc",             // Usuario que vende/dona/intercambia
  sellerName: "María López",
  buyerId: "user_xyz",              // Usuario que compra/recibe/intercambia
  buyerName: "Juan Pérez",
  
  // Tipo de transacción
  type: "venta",                    // venta, donacion, trueque
  amount: 1500,                     // Precio (si es venta)
  tradeDetails: null,               // Detalles del trueque (si aplica)
  
  // Estado de la transacción
  status: "completada",             // pendiente, en_proceso, completada, cancelada
  
  // Timestamps
  createdAt: Timestamp,
  completedAt: Timestamp,
  
  // Ratings (opcional)
  sellerRating: 5,
  buyerRating: 5,
  sellerReview: "Excelente comprador",
  buyerReview: "Todo perfecto"
}
```

### Colección: `marketplace_favorites`

```javascript
{
  id: "fav_789",
  userId: "user_xyz",
  productId: "prod_123",
  createdAt: Timestamp
}
```

### Colección: `marketplace_messages`

```javascript
{
  id: "msg_101",
  productId: "prod_123",
  senderId: "user_xyz",
  senderName: "Juan Pérez",
  receiverId: "user_abc",
  receiverName: "María López",
  
  message: "Hola, ¿aún está disponible?",
  
  isRead: false,
  createdAt: Timestamp
}
```

### Colección: `marketplace_reports`

```javascript
{
  id: "rep_202",
  productId: "prod_123",
  reportedBy: "user_xyz",
  reporterName: "Juan Pérez",
  reason: "contenido_inapropiado",  // spam, fraude, contenido_inapropiado, etc.
  description: "El producto no corresponde...",
  
  status: "pendiente",               // pendiente, revisado, accion_tomada
  reviewedBy: null,                  // Admin que revisó
  reviewedAt: null,
  actionTaken: null,                 // producto_eliminado, advertencia, etc.
  
  createdAt: Timestamp
}
```

---

## 🎯 Categorías de Productos

```javascript
const categories = [
  'transporte',        // Carriolas, sillas de auto, etc.
  'ropa',             // Ropa de bebé, mamá
  'juguetes',         // Juguetes educativos, etc.
  'alimentacion',     // Biberones, extractores, etc.
  'muebles',          // Cunas, cambiadores, etc.
  'higiene',          // Bañeras, pañaleras, etc.
  'libros',           // Libros infantiles, de crianza
  'maternidad',       // Ropa de embarazo, accesorios
  'electronica',      // Monitores, calentadores
  'otros'             // Otros artículos
];
```

---

## 🔐 Permisos y Roles

### Usuario Regular
- ✅ Publicar productos (venta, donación, trueque)
- ✅ Ver todos los productos disponibles
- ✅ Enviar mensajes a vendedores
- ✅ Agregar productos a favoritos
- ✅ Reportar productos inapropiados
- ✅ Ver su propio historial de publicaciones
- ✅ Marcar productos como vendidos/donados

### Administrador
- ✅ Ver todos los productos (incluso eliminados)
- ✅ Aprobar/rechazar productos
- ✅ Eliminar productos inapropiados
- ✅ Ver reportes y tomar acciones
- ✅ Ver estadísticas del marketplace
- ✅ Ver todas las transacciones
- ✅ Gestionar usuarios problemáticos

---

## 🚀 Endpoints - API para Usuarios

### Productos

#### `GET /api/marketplace/products`
Obtener lista de productos con filtros
- Query params: `type`, `category`, `status`, `minPrice`, `maxPrice`, `location`, `search`
- Paginación: `page`, `limit`
- Orden: `orderBy` (reciente, precio_asc, precio_desc)

#### `GET /api/marketplace/products/:id`
Obtener detalle de un producto específico
- Incrementa contador de vistas

#### `POST /api/marketplace/products`
Crear nuevo producto
- Requiere autenticación
- Body: título, descripción, categoría, tipo, precio, fotos, etc.

#### `PUT /api/marketplace/products/:id`
Actualizar producto propio
- Solo el dueño puede editar

#### `DELETE /api/marketplace/products/:id`
Eliminar producto propio (soft delete)
- Cambia status a "eliminado"

#### `PATCH /api/marketplace/products/:id/status`
Cambiar estado del producto
- disponible → vendido/donado/intercambiado

### Favoritos

#### `GET /api/marketplace/favorites`
Obtener productos favoritos del usuario

#### `POST /api/marketplace/favorites/:productId`
Agregar producto a favoritos

#### `DELETE /api/marketplace/favorites/:productId`
Quitar producto de favoritos

### Mensajes

#### `GET /api/marketplace/messages`
Obtener conversaciones del usuario

#### `GET /api/marketplace/messages/:productId`
Obtener mensajes de un producto específico

#### `POST /api/marketplace/messages`
Enviar mensaje sobre un producto

#### `PATCH /api/marketplace/messages/:id/read`
Marcar mensaje como leído

### Transacciones

#### `GET /api/marketplace/transactions`
Obtener transacciones del usuario (como comprador o vendedor)

#### `POST /api/marketplace/transactions`
Crear nueva transacción
- Se crea cuando un producto cambia a vendido/donado/intercambiado

### Reportes

#### `POST /api/marketplace/reports`
Reportar un producto inapropiado

### Mis Publicaciones

#### `GET /api/marketplace/my-products`
Obtener productos publicados por el usuario actual

---

## 🛠️ Endpoints - API para Administrador

### Productos

#### `GET /api/admin/marketplace/products`
Ver todos los productos (incluye eliminados, pendientes de aprobación)

#### `PATCH /api/admin/marketplace/products/:id/approve`
Aprobar un producto

#### `PATCH /api/admin/marketplace/products/:id/reject`
Rechazar un producto

#### `DELETE /api/admin/marketplace/products/:id`
Eliminar permanentemente un producto

### Reportes

#### `GET /api/admin/marketplace/reports`
Ver todos los reportes

#### `PATCH /api/admin/marketplace/reports/:id`
Revisar y tomar acción sobre un reporte

### Estadísticas

#### `GET /api/admin/marketplace/stats`
Obtener estadísticas del marketplace
- Total de productos por tipo
- Transacciones por mes
- Categorías más populares
- Usuarios más activos

### Transacciones

#### `GET /api/admin/marketplace/transactions`
Ver todas las transacciones del sistema

---

## 📊 Estadísticas y Métricas

### Métricas Clave
- Total de productos publicados
- Productos activos vs completados
- Tasa de conversión (publicado → vendido)
- Productos por categoría
- Promedio de tiempo hasta venta
- Usuarios más activos
- Productos más vistos
- Tendencias por tipo (venta vs donación vs trueque)

---

## 🔔 Notificaciones (Futuro)

- Nuevo mensaje sobre tu producto
- Alguien marcó tu producto como favorito
- Tu producto fue vendido/intercambiado
- Nuevo producto en categoría favorita
- Precio reducido en producto favorito

---

## 🎨 Flujo de Usuario

### Publicar Producto
1. Usuario completa formulario
2. Sube fotos (máximo 5)
3. Selecciona tipo: venta/donación/trueque
4. Publica → Estado: "disponible"

### Comprar/Obtener Producto
1. Usuario ve producto
2. Envía mensaje al vendedor
3. Coordinan entrega
4. Vendedor marca como "vendido"
5. Se crea transacción automáticamente

### Hacer Trueque
1. Usuario publica "busco X a cambio de Y"
2. Otro usuario con X interesado
3. Se comunican
4. Coordinan intercambio
5. Ambos marcan como "intercambiado"

---

## 🛡️ Validaciones y Seguridad

- Máximo 5 fotos por producto
- Título: 10-100 caracteres
- Descripción: 20-1000 caracteres
- Precio: solo números positivos
- Fotos obligatorias (mínimo 1)
- Usuario debe tener perfil completo
- Rate limiting: máximo 10 productos por día
- Moderación de contenido inapropiado

---

## 💾 Almacenamiento de Imágenes

- Firebase Storage
- Path: `/marketplace/{userId}/{productId}/{photoIndex}.jpg`
- Tamaño máximo por foto: 5MB
- Formatos: JPG, PNG, WEBP
- Compresión automática

---

¿Procedemos con la implementación? 🚀

