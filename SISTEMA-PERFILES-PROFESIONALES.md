# 👨‍⚕️ Sistema de Perfiles Profesionales - Munpa

## 🎯 Concepto

Un **usuario normal** del app puede convertirse en **profesional** (médico/especialista) vinculando su cuenta con un perfil profesional. Esto permite:

- ✅ Usar la **misma cuenta** y app
- ✅ Cambiar entre **modo usuario** y **modo profesional**
- ✅ Vista de mamá/papá + Vista de médico/profesional
- ✅ Un solo login, dos perfiles

---

## 🏗️ Arquitectura

### Colección: `specialists`

```javascript
{
  // Datos profesionales
  personalInfo: {...},
  professional: {...},
  pricing: {...},
  
  // ✨ NUEVO: Vinculación con usuario del app
  linkedUserId: "user_id_from_users_collection",  // ID del usuario normal
  
  // Estados
  status: "active",
  accountType: "specialist",  // specialist, nutritionist, coach, etc.
  
  // Permisos
  permissions: {
    canAcceptConsultations: true,
    canSellProducts: false,
    canCreateEvents: false
  }
}
```

### Colección: `users` (existente)

```javascript
{
  email: "juan@gmail.com",
  displayName: "Dr. Juan Pérez",
  
  // ✨ NUEVO: Perfil profesional vinculado
  professionalProfile: {
    isActive: true,
    specialistId: "specialist_id",
    accountType: "specialist",  // specialist, nutritionist, coach
    verifiedAt: "2026-02-08T..."
  }
}
```

---

## 📡 API Endpoints

### 1️⃣ VINCULACIÓN DE PERFILES

#### 1.1 Vincular usuario con perfil profesional (Admin)
```
POST /api/admin/specialists/:specialistId/link-user
Body: {
  "userEmail": "juan@gmail.com"
}
```

Busca el usuario por email y lo vincula con el perfil de especialista.

#### 1.2 Desvincular usuario (Admin)
```
DELETE /api/admin/specialists/:specialistId/link-user
```

#### 1.3 Verificar si usuario tiene perfil profesional (App)
```
GET /api/profile/professional
Response: {
  "hasProfessionalProfile": true,
  "type": "specialist",
  "specialistId": "...",
  "status": "active"
}
```

---

### 2️⃣ PANEL DEL ESPECIALISTA (App)

#### 2.1 Obtener consultas asignadas
```
GET /api/specialist/consultations?status=pending&page=1&limit=20
```

**Estados:**
- `pending`: Pendiente de aceptar
- `accepted`: Aceptada, esperando inicio
- `in_progress`: En progreso
- `completed`: Completada

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "consultation_1",
      "childName": "Sofía",
      "childAge": "2 años",
      "parent": {
        "name": "María López",
        "photoUrl": "..."
      },
      "type": "chat",
      "status": "pending",
      "request": {
        "description": "Mi bebé tiene fiebre...",
        "photos": ["..."],
        "symptomDetails": [
          { "name": "Fiebre", "severity": "moderate" }
        ],
        "urgency": "high"
      },
      "pricing": {
        "finalPrice": 36,
        "isFree": false
      },
      "createdAt": "2026-02-08T10:00:00Z"
    }
  ],
  "pagination": {...},
  "stats": {
    "pending": 5,
    "accepted": 3,
    "in_progress": 2,
    "completed": 120
  }
}
```

#### 2.2 Obtener detalles de consulta (Especialista)
```
GET /api/specialist/consultations/:consultationId
```

Retorna todos los detalles incluyendo:
- Info completa del niño
- Info del padre
- Fotos y síntomas
- Historial de mensajes
- Estado de pago

#### 2.3 Aceptar consulta
```
POST /api/specialist/consultations/:consultationId/accept
Body: {
  "scheduledFor": "2026-02-10T15:00:00Z",  // Opcional para video
  "estimatedResponseTime": 15               // Minutos
}
```

**Response:**
```json
{
  "success": true,
  "message": "Consulta aceptada exitosamente",
  "data": {
    "status": "accepted",
    "scheduledFor": "2026-02-10T15:00:00Z"
  }
}
```

#### 2.4 Rechazar consulta
```
POST /api/specialist/consultations/:consultationId/reject
Body: {
  "reason": "No disponible en este horario"
}
```

#### 2.5 Iniciar consulta
```
POST /api/specialist/consultations/:consultationId/start
```

Cambia el estado a `in_progress` y registra `startedAt`.

#### 2.6 Completar consulta
```
POST /api/specialist/consultations/:consultationId/complete
Body: {
  "diagnosis": "Infección viral leve",
  "treatment": "Reposo, hidratación, paracetamol si fiebre",
  "prescriptions": [
    {
      "medication": "Paracetamol infantil",
      "dosage": "5ml cada 6 horas",
      "duration": "3 días",
      "notes": "Solo si temperatura mayor a 38°C"
    }
  ],
  "notes": "Controlar temperatura. Volver si fiebre persiste más de 3 días.",
  "followUpRequired": true,
  "followUpDate": "2026-02-15T10:00:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Consulta completada exitosamente",
  "data": {
    "status": "completed",
    "completedAt": "2026-02-08T11:30:00Z",
    "duration": 90
  }
}
```

#### 2.7 Estadísticas del especialista
```
GET /api/specialist/stats?period=month
```

**Response:**
```json
{
  "success": true,
  "data": {
    "thisMonth": {
      "consultations": 45,
      "revenue": 1620,
      "averageRating": 4.8,
      "averageResponseTime": 12,
      "completionRate": 95
    },
    "allTime": {
      "totalConsultations": 320,
      "totalRevenue": 11520,
      "averageRating": 4.7
    },
    "byType": {
      "chat": 280,
      "video": 40
    },
    "recentReviews": [
      {
        "rating": 5,
        "comment": "Excelente atención",
        "date": "2026-02-07"
      }
    ]
  }
}
```

#### 2.8 Actualizar disponibilidad
```
PUT /api/specialist/availability
Body: {
  "schedule": {
    "monday": ["09:00-13:00", "15:00-19:00"],
    "tuesday": ["09:00-13:00"],
    "wednesday": ["09:00-13:00", "15:00-19:00"]
  },
  "maxConsultationsPerDay": 10
}
```

#### 2.9 Actualizar precios
```
PUT /api/specialist/pricing
Body: {
  "chatConsultation": 30,
  "videoConsultation": 50
}
```

---

### 3️⃣ VIDEOLLAMADAS

#### 3.1 Generar token para videollamada
```
POST /api/consultations/:consultationId/video/token
```

**Response:**
```json
{
  "success": true,
  "data": {
    "roomId": "consultation_123_video",
    "token": "eyJhbGci...",
    "expires": "2026-02-08T12:00:00Z"
  }
}
```

#### 3.2 Iniciar videollamada
```
POST /api/consultations/:consultationId/video/start
```

#### 3.3 Finalizar videollamada
```
POST /api/consultations/:consultationId/video/end
Body: {
  "duration": 1800  // segundos
}
```

---

### 4️⃣ RATINGS Y REVIEWS

#### 4.1 Calificar consulta (Usuario)
```
POST /api/consultations/:consultationId/rating
Body: {
  "score": 5,
  "comment": "Excelente atención, muy profesional",
  "wouldRecommend": true
}
```

---

### 5️⃣ GESTIÓN DE CUENTA PROFESIONAL

#### 5.1 Solicitar ser profesional (App)
```
POST /api/profile/request-professional
Body: {
  "accountType": "specialist",  // specialist, nutritionist, coach
  "personalInfo": {
    "displayName": "Dr. Juan Pérez",
    "phone": "+593987654321",
    "bio": "Pediatra con 10 años de experiencia"
  },
  "professional": {
    "specialties": ["Pediatra"],
    "licenseNumber": "MP-12345",
    "university": "Universidad Central",
    "yearsExperience": 10,
    "certifications": ["Pediatría Avanzada"]
  },
  "documents": [
    "https://storage/.../cedula.pdf",
    "https://storage/.../titulo.pdf",
    "https://storage/.../licencia.pdf"
  ]
}
```

Crea una solicitud pendiente de aprobación por admin.

#### 5.2 Ver solicitudes pendientes (Admin)
```
GET /api/admin/professional-requests?status=pending
```

#### 5.3 Aprobar solicitud (Admin)
```
POST /api/admin/professional-requests/:requestId/approve
Body: {
  "pricing": {
    "chatConsultation": 25,
    "videoConsultation": 40
  }
}
```

Crea el perfil de especialista y lo vincula con el usuario.

#### 5.4 Rechazar solicitud (Admin)
```
POST /api/admin/professional-requests/:requestId/reject
Body: {
  "reason": "Documentación incompleta"
}
```

---

## 🔄 Flujo Completo

### Flujo 1: Usuario se convierte en Especialista

```
1. Usuario normal usa el app (como mamá/papá)
   ↓
2. Solicita convertirse en especialista
   POST /api/profile/request-professional
   ↓
3. Sube documentos (título, cédula, licencia)
   ↓
4. Admin revisa la solicitud
   GET /api/admin/professional-requests
   ↓
5. Admin aprueba
   POST /api/admin/professional-requests/:id/approve
   ↓
6. Sistema crea perfil de especialista
   ↓
7. Sistema vincula: users.professionalProfile.specialistId
   ↓
8. Usuario recibe notificación
   ↓
9. Usuario puede cambiar a "Modo Profesional" en el app
   ↓
10. Ve consultas asignadas, acepta, responde, completa
```

### Flujo 2: Usuario ya es Especialista (acceso diario)

```
1. Usuario abre el app
   ↓
2. Sistema detecta: user.professionalProfile.isActive = true
   ↓
3. Muestra botón "Cambiar a Modo Profesional"
   ↓
4. Usuario cambia de modo
   ↓
5. Ve vista de especialista:
   • Consultas pendientes
   • Consultas en progreso
   • Historial
   • Estadísticas
   • Configuración
```

---

## 📱 Pantallas del App

### Vista Normal (Mamá/Papá)
```
┌─────────────────────────┐
│ 🏠 Inicio               │
│ 👶 Mis Hijos            │
│ 📅 Eventos              │
│ 🛒 Marketplace          │
│ 👤 Perfil               │
│                         │
│ [Cambiar a Modo Médico] │ ← Nuevo
└─────────────────────────┘
```

### Vista Profesional (Médico)
```
┌─────────────────────────┐
│ 👨‍⚕️ Panel Especialista   │
├─────────────────────────┤
│ 🔔 Pendientes (5)       │
│ 💬 En Progreso (2)      │
│ ✅ Completadas (120)    │
│ 📊 Estadísticas         │
│ ⚙️ Configuración        │
│                         │
│ [Volver a Modo Normal]  │
└─────────────────────────┘
```

### Vista de Consulta Pendiente
```
┌─────────────────────────┐
│ 👶 Sofía, 2 años        │
│ 👤 María López          │
├─────────────────────────┤
│ 🩺 Síntomas:            │
│ • Fiebre (moderado)     │
│ • Vómito (moderado)     │
│                         │
│ 📝 Descripción:         │
│ "Mi bebé tiene fiebre   │
│  desde ayer..."         │
│                         │
│ 📸 Fotos: 2             │
│ [Ver fotos]             │
│                         │
│ ⚠️ Urgencia: Alta       │
│ 💰 $36.00 (pagado)      │
│                         │
│ [Rechazar] [Aceptar]    │
└─────────────────────────┘
```

### Vista de Chat (Consulta en Progreso)
```
┌─────────────────────────┐
│ 👶 Sofía, 2 años       ⓘ│
├─────────────────────────┤
│ 👤 Hola doctor...       │
│ 10:30                   │
│                         │
│ 👨‍⚕️ ¿Desde cuándo?      │
│                   10:32 │
│                         │
│ 👤 Desde ayer...        │
│ 10:33                   │
│                         │
├─────────────────────────┤
│ [Escribir mensaje...]   │
│ 📎 📷                    │
│                         │
│ [Completar Consulta]    │
└─────────────────────────┘
```

### Vista de Completar Consulta
```
┌─────────────────────────┐
│ ✅ Completar Consulta   │
├─────────────────────────┤
│ 🩺 Diagnóstico          │
│ [Infección viral leve]  │
│                         │
│ 💊 Tratamiento          │
│ [Reposo, hidratación...]│
│                         │
│ 💊 Recetas              │
│ • Paracetamol 5ml c/6h  │
│ [+ Agregar más]         │
│                         │
│ 📝 Notas                │
│ [Controlar temp...]     │
│                         │
│ 🔄 ¿Requiere seguimiento?│
│ [✓] Sí  [ ] No          │
│                         │
│ [Guardar y Completar]   │
└─────────────────────────┘
```

---

## 🔐 Permisos y Roles

### Usuario Normal
```javascript
{
  "role": "user",
  "permissions": {
    "createPosts": true,
    "attendEvents": true,
    "buyProducts": true,
    "requestConsultations": true
  }
}
```

### Usuario con Perfil Profesional
```javascript
{
  "role": "user",
  "professionalProfile": {
    "isActive": true,
    "specialistId": "...",
    "accountType": "specialist"
  },
  "permissions": {
    // Permisos de usuario normal +
    "acceptConsultations": true,
    "completeConsultations": true,
    "viewProfessionalDashboard": true
  }
}
```

---

## 💡 Tipos de Cuentas Profesionales

### 1. **Especialista Médico** (`specialist`)
- ✅ Acepta consultas médicas
- ✅ Chat y videollamadas
- ✅ Sube recetas y diagnósticos

### 2. **Nutricionista** (`nutritionist`)
- ✅ Consultas de nutrición
- ✅ Planes alimenticios
- ✅ Seguimiento de peso/talla

### 3. **Coach/Doula** (`coach`)
- ✅ Apoyo en lactancia
- ✅ Acompañamiento prenatal
- ✅ Asesoría en crianza

### 4. **Psicólogo** (`psychologist`)
- ✅ Consultas psicológicas
- ✅ Terapias
- ✅ Apoyo emocional

---

## 🎨 UI/UX Sugerencias

### Toggle entre modos:
```
┌─────────────────────────┐
│ ( ) Modo Normal         │
│ (•) Modo Profesional    │
└─────────────────────────┘
```

### Badge en perfil:
```
Dr. Juan Pérez
[Verificado ✓] [Especialista 👨‍⚕️]
```

### Notificaciones:
```
🔔 Nueva consulta asignada
   Sofía, 2 años - Fiebre
   Urgencia: Alta
   [Ver consulta]
```

---

## 📊 Dashboard del Especialista

### Panel Principal
```
┌──────────────────────────────────┐
│ 👨‍⚕️ Dr. Juan Pérez              │
├──────────────────────────────────┤
│ 📊 Esta Semana                   │
│ • 23 Consultas                   │
│ • $920 Ingresos                  │
│ • ⭐ 4.8 Rating                  │
│ • ⏱️ 15 min Respuesta promedio  │
├──────────────────────────────────┤
│ 🔔 Pendientes (3)                │
│ ┌──────────────────────────────┐ │
│ │ 👶 Sofía, 2 años             │ │
│ │ Fiebre, Vómito               │ │
│ │ 🟠 Alta urgencia             │ │
│ │ $36 • Hace 15 min            │ │
│ │ [Aceptar] [Ver detalles]     │ │
│ └──────────────────────────────┘ │
├──────────────────────────────────┤
│ 💬 En Progreso (2)               │
│ • Emma, 3 años - Chat            │
│ • Lucas, 1 año - Video 15:00    │
└──────────────────────────────────┘
```

---

## 🚀 Plan de Implementación

### Fase 1: Estructura Base ✅ (Implementar ahora)
- [x] Modificar colección `specialists` para incluir `linkedUserId`
- [ ] Agregar campo `professionalProfile` en `users`
- [ ] API de vinculación usuario-especialista
- [ ] API para verificar si usuario tiene perfil profesional

### Fase 2: Panel del Especialista ✅ (Implementar ahora)
- [ ] GET /api/specialist/consultations
- [ ] POST /api/specialist/consultations/:id/accept
- [ ] POST /api/specialist/consultations/:id/reject
- [ ] POST /api/specialist/consultations/:id/start
- [ ] POST /api/specialist/consultations/:id/complete
- [ ] GET /api/specialist/stats

### Fase 3: Solicitud de Cuenta Profesional
- [ ] POST /api/profile/request-professional
- [ ] GET /api/admin/professional-requests
- [ ] POST /api/admin/professional-requests/:id/approve
- [ ] POST /api/admin/professional-requests/:id/reject

### Fase 4: Videollamadas
- [ ] Integración con Agora/Twilio
- [ ] Generación de tokens
- [ ] Endpoints de inicio/fin

### Fase 5: Features Adicionales
- [ ] Notificaciones push para especialistas
- [ ] Chat en tiempo real (WebSockets)
- [ ] Exportar PDF de consultas
- [ ] Sistema de reportes

---

## 🎯 ¿Comenzamos?

Voy a implementar **Fase 1 y Fase 2** ahora:

1. ✅ Sistema de vinculación usuario-especialista
2. ✅ API completa del panel del especialista
3. ✅ Endpoints para aceptar/rechazar/completar consultas
4. ✅ Estadísticas del especialista

**Tiempo estimado:** 20-30 minutos

¿Procedemos? 🚀
