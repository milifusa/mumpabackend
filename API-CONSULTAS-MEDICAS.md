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
  "validFrom": "2026-01-01",
  "validUntil": "2026-12-31",
  "applicableTo": "all"
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
  "couponCode": "FIRST10"
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
      "value": 10
    },
    "isFree": false
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

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "consultation_1",
    "childName": "Sofía",
    "childAge": "2 años",
    "type": "video",
    "status": "pending",
    "request": {
      "description": "Mi bebé tiene fiebre desde ayer...",
      "photos": ["https://..."],
      "symptoms": ["symptom_1", "symptom_2"],
      "urgency": "high"
    },
    "pricing": {
      "basePrice": 40,
      "discount": 4,
      "finalPrice": 36,
      "isFree": false
    },
    "specialist": {
      "id": "specialist_1",
      "displayName": "Dr. Juan Pérez",
      "photoUrl": "https://...",
      "specialties": ["Pediatra"]
    },
    "payment": {
      "status": "pending"
    },
    "schedule": {
      "requestedAt": "2026-02-08T10:00:00Z"
    },
    "chat": {
      "messageCount": 0
    }
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

## 🎯 Próximos Endpoints

### Panel del Especialista:
- `GET /api/specialist/consultations` - Consultas asignadas
- `POST /api/specialist/consultations/:id/accept` - Aceptar consulta
- `POST /api/specialist/consultations/:id/complete` - Completar con diagnóstico
- `GET /api/specialist/stats` - Estadísticas del especialista

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
