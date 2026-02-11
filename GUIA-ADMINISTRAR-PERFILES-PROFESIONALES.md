# 📋 Guía: Administrar Perfiles Médicos y de Servicio

Esta guía documenta todas las APIs que los usuarios deben usar para administrar sus perfiles profesionales en la app Munpa: **perfil médico** (consultas) y **perfil de servicio** (productos/vendedor).

---

## 🎯 Tipos de Perfil

| Tipo | Descripción | Uso Principal |
|------|-------------|---------------|
| **Médico / Especialista** | Da consultas médicas (chat/video) | Atención a pacientes, cobra por consulta |
| **Servicio / Vendedor** | Vende productos en el marketplace | Publicar productos, gestionar ventas |

Un usuario puede tener **uno o ambos** tipos de perfil (si está aprobado para cada uno).

---

## 📱 Base URL

```
https://api.munpa.online
```

**Headers requeridos (todas las peticiones):**
```http
Authorization: Bearer {token_usuario}
Content-Type: application/json
```

---

# 1️⃣ PERFIL MÉDICO (Consultas)

## 1.1 Verificar si tengo perfil médico

```http
GET /api/profile/professional
```

**Respuesta con perfil médico:**
```json
{
  "success": true,
  "data": {
    "hasProfessionalProfile": true,
    "type": "specialist",
    "specialistId": "abc123",
    "status": "active",
    "specialist": {
      "displayName": "Dr. Juan Pérez",
      "photoUrl": "https://...",
      "specialties": ["Pediatra"],
      "stats": { "totalConsultations": 120, "averageRating": 4.8 },
      "pricing": {
        "chatConsultation": 25,
        "videoConsultation": 40,
        "currency": "USD"
      }
    }
  }
}
```

**Respuesta sin perfil:**
```json
{
  "success": true,
  "data": {
    "hasProfessionalProfile": false
  }
}
```

---

## 1.2 Solicitar ser profesional médico

Si no tienes perfil, debes enviar una solicitud. Primero sube los documentos:

### Subir documentos (título, cédula, licencia)

```http
POST /api/professionals/requests/upload-document
Content-Type: multipart/form-data
```

**Body (FormData):**
- `document`: archivo (PDF o imagen: JPEG, PNG, HEIC)
- Tamaño máximo: 10 MB

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "url": "https://storage.googleapis.com/.../doc-xxx.pdf",
    "storagePath": "documents/professional-requests/doc-xxx.pdf",
    "fileName": "titulo.pdf"
  }
}
```

### Enviar solicitud

```http
POST /api/profile/request-professional
Content-Type: application/json
```

**Body:**
```json
{
  "accountType": "specialist",
  "personalInfo": {
    "displayName": "Dr. Juan Pérez",
    "phone": "+593999999999",
    "bio": "Pediatra con 10 años de experiencia..."
  },
  "professional": {
    "specialties": ["Pediatría", "Neonatología"],
    "licenseNumber": "MSP-12345",
    "university": "Universidad Central",
    "yearsExperience": 10,
    "certifications": ["Certificación en Pediatría"]
  },
  "documents": [
    "https://storage.googleapis.com/.../titulo.pdf",
    "https://storage.googleapis.com/.../cedula.pdf"
  ]
}
```

**Valores de `accountType`:** `specialist` | `nutritionist` | `coach` | `psychologist`

---

## 1.3 Panel del especialista (gestión de consultas)

Solo usuarios con perfil médico activo.

### Listar mis consultas

```http
GET /api/specialist/consultations?status=pending&page=1&limit=20
```

**Query params:** `status` (pending|accepted|in_progress|completed), `type` (chat|video), `page`, `limit`

### Detalle de consulta

```http
GET /api/specialist/consultations/:consultationId
```

### Aceptar consulta

```http
POST /api/specialist/consultations/:consultationId/accept
```

**Body (opcional):**
```json
{
  "scheduledFor": "2026-02-15T10:00:00.000Z"
}
```

### Rechazar consulta

```http
POST /api/specialist/consultations/:consultationId/reject
```

**Body:**
```json
{
  "reason": "No disponible en esa fecha"
}
```

### Iniciar consulta

```http
POST /api/specialist/consultations/:consultationId/start
```

### Completar consulta

```http
POST /api/specialist/consultations/:consultationId/complete
```

**Body:**
```json
{
  "diagnosis": "Resfriado común",
  "treatment": "Reposo y líquidos",
  "notes": "Seguimiento en 3 días"
}
```

### Horario de atención (consultar)

```http
GET /api/specialist/availability
```

**Respuesta:** `schedule`, `timezone`, `maxConsultationsPerDay`

### Actualizar horario de atención

```http
PUT /api/specialist/availability
Content-Type: application/json
```

**Body:**
```json
{
  "schedule": {
    "monday": ["09:00-13:00", "15:00-19:00"],
    "tuesday": ["09:00-13:00"],
    "wednesday": ["09:00-13:00", "15:00-19:00"]
  },
  "timezone": "America/Guayaquil",
  "maxConsultationsPerDay": 10
}
```

- `schedule`: Por día (monday, tuesday, etc.), array de franjas "HH:MM-HH:MM"
- `timezone`: Zona horaria (ej: America/Guayaquil)
- `maxConsultationsPerDay`: Máximo de consultas por día

### Historial de consultas

```http
GET /api/specialist/consultations/history?page=1&limit=20
```

Devuelve consultas completadas con paginación. Incluye paciente, tipo, resultado, precio, fecha, valoración.

### Actualizar precios

```http
PUT /api/specialist/pricing
Content-Type: application/json
```

**Body:**
```json
{
  "chatConsultation": 25,
  "videoConsultation": 40,
  "currency": "USD",
  "acceptsFreeConsultations": false
}
```

### Estadísticas

```http
GET /api/specialist/stats?period=month
```

**Query params:** `period` = `week` | `month` | `all` (por defecto: month)

**Respuesta:** consultas del período, ingresos, valoración promedio, tiempo de respuesta, tasa de completado, por tipo (chat/video).

### Cupones activos (promociones en consultas)

```http
GET /api/specialist/coupons
```

Devuelve los cupones de descuento que aplican a tus consultas (creados por admin). Incluye código, tipo, valor, usos, vigencia.

---

## 1.4 Actualizar perfil médico (datos generales)

Si el perfil fue creado vía `userId` (artículos) y tienes acceso:

```http
GET /api/professionals/me
PUT /api/professionals/me
```

**PUT Body (campos editables):**
```json
{
  "name": "Dr. Juan Pérez",
  "bio": "Nueva biografía...",
  "headline": "Pediatra especializado",
  "specialties": ["Pediatría", "Neonatología"],
  "location": "Quito",
  "contactPhone": "+593999999999",
  "contactEmail": "juan@email.com",
  "website": "https://miweb.com"
}
```

### Subir foto de perfil

```http
POST /api/professionals/upload-photo
Content-Type: multipart/form-data
```

**Body:** `photo` o `image` (archivo)

---

# 2️⃣ PERFIL DE SERVICIO (Productos / Vendedor)

## 2.1 Verificar si tengo perfil de servicio

```http
GET /api/profile/professional
```

**Respuesta con perfil de servicio:**
```json
{
  "success": true,
  "data": {
    "hasProfessionalProfile": true,
    "type": "service",
    "specialistId": "vendor123",
    "specialist": {
      "displayName": "Mi Tienda de Bebés",
      "isSeller": true,
      "productsCount": 12,
      "productsAvailable": 8,
      "contactPhone": "+593999999999",
      "website": "https://...",
      "instagram": "mitienda"
    }
  }
}
```

---

## 2.2 Solicitar perfil de servicio

```http
POST /api/profile/request-service
Content-Type: application/json
```

**Body:**
```json
{
  "businessName": "Mi Tienda de Bebés",
  "profileCategoryId": "y5pF4S6Ao8o47WdaUa3C",
  "countryId": "8vxktoVnUFO89rOx5RGJ",
  "cityId": "m9Xvkq7Bf9Q2aUgi5yn7",
  "address": "Av. Principal 123",
  "summary": "Tienda especializada en productos para bebés",
  "extraInfo": "Envíos a todo el país",
  "whatsappLink": "+593999999999",
  "instagram": "mitienda",
  "website": "https://mitienda.com",
  "logoUrl": "https://storage.googleapis.com/.../logo.jpg"
}
```

**Campos requeridos:** `businessName`, `profileCategoryId`

**Logo:** Subir primero a Storage y pasar la URL, o usar endpoint de upload si existe.

---

## 2.3 Gestionar productos

### Listar categorías del marketplace

```http
GET /api/marketplace/categories
```

### Crear producto

```http
POST /api/marketplace/products
Content-Type: application/json
```

**Body:**
```json
{
  "title": "Cuna portátil para bebé - excelente estado",
  "description": "Cuna portátil práctica para viajes. Incluye colchón. Uso cuidado, como nueva.",
  "category": "ID_CATEGORIA",
  "condition": "good",
  "photos": [
    "https://storage.googleapis.com/.../foto1.jpg",
    "https://storage.googleapis.com/.../foto2.jpg"
  ],
  "type": "sale",
  "price": 85,
  "location": "Quito",
  "cityId": "m9Xvkq7Bf9Q2aUgi5yn7",
  "countryId": "8vxktoVnUFO89rOx5RGJ"
}
```

**Valores de `type`:** `sale` | `donation` | `trade`  
**Valores de `condition`:** `new` | `like_new` | `good` | `used`  
**Fotos:** 1-5 imágenes, subir primero a Storage

### Mis productos

```http
GET /api/marketplace/my-products?status=available&page=1&limit=20
```

### Actualizar producto

```http
PUT /api/marketplace/products/:productId
Content-Type: application/json
```

**Body:** mismos campos que crear (parcial).

**Promociones (solo productos de venta):**
```json
{
  "promoPrice": 15,
  "discountPercentage": 20,
  "promoValidUntil": "2026-03-31T23:59:59.000Z",
  "promoLabel": "Oferta de temporada"
}
```
- `promoPrice`: precio promocional fijo (opcional)
- `discountPercentage`: % de descuento (opcional, alternativa a promoPrice)
- `promoValidUntil`: fecha de fin de la promoción
- `promoLabel`: etiqueta visible (ej: "20% OFF")
- `promoClear: true` para quitar la promoción

### Eliminar producto

```http
DELETE /api/marketplace/products/:productId
```

### Cambiar estado (vendido, donado, etc.)

```http
PATCH /api/marketplace/products/:productId/status
Content-Type: application/json
```

**Body:**
```json
{
  "status": "sold"
}
```

**Valores:** `available` | `reserved` | `sold` | `donated` | `traded` | `deleted`

### Mensajes recibidos

```http
GET /api/marketplace/messages
GET /api/marketplace/messages/:productId
```

### Marcar mensaje como leído

```http
PATCH /api/marketplace/messages/:id/read
```

### Transacciones (ventas realizadas)

```http
GET /api/marketplace/transactions
```

### Horario de apertura y cierre (consultar)

```http
GET /api/vendor/hours
```

**Respuesta:** `schedule` (por día: open, close), `timezone`

### Actualizar horario de apertura y cierre

```http
PUT /api/vendor/hours
Content-Type: application/json
```

**Body:**
```json
{
  "schedule": {
    "monday": { "open": "09:00", "close": "18:00" },
    "tuesday": { "open": "09:00", "close": "18:00" },
    "wednesday": { "open": "09:00", "close": "14:00" },
    "saturday": { "open": "10:00", "close": "13:00" }
  },
  "timezone": "America/Guayaquil"
}
```

- `schedule`: Por día, `open` y `close` en formato "HH:MM"
- Para indicar cerrado: `"sunday": null`

### Historial de ventas

```http
GET /api/vendor/sales?page=1&limit=20
```

Devuelve ventas realizadas (como vendedor) con paginación. Incluye producto, comprador, monto, tipo, fecha.

### Estadísticas y ganancias (vendedor)

```http
GET /api/vendor/stats?period=month
```

**Query params:** `period` = `week` | `month` | `all` (por defecto: month)

**Respuesta:** ganancias del período, ventas totales, productos (disponibles/vendidos), vistas, mensajes sin leer, por tipo (venta/donación/trueque).

### Promociones activas (productos con descuento)

```http
GET /api/vendor/promotions
```

Devuelve tus productos con promoción activa (precio original, precio efectivo, etiqueta, vigencia).

---

# 3️⃣ SUBIR IMÁGENES

## Perfil / Logo

```http
POST /api/upload/image
Content-Type: multipart/form-data
```

**Body:** `image` (archivo)

**Respuesta:** incluye `url` de la imagen subida.

## Documentos

```http
POST /api/professionals/requests/upload-document
Content-Type: multipart/form-data
```

**Body:** `document` (PDF o imagen)

---

# 4️⃣ UBICACIONES

## Países y ciudades

```http
GET /api/locations/countries
GET /api/locations/cities?countryId=8vxktoVnUFO89rOx5RGJ
```

Necesarios para formularios de dirección.

---

# 5️⃣ CATEGORÍAS DE PERFIL

## Categorías para profesionales (médicos/servicios)

```http
GET /api/professionals/profile-categories
GET /api/professionals/service-categories
```

Devuelve lista de categorías con `id`, `name`, `logoUrl` para usarlas en `profileCategoryId`.

---

# 6️⃣ FLUJO COMPLETO POR TIPO

## Flujo: Obtener perfil MÉDICO

```
1. GET /api/profile/professional
   → Si hasProfessionalProfile: false

2. POST /api/professionals/requests/upload-document (× N documentos)
   → Obtener URLs

3. POST /api/profile/request-professional
   → Esperar aprobación del admin

4. Admin aprueba → usuario recibe professionalProfile

5. GET /api/profile/professional
   → hasProfessionalProfile: true, type: specialist

6. Usar panel: GET /api/specialist/consultations, etc.
   PUT /api/specialist/availability
   PUT /api/specialist/pricing
```

## Flujo: Obtener perfil de SERVICIO

```
1. GET /api/profile/professional
   → Si hasProfessionalProfile: false o type !== 'service'

2. POST /api/profile/request-service
   → Enviar datos del negocio

3. Admin aprueba → se crea profesional y se vincula al usuario

4. GET /api/profile/professional
   → hasProfessionalProfile: true, type: service

5. Gestionar productos:
   POST /api/marketplace/products
   GET /api/marketplace/my-products
   PUT /api/marketplace/products/:id
   PATCH /api/marketplace/products/:id/status
```

---

# 7️⃣ RESUMEN DE ENDPOINTS POR ACCIÓN

| Acción | Endpoint | Método |
|--------|----------|--------|
| **Verificar perfil** | `/api/profile/professional` | GET |
| **Solicitar médico** | `/api/profile/request-professional` | POST |
| **Subir documento** | `/api/professionals/requests/upload-document` | POST |
| **Solicitar servicio** | `/api/profile/request-service` | POST |
| **Mis consultas** | `/api/specialist/consultations` | GET |
| **Aceptar/Rechazar consulta** | `/api/specialist/consultations/:id/accept` o `reject` | POST |
| **Iniciar/Completar consulta** | `/api/specialist/consultations/:id/start` o `complete` | POST |
| **Horario de atención** | `/api/specialist/availability` | GET, PUT |
| **Historial consultas** | `/api/specialist/consultations/history` | GET |
| **Precios** | `/api/specialist/pricing` | PUT |
| **Estadísticas** | `/api/specialist/stats` | GET |
| **Cupones** | `/api/specialist/coupons` | GET |
| **Mi perfil (artículos)** | `/api/professionals/me` | GET, PUT |
| **Subir foto perfil** | `/api/professionals/upload-photo` | POST |
| **Crear producto** | `/api/marketplace/products` | POST |
| **Mis productos** | `/api/marketplace/my-products` | GET |
| **Editar producto** | `/api/marketplace/products/:id` | PUT |
| **Eliminar producto** | `/api/marketplace/products/:id` | DELETE |
| **Estado producto** | `/api/marketplace/products/:id/status` | PATCH |
| **Mensajes** | `/api/marketplace/messages` | GET |
| **Transacciones** | `/api/marketplace/transactions` | GET |
| **Horario apertura** | `/api/vendor/hours` | GET, PUT |
| **Historial ventas** | `/api/vendor/sales` | GET |
| **Estadísticas vendedor** | `/api/vendor/stats` | GET |
| **Promociones vendedor** | `/api/vendor/promotions` | GET |
| **Categorías** | `/api/marketplace/categories` | GET |
| **Ubicaciones** | `/api/locations/countries`, `/api/locations/cities` | GET |

---

# 8️⃣ CÓDIGOS DE ERROR COMUNES

| Código | Significado |
|--------|--------------|
| 400 | Datos inválidos o faltantes |
| 401 | Token inválido o expirado |
| 403 | Sin permisos (ej: no tienes perfil profesional) |
| 404 | Recurso no encontrado |
| 500 | Error del servidor |

---

**Última actualización:** Febrero 2026
