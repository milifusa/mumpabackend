# 📊 API Dashboard Admin - Gestión de Eventos

## 📋 Descripción

Endpoints especializados para que el dashboard de administrador pueda gestionar, visualizar y obtener estadísticas completas de todos los eventos del sistema.

---

## 🔐 Autenticación

Todos los endpoints requieren:
- **Autenticación**: Bearer Token
- **Permisos**: Administrador (`isAdmin: true`)

```
Authorization: Bearer {JWT_ADMIN_TOKEN}
```

---

## 📡 Endpoints

### 1. Listar Todos los Eventos

```http
GET /api/admin/events
```

**Query Parameters:**
- `status` (opcional): `upcoming` | `past` | `cancelled` | `all`
- `communityId` (opcional): Filtrar por comunidad específica
- `page` (opcional): Número de página (default: 1)
- `limit` (opcional): Items por página (default: 20)
- `sortBy` (opcional): `date` | `created` | `attendees` | `checkins` (default: `date`)
- `order` (opcional): `asc` | `desc` (default: `desc`)

**Ejemplo:**
```http
GET /api/admin/events?status=upcoming&sortBy=attendees&order=desc&page=1&limit=20
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "event_123",
      "title": "Workshop: Lactancia Materna",
      "description": "Taller práctico con especialista",
      "eventDate": "2026-03-20T10:00:00Z",
      "eventEndDate": "2026-03-20T12:00:00Z",
      "location": {
        "name": "Centro Comunitario",
        "address": "Calle Los Pinos 456",
        "latitude": -0.1807,
        "longitude": -78.4678
      },
      "status": "upcoming",
      "isBanner": true,
      
      "attendeeCount": 15,
      "checkedInCount": 0,
      "waitlistCount": 5,
      "maxAttendees": 15,
      "attendanceRate": 0,
      
      "author": {
        "id": "user_abc",
        "displayName": "Dra. María Sánchez",
        "email": "maria@example.com",
        "photoUrl": "https://..."
      },
      
      "communityId": "comm_xyz",
      "communityName": "Mamás Primerizas",
      "imageUrl": "https://...",
      
      "likeCount": 25,
      "commentCount": 12,
      
      "createdAt": "2026-02-10T15:00:00Z",
      "updatedAt": "2026-02-15T10:30:00Z"
    }
  ],
  "stats": {
    "total": 45,
    "upcoming": 20,
    "past": 22,
    "cancelled": 3,
    "totalAttendees": 450,
    "totalCheckins": 380,
    "totalWaitlist": 50,
    "averageAttendanceRate": 84
  },
  "pagination": {
    "total": 45,
    "page": 1,
    "limit": 20,
    "totalPages": 3
  }
}
```

---

### 2. Ver Detalle Completo de un Evento

```http
GET /api/admin/events/:eventId
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "event_123",
    "postType": "event",
    "content": "Workshop gratuito sobre lactancia materna",
    "imageUrl": "https://...",
    
    "eventData": {
      "title": "Workshop: Lactancia Materna",
      "description": "Taller práctico con la Dra. María Sánchez",
      "eventDate": "2026-03-20T10:00:00Z",
      "eventEndDate": "2026-03-20T12:00:00Z",
      "location": {
        "name": "Centro Comunitario",
        "address": "Calle Los Pinos 456",
        "latitude": -0.1807,
        "longitude": -78.4678
      },
      "status": "upcoming",
      "maxAttendees": 15,
      "checkInCode": "A7K9M2X1",
      "requiresConfirmation": false
    },
    
    "author": {
      "id": "user_abc",
      "displayName": "Dra. María Sánchez",
      "email": "maria@example.com",
      "photoUrl": "https://..."
    },
    
    "community": {
      "id": "comm_xyz",
      "name": "Mamás Primerizas",
      "imageUrl": "https://...",
      "memberCount": 250
    },
    
    "attendees": [
      {
        "userId": "user_001",
        "userName": "Laura Pérez",
        "userEmail": "laura@example.com",
        "userPhoto": "https://...",
        "checkedIn": true,
        "checkInTime": "2026-03-20T10:05:00Z"
      },
      {
        "userId": "user_002",
        "userName": "Ana García",
        "userEmail": "ana@example.com",
        "userPhoto": "https://...",
        "checkedIn": false,
        "checkInTime": null
      }
    ],
    
    "waitlist": [
      {
        "userId": "user_003",
        "userName": "María López",
        "userEmail": "maria@example.com",
        "userPhoto": "https://..."
      }
    ],
    
    "metrics": {
      "attendeeCount": 15,
      "checkedInCount": 12,
      "waitlistCount": 5,
      "attendanceRate": 80,
      "likeCount": 25,
      "commentCount": 12
    },
    
    "dates": {
      "createdAt": "2026-02-10T15:00:00Z",
      "updatedAt": "2026-03-20T10:05:00Z",
      "publishedAt": "2026-02-10T15:00:00Z"
    }
  }
}
```

---

### 3. Cancelar Evento (Admin)

```http
PATCH /api/admin/events/:eventId/cancel
```

**Body:**
```json
{
  "reason": "El especialista tuvo un imprevisto"
}
```

**Efectos:**
- Cambia el estado del evento a `cancelled`
- Guarda la razón de cancelación
- **Envía notificaciones push** a todos los asistentes y lista de espera

**Response:**
```json
{
  "success": true,
  "message": "Evento cancelado exitosamente"
}
```

---

### 4. Editar Evento

```http
PUT /api/admin/events/:eventId
```

**Descripción:** Permite al administrador editar los detalles de un evento existente.

**Body:** (todos los campos son opcionales, solo envía los que quieres actualizar)
```json
{
  "title": "Nuevo título del evento",
  "description": "Nueva descripción del evento",
  "content": "Contenido del post actualizado",
  "imageUrl": "https://storage.googleapis.com/.../nueva-imagen.jpg",
  "eventDate": "2026-03-25T10:00:00Z",
  "eventEndDate": "2026-03-25T12:00:00Z",
  "location": {
    "name": "Nuevo Centro Comunitario",
    "address": "Calle Nueva 789",
    "city": "Ciudad de México",
    "latitude": -0.1807,
    "longitude": -78.4678
  },
  "maxAttendees": 50,
  "requiresConfirmation": true,
  "status": "active"
}
```

**Campos Editables:**

| Campo | Tipo | Descripción | Validación |
|-------|------|-------------|------------|
| title | string | Título del evento | Mínimo 3 caracteres |
| description | string | Descripción del evento | - |
| content | string | Contenido del post | - |
| imageUrl | string/null | URL de la imagen del evento | - |
| eventDate | string (ISO) | Fecha y hora del evento | Debe ser fecha válida |
| eventEndDate | string (ISO) | Fecha y hora de fin | Debe ser fecha válida o null |
| location | object | Ubicación del evento | - |
| maxAttendees | number/null | Cupo máximo | Debe ser ≥ asistentes actuales |
| requiresConfirmation | boolean | Si requiere confirmación | - |
| status | string | Estado del evento | 'active', 'cancelled', 'completed' |

**Response Success (Formato Completo):**
```json
{
  "success": true,
  "message": "Evento actualizado exitosamente",
  "data": {
    "id": "event_123",
    "postType": "event",
    "content": "Contenido del post actualizado",
    "imageUrl": "https://storage.googleapis.com/.../nueva-imagen.jpg",
    
    "eventData": {
      "title": "Nuevo título del evento",
      "description": "Nueva descripción del evento",
      "eventDate": "2026-03-25T10:00:00Z",
      "eventEndDate": "2026-03-25T12:00:00Z",
      "location": {
        "name": "Nuevo Centro Comunitario",
        "address": "Calle Nueva 789",
        "city": "Ciudad de México"
      },
      "status": "active",
      "isBanner": false,
      "maxAttendees": 50,
      "checkInCode": "ABC12345",
      "requiresConfirmation": true
    },
    
    "author": {
      "id": "user_abc",
      "displayName": "Dra. María",
      "email": "maria@example.com",
      "photoUrl": "https://..."
    },
    
    "community": {
      "id": "comm_xyz",
      "name": "Mamás Primerizas",
      "imageUrl": "https://...",
      "memberCount": 150
    },
    
    "attendees": [...],
    "waitlist": [...],
    
    "metrics": {
      "attendeeCount": 25,
      "checkedInCount": 12,
      "waitlistCount": 5,
      "attendanceRate": 48,
      "likeCount": 42,
      "commentCount": 8
    },
    
    "dates": {
      "createdAt": "2026-02-01T10:00:00Z",
      "updatedAt": "2026-02-05T16:30:00Z",
      "publishedAt": "2026-02-01T10:00:00Z"
    }
  }
}
```

**Response Error (Validación):**
```json
{
  "success": false,
  "message": "No puedes reducir el límite a 20 porque ya hay 25 asistentes confirmados"
}
```

**Response Error (Estado Inválido):**
```json
{
  "success": false,
  "message": "Estado inválido. Debe ser: active, cancelled, completed"
}
```

**Notas Importantes:**
- ⚠️ Solo puedes reducir `maxAttendees` si el nuevo valor es mayor o igual a los asistentes confirmados actuales
- 📅 Si cambias la fecha del evento, los asistentes NO son notificados automáticamente
- 🚫 Si cambias el status a 'cancelled', considera usar el endpoint de cancelación que envía notificaciones
- 🖼️ **NUEVO**: Ahora puedes actualizar `imageUrl` y `content` del post
- 📊 **Respuesta completa**: El endpoint devuelve toda la información del evento (igual que GET)

---

### 5. Eliminar Evento Permanentemente

```http
DELETE /api/admin/events/:eventId
```

**Warning:** Esta acción es **irreversible**. El evento se elimina permanentemente de la base de datos.

**Response:**
```json
{
  "success": true,
  "message": "Evento eliminado permanentemente"
}
```

---

### 6. Marcar/Desmarcar Evento como Banner

```http
PATCH /api/admin/events/:eventId/banner
```

**Descripción:** Marca o desmarca un evento para que aparezca como banner destacado en la aplicación móvil.

**Body:**
```json
{
  "isBanner": true
}
```

**Características:**
- Los eventos marcados como banner aparecen en una sección destacada del app
- Solo eventos futuros y no cancelados se muestran como banner
- Los usuarios solo ven banners de sus comunidades
- Los banners se ordenan por fecha del evento (más próximo primero)

**Response Success:**
```json
{
  "success": true,
  "message": "Evento marcado como banner",
  "data": {
    "eventId": "event_123",
    "isBanner": true
  }
}
```

**Response Error (Evento Cancelado):**
```json
{
  "success": false,
  "message": "No se puede marcar como banner un evento cancelado"
}
```

**Response Error (Tipo Inválido):**
```json
{
  "success": false,
  "message": "El campo isBanner debe ser un booleano"
}
```

**Ver:** `API-BANNERS-EVENTOS.md` para documentación completa del sistema de banners.

---

### 7. Estadísticas Generales de Eventos

```http
GET /api/admin/events/stats/summary
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalEvents": 45,
    "upcomingEvents": 20,
    "pastEvents": 22,
    "cancelledEvents": 3,
    
    "totalAttendees": 450,
    "totalCheckins": 380,
    "totalWaitlist": 50,
    
    "averageAttendeesPerEvent": 10,
    "averageAttendanceRate": 84,
    
    "eventsWithWaitlist": 8,
    "eventsWithCheckIn": 22,
    
    "topCommunities": [
      {
        "communityId": "comm_xyz",
        "eventCount": 15
      },
      {
        "communityId": "comm_abc",
        "eventCount": 12
      }
    ],
    
    "eventsByMonth": {},
    
    "totalLikes": 1250,
    "totalComments": 480
  }
}
```

---

## 📊 Casos de Uso en el Dashboard

### Vista Principal de Eventos

```jsx
// Dashboard Component
const EventsDashboard = () => {
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState({});
  const [filters, setFilters] = useState({
    status: 'upcoming',
    sortBy: 'date',
    page: 1
  });

  useEffect(() => {
    fetchEvents();
  }, [filters]);

  const fetchEvents = async () => {
    const response = await fetch(
      `/api/admin/events?${new URLSearchParams(filters)}`,
      {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      }
    );
    const data = await response.json();
    setEvents(data.data);
    setStats(data.stats);
  };

  return (
    <div>
      {/* Stats Cards */}
      <div className="stats-grid">
        <StatCard title="Total Eventos" value={stats.total} />
        <StatCard title="Próximos" value={stats.upcoming} />
        <StatCard title="Asistentes" value={stats.totalAttendees} />
        <StatCard title="Tasa Asistencia" value={`${stats.averageAttendanceRate}%`} />
      </div>

      {/* Filters */}
      <Filters onChange={setFilters} />

      {/* Events Table */}
      <EventsTable events={events} />
    </div>
  );
};
```

### Detalle de Evento

```jsx
const EventDetail = ({ eventId }) => {
  const [event, setEvent] = useState(null);

  useEffect(() => {
    fetchEventDetail();
  }, [eventId]);

  const fetchEventDetail = async () => {
    const response = await fetch(`/api/admin/events/${eventId}`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });
    const data = await response.json();
    setEvent(data.data);
  };

  return (
    <div>
      <EventInfo event={event} />
      <AttendeesList attendees={event.attendees} />
      <WaitlistList waitlist={event.waitlist} />
      <MetricsCharts metrics={event.metrics} />
      
      <button onClick={() => cancelEvent(eventId)}>
        Cancelar Evento
      </button>
      <button onClick={() => deleteEvent(eventId)}>
        Eliminar Permanentemente
      </button>
    </div>
  );
};
```

---

## 📈 Métricas y KPIs Disponibles

### Por Evento:
- **Asistentes Confirmados**: Cuántos confirmaron
- **Check-ins Reales**: Cuántos asistieron realmente
- **Tasa de Asistencia**: `(checkins / attendees) * 100`
- **Lista de Espera**: Demanda no satisfecha
- **Engagement**: Likes y comentarios

### Generales:
- **Total de Eventos**: Histórico completo
- **Eventos Activos**: Próximos no cancelados
- **Promedio de Asistentes**: Por evento
- **Tasa Promedio de Asistencia**: Del sistema
- **Comunidades Más Activas**: Ranking por número de eventos

---

## 🎨 Componentes UI Sugeridos

### Tabla de Eventos

```
┌─────────────────────────────────────────────────────────────────┐
│ Gestión de Eventos                              [+ Nuevo Evento] │
├─────────────────────────────────────────────────────────────────┤
│ Filtros: [Todos ▼] [Comunidad ▼] [Ordenar: Fecha ▼]           │
├─────────────────────────────────────────────────────────────────┤
│ Título            │ Fecha      │ Asistentes │ Check-ins │ Estado│
├───────────────────┼────────────┼────────────┼───────────┼───────┤
│ Workshop Lactancia│ 20 Mar 2026│ 15/15 (5🔄)│ 0        │ 🟢    │
│ Reunión Mamás     │ 15 Feb 2026│ 18/20      │ 15 (83%) │ 🟢    │
│ Yoga Prenatal     │ 10 Feb 2026│ 8/10       │ 8 (100%) │ ✅    │
│ Picnic Familiar   │ 05 Feb 2026│ 12/15      │ -        │ ❌    │
└─────────────────────────────────────────────────────────────────┘

🟢 Próximo  ✅ Completado  ❌ Cancelado  🔄 Lista de espera
```

### Cards de Estadísticas

```
┌────────────────┐ ┌────────────────┐ ┌────────────────┐ ┌────────────────┐
│ Total Eventos  │ │ Próximos       │ │ Total Asist.   │ │ Tasa Asist.    │
│      45        │ │      20        │ │     450        │ │      84%       │
│ +5 este mes    │ │ Esta semana: 3 │ │ Promedio: 10   │ │ ⬆ +3% vs mes  │
└────────────────┘ └────────────────┘ └────────────────┘ └────────────────┘
```

### Detalle de Evento

```
┌─────────────────────────────────────────────────────────────────┐
│ Workshop: Lactancia Materna                        [Editar] [...] │
├─────────────────────────────────────────────────────────────────┤
│ 📅 20 de Marzo 2026, 10:00 AM - 12:00 PM                      │
│ 📍 Centro Comunitario, Calle Los Pinos 456                     │
│ 👥 Comunidad: Mamás Primerizas                                 │
│ 👤 Organizador: Dra. María Sánchez                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ 📊 Métricas                                                     │
│ ├─ Asistentes confirmados: 15/15 (LLENO)                      │
│ ├─ Check-ins realizados: 0                                     │
│ ├─ En lista de espera: 5 personas                             │
│ └─ Engagement: 25 ❤️  12 💬                                   │
│                                                                 │
│ 👥 Asistentes (15)                          [Exportar CSV]     │
│ ┌─────────────────────────────────────────────────────────────┐│
│ │ ✅ Laura Pérez          laura@example.com    Check-in: Si  ││
│ │ ⭕ Ana García           ana@example.com      Check-in: No  ││
│ │ ⭕ María López          maria@example.com    Check-in: No  ││
│ └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│ 📋 Lista de Espera (5)                                         │
│ ┌─────────────────────────────────────────────────────────────┐│
│ │ 1. Carmen Ruiz         carmen@example.com   Posición: 1    ││
│ │ 2. Sofia Torres        sofia@example.com    Posición: 2    ││
│ └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│ [Cancelar Evento] [Eliminar Permanentemente]                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔧 Funcionalidades Administrativas

### Acciones Disponibles:

1. **Ver Todos los Eventos**
   - Filtrar por estado (próximos, pasados, cancelados)
   - Filtrar por comunidad
   - Ordenar por múltiples criterios
   - Paginación

2. **Ver Detalle Completo**
   - Toda la información del evento
   - Lista completa de asistentes con check-in status
   - Lista de espera
   - Métricas en tiempo real

3. **Cancelar Evento**
   - Con razón opcional
   - Notifica automáticamente a todos

4. **Eliminar Evento**
   - Eliminación permanente
   - Solo para casos necesarios

5. **Exportar Datos**
   - Lista de asistentes (CSV)
   - Métricas del evento
   - Reportes personalizados

---

## 📊 Reportes Disponibles

### Reporte de Asistencia

```javascript
const generateAttendanceReport = async (eventId) => {
  const response = await fetch(`/api/admin/events/${eventId}`);
  const { data } = await response.json();
  
  return {
    eventTitle: data.eventData.title,
    totalConfirmed: data.attendees.length,
    totalCheckedIn: data.metrics.checkedInCount,
    attendanceRate: data.metrics.attendanceRate,
    noShows: data.attendees.filter(a => !a.checkedIn).map(a => ({
      name: a.userName,
      email: a.userEmail
    }))
  };
};
```

### Reporte de Demanda

```javascript
const generateDemandReport = async () => {
  const response = await fetch('/api/admin/events?status=all');
  const { data } = await response.json();
  
  return {
    totalEvents: data.length,
    eventsWithWaitlist: data.filter(e => e.waitlistCount > 0).length,
    averageWaitlistSize: data.reduce((sum, e) => sum + e.waitlistCount, 0) / data.length,
    mostDemandedEvents: data
      .filter(e => e.waitlistCount > 0)
      .sort((a, b) => b.waitlistCount - a.waitlistCount)
      .slice(0, 5)
  };
};
```

---

## 🔐 Permisos y Seguridad

### Requerido:
- ✅ Token JWT válido
- ✅ Usuario con rol `admin: true`

### Validaciones:
- Solo administradores pueden acceder
- Logs de todas las acciones administrativas
- Confirmación requerida para eliminación permanente

---

## 🧪 Testing

### Test de Listado
```bash
curl -X GET "https://mumpabackend.vercel.app/api/admin/events?status=upcoming&limit=5" \
  -H "Authorization: Bearer {ADMIN_TOKEN}"
```

### Test de Detalle
```bash
curl -X GET "https://mumpabackend.vercel.app/api/admin/events/EVENT_ID" \
  -H "Authorization: Bearer {ADMIN_TOKEN}"
```

### Test de Cancelación
```bash
curl -X PATCH "https://mumpabackend.vercel.app/api/admin/events/EVENT_ID/cancel" \
  -H "Authorization: Bearer {ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"reason": "Imprevisto del organizador"}'
```

### Test de Estadísticas
```bash
curl -X GET "https://mumpabackend.vercel.app/api/admin/events/stats/summary" \
  -H "Authorization: Bearer {ADMIN_TOKEN}"
```

### Test de Banner
```bash
curl -X PATCH "https://mumpabackend.vercel.app/api/admin/events/EVENT_ID/banner" \
  -H "Authorization: Bearer {ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"isBanner": true}'
```

---

## 📋 Checklist de Implementación

- [x] Endpoint de listado con filtros
- [x] Endpoint de detalle completo
- [x] Endpoint de edición de eventos
- [x] Endpoint de cancelación con notificaciones
- [x] Endpoint de eliminación
- [x] Endpoint de marcar/desmarcar banner
- [x] Endpoint de estadísticas
- [x] Métricas calculadas automáticamente
- [x] Paginación implementada
- [x] Ordenamiento múltiple
- [x] Logs de acciones administrativas

---

## 🚀 Próximas Mejoras

- [ ] Exportar reportes en PDF
- [ ] Gráficos de tendencias por mes
- [ ] Comparativas entre comunidades
- [ ] Alertas automáticas para eventos problemáticos
- [ ] Edición de eventos desde dashboard
- [ ] Bulk actions (cancelar múltiples eventos)
- [ ] Plantillas de eventos
- [ ] Prioridad de banners (orden personalizado)

---

## 📞 Soporte

**Documentación Relacionada:**
- `API-EVENTOS-COMUNIDAD.md` - API de eventos para usuarios
- `EVENTOS-FUNCIONALIDADES-AVANZADAS.md` - Funcionalidades avanzadas
- `API-BANNERS-EVENTOS.md` - Sistema de banners destacados
- `RESUMEN-EVENTOS-COMUNIDAD.md` - Guía de uso

**Código Fuente:**
- `server.js` - Endpoints implementados (líneas ~25990+)

---

✅ **API DASHBOARD ADMIN COMPLETA Y LISTA** 🎉

Fecha de implementación: 5 de febrero de 2026
