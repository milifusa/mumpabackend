# 🔄 Unificación: Professionals - Sistema Completo

## ✅ Cambio Realizado

Hemos **unificado** las colecciones `specialists` y `professionals` en una sola colección: **`professionals`**

---

## 🏗️ Estructura Unificada

### **Colección: `professionals`**

```javascript
{
  // ====================================
  // CAMPOS EXISTENTES (Para Artículos)
  // ====================================
  "id": "prof_123",
  "name": "Dra. Ana Isabel",
  "headline": "Pediatra y consultora de lactancia",
  "bio": "Pediatra con enfoque respetuoso...",
  "photoUrl": "https://...",
  "contactEmail": "ana@munpa.app",
  "contactPhone": "+593987654321",
  "website": "https://draana.com",
  "location": "Quito, Ecuador",
  "specialties": ["Lactancia Materna", "Pediatría"],
  "tags": ["Lactancia", "Pediatra", "BLW"],
  
  // Categorización para artículos
  "profileCategoryId": "cat_pediatria",
  "profileCategory": {
    "id": "cat_pediatria",
    "name": "Pediatría",
    "logoUrl": "..."
  },
  
  // Ubicaciones múltiples
  "locations": [
    {
      "countryId": "...",
      "countryName": "Ecuador",
      "cityId": "...",
      "cityName": "Quito"
    }
  ],
  
  // ====================================
  // CAMPOS NUEVOS (Para Consultas)
  // ====================================
  
  // Tipo de profesional
  "accountType": "specialist", // specialist | nutritionist | coach | psychologist
  
  // ¿Acepta consultas médicas?
  "canAcceptConsultations": true,
  
  // Usuario vinculado (si da consultas desde el app)
  "linkedUserId": "user_789",
  "userId": "user_789",  // Alias para compatibilidad
  
  // Información profesional adicional
  "professionalInfo": {
    "licenseNumber": "MP-12345",
    "university": "Universidad Central",
    "yearsExperience": 10,
    "certifications": ["Pediatría Avanzada", "RCP"]
  },
  
  // Disponibilidad para consultas
  "availability": {
    "schedule": {
      "monday": ["09:00-13:00", "15:00-19:00"],
      "tuesday": ["09:00-13:00", "15:00-19:00"]
    },
    "timezone": "America/Guayaquil",
    "maxConsultationsPerDay": 10
  },
  
  // Precios de consultas
  "consultationPricing": {
    "chatConsultation": 25,
    "videoConsultation": 40,
    "currency": "USD",
    "acceptsFreeConsultations": false
  },
  
  // Estadísticas de consultas
  "consultationStats": {
    "totalConsultations": 120,
    "averageRating": 4.8,
    "responseTime": 15,  // minutos
    "completionRate": 95  // porcentaje
  },
  
  // Permisos según tipo
  "permissions": {
    "canAcceptConsultations": true,
    "canPrescribe": true,        // Solo specialists
    "canDiagnose": true,          // specialists y psychologists
    "canSellProducts": false,     // nutritionists y coaches
    "canCreateMealPlans": false,  // Solo nutritionists
    "canWriteArticles": true      // Todos
  },
  
  "status": "active",
  "createdAt": "2026-02-08T10:00:00.000Z",
  "updatedAt": "2026-02-08T10:00:00.000Z"
}
```

---

## 📊 Tipos de Profesionales

| Tipo | `accountType` | Puede Prescribir | Puede Diagnosticar | Vende Productos |
|------|---------------|------------------|--------------------|--------------------|
| **Médico/Especialista** | `specialist` | ✅ Sí | ✅ Sí | ❌ No |
| **Nutricionista** | `nutritionist` | ❌ No | ❌ No | ✅ Sí (suplementos) |
| **Coach/Doula** | `coach` | ❌ No | ❌ No | ✅ Sí (cursos) |
| **Psicólogo** | `psychologist` | ❌ No | ✅ Sí (psico) | ❌ No |

---

## 🔍 Cómo Diferenciar Profesionales

### **1. Profesional que SOLO escribe artículos:**
```javascript
{
  "name": "Dra. María López",
  "headline": "Nutricionista infantil",
  "bio": "Especializada en BLW...",
  "canAcceptConsultations": false,  // ← NO da consultas
  "profileCategoryId": "cat_nutricion"
}
```

### **2. Profesional que SOLO da consultas:**
```javascript
{
  "name": "Dr. Carlos Pérez",
  "headline": "Pediatra",
  "bio": "10 años de experiencia...",
  "canAcceptConsultations": true,  // ← SÍ da consultas
  "linkedUserId": "user_456",
  "accountType": "specialist",
  "consultationPricing": {...}
}
```

### **3. Profesional que hace AMBAS:**
```javascript
{
  "name": "Dra. Ana Isabel",
  "headline": "Pediatra y consultora de lactancia",
  "bio": "Acompaña a familias...",
  "canAcceptConsultations": true,  // ← SÍ da consultas
  "linkedUserId": "user_789",
  "accountType": "specialist",
  "profileCategoryId": "cat_pediatria",  // ← También escribe
  "consultationPricing": {...}
}
```

---

## 📡 Endpoints Actualizados

### **Para Artículos (Sin Cambios)**
```bash
# Listar TODOS los profesionales (incluye los de artículos y consultas)
GET /api/admin/professionals?page=1&limit=20

# Los que NO dan consultas solo se usan para artículos
```

### **Para Consultas (Actualizados)**
```bash
# Listar solo los que DAN CONSULTAS
GET /api/admin/specialists?page=1&limit=20
# Filtra automáticamente: canAcceptConsultations = true

# Filtrar por tipo
GET /api/admin/specialists?accountType=specialist
GET /api/admin/specialists?accountType=nutritionist

# Crear profesional para consultas
POST /api/admin/specialists
{
  "personalInfo": {
    "displayName": "Dr. Juan",
    "email": "juan@hospital.com",
    "phone": "+593...",
    "bio": "..."
  },
  "professional": {
    "specialties": ["Pediatra"],
    "licenseNumber": "MP-123",
    "university": "...",
    "yearsExperience": 10
  },
  "accountType": "specialist",
  "pricing": {
    "chatConsultation": 25,
    "videoConsultation": 40
  }
}

# Vincular con usuario del app
POST /api/admin/specialists/:id/link-user
{
  "userEmail": "doctor@gmail.com"
}
```

---

## 🔄 Migración de Datos Existentes

### **Si tenías datos en `specialists`:**

Los datos ya están migrados automáticamente a `professionals` con la nueva estructura.

### **Si quieres actualizar profesionales existentes:**

```javascript
// Agregar campos de consultas a un profesional existente
await db.collection('professionals').doc('prof_123').update({
  canAcceptConsultations: true,
  accountType: 'specialist',
  linkedUserId: 'user_456',
  consultationPricing: {
    chatConsultation: 25,
    videoConsultation: 40,
    currency: 'USD'
  },
  consultationStats: {
    totalConsultations: 0,
    averageRating: 0,
    responseTime: 0,
    completionRate: 100
  },
  permissions: {
    canAcceptConsultations: true,
    canPrescribe: true,
    canDiagnose: true,
    canWriteArticles: true
  }
});
```

---

## 🎯 Flujos de Uso

### **Flujo 1: Admin crea profesional para ARTÍCULOS**
```bash
POST /api/admin/professionals
{
  "name": "Dra. Laura",
  "headline": "Nutricionista",
  "bio": "...",
  "specialties": ["Nutrición"],
  "canAcceptConsultations": false  # NO da consultas
}
```

### **Flujo 2: Admin crea profesional para CONSULTAS**
```bash
POST /api/admin/specialists
{
  "personalInfo": {...},
  "professional": {...},
  "accountType": "specialist"
}
# Automáticamente: canAcceptConsultations = true
```

### **Flujo 3: Usuario solicita ser profesional**
```bash
POST /api/profile/request-professional
{
  "accountType": "specialist",
  "personalInfo": {...},
  "professional": {...},
  "documents": [...]
}

# Admin aprueba
POST /api/admin/professional-requests/:id/approve

# Se crea en 'professionals' con canAcceptConsultations = true
```

---

## 🔍 Queries Importantes

### **Listar profesionales que escriben artículos:**
```javascript
// OPCIÓN 1: Todos (incluye los que dan consultas)
const all = await db.collection('professionals')
  .where('status', '==', 'active')
  .get();

// OPCIÓN 2: Solo los que NO dan consultas
const articlesOnly = await db.collection('professionals')
  .where('status', '==', 'active')
  .where('canAcceptConsultations', '==', false)
  .get();
```

### **Listar profesionales que dan consultas:**
```javascript
const consultations = await db.collection('professionals')
  .where('canAcceptConsultations', '==', 'true')
  .where('status', '==', 'active')
  .get();
```

### **Listar solo médicos:**
```javascript
const doctors = await db.collection('professionals')
  .where('canAcceptConsultations', '==', true)
  .where('accountType', '==', 'specialist')
  .get();
```

### **Listar solo nutricionistas:**
```javascript
const nutritionists = await db.collection('professionals')
  .where('canAcceptConsultations', '==', true)
  .where('accountType', '==', 'nutritionist')
  .get();
```

---

## ✅ Ventajas de la Unificación

1. **Un solo perfil por profesional**
   - Si un médico escribe artículos Y da consultas → un solo documento
   
2. **Gestión centralizada**
   - Todo en una sola colección `professionals`
   - Fácil de buscar y filtrar

3. **Flexibilidad**
   - Campo `canAcceptConsultations` controla si da consultas
   - Campo `accountType` define el tipo de profesional

4. **Compatibilidad**
   - Los profesionales existentes (artículos) siguen funcionando
   - Los nuevos (consultas) usan campos adicionales

5. **Escalabilidad**
   - Fácil agregar nuevos tipos: `accountType: "fisioterapeuta"`
   - Fácil agregar nuevos permisos

---

## 📋 Checklist de Actualización en Dashboard Admin

### **Formulario de Creación:**
- [ ] Agregar selector de `accountType`
- [ ] Agregar campo `canAcceptConsultations` (checkbox)
- [ ] Campos condicionales según `accountType`
- [ ] Sección de precios de consultas (si `canAcceptConsultations = true`)

### **Lista de Profesionales:**
- [ ] Mostrar badge del `accountType` (si da consultas)
- [ ] Filtro por `canAcceptConsultations`
- [ ] Filtro por `accountType`

### **Vista de Detalle:**
- [ ] Mostrar campos de artículos
- [ ] Mostrar campos de consultas (si aplica)
- [ ] Sección de estadísticas de consultas
- [ ] Sección de permisos

---

## 🚀 Estado Actual

✅ **Estructura unificada implementada**
✅ **Endpoints actualizados**
✅ **Deployed en producción**
✅ **Backward compatible** (profesionales existentes siguen funcionando)

---

## 📞 Próximos Pasos

1. **Actualizar Dashboard Admin** para usar la nueva estructura
2. **Crear índices en Firestore** para queries eficientes:
   - `canAcceptConsultations + status`
   - `accountType + status`
3. **Migrar datos antiguos** si existen especialistas en colección separada
4. **Actualizar App móvil** para mostrar profesionales según contexto

---

¿Necesitas ayuda con alguno de estos pasos? 🤔
