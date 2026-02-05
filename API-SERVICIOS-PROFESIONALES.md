## API Servicios Profesionales

Requiere `Authorization: Bearer <token>` salvo donde se indique.

### Perfil profesional

- `POST /api/professionals` crear perfil (usuario)
- `POST /api/professionals/upload-photo`
- `GET /api/professionals/avatar?name=...` (proxy para avatar)
- `GET /api/professionals/photo?url=...` (proxy para foto)
- `GET /api/professionals/me`
- `PUT /api/professionals/me`
- `GET /api/professionals` (lista pública, solo activos)
- `GET /api/professionals/:id` (detalle público)
- `POST /api/professionals/:id/services` (admin, crear servicio)
- `POST /api/professionals/:id/packages` (admin, crear paquete)
- `PUT /api/professionals/:id` (admin)
- `GET /api/admin/professionals` (admin, lista completa)
- `PATCH /api/admin/professionals/:id/status` (admin)
- `PATCH /api/admin/professionals/:id/link-user` (admin, enlazar usuario)

### Solicitud de servicios (pre-registro)

- `POST /api/professionals/requests/upload-logo`
- `POST /api/professionals/requests`
- `GET /api/admin/professionals/requests`
- `GET /api/admin/professionals/requests/:id`
- `PUT /api/admin/professionals/requests/:id`
- `PATCH /api/admin/professionals/requests/:id/status`

Body ejemplo (crear solicitud):
```json
{
  "businessName": "Mi negocio",
  "summary": "Resumen emocional de tu negocio...",
  "profileCategoryId": "PROFILE_CATEGORY_ID",
  "logoUrl": "https://...",
  "address": "Quito, Ecuador",
  "countryId": "COUNTRY_ID",
  "cityId": "CITY_ID",
  "latitude": -0.1807,
  "longitude": -78.4678,
  "website": "https://...",
  "instagram": "@miinsta",
  "whatsappLink": "https://wa.me/593...",
  "extraInfo": "info adicional"
}
```

Al aprobar (`status=approved`) se crea automáticamente un perfil profesional:
- `name` = `businessName`
- `headline` y `bio` = `summary`
- `photoUrl` y `logoUrl` = `logoUrl`
- `location` = `address`
- `latitude`, `longitude`, `website`, `instagram`, `whatsappLink`, `extraInfo`

Campos obligatorios para aprobar:
`businessName`, `summary`, `profileCategoryId`, `logoUrl`,
`address`, `countryId`, `cityId`, `latitude`, `longitude`, `userId`.

Upload logo (multipart/form-data):
- campo: `logo` (o `image`)
- formato: PNG o JPG
- respuesta: `imageUrl`, `imageStoragePath`

Proxy logo (CORS dashboard):
- `GET /api/professionals/requests/logo?url=...`

Campos principales:
```json
{
  "name": "Dra. Ana Perez",
  "profileCategoryId": "PROFILE_CATEGORY_ID",
  "headline": "Pediatra y consultora de lactancia",
  "bio": "Texto largo...",
  "photoUrl": "https://...",
  "specialties": ["pediatría", "lactancia"],
  "tags": ["bebés", "postparto"],
  "location": "Quito, Ecuador",
  "countryId": "COUNTRY_ID",
  "cityId": "CITY_ID",
  "locations": [
    { "countryId": "ECUADOR_ID", "cityId": "QUITO_ID" },
    { "countryId": "COLOMBIA_ID", "cityId": "BOGOTA_ID" }
  ],
  "contactEmail": "ana@correo.com",
  "contactPhone": "+593...",
  "website": "https://..."
}
```

Nota: `countryId` y `cityId` deben existir en la base de datos (colecciones `countries` y `cities`).
Si envías `locations`, puedes incluir varias ciudades (incluso de distintos países).
`profileCategoryId` es obligatorio al crear el perfil y debe existir en `professional_profile_categories`.

Upload de foto (multipart/form-data):
- campo: `photo`
- respuesta: `photoUrl`, `photoStoragePath`

### Servicios (por profesional)

- `GET /api/professionals/me/services`
- `POST /api/professionals/me/services`
- `PUT /api/professionals/me/services/:serviceId`
- `DELETE /api/professionals/me/services/:serviceId`

### Categorías de perfil profesional

- `GET /api/professionals/profile-categories`
- `POST /api/admin/professionals/profile-categories`
- `POST /api/admin/professionals/profile-categories/upload-logo`
- `PUT /api/admin/professionals/profile-categories/:id`
- `DELETE /api/admin/professionals/profile-categories/:id`

Body ejemplo:
```json
{ "name": "Pediatría", "description": "Perfil profesional", "logoUrl": "https://..." }
```

### Categorías de servicios

- `GET /api/professionals/service-categories`
- `POST /api/admin/professionals/service-categories`
- `POST /api/admin/professionals/service-categories/upload-logo`
- `PUT /api/admin/professionals/service-categories/:id`
- `DELETE /api/admin/professionals/service-categories/:id`

Body ejemplo:
```json
{ "name": "Lactancia", "description": "Servicios de lactancia", "logoUrl": "https://..." }
```

Body ejemplo:
```json
{
  "title": "Consulta de lactancia",
  "description": "Sesión 60 min",
  "price": 35,
  "currency": "USD",
  "type": "consulta",
  "categoryId": "CATEGORY_ID",
  "durationMinutes": 60,
  "isActive": true,
  "mediaUrl": "https://..."
}
```

### Paquetes (por profesional)

- `GET /api/professionals/me/packages`
- `GET /api/professionals/:id/packages` (admin)
- `POST /api/professionals/me/packages`
- `PUT /api/professionals/me/packages/:packageId`
- `DELETE /api/professionals/me/packages/:packageId`

Body ejemplo:
```json
{
  "title": "Paquete 3 sesiones",
  "description": "Seguimiento mensual",
  "price": 90,
  "sessionCount": 3
}
```

### Estructura Firestore

```
professionals/{id}
{
  userId, name, headline, bio, photoUrl,
  specialties: [], tags: [],
  profileCategoryId, profileCategory: { id, name, logoUrl },
  location, countryId, countryName, cityId, cityName,
  locations: [{ countryId, countryName, cityId, cityName }],
  contactEmail, contactPhone, website,
  status: "pending" | "active" | "suspended",
  createdAt, updatedAt
}

professionals/{id}/services/{serviceId}
{
  title, description, price, currency,
  type, categoryId, durationMinutes, isActive, mediaUrl,
  createdAt, updatedAt
}

professional_service_categories/{id}
{
  name, description, slug, createdAt, updatedAt
}

professionals/{id}/packages/{packageId}
{
  title, description, price, sessionCount,
  createdAt, updatedAt
}
```
