# 📡 API - Perfiles Profesionales

## 🎯 Endpoints Implementados

### **ADMIN - Vinculación de Perfiles**

#### 1. Vincular Usuario con Especialista
```
POST /api/admin/specialists/:specialistId/link-user
Authorization: Bearer {admin_token}
```

**Body:**
```json
{
  "userEmail": "doctor@gmail.com"
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Usuario vinculado exitosamente con perfil profesional",
  "data": {
    "userId": "user_123",
    "userEmail": "doctor@gmail.com",
    "userName": "Dr. Juan Pérez",
    "specialistId": "specialist_456",
    "specialistName": "Dr. Juan Pérez",
    "linkedAt": "2026-02-08T10:00:00.000Z"
  }
}
```

**Errores:**
- `400`: Email no proporcionado
- `404`: Especialista no encontrado
- `404`: Usuario no encontrado con ese email
- `400`: Usuario ya tiene perfil profesional activo
- `400`: Especialista ya está vinculado a otro usuario

---

#### 2. Desvincular Usuario
```
DELETE /api/admin/specialists/:specialistId/link-user
Authorization: Bearer {admin_token}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Usuario desvinculado exitosamente",
  "data": {
    "specialistId": "specialist_456",
    "unlinkedUserId": "user_123"
  }
}
```

**Errores:**
- `404`: Especialista no encontrado
- `400`: Especialista no está vinculado a ningún usuario

---

### **APP - Verificación de Perfil Profesional**

#### 3. Verificar Perfil Profesional
```
GET /api/profile/professional
Authorization: Bearer {user_token}
```

**Response 200 (Usuario CON perfil profesional):**
```json
{
  "success": true,
  "data": {
    "hasProfessionalProfile": true,
    "type": "specialist",
    "specialistId": "specialist_456",
    "status": "active",
    "verifiedAt": "2026-02-08T10:00:00.000Z",
    "specialist": {
      "displayName": "Dr. Juan Pérez",
      "photoUrl": "https://...",
      "specialties": ["Pediatra"],
      "stats": {
        "totalConsultations": 120,
        "averageRating": 4.8,
        "responseTime": 15,
        "completionRate": 95
      },
      "pricing": {
        "chatConsultation": 25,
        "videoConsultation": 40,
        "currency": "USD"
      }
    }
  }
}
```

**Response 200 (Usuario SIN perfil profesional):**
```json
{
  "success": true,
  "data": {
    "hasProfessionalProfile": false
  }
}
```

---

### **PANEL DEL ESPECIALISTA (Modo Profesional)**

#### 4. Listar Consultas Asignadas
```
GET /api/specialist/consultations?status=pending&page=1&limit=20
Authorization: Bearer {user_token}
```

**Query Params:**
- `status`: pending | accepted | in_progress | completed
- `urgency`: low | normal | high
- `type`: chat | online
- `page`: Número de página (default: 1)
- `limit`: Resultados por página (default: 20)

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "consultation_1",
      "childName": "Sofía",
      "childAge": "2 años 3 meses",
      "childPhotoUrl": "https://...",
      "parent": {
        "name": "María López",
        "photoUrl": "https://..."
      },
      "type": "chat",
      "status": "pending",
      "request": {
        "description": "Mi bebé tiene fiebre desde ayer...",
        "photos": ["https://..."],
        "symptomDetails": [
          {
            "id": "symptom_1",
            "name": "Fiebre",
            "severity": "moderate",
            "iconUrl": "https://..."
          }
        ],
        "urgency": "high"
      },
      "pricing": {
        "finalPrice": 36,
        "isFree": false
      },
      "createdAt": "2026-02-08T10:00:00.000Z",
      "scheduledFor": null,
      "acceptedAt": null
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  },
  "stats": {
    "pending": 5,
    "accepted": 3,
    "in_progress": 2,
    "completed": 120
  }
}
```

**Errores:**
- `404`: Usuario no encontrado
- `403`: No tienes un perfil profesional activo

---

#### 5. Obtener Detalles de Consulta
```
GET /api/specialist/consultations/:consultationId
Authorization: Bearer {user_token}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "consultation_1",
    "type": "chat",
    "status": "in_progress",
    "child": {
      "id": "child_1",
      "name": "Sofía",
      "birthDate": "2024-11-15T00:00:00.000Z",
      "photoUrl": "https://...",
      "gender": "female"
    },
    "parent": {
      "id": "user_1",
      "name": "María López",
      "email": "maria@gmail.com",
      "photoUrl": "https://...",
      "phone": "+593987654321"
    },
    "request": {
      "description": "Mi bebé tiene fiebre desde ayer...",
      "photos": ["https://...", "https://..."],
      "symptomDetails": [
        {
          "id": "symptom_1",
          "name": "Fiebre",
          "category": "Síntomas Generales",
          "severity": "moderate"
        }
      ],
      "urgency": "high"
    },
    "pricing": {
      "basePrice": 40,
      "discount": 4,
      "finalPrice": 36,
      "currency": "USD",
      "couponApplied": {
        "code": "PRIMERACONSULTA",
        "discountPercentage": 10
      }
    },
    "payment": {
      "status": "completed",
      "method": "card",
      "paidAt": "2026-02-08T09:55:00.000Z"
    },
    "messages": [
      {
        "id": "msg_1",
        "senderId": "user_1",
        "senderType": "parent",
        "message": "Hola doctor, mi bebé tiene fiebre",
        "attachments": [],
        "sentAt": "2026-02-08T10:05:00.000Z",
        "isRead": true
      },
      {
        "id": "msg_2",
        "senderId": "specialist_456",
        "senderType": "specialist",
        "message": "¿Desde cuándo tiene la fiebre?",
        "attachments": [],
        "sentAt": "2026-02-08T10:07:00.000Z",
        "isRead": true
      }
    ],
    "createdAt": "2026-02-08T10:00:00.000Z",
    "acceptedAt": "2026-02-08T10:02:00.000Z",
    "startedAt": "2026-02-08T10:05:00.000Z",
    "completedAt": null,
    "scheduledFor": null
  }
}
```

**Errores:**
- `403`: No tienes perfil profesional activo
- `404`: Consulta no encontrada
- `403`: No tienes acceso a esta consulta

---

#### 6. Aceptar Consulta
```
POST /api/specialist/consultations/:consultationId/accept
Authorization: Bearer {user_token}
```

**Body (Opcional):**
```json
{
  "scheduledFor": "2026-02-10T15:00:00Z",
  "estimatedResponseTime": 15
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Consulta aceptada exitosamente",
  "data": {
    "status": "accepted",
    "acceptedAt": "2026-02-08T10:30:00.000Z",
    "scheduledFor": "2026-02-10T15:00:00.000Z",
    "estimatedResponseTime": 15
  }
}
```

**Errores:**
- `403`: No tienes perfil profesional activo
- `404`: Consulta no encontrada
- `403`: No tienes acceso a esta consulta
- `400`: La consulta ya está en estado: {status}

---

#### 7. Rechazar Consulta
```
POST /api/specialist/consultations/:consultationId/reject
Authorization: Bearer {user_token}
```

**Body:**
```json
{
  "reason": "No disponible en este horario"
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Consulta rechazada",
  "data": {
    "status": "rejected",
    "reason": "No disponible en este horario"
  }
}
```

**Errores:**
- `403`: No tienes perfil profesional activo
- `404`: Consulta no encontrada
- `400`: La consulta ya está en estado: {status}

---

#### 8. Iniciar Consulta
```
POST /api/specialist/consultations/:consultationId/start
Authorization: Bearer {user_token}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Consulta iniciada exitosamente",
  "data": {
    "status": "in_progress",
    "startedAt": "2026-02-08T10:35:00.000Z"
  }
}
```

**Errores:**
- `403`: No tienes perfil profesional activo
- `404`: Consulta no encontrada
- `400`: La consulta debe estar aceptada. Estado actual: {status}

---

#### 9. Completar Consulta
```
POST /api/specialist/consultations/:consultationId/complete
Authorization: Bearer {user_token}
```

**Body:**
```json
{
  "diagnosis": "Infección viral leve",
  "treatment": "Reposo, hidratación abundante y paracetamol si la fiebre supera 38°C",
  "prescriptions": [
    {
      "medication": "Paracetamol infantil",
      "dosage": "5ml cada 6 horas",
      "duration": "3 días",
      "notes": "Solo si temperatura mayor a 38°C"
    },
    {
      "medication": "Suero oral",
      "dosage": "Cada 2 horas",
      "duration": "2 días",
      "notes": "Para prevenir deshidratación"
    }
  ],
  "notes": "Controlar temperatura. Volver a consultar si fiebre persiste más de 3 días o si aparecen nuevos síntomas.",
  "followUpRequired": true,
  "followUpDate": "2026-02-15T10:00:00Z"
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Consulta completada exitosamente",
  "data": {
    "status": "completed",
    "completedAt": "2026-02-08T11:30:00.000Z",
    "duration": 55
  }
}
```

**Errores:**
- `403`: No tienes perfil profesional activo
- `404`: Consulta no encontrada
- `400`: La consulta debe estar en progreso. Estado actual: {status}
- `400`: Diagnóstico y tratamiento son requeridos

---

#### 10. Obtener Estadísticas
```
GET /api/specialist/stats?period=month
Authorization: Bearer {user_token}
```

**Query Params:**
- `period`: week | month | all

**Response 200:**
```json
{
  "success": true,
  "data": {
    "period": "Este Mes",
    "thisPeriod": {
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
      "chat": 40,
      "video": 5
    },
    "recentReviews": [
      {
        "rating": 5,
        "comment": "Excelente atención, muy profesional",
        "date": "2026-02-07T15:00:00.000Z"
      },
      {
        "rating": 5,
        "comment": "Muy clara la explicación",
        "date": "2026-02-06T10:30:00.000Z"
      }
    ]
  }
}
```

**Errores:**
- `403`: No tienes perfil profesional activo

---

#### 11. Actualizar Disponibilidad
```
PUT /api/specialist/availability
Authorization: Bearer {user_token}
```

**Body:**
```json
{
  "schedule": {
    "monday": ["09:00-13:00", "15:00-19:00"],
    "tuesday": ["09:00-13:00", "15:00-19:00"],
    "wednesday": ["09:00-13:00"],
    "thursday": ["09:00-13:00", "15:00-19:00"],
    "friday": ["09:00-13:00", "15:00-19:00"],
    "saturday": ["09:00-12:00"],
    "sunday": []
  },
  "maxConsultationsPerDay": 10
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Disponibilidad actualizada exitosamente",
  "data": {
    "schedule": {...},
    "maxConsultationsPerDay": 10
  }
}
```

**Errores:**
- `403`: No tienes perfil profesional activo

---

#### 12. Actualizar Precios
```
PUT /api/specialist/pricing
Authorization: Bearer {user_token}
```

**Body:**
```json
{
  "chatConsultation": 30,
  "videoConsultation": 50
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Precios actualizados exitosamente",
  "data": {
    "chatConsultation": 30,
    "videoConsultation": 50
  }
}
```

**Errores:**
- `403`: No tienes perfil profesional activo

---

## 🔄 Flujo Completo de Uso

### 1️⃣ Admin Vincula Usuario con Especialista

```bash
# Paso 1: Admin crea el especialista
POST /api/admin/specialists
{
  "personalInfo": {
    "displayName": "Dr. Juan Pérez",
    "email": "juan@clinica.com",
    "phone": "+593987654321"
  },
  "professional": {
    "specialties": ["Pediatra"],
    "licenseNumber": "MP-12345"
  }
}

# Respuesta: specialistId = "specialist_456"

# Paso 2: Admin vincula usuario existente
POST /api/admin/specialists/specialist_456/link-user
{
  "userEmail": "doctor@gmail.com"
}

# ✅ Ahora el usuario puede acceder al modo profesional
```

---

### 2️⃣ Usuario Verifica su Perfil Profesional

```bash
GET /api/profile/professional
Authorization: Bearer {user_token}

# Respuesta:
{
  "hasProfessionalProfile": true,
  "type": "specialist",
  "specialistId": "specialist_456",
  "status": "active"
}
```

---

### 3️⃣ Especialista Maneja una Consulta

```bash
# Paso 1: Ver consultas pendientes
GET /api/specialist/consultations?status=pending

# Paso 2: Ver detalles
GET /api/specialist/consultations/consultation_1

# Paso 3: Aceptar
POST /api/specialist/consultations/consultation_1/accept
{
  "estimatedResponseTime": 15
}

# Paso 4: Iniciar
POST /api/specialist/consultations/consultation_1/start

# Paso 5: Chatear (usar endpoints de mensajes existentes)
POST /api/consultations/consultation_1/messages
{
  "message": "¿Desde cuándo tiene la fiebre?"
}

# Paso 6: Completar
POST /api/specialist/consultations/consultation_1/complete
{
  "diagnosis": "Infección viral leve",
  "treatment": "Reposo e hidratación",
  "prescriptions": [...]
}
```

---

## 🔐 Autenticación

### Para Usuarios del App (Especialistas)
```bash
Authorization: Bearer {firebase_user_token}
```

El token de Firebase del usuario normal es válido para acceder al modo profesional.

### Para Admins
```bash
Authorization: Bearer {admin_jwt_token}
```

---

## 📱 Integración con el App

### Detectar si Usuario es Especialista

```javascript
// Al iniciar sesión
const response = await fetch('/api/profile/professional', {
  headers: {
    'Authorization': `Bearer ${userToken}`
  }
});

const data = await response.json();

if (data.data.hasProfessionalProfile) {
  // Mostrar botón "Cambiar a Modo Profesional"
  // Guardar specialistId en estado global
}
```

### Cambiar entre Modos

```javascript
// Estado global del app
const [userMode, setUserMode] = useState('normal'); // 'normal' | 'professional'

// Cambiar modo
const toggleMode = () => {
  setUserMode(userMode === 'normal' ? 'professional' : 'normal');
};

// Renderizar vistas según el modo
{userMode === 'professional' ? (
  <ProfessionalDashboard />
) : (
  <ParentDashboard />
)}
```

---

## 🎨 Estados de Consulta

| Estado | Descripción | Acciones Disponibles |
|--------|-------------|---------------------|
| `pending` | Pendiente de aceptar | Aceptar, Rechazar |
| `accepted` | Aceptada, esperando inicio | Iniciar |
| `in_progress` | En progreso (chat activo) | Completar |
| `completed` | Completada con diagnóstico | Ver historial |
| `rejected` | Rechazada por especialista | - |

---

## ⚠️ Validaciones Importantes

### Vinculación de Usuario
- ✅ Usuario debe existir en la base de datos
- ✅ Usuario NO debe tener ya un perfil profesional activo
- ✅ Especialista NO debe estar ya vinculado a otro usuario

### Acciones del Especialista
- ✅ Usuario debe tener `professionalProfile.isActive = true`
- ✅ Solo puede acceder a consultas asignadas a SU `specialistId`
- ✅ Solo puede aceptar consultas en estado `pending`
- ✅ Solo puede iniciar consultas en estado `accepted`
- ✅ Solo puede completar consultas en estado `in_progress`

---

## 📊 Datos Actualizados Automáticamente

### Al Completar Consulta
1. ✅ Estado de consulta → `completed`
2. ✅ Se registra `completedAt` y `duration`
3. ✅ Se actualiza `stats.totalConsultations` del especialista
4. ⏳ TODO: Enviar notificación push al padre

### Al Aceptar Consulta
1. ✅ Estado → `accepted`
2. ✅ Se registra `acceptedAt`
3. ⏳ TODO: Enviar notificación push al padre

---

## 🚀 Próximos Features

### Sistema de Videollamadas
- [ ] Integración con Agora/Twilio
- [ ] `POST /api/consultations/:id/video/token`
- [ ] `POST /api/consultations/:id/video/start`
- [ ] `POST /api/consultations/:id/video/end`

### Sistema de Solicitudes
- [ ] `POST /api/profile/request-professional` (Usuario solicita ser profesional)
- [ ] `GET /api/admin/professional-requests` (Admin ve solicitudes)
- [ ] `POST /api/admin/professional-requests/:id/approve`
- [ ] `POST /api/admin/professional-requests/:id/reject`

### Notificaciones Push
- [ ] Notificar a especialista cuando llega nueva consulta
- [ ] Notificar a padre cuando especialista acepta/rechaza
- [ ] Notificar a padre cuando consulta es completada

---

## 🧪 Testing

### Vincular Usuario de Prueba

```bash
# 1. Login como admin
curl -X POST https://api.munpa.online/api/auth/admin-login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "yourpassword"
  }'

# Copiar el token del admin

# 2. Vincular usuario
curl -X POST https://api.munpa.online/api/admin/specialists/ZBLnYvpanCqoOD3WefHu/link-user \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {admin_token}" \
  -d '{
    "userEmail": "lmishelle16@gmail.com"
  }'

# 3. Verificar perfil (login como usuario)
curl https://api.munpa.online/api/profile/professional \
  -H "Authorization: Bearer {user_token}"

# 4. Ver consultas
curl https://api.munpa.online/api/specialist/consultations?status=pending \
  -H "Authorization: Bearer {user_token}"
```

---

## 📦 Resumen de Endpoints

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| POST | `/api/admin/specialists/:id/link-user` | Admin | Vincular usuario |
| DELETE | `/api/admin/specialists/:id/link-user` | Admin | Desvincular usuario |
| GET | `/api/profile/professional` | User | Verificar perfil profesional |
| GET | `/api/specialist/consultations` | User | Listar consultas asignadas |
| GET | `/api/specialist/consultations/:id` | User | Detalle de consulta |
| POST | `/api/specialist/consultations/:id/accept` | User | Aceptar consulta |
| POST | `/api/specialist/consultations/:id/reject` | User | Rechazar consulta |
| POST | `/api/specialist/consultations/:id/start` | User | Iniciar consulta |
| POST | `/api/specialist/consultations/:id/complete` | User | Completar consulta |
| GET | `/api/specialist/stats` | User | Estadísticas |
| PUT | `/api/specialist/availability` | User | Actualizar disponibilidad |
| PUT | `/api/specialist/pricing` | User | Actualizar precios |

**Total: 12 nuevos endpoints** ✅
