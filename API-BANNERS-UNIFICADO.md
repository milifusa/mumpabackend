# 🎨 API de Banners Unificado - Munpa

## 📋 Descripción

Sistema unificado de banners que combina **banners normales** (promociones, anuncios) y **eventos destacados** en un solo endpoint. Los eventos marcados como banner aparecen junto con los banners tradicionales, creando una experiencia cohesiva.

---

## 🎯 Características Clave

✅ **Endpoint Unificado**: `/api/banners` devuelve tanto banners como eventos  
✅ **Campo `isEvent`**: Identifica si es un banner normal o un evento  
✅ **Secciones**: Controla dónde aparece cada banner (home, communities, marketplace)  
✅ **Programación**: Los eventos se muestran desde su publicación hasta la hora del evento  
✅ **Ordenamiento**: Control de orden de aparición  
✅ **Duración**: Tiempo en carrusel configurable  

---

## 📡 Endpoint Principal (App)

### GET /api/banners

**Descripción:** Obtiene todos los banners activos (normales + eventos) para el usuario.

**Auth:** Bearer Token

**Query Parameters:**

| Parámetro | Tipo | Requerido | Default | Descripción |
|-----------|------|-----------|---------|-------------|
| section | string | No | all | Filtrar por sección: 'home', 'home1', 'home2', 'home3', 'communities', 'marketplace', 'products', 'recomendaciones', 'medicina', 'crecimiento', 'vacunas', 'denticion', 'hitos', 'nutricion', 'menu-lateral' |

**Ejemplo:**
```bash
GET /api/banners
GET /api/banners?section=home
GET /api/banners?section=communities
```

---

### Response

```json
{
  "success": true,
  "data": [
    {
      // BANNER NORMAL
      "id": "banner_123",
      "type": "banner",
      "isEvent": false,
      
      "title": "50% OFF en Carriolas",
      "description": "Oferta especial por tiempo limitado",
      "imageUrl": "https://storage.googleapis.com/.../banner.jpg",
      "link": "/marketplace/category/carriolas",
      
      "order": 1,
      "duration": 5,
      "section": "home",
      
      "startDate": "2026-02-01T00:00:00Z",
      "endDate": "2026-02-28T23:59:59Z",
      
      "views": 1250,
      "clicks": 85,
      
      "createdAt": "2026-01-15T10:00:00Z"
    },
    {
      // EVENTO COMO BANNER
      "id": "event_456",
      "type": "event",
      "isEvent": true,
      
      "title": "Taller de Lactancia Materna",
      "description": "Aprende técnicas esenciales con una experta",
      "imageUrl": "https://storage.googleapis.com/.../event.jpg",
      "link": "/communities/comm_xyz/events/event_456",
      
      // Datos específicos del evento
      "eventDate": "2026-02-15T10:00:00Z",
      "eventEndDate": "2026-02-15T12:00:00Z",
      "location": {
        "name": "Centro Comunitario",
        "address": "Calle Principal 123",
        "city": "Ciudad de México"
      },
      "communityId": "comm_xyz",
      "communityName": "Mamás Primerizas CDMX",
      "authorId": "user_789",
      "authorName": "Dra. María López",
      "attendeeCount": 15,
      "maxAttendees": 30,
      "isUserAttending": false,
      
      // Configuración del banner
      "order": 2,
      "duration": 8,
      "section": "home",
      
      "startDate": "2026-02-01T15:00:00Z",  // Fecha de publicación del banner
      "endDate": "2026-02-15T10:00:00Z",     // Fecha del evento (límite de visualización)
      
      "likeCount": 42,
      "commentCount": 8,
      "createdAt": "2026-02-01T10:00:00Z",
      "bannerUpdatedAt": "2026-02-01T15:00:00Z"
    }
  ]
}
```

---

## 🔧 Endpoint Admin

### PATCH /api/admin/events/:eventId/banner

**Descripción:** Marca o desmarca un evento como banner, con configuración de visualización.

**Auth:** Bearer Token + Admin

**Body:**
```json
{
  "isBanner": true,
  "section": "home",        // Opcional, default: 'home'
  "order": 1,               // Opcional, default: 1
  "duration": 8,            // Opcional (segundos), default: 5
  "publishNow": true        // Opcional, default: true
}
```

**Campos:**

| Campo | Tipo | Requerido | Default | Descripción |
|-------|------|-----------|---------|-------------|
| isBanner | boolean | ✅ | - | true para marcar, false para desmarcar |
| section | string | No | 'home' | Sección donde aparece: 'home', 'home1', 'home2', 'home3', 'communities', 'marketplace', 'products', 'recomendaciones', 'medicina', 'crecimiento', 'vacunas', 'denticion', 'hitos', 'nutricion', 'menu-lateral' |
| order | number | No | 1 | Orden de aparición (menor = primero) |
| duration | number | No | 5 | Duración en carrusel (segundos) |
| publishNow | boolean | No | true | Si se publica inmediatamente |

---

### Secciones Disponibles

| Sección | Descripción | Uso |
|---------|-------------|-----|
| `home` | Pantalla principal | Banners generales, eventos destacados |
| `home1` | Home sección 1 | Banners específicos para primera sección |
| `home2` | Home sección 2 | Banners específicos para segunda sección |
| `home3` | Home sección 3 | Banners específicos para tercera sección |
| `communities` | Sección de comunidades | Eventos de comunidades específicas |
| `marketplace` | Marketplace | Productos en oferta, eventos de mercado |
| `products` | Productos | Banners de productos destacados |
| `recomendaciones` | Recomendaciones | Tips y consejos |
| `medicina` | Medicina | Información médica |
| `crecimiento` | Crecimiento | Tips de desarrollo infantil |
| `vacunas` | Vacunas | Recordatorios y info de vacunación |
| `denticion` | Dentición | Información sobre dentición |
| `hitos` | Hitos del desarrollo | Hitos importantes del niño |
| `nutricion` | Nutrición | Consejos y recetas de alimentación |
| `menu-lateral` | Menú lateral | Banners para sidebar |

---

### Response Success

```json
{
  "success": true,
  "message": "Evento marcado como banner",
  "data": {
    "eventId": "event_456",
    "isBanner": true,
    "section": "home",
    "order": 1,
    "duration": 8,
    "publishedAt": "2026-02-05T10:30:00Z"
  }
}
```

---

## 📊 Estructura de Datos

### Campos Agregados a `eventData` en Firestore

```javascript
{
  eventData: {
    // ... campos existentes del evento ...
    
    // Configuración de banner
    isBanner: boolean,                // Si está marcado como banner
    bannerSection: string,            // 'home', 'communities', 'marketplace'
    bannerOrder: number,              // Orden de aparición
    bannerDuration: number,           // Duración en carrusel (segundos)
    bannerPublishedAt: Timestamp,     // Desde cuándo se muestra como banner
    
    // Metadata
    bannerUpdatedAt: Timestamp,       // Última actualización de configuración
    bannerUpdatedBy: string           // UID del admin que configuró
  }
}
```

---

## 🎨 Diferencias: Banner Normal vs Evento Banner

| Característica | Banner Normal | Evento Banner |
|----------------|---------------|---------------|
| **Origen** | Colección `banners` | Colección `posts` con `postType: 'event'` |
| **Campo identificador** | `type: 'banner'`, `isEvent: false` | `type: 'event'`, `isEvent: true` |
| **Fecha de fin** | `endDate` manual o null | Automática: fecha del evento |
| **Visibilidad** | Según `startDate` y `endDate` | Desde publicación hasta hora del evento |
| **Link** | Configurable (producto, categoría, URL) | Automático: link al evento |
| **Datos específicos** | Solo título, descripción, imagen | Incluye: ubicación, asistentes, comunidad |
| **Estadísticas** | views, clicks | likeCount, commentCount, attendeeCount |
| **Filtro por usuario** | Todos ven lo mismo | Solo comunidades del usuario |

---

## 🔄 Flujo de Visualización

### Para Banners Normales:
```
1. Admin crea banner en colección `banners`
2. Configura: startDate, endDate, section, order
3. Banner aparece si:
   - isActive = true
   - startDate ≤ now ≤ endDate
   - section coincide (o no se filtra)
```

### Para Eventos Banner:
```
1. Usuario crea evento en comunidad
2. Admin marca evento como banner con PATCH /api/admin/events/:id/banner
3. Configura: section, order, duration, publishNow
4. Evento aparece si:
   - isBanner = true
   - Usuario es miembro de la comunidad
   - bannerPublishedAt ≤ now ≤ eventDate
   - status !== 'cancelled'
   - section coincide (o no se filtra)
```

---

## 🎯 Casos de Uso

### Caso 1: Evento Destacado en Home

**Escenario:** Admin quiere promocionar un taller importante en la pantalla principal.

**Request:**
```bash
PATCH /api/admin/events/event_123/banner
```
```json
{
  "isBanner": true,
  "section": "home",
  "order": 1,
  "duration": 10,
  "publishNow": true
}
```

**Resultado:**
- El evento aparece en la pantalla principal
- Se muestra primero (order: 1)
- Dura 10 segundos en el carrusel
- Visible desde ahora hasta la hora del evento

---

### Caso 2: Promoción en Marketplace

**Escenario:** Banner de productos en oferta en la sección marketplace.

**Banner Normal en Firestore:**
```json
{
  "title": "¡Liquidación de Juguetes!",
  "imageUrl": "...",
  "link": "/marketplace/category/juguetes",
  "section": "marketplace",
  "order": 1,
  "duration": 5,
  "isActive": true
}
```

**Response en `/api/banners?section=marketplace`:**
```json
{
  "id": "banner_789",
  "type": "banner",
  "isEvent": false,
  "title": "¡Liquidación de Juguetes!",
  "section": "marketplace",
  "order": 1
}
```

---

### Caso 3: Evento de Comunidad

**Escenario:** Evento solo visible en la sección de comunidades.

**Request:**
```json
{
  "isBanner": true,
  "section": "communities",
  "order": 2,
  "duration": 8
}
```

**Response en `/api/banners?section=communities`:**
- Solo usuarios miembros de esa comunidad verán el evento
- Aparece en segundo lugar (order: 2)
- No aparece en `section=home` o `section=marketplace`

---

## 📱 Integración en Frontend

### Obtener Banners para el Carrusel

```typescript
const BannerCarousel = () => {
  const [banners, setBanners] = useState([]);
  
  useEffect(() => {
    loadBanners();
  }, []);

  const loadBanners = async () => {
    try {
      const response = await fetch('/api/banners?section=home', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      
      if (data.success) {
        setBanners(data.data);
      }
    } catch (error) {
      console.error('Error cargando banners:', error);
    }
  };

  const handleBannerPress = (banner) => {
    if (banner.isEvent) {
      // Navegar al evento
      navigation.navigate('EventDetail', { 
        eventId: banner.id,
        communityId: banner.communityId 
      });
    } else {
      // Navegar al link del banner
      if (banner.link) {
        navigation.navigate(banner.link);
      }
    }
  };

  return (
    <Carousel
      data={banners}
      renderItem={({ item }) => (
        <BannerCard
          banner={item}
          onPress={() => handleBannerPress(item)}
        />
      )}
      autoplay
      autoplayInterval={banners[0]?.duration * 1000 || 5000}
    />
  );
};
```

---

### Renderizar Banner según Tipo

```typescript
const BannerCard = ({ banner, onPress }) => {
  if (banner.isEvent) {
    // Renderizar como evento
    return (
      <TouchableOpacity onPress={onPress}>
        <Image source={{ uri: banner.imageUrl }} />
        <View>
          <Text>{banner.title}</Text>
          <Text>{formatDate(banner.eventDate)}</Text>
          <View>
            <Icon name="location" />
            <Text>{banner.location?.name}</Text>
          </View>
          <View>
            <Icon name="people" />
            <Text>{banner.attendeeCount}/{banner.maxAttendees}</Text>
          </View>
          {banner.isUserAttending && (
            <Badge>Ya confirmaste</Badge>
          )}
        </View>
      </TouchableOpacity>
    );
  } else {
    // Renderizar como banner normal
    return (
      <TouchableOpacity onPress={onPress}>
        <Image source={{ uri: banner.imageUrl }} />
        <View>
          <Text>{banner.title}</Text>
          <Text>{banner.description}</Text>
        </View>
      </TouchableOpacity>
    );
  }
};
```

---

## 🖥️ Integración en Admin Dashboard

### Formulario para Marcar Evento como Banner

```typescript
const EventBannerConfig = ({ eventId, currentConfig }) => {
  const [formData, setFormData] = useState({
    isBanner: currentConfig?.isBanner || false,
    section: currentConfig?.section || 'home',
    order: currentConfig?.order || 1,
    duration: currentConfig?.duration || 5,
    publishNow: true
  });

  const handleSubmit = async () => {
    try {
      const response = await fetch(`/api/admin/events/${eventId}/banner`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      
      if (data.success) {
        alert('Configuración guardada');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div>
      <h3>Configurar como Banner</h3>
      
      <label>
        <input
          type="checkbox"
          checked={formData.isBanner}
          onChange={(e) => setFormData({...formData, isBanner: e.target.checked})}
        />
        Mostrar como banner
      </label>

      {formData.isBanner && (
        <>
          <label>
            Sección:
            <select 
              value={formData.section}
              onChange={(e) => setFormData({...formData, section: e.target.value})}
            >
              <option value="home">🏠 Home</option>
              <option value="communities">👥 Comunidades</option>
              <option value="marketplace">🛍️ Marketplace</option>
            </select>
          </label>

          <label>
            Orden (menor = primero):
            <input
              type="number"
              min="1"
              value={formData.order}
              onChange={(e) => setFormData({...formData, order: parseInt(e.target.value)})}
            />
          </label>

          <label>
            Duración en carrusel (segundos):
            <input
              type="number"
              min="3"
              max="30"
              value={formData.duration}
              onChange={(e) => setFormData({...formData, duration: parseInt(e.target.value)})}
            />
          </label>

          <label>
            <input
              type="checkbox"
              checked={formData.publishNow}
              onChange={(e) => setFormData({...formData, publishNow: e.target.checked})}
            />
            Publicar inmediatamente
          </label>
        </>
      )}

      <button onClick={handleSubmit}>Guardar</button>
    </div>
  );
};
```

---

## 🔍 Ordenamiento de Banners

Los banners se ordenan de la siguiente manera:

1. **Por `order` (ascendente)**: Menor número aparece primero
2. **Por tipo**: 
   - Si tienen el mismo `order`, eventos van antes que banners normales
3. **Por fecha** (solo eventos):
   - Eventos se ordenan por fecha (más próximo primero)
4. **Banners normales** mantienen su orden de creación

### Ejemplo de Orden:

```javascript
[
  { order: 1, isEvent: false },  // 1º: Banner normal, order 1
  { order: 2, isEvent: true, eventDate: '2026-02-10' },  // 2º: Evento próximo
  { order: 2, isEvent: true, eventDate: '2026-02-15' },  // 3º: Evento más lejano
  { order: 2, isEvent: false },  // 4º: Banner normal, order 2
  { order: 3, isEvent: true, eventDate: '2026-02-08' },  // 5º: Evento, order 3
]
```

---

## 📊 Filtrado Automático

### Banners Normales
```
Mostrar si:
✅ isActive === true
✅ startDate ≤ now (o no existe)
✅ endDate ≥ now (o no existe)
✅ section === requested (o no se filtra)
```

### Eventos Banner
```
Mostrar si:
✅ isBanner === true
✅ Usuario es miembro de la comunidad del evento
✅ bannerPublishedAt ≤ now
✅ eventDate ≥ now (evento no ha pasado)
✅ status !== 'cancelled'
✅ section === requested (o no se filtra)
```

---

## 🚨 Validaciones

### Al Marcar Evento como Banner:

1. ✅ El evento debe existir
2. ✅ Debe ser un post de tipo 'event'
3. ✅ No puede estar cancelado
4. ✅ `isBanner` debe ser booleano
5. ✅ `order` debe ser número positivo
6. ✅ `duration` debe estar entre 3-30 segundos
7. ✅ `section` debe ser válida: 'home', 'home1', 'home2', 'home3', 'communities', 'marketplace', 'products', 'recomendaciones', 'medicina', 'crecimiento', 'vacunas', 'denticion', 'hitos', 'nutricion', 'menu-lateral'

---

## 💡 Mejores Prácticas

### Para Administradores:

1. **Eventos importantes** → `order: 1`, `section: 'home'`
2. **Eventos de comunidad** → `section: 'communities'`
3. **Productos/trueques** → `section: 'marketplace'`
4. **Duración**:
   - Banners simples: 5 segundos
   - Eventos con info importante: 8-10 segundos
   - No más de 15 segundos (usuarios pierden interés)

### Para Desarrollo:

1. **Siempre verificar** `isEvent` antes de renderizar
2. **Manejar ambos tipos** en el mismo componente
3. **Cachear** respuesta de `/api/banners` (revalidar cada minuto)
4. **Lazy loading** de imágenes
5. **Fallback** si no hay banners

---

## 📈 Métricas

### Para Banners Normales:
- `views`: Número de veces que se mostró
- `clicks`: Número de veces que se tocó

### Para Eventos:
- `likeCount`: Likes del post
- `commentCount`: Comentarios
- `attendeeCount`: Personas confirmadas
- `maxAttendees`: Capacidad máxima

---

## 🎉 Resumen

✅ **Endpoint unificado** `/api/banners` para app  
✅ **Campo `isEvent`** identifica el tipo  
✅ **Configuración flexible** desde admin (sección, orden, duración)  
✅ **Visibilidad programada** automática para eventos  
✅ **Filtrado por sección** para UX personalizada  
✅ **Compatible** con sistema de banners existente  

---

**Última actualización:** 2026-02-05  
**Versión API:** 2.0 (Unificado)
