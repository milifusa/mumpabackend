# 📅 Sistema de Recordatorios Diarios con ChatGPT

Sistema completo de notificaciones diarias automáticas que usa **ChatGPT GPT-4** para generar mensajes personalizados según cada bebé, con dashboard administrativo para control total.

---

## 🎯 Características Principales

✅ **Mensajes únicos generados por IA** - Cada notificación es diferente  
✅ **Personalización total** - Nombre, edad, género del bebé  
✅ **3 tipos de recordatorios** - Vacunas, consejos, hitos  
✅ **Dashboard administrativo** - Control completo desde panel admin  
✅ **Historial completo** - Log de cada notificación con prompt usado  
✅ **Estadísticas detalladas** - Análisis de envíos y engagement  
✅ **Fallback automático** - Sistema funciona aunque GPT falle  
✅ **Control de frecuencia** - Diario, cada 2-3 días, semanal  
✅ **Solo niños pequeños** - Hasta 24 meses (2 años)  

---

## 🤖 Generación con ChatGPT

### **Cómo Funciona**

Cada notificación se genera con **GPT-4** considerando:
- 👶 Nombre del bebé (ej: "Sofía")
- 📅 Edad exacta en meses y días
- 👧👦 Género del bebé
- 💉🎓🎉 Tipo de recordatorio

### **Prompts Personalizados**

#### **Vacunas**
```
Eres una doula experta y cálida. Escribe un recordatorio breve (máximo 100 caracteres) 
para que los padres no olviden las vacunas de Sofía, una niña de 2 meses. 
Las vacunas son: Pentavalente, Rotavirus y Neumocócica.

Debe ser:
- Cálido y empático
- Recordar la importancia sin asustar
- Mencionar el nombre del bebé
- Incluir emoji relevante
```

**Ejemplo de respuesta:**
> "💉 Sofía necesita sus vacunas de los 2 meses pronto. ¡Agenda tu cita!"

#### **Consejos**
```
Eres una doula experta y cálida. Da un consejo práctico y valioso para 
padres de Sofía, una niña de 6 meses.

El consejo debe ser:
- Específico para la edad de 6 meses
- Práctico y aplicable hoy
- Máximo 120 caracteres
- Basado en evidencia científica
- Cálido y empático
```

**Ejemplo de respuesta:**
> "🥄 A los 6 meses Sofía puede empezar con papillas. La leche sigue siendo su alimento principal"

#### **Hitos**
```
Eres una doula experta. Sofía, una niña, cumple 6 meses hoy. 
Escribe un mensaje celebratorio breve (máximo 100 caracteres) que:
- Celebre el hito
- Mencione 1 logro típico de esta edad
- Sea emotivo y positivo
```

**Ejemplo de respuesta:**
> "🎂 ¡Sofía cumple 6 meses! Ya se sienta solita y explora el mundo. ¡Qué grande!"

---

## 📊 Estructura de Datos

### **Colección: `reminders_history`**

Log completo de cada notificación enviada:

```javascript
{
  // Usuario y bebé
  userId: "abc123",
  userName: "María López",
  childId: "def456",
  childName: "Sofía",
  childAge: 6,           // meses
  childAgeDays: 182,     // días exactos
  
  // Notificación
  reminderType: "tip",   // vaccine | tip | milestone
  title: "👶 Consejo del día",
  message: "🥄 A los 6 meses Sofía puede...",
  
  // ChatGPT
  generatedBy: "chatgpt", // chatgpt | fallback
  model: "gpt-4",
  prompt: "Eres una doula experta...",
  
  // Estado
  sent: true,
  sentAt: Timestamp,
  createdAt: Timestamp
}
```

### **Colección: `system_config/reminders`**

Configuración global del sistema:

```javascript
{
  enabled: true,         // Activar/desactivar sistema completo
  frequency: "daily",    // daily | every2days | every3days | weekly
  timeOfDay: "09:00",    // Hora de envío (México)
  
  types: {
    vaccines: true,      // Recordatorios de vacunas
    tips: true,          // Consejos diarios
    milestones: true     // Celebración de hitos
  },
  
  updatedAt: Timestamp,
  updatedBy: "admin_uid"
}
```

---

## 🎛️ API - Endpoints de Administración

### **1. Ver Configuración**

```http
GET /api/admin/reminders/config
Authorization: Bearer {admin_token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "enabled": true,
    "frequency": "daily",
    "timeOfDay": "09:00",
    "types": {
      "vaccines": true,
      "tips": true,
      "milestones": true
    }
  }
}
```

---

### **2. Actualizar Configuración**

```http
PUT /api/admin/reminders/config
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "enabled": true,
  "frequency": "every2days",
  "timeOfDay": "10:00",
  "types": {
    "vaccines": true,
    "tips": false,
    "milestones": true
  }
}
```

**Frecuencias disponibles:**
- `daily` - Cada día
- `every2days` - Cada 2 días
- `every3days` - Cada 3 días
- `weekly` - Cada semana

---

### **3. Ver Historial**

```http
GET /api/admin/reminders/history?page=1&limit=50&childName=&reminderType=&generatedBy=
Authorization: Bearer {admin_token}
```

**Parámetros:**
- `page` - Número de página (default: 1)
- `limit` - Items por página (default: 50)
- `childName` - Filtrar por nombre de bebé
- `reminderType` - Filtrar por tipo: `vaccine`, `tip`, `milestone`
- `generatedBy` - Filtrar por fuente: `chatgpt`, `fallback`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "rec_123",
      "userName": "María López",
      "childName": "Sofía",
      "childAge": 6,
      "reminderType": "tip",
      "title": "👶 Consejo del día",
      "message": "🥄 A los 6 meses Sofía puede...",
      "generatedBy": "chatgpt",
      "model": "gpt-4",
      "sentAt": "2025-01-15T09:00:00Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 25,
    "itemsPerPage": 50,
    "totalItems": 1250
  }
}
```

---

### **4. Ver Estadísticas**

```http
GET /api/admin/reminders/stats
Authorization: Bearer {admin_token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 1250,
    "last24h": 45,
    "last7days": 315,
    "last30days": 1200,
    "averagePerDay": "40.0",
    
    "byType": {
      "vaccine": 200,
      "tip": 900,
      "milestone": 150
    },
    
    "bySource": {
      "chatgpt": 1100,
      "fallback": 150
    },
    
    "topUsers": [
      { "name": "María López", "count": 90 },
      { "name": "Ana García", "count": 85 },
      { "name": "Luis Pérez", "count": 78 }
    ]
  }
}
```

---

### **5. Ver Detalle de Notificación**

```http
GET /api/admin/reminders/history/:id
Authorization: Bearer {admin_token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "rec_123",
    "userId": "user_abc",
    "userName": "María López",
    "childId": "child_def",
    "childName": "Sofía",
    "childAge": 6,
    "childAgeDays": 182,
    "reminderType": "tip",
    "title": "👶 Consejo del día",
    "message": "🥄 A los 6 meses Sofía puede empezar con papillas...",
    "generatedBy": "chatgpt",
    "model": "gpt-4",
    "prompt": "Eres una doula experta y cálida. Da un consejo...",
    "sent": true,
    "sentAt": "2025-01-15T09:00:00Z",
    "createdAt": "2025-01-15T09:00:00Z"
  }
}
```

---

## 🚀 Endpoints de Envío

### **Envío Automático (Cron)**

```http
POST /api/notifications/daily-reminders
Authorization: Bearer {admin_token}
```

Este endpoint debe ser llamado **diariamente por un cron job**.

**Proceso:**
1. Obtiene todos los usuarios con hijos
2. Para cada usuario, encuentra el hijo más pequeño (≤24 meses)
3. Calcula edad exacta en meses y días
4. Determina qué tipo de recordatorio enviar según calendario
5. Genera mensaje personalizado con ChatGPT
6. Si GPT falla, usa mensaje fallback
7. Envía push notification
8. Guarda en `notifications` y `reminders_history`

**Response:**
```json
{
  "success": true,
  "message": "Recordatorios diarios enviados",
  "data": {
    "notificationsSent": 45,
    "errors": 2,
    "results": [
      {
        "userId": "user_abc",
        "childName": "Sofía",
        "ageMonths": 6,
        "reminderType": "tip",
        "title": "👶 Consejo del día",
        "generatedBy": "chatgpt"
      }
    ]
  }
}
```

---

### **Prueba de Usuario**

```http
POST /api/notifications/test-daily-reminder
Authorization: Bearer {user_token}
```

Genera y envía un recordatorio de prueba al usuario actual.

**Response:**
```json
{
  "success": true,
  "message": "Recordatorio de prueba enviado",
  "data": {
    "childName": "Sofía",
    "ageMonths": 6,
    "ageDays": 182,
    "reminder": {
      "type": "tip",
      "title": "👶 Consejo del día",
      "message": "🥄 A los 6 meses Sofía puede empezar con papillas..."
    }
  }
}
```

---

## 📅 Tipos de Recordatorios

### **💉 Vacunas (vaccine)**

Según calendario mexicano:

| Edad | Días antes | Vacunas |
|------|------------|---------|
| 0 meses | 3 días | BCG, Hepatitis B |
| 2 meses | 7 días / 1 día | Pentavalente, Rotavirus, Neumocócica |
| 4 meses | 7 días / 1 día | 2da dosis: Pentavalente, Rotavirus, Neumocócica |
| 6 meses | 7 días / 1 día | 3ra dosis: Pentavalente, 2da Rotavirus |
| 7 meses | 7 días | Influenza (1ra dosis) |
| 12 meses | 7 días / 1 día | SRP, Neumocócica refuerzo |
| 18 meses | 7 días | Pentavalente refuerzo |
| 24 meses | 7 días | Influenza refuerzo |

**Ejemplos de mensajes:**
- 7 días antes: "La próxima semana tu bebé debe recibir..."
- 1 día antes: "¡Mañana toca vacunas de los 2 meses!"

---

### **👶 Consejos (tip)**

Consejos prácticos según edad, rotan diariamente:

| Edad | Temas |
|------|-------|
| 0 meses | Contacto piel con piel, lactancia, sueño, cuidados |
| 1-2 meses | Estimulación visual, hablar, tiempo boca abajo |
| 3-5 meses | Juegos, sonidos, agarrar objetos, girar |
| 6 meses | Alimentación complementaria, gateo, dentición |
| 9-11 meses | Gestos, gateo, exploración segura |
| 12 meses | Primeras palabras, caminar, independencia |
| 18-24 meses | Lenguaje, juego simbólico, socialización |

---

### **🎉 Hitos (milestone)**

Celebración en cumplemes importantes:

- 📸 1 mes
- 🎯 3 meses
- 🎂 6 meses
- 📊 9 meses
- 🎊 12 meses (1 año)

**Ejemplo:**  
> "🎂 ¡Sofía cumple 6 meses! Ya se sienta solita y explora el mundo. ¡Qué grande!"

---

## 🔄 Fallback Automático

Si ChatGPT falla o no está disponible:

✅ **Usa base de datos estática** con 50+ mensajes predefinidos  
✅ **Personaliza** con nombre del bebé  
✅ **Log indica** fuente: `'fallback'`  
✅ **Sistema nunca falla** por problemas con OpenAI  

---

## ⚙️ Configurar Cron Job

### **Opción 1: Vercel Cron**

En `vercel.json`:

```json
{
  "crons": [{
    "path": "/api/notifications/daily-reminders",
    "schedule": "0 9 * * *"
  }]
}
```

### **Opción 2: Servicio Externo**

Usar [cron-job.org](https://cron-job.org) o [EasyCron](https://www.easycron.com):

- **URL:** `https://api.munpa.online/api/notifications/daily-reminders`
- **Method:** POST
- **Headers:** `Authorization: Bearer {admin_token}`
- **Schedule:** `0 9 * * *` (9am diario, hora de México)

---

## 📱 Ejemplo de Uso en Dashboard

```typescript
// 1. Obtener configuración actual
const getConfig = async () => {
  const response = await fetch('/api/admin/reminders/config', {
    headers: {
      'Authorization': `Bearer ${adminToken}`
    }
  });
  const data = await response.json();
  console.log(data.data); // { enabled: true, frequency: 'daily', ... }
};

// 2. Cambiar a envío semanal
const updateConfig = async () => {
  await fetch('/api/admin/reminders/config', {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      frequency: 'weekly',
      types: {
        vaccines: true,
        tips: false,      // Deshabilitar consejos
        milestones: true
      }
    })
  });
};

// 3. Ver historial con filtros
const getHistory = async () => {
  const response = await fetch(
    '/api/admin/reminders/history?page=1&generatedBy=chatgpt&reminderType=vaccine',
    {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    }
  );
  const data = await response.json();
  console.log(data.data); // Array de notificaciones
  console.log(data.pagination); // Info de paginación
};

// 4. Ver estadísticas
const getStats = async () => {
  const response = await fetch('/api/admin/reminders/stats', {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  const data = await response.json();
  console.log(data.data);
  // {
  //   total: 1250,
  //   byType: { vaccine: 200, tip: 900, milestone: 150 },
  //   bySource: { chatgpt: 1100, fallback: 150 },
  //   topUsers: [...]
  // }
};

// 5. Ver detalle de notificación específica
const getDetail = async (id: string) => {
  const response = await fetch(`/api/admin/reminders/history/${id}`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  const data = await response.json();
  console.log(data.data.prompt); // Ver prompt usado en ChatGPT
  console.log(data.data.message); // Ver respuesta generada
};
```

---

## 🎨 Componentes UI Sugeridos para Dashboard

### **1. Panel de Configuración**

```
┌─────────────────────────────────────┐
│ ⚙️ Configuración de Recordatorios   │
├─────────────────────────────────────┤
│                                     │
│ Estado: ● Activo                    │
│ [Toggle] Activar/Desactivar         │
│                                     │
│ Frecuencia:                         │
│ ○ Diario                            │
│ ● Cada 2 días                       │
│ ○ Cada 3 días                       │
│ ○ Semanal                           │
│                                     │
│ Hora de envío: [09:00] 🕐          │
│                                     │
│ Tipos de recordatorios:             │
│ ☑ Vacunas                           │
│ ☑ Consejos diarios                  │
│ ☑ Hitos del desarrollo              │
│                                     │
│ [Guardar cambios]                   │
└─────────────────────────────────────┘
```

### **2. Tabla de Historial**

```
┌────────────────────────────────────────────────────────────┐
│ 📊 Historial de Recordatorios  Filtros: [▾] [▾] [▾]      │
├────────────────────────────────────────────────────────────┤
│ Fecha       │ Usuario  │ Bebé  │ Tipo    │ Fuente  │ Ver  │
│─────────────┼──────────┼───────┼─────────┼─────────┼──────│
│ 2025-01-15  │ María L. │ Sofía │ 💉 Vac. │ ChatGPT │ 👁️  │
│ 2025-01-15  │ Ana G.   │ Mateo │ 👶 Tip  │ ChatGPT │ 👁️  │
│ 2025-01-14  │ Luis P.  │ Emma  │ 🎉 Hito │ Fallback│ 👁️  │
│...                                                        │
│                                     [←] Página 1/25 [→]  │
└────────────────────────────────────────────────────────────┘
```

### **3. Tarjetas de Estadísticas**

```
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ 📨 Enviadas hoy │  │ 📊 Esta semana  │  │ 🤖 ChatGPT      │
│                 │  │                 │  │                 │
│      45         │  │      315        │  │      88%        │
│                 │  │                 │  │                 │
│  +5 vs ayer     │  │  +12 vs pasada  │  │  1100/1250      │
└─────────────────┘  └─────────────────┘  └─────────────────┘

┌────────────────────────────────────────────────────────────┐
│ 📈 Por Tipo de Recordatorio                               │
├────────────────────────────────────────────────────────────┤
│ 💉 Vacunas     ████████░░░░░░░░░░  200 (16%)              │
│ 👶 Consejos    ████████████████████ 900 (72%)              │
│ 🎉 Hitos       ███░░░░░░░░░░░░░░░░  150 (12%)              │
└────────────────────────────────────────────────────────────┘
```

---

## ✅ Checklist de Implementación

### **Backend**
- [x] Función de generación con ChatGPT
- [x] Sistema de fallback
- [x] Endpoint de envío automático
- [x] Endpoint de prueba
- [x] Endpoints de administración (config, history, stats)
- [x] Guardar logs en `reminders_history`
- [x] Configuración en `system_config`

### **Dashboard**
- [ ] Página de configuración
- [ ] Tabla de historial con filtros
- [ ] Vista de detalle de notificación
- [ ] Tarjetas de estadísticas
- [ ] Gráficas de tendencias

### **Infraestructura**
- [ ] Configurar cron job (Vercel o externo)
- [ ] Crear índices en Firestore:
  - `reminders_history` por `sentAt`
  - `reminders_history` por `userId`
  - `reminders_history` por `reminderType`
  - `reminders_history` por `generatedBy`

---

## 🐛 Troubleshooting

### **No se están enviando notificaciones**

1. Verificar que el cron job esté configurado
2. Revisar logs en Vercel: `📅 [DAILY] Iniciando envío...`
3. Verificar configuración: `GET /api/admin/reminders/config`
4. Comprobar que `enabled: true`

### **Todos los mensajes son 'fallback'**

1. Verificar variable de entorno `OPENAI_API_KEY`
2. Revisar logs: `⚠️ [DAILY] OpenAI no configurado`
3. Verificar créditos en cuenta de OpenAI

### **No aparecen en el historial**

1. Verificar que se esté guardando en `reminders_history`
2. Revisar permisos de Firestore
3. Comprobar filtros en la query

---

## 📝 Notas Importantes

- ⚠️ Solo se envían a usuarios con **tokens FCM/Expo** registrados
- ⚠️ Solo para niños de **0 a 24 meses**
- ⚠️ Se elige el **hijo más pequeño** de cada usuario
- ⚠️ Los mensajes de GPT pueden variar ligeramente
- ⚠️ Fallback automático garantiza que **siempre se envían**
- ⚠️ Cada llamada a GPT tiene un **costo** (revisa OpenAI)

---

## 🎯 Mejoras Futuras

- [ ] ML para optimizar horario de envío por usuario
- [ ] A/B testing de mensajes GPT vs fallback
- [ ] Notificaciones para múltiples hijos
- [ ] Recordatorios de citas médicas personalizadas
- [ ] Integración con calendario de vacunas regional
- [ ] Mensajes en múltiples idiomas
- [ ] Notificaciones de cumpleaños
- [ ] Tips según preferencias del usuario

---

## 📞 Soporte

Para dudas o problemas, contacta al equipo de desarrollo de Munpa.

---

**¡Recordatorios inteligentes y personalizados para cada familia! 🤖💙**

