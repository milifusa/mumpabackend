# API - PRODUCTOS DE PROFESIONALES

## Descripción General

Esta API permite a los profesionales registrados crear, gestionar y promocionar productos relacionados con sus servicios profesionales en el marketplace de Munpa. Los productos pueden ser consultas, talleres, productos físicos, servicios o asesorías.

## Endpoints

### 1. Obtener productos del profesional

**GET** `/api/professionals/me/products`

Obtiene todos los productos publicados por el profesional autenticado.

**Headers:**
```
Authorization: Bearer <token>
```

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "product_id",
      "professionalId": "prof_id",
      "professionalName": "Dr. María González",
      "professionalHeadline": "Pediatra especializada en desarrollo infantil",
      "title": "Consulta pediátrica virtual",
      "description": "Consulta completa para evaluación del desarrollo...",
      "serviceType": "consulta",
      "duration": 60,
      "isVirtual": true,
      "price": 150.00,
      "status": "disponible",
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ],
  "total": 1
}
```

### 2. Crear producto profesional

**POST** `/api/professionals/me/products`

Crea un nuevo producto o servicio profesional.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```json
{
  "title": "Consulta pediátrica virtual",
  "description": "Consulta completa para evaluación del desarrollo infantil, nutrición y vacunas",
  "category": "salud-infantil",
  "condition": "nuevo",
  "photos": ["url1.jpg", "url2.jpg"],
  "type": "venta",
  "price": 150.00,
  "location": {
    "city": "Madrid",
    "country": "España"
  },
  "serviceType": "consulta",
  "duration": 60,
  "isVirtual": true
}
```

**Campos requeridos:**
- `title`: Título del producto (10-100 caracteres)
- `description`: Descripción detallada (20-1000 caracteres)
- `category`: Categoría del marketplace
- `condition`: Condición del producto ("nuevo", "usado", "servicio")
- `photos`: Array de URLs de fotos (1-5 fotos)
- `type`: Tipo de transacción ("venta", "trueque", "donacion")
- `serviceType`: Tipo de servicio ("consulta", "taller", "producto", "servicio", "asesoria")

**Campos opcionales:**
- `price`: Precio (requerido si type="venta")
- `tradeFor`: Qué se busca a cambio (requerido si type="trueque")
- `location`: Ubicación del servicio
- `duration`: Duración en minutos (30-480 min para consultas/talleres)
- `isVirtual`: Si es un servicio virtual
- `maxParticipants`: Máximo participantes (para talleres, 1-50)

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "message": "Producto de servicio profesional publicado exitosamente",
  "data": {
    "id": "new_product_id",
    "professionalId": "prof_id",
    "title": "Consulta pediátrica virtual",
    "serviceType": "consulta",
    "price": 150.00,
    "status": "disponible"
  }
}
```

### 3. Actualizar producto profesional

**PUT** `/api/professionals/me/products/:productId`

Actualiza un producto existente del profesional.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Parámetros URL:**
- `productId`: ID del producto a actualizar

**Body:** (solo campos a actualizar)
```json
{
  "title": "Consulta pediátrica virtual - Actualizado",
  "price": 160.00,
  "duration": 75
}
```

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "message": "Producto actualizado exitosamente",
  "data": {
    "id": "product_id",
    "title": "Consulta pediátrica virtual - Actualizado",
    "price": 160.00,
    "duration": 75
  }
}
```

### 4. Eliminar producto profesional

**DELETE** `/api/professionals/me/products/:productId`

Elimina (marca como eliminado) un producto del profesional.

**Headers:**
```
Authorization: Bearer <token>
```

**Parámetros URL:**
- `productId`: ID del producto a eliminar

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "message": "Producto eliminado exitosamente"
}
```

## Tipos de Servicios Profesionales

- **consulta**: Consultas individuales (médicas, psicológicas, etc.)
- **taller**: Talleres grupales con límite de participantes
- **producto**: Productos físicos relacionados con la profesión
- **servicio**: Servicios profesionales diversos
- **asesoria**: Asesorías y consultorías

## Validaciones Especiales

### Para Consultas y Talleres:
- `duration`: Requerido, entre 30-480 minutos
- `isVirtual`: Opcional, indica si es servicio remoto

### Para Talleres:
- `maxParticipants`: Requerido, entre 1-50 participantes

### Precios:
- Para ventas: `price` > 0
- Para trueques: `tradeFor` debe tener al menos 5 caracteres

## Estados de Productos

- **disponible**: Activo y visible en el marketplace
- **vendido**: Ya no disponible (marcado automáticamente)
- **eliminado**: Eliminado por el profesional

## Integración con Perfiles Profesionales

Los productos creados a través de esta API se vinculan automáticamente al perfil profesional del usuario, permitiendo:

- Mostrar productos en el perfil profesional
- Filtrar productos por especialidad
- Recomendaciones basadas en el perfil profesional
- Estadísticas de servicios ofrecidos

## Consideraciones de Seguridad

- Solo usuarios con perfil profesional activo pueden crear productos
- Los productos se marcan automáticamente como `isProfessionalService: true`
- Validación estricta de todos los campos requeridos
- Vinculación automática con el perfil profesional del creador


---

## 5. Obtener productos de un recomendado (App usuario final)

**GET** `/api/recommendations/:recommendationId/products`

Retorna los productos/servicios que ofrece el profesional vinculado a un recomendado. Ideal para mostrar en la pantalla de detalle de un recomendado.

**Headers:**
```
Authorization: Bearer <token>
```

**Parámetros URL:**
- `recommendationId`: ID del recomendado

**Query Params (opcionales):**
- `serviceType`: Filtrar por tipo (`consulta`, `taller`, `producto`, `servicio`, `asesoria`)
- `limit`: Máximo de resultados (default: 20)

**Respuesta cuando tiene profesional vinculado (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "product_id",
      "title": "Consulta pediátrica virtual",
      "description": "Consulta completa para evaluación del desarrollo...",
      "serviceType": "consulta",
      "duration": 60,
      "isVirtual": true,
      "maxParticipants": null,
      "price": 150.00,
      "type": "venta",
      "photos": ["https://..."],
      "status": "disponible",
      "createdAt": "2024-01-15T10:00:00.000Z"
    }
  ],
  "total": 1,
  "hasProfessional": true,
  "professional": {
    "id": "prof_id",
    "name": "Dra. María González",
    "headline": "Pediatra especializada en desarrollo infantil",
    "specialty": "Pediatría",
    "photoUrl": "https://..."
  }
}
```

**Respuesta sin profesional vinculado (200):**
```json
{
  "success": true,
  "data": [],
  "total": 0,
  "hasProfessional": false
}
```

**Notas:**
- Solo retorna productos con status distinto a `eliminado`
- Solo funciona si el profesional vinculado tiene status `active`
- Si `hasProfessional: false`, el recomendado no tiene servicios profesionales
