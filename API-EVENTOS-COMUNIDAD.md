# 📅 Sistema de Eventos en Comunidades

## 📋 Descripción

Sistema que permite a los miembros de una comunidad crear **posts especiales tipo evento** con fecha, hora, ubicación y gestión de asistentes.

---

## 🗂️ Estructura de Datos

### Post Tipo "Evento"

Cuando un post es de tipo evento, tiene la siguiente estructura adicional:

```javascript
{
  // Campos regulares de post
  id: "post_123",
  communityId: "community_abc",
  authorId: "user_xyz",
  content: "¡Reunión de mamás en el parque!",
  imageUrl: "https://...",
  isPinned: false,
  likes: [],
  likeCount: 0,
  commentCount: 0,
  createdAt: Timestamp,
  updatedAt: Timestamp,
  
  // NUEVO: Tipo de post
  postType: "event",  // "normal" o "event"
  
  // NUEVO: Datos del evento (solo si postType === "event")
  eventData: {
    title: "Reunión de Mamás - Parque Central",
    description: "Nos juntamos para que los niños jueguen y nosotras platicamos",
    
    // Fecha y hora
    eventDate: Timestamp,  // Fecha y hora del evento
    eventEndDate: Timestamp,  // (Opcional) Fecha y hora de finalización
    
    // Ubicación
    location: {
      name: "Parque Central",
      address: "Av. Principal 123, Quito",
      latitude: -0.1807,
      longitude: -78.4678
    },
    
    // Configuración
    maxAttendees: 20,  // (Opcional) Máximo de asistentes
    requiresConfirmation: true,  // Si requiere confirmación del organizador
    
    // Estado
    status: "upcoming",  // upcoming, ongoing, completed, cancelled
    
    // Asistentes
    attendees: ["user_123", "user_456"],  // Array de UIDs confirmados
    attendeeCount: 2,
    
    // Pendientes de confirmación (si requiresConfirmation === true)
    pendingAttendees: ["user_789"],
    
    // Recordatorios
    reminderSent: false,  // Si ya se envió recordatorio 24h antes
    reminderSentAt: null
  }
}
```

---

## 🚀 Endpoints

### 1. Crear Post de Evento

```http
POST /api/communities/:communityId/posts
```

**Headers:**
```
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json
```

**Body:**
```json
{
  "content": "¡Reunión de mamás en el parque! Vamos a pasar una tarde agradable mientras los niños juegan.",
  "imageUrl": "https://storage.googleapis.com/.../event-image.jpg",
  "postType": "event",
  "eventData": {
    "title": "Reunión de Mamás - Parque Central",
    "description": "Nos juntamos para que los niños jueguen y nosotras platicamos",
    "eventDate": "2026-02-15T16:00:00Z",
    "eventEndDate": "2026-02-15T19:00:00Z",
    "location": {
      "name": "Parque Central",
      "address": "Av. Principal 123, Quito",
      "latitude": -0.1807,
      "longitude": -78.4678
    },
    "maxAttendees": 20,
    "requiresConfirmation": false
  }
}
```

**Validaciones:**
- `content` (requerido): Contenido del post
- `postType` (opcional): "normal" o "event" (default: "normal")
- Si `postType === "event"`:
  - `eventData.title` (requerido): Título del evento
  - `eventData.eventDate` (requerido): Fecha del evento (ISO 8601)
  - `eventData.location` (opcional): Ubicación del evento
  - `eventData.maxAttendees` (opcional): Límite de asistentes
  - `eventData.requiresConfirmation` (opcional): Default false

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "message": "Evento creado exitosamente",
  "data": {
    "id": "post_123",
    "communityId": "community_abc",
    "authorId": "user_xyz",
    "content": "¡Reunión de mamás en el parque!...",
    "postType": "event",
    "eventData": {
      "title": "Reunión de Mamás - Parque Central",
      "eventDate": "2026-02-15T16:00:00Z",
      "status": "upcoming",
      "attendeeCount": 0,
      "attendees": []
    },
    "createdAt": "2026-02-05T10:00:00Z"
  }
}
```

---

### 2. Actualizar Post/Evento

```http
PUT /api/posts/:postId
```

**Headers:**
```
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json
```

**Body (todos opcionales):**
```json
{
  "content": "Contenido actualizado",
  "imageUrl": "https://...",
  "eventData": {
    "title": "Título actualizado",
    "eventDate": "2026-02-16T16:00:00Z",
    "location": {
      "name": "Nuevo Parque",
      "address": "Calle 456"
    },
    "status": "cancelled"
  }
}
```

**Notas:**
- Solo el autor del evento puede editarlo
- Si se actualiza la fecha/ubicación, se notifica a los asistentes

---

### 3. Confirmar Asistencia a Evento

```http
POST /api/posts/:postId/attend
```

**Headers:**
```
Authorization: Bearer {JWT_TOKEN}
```

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "message": "Asistencia confirmada",
  "data": {
    "postId": "post_123",
    "attendeeCount": 5,
    "userAttending": true
  }
}
```

**Errores:**
- `400`: Evento lleno (si hay maxAttendees)
- `400`: El evento ya pasó
- `400`: El evento fue cancelado
- `403`: No eres miembro de la comunidad
- `404`: Post o evento no encontrado

---

### 4. Cancelar Asistencia a Evento

```http
DELETE /api/posts/:postId/attend
```

**Headers:**
```
Authorization: Bearer {JWT_TOKEN}
```

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "message": "Asistencia cancelada",
  "data": {
    "postId": "post_123",
    "attendeeCount": 4,
    "userAttending": false
  }
}
```

---

### 5. Obtener Asistentes de un Evento

```http
GET /api/posts/:postId/attendees
```

**Headers:**
```
Authorization: Bearer {JWT_TOKEN}
```

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": {
    "attendees": [
      {
        "userId": "user_123",
        "userName": "María López",
        "userPhoto": "https://...",
        "confirmedAt": "2026-02-05T10:30:00Z"
      },
      {
        "userId": "user_456",
        "userName": "Ana García",
        "userPhoto": "https://...",
        "confirmedAt": "2026-02-05T11:00:00Z"
      }
    ],
    "attendeeCount": 2,
    "maxAttendees": 20,
    "spotsAvailable": 18
  }
}
```

---

### 6. Obtener Eventos de una Comunidad

```http
GET /api/communities/:communityId/events?filter=upcoming&page=1&limit=10
```

**Headers:**
```
Authorization: Bearer {JWT_TOKEN}
```

**Query Parameters:**
- `filter`: "upcoming" | "past" | "all" (default: "upcoming")
- `page`: Número de página (default: 1)
- `limit`: Items por página (default: 10)

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "post_123",
      "postType": "event",
      "content": "¡Reunión de mamás!",
      "eventData": {
        "title": "Reunión de Mamás - Parque Central",
        "eventDate": "2026-02-15T16:00:00Z",
        "location": {
          "name": "Parque Central"
        },
        "attendeeCount": 5,
        "maxAttendees": 20,
        "status": "upcoming"
      },
      "author": {
        "id": "user_xyz",
        "name": "Laura Pérez",
        "photo": "https://..."
      },
      "userAttending": true,
      "createdAt": "2026-02-05T10:00:00Z"
    }
  ],
  "pagination": {
    "total": 15,
    "page": 1,
    "limit": 10,
    "totalPages": 2
  }
}
```

---

## 📱 Flujo de Usuario

### Crear Evento

1. Usuario entra a una comunidad
2. Presiona "Crear Publicación"
3. Selecciona tipo "Evento"
4. Completa formulario:
   - Título del evento
   - Descripción
   - Fecha y hora
   - Ubicación (opcional)
   - Número máximo de asistentes (opcional)
   - Foto (opcional)
5. Publica el evento
6. Se notifica a todos los miembros de la comunidad

### Confirmar Asistencia

1. Usuario ve el evento en el feed
2. Presiona "Asistiré" / "Confirmar asistencia"
3. Se agrega a la lista de asistentes
4. Recibe notificación de recordatorio 24h antes

### Ver Asistentes

1. Usuario abre el evento
2. Ve lista de asistentes confirmados
3. Puede ver cuántos lugares quedan disponibles

---

## 🔔 Notificaciones

### 1. Nuevo Evento Publicado
- **Enviado a**: Todos los miembros de la comunidad
- **Título**: "📅 Nuevo evento en [Comunidad]"
- **Cuerpo**: "[Autor] creó el evento: [Título del evento]"

### 2. Recordatorio 24h Antes
- **Enviado a**: Asistentes confirmados
- **Título**: "⏰ Recordatorio: [Título del evento]"
- **Cuerpo**: "El evento es mañana a las [hora]"

### 3. Evento Actualizado
- **Enviado a**: Asistentes confirmados
- **Título**: "📝 Actualización: [Título del evento]"
- **Cuerpo**: "Se actualizó la información del evento"

### 4. Evento Cancelado
- **Enviado a**: Asistentes confirmados
- **Título**: "❌ Evento cancelado: [Título del evento]"
- **Cuerpo**: "El organizador canceló el evento"

---

## 🔐 Permisos

### Usuario Regular
- ✅ Crear eventos en comunidades donde es miembro
- ✅ Editar/eliminar sus propios eventos
- ✅ Confirmar/cancelar asistencia a eventos
- ✅ Ver lista de asistentes
- ✅ Comentar en eventos

### Organizador del Evento (Autor)
- ✅ Editar información del evento
- ✅ Cancelar el evento
- ✅ Ver lista completa de asistentes
- ✅ Enviar actualizaciones a asistentes

### Administrador
- ✅ Editar cualquier evento
- ✅ Cancelar/eliminar cualquier evento
- ✅ Ver estadísticas de eventos

---

## 📊 Estados del Evento

| Estado | Descripción |
|--------|-------------|
| `upcoming` | Evento próximo (fecha futura) |
| `ongoing` | Evento en curso (hora actual dentro del rango) |
| `completed` | Evento finalizado (fecha pasada) |
| `cancelled` | Evento cancelado por el organizador |

---

## 🎨 UI Sugerida

### Card de Evento en Feed

```
┌────────────────────────────────────┐
│ 📅 EVENTO                          │
│ [Foto del evento si existe]        │
│                                    │
│ Reunión de Mamás - Parque Central  │
│ 📅 15 Feb 2026 - 4:00 PM          │
│ 📍 Parque Central                  │
│ 👥 5/20 asistentes                 │
│                                    │
│ "¡Reunión de mamás en el..."      │
│                                    │
│ [Asistiré ✓]  [Ver detalles →]    │
│                                    │
│ Publicado por Laura Pérez          │
│ ❤️ 12  💬 5  📤 Compartir         │
└────────────────────────────────────┘
```

### Detalle del Evento

```
┌────────────────────────────────────┐
│ ← Volver                      [...] │
│                                    │
│ [Imagen grande del evento]         │
│                                    │
│ 📅 Reunión de Mamás                │
│                                    │
│ 📆 Sábado, 15 de Febrero 2026      │
│ ⏰ 4:00 PM - 7:00 PM               │
│                                    │
│ 📍 Parque Central                  │
│    Av. Principal 123, Quito        │
│    [Ver en mapa]                   │
│                                    │
│ 👥 5 de 20 asistentes confirmados  │
│    [Ver lista completa]            │
│                                    │
│ Descripción:                       │
│ Nos juntamos para que los niños... │
│                                    │
│ Organizado por: Laura Pérez        │
│                                    │
│ [✓ Confirmar Asistencia]           │
│                                    │
│ 💬 Comentarios (5)                 │
│ ...                                │
└────────────────────────────────────┘
```

---

## 🧪 Ejemplos de Uso

### Ejemplo 1: Evento Simple

```json
{
  "content": "Nos juntamos para celebrar el día de las madres",
  "postType": "event",
  "eventData": {
    "title": "Celebración Día de las Madres",
    "eventDate": "2026-05-10T15:00:00Z"
  }
}
```

### Ejemplo 2: Evento Completo

```json
{
  "content": "Workshop de lactancia materna con especialista certificada",
  "imageUrl": "https://...",
  "postType": "event",
  "eventData": {
    "title": "Workshop: Lactancia Materna",
    "description": "Taller práctico con la Dra. María Sánchez sobre técnicas de lactancia",
    "eventDate": "2026-03-20T10:00:00Z",
    "eventEndDate": "2026-03-20T12:00:00Z",
    "location": {
      "name": "Centro Comunitario La Floresta",
      "address": "Calle Los Pinos 456, Quito",
      "latitude": -0.1807,
      "longitude": -78.4678
    },
    "maxAttendees": 15,
    "requiresConfirmation": false
  }
}
```

---

## 📈 Métricas y Estadísticas

### Para el Organizador
- Total de asistentes confirmados
- Tasa de confirmación (confirmados vs vistas)
- Interacciones (likes, comentarios)

### Para el Admin
- Eventos creados por mes
- Eventos más populares
- Tasa de asistencia promedio
- Comunidades más activas en eventos

---

## 🚀 Características Futuras

- [ ] Eventos recurrentes (semanal, mensual)
- [ ] Co-organizadores de eventos
- [ ] Lista de espera cuando se llena el cupo
- [ ] Integración con calendario (Google Calendar, iCal)
- [ ] Chat grupal para asistentes
- [ ] Check-in en el evento (QR code)
- [ ] Galería de fotos del evento post-evento
- [ ] Encuesta de satisfacción post-evento
- [ ] Sugerencias de eventos basadas en intereses

---

¿Procedemos con la implementación? 🚀
