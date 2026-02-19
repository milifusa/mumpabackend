# 📡 API - Sistema de Consultas Médicas

## 🎯 Endpoints Disponibles

---

## 1️⃣ SÍNTOMAS

### 1.1 Crear Síntoma (Admin)
```bash
POST /api/admin/symptoms
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "name": "Fiebre",
  "description": "Temperatura corporal elevada por encima de lo normal",
  "imageUrl": "https://...",
  "category": "general",
  "severity": "moderate",
  "order": 1
}
```

**Response:**
```json
{
  "success": true,
  "message": "Síntoma creado exitosamente",
  "data": {
    "id": "symptom_id",
    "name": "Fiebre",
    "description": "...",
    "category": "general",
    "severity": "moderate",
    "isActive": true
  }
}
```

### 1.2 Listar Síntomas (Admin)
```bash
GET /api/admin/symptoms?category=general&isActive=true&page=1&limit=20&search=fiebre
Authorization: Bearer {admin_token}
```

### 1.3 Actualizar Síntoma (Admin)
```bash
PUT /api/admin/symptoms/:symptomId
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "name": "Fiebre Alta",
  "severity": "severe"
}
```

### 1.4 Eliminar/Desactivar Síntoma (Admin)
```bash
DELETE /api/admin/symptoms/:symptomId?permanent=false
Authorization: Bearer {admin_token}
```

### 1.5 Listar Síntomas Activos (App)
```bash
GET /api/symptoms?category=general
Authorization: Bearer {user_token}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "symptom_1",
      "name": "Fiebre",
      "description": "...",
      "imageUrl": "https://...",
      "category": "general",
      "severity": "moderate"
    }
  ],
  "grouped": {
    "general": [...],
    "digestivo": [...],
    "respiratorio": [...]
  },
  "total": 25
}
```

---

## 2️⃣ ESPECIALISTAS

### 2.1 Crear Especialista (Admin)
```bash
POST /api/admin/specialists
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "personalInfo": {
    "displayName": "Dr. Juan Pérez",
    "email": "juan.perez@hospital.com",
    "photoUrl": "https://...",
    "phone": "+593987654321",
    "bio": "Pediatra con 10 años de experiencia..."
  },
  "professional": {
    "specialties": ["Pediatra", "Neonatólogo"],
    "licenseNumber": "MP-12345",
    "university": "Universidad Central",
    "yearsExperience": 10,
    "certifications": ["Pediatría Avanzada", "RCP Neonatal"]
  },
  "pricing": {
    "chatConsultation": 25,
    "videoConsultation": 40,
    "currency": "USD",
    "acceptsFreeConsultations": true
  },
  "availability": {
    "schedule": {
      "monday": ["09:00-13:00", "15:00-19:00"],
      "tuesday": ["09:00-13:00", "15:00-19:00"]
    },
    "timezone": "America/Guayaquil",
    "maxConsultationsPerDay": 10
  }
}
```

### 2.2 Listar Especialistas (Admin)
```bash
GET /api/admin/specialists?specialty=Pediatra&status=active&page=1&limit=20
Authorization: Bearer {admin_token}
```

### 2.3 Obtener Especialista (Admin)
```bash
GET /api/admin/specialists/:specialistId
Authorization: Bearer {admin_token}
```

### 2.4 Actualizar Especialista (Admin)
```bash
PUT /api/admin/specialists/:specialistId
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "pricing": {
    "chatConsultation": 30,
    "videoConsultation": 45
  }
}
```

### 2.5 Desactivar Especialista (Admin)
```bash
DELETE /api/admin/specialists/:specialistId
Authorization: Bearer {admin_token}
```

### 2.6 Listar Especialistas Disponibles (App)
```bash
GET /api/specialists?specialty=Pediatra&available=true
Authorization: Bearer {user_token}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "specialist_1",
      "displayName": "Dr. Juan Pérez",
      "photoUrl": "https://...",
      "bio": "Pediatra con 10 años...",
      "specialties": ["Pediatra", "Neonatólogo"],
      "yearsExperience": 10,
      "pricing": {
        "chatConsultation": 25,
        "videoConsultation": 40,
        "currency": "USD"
      },
      "stats": {
        "totalConsultations": 150,
        "averageRating": 4.8,
        "responseTime": 15
      }
    }
  ],
  "total": 5
}
```

### 2.7 Obtener Especialista por ID (App)
```bash
GET /api/specialists/:specialistId
Authorization: Bearer {user_token}
```

---

## 3️⃣ CUPONES DE DESCUENTO

### 3.1 Crear Cupón (Admin)
```bash
POST /api/admin/coupons
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "code": "FIRST10",
  "type": "percentage",
  "value": 10,
  "maxUses": 100,
  "validFrom": "2026-01-01T00:00:00Z",
  "validUntil": "2026-12-31T23:59:59Z",
  "applicableTo": "all",
  "autoApply": false,
  "autoApplyConditions": {
    "firstConsultation": false,
    "newUser": false,
    "minConsultations": null,
    "maxConsultations": null,
    "userHasChildren": false,
    "specificDays": null,
    "priority": 0
  }
}
```

**Tipos de cupón:**
- `percentage`: Descuento en porcentaje (ej: 10%)
- `fixed`: Descuento fijo (ej: $5)
- `free`: Consulta gratis

**applicableTo:**
- `all`: Aplica a chat y video
- `chat`: Solo chat
- `video`: Solo video
- `specific_specialist`: Solo para un especialista específico

**✨ AUTO-APLICACIÓN:**

El cupón puede aplicarse automáticamente sin que el usuario lo ingrese:

```json
{
  "code": "PRIMERA",
  "type": "free",
  "value": 0,
  "autoApply": true,
  "autoApplyConditions": {
    "firstConsultation": true,       // Solo primera consulta
    "newUser": false,                // Solo usuarios nuevos
    "minConsultations": null,        // Mínimo de consultas
    "maxConsultations": 0,           // Máximo de consultas
    "userHasChildren": true,         // Debe tener hijos registrados
    "specificDays": null,            // ["monday", "friday"] o null
    "priority": 10                   // Mayor prioridad = se aplica primero
  }
}
```

**Ejemplo: Primera Consulta Gratis (Auto-aplicable)**
```json
{
  "code": "PRIMERA",
  "type": "free",
  "value": 0,
  "maxUses": 1000,
  "validFrom": "2026-02-01",
  "validUntil": "2026-12-31",
  "applicableTo": "all",
  "autoApply": true,
  "autoApplyConditions": {
    "firstConsultation": true,
    "userHasChildren": true,
    "priority": 10
  }
}
```

**Ejemplo: 20% Descuento Fin de Semana (Auto-aplicable)**
```json
{
  "code": "WEEKEND20",
  "type": "percentage",
  "value": 20,
  "validFrom": "2026-02-01",
  "validUntil": "2026-12-31",
  "applicableTo": "all",
  "autoApply": true,
  "autoApplyConditions": {
    "specificDays": ["friday", "saturday", "sunday"],
    "priority": 5
  }
}
```

### 3.2 Listar Cupones (Admin)
```bash
GET /api/admin/coupons?isActive=true&page=1&limit=20
Authorization: Bearer {admin_token}
```

### 3.3 Actualizar Cupón (Admin)
```bash
PUT /api/admin/coupons/:couponId
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "isActive": false
}
```

### 3.4 Verificar Cupón (App)
```bash
GET /api/coupons/verify/FIRST10?type=video&specialistId=specialist_1
Authorization: Bearer {user_token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "coupon_1",
    "code": "FIRST10",
    "type": "percentage",
    "value": 10,
    "applicableTo": "all"
  }
}
```

### 3.5 Calcular Precio con Descuento (App)
```bash
POST /api/consultations/calculate-price
Authorization: Bearer {user_token}
Content-Type: application/json

{
  "type": "video",
  "specialistId": "specialist_1",
  "couponCode": "FIRST10"      // Opcional, si no se envía busca cupones auto-aplicables
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "basePrice": 40,
    "discount": 4,
    "finalPrice": 36,
    "currency": "USD",
    "coupon": {
      "code": "FIRST10",
      "type": "percentage",
      "value": 10,
      "autoApplied": false    // true si se aplicó automáticamente
    },
    "isFree": false
  }
}
```

**✨ AUTO-APLICACIÓN:**

Si NO envías `couponCode`, el sistema automáticamente buscará el mejor cupón disponible basándose en:
- Primera consulta del usuario
- Número de consultas previas
- Día de la semana
- Si tiene hijos registrados
- Prioridad del cupón

**Ejemplo sin cupón (auto-aplicación):**
```bash
POST /api/consultations/calculate-price
{
  "type": "video",
  "specialistId": "specialist_123"
  // No se envía couponCode
}
```

**Response con cupón auto-aplicado:**
```json
{
  "success": true,
  "data": {
    "basePrice": 40,
    "discount": 40,
    "finalPrice": 0,
    "coupon": {
      "code": "PRIMERA",
      "type": "free",
      "value": 0,
      "autoApplied": true     // ✅ Se aplicó automáticamente
    },
    "isFree": true
  }
}
```

---

## 4️⃣ CONSULTAS MÉDICAS

### 4.1 Crear Consulta (App)
```bash
POST /api/children/:childId/consultations
Authorization: Bearer {user_token}
Content-Type: application/json

{
  "description": "Mi bebé tiene fiebre desde ayer, 38.5°C. Está inquieto y no quiere comer.",
  "photos": [
    "https://storage.googleapis.com/photo1.jpg",
    "https://storage.googleapis.com/photo2.jpg"
  ],
  "symptoms": ["symptom_id_1", "symptom_id_2"],
  "type": "video",
  "urgency": "high",
  "preferredSpecialistId": null,
  "couponCode": "FIRST10"
}
```

**Parámetros:**
- `description`: Descripción del problema (requerido)
- `photos`: Array de URLs de fotos (opcional)
- `symptoms`: Array de IDs de síntomas (opcional)
- `type`: "chat" o "video" (requerido)
- `urgency`: "low", "normal", "high" (default: "normal")
- `preferredSpecialistId`: ID del especialista preferido (opcional)
- `couponCode`: Código de cupón de descuento (opcional)

**Response:**
```json
{
  "success": true,
  "message": "Consulta creada exitosamente",
  "data": {
    "consultationId": "consultation_1",
    "status": "awaiting_payment",
    "pricing": {
      "basePrice": 40,
      "discount": 4,
      "finalPrice": 36,
      "isFree": false
    },
    "paymentRequired": true
  }
}
```

### 4.2 Listar Consultas del Usuario (App)
```bash
GET /api/consultations?status=pending&childId=child_1&page=1&limit=20
Authorization: Bearer {user_token}
```

**Estados posibles:**
- `awaiting_payment`: Esperando pago
- `pending`: Pendiente de asignación
- `accepted`: Aceptada por especialista
- `in_progress`: En progreso
- `completed`: Completada
- `cancelled`: Cancelada

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "consultation_1",
      "childName": "Sofía",
      "specialistName": "Dr. Juan Pérez",
      "type": "video",
      "status": "pending",
      "request": {
        "description": "Mi bebé tiene fiebre...",
        "symptoms": [...],
        "urgency": "high"
      },
      "pricing": {
        "finalPrice": 36,
        "isFree": false
      },
      "createdAt": "2026-02-08T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "totalPages": 1
  }
}
```

### 4.3 Obtener Detalles de Consulta (App)
```bash
GET /api/consultations/:consultationId
Authorization: Bearer {user_token}
```

**Acceso:** Padre (parentId) o especialista asignado (linkedUserId).

**Response (incluye `result` cuando la consulta está completada):**
```json
{
  "success": true,
  "data": {
    "id": "consultation_1",
    "childName": "Sofía",
    "childAge": "2 años",
    "type": "chat",
    "status": "completed",
    "request": {
      "description": "Mi bebé tiene fiebre desde ayer...",
      "photos": ["https://..."],
      "symptoms": ["symptom_1", "symptom_2"],
      "urgency": "high",
      "symptomDetails": []
    },
    "result": {
      "diagnosis": "Resfriado común",
      "treatment": "Reposo, hidratación, paracetamol según peso",
      "prescriptions": [
        {
          "medication": "Paracetamol",
          "dosage": "500mg",
          "frequency": "cada 8 horas",
          "duration": "3 días",
          "instructions": "Tomar con alimentos"
        }
      ],
      "notes": "Controlar temperatura. Si persiste fiebre > 3 días, reevaluar.",
      "followUpRequired": true,
      "followUpDate": "2026-02-15T10:00:00Z",
      "completedAt": "2026-02-08T12:00:00Z"
    },
    "specialist": {
      "id": "specialist_1",
      "displayName": "Dr. Juan Pérez",
      "photoUrl": "https://...",
      "specialties": ["Pediatra"]
    },
    "pricing": { "finalPrice": 36, "isFree": false },
    "createdAt": "2026-02-08T10:00:00Z",
    "updatedAt": "2026-02-08T12:00:00Z"
  }
}
```

### 4.4 Cancelar Consulta (App)
```bash
DELETE /api/consultations/:consultationId
Authorization: Bearer {user_token}
```

### 4.5 Procesar Pago (App)
```bash
POST /api/consultations/:consultationId/payment
Authorization: Bearer {user_token}
Content-Type: application/json

{
  "paymentMethod": "stripe",
  "paymentToken": "tok_visa_4242"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Pago procesado exitosamente",
  "data": {
    "transactionId": "txn_123456789",
    "amount": 36,
    "currency": "USD"
  }
}
```

---

## 5️⃣ CHAT EN TIEMPO REAL

### 5.1 Enviar Mensaje (App)
```bash
POST /api/consultations/:consultationId/messages
Authorization: Bearer {user_token}
Content-Type: application/json

{
  "message": "Hola doctor, mi bebé tiene fiebre de 38.5°C",
  "attachments": ["https://storage.googleapis.com/photo.jpg"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Mensaje enviado exitosamente",
  "data": {
    "id": "message_1",
    "senderId": "user_123",
    "senderType": "parent",
    "message": "Hola doctor...",
    "isRead": false,
    "createdAt": "2026-02-08T10:30:00Z"
  }
}
```

### 5.2 Obtener Mensajes (App)
```bash
GET /api/consultations/:consultationId/messages?limit=50&before=message_id
Authorization: Bearer {user_token}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "message_1",
      "senderId": "user_123",
      "senderType": "parent",
      "message": "Hola doctor...",
      "attachments": [],
      "isRead": true,
      "createdAt": "2026-02-08T10:30:00Z"
    },
    {
      "id": "message_2",
      "senderId": "specialist_1",
      "senderType": "specialist",
      "message": "Hola, cuéntame más...",
      "attachments": [],
      "isRead": false,
      "createdAt": "2026-02-08T10:31:00Z"
    }
  ],
  "total": 2
}
```

### 5.3 Marcar Mensaje como Leído (App)
```bash
PATCH /api/consultations/:consultationId/messages/:messageId/read
Authorization: Bearer {user_token}
```

### 5.4 Unirse a Videollamada (App)
```bash
POST /api/consultations/:consultationId/video/join
Authorization: Bearer {user_token}
Content-Type: application/json

{ "role": "host" }
```

**Response:** `{ channelName, uid, token, appId }` - Usar con SDK de Agora. Ver **GUIA-VIDEO-CONSULTAS.md**.

### 5.5 Finalizar Videollamada (App)
```bash
POST /api/consultations/:consultationId/video/end
Authorization: Bearer {user_token}
Content-Type: application/json

{ "durationSeconds": 720 }
```

---

## 6️⃣ PANEL DEL ESPECIALISTA

### 6.1 Listar Consultas Asignadas
```bash
GET /api/specialist/consultations?status=pending&page=1&limit=20
Authorization: Bearer {specialist_token}
```

**Query:** `status` (pending, accepted, in_progress, completed), `urgency`, `type`, `page`, `limit`

### 6.2 Obtener Detalle de Consulta (Especialista)
```bash
GET /api/specialist/consultations/:consultationId
Authorization: Bearer {specialist_token}
```

**Response incluye:** `canPrescribe` (si puede emitir recetas), `child`, `parent`, `messages`, `result` (si ya completó)

### 6.3 Aceptar Consulta
```bash
POST /api/specialist/consultations/:consultationId/accept
Authorization: Bearer {specialist_token}
Content-Type: application/json

{
  "scheduledFor": "2026-02-10T15:00:00Z",
  "estimatedResponseTime": 15
}
```

### 6.4 Rechazar Consulta
```bash
POST /api/specialist/consultations/:consultationId/reject
Authorization: Bearer {specialist_token}
Content-Type: application/json

{ "reason": "No disponible en este horario" }
```

### 6.5 Iniciar Consulta
```bash
POST /api/specialist/consultations/:consultationId/start
Authorization: Bearer {specialist_token}
```

Cambia estado de `accepted` a `in_progress`.

### 6.6 Completar Consulta (diagnóstico, tratamiento, recetas)
```bash
POST /api/specialist/consultations/:consultationId/complete
Authorization: Bearer {specialist_token}
Content-Type: application/json

{
  "diagnosis": "Resfriado común",
  "treatment": "Reposo, hidratación, paracetamol según peso",
  "prescriptions": [
    {
      "medication": "Paracetamol",
      "dosage": "500mg",
      "frequency": "cada 8 horas",
      "duration": "3 días",
      "instructions": "Tomar con alimentos"
    }
  ],
  "notes": "Controlar temperatura. Si persiste fiebre > 3 días, reevaluar.",
  "followUpRequired": true,
  "followUpDate": "2026-02-15"
}
```

**Requisitos:**
- **diagnosis** y **treatment** obligatorios
- **prescriptions**: solo si el especialista tiene `canPrescribe` (accountType=specialist). Nutricionistas/coaches no pueden emitir recetas
- Para **chat**: puede completar desde `accepted` o `in_progress` (si accepted, se auto-inicia)
- El padre recibe notificación push y ve el resultado en `GET /api/consultations/:id`

### 6.7 Mensajes (Especialista)
```bash
GET  /api/specialist/consultations/:consultationId/messages
POST /api/specialist/consultations/:consultationId/messages
Authorization: Bearer {specialist_token}
```

### 6.8 Historial de Consultas Completadas
```bash
GET /api/specialist/consultations/history?page=1&limit=20
Authorization: Bearer {specialist_token}
```

---

## 📊 Ejemplos de Uso Completo

### Flujo 1: Usuario Solicita Consulta con Cupón

#### Paso 1: Listar síntomas
```bash
curl -X GET "https://api.munpa.online/api/symptoms" \
  -H "Authorization: Bearer {user_token}"
```

#### Paso 2: Listar especialistas
```bash
curl -X GET "https://api.munpa.online/api/specialists?specialty=Pediatra" \
  -H "Authorization: Bearer {user_token}"
```

#### Paso 3: Calcular precio con cupón
```bash
curl -X POST "https://api.munpa.online/api/consultations/calculate-price" \
  -H "Authorization: Bearer {user_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "video",
    "specialistId": "specialist_1",
    "couponCode": "FIRST10"
  }'
```

#### Paso 4: Crear consulta
```bash
curl -X POST "https://api.munpa.online/api/children/child_123/consultations" \
  -H "Authorization: Bearer {user_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Mi bebé tiene fiebre desde ayer",
    "photos": ["https://..."],
    "symptoms": ["symptom_1", "symptom_2"],
    "type": "video",
    "urgency": "high",
    "couponCode": "FIRST10"
  }'
```

#### Paso 5: Procesar pago
```bash
curl -X POST "https://api.munpa.online/api/consultations/consultation_123/payment" \
  -H "Authorization: Bearer {user_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "paymentMethod": "stripe",
    "paymentToken": "tok_visa_4242"
  }'
```

#### Paso 6: Enviar mensaje al especialista
```bash
curl -X POST "https://api.munpa.online/api/consultations/consultation_123/messages" \
  -H "Authorization: Bearer {user_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hola doctor, ¿cuándo podemos hablar?"
  }'
```

---

## 🔐 Autenticación

Todos los endpoints requieren autenticación JWT:

```bash
Authorization: Bearer {token}
```

### Tipos de tokens:
- **Admin Token**: Acceso a endpoints `/api/admin/*`
- **User Token**: Acceso a endpoints de usuario
- **Specialist Token**: (Futuro) Acceso a endpoints del especialista

---

## ❌ Códigos de Error

```json
{
  "success": false,
  "message": "Mensaje de error descriptivo"
}
```

### Códigos HTTP:
- `200`: Éxito
- `201`: Creado exitosamente
- `400`: Datos inválidos
- `401`: No autenticado
- `403`: Sin permisos
- `404`: No encontrado
- `500`: Error del servidor

---

## 6️⃣ ADMIN - GESTIÓN DE CONSULTAS

### 6.1 Listar Todas las Consultas (Admin)
```bash
GET /api/admin/consultations?status=pending&type=video&page=1&limit=20&search=fiebre
Authorization: Bearer {admin_token}
```

**Query Parameters:**
- `status`: awaiting_payment, pending, accepted, in_progress, completed, cancelled
- `type`: chat, video
- `specialistId`: Filtrar por especialista
- `parentId`: Filtrar por usuario/padre
- `childId`: Filtrar por hijo
- `search`: Buscar en descripción, nombre del niño o especialista
- `page`, `limit`: Paginación

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "consultation_1",
      "childName": "Sofía",
      "childAge": "2 años",
      "specialistName": "Dr. Juan Pérez",
      "type": "video",
      "status": "pending",
      "request": {
        "description": "Mi bebé tiene fiebre...",
        "urgency": "high"
      },
      "pricing": {
        "finalPrice": 36,
        "isFree": false
      },
      "payment": {
        "status": "completed"
      },
      "createdAt": "2026-02-08T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  },
  "stats": {
    "total": 150,
    "byStatus": {
      "pending": 10,
      "in_progress": 5,
      "completed": 120,
      "cancelled": 15
    },
    "byType": {
      "chat": 90,
      "video": 60
    },
    "totalRevenue": 5400
  }
}
```

### 6.2 Obtener Detalles de Consulta (Admin)
```bash
GET /api/admin/consultations/:consultationId
Authorization: Bearer {admin_token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "consultation_1",
    "childName": "Sofía",
    "specialist": {
      "id": "specialist_1",
      "displayName": "Dr. Juan Pérez",
      "email": "juan@hospital.com",
      "phone": "+593987654321",
      "specialties": ["Pediatra"]
    },
    "parent": {
      "id": "user_123",
      "displayName": "María López",
      "email": "maria@gmail.com"
    },
    "request": {
      "description": "Mi bebé tiene fiebre desde ayer...",
      "photos": ["https://..."],
      "symptoms": ["symptom_1"],
      "urgency": "high"
    },
    "pricing": {
      "basePrice": 40,
      "discount": 4,
      "finalPrice": 36
    },
    "payment": {
      "method": "stripe",
      "transactionId": "txn_123",
      "status": "completed"
    },
    "messages": [
      {
        "id": "msg_1",
        "senderType": "parent",
        "message": "Hola doctor...",
        "createdAt": "2026-02-08T10:30:00Z"
      }
    ]
  }
}
```

### 6.3 Actualizar Estado de Consulta (Admin)
```bash
PATCH /api/admin/consultations/:consultationId
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "status": "completed",
  "notes": "Consulta completada exitosamente"
}
```

**Estados válidos:**
- `awaiting_payment`: Esperando pago
- `pending`: Pendiente de asignación
- `accepted`: Aceptada por especialista
- `in_progress`: En progreso
- `completed`: Completada
- `cancelled`: Cancelada

### 6.4 Cancelar Consulta (Admin)
```bash
DELETE /api/admin/consultations/:consultationId
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "reason": "Especialista no disponible"
}
```

### 6.5 Estadísticas de Consultas (Admin)
```bash
GET /api/admin/consultations/stats?startDate=2026-01-01&endDate=2026-12-31&specialistId=xxx
Authorization: Bearer {admin_token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 150,
    "byStatus": {
      "awaiting_payment": 5,
      "pending": 10,
      "accepted": 8,
      "in_progress": 7,
      "completed": 110,
      "cancelled": 10
    },
    "byType": {
      "chat": 90,
      "video": 60
    },
    "byUrgency": {
      "low": 20,
      "normal": 100,
      "high": 30
    },
    "revenue": {
      "total": 5400,
      "pending": 200,
      "completed": 5200,
      "free": 10
    },
    "averagePrice": 36,
    "couponsUsed": 45,
    "consultationsWithPhotos": 80,
    "averageResponseTime": 25,
    "completionRate": 73,
    "topSpecialists": [
      {
        "specialistId": "specialist_1",
        "consultations": 60
      },
      {
        "specialistId": "specialist_2",
        "consultations": 45
      }
    ]
  }
}
```

### 6.6 Ingresos por Periodo (Admin)
```bash
GET /api/admin/consultations/revenue?period=month&year=2026&month=2
Authorization: Bearer {admin_token}
```

**Period options:**
- `day`: Ingresos por día
- `month`: Ingresos por mes (default)
- `year`: Ingresos por año

**Response:**
```json
{
  "success": true,
  "data": {
    "byPeriod": [
      {
        "period": "2026-01",
        "revenue": 2500,
        "consultations": 70,
        "byType": {
          "chat": 40,
          "video": 30
        }
      },
      {
        "period": "2026-02",
        "revenue": 2900,
        "consultations": 80,
        "byType": {
          "chat": 50,
          "video": 30
        }
      }
    ],
    "totals": {
      "revenue": 5400,
      "consultations": 150,
      "averageRevenue": 36
    }
  }
}
```

---

## 🔄 Completar consulta de chat (Especialista)

### Flujo
1. **pending** → Especialista acepta: `POST /api/specialist/consultations/:id/accept`
2. **accepted** → (Opcional) Iniciar: `POST /api/specialist/consultations/:id/start` o ir directo a completar
3. **Completar** con resultados: `POST /api/specialist/consultations/:id/complete`

### POST /api/specialist/consultations/:consultationId/complete
```bash
POST /api/specialist/consultations/:consultationId/complete
Authorization: Bearer {specialist_token}
Content-Type: application/json

{
  "diagnosis": "Resumen del diagnóstico",
  "treatment": "Recomendaciones de tratamiento",
  "prescriptions": [
    {
      "medication": "Paracetamol",
      "dosage": "500mg",
      "frequency": "cada 8 horas",
      "duration": "3 días",
      "instructions": "Tomar con alimentos"
    }
  ],
  "notes": "Observaciones adicionales",
  "followUpRequired": true,
  "followUpDate": "2026-02-20T10:00:00Z"
}
```

**Notas:**
- `prescriptions` solo si el perfil tiene `canPrescribe`. Nutricionistas/coaches no pueden emitir recetas.
- `diagnosis` y `treatment` son obligatorios.
- Puede completar desde `accepted` o `in_progress` (para chat, no hace falta iniciar explícitamente).

### Resumen para el usuario (padre)
**GET /api/consultations/:consultationId** incluye `result`:
```json
{
  "result": {
    "diagnosis": "...",
    "treatment": "...",
    "prescriptions": [...],
    "notes": "...",
    "followUpRequired": true,
    "followUpDate": "...",
    "completedAt": "..."
  }
}
```

**GET /api/specialist/consultations/:consultationId** incluye `canPrescribe` y `result` para que el especialista sepa si puede emitir recetas.

---

## 🎯 Próximos Endpoints

### Panel del Especialista (ver sección 6️⃣):
- `GET /api/specialist/consultations` - Consultas asignadas
- `GET /api/specialist/consultations/:id` - Detalle (incluye `canPrescribe`, `messages`, `result`)
- `POST /api/specialist/consultations/:id/accept` - Aceptar consulta
- `POST /api/specialist/consultations/:id/start` - Iniciar consulta
- `POST /api/specialist/consultations/:id/complete` - Completar con diagnóstico/tratamiento/recetas
- `GET/POST /api/specialist/consultations/:id/messages` - Ver/enviar mensajes
- `GET /api/specialist/consultations/history` - Historial completado
- `GET /api/specialist/stats` - Estadísticas

### Videollamadas:
- `POST /api/consultations/:id/video/start` - Iniciar videollamada
- `POST /api/consultations/:id/video/end` - Finalizar videollamada

### Ratings:
- `POST /api/consultations/:id/rating` - Calificar especialista

---

## 📝 Notas Importantes

1. **Pagos**: Por ahora los pagos están simulados. Se debe integrar Stripe/PayPhone.
2. **Notificaciones**: Los TODOs de notificaciones push deben implementarse.
3. **Videollamadas**: Requiere integración con Agora o Twilio.
4. **Chat en Tiempo Real**: Considerar implementar WebSockets para chat instantáneo.

---

## ✅ Listo para Testing

Todos los endpoints están implementados y listos para probar. Se recomienda:

1. Crear síntomas de prueba desde el dashboard admin
2. Crear un especialista de prueba
3. Crear un cupón de descuento
4. Probar el flujo completo de consulta desde la app
