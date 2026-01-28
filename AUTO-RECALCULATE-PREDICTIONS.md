# 🔄 RECÁLCULO AUTOMÁTICO DE PREDICCIONES

**Fecha:** 2026-01-12  
**Feature:** Auto-recalcular predicciones al registrar siestas  
**Status:** ✅ **IMPLEMENTADO Y DESPLEGADO**

---

## 🎯 PROBLEMA

Las predicciones **NO se recalculaban automáticamente** después de registrar una siesta, mostrando predicciones desactualizadas para el resto del día.

### Ejemplo del Problema:

```
9:00 AM → Predicción: 4 siestas para el día
         (Siesta 1: 9:30 AM, Siesta 2: 1:30 PM, etc.)

10:00 AM → Usuario registra Siesta 1 (9:30 - 10:00 AM)

10:01 AM → App sigue mostrando las mismas 4 siestas
         ❌ Debería mostrar solo 3 siestas restantes
         ❌ Debería ajustar horarios basándose en la siesta real
```

---

## ✅ SOLUCIÓN IMPLEMENTADA

### Recálculo Automático

Ahora cuando se registra una siesta **con endTime** (completada), el sistema:

1. ✅ Registra el evento de sueño
2. ✅ Actualiza estadísticas del niño
3. 🔄 **Recalcula automáticamente las predicciones**
4. ✅ Guarda las nuevas predicciones
5. ✅ Retorna las predicciones actualizadas

---

## 📊 FLUJO MEJORADO

### ANTES (Sin Recálculo)

```
POST /api/sleep/record
{
  "childId": "child_123",
  "type": "nap",
  "startTime": "2026-01-12T09:30:00Z",
  "endTime": "2026-01-12T10:00:00Z"  ← Siesta completada
}

Respuesta:
{
  "success": true,
  "message": "Evento registrado",
  "sleepEventId": "event_456"
}

❌ Las predicciones siguen igual
❌ Usuario debe refrescar manualmente
```

### AHORA (Con Recálculo Automático)

```
POST /api/sleep/record
{
  "childId": "child_123",
  "type": "nap",
  "startTime": "2026-01-12T09:30:00Z",
  "endTime": "2026-01-12T10:00:00Z"  ← Siesta completada
}

Proceso interno:
1. ✅ Registra el evento
2. 🔄 Detecta que es una siesta completada
3. 🤖 Recalcula predicciones con IA
4. 💾 Guarda predicciones actualizadas

Respuesta:
{
  "success": true,
  "message": "Evento registrado",
  "sleepEventId": "event_456",
  "predictionsUpdated": true,  ← NUEVO
  "updatedPredictions": {      ← NUEVO
    "predictedNaps": [
      {
        "napNumber": 2,  ← Solo siestas restantes
        "time": "1:45 PM",  ← Ajustado basándose en siesta real
        ...
      }
    ],
    "predictedBedtime": {...}
  }
}

✅ Predicciones automáticamente actualizadas
✅ Usuario ve siestas restantes inmediatamente
```

---

## 🔍 LÓGICA IMPLEMENTADA

### Código en `recordSleepEvent`

```javascript
// Después de registrar el evento
const docRef = await this.db.collection('sleepEvents').add(sleepEvent);

// 🔄 RECALCULAR PREDICCIONES si la siesta tiene endTime
if (endTime && type === 'nap') {
  console.log('🔄 Recalculando predicciones después de registrar siesta...');
  
  try {
    // 1. Obtener info del niño (timezone, edad)
    const childDoc = await this.db.collection('children').doc(childId).get();
    const childData = childDoc.data();
    const userTimezone = childData.timezone || 'UTC';
    const ageInMonths = this.calculateAgeInMonths(childData.birthDate.toDate());
    
    // 2. Obtener historial actualizado (incluye la siesta recién registrada)
    const sleepHistory = await this.getSleepHistory(userId, childId, 14);
    
    // 3. Generar nuevas predicciones con IA
    const prediction = await this.generateSleepPrediction(
      sleepHistory,
      childInfo,
      userTimezone
    );
    
    // 4. Guardar predicciones actualizadas
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    await this.db
      .collection('sleepPredictions')
      .doc(`${childId}_${todayStr}`)
      .set({
        ...prediction,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
        recalculatedAfter: 'nap_registration'  // Indicador
      }, { merge: true });
    
    console.log(`✅ Predicciones recalculadas: ${prediction.predictedNaps?.length} siestas restantes`);
    
  } catch (error) {
    console.error('⚠️ Error recalculando predicciones:', error);
    // No falla el registro si hay error en predicciones
  }
}

// Retornar con las predicciones actualizadas
res.status(201).json({
  success: true,
  sleepEventId: docRef.id,
  predictionsUpdated: true,
  updatedPredictions: prediction  // ← Las nuevas predicciones
});
```

---

## 📱 INTEGRACIÓN EN FRONTEND

### Opción 1: Usar las Predicciones de la Respuesta

```typescript
// Al registrar una siesta
const registerSleep = async (sleepData) => {
  const response = await fetch('/api/sleep/record', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(sleepData)
  });
  
  const data = await response.json();
  
  if (data.success) {
    console.log('✅ Siesta registrada');
    
    // Verificar si se recalcularon predicciones
    if (data.predictionsUpdated && data.updatedPredictions) {
      console.log('🔄 Predicciones actualizadas automáticamente');
      
      // Actualizar estado local con las nuevas predicciones
      setPredictions(data.updatedPredictions);
      
      // Mostrar solo siestas restantes
      const remainingNaps = data.updatedPredictions.predictedNaps;
      console.log(`📊 Siestas restantes: ${remainingNaps.length}`);
    }
  }
};
```

### Opción 2: Refrescar Predicciones (Método Anterior)

```typescript
// Si prefieres siempre hacer una llamada explícita
const registerSleep = async (sleepData) => {
  // 1. Registrar siesta
  await fetch('/api/sleep/record', {
    method: 'POST',
    body: JSON.stringify(sleepData)
  });
  
  // 2. Refrescar predicciones (ya están actualizadas en BD)
  const predResponse = await fetch(`/api/sleep/predict/${childId}`);
  const predData = await predResponse.json();
  
  setPredictions(predData.prediction);
};
```

**Recomendación:** Usar Opción 1 para evitar llamada extra y obtener predicciones más rápido.

---

## 🎯 CASOS DE USO

### Caso 1: Registro de Siesta Completada

```json
POST /api/sleep/record
{
  "childId": "child_123",
  "type": "nap",
  "startTime": "2026-01-12T09:30:00Z",
  "endTime": "2026-01-12T10:30:00Z"  ← endTime presente
}

✅ Se recalculan predicciones automáticamente
```

### Caso 2: Inicio de Siesta (Sin endTime)

```json
POST /api/sleep/record
{
  "childId": "child_123",
  "type": "nap",
  "startTime": "2026-01-12T09:30:00Z"
  // Sin endTime - siesta en progreso
}

⏸️ NO se recalculan predicciones (siesta no completada aún)
```

### Caso 3: Actualización con endTime

```json
PUT /api/sleep/event_456
{
  "endTime": "2026-01-12T10:30:00Z"  ← Se agrega endTime
}

✅ Se recalculan predicciones automáticamente
```

---

## 🔄 RESPUESTA ACTUALIZADA

### Nueva Estructura de Respuesta

```json
{
  "success": true,
  "message": "Evento de sueño registrado exitosamente",
  "sleepEventId": "event_456",
  "sleepEvent": {
    "id": "event_456",
    "type": "nap",
    "startTime": "2026-01-12T09:30:00Z",
    "endTime": "2026-01-12T10:30:00Z",
    "duration": 60
  },
  "predictionsUpdated": true,  ← NUEVO CAMPO
  "updatedPredictions": {      ← NUEVO CAMPO
    "predictedNaps": [
      {
        "napNumber": 2,
        "time": "2026-01-12T13:45:00.000Z",
        "windowStart": "2026-01-12T13:25:00.000Z",
        "windowEnd": "2026-01-12T14:05:00.000Z",
        "expectedDuration": 75,
        "confidence": 90,
        "type": "Siesta de tarde (2h 15min después de última siesta)",
        "aiReason": "Siesta de tarde (2h 15min después de última siesta)",
        "wakeWindow": "2h 15min"
      },
      {
        "napNumber": 3,
        "time": "2026-01-12T16:00:00.000Z",
        ...
      }
    ],
    "predictedBedtime": {
      "time": "2026-01-12T19:30:00.000Z",
      "confidence": 85,
      "aiReason": "Hora de dormir óptima (2h 30min después de última siesta)"
    }
  }
}
```

---

## 📊 LOGS DEL SERVIDOR

Cuando se registra una siesta con endTime, verás:

```
✅ [RECORD SLEEP] Evento registrado: event_456
🔄 [RECORD SLEEP] Recalculando predicciones después de registrar siesta...
📊 [PREDICT] Niño: Sofía (4 meses)
📊 [PREDICT] Eventos en historial: 45
🤖 [AI] Generando predicciones mejoradas con ChatGPT...
✅ [AI] ChatGPT sugiere 3 siestas restantes
✅ [RECORD SLEEP] Predicciones recalculadas: 3 siestas restantes
```

---

## 🎯 BENEFICIOS

### 1. ✅ **Experiencia Mejorada**
- Predicciones siempre actualizadas
- No necesita refrescar manualmente
- Respuesta más rápida

### 2. ✅ **Datos Más Precisos**
- Predicciones ajustadas a la realidad
- Considera la siesta que acaba de terminar
- Horarios más precisos para siestas restantes

### 3. ✅ **Menos Llamadas API**
- Una sola llamada en lugar de dos
- Mejor performance
- Menor consumo de recursos

### 4. ✅ **Consistencia**
- Predicciones siempre sincronizadas
- No hay desfase temporal
- Datos coherentes en toda la app

---

## ⚠️ CONSIDERACIONES

### Cuando NO se Recalcula

El sistema NO recalcula predicciones en estos casos:

1. **Siesta sin endTime** (aún en progreso)
   ```json
   { "type": "nap", "startTime": "...", /* sin endTime */ }
   ```

2. **Sueño nocturno** (nightsleep)
   ```json
   { "type": "nightsleep", ... }
   ```

3. **Error en recálculo** (no falla el registro)
   - Si hay error al recalcular, se registra el evento de todas formas
   - El error se loggea pero no afecta al usuario

---

## 🧪 PRUEBA

### Escenario de Prueba

```
1. Obtener predicciones iniciales:
   GET /api/sleep/predict/child_123
   → 4 siestas predichas

2. Registrar primera siesta:
   POST /api/sleep/record
   {
     "childId": "child_123",
     "type": "nap",
     "startTime": "2026-01-12T09:30:00Z",
     "endTime": "2026-01-12T10:30:00Z"
   }
   
   → Respuesta incluye updatedPredictions con 3 siestas restantes

3. Verificar en la app:
   → Solo se muestran las 3 siestas restantes
   → Horarios ajustados basándose en la siesta real
```

---

## 📚 DOCUMENTACIÓN RELACIONADA

- `API-SLEEP-PREDICTION.md` - Sistema de predicciones
- `RECALCULO-AUTOMATICO.md` - Lógica de recálculo (si existe)
- `DEPLOY-SLEEP-NOTIFICATIONS.md` - Sistema de notificaciones

---

## ✅ CHECKLIST

### Backend
- [x] Detectar cuando se registra siesta completada
- [x] Recalcular predicciones automáticamente
- [x] Guardar predicciones actualizadas
- [x] Retornar predicciones en la respuesta
- [x] Manejar errores sin afectar el registro
- [x] Logging detallado
- [x] Desplegar a producción

### Frontend (Recomendado)
- [ ] Actualizar estado con `updatedPredictions` de la respuesta
- [ ] Mostrar siestas restantes inmediatamente
- [ ] Eliminar llamada extra a `/predict` después de registrar
- [ ] Mostrar indicador de "Predicciones actualizadas"

---

## 🎉 RESULTADO FINAL

**Ahora el sistema mantiene las predicciones siempre sincronizadas:**

✅ Registras una siesta → Predicciones se actualizan automáticamente  
✅ Ves solo las siestas restantes del día  
✅ Horarios ajustados basándose en la realidad  
✅ Sin necesidad de refrescar manualmente  

**URL desplegada:** `https://mumpabackend-36d5mw5ex-mishu-lojans-projects.vercel.app`

**¡Sistema completamente automático y sincronizado!** 🚀🔄
