# 🔍 Guía de Debugging - Cupones Auto-Aplicables

## 📋 Problema Común: Cupón no se aplica automáticamente

### ✅ Pasos para Diagnosticar

#### 1. Ver los Logs en Vercel
```
1. Ve a: https://vercel.com/mishu-lojans-projects/mumpabackend
2. Click en el deployment más reciente
3. Click en "Functions" → Busca tu función
4. Click en "Logs"
5. Busca los mensajes que empiezan con "🔍 [COUPON]"
```

Los logs te mostrarán **exactamente** por qué el cupón no se aplica.

---

## 🧪 Checklist de Verificación

### A. Verificar el Cupón en la Base de Datos

```javascript
// El cupón debe tener:
{
  "code": "PRIMERA",
  "type": "free",
  "value": 0,
  "isActive": true,              // ← ¿Está activo?
  "autoApply": true,             // ← ¿Auto-aplicación activada?
  "validFrom": "2026-02-01",     // ← ¿Ya pasó la fecha de inicio?
  "validUntil": "2026-12-31",    // ← ¿Aún no expiró?
  "maxUses": 1000,               // ← ¿Aún tiene usos disponibles?
  "usedCount": 245,              // ← ¿No alcanzó el máximo?
  "applicableTo": "all",         // ← ¿Aplica al tipo de consulta?
  "autoApplyConditions": {
    "firstConsultation": true,
    "userHasChildren": true,
    "priority": 10
  }
}
```

### B. Verificar las Condiciones del Usuario

Los logs te mostrarán:
```
🔍 [COUPON] Buscando cupón auto-aplicable para usuario abc123
   • Tipo: video
   • Especialista: specialist_123
   • Consultas totales: 0
   • Tiene consulta completada: false
   • Tiene hijos: true (1)
   • Cupones auto-aplicables encontrados: 3
```

---

## ❌ Razones Comunes por las que NO se Aplica

### 1. **autoApply = false**
```
📌 Evaluando cupón: PRIMERA
   ❌ El cupón no está en la base de datos con autoApply: true
```

**Solución:** Actualizar el cupón:
```bash
PUT /api/admin/coupons/{couponId}
{
  "autoApply": true
}
```

### 2. **isActive = false**
```
❌ El cupón está desactivado
```

**Solución:** Activar el cupón:
```bash
PUT /api/admin/coupons/{couponId}
{
  "isActive": true
}
```

### 3. **Aún no está vigente**
```
📌 Evaluando cupón: PRIMERA
   ❌ Aún no está vigente (inicia: 2026-03-01T00:00:00Z)
```

**Solución:** Cambiar `validFrom` a una fecha pasada:
```bash
PUT /api/admin/coupons/{couponId}
{
  "validFrom": "2026-02-01T00:00:00Z"
}
```

### 4. **Ya expiró**
```
📌 Evaluando cupón: PRIMERA
   ❌ Ya expiró (expiró: 2026-01-31T23:59:59Z)
```

**Solución:** Extender `validUntil`:
```bash
PUT /api/admin/coupons/{couponId}
{
  "validUntil": "2026-12-31T23:59:59Z"
}
```

### 5. **Alcanzó el máximo de usos**
```
📌 Evaluando cupón: PRIMERA
   ❌ Alcanzó el máximo de usos (1000/1000)
```

**Solución:** Aumentar `maxUses` o poner `null` para ilimitado:
```bash
PUT /api/admin/coupons/{couponId}
{
  "maxUses": null
}
```

### 6. **No aplica al tipo de consulta**
```
📌 Evaluando cupón: VIDEOPROMO
   ❌ No aplica a este tipo (requiere: video, actual: chat)
```

**Solución:** Cambiar `applicableTo` a "all" o al tipo correcto:
```bash
PUT /api/admin/coupons/{couponId}
{
  "applicableTo": "all"
}
```

### 7. **Usuario ya tiene consulta completada**
```
📌 Evaluando cupón: PRIMERA
   ✓ Validando condiciones...
   ❌ Requiere primera consulta pero usuario ya tiene consulta completada
```

**Explicación:** El cupón requiere `firstConsultation: true` pero el usuario ya usó el servicio.

**Solución:** Crear otro cupón para usuarios recurrentes.

### 8. **Usuario no tiene hijos registrados**
```
📌 Evaluando cupón: PRIMERA
   ✓ Validando condiciones...
   ❌ Requiere tener hijos registrados pero no tiene
```

**Solución:** 
- Usuario debe registrar un hijo primero
- O cambiar la condición del cupón:
```bash
PUT /api/admin/coupons/{couponId}
{
  "autoApplyConditions": {
    "firstConsultation": true,
    "userHasChildren": false  // ← Cambiar a false
  }
}
```

### 9. **Día de la semana incorrecto**
```
📌 Evaluando cupón: WEEKEND20
   ✓ Validando condiciones...
   ❌ Requiere día específico (friday, saturday, sunday) pero hoy es monday
```

**Solución:** 
- Esperar al fin de semana
- O cambiar la condición:
```bash
PUT /api/admin/coupons/{couponId}
{
  "autoApplyConditions": {
    "specificDays": null  // ← Quitar restricción de días
  }
}
```

### 10. **Cupón no encontrado en base de datos**
```
🔍 [COUPON] Buscando cupón auto-aplicable para usuario abc123
   • Cupones auto-aplicables encontrados: 0
```

**Solución:** El cupón no existe o no cumple con los filtros básicos. Verificar:
```javascript
{
  "autoApply": true,    // Debe ser true
  "isActive": true      // Debe ser true
}
```

---

## 🧪 Cómo Probar tu Cupón

### Paso 1: Crear Cupón de Prueba
```bash
POST /api/admin/coupons
{
  "code": "TEST_DEBUG",
  "type": "free",
  "value": 0,
  "maxUses": 10,
  "validFrom": "2026-01-01T00:00:00Z",
  "validUntil": "2026-12-31T23:59:59Z",
  "applicableTo": "all",
  "autoApply": true,
  "autoApplyConditions": {
    "firstConsultation": false,
    "newUser": false,
    "minConsultations": null,
    "maxConsultations": null,
    "userHasChildren": false,
    "specificDays": null,
    "priority": 100
  }
}
```

Este cupón:
- ✅ Se aplica a TODOS los usuarios
- ✅ Sin restricciones de consultas
- ✅ Sin restricción de hijos
- ✅ Sin restricción de días
- ✅ Prioridad máxima (100)
- ✅ Consulta gratis

### Paso 2: Probar Calcular Precio
```bash
POST /api/consultations/calculate-price
{
  "type": "video",
  "specialistId": "tu_specialist_id"
}
```

### Paso 3: Ver los Logs
En los logs de Vercel deberías ver:
```
🔍 [COUPON] Buscando cupón auto-aplicable para usuario abc123
   • Tipo: video
   • Especialista: specialist_123
   • Consultas totales: 0
   • Tiene consulta completada: false
   • Tiene hijos: false (0)
   • Cupones auto-aplicables encontrados: 1
   📌 Evaluando cupón: TEST_DEBUG
      ✓ Validando condiciones...
      ✅ Cupón ELEGIBLE! (priority: 100)
   ✅ 1 cupón(es) elegible(s)
   🎁 Cupón seleccionado: TEST_DEBUG (free, value: 0)
```

---

## 🎯 Ejemplo Completo de Debugging

### Escenario: "Mi cupón PRIMERA no se aplica"

#### Lo que dice el cupón:
```json
{
  "code": "PRIMERA",
  "autoApply": true,
  "isActive": true,
  "validFrom": "2026-02-01",
  "validUntil": "2026-12-31",
  "autoApplyConditions": {
    "firstConsultation": true,
    "userHasChildren": true
  }
}
```

#### Lo que muestran los logs:
```
🔍 [COUPON] Buscando cupón auto-aplicable para usuario abc123
   • Consultas totales: 1
   • Tiene consulta completada: true  ← AQUÍ ESTÁ EL PROBLEMA
   • Tiene hijos: true (1)
   • Cupones auto-aplicables encontrados: 1
   📌 Evaluando cupón: PRIMERA
      ✓ Validando condiciones...
      ❌ Requiere primera consulta pero usuario ya tiene consulta completada
```

#### Diagnóstico:
El usuario **ya tiene una consulta completada**, por lo tanto no es su primera consulta.

#### Soluciones:
1. **Usuario debe usar su primera consulta** - Ya no aplica para este usuario
2. **Crear otro cupón para usuarios recurrentes:**
```json
{
  "code": "SEGUNDA",
  "type": "percentage",
  "value": 20,
  "autoApply": true,
  "autoApplyConditions": {
    "minConsultations": 1,
    "maxConsultations": 5
  }
}
```

---

## 📊 Interpretando los Logs

### Log Exitoso (cupón se aplica):
```
🔍 [COUPON] Buscando cupón auto-aplicable para usuario abc123
   • Tipo: video
   • Especialista: specialist_123
   • Consultas totales: 0
   • Tiene consulta completada: false
   • Tiene hijos: true (1)
   • Cupones auto-aplicables encontrados: 2
   📌 Evaluando cupón: PRIMERA
      ✓ Validando condiciones...
      ✅ Cupón ELEGIBLE! (priority: 10)
   📌 Evaluando cupón: WEEKEND20
      ✓ Validando condiciones...
      ✅ Cupón ELEGIBLE! (priority: 5)
   ✅ 2 cupón(es) elegible(s)
   🎁 Cupón seleccionado: PRIMERA (free, value: 0)  ← SE APLICÓ ✅
```

### Log Fallido (cupón NO se aplica):
```
🔍 [COUPON] Buscando cupón auto-aplicable para usuario abc123
   • Tipo: video
   • Consultas totales: 5
   • Tiene consulta completada: true
   • Tiene hijos: true (2)
   • Cupones auto-aplicables encontrados: 1
   📌 Evaluando cupón: PRIMERA
      ✓ Validando condiciones...
      ❌ Requiere primera consulta pero usuario ya tiene consulta completada
   ❌ No hay cupones elegibles  ← NO SE APLICÓ ❌
```

---

## 🛠️ Herramientas de Debug

### 1. Ver todos los cupones activos:
```bash
GET /api/admin/coupons?isActive=true
```

### 2. Ver detalles de un cupón específico:
```bash
GET /api/admin/coupons/{couponId}
```

### 3. Ver consultas de un usuario:
```bash
GET /api/admin/consultations?parentId={userId}
```

### 4. Ver hijos de un usuario:
```bash
# Desde Firestore Console
users/{userId}/children
```

---

## ✅ Checklist Final

Antes de reportar un bug, verifica:

- [ ] El cupón existe en la base de datos
- [ ] `autoApply: true`
- [ ] `isActive: true`
- [ ] `validFrom` ya pasó
- [ ] `validUntil` aún no llega
- [ ] `maxUses` no alcanzado (o es `null`)
- [ ] `applicableTo` coincide con el tipo de consulta
- [ ] Usuario cumple con `autoApplyConditions`
- [ ] Revisaste los logs en Vercel
- [ ] Probaste con el cupón de prueba simple

---

## 📞 Necesitas Ayuda?

Si después de revisar los logs y verificar todo lo anterior el cupón sigue sin aplicarse:

1. **Copia los logs completos** desde Vercel
2. **Comparte la configuración del cupón** (JSON)
3. **Indica los datos del usuario:**
   - ¿Cuántas consultas tiene?
   - ¿Tiene hijos registrados?
   - ¿Qué día está probando?

Con esa información podemos identificar el problema exactamente. 🎯
