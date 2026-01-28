# API - Países y Ciudades

Base: `https://api.munpa.online`

## App (lectura)

### Listar países activos
`GET /api/locations/countries`

Headers:
- `Authorization: Bearer <token>`

Respuesta:
```json
{
  "success": true,
  "data": [
    { "id": "country_1", "name": "Ecuador" }
  ]
}
```

### Listar ciudades activas por país
`GET /api/locations/cities?countryId=COUNTRY_ID`

Headers:
- `Authorization: Bearer <token>`

Respuesta:
```json
{
  "success": true,
  "data": [
    { "id": "city_1", "name": "Quito", "countryId": "country_1" }
  ]
}
```

### Obtener ciudad y país por lat/long
`GET /api/locations/reverse?latitude=LAT&longitude=LNG`

Headers:
- `Authorization: Bearer <token>`

Respuesta:
```json
{
  "success": true,
  "data": {
    "latitude": -0.1807,
    "longitude": -78.4678,
    "city": "Quito",
    "country": "Ecuador"
  }
}
```

## Admin (CRUD)

### Crear país
`POST /api/admin/locations/countries`

Body:
```json
{ "name": "Ecuador", "isActive": true }
```

### Listar países
`GET /api/admin/locations/countries`

### Actualizar país
`PUT /api/admin/locations/countries/:countryId`

Body:
```json
{ "name": "Ecuador", "isActive": true }
```

### Crear ciudad
`POST /api/admin/locations/cities`

Body:
```json
{ "name": "Quito", "countryId": "country_1", "isActive": true }
```

### Listar ciudades
`GET /api/admin/locations/cities?countryId=COUNTRY_ID`

### Actualizar ciudad
`PUT /api/admin/locations/cities/:cityId`

Body:
```json
{ "name": "Quito", "countryId": "country_1", "isActive": true }
```

---

## Actualizar ubicación del usuario (App)
`PUT /api/auth/location`

Headers:
- `Authorization: Bearer <token>`

Body:
```json
{
  "latitude": -0.1807,
  "longitude": -78.4678,
  "countryId": "country_1",
  "cityId": "city_1"
}
```

Respuesta:
```json
{
  "success": true,
  "message": "Ubicación actualizada",
  "data": {
    "uid": "USER_ID",
    "latitude": -0.1807,
    "longitude": -78.4678,
    "countryId": "country_1",
    "countryName": "Ecuador",
    "cityId": "city_1",
    "cityName": "Quito"
  }
}
```

