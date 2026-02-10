# 👨‍⚕️ Sistema de Consultas Médicas Profesionales - Munpa

## 📋 Descripción General

Sistema completo para conectar padres con especialistas médicos pediátricos a través de consultas pagadas por chat o videollamada.

---

## 🏗️ Arquitectura del Sistema

### Colecciones de Firestore

```
specialists/                    # Médicos/Especialistas
├── {specialistId}
│   ├── personalInfo
│   │   ├── displayName
│   │   ├── email
│   │   ├── photoUrl
│   │   ├── phone
│   │   └── bio
│   ├── professional
│   │   ├── specialties: []     # ["Pediatra", "Neonatólogo"]
│   │   ├── licenseNumber
│   │   ├── university
│   │   ├── yearsExperience
│   │   └── certifications: []
│   ├── availability
│   │   ├── schedule: {}        # Horarios por día
│   │   ├── timezone
│   │   └── maxConsultationsPerDay
│   ├── pricing
│   │   ├── chatConsultation: 25
│   │   ├── videoConsultation: 40
│   │   ├── currency: "USD"
│   │   └── acceptsFreeConsultations: true
│   ├── stats
│   │   ├── totalConsultations
│   │   ├── averageRating
│   │   ├── responseTime (minutos)
│   │   └── completionRate
│   ├── status: "active"
│   ├── createdAt
│   └── updatedAt

symptoms/                       # Síntomas disponibles
├── {symptomId}
│   ├── name: "Fiebre"
│   ├── description: "Temperatura corporal elevada"
│   ├── imageUrl
│   ├── category: "general"     # general, digestivo, respiratorio, piel
│   ├── severity: "moderate"    # mild, moderate, severe
│   ├── order: 1
│   ├── isActive: true
│   ├── createdAt
│   └── updatedAt

consultations/                  # Consultas médicas
├── {consultationId}
│   ├── parentId
│   ├── childId
│   ├── specialistId
│   ├── type: "chat"            # chat, video
│   ├── status: "pending"       # pending, accepted, in_progress, completed, cancelled
│   ├── request
│   │   ├── description
│   │   ├── photos: []
│   │   ├── symptoms: []        # Array de symptomId
│   │   └── urgency: "normal"   # low, normal, high
│   ├── pricing
│   │   ├── basePrice: 40
│   │   ├── discount: 0
│   │   ├── finalPrice: 40
│   │   ├── couponCode: null
│   │   └── isFree: false
│   ├── payment
│   │   ├── method: "stripe"
│   │   ├── transactionId
│   │   ├── status: "completed"
│   │   └── paidAt
│   ├── schedule
│   │   ├── requestedAt
│   │   ├── acceptedAt
│   │   ├── scheduledFor
│   │   ├── startedAt
│   │   └── completedAt
│   ├── chat
│   │   ├── channelId          # Para chat en tiempo real
│   │   └── messageCount: 0
│   ├── video
│   │   ├── roomId             # Para videollamada
│   │   ├── duration: 0
│   │   └── recording: null
│   ├── outcome
│   │   ├── diagnosis
│   │   ├── treatment
│   │   ├── prescriptions: []
│   │   ├── notes
│   │   └── followUpRequired: false
│   ├── rating
│   │   ├── score: null        # 1-5
│   │   ├── comment: null
│   │   └── ratedAt: null
│   ├── createdAt
│   └── updatedAt

consultations/{consultationId}/messages/  # Mensajes del chat
├── {messageId}
│   ├── senderId
│   ├── senderType: "parent"    # parent, specialist
│   ├── message
│   ├── attachments: []
│   ├── isRead: false
│   ├── createdAt
│   └── updatedAt

discountCoupons/                # Cupones de descuento
├── {couponId}
│   ├── code: "FIRST10"
│   ├── type: "percentage"      # percentage, fixed, free
│   ├── value: 10               # 10% o $10
│   ├── maxUses: 100
│   ├── usedCount: 0
│   ├── validFrom
│   ├── validUntil
│   ├── applicableTo: "all"     # all, chat, video, specific_specialist
│   ├── specialistId: null
│   ├── isActive: true
│   ├── createdAt
│   └── updatedAt
```

---

## 🎯 Flujo de Consulta

### 1. Usuario Solicita Consulta
```
Usuario → Selecciona especialidad → Describe problema → 
Agrega fotos → Selecciona síntomas → Elige tipo (chat/video) →
Aplica cupón (opcional) → Ve precio → Confirma
```

### 2. Asignación
```
Sistema busca especialista disponible →
Notifica a especialista → Especialista acepta →
Notifica a usuario → Comienza consulta
```

### 3. Consulta
```
Chat en tiempo real o Videollamada →
Especialista da diagnóstico → Sube recetas/notas →
Marca como completada
```

### 4. Post-Consulta
```
Usuario califica → Especialista recibe pago →
Sistema guarda historial → Email de resumen
```

---

## 📡 API Endpoints

### A. Síntomas (Admin Dashboard)

#### 1. Crear Síntoma
```
POST /api/admin/symptoms
Body: {
  "name": "Fiebre",
  "description": "Temperatura corporal elevada",
  "imageUrl": "https://...",
  "category": "general",
  "severity": "moderate",
  "order": 1
}
```

#### 2. Listar Síntomas (Admin)
```
GET /api/admin/symptoms
Query: ?category=general&isActive=true&page=1&limit=20
```

#### 3. Actualizar Síntoma
```
PUT /api/admin/symptoms/:symptomId
Body: { "name": "...", "description": "..." }
```

#### 4. Eliminar/Desactivar Síntoma
```
DELETE /api/admin/symptoms/:symptomId
```

#### 5. Listar Síntomas (App - Pública)
```
GET /api/symptoms
Query: ?category=general
Response: Lista de síntomas activos
```

---

### B. Especialistas (Admin Dashboard)

#### 6. Crear Especialista
```
POST /api/admin/specialists
Body: {
  "personalInfo": {...},
  "professional": {...},
  "pricing": {...},
  "availability": {...}
}
```

#### 7. Listar Especialistas
```
GET /api/admin/specialists
Query: ?specialty=Pediatra&status=active
```

#### 8. Actualizar Especialista
```
PUT /api/admin/specialists/:specialistId
```

#### 9. Listar Especialistas (App)
```
GET /api/specialists
Query: ?specialty=Pediatra&available=true
Response: Lista de especialistas disponibles
```

---

### C. Consultas (App)

#### 10. Crear Consulta
```
POST /api/children/:childId/consultations
Body: {
  "description": "Mi bebé tiene fiebre...",
  "photos": ["url1", "url2"],
  "symptoms": ["symptom_id_1", "symptom_id_2"],
  "type": "chat",                    # chat o video
  "urgency": "high",
  "preferredSpecialistId": null,     # opcional
  "couponCode": "FIRST10"            # opcional
}
Response: {
  "consultationId": "...",
  "estimatedPrice": 36,              # con descuento aplicado
  "paymentRequired": true
}
```

#### 11. Listar Consultas del Usuario
```
GET /api/consultations
Query: ?status=pending&childId=xxx
```

#### 12. Detalles de Consulta
```
GET /api/consultations/:consultationId
```

#### 13. Cancelar Consulta
```
DELETE /api/consultations/:consultationId
```

---

### D. Chat en Tiempo Real

#### 14. Enviar Mensaje
```
POST /api/consultations/:consultationId/messages
Body: {
  "message": "Hola doctor...",
  "attachments": []
}
```

#### 15. Obtener Mensajes
```
GET /api/consultations/:consultationId/messages
Query: ?limit=50&before=messageId
```

#### 16. Marcar como Leído
```
PATCH /api/consultations/:consultationId/messages/:messageId/read
```

---

### E. Videollamadas

#### 17. Iniciar Videollamada
```
POST /api/consultations/:consultationId/video/start
Response: {
  "roomId": "...",
  "token": "...",
  "expires": "..."
}
```

#### 18. Finalizar Videollamada
```
POST /api/consultations/:consultationId/video/end
Body: { "duration": 1800 }
```

---

### F. Pagos

#### 19. Calcular Precio
```
POST /api/consultations/calculate-price
Body: {
  "type": "video",
  "specialistId": "...",
  "couponCode": "FIRST10"
}
Response: {
  "basePrice": 40,
  "discount": 4,
  "finalPrice": 36,
  "couponValid": true
}
```

#### 20. Procesar Pago
```
POST /api/consultations/:consultationId/payment
Body: {
  "paymentMethod": "stripe",
  "paymentToken": "..."
}
```

#### 21. Verificar Cupón
```
GET /api/coupons/verify/:code
Query: ?type=video
```

---

### G. Cupones (Admin)

#### 22. Crear Cupón
```
POST /api/admin/coupons
Body: {
  "code": "FIRST10",
  "type": "percentage",
  "value": 10,
  "maxUses": 100,
  "validFrom": "2026-01-01",
  "validUntil": "2026-12-31"
}
```

#### 23. Listar Cupones
```
GET /api/admin/coupons
```

#### 24. Stats de Cupones
```
GET /api/admin/coupons/:couponId/stats
```

---

### H. Panel del Especialista

#### 25. Consultas Pendientes (Especialista)
```
GET /api/specialist/consultations
Query: ?status=pending
```

#### 26. Aceptar Consulta
```
POST /api/specialist/consultations/:consultationId/accept
Body: { "scheduledFor": "2026-02-10T10:00:00Z" }
```

#### 27. Completar Consulta
```
POST /api/specialist/consultations/:consultationId/complete
Body: {
  "diagnosis": "...",
  "treatment": "...",
  "prescriptions": [...],
  "notes": "...",
  "followUpRequired": false
}
```

#### 28. Estadísticas del Especialista
```
GET /api/specialist/stats
```

---

## 💰 Sistema de Precios

### Precios Base
- **Chat**: $25
- **Video**: $40

### Descuentos
- **Porcentaje**: 10% → $36
- **Monto fijo**: -$5 → $35
- **Gratis**: $0

### Cupones
```javascript
{
  "FIRST10": "10% descuento primera consulta",
  "ママ20": "20% descuento para nuevas mamás",
  "FREE1": "Primera consulta gratis",
  "STUDENT50": "50% descuento estudiantes"
}
```

---

## 💳 Integración de Pagos

### Opciones Recomendadas:

#### 1. **Stripe** (Recomendado)
- ✅ Más popular globalmente
- ✅ Fees: 2.9% + $0.30
- ✅ Fácil integración
- ✅ Soporte local en Ecuador

#### 2. **PayPhone** (Ecuador)
- ✅ Local de Ecuador
- ✅ Transferencias bancarias
- ✅ Más económico

#### 3. **Kushki** (Latam)
- ✅ Especializado en Latam
- ✅ Múltiples métodos de pago

---

## 📊 Flujo Completo

### Flujo del Usuario:

```
1. INICIO
   ├── Usuario abre "Consultar Especialista"
   ├── Selecciona hijo
   └── Elige especialidad
   
2. DESCRIBIR PROBLEMA
   ├── Escribe descripción
   ├── Sube fotos (opcional)
   └── Selecciona síntomas de lista
   
3. TIPO DE CONSULTA
   ├── Chat ($25)
   └── Video ($40)
   
4. APLICAR DESCUENTO
   ├── Ingresa código cupón
   ├── Verifica validez
   └── Ve precio final
   
5. PAGO
   ├── Selecciona método (Stripe/PayPhone)
   ├── Ingresa datos
   └── Confirma pago
   
6. ASIGNACIÓN
   ├── Sistema busca especialista
   ├── Notifica a especialista
   └── Especialista acepta
   
7. CONSULTA
   ├── Chat en tiempo real o
   └── Videollamada programada
   
8. CIERRE
   ├── Especialista completa consulta
   ├── Sube diagnóstico/recetas
   └── Usuario califica servicio
   
9. FOLLOW-UP
   ├── Email con resumen
   ├── Recetas descargables
   └── Opción de nueva consulta
```

---

## 🎨 Categorías de Síntomas

```javascript
const symptomCategories = {
  general: {
    name: "General",
    icon: "🌡️",
    symptoms: ["Fiebre", "Dolor", "Malestar", "Irritabilidad"]
  },
  digestivo: {
    name: "Digestivo",
    icon: "🍼",
    symptoms: ["Vómito", "Diarrea", "Estreñimiento", "Gases", "Cólicos"]
  },
  respiratorio: {
    name: "Respiratorio",
    icon: "🫁",
    symptoms: ["Tos", "Congestión", "Dificultad respirar", "Sibilancias"]
  },
  piel: {
    name: "Piel",
    icon: "🧴",
    symptoms: ["Sarpullido", "Dermatitis", "Urticaria", "Eccema"]
  },
  neurologico: {
    name: "Neurológico",
    icon: "🧠",
    symptoms: ["Convulsiones", "Mareos", "Debilidad"]
  },
  ojos_oidos: {
    name: "Ojos y Oídos",
    icon: "👁️",
    symptoms: ["Conjuntivitis", "Dolor de oído", "Supuración"]
  },
  otros: {
    name: "Otros",
    icon: "⚕️",
    symptoms: ["Accidente", "Emergencia", "Otro"]
  }
};
```

---

## 📱 Pantallas de la App

### 1. Lista de Especialidades
```
┌─────────────────────────┐
│ Consultar Especialista  │
├─────────────────────────┤
│ 👶 Pediatra General     │
│ 🩺 Neonatólogo          │
│ 🧠 Neurólogo Pediátrico │
│ ❤️ Cardiólogo Pediátrico│
│ 🦷 Odontopediatra       │
│ 👀 Oftalmólogo          │
│ 🦴 Traumatólogo         │
│ 🧴 Dermatólogo          │
│ 🍎 Nutricionista        │
│ 🧠 Psicólogo Infantil   │
└─────────────────────────┘
```

### 2. Describir Problema
```
┌─────────────────────────┐
│ ¿Qué le pasa a Sofía?   │
├─────────────────────────┤
│ [Texto largo]           │
│ "Mi bebé tiene fiebre..." │
│                         │
│ 📸 Agregar Fotos        │
│ [foto1] [foto2] [+]     │
│                         │
│ 🩺 Síntomas             │
│ [✓] Fiebre (38.5°C)     │
│ [✓] Vómito              │
│ [ ] Diarrea             │
│ [ ] Tos                 │
│                         │
│ ⚠️ Urgencia: Alta       │
│                         │
│ [Continuar]             │
└─────────────────────────┘
```

### 3. Elegir Tipo de Consulta
```
┌─────────────────────────┐
│ Tipo de Consulta        │
├─────────────────────────┤
│ ┌─────────────────────┐ │
│ │ 💬 Chat             │ │
│ │ $25.00              │ │
│ │ Respuesta en 30min  │ │
│ └─────────────────────┘ │
│                         │
│ ┌─────────────────────┐ │
│ │ 📹 Videollamada     │ │
│ │ $40.00              │ │
│ │ Programar horario   │ │
│ └─────────────────────┘ │
│                         │
│ 🎁 Código de Descuento  │
│ [FIRST10] [Aplicar]     │
│                         │
│ Total: $36.00           │
│ (10% descuento)         │
│                         │
│ [Pagar y Confirmar]     │
└─────────────────────────┘
```

### 4. Pago
```
┌─────────────────────────┐
│ Método de Pago          │
├─────────────────────────┤
│ ( ) 💳 Tarjeta          │
│ ( ) 📱 PayPhone         │
│ ( ) 🏦 Transferencia    │
│                         │
│ Monto: $36.00           │
│                         │
│ [Continuar al Pago]     │
└─────────────────────────┘
```

### 5. Chat en Vivo
```
┌─────────────────────────┐
│ Dr. Juan Pérez         ⓘ│
│ Pediatra - En línea 🟢  │
├─────────────────────────┤
│                         │
│ 👨‍⚕️ Hola, cuéntame...   │
│ 10:30                   │
│                         │
│     Mi bebé tiene... 👤 │
│                   10:31 │
│                         │
│ 👨‍⚕️ ¿Desde cuándo?      │
│ 10:32                   │
│                         │
├─────────────────────────┤
│ [Escribir mensaje...]   │
│ 📎 📷                    │
└─────────────────────────┘
```

---

## 🔐 Permisos y Seguridad

### Roles:
- **Usuario/Padre**: Solicita consultas
- **Especialista**: Responde consultas
- **Admin**: Gestiona especialistas, síntomas, cupones

### Validaciones:
- Usuario solo ve sus consultas
- Especialista solo ve consultas asignadas
- Admin ve todo
- Pagos verificados antes de iniciar consulta
- Datos médicos encriptados

---

## 💡 Features Adicionales

### 1. **Consultas Gratis**
- Primera consulta gratis para nuevos usuarios
- Consultas gratuitas en campañas
- Consultas pro-bono de especialistas

### 2. **Sistema de Urgencias**
```javascript
urgencyLevels = {
  low: {
    name: "Baja",
    color: "green",
    responseTime: "2-4 horas",
    priority: 1
  },
  normal: {
    name: "Normal", 
    color: "blue",
    responseTime: "30-60 min",
    priority: 2
  },
  high: {
    name: "Alta",
    color: "red",
    responseTime: "10-15 min",
    priority: 3,
    surcharge: 10  // $10 extra
  }
}
```

### 3. **Historial Médico**
- Todas las consultas guardadas
- Diagnósticos previos
- Recetas descargables
- Exportar PDF

### 4. **Notificaciones**
- Push: Nueva respuesta del especialista
- Email: Resumen de consulta
- SMS: Recordatorio de videollamada (opcional)

### 5. **Rating y Reviews**
```javascript
{
  "rating": 5,
  "comment": "Excelente atención, muy claro",
  "wouldRecommend": true,
  "responseTime": "10 minutos"
}
```

---

## 📊 Dashboard del Especialista

### Panel Principal:
```
┌──────────────────────────────────┐
│ 👨‍⚕️ Dr. Juan Pérez              │
├──────────────────────────────────┤
│ 📊 Esta Semana                   │
│ • 23 Consultas completadas       │
│ • $920 Ganado                    │
│ • ⭐ 4.8 Rating promedio         │
│ • ⏱️ 15 min Tiempo respuesta    │
├──────────────────────────────────┤
│ 🔔 Pendientes (3)                │
│ ┌──────────────────────────────┐ │
│ │ Sofía, 2 años                │ │
│ │ Fiebre desde ayer            │ │
│ │ 🟠 Alta urgencia             │ │
│ │ [Aceptar] [Ver detalles]     │ │
│ └──────────────────────────────┘ │
├──────────────────────────────────┤
│ 📅 Próximas Videollamadas        │
│ • 15:00 - Emma, 3 años           │
│ • 16:30 - Lucas, 1 año           │
└──────────────────────────────────┘
```

---

## 🚀 Plan de Implementación

### Fase 1: Infraestructura Base (Primero)
- [ ] Crear colecciones de Firestore
- [ ] API de síntomas (CRUD admin + lista pública)
- [ ] API de especialistas (CRUD admin + lista pública)
- [ ] API de consultas (crear, listar, detalles)

### Fase 2: Pagos y Cupones
- [ ] Sistema de cupones (CRUD admin)
- [ ] Calculadora de precios
- [ ] Integración con Stripe
- [ ] Procesar pagos

### Fase 3: Chat
- [ ] Enviar/recibir mensajes
- [ ] Adjuntar fotos
- [ ] Marcar como leído
- [ ] Notificaciones en tiempo real

### Fase 4: Videollamadas
- [ ] Integración con Agora/Twilio
- [ ] Generar tokens de acceso
- [ ] Grabar sesiones (opcional)

### Fase 5: Panel Especialista
- [ ] Dashboard de consultas
- [ ] Aceptar/rechazar consultas
- [ ] Completar consultas
- [ ] Ver estadísticas

---

## 📦 Dependencias Necesarias

```bash
npm install stripe                    # Pagos
npm install agora-access-token       # Videollamadas (o Twilio)
npm install socket.io                # Chat en tiempo real (opcional)
npm install pdf-lib                  # Generar PDFs de recetas
```

---

## 💰 Costos Estimados

### Servicios de Terceros:
- **Stripe**: 2.9% + $0.30 por transacción
- **Agora** (Video): Gratis hasta 10k min/mes, luego $1.99/1k min
- **Twilio** (Video): $0.0015/min
- **Resend** (Emails): Ya configurado

### Ejemplo con 100 consultas/mes:
- 60 chat ($25) + 40 video ($40) = $3,100 ingresos
- Stripe fees: ~$100
- Agora/Twilio: ~$20-40
- **Ganancia neta**: ~$2,960

---

## 🎯 Siguiente Paso

**¿Quieres que comience con la Fase 1?**

Voy a implementar:
1. ✅ API de Síntomas (CRUD admin + lista pública)
2. ✅ API de Especialistas (básico)
3. ✅ API de Consultas (crear y listar)
4. ✅ Sistema de cupones

**Tiempo estimado**: 30-45 minutos

¿Comenzamos? 🚀
