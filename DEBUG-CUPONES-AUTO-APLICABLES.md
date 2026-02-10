# Debug: Cupones Auto-Aplicables

## ✅ Fix Aplicado (2026-02-10)

### Problema Identificado
Los cupones con condición `userHasChildren: true` no se estaban aplicando automáticamente porque:
- La función `findBestAutoApplyCoupon` buscaba hijos en una **subcolección** incorrecta: `users/{userId}/children`
- Los hijos están en una **colección separada** `children` con el campo `parentId`

### Solución
```javascript
// ❌ ANTES (Incorrecto)
const childrenSnapshot = await db.collection('users')
  .doc(userId)
  .collection('children')
  .get();

// ✅ DESPUÉS (Correcto)
const childrenSnapshot = await db.collection('children')
  .where('parentId', '==', userId)
  .get();
```

### Commit
- **ID**: `cfaad93`
- **Mensaje**: "Fix auto-apply coupon: correct children collection query"
- **Deploy**: Vercel (automático desde GitHub)

---

## 🔍 Cómo Verificar que los Cupones se Aplican

### 1. Verificar Logs en Tiempo Real

Cuando un usuario intenta calcular el precio de una consulta, la función `findBestAutoApplyCoupon` genera logs detallados:

```
🔍 [COUPON] Buscando cupón auto-aplicable para usuario {userId}
   • Tipo: chat / video
   • Especialista: {specialistId}
   • Consultas totales: X
   • Tiene consulta completada: true/false
   • Tiene hijos: true/false (X hijos)
   • Cupones auto-aplicables encontrados: X
   
   📌 Evaluando cupón: {code}
      ✓ Validando condiciones...
      ✅ Cupón ELEGIBLE! (priority: X)
   
   ✅ X cupón(es) elegible(s)
   🎉 Cupón seleccionado: {code}
```

### 2. Endpoints para Testing

#### Calcular Precio con Auto-Apply
```bash
POST /api/consultations/calculate-price
Authorization: Bearer {token}
Content-Type: application/json

{
  "type": "chat",           # o "video"
  "specialistId": "xxx",
  "couponCode": null        # Dejar null para auto-apply
}
```

**Respuesta esperada con cupón auto-aplicado:**
```json
{
  "success": true,
  "data": {
    "basePrice": 25,
    "discount": 5,
    "finalPrice": 20,
    "currency": "USD",
    "coupon": {
      "code": "WELCOME20",
      "type": "percentage",
      "value": 20,
      "autoApplied": true    // ✅ Indica que se aplicó automáticamente
    },
    "isFree": false
  }
}
```

### 3. Condiciones de Auto-Aplicación

Los cupones se auto-aplican cuando cumplen **TODAS** estas validaciones:

#### Validaciones Básicas
- ✅ `autoApply: true`
- ✅ `isActive: true`
- ✅ Fecha actual entre `validFrom` y `validUntil`
- ✅ No ha alcanzado `maxUses`
- ✅ `applicableTo` coincide con el tipo de consulta (o es "all")
- ✅ `specialistId` coincide (o es null para todos)

#### Condiciones Específicas (`autoApplyConditions`)
- `firstConsultation: true` - Usuario NO tiene consultas completadas
- `newUser: true` - Usuario NO tiene consultas completadas
- `minConsultations: N` - Usuario tiene al menos N consultas
- `maxConsultations: N` - Usuario tiene máximo N consultas
- `userHasChildren: true` - Usuario tiene al menos 1 hijo registrado ✅ **FIX APLICADO**
- `specificDays: ["monday", "friday"]` - Solo aplica en días específicos

### 4. Orden de Prioridad

Si múltiples cupones son elegibles:

1. **Priority** (mayor primero)
2. **Tipo** (free > percentage > fixed)
3. **Valor** (mayor descuento primero)

---

## 🧪 Casos de Prueba

### Caso 1: Cupón de Bienvenida (Primera Consulta)
```json
{
  "code": "WELCOME20",
  "type": "percentage",
  "value": 20,
  "autoApply": true,
  "autoApplyConditions": {
    "firstConsultation": true
  }
}
```
**Aplica**: Usuario sin consultas completadas
**No Aplica**: Usuario con al menos 1 consulta completada

### Caso 2: Cupón para Padres
```json
{
  "code": "PARENTS10",
  "type": "percentage",
  "value": 10,
  "autoApply": true,
  "autoApplyConditions": {
    "userHasChildren": true
  }
}
```
**Aplica**: Usuario con hijos registrados en `children` collection ✅
**No Aplica**: Usuario sin hijos

### Caso 3: Cupón de Fidelidad
```json
{
  "code": "LOYAL15",
  "type": "percentage",
  "value": 15,
  "autoApply": true,
  "autoApplyConditions": {
    "minConsultations": 3
  }
}
```
**Aplica**: Usuario con 3 o más consultas
**No Aplica**: Usuario con menos de 3 consultas

### Caso 4: Cupón de Fin de Semana
```json
{
  "code": "WEEKEND25",
  "type": "percentage",
  "value": 25,
  "autoApply": true,
  "autoApplyConditions": {
    "specificDays": ["saturday", "sunday"]
  }
}
```
**Aplica**: Solo sábados y domingos
**No Aplica**: Lunes a viernes

---

## 📊 Verificar Cupones Activos

### Listar Cupones Auto-Aplicables
```bash
GET /api/admin/coupons?autoApply=true
Authorization: Bearer {admin-token}
```

### Verificar Estado de un Cupón
```bash
GET /api/admin/coupons/{couponId}
Authorization: Bearer {admin-token}
```

---

## 🐛 Troubleshooting

### Cupón no se aplica automáticamente

1. **Verificar que `autoApply: true`**
   ```bash
   GET /api/admin/coupons/{couponId}
   ```

2. **Verificar logs del servidor**
   - Buscar: `🔍 [COUPON] Buscando cupón auto-aplicable`
   - Ver qué condición está fallando

3. **Verificar que el usuario cumple condiciones**
   ```bash
   # Ver consultas del usuario
   GET /api/admin/consultations?userId={userId}
   
   # Ver hijos del usuario
   GET /api/admin/children?parentId={userId}
   ```

4. **Verificar fechas y usos**
   - `validFrom` y `validUntil` correctos
   - `usedCount < maxUses`

---

## 📝 Notas Importantes

1. **Cupones manuales tienen prioridad**: Si el usuario ingresa un código manualmente, ese se intenta aplicar primero.

2. **Solo se aplica 1 cupón**: No se pueden combinar múltiples cupones en una misma consulta.

3. **Logs detallados**: La función muestra paso a paso por qué cada cupón se acepta o rechaza.

4. **Performance**: La búsqueda de cupones auto-aplicables hace varias queries a Firestore, por lo que es importante mantener el número de cupones activos bajo control.

---

## 🔗 Referencias

- Función principal: `findBestAutoApplyCoupon` (línea ~42808 en server.js)
- Endpoint de cálculo: `POST /api/consultations/calculate-price` (línea ~43264)
- Endpoint de creación: `POST /api/children/:childId/consultations` (línea ~43387)
- Documentación completa: `SISTEMA-CUPONES-AVANZADO.md`
