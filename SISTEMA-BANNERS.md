# 🎨 Sistema de Banners Rotativos - Munpa

## 📋 Resumen

Sistema completo para gestionar **banners rotativos** en la aplicación, con control desde el dashboard de administración.

### Características

✅ **Control de orden** - Especifica el orden de aparición  
✅ **Tiempo de visibilidad** - Define cuántos segundos se muestra cada banner  
✅ **Fechas de activación** - Programa inicio y fin de campaña  
✅ **Enlaces opcionales** - Redirige a secciones de la app  
✅ **Estadísticas** - Vistas y clicks de cada banner  
✅ **Activar/Desactivar** - Control rápido sin eliminar  

---

## 🗂️ Estructura de Datos

### Colección: `banners`

```javascript
{
  id: "banner_123",
  
  // Contenido
  title: "Oferta Especial",
  description: "50% de descuento en carriolas",
  imageUrl: "https://storage.googleapis.com/.../banner.jpg",
  imageStoragePath: "banners/1762793678_image.jpg",
  
  // Configuración
  link: "/marketplace/category/carriolas",  // Enlace opcional
  order: 1,                                  // Orden de aparición (1 = primero)
  duration: 5,                               // Segundos de visibilidad (carrusel)
  
  // Programación
  startDate: Timestamp,                      // Fecha de inicio
  endDate: Timestamp,                        // Fecha de fin (null = sin fin)
  isActive: true,                            // Activo/Inactivo
  
  // Estadísticas
  views: 245,                                // Número de vistas
  clicks: 18,                                // Número de clicks
  
  // Metadata
  createdAt: Timestamp,
  updatedAt: Timestamp,
  createdBy: "admin_uid"
}
```

---

## 🔧 API - Endpoints

### 1. 📱 ENDPOINTS PÚBLICOS (App)

#### Obtener banners activos

```http
GET /api/banners
```

**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "id": "banner_123",
      "title": "Oferta Especial",
      "description": "50% de descuento",
      "imageUrl": "https://...",
      "link": "/marketplace/category/carriolas",
      "order": 1,
      "duration": 5,
      "startDate": "2025-01-01T00:00:00Z",
      "endDate": "2025-12-31T23:59:59Z",
      "views": 245,
      "clicks": 18
    }
  ]
}
```

**Filtros aplicados automáticamente:**
- ✅ Solo banners con `isActive: true`
- ✅ Solo banners dentro del rango de fechas (startDate ≤ ahora ≤ endDate)
- ✅ Ordenados por `order` ascendente

---

#### Registrar vista de banner

```http
POST /api/banners/:id/view
```

**Uso:** Llamar cuando el banner aparece en pantalla

```javascript
// Cuando el banner se muestra al usuario
await fetch(`/api/banners/${bannerId}/view`, {
  method: 'POST'
});
```

---

#### Registrar click de banner

```http
POST /api/banners/:id/click
```

**Uso:** Llamar cuando el usuario toca el banner

```javascript
// Cuando el usuario toca el banner
await fetch(`/api/banners/${bannerId}/click`, {
  method: 'POST'
});

// Luego navegar al link
if (banner.link) {
  navigation.navigate(banner.link);
}
```

---

### 2. 🔐 ENDPOINTS ADMIN (Dashboard)

#### Listar productos para selector de enlaces

```http
GET /api/admin/banners/products-selector
Authorization: Bearer {token}
```

**Query Parameters:**
| Parámetro | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| `search` | string | "" | Buscar por título o categoría |
| `limit` | number | 50 | Máximo de productos |

**Uso:** Para poblar un selector en el dashboard y elegir a qué producto debe llevar el banner.

**Ejemplo:**
```bash
GET /api/admin/banners/products-selector?search=carriola&limit=20
```

**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "id": "VFSg46dNjaFcrHwf7DFF",
      "title": "Carriola evenflo",
      "category": "Carriolas",
      "imageUrl": "https://storage.googleapis.com/.../photo.jpg",
      "link": "/marketplace/item/VFSg46dNjaFcrHwf7DFF",
      "label": "🛍️ Carriola evenflo (Carriolas)"
    }
  ]
}
```

**Integración en el Dashboard:**
```typescript
// Cargar productos para el selector
const loadProducts = async () => {
  const response = await fetch(
    'https://api.munpa.online/api/admin/banners/products-selector',
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );
  const data = await response.json();
  setProductOptions(data.data);
};

// En el formulario de banner
<select onChange={(e) => setFormData({...formData, link: e.target.value})}>
  <option value="">-- Selecciona un producto --</option>
  {productOptions.map(product => (
    <option key={product.id} value={product.link}>
      {product.label}
    </option>
  ))}
</select>
```

---

#### Obtener banner específico

```http
GET /api/admin/banners/:id
Authorization: Bearer {token}
```

**Ejemplo:**
```bash
GET /api/admin/banners/iE4FQUaiaFEV9Abgjn4F
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "id": "iE4FQUaiaFEV9Abgjn4F",
    "title": "Oferta Especial",
    "description": "50% de descuento",
    "imageUrl": "https://...",
    "link": "/marketplace",
    "order": 1,
    "duration": 5,
    "startDate": "2025-01-15T00:00:00Z",
    "endDate": "2025-01-31T23:59:59Z",
    "isActive": true,
    "views": 245,
    "clicks": 18,
    "createdAt": "2025-01-10T10:00:00Z",
    "updatedAt": "2025-01-10T10:00:00Z",
    "createdBy": "admin_uid"
  }
}
```

---

#### Listar todos los banners

```http
GET /api/admin/banners
```

**Query Parameters:**
| Parámetro | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| `page` | number | 1 | Número de página |
| `limit` | number | 20 | Banners por página |
| `search` | string | "" | Buscar en título/descripción |
| `includeInactive` | boolean | true | Incluir banners inactivos |

**Ejemplo:**
```bash
GET /api/admin/banners?page=1&limit=10&search=oferta&includeInactive=false
```

**Respuesta:**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "total": 15,
    "page": 1,
    "limit": 10,
    "totalPages": 2
  }
}
```

---

#### Crear banner

```http
POST /api/admin/banners
Authorization: Bearer {token}
```

**Body:**
```json
{
  "title": "Oferta Especial",
  "description": "50% de descuento en carriolas",
  "imageUrl": "https://storage.googleapis.com/.../banner.jpg",
  "imageStoragePath": "banners/1762793678_image.jpg",
  "link": "/marketplace/category/carriolas",
  "order": 1,
  "duration": 5,
  "startDate": "2025-01-15T00:00:00Z",
  "endDate": "2025-01-31T23:59:59Z",
  "isActive": true
}
```

**Campos requeridos:**
- `title` (mínimo 3 caracteres)
- `imageUrl`

**Campos opcionales:**
- `description`
- `imageStoragePath`
- `link`
- `order` (default: 999)
- `duration` (default: 5 segundos)
- `startDate` (default: ahora)
- `endDate` (default: null = sin fin)
- `isActive` (default: true)

**Respuesta:**
```json
{
  "success": true,
  "message": "Banner creado exitosamente",
  "data": {
    "id": "banner_123",
    "title": "Oferta Especial",
    ...
  }
}
```

---

#### Actualizar banner

```http
PUT /api/admin/banners/:id
Authorization: Bearer {token}
```

**Body:** (todos los campos son opcionales)
```json
{
  "title": "Nueva Oferta",
  "order": 2,
  "duration": 8,
  "isActive": false
}
```

---

#### Eliminar banner

```http
DELETE /api/admin/banners/:id
Authorization: Bearer {token}
```

**Nota:** También elimina la imagen de Firebase Storage si existe.

---

#### Activar/Desactivar banner

```http
PATCH /api/admin/banners/:id/toggle
Authorization: Bearer {token}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Banner activado exitosamente",
  "isActive": true
}
```

---

#### Subir imagen de banner

```http
POST /api/admin/banners/upload-image
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**Form Data:**
```
image: [archivo de imagen]
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Imagen subida exitosamente",
  "data": {
    "imageUrl": "https://storage.googleapis.com/.../banners/1762793678_image.jpg",
    "imageStoragePath": "banners/1762793678_image.jpg"
  }
}
```

---

## 🔗 Tipos de Enlaces para Banners

Los banners pueden tener diferentes tipos de enlaces según lo que quieras mostrar:

### 1️⃣ Sin Enlace
```json
{
  "link": null
}
```
- El banner es solo informativo
- No navega a ningún lado al tocarlo
- Útil para anuncios, avisos, etc.

### 2️⃣ Producto Individual
```json
{
  "link": "/marketplace/item/VFSg46dNjaFcrHwf7DFF"
}
```
- Lleva directamente a un producto específico
- Formato: `/marketplace/item/{productId}`
- Ejemplo: Banner de "Carriola en oferta" → Página del producto

**Cómo obtener productos para el selector:**
```bash
GET /api/admin/banners/products-selector
```

### 3️⃣ Categoría del Marketplace
```json
{
  "link": "/marketplace/category/carriolas"
}
```
- Lleva a todos los productos de una categoría
- Formato: `/marketplace/category/{categorySlug}`
- Ejemplo: Banner de "Ropa de bebé" → Categoría de ropa

### 4️⃣ Filtro del Marketplace
```json
{
  "link": "/marketplace?type=donacion"
}
```
- Lleva al marketplace con filtros aplicados
- Formatos:
  - `/marketplace?type=venta` - Solo ventas
  - `/marketplace?type=donacion` - Solo donaciones
  - `/marketplace?type=trueque` - Solo trueques

### 5️⃣ Sección de la App
```json
{
  "link": "/communities"
}
```
- Lleva a otra sección de la app
- Ejemplos:
  - `/communities` - Comunidades
  - `/profile` - Perfil del usuario
  - `/settings` - Configuración
  - `/home` - Inicio

### 6️⃣ URL Externa (Opcional)
```json
{
  "link": "https://munpa.online/promocion"
}
```
- Lleva a una página web externa
- Se abre en navegador/webview

---

## 🎨 Ejemplo de Selector en Dashboard

```typescript
const BannerLinkSelector = ({ value, onChange }) => {
  const [linkType, setLinkType] = useState('none');
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    // Cargar productos
    fetch('/api/admin/banners/products-selector', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setProducts(data.data));

    // Cargar categorías
    fetch('/api/marketplace/categories')
      .then(res => res.json())
      .then(data => setCategories(data.data));
  }, []);

  return (
    <div>
      <label>Tipo de enlace:</label>
      <select value={linkType} onChange={(e) => setLinkType(e.target.value)}>
        <option value="none">Sin enlace</option>
        <option value="product">Producto individual</option>
        <option value="category">Categoría</option>
        <option value="filter">Filtro del marketplace</option>
        <option value="section">Sección de la app</option>
        <option value="external">URL externa</option>
      </select>

      {linkType === 'product' && (
        <select onChange={(e) => onChange(e.target.value)}>
          <option value="">-- Selecciona un producto --</option>
          {products.map(p => (
            <option key={p.id} value={p.link}>
              {p.label}
            </option>
          ))}
        </select>
      )}

      {linkType === 'category' && (
        <select onChange={(e) => onChange(`/marketplace/category/${e.target.value}`)}>
          <option value="">-- Selecciona una categoría --</option>
          {categories.map(c => (
            <option key={c.id} value={c.slug}>
              {c.icon} {c.name}
            </option>
          ))}
        </select>
      )}

      {linkType === 'filter' && (
        <select onChange={(e) => onChange(e.target.value)}>
          <option value="">-- Selecciona un filtro --</option>
          <option value="/marketplace?type=venta">🛍️ Solo Ventas</option>
          <option value="/marketplace?type=donacion">🎁 Solo Donaciones</option>
          <option value="/marketplace?type=trueque">🔄 Solo Trueques</option>
        </select>
      )}

      {linkType === 'section' && (
        <select onChange={(e) => onChange(e.target.value)}>
          <option value="">-- Selecciona una sección --</option>
          <option value="/marketplace">🛍️ Marketplace</option>
          <option value="/communities">👥 Comunidades</option>
          <option value="/profile">👤 Perfil</option>
          <option value="/home">🏠 Inicio</option>
        </select>
      )}

      {linkType === 'external' && (
        <input
          type="url"
          placeholder="https://ejemplo.com"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  );
};
```

---

## 📱 Integración en el Frontend (App)

### Carrusel de Banners con React Native

```typescript
import React, { useState, useEffect, useRef } from 'react';
import { View, Image, TouchableOpacity, Dimensions } from 'react-native';
import Carousel from 'react-native-snap-carousel';

const BannerCarousel = ({ navigation }) => {
  const [banners, setBanners] = useState([]);
  const carouselRef = useRef(null);

  useEffect(() => {
    loadBanners();
  }, []);

  const loadBanners = async () => {
    try {
      const response = await fetch('https://api.munpa.online/api/banners');
      const data = await response.json();
      
      if (data.success) {
        setBanners(data.data);
        startAutoRotation(data.data);
      }
    } catch (error) {
      console.error('Error cargando banners:', error);
    }
  };

  const startAutoRotation = (bannerList) => {
    if (bannerList.length === 0) return;

    let currentIndex = 0;
    
    setInterval(() => {
      const banner = bannerList[currentIndex];
      const duration = (banner.duration || 5) * 1000; // Convertir a milisegundos
      
      currentIndex = (currentIndex + 1) % bannerList.length;
      carouselRef.current?.snapToItem(currentIndex);
    }, bannerList[0].duration * 1000 || 5000);
  };

  const handleBannerPress = async (banner) => {
    // Registrar click
    try {
      await fetch(`https://api.munpa.online/api/banners/${banner.id}/click`, {
        method: 'POST'
      });
    } catch (error) {
      console.error('Error registrando click:', error);
    }

    // Navegar si tiene link
    if (banner.link) {
      navigation.navigate(banner.link);
    }
  };

  const handleBannerView = async (bannerId) => {
    // Registrar vista
    try {
      await fetch(`https://api.munpa.online/api/banners/${bannerId}/view`, {
        method: 'POST'
      });
    } catch (error) {
      console.error('Error registrando vista:', error);
    }
  };

  const renderBanner = ({ item, index }) => (
    <TouchableOpacity
      onPress={() => handleBannerPress(item)}
      onLayout={() => handleBannerView(item.id)}
    >
      <Image
        source={{ uri: item.imageUrl }}
        style={{
          width: Dimensions.get('window').width - 40,
          height: 200,
          borderRadius: 10
        }}
        resizeMode="cover"
      />
    </TouchableOpacity>
  );

  if (banners.length === 0) return null;

  return (
    <View style={{ marginVertical: 20 }}>
      <Carousel
        ref={carouselRef}
        data={banners}
        renderItem={renderBanner}
        sliderWidth={Dimensions.get('window').width}
        itemWidth={Dimensions.get('window').width - 40}
        loop
        autoplay
        autoplayInterval={banners[0]?.duration * 1000 || 5000}
      />
    </View>
  );
};

export default BannerCarousel;
```

---

## 🖥️ Integración en el Dashboard (Admin)

### Formulario de Crear/Editar Banner

```typescript
const BannerForm = ({ bannerId = null, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    imageUrl: '',
    link: '',
    order: 1,
    duration: 5,
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    isActive: true
  });
  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async (file) => {
    setUploading(true);
    
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch('https://api.munpa.online/api/admin/banners/upload-image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();
      
      if (data.success) {
        setFormData(prev => ({
          ...prev,
          imageUrl: data.data.imageUrl,
          imageStoragePath: data.data.imageStoragePath
        }));
      }
    } catch (error) {
      console.error('Error subiendo imagen:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    const url = bannerId
      ? `https://api.munpa.online/api/admin/banners/${bannerId}`
      : 'https://api.munpa.online/api/admin/banners';
    
    const method = bannerId ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      
      if (data.success) {
        alert('Banner guardado exitosamente');
        onSuccess();
      }
    } catch (error) {
      console.error('Error guardando banner:', error);
    }
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
      <input
        type="text"
        placeholder="Título"
        value={formData.title}
        onChange={(e) => setFormData({...formData, title: e.target.value})}
        required
      />
      
      <textarea
        placeholder="Descripción (opcional)"
        value={formData.description}
        onChange={(e) => setFormData({...formData, description: e.target.value})}
      />
      
      <input
        type="file"
        accept="image/*"
        onChange={(e) => handleImageUpload(e.target.files[0])}
      />
      {uploading && <p>Subiendo imagen...</p>}
      {formData.imageUrl && <img src={formData.imageUrl} alt="Preview" style={{maxWidth: '200px'}} />}
      
      <input
        type="text"
        placeholder="Link (opcional)"
        value={formData.link}
        onChange={(e) => setFormData({...formData, link: e.target.value})}
      />
      
      <input
        type="number"
        placeholder="Orden"
        value={formData.order}
        onChange={(e) => setFormData({...formData, order: parseInt(e.target.value)})}
        min="1"
      />
      
      <input
        type="number"
        placeholder="Duración (segundos)"
        value={formData.duration}
        onChange={(e) => setFormData({...formData, duration: parseInt(e.target.value)})}
        min="1"
        max="30"
      />
      
      <input
        type="date"
        value={formData.startDate}
        onChange={(e) => setFormData({...formData, startDate: e.target.value})}
      />
      
      <input
        type="date"
        value={formData.endDate}
        onChange={(e) => setFormData({...formData, endDate: e.target.value})}
      />
      
      <label>
        <input
          type="checkbox"
          checked={formData.isActive}
          onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
        />
        Activo
      </label>
      
      <button type="submit">Guardar Banner</button>
    </form>
  );
};
```

---

## 📊 Casos de Uso

### 1. Banner de Oferta Limitada

```json
{
  "title": "Black Friday 50% OFF",
  "imageUrl": "https://.../blackfriday.jpg",
  "link": "/marketplace",
  "order": 1,
  "duration": 8,
  "startDate": "2025-11-25T00:00:00Z",
  "endDate": "2025-11-30T23:59:59Z",
  "isActive": true
}
```

### 2. Banner de Nueva Funcionalidad

```json
{
  "title": "Nuevo: Marketplace de Productos",
  "imageUrl": "https://.../marketplace.jpg",
  "link": "/marketplace",
  "order": 2,
  "duration": 5,
  "startDate": "2025-01-15T00:00:00Z",
  "endDate": null,
  "isActive": true
}
```

### 3. Banner de Comunidad

```json
{
  "title": "Únete a nuestra comunidad",
  "imageUrl": "https://.../community.jpg",
  "link": "/communities",
  "order": 3,
  "duration": 5,
  "startDate": "2025-01-01T00:00:00Z",
  "endDate": null,
  "isActive": true
}
```

---

## 🔥 Índices de Firestore Necesarios

```javascript
// Colección: banners
// Índice compuesto:
// - isActive (Ascending)
// - order (Ascending)
```

**Cómo crear:**
1. Ve a Firestore Console
2. Click en "Índices"
3. Click en "Crear índice"
4. Colección: `banners`
5. Campos:
   - `isActive` (Ascending)
   - `order` (Ascending)
6. Click en "Crear"

---

## 📝 Resumen de Features

| Feature | Descripción | Endpoint |
|---------|-------------|----------|
| **Listar activos** | Banners visibles en la app | GET `/api/banners` |
| **Obtener uno** | Ver banner específico (admin) | GET `/api/admin/banners/:id` |
| **Gestionar** | CRUD completo desde dashboard | GET/POST/PUT/DELETE `/api/admin/banners` |
| **Subir imagen** | Upload a Firebase Storage | POST `/api/admin/banners/upload-image` |
| **Orden** | Control de secuencia | Campo `order` |
| **Duración** | Tiempo en carrusel | Campo `duration` (segundos) |
| **Programación** | Fechas inicio/fin | Campos `startDate`/`endDate` |
| **Toggle** | Activar/desactivar rápido | PATCH `/api/admin/banners/:id/toggle` |
| **Estadísticas** | Vistas y clicks | POST `/api/banners/:id/view|click` |

---

## 🎉 ¡Listo para Usar!

El sistema de banners está **100% funcional** y listo para:
- ✅ Crear banners desde el dashboard
- ✅ Mostrar en carrusel en la app
- ✅ Programar campañas con fechas
- ✅ Ver estadísticas de rendimiento
- ✅ Control total de orden y visibilidad

