# 🔧 Fix: Sistema de Verificación y Badges

## 🐛 Problema Identificado

El campo `verified` (Verificado por Munpa) no estaba funcionando porque:

1. Los recomendados existentes en Firestore no tienen los campos `verified`, `badges` y `features`
2. Necesitan ser migrados para agregar estos campos

## ✅ Solución Implementada

### 1. Logs de Depuración

Se agregaron logs para identificar cómo llega el campo `verified`:

```javascript
// Al crear
console.log('📋 [DEBUG] verified recibido:', verified, 'tipo:', typeof verified);
console.log('📋 [DEBUG] recommendationData.verified final:', recommendationData.verified);

// Al actualizar
console.log('📋 [DEBUG UPDATE] verified recibido:', verified, 'tipo:', typeof verified);
console.log('📋 [DEBUG UPDATE] verified final:', updateData.verified);
```

### 2. Conversión Mejorada

Se mejoró la conversión para soportar múltiples formatos:

```javascript
// Antes
verified: verified === true || verified === 'true'

// Ahora
verified: verified === true || verified === 'true' || verified === '1' || verified === 1
```

Soporta:
- `true` (booleano)
- `"true"` (string)
- `1` (número)
- `"1"` (string)

### 3. Endpoint de Migración

**POST** `/api/admin/recommendations/migrate-badges`

Migra todos los recomendados existentes para agregar los campos faltantes.

**Headers:**
```
Authorization: Bearer {admin-token}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Migración completada exitosamente",
  "data": {
    "total": 25,      // Total de recomendados
    "updated": 20,    // Actualizados
    "skipped": 5      // Ya tenían los campos
  }
}
```

**Qué hace:**
- Agrega `verified: false` si no existe
- Agrega `badges: []` si no existe
- Agrega `features: { ... }` con todos los campos en `false` si no existe
- Solo actualiza los que no tienen estos campos (no sobrescribe)

---

## 🚀 Pasos para Solucionar

### Paso 1: Desplegar el Backend

```bash
git add -A
git commit -m "fix: Mejorar conversión de verified y agregar endpoint de migración"
git push origin main
vercel --prod
```

### Paso 2: Ejecutar la Migración

Desde el dashboard admin o Postman:

```bash
POST https://mumpabackend-XXXX.vercel.app/api/admin/recommendations/migrate-badges

Headers:
Authorization: Bearer {tu-token-admin}
```

### Paso 3: Verificar en la App

Después de la migración:
- Todos los recomendados existentes tendrán `verified: false`
- Los nuevos recomendados podrán ser marcados como verificados desde el dashboard
- Los badges y features funcionarán correctamente

---

## 🎨 Cómo Usar desde el Dashboard

### Crear Recomendado con Verificación:

```typescript
POST /api/admin/recommendations

{
  "name": "Clínica Maternal",
  "categoryId": "cat123",
  "verified": true,  // ← Marcar como verificado
  "features": {
    "hasChangingTable": true,
    "hasNursingRoom": true
  }
}
```

### Actualizar Verificación:

```typescript
PUT /api/admin/recommendations/{id}

{
  "verified": true  // ← Activar verificación
}
```

---

## 🔍 Cómo Verificar que Funciona

### 1. En Firestore Console:

Ir a tu colección `recommendations` y verificar que cada documento tiene:

```javascript
{
  verified: false,
  badges: [],
  features: {
    hasChangingTable: false,
    hasNursingRoom: false,
    hasParking: false,
    isStrollerAccessible: false,
    acceptsEmergencies: false,
    is24Hours: false
  }
}
```

### 2. En la API (App):

```bash
GET /api/recommendations

# Respuesta debe incluir:
{
  "data": [
    {
      "id": "rec123",
      "name": "...",
      "verified": false,  // ← Campo presente
      "badges": [],
      "features": { ... }
    }
  ]
}
```

### 3. En Logs de Vercel:

Al crear/actualizar un recomendado, deberías ver:

```
📋 [DEBUG] verified recibido: true tipo: boolean
📋 [DEBUG] recommendationData.verified final: true
✅ [ADMIN] Recomendado creado: rec123
```

---

## 📱 Ejemplo de Uso en la App

### Badge "Verificado por Munpa":

```tsx
const RecommendationCard = ({ item }) => (
  <View style={styles.card}>
    <Text style={styles.name}>{item.name}</Text>
    
    {/* Mostrar badge de verificado */}
    {item.verified && (
      <View style={styles.verifiedBadge}>
        <Icon name="verified" size={16} color="#fff" />
        <Text style={styles.verifiedText}>Verificado por Munpa</Text>
      </View>
    )}
    
    {/* Otros badges */}
    <BadgesDisplay badges={item.badges} />
  </View>
);

const styles = StyleSheet.create({
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#4CAF50',
  },
  verifiedText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  }
});
```

---

## 🎯 Componente Angular (Dashboard)

### Checkbox de Verificación:

```typescript
// recommendation-form.component.ts
import { Component } from '@angular/core';

@Component({
  selector: 'app-recommendation-form',
  template: `
    <form [formGroup]="form" (ngSubmit)="onSubmit()">
      <!-- Otros campos -->
      
      <mat-slide-toggle 
        formControlName="verified"
        color="primary">
        <mat-icon>verified</mat-icon>
        Verificado por Munpa
      </mat-slide-toggle>
      
      <button mat-raised-button color="primary" type="submit">
        Guardar
      </button>
    </form>
  `
})
export class RecommendationFormComponent {
  form = this.fb.group({
    name: ['', Validators.required],
    categoryId: ['', Validators.required],
    verified: [false],  // ← Campo de verificación
    // ... otros campos
  });

  async onSubmit() {
    if (this.form.valid) {
      const data = this.form.value;
      
      // El valor será true o false (booleano)
      console.log('Verified:', data.verified);
      
      await this.recommendationService.create(data);
    }
  }
}
```

---

## 📝 Checklist de Verificación

Después de aplicar el fix, verifica:

- [ ] Backend desplegado con los cambios
- [ ] Endpoint de migración ejecutado exitosamente
- [ ] Logs en Vercel muestran los valores de `verified` correctamente
- [ ] Firestore tiene los campos en todos los documentos
- [ ] API devuelve `verified` en las respuestas
- [ ] Dashboard puede crear recomendados verificados
- [ ] Dashboard puede actualizar la verificación
- [ ] App muestra el badge "Verificado por Munpa" correctamente

---

## 🐞 Debugging

Si aún no funciona:

### 1. Verificar Logs en Vercel:

```bash
vercel logs --follow
```

Buscar líneas como:
```
📋 [DEBUG] verified recibido: ...
📋 [DEBUG] recommendationData.verified final: ...
```

### 2. Verificar Request desde Dashboard:

En Chrome DevTools > Network:
```json
// Request Payload
{
  "verified": true  // ← Debe ser booleano true, no string "true"
}
```

### 3. Verificar en Firestore:

Ir al documento específico y verificar:
```javascript
{
  verified: true  // ← Debe ser booleano, no string
}
```

### 4. Test Manual con Postman:

```bash
POST https://tu-api.vercel.app/api/admin/recommendations

Headers:
Authorization: Bearer {token}
Content-Type: application/json

Body:
{
  "name": "Test Verificado",
  "categoryId": "cat123",
  "verified": true
}
```

---

## 💡 Notas Importantes

1. **La migración es segura**: No sobrescribe campos existentes, solo agrega los faltantes.

2. **Por defecto `verified: false`**: Todos los recomendados nuevos serán NO verificados a menos que lo marques explícitamente.

3. **Valores soportados**: 
   - Booleano: `true`, `false`
   - String: `"true"`, `"false"`, `"1"`, `"0"`
   - Número: `1`, `0`

4. **En producción**: Recuerda ejecutar la migración en el entorno de producción después de desplegar.

5. **Badge especial**: "Verificado por Munpa" debe destacarse visualmente (verde, con icono de verificado ✓).

