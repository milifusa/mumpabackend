# 📍 Sistema de Ubicación con Coordenadas - Marketplace

## 🎯 Resumen

El marketplace ahora usa **latitud y longitud** para la ubicación de productos, permitiendo búsquedas por proximidad geográfica.

---

## 📦 Estructura de Ubicación

### Formato de Datos

```javascript
location: {
  latitude: 19.4326,           // REQUERIDO: Latitud (-90 a 90)
  longitude: -99.1332,         // REQUERIDO: Longitud (-180 a 180)
  address: "Av. Insurgentes Sur 1234",  // OPCIONAL: Dirección completa
  city: "Ciudad de México",    // OPCIONAL: Ciudad
  state: "CDMX",              // OPCIONAL: Estado
  country: "México"           // OPCIONAL: País (por defecto: México)
}
```

### Validaciones

- **latitude**: Número entre -90 y 90
- **longitude**: Número entre -180 y 180
- **address, city, state, country**: Strings opcionales para contexto

---

## 🔧 Endpoints Actualizados

### 1. Crear Producto

**POST** `/api/marketplace/products`

```json
{
  "title": "Carriola Evenflo",
  "description": "Carriola en excelente estado...",
  "category": "transporte",
  "condition": "como_nuevo",
  "photos": ["url1", "url2"],
  "type": "venta",
  "price": 1500,
  "location": {
    "latitude": 19.4326,
    "longitude": -99.1332,
    "address": "Av. Insurgentes Sur 1234",
    "city": "Ciudad de México",
    "state": "CDMX",
    "country": "México"
  }
}
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "id": "prod_123",
    "title": "Carriola Evenflo",
    "location": {
      "latitude": 19.4326,
      "longitude": -99.1332,
      "address": "Av. Insurgentes Sur 1234",
      "city": "Ciudad de México",
      "state": "CDMX",
      "country": "México"
    },
    // ... resto de datos
  }
}
```

---

### 2. Actualizar Producto

**PUT** `/api/marketplace/products/:id`

```json
{
  "location": {
    "latitude": 19.4326,
    "longitude": -99.1332,
    "address": "Nueva dirección",
    "city": "Ciudad de México"
  }
}
```

---

### 3. 🆕 Buscar Productos Cercanos (Por Proximidad)

**GET** `/api/marketplace/products/nearby`

#### Query Parameters

| Parámetro | Tipo | Requerido | Descripción | Default |
|-----------|------|-----------|-------------|---------|
| `latitude` | number | ✅ | Latitud del usuario | - |
| `longitude` | number | ✅ | Longitud del usuario | - |
| `radius` | number | ❌ | Radio de búsqueda en km | 50 |
| `type` | string | ❌ | venta, donacion, trueque | - |
| `category` | string | ❌ | Categoría del producto | - |
| `status` | string | ❌ | disponible, vendido, etc. | disponible |
| `minPrice` | number | ❌ | Precio mínimo | - |
| `maxPrice` | number | ❌ | Precio máximo | - |
| `search` | string | ❌ | Búsqueda en título/descripción | - |
| `orderBy` | string | ❌ | distancia, reciente, precio_asc, precio_desc | reciente |
| `page` | number | ❌ | Número de página | 1 |
| `limit` | number | ❌ | Productos por página | 20 |

#### Ejemplo de Uso

```bash
GET /api/marketplace/products/nearby?latitude=19.4326&longitude=-99.1332&radius=10&orderBy=distancia
```

#### Respuesta

```json
{
  "success": true,
  "data": [
    {
      "id": "prod_123",
      "title": "Carriola Evenflo",
      "location": {
        "latitude": 19.4300,
        "longitude": -99.1350,
        "city": "Ciudad de México"
      },
      "distance": 2.5,  // Distancia en kilómetros
      "price": 1500,
      // ... resto de datos
    }
  ],
  "searchParams": {
    "latitude": 19.4326,
    "longitude": -99.1332,
    "radius": 10
  },
  "pagination": {
    "total": 15,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
}
```

---

## 🌍 Cálculo de Distancia

El sistema usa la **fórmula de Haversine** para calcular la distancia entre dos puntos geográficos:

```javascript
// Fórmula implementada
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radio de la Tierra en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distancia en km
};
```

---

## 📱 Integración con el Frontend

### 1. Obtener Ubicación del Usuario

```javascript
// Usando la API de Geolocalización del navegador
navigator.geolocation.getCurrentPosition(
  (position) => {
    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;
    
    // Buscar productos cercanos
    fetch(`/api/marketplace/products/nearby?latitude=${latitude}&longitude=${longitude}&radius=20`)
      .then(res => res.json())
      .then(data => console.log(data));
  },
  (error) => {
    console.error('Error obteniendo ubicación:', error);
  }
);
```

### 2. Convertir Dirección a Coordenadas (Geocoding)

Puedes usar servicios como:

- **Google Maps Geocoding API**
- **OpenStreetMap Nominatim**
- **Mapbox Geocoding API**

Ejemplo con Google Maps:

```javascript
const geocodeAddress = async (address) => {
  const response = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=YOUR_API_KEY`
  );
  const data = await response.json();
  
  if (data.results.length > 0) {
    const location = data.results[0].geometry.location;
    return {
      latitude: location.lat,
      longitude: location.lng
    };
  }
  
  throw new Error('No se pudo geocodificar la dirección');
};
```

### 3. Mostrar Productos en un Mapa

```javascript
// Ejemplo con Google Maps
const map = new google.maps.Map(document.getElementById('map'), {
  center: { lat: userLat, lng: userLng },
  zoom: 12
});

// Agregar marcadores para cada producto
products.forEach(product => {
  new google.maps.Marker({
    position: {
      lat: product.location.latitude,
      lng: product.location.longitude
    },
    map: map,
    title: product.title
  });
});
```

---

## 🔍 Casos de Uso

### Caso 1: Productos Cerca de Mí

```javascript
// Usuario en CDMX busca productos en un radio de 5 km
GET /api/marketplace/products/nearby?latitude=19.4326&longitude=-99.1332&radius=5&orderBy=distancia
```

### Caso 2: Donaciones Cerca de Mí

```javascript
// Usuario busca donaciones en un radio de 10 km
GET /api/marketplace/products/nearby?latitude=19.4326&longitude=-99.1332&radius=10&type=donacion&orderBy=distancia
```

### Caso 3: Ropa de Bebé Cerca de Mí (Precio < $500)

```javascript
// Usuario busca ropa barata cerca
GET /api/marketplace/products/nearby?latitude=19.4326&longitude=-99.1332&radius=15&category=ropa&maxPrice=500&orderBy=precio_asc
```

### Caso 4: Búsqueda por Texto + Proximidad

```javascript
// Usuario busca "carriola" cerca de su ubicación
GET /api/marketplace/products/nearby?latitude=19.4326&longitude=-99.1332&search=carriola&orderBy=distancia
```

---

## ⚠️ Consideraciones Importantes

### 1. Privacidad

- No guardes la ubicación exacta del usuario sin su consentimiento
- Considera mostrar ubicaciones aproximadas (nivel de colonia/barrio)
- Permite al usuario elegir un punto de encuentro en lugar de su domicilio

### 2. Rendimiento

- El endpoint `/nearby` calcula distancias en memoria (no indexado en Firestore)
- Para mejorar rendimiento con muchos productos:
  - Considera usar **Firestore GeoQueries** (requiere índice geoespacial)
  - O servicios como **Firebase GeoFire**
  - O **Algolia** con búsqueda geográfica

### 3. Exactitud

- La fórmula de Haversine asume una Tierra esférica
- Precisión suficiente para distancias cortas (<500 km)
- Para mayor precisión, usa fórmulas más complejas (Vincenty)

### 4. Radio de Búsqueda

- **5-10 km**: Búsquedas locales (mismo vecindario)
- **20-30 km**: Búsquedas en la misma ciudad
- **50-100 km**: Búsquedas regionales

---

## 🔄 Migración de Datos Existentes

Si tienes productos con el formato antiguo (`state` y `city`), necesitarás:

1. **Obtener coordenadas** usando geocodificación
2. **Actualizar los documentos** en Firestore

### Script de Migración (ejemplo)

```javascript
const admin = require('firebase-admin');
const axios = require('axios');

async function geocodeAddress(city, state) {
  // Usar servicio de geocodificación (Google Maps, OpenStreetMap, etc.)
  const address = `${city}, ${state}, México`;
  // ... lógica de geocodificación
  return { latitude, longitude };
}

async function migrateProducts() {
  const db = admin.firestore();
  const productsSnapshot = await db.collection('marketplace_products').get();
  
  for (const doc of productsSnapshot.docs) {
    const product = doc.data();
    
    if (product.location && product.location.city && product.location.state) {
      // Si ya tiene coordenadas, skip
      if (product.location.latitude && product.location.longitude) {
        continue;
      }
      
      // Geocodificar
      try {
        const coords = await geocodeAddress(product.location.city, product.location.state);
        
        await doc.ref.update({
          'location.latitude': coords.latitude,
          'location.longitude': coords.longitude
        });
        
        console.log(`✅ Migrado: ${doc.id}`);
      } catch (error) {
        console.error(`❌ Error migrando ${doc.id}:`, error);
      }
    }
  }
  
  console.log('✅ Migración completada');
}

migrateProducts();
```

---

## 📊 Resumen de Cambios

| Aspecto | Antes | Después |
|---------|-------|---------|
| **Ubicación** | `{ state: "CDMX", city: "Coyoacán" }` | `{ latitude: 19.43, longitude: -99.13, city: "Coyoacán", state: "CDMX" }` |
| **Búsqueda** | Solo por estado/ciudad | Por proximidad (radio en km) |
| **Ordenamiento** | Reciente, precio | + **Distancia** |
| **Validación** | State y city requeridos | Latitude y longitude requeridos |
| **Cálculo** | N/A | Fórmula de Haversine |

---

## 🎉 Ventajas del Nuevo Sistema

✅ **Búsquedas más precisas** - Radio exacto en kilómetros  
✅ **Ordenamiento por distancia** - Ver productos más cercanos primero  
✅ **Integración con mapas** - Mostrar productos en Google Maps, etc.  
✅ **Mejor UX** - Usuarios encuentran productos cerca de ellos  
✅ **Escalable** - Compatible con servicios de geolocalización  

---

## 📞 Soporte

Para más información:
- [MARKETPLACE-ESTRUCTURA.md](./MARKETPLACE-ESTRUCTURA.md)
- [API-MARKETPLACE.md](./API-MARKETPLACE.md)
- [CATEGORIAS-MARKETPLACE.md](./CATEGORIAS-MARKETPLACE.md)

