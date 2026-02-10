# 🎁 Sistema Avanzado de Cupones - Munpa

## 📋 Características Nuevas

### ✅ Fechas de Inicio y Fin
Ahora los cupones tienen fechas claras de vigencia:
- **`validFrom`**: Fecha de inicio (cuando el cupón se activa)
- **`validUntil`**: Fecha de fin (cuando el cupón expira)

### ✅ Auto-Aplicación Automática
Los cupones pueden aplicarse automáticamente sin que el usuario los ingrese, basándose en condiciones específicas.

---

## 🎯 Estructura de Cupones

```javascript
{
  "code": "PRIMERA",
  "type": "free",                    // percentage, fixed, free
  "value": 0,
  "maxUses": 1000,
  "usedCount": 0,
  
  // ✨ FECHAS
  "validFrom": "2026-02-01T00:00:00Z",
  "validUntil": "2026-12-31T23:59:59Z",
  
  // ✨ AUTO-APLICACIÓN
  "autoApply": true,                 // Si es true, se aplica automáticamente
  "autoApplyConditions": {
    "firstConsultation": true,       // Solo primera consulta
    "newUser": false,                // Solo usuarios nuevos (sin consultas previas)
    "minConsultations": null,        // Mínimo de consultas completadas
    "maxConsultations": 0,           // Máximo de consultas (0 = primera vez)
    "userHasChildren": true,         // Usuario debe tener hijos registrados
    "specificDays": null,            // ["monday", "tuesday", ...] o null
    "priority": 10                   // Mayor prioridad = se aplica primero
  },
  
  "applicableTo": "all",             // all, chat, video
  "specialistId": null,
  "isActive": true
}
```

---

## 🔧 Condiciones de Auto-Aplicación

### 1. **Primera Consulta**
```json
{
  "autoApplyConditions": {
    "firstConsultation": true
  }
}
```
✅ Se aplica solo en la primera consulta del usuario  
❌ No se aplica si ya tiene consultas completadas

### 2. **Usuario Nuevo**
```json
{
  "autoApplyConditions": {
    "newUser": true
  }
}
```
✅ Se aplica solo a usuarios sin consultas previas  
❌ No se aplica si ya tuvo alguna consulta

### 3. **Mínimo de Consultas**
```json
{
  "autoApplyConditions": {
    "minConsultations": 5
  }
}
```
✅ Se aplica si el usuario tiene al menos 5 consultas  
❌ No se aplica si tiene menos de 5

### 4. **Máximo de Consultas**
```json
{
  "autoApplyConditions": {
    "maxConsultations": 3
  }
}
```
✅ Se aplica si el usuario tiene máximo 3 consultas  
❌ No se aplica si tiene más de 3

### 5. **Usuario con Hijos Registrados**
```json
{
  "autoApplyConditions": {
    "userHasChildren": true
  }
}
```
✅ Se aplica si el usuario tiene al menos un hijo registrado  
❌ No se aplica si no tiene hijos

### 6. **Días Específicos**
```json
{
  "autoApplyConditions": {
    "specificDays": ["monday", "friday", "saturday"]
  }
}
```
✅ Se aplica solo los lunes, viernes y sábados  
❌ No se aplica otros días

Días válidos: `"sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"`

### 7. **Prioridad**
```json
{
  "autoApplyConditions": {
    "priority": 10
  }
}
```
- Cupones con **mayor prioridad** se aplican primero
- Si hay múltiples cupones elegibles, se elige el de mayor prioridad
- Si tienen la misma prioridad, se elige el de mayor descuento

---

## 📝 Ejemplos de Cupones

### Ejemplo 1: Primera Consulta Gratis
```json
POST /api/admin/coupons
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

**Comportamiento:**
- ✅ Se aplica automáticamente
- ✅ Solo en la primera consulta
- ✅ Solo si tiene hijos registrados
- ✅ Válido de febrero a diciembre 2026
- ✅ Prioridad alta (10)

---

### Ejemplo 2: 20% Descuento Fin de Semana
```json
POST /api/admin/coupons
{
  "code": "WEEKEND20",
  "type": "percentage",
  "value": 20,
  "maxUses": null,
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

**Comportamiento:**
- ✅ Se aplica automáticamente
- ✅ Solo viernes, sábado y domingo
- ✅ 20% de descuento
- ✅ Usos ilimitados
- ⚠️ Prioridad media (5)

---

### Ejemplo 3: Usuarios Frecuentes - $10 Descuento
```json
POST /api/admin/coupons
{
  "code": "LOYAL10",
  "type": "fixed",
  "value": 10,
  "maxUses": null,
  "validFrom": "2026-02-01",
  "validUntil": "2026-12-31",
  "applicableTo": "all",
  "autoApply": true,
  "autoApplyConditions": {
    "minConsultations": 5,
    "priority": 7
  }
}
```

**Comportamiento:**
- ✅ Se aplica automáticamente
- ✅ Solo usuarios con 5+ consultas
- ✅ $10 de descuento fijo
- ✅ Usos ilimitados
- ⚠️ Prioridad 7

---

### Ejemplo 4: Nuevas Mamás - 50% Primera Videollamada
```json
POST /api/admin/coupons
{
  "code": "MAMA50",
  "type": "percentage",
  "value": 50,
  "maxUses": 500,
  "validFrom": "2026-02-01",
  "validUntil": "2026-06-30",
  "applicableTo": "video",
  "autoApply": true,
  "autoApplyConditions": {
    "firstConsultation": true,
    "userHasChildren": true,
    "priority": 8
  }
}
```

**Comportamiento:**
- ✅ Se aplica automáticamente
- ✅ Solo primera consulta
- ✅ Solo videollamadas
- ✅ Solo usuarios con hijos
- ✅ 50% de descuento
- ✅ Máximo 500 usos
- ⚠️ Válido solo primer semestre 2026

---

### Ejemplo 5: Happy Hour - Lunes y Miércoles
```json
POST /api/admin/coupons
{
  "code": "HAPPYHOUR",
  "type": "percentage",
  "value": 30,
  "maxUses": null,
  "validFrom": "2026-02-01",
  "validUntil": "2026-12-31",
  "applicableTo": "chat",
  "autoApply": true,
  "autoApplyConditions": {
    "specificDays": ["monday", "wednesday"],
    "priority": 6
  }
}
```

**Comportamiento:**
- ✅ Se aplica automáticamente
- ✅ Solo lunes y miércoles
- ✅ Solo consultas por chat
- ✅ 30% de descuento
- ⚠️ Prioridad 6

---

## 🔄 Flujo de Aplicación de Cupones

### Cuando el usuario crea una consulta:

```
1. Usuario ingresa cupón manualmente?
   └─ SÍ → Validar y aplicar cupón manual
   └─ NO → Continuar

2. Buscar cupones auto-aplicables:
   ├─ Filtrar por fechas (validFrom, validUntil)
   ├─ Filtrar por usos disponibles (maxUses vs usedCount)
   ├─ Filtrar por tipo de consulta (chat/video)
   ├─ Filtrar por especialista (si aplica)
   ├─ Validar condiciones de auto-aplicación:
   │  ├─ Primera consulta?
   │  ├─ Usuario nuevo?
   │  ├─ Mínimo de consultas?
   │  ├─ Máximo de consultas?
   │  ├─ Tiene hijos?
   │  └─ Día de la semana correcto?
   └─ Ordenar por prioridad y valor

3. Aplicar el mejor cupón elegible
4. Incrementar contador de usos
5. Crear consulta con descuento aplicado
```

---

## 📡 API Endpoints

### Crear Cupón con Auto-Aplicación
```bash
POST https://api.munpa.online/api/admin/coupons
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "code": "PRIMERA",
  "type": "free",
  "value": 0,
  "maxUses": 1000,
  "validFrom": "2026-02-01T00:00:00Z",
  "validUntil": "2026-12-31T23:59:59Z",
  "applicableTo": "all",
  "autoApply": true,
  "autoApplyConditions": {
    "firstConsultation": true,
    "userHasChildren": true,
    "priority": 10
  }
}
```

### Calcular Precio (con auto-aplicación)
```bash
POST https://api.munpa.online/api/consultations/calculate-price
Authorization: Bearer {user_token}
Content-Type: application/json

{
  "type": "video",
  "specialistId": "specialist_123"
  // NO se envía couponCode, se aplica automáticamente
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "basePrice": 40,
    "discount": 40,
    "finalPrice": 0,
    "currency": "USD",
    "coupon": {
      "code": "PRIMERA",
      "type": "free",
      "value": 0,
      "autoApplied": true    // ✨ Indica que se aplicó automáticamente
    },
    "isFree": true
  }
}
```

### Crear Consulta (con auto-aplicación)
```bash
POST https://api.munpa.online/api/children/{childId}/consultations
Authorization: Bearer {user_token}
Content-Type: application/json

{
  "description": "Mi bebé tiene fiebre",
  "photos": [],
  "symptoms": ["symptom_1"],
  "type": "video",
  "urgency": "high"
  // NO se envía couponCode, se aplica automáticamente si es elegible
}
```

---

## 🎯 Prioridades de Cupones

Cuando hay múltiples cupones auto-aplicables elegibles:

**Orden de evaluación:**
1. **Cupón manual** (si el usuario ingresó uno)
2. **Mayor prioridad** (campo `priority`)
3. **Mayor descuento**
4. **Tipo de descuento** (free > fixed > percentage)

**Ejemplo:**

```
Cupones elegibles:
- PRIMERA (free, priority: 10)    ← Este se aplica ✅
- WEEKEND20 (20%, priority: 5)
- LOYAL10 ($10, priority: 7)
```

---

## 🧪 Casos de Uso

### Caso 1: Mamá Registra Primer Hijo
```
Usuario: María
Hijos: 1 (recién registrado)
Consultas: 0

Cupón aplicable: PRIMERA (primera consulta + tiene hijos)
Resultado: Consulta GRATIS ✅
```

### Caso 2: Usuario Hace Segunda Consulta
```
Usuario: María
Hijos: 1
Consultas: 1

Cupón aplicable: Ninguno (ya no es primera consulta)
Resultado: Precio normal ❌
```

### Caso 3: Usuario Frecuente en Fin de Semana
```
Usuario: Ana
Hijos: 2
Consultas: 8
Día: Sábado

Cupones aplicables:
- WEEKEND20 (20%, priority: 5)
- LOYAL10 ($10, priority: 7)

Resultado: Se aplica LOYAL10 (mayor prioridad) ✅
```

### Caso 4: Usuario con Cupón Manual
```
Usuario: Pedro
Ingresa: "PROMO30"
Tiene cupón auto-aplicable: PRIMERA

Resultado: Se aplica PROMO30 (manual tiene prioridad) ✅
```

---

## 📊 Dashboard Admin - Ideas

### Panel de Cupones:
```
┌────────────────────────────────────────┐
│ Cupones Activos                        │
├────────────────────────────────────────┤
│ PRIMERA                                │
│ • Gratis                               │
│ • Auto-aplicable ✨                    │
│ • 245/1000 usos                        │
│ • Vence: 31 Dic 2026                   │
│ • 🟢 Activo                            │
├────────────────────────────────────────┤
│ WEEKEND20                              │
│ • 20% descuento                        │
│ • Auto-aplicable ✨ (Fin de semana)   │
│ • 89 usos                              │
│ • Vence: 31 Dic 2026                   │
│ • 🟢 Activo                            │
└────────────────────────────────────────┘
```

---

## 💡 Recomendaciones

### Para Cupones Auto-Aplicables:
1. **Prioridad alta** para cupones de bienvenida (10)
2. **Prioridad media** para promociones especiales (5-7)
3. **Prioridad baja** para descuentos generales (1-3)

### Para Fechas:
- `validFrom`: Usar 00:00:00 del día de inicio
- `validUntil`: Usar 23:59:59 del último día
- Siempre en UTC

### Para Condiciones:
- No combinar `firstConsultation` con `minConsultations`
- `newUser` es más restrictivo que `firstConsultation`
- `specificDays` se puede combinar con cualquier otra condición

---

## ✅ Checklist de Testing

- [ ] Cupón se aplica automáticamente en primera consulta
- [ ] Cupón NO se aplica en segunda consulta
- [ ] Cupón se aplica solo los días especificados
- [ ] Cupón se aplica con fecha de inicio futura
- [ ] Cupón expira correctamente al llegar a validUntil
- [ ] Cupón respeta maxUses
- [ ] Se aplica el cupón de mayor prioridad cuando hay múltiples elegibles
- [ ] Cupón manual tiene prioridad sobre auto-aplicables
- [ ] Cupón solo se aplica al tipo de consulta correcto (chat/video)

---

## 🚀 Próximas Mejoras

1. **Cupones por segmento de usuarios** (edad del hijo, ubicación)
2. **Cupones por hora del día** (8am-12pm)
3. **Cupones acumulativos** (múltiples cupones a la vez)
4. **Notificaciones push** cuando hay cupón disponible
5. **Cupones personalizados** por usuario
6. **Analytics de cupones** (tasa de conversión, ROI)

---

¡Listo! Ahora el sistema de cupones es mucho más potente y flexible. 🎉
