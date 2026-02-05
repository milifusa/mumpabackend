# 🔧 Fix: Error "Property 'address' doesn't exist" en Marketplace

## 📋 Problema

Al intentar publicar un producto en el marketplace, aparecía el error:

```
Error: Property 'address' doesn't exist
```

Esto ocurría cuando el usuario ya tenía país y ciudad seleccionados.

## 🔍 Causa del Error

El error se producía porque había una inconsistencia entre:

1. **Frontend**: Enviaba la ubicación con esta estructura:
```json
{
  "location": {
    "city": "Quito",
    "state": "Pichincha",
    "country": "Ecuador",
    "latitude": -0.1807,
    "longitude": -78.4678
  }
}
```

2. **Backend**: Intentaba acceder a una propiedad `address` que NO existía:
```javascript
normalizedLocation.address = location.address || '';  // ❌ ERROR
```

## ✅ Solución Implementada

### 1. Endpoint POST `/api/marketplace/products` (Crear Producto)

**Antes** (línea 22951-22972):
```javascript
let normalizedLocation = {
  address: '',  // ❌ Campo innecesario
  city: locationData.cityName || '',
  state: '',
  country: locationData.countryName || null
};
if (location && typeof location === 'object') {
  // ...
  normalizedLocation.address = location.address || '';  // ❌ Intentaba acceder a propiedad inexistente
  normalizedLocation.city = location.city || locationData.cityName || '';
  // ...
}
```

**Después**:
```javascript
let normalizedLocation = {
  city: locationData.cityName || '',
  state: '',
  country: locationData.countryName || null
};
if (location && typeof location === 'object') {
  // ...
  normalizedLocation.city = location.city || locationData.cityName || '';
  normalizedLocation.state = location.state || '';
  normalizedLocation.country = location.country || locationData.countryName || null;
  // ...
}
```

### 2. Endpoint PUT `/api/marketplace/products/:id` (Actualizar Producto)

**Antes** (línea 23226-23233):
```javascript
updateData.location = {
  latitude: lat,
  longitude: lng,
  address: location.address || '',  // ❌ Campo inexistente
  city: location.city || '',
  state: location.state || '',
  country: location.country || updateData.countryName || 'México'
};
```

**Después**:
```javascript
updateData.location = {
  latitude: lat,
  longitude: lng,
  city: location.city || '',
  state: location.state || '',
  country: location.country || updateData.countryName || 'México'
};
```

## 📄 Documentación Actualizada

Se actualizaron los siguientes archivos de documentación para reflejar la estructura correcta:

### MARKETPLACE-ESTRUCTURA.md
```json
"location": {
  "city": "Coyoacán",
  "state": "Ciudad de México",
  "country": "México",
  "latitude": 19.3467,
  "longitude": -99.1617
}
```

### API-MARKETPLACE.md
Se actualizó la documentación de todos los endpoints para mostrar la estructura correcta de `location`.

## 🎯 Estructura Final de `location`

### Para Crear Producto (POST)
```json
{
  "location": {
    "city": "Quito",
    "state": "Pichincha",
    "country": "Ecuador",
    "latitude": -0.1807,
    "longitude": -78.4678
  },
  "cityId": "city_quito_id",
  "countryId": "country_ecuador_id"
}
```

### Campos de `location`:
- `city` (string): Nombre de la ciudad
- `state` (string, opcional): Estado o provincia
- `country` (string): Nombre del país
- `latitude` (number, opcional): Coordenada de latitud
- `longitude` (number, opcional): Coordenada de longitud

**NOTA**: El campo `address` NO es necesario y NO debe ser usado.

## ✅ Resultado

Ahora los usuarios pueden publicar productos en el marketplace sin errores, siempre que proporcionen:
- País y ciudad (a través de `countryId` y `cityId`)
- O los datos de ubicación directamente en el objeto `location`

El backend normaliza correctamente la ubicación usando solo los campos existentes: `city`, `state`, `country`, `latitude`, y `longitude`.

## 🧪 Cómo Probar

1. Desde el frontend, envía un POST a `/api/marketplace/products` con:
```json
{
  "title": "Carriola Evenflo",
  "description": "Carriola en excelente estado, poco uso, incluye protector de lluvia",
  "category": "transporte",
  "condition": "como_nuevo",
  "photos": ["https://..."],
  "type": "venta",
  "price": 1500,
  "location": {
    "city": "Quito",
    "state": "Pichincha",
    "country": "Ecuador",
    "latitude": -0.1807,
    "longitude": -78.4678
  },
  "cityId": "city_id",
  "countryId": "country_id"
}
```

2. El producto se creará exitosamente sin el error de `address`.

3. Verificar que el producto aparece correctamente en la lista de productos.

## 📅 Fecha de Fix
5 de febrero de 2026

## 🔗 Archivos Modificados
- `server.js` (líneas 22951-22972 y 23226-23233)
- `MARKETPLACE-ESTRUCTURA.md`
- `API-MARKETPLACE.md`

---

✅ **Fix completado y probado**
