# 📅 Resumen: Sistema de Eventos en Comunidades - IMPLEMENTADO

## ✅ Estado: COMPLETADO

Se ha implementado exitosamente el sistema de eventos para posts de comunidad.

---

## 🎯 Funcionalidades Implementadas

### 1. ✅ Crear Evento
- Endpoint: `POST /api/communities/:communityId/posts`
- Validaciones completas
- Notificaciones push a miembros de la comunidad
- Soporte para ubicación, límite de asistentes, fecha y hora

### 2. ✅ Editar Evento
- Endpoint: `PUT /api/posts/:postId`
- Solo el autor puede editar
- Notifica automáticamente a asistentes si se cancela
- Actualización de fecha, ubicación, título, etc.

### 3. ✅ Confirmar Asistencia
- Endpoint: `POST /api/posts/:postId/attend`
- Validación de cupos disponibles
- Notifica al organizador
- Previene duplicados

### 4. ✅ Cancelar Asistencia
- Endpoint: `DELETE /api/posts/:postId/attend`
- Actualiza contador de asistentes
- Sin penalización para el usuario

### 5. ✅ Ver Asistentes
- Endpoint: `GET /api/posts/:postId/attendees`
- Lista completa con fotos y nombres
- Muestra cupos disponibles
- Información del evento

### 6. ✅ Listar Eventos
- Endpoint: `GET /api/communities/:communityId/events`
- Filtros: upcoming, past, all
- Paginación incluida
- Indica si el usuario está asistiendo

---

## 📝 Ejemplos de Uso

### Ejemplo 1: Crear un Evento Simple

**Request:**
```http
POST /api/communities/abc123/posts
Authorization: Bearer {token}
Content-Type: application/json
```

```json
{
  "content": "¡Nos vemos en el parque este sábado!",
  "postType": "event",
  "eventData": {
    "title": "Reunión de Mamás - Parque Central",
    "eventDate": "2026-02-15T16:00:00Z"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Evento creado exitosamente",
  "data": {
    "id": "post_xyz",
    "postType": "event",
    "content": "¡Nos vemos en el parque este sábado!",
    "eventData": {
      "title": "Reunión de Mamás - Parque Central",
      "eventDate": "2026-02-15T16:00:00Z",
      "status": "upcoming",
      "attendeeCount": 0,
      "attendees": []
    }
  }
}
```

---

### Ejemplo 2: Crear Evento Completo con Ubicación

**Request:**
```json
{
  "content": "Workshop gratuito sobre lactancia materna con la Dra. María Sánchez",
  "imageUrl": "https://storage.googleapis.com/munpa.../workshop.jpg",
  "postType": "event",
  "eventData": {
    "title": "Workshop: Lactancia Materna",
    "description": "Taller práctico con especialista certificada. Incluye sesión de preguntas y refrigerio.",
    "eventDate": "2026-03-20T10:00:00Z",
    "eventEndDate": "2026-03-20T12:00:00Z",
    "location": {
      "name": "Centro Comunitario La Floresta",
      "address": "Calle Los Pinos 456, Quito",
      "latitude": -0.1807,
      "longitude": -78.4678
    },
    "maxAttendees": 15
  }
}
```

---

### Ejemplo 3: Confirmar Asistencia

**Request:**
```http
POST /api/posts/post_xyz/attend
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "message": "Asistencia confirmada exitosamente",
  "data": {
    "postId": "post_xyz",
    "attendeeCount": 5,
    "userAttending": true
  }
}
```

---

### Ejemplo 4: Obtener Lista de Eventos Próximos

**Request:**
```http
GET /api/communities/abc123/events?filter=upcoming&page=1&limit=10
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "post_xyz",
      "postType": "event",
      "content": "¡Nos vemos en el parque!",
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
        "id": "user_123",
        "name": "Laura Pérez",
        "photo": "https://..."
      },
      "userAttending": true,
      "createdAt": "2026-02-05T10:00:00Z"
    }
  ],
  "pagination": {
    "total": 3,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

---

### Ejemplo 5: Editar Evento (Cambiar Fecha)

**Request:**
```http
PUT /api/posts/post_xyz
Authorization: Bearer {token}
Content-Type: application/json
```

```json
{
  "eventData": {
    "eventDate": "2026-02-16T16:00:00Z",
    "title": "Reunión de Mamás - NUEVA FECHA"
  }
}
```

---

### Ejemplo 6: Cancelar Evento

**Request:**
```json
{
  "eventData": {
    "status": "cancelled"
  }
}
```

**Efecto:**
- El evento se marca como cancelado
- Se envían notificaciones push automáticamente a todos los asistentes
- El evento sigue visible pero con estado "cancelado"

---

### Ejemplo 7: Ver Asistentes del Evento

**Request:**
```http
GET /api/posts/post_xyz/attendees
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "attendees": [
      {
        "userId": "user_123",
        "userName": "María López",
        "userPhoto": "https://..."
      },
      {
        "userId": "user_456",
        "userName": "Ana García",
        "userPhoto": "https://..."
      }
    ],
    "attendeeCount": 2,
    "maxAttendees": 20,
    "spotsAvailable": 18,
    "eventTitle": "Reunión de Mamás - Parque Central",
    "eventDate": "2026-02-15T16:00:00Z",
    "eventStatus": "upcoming"
  }
}
```

---

## 🔔 Notificaciones Implementadas

### 1. Nuevo Evento Creado
- **Enviado a**: Todos los miembros de la comunidad (excepto autor)
- **Tipo**: `community_event`
- **Título**: "📅 [Autor] creó un evento en [Comunidad]"
- **Cuerpo**: Título del evento

### 2. Nueva Confirmación de Asistencia
- **Enviado a**: Organizador del evento
- **Tipo**: `event_attendance_confirmed`
- **Título**: "📅 Nueva confirmación para tu evento"
- **Cuerpo**: "[Usuario] confirmó asistencia a '[Evento]'"

### 3. Evento Cancelado
- **Enviado a**: Todos los asistentes confirmados
- **Tipo**: `event_cancelled`
- **Título**: "❌ Evento cancelado"
- **Cuerpo**: "El evento '[Título]' ha sido cancelado"

---

## 📊 Estructura de Datos

### Post Tipo Evento en Firestore

```javascript
{
  id: "post_xyz",
  communityId: "community_abc",
  authorId: "user_123",
  content: "¡Nos vemos en el parque!",
  imageUrl: "https://...",
  postType: "event",  // ← NUEVO
  
  // Datos del evento
  eventData: {
    title: "Reunión de Mamás - Parque Central",
    description: "Nos juntamos para que los niños jueguen",
    eventDate: Timestamp,
    eventEndDate: Timestamp,  // opcional
    location: {
      name: "Parque Central",
      address: "Av. Principal 123",
      latitude: -0.1807,
      longitude: -78.4678
    },
    status: "upcoming",  // upcoming, ongoing, completed, cancelled
    attendees: ["user_456", "user_789"],
    attendeeCount: 2,
    maxAttendees: 20,  // opcional
    requiresConfirmation: false,
    reminderSent: false,
    reminderSentAt: null,
    dateChanged: false,  // se marca true si se cambia la fecha
    cancelledAt: null    // se llena al cancelar
  },
  
  // Campos regulares de post
  isPinned: false,
  likes: [],
  likeCount: 0,
  commentCount: 0,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

---

## 🎨 Diferencias entre Post Normal y Evento

| Característica | Post Normal | Post Evento |
|----------------|-------------|-------------|
| `postType` | `"normal"` | `"event"` |
| Tiene `eventData` | ❌ No | ✅ Sí |
| Fecha específica | ❌ No | ✅ Sí |
| Ubicación | ❌ No | ✅ Sí (opcional) |
| Asistentes | ❌ No | ✅ Sí |
| Estado (upcoming/completed) | ❌ No | ✅ Sí |
| Límite de participantes | ❌ No | ✅ Sí (opcional) |

---

## ✅ Validaciones Implementadas

### Al Crear Evento
- ✅ Título es obligatorio (no vacío)
- ✅ Fecha es obligatoria y debe ser válida
- ✅ Fecha debe ser futura
- ✅ Fecha de fin debe ser posterior a fecha de inicio
- ✅ maxAttendees debe ser > 0 si se proporciona
- ✅ Usuario debe ser miembro de la comunidad

### Al Confirmar Asistencia
- ✅ Post debe ser de tipo evento
- ✅ Usuario debe ser miembro de la comunidad
- ✅ Evento no debe estar cancelado
- ✅ Evento no debe haber pasado
- ✅ Usuario no debe estar ya en la lista
- ✅ Debe haber cupo disponible (si hay límite)

### Al Editar Evento
- ✅ Solo el autor puede editar
- ✅ Nuevas fechas deben ser futuras
- ✅ Validaciones de formato para todos los campos

---

## 🔐 Permisos

### Usuario Regular
- ✅ Crear eventos en comunidades donde es miembro
- ✅ Editar sus propios eventos
- ✅ Confirmar/cancelar asistencia
- ✅ Ver lista de asistentes
- ✅ Ver eventos de la comunidad

### Autor del Evento
- ✅ Todo lo anterior +
- ✅ Cancelar el evento
- ✅ Cambiar fecha/ubicación (notifica a asistentes)
- ✅ Modificar límite de asistentes

### Administrador
- ✅ Editar cualquier evento (endpoint existente `/api/admin/posts/:postId`)
- ✅ Eliminar cualquier evento

---

## 📱 Integración en el Frontend

### Crear Evento
```javascript
const createEvent = async (communityId, eventData) => {
  const response = await fetch(`/api/communities/${communityId}/posts`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      content: eventData.content,
      imageUrl: eventData.imageUrl,
      postType: 'event',
      eventData: {
        title: eventData.title,
        description: eventData.description,
        eventDate: eventData.eventDate,
        eventEndDate: eventData.eventEndDate,
        location: eventData.location,
        maxAttendees: eventData.maxAttendees
      }
    })
  });
  return await response.json();
};
```

### Confirmar Asistencia
```javascript
const attendEvent = async (postId) => {
  const response = await fetch(`/api/posts/${postId}/attend`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return await response.json();
};
```

### Obtener Eventos Próximos
```javascript
const getUpcomingEvents = async (communityId) => {
  const response = await fetch(
    `/api/communities/${communityId}/events?filter=upcoming&limit=20`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );
  return await response.json();
};
```

---

## 🧪 Testing

### Test 1: Crear Evento Simple
```bash
curl -X POST https://mumpabackend.vercel.app/api/communities/abc123/posts \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Test event",
    "postType": "event",
    "eventData": {
      "title": "Test Event",
      "eventDate": "2026-03-01T15:00:00Z"
    }
  }'
```

### Test 2: Confirmar Asistencia
```bash
curl -X POST https://mumpabackend.vercel.app/api/posts/POST_ID/attend \
  -H "Authorization: Bearer {token}"
```

### Test 3: Ver Eventos
```bash
curl -X GET "https://mumpabackend.vercel.app/api/communities/abc123/events?filter=upcoming" \
  -H "Authorization: Bearer {token}"
```

---

## 📋 Checklist de Implementación

- [x] Diseñar estructura de datos para eventos
- [x] Actualizar endpoint POST para crear eventos
- [x] Crear endpoint para confirmar asistencia
- [x] Crear endpoint para cancelar asistencia  
- [x] Crear endpoint para ver asistentes
- [x] Crear endpoint para listar eventos de comunidad
- [x] Crear endpoint PUT para editar eventos
- [x] Implementar notificaciones push
- [x] Validaciones completas
- [x] Documentación completa

---

## 🚀 Próximos Pasos Sugeridos

### Funcionalidades Futuras
1. **Recordatorios Automáticos**: Cron job que envíe recordatorios 24h antes
2. **Eventos Recurrentes**: Soporte para eventos semanales/mensuales
3. **Lista de Espera**: Cuando el evento esté lleno
4. **Check-in**: Código QR para confirmar asistencia presencial
5. **Galería de Fotos**: Post-evento para compartir fotos
6. **Co-organizadores**: Permitir múltiples organizadores
7. **Integración con Calendario**: Exportar a Google Calendar
8. **Chat de Evento**: Chat grupal para asistentes confirmados
9. **Encuesta Post-Evento**: Feedback de los asistentes
10. **Estadísticas**: Métricas de participación para organizadores

---

## 📞 Soporte

Para más información:
- Documentación completa: `API-EVENTOS-COMUNIDAD.md`
- Código fuente: `server.js` (líneas 16932-17950)
- Ejemplos: Este archivo

---

✅ **Sistema de Eventos COMPLETADO y LISTO para producción** 🎉

Fecha de implementación: 5 de febrero de 2026
