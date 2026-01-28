# 💾 GUARDAR PREDICCIONES EN FIRESTORE

**Fecha:** 2026-01-13  
**Feature:** Guardar predicciones automáticamente en Firestore  
**Status:** ✅ **IMPLEMENTADO Y DESPLEGADO**

---

## 🎯 PROBLEMA

El sistema de notificaciones no funcionaba porque:

```
❌ Predicciones se generaban en memoria
❌ Se enviaban al frontend
❌ NO se guardaban en Firestore
❌ Sistema de notificaciones buscaba en Firestore → no encontraba nada
```

**Error en logs:**
```
⏰ [SLEEP-NOTIF] Pre-nap: No hay predicciones para hoy
💤 [SLEEP-NOTIF] Nap-time: No hay predicciones para hoy
```

---

## ✅ SOLUCIÓN IMPLEMENTADA

### Guardado Automático en Firestore

Ahora, cada vez que se generan predicciones (endpoint `/api/sleep/predict/:childId`), se guardan automáticamente en Firestore:

```javascript
// Después de generar predicciones
const prediction = await this.generateSleepPrediction(...);

// 💾 GUARDAR EN FIRESTORE
const todayStr = format(new Date(), 'yyyy-MM-dd');
const predictionDocId = `${childId}_${todayStr}`;

// Filtrar solo las siestas predichas (upcoming)
const predictedNaps = prediction.dailySchedule?.allNaps
  ?.filter(nap => nap.status === 'upcoming')
  .map(nap => ({
    napNumber: nap.napNumber,
    time: nap.time,
    windowStart: nap.windowStart,
    windowEnd: nap.windowEnd,
    expectedDuration: nap.expectedDuration,
    confidence: nap.confidence,
    type: nap.type || nap.aiReason,
    aiReason: nap.aiReason,
    wakeWindow: nap.wakeWindow
  })) || [];

const predictionData = {
  childId: childId,
  userId: userId,
  date: todayStr,
  predictedNaps: predictedNaps,
  predictedBedtime: prediction.bedtime ? {
    time: prediction.bedtime.time,
    confidence: prediction.bedtime.confidence,
    reason: prediction.bedtime.reason
  } : null,
  totalExpected: prediction.dailySchedule?.totalExpected,
  completed: prediction.dailySchedule?.completed || 0,
  remaining: predictedNaps.length,
  confidence: prediction.confidence,
  createdAt: admin.firestore.FieldValue.serverTimestamp(),
  lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
  timezone: userTimezone
};

await db.collection('sleepPredictions')
  .doc(predictionDocId)
  .set(predictionData, { merge: true });

console.log(`💾 [PREDICT] Predicciones guardadas: ${predictionDocId}`);
console.log(`💾 [PREDICT] Siestas predichas: ${predictedNaps.length}`);
```

---

## 📊 ESTRUCTURA EN FIRESTORE

### Colección: `sleepPredictions`

**Document ID:** `{childId}_{date}`  
Ejemplo: `K6vfrjDYcwAp8cDgH9sh_2026-01-13`

**Campos:**

```javascript
{
  childId: "K6vfrjDYcwAp8cDgH9sh",
  userId: "1K2EUDRsAbZvopHDQRXjpaBG9wZ2",
  date: "2026-01-13",
  timezone: "America/Mexico_City",
  
  predictedNaps: [
    {
      napNumber: 3,
      time: "2026-01-13T16:42:00.000Z",
      windowStart: "2026-01-13T16:22:00.000Z",
      windowEnd: "2026-01-13T17:02:00.000Z",
      expectedDuration: 60,
      confidence: 85,
      type: "Siesta de tarde (2h después de última siesta)",
      aiReason: "Siesta de tarde (2h después de última siesta)",
      wakeWindow: "2h"
    }
  ],
  
  predictedBedtime: {
    time: "2026-01-14T01:30:00.000Z",
    confidence: 85,
    reason: "2h después de última siesta"
  },
  
  totalExpected: 3,
  completed: 2,
  remaining: 1,
  confidence: 85,
  
  createdAt: Timestamp,
  lastUpdated: Timestamp
}
```

---

## 🔔 INTEGRACIÓN CON NOTIFICACIONES

### Antes (No funcionaba):

```javascript
// Sistema de notificaciones
const predictionsDoc = await db
  .collection('sleepPredictions')
  .doc(`${childId}_${todayStr}`)
  .get();

if (!predictionsDoc.exists) {
  return res.status(404).json({
    error: 'No hay predicciones para hoy'  // ❌ Siempre llegaba aquí
  });
}
```

### Ahora (Funciona):

```javascript
// 1. Frontend llama a predict
GET /api/sleep/predict/:childId
→ Genera predicciones
→ Guarda en Firestore ✅
→ Retorna al frontend

// 2. Frontend programa notificaciones
POST /api/sleep/notifications/pre-nap/:childId
→ Busca en Firestore
→ Encuentra las predicciones ✅
→ Programa notificaciones ✅
```

---

## 🎯 FLUJO COMPLETO

### 1. Obtener Predicciones

```javascript
// Frontend
const response = await api.get(`/sleep/predict/${childId}`);

// Backend
→ Genera predicciones con ChatGPT
→ Guarda en Firestore (sleepPredictions/childId_2026-01-13)
→ Retorna al frontend
```

### 2. Programar Notificaciones

```javascript
// Frontend
await api.post(`/sleep/notifications/pre-nap/${childId}`);
await api.post(`/sleep/notifications/nap-time/${childId}`);

// Backend
→ Lee de Firestore (sleepPredictions/childId_2026-01-13)
→ Encuentra las predicciones ✅
→ Programa notificaciones ✅
```

### 3. Recálculo Automático

```javascript
// Al registrar una siesta
POST /api/sleep/record
{
  "type": "nap",
  "startTime": "...",
  "endTime": "..."
}

// Backend
→ Registra la siesta
→ Recalcula predicciones automáticamente
→ Guarda nuevas predicciones en Firestore ✅
→ Notificaciones se actualizan automáticamente
```

---

## 📋 CAMPOS GUARDADOS

### `predictedNaps` (Array)

Cada siesta predicha contiene:

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `napNumber` | Number | Número de siesta (1, 2, 3, 4) |
| `time` | ISO String | Hora predicha (UTC) |
| `windowStart` | ISO String | Inicio de ventana (time - 20 min) |
| `windowEnd` | ISO String | Fin de ventana (time + 20 min) |
| `expectedDuration` | Number | Duración esperada (minutos) |
| `confidence` | Number | Confianza (0-100) |
| `type` | String | Tipo de siesta |
| `aiReason` | String | Razón de ChatGPT |
| `wakeWindow` | String | Ventana de vigilia (ej: "2h") |

### `predictedBedtime` (Object)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `time` | ISO String | Hora de dormir (UTC) |
| `confidence` | Number | Confianza (0-100) |
| `reason` | String | Razón |

### Metadata

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `totalExpected` | Number | Total de siestas esperadas |
| `completed` | Number | Siestas completadas |
| `remaining` | Number | Siestas restantes |
| `confidence` | Number | Confianza general |
| `timezone` | String | Timezone del usuario |
| `createdAt` | Timestamp | Fecha de creación |
| `lastUpdated` | Timestamp | Última actualización |

---

## 🔄 ACTUALIZACIÓN AUTOMÁTICA

Las predicciones se actualizan automáticamente cuando:

1. **Primera vez del día:** Usuario obtiene predicciones
2. **Al registrar siesta:** Sistema recalcula y guarda nuevamente
3. **Al registrar despertar:** Sistema recalcula todo el día

Gracias al `merge: true`, los datos se actualizan sin perder información previa.

---

## ⚠️ MANEJO DE ERRORES

Si falla el guardado en Firestore:

```javascript
try {
  await db.collection('sleepPredictions').doc(predictionDocId).set(...);
  console.log(`💾 [PREDICT] Predicciones guardadas`);
} catch (saveError) {
  console.error('⚠️ [PREDICT] Error guardando:', saveError);
  // ✅ NO falla la petición - predicciones se retornan de todas formas
}
```

**Beneficio:** Si Firestore falla, el usuario sigue recibiendo las predicciones en el frontend.

---

## 🎯 EJEMPLO COMPLETO

### Escenario: Usuario abre la app

```
1. App llama: GET /api/sleep/predict/child_123
   
2. Backend:
   ✅ Genera predicciones con ChatGPT
   ✅ Guarda en: sleepPredictions/child_123_2026-01-13
   ✅ Retorna predicciones al frontend
   
   Logs:
   💾 [PREDICT] Predicciones guardadas: child_123_2026-01-13
   💾 [PREDICT] Siestas predichas guardadas: 1

3. App programa notificaciones:
   POST /api/sleep/notifications/pre-nap/child_123
   POST /api/sleep/notifications/nap-time/child_123
   
4. Backend notificaciones:
   ✅ Lee de: sleepPredictions/child_123_2026-01-13
   ✅ Encuentra 1 siesta
   ✅ Programa notificaciones:
      - 4:12 PM: "Prepara al bebé para la siesta"
      - 4:42 PM: "Es hora de dormir al bebé"

5. Usuario registra siesta:
   POST /api/sleep/record
   
6. Backend:
   ✅ Registra siesta
   ✅ Recalcula predicciones
   ✅ Actualiza: sleepPredictions/child_123_2026-01-13
   ✅ Ahora remaining: 0 (todas completadas)
```

---

## 📚 VENTAJAS

### 1. ✅ **Notificaciones Funcionan**
- Sistema de notificaciones puede leer las predicciones
- Ya no devuelve "No hay predicciones para hoy"

### 2. ✅ **Persistencia**
- Predicciones se guardan en BD
- Disponibles para otros servicios
- Historial de predicciones

### 3. ✅ **Sincronización Automática**
- Recálculo automático actualiza Firestore
- Notificaciones siempre usan datos actuales

### 4. ✅ **Resiliencia**
- Si falla el guardado, predicciones se retornan igual
- No afecta la experiencia del usuario

### 5. ✅ **Auditoría**
- `createdAt` y `lastUpdated` permiten tracking
- Se puede ver cuándo se generaron/actualizaron

---

## 🔍 DEBUGGING

### Ver predicciones en Firestore:

```javascript
// Firestore Console
Collection: sleepPredictions
Document: {childId}_{date}

// O con código
const doc = await db
  .collection('sleepPredictions')
  .doc('child_123_2026-01-13')
  .get();

console.log(doc.data());
```

### Logs del servidor:

```
💾 [PREDICT] Predicciones guardadas en Firestore: child_123_2026-01-13
💾 [PREDICT] Siestas predichas guardadas: 1
```

---

## ✅ CHECKLIST

- [x] Agregar guardado automático después de generar predicciones
- [x] Filtrar solo siestas `upcoming` (no completadas)
- [x] Incluir todos los campos necesarios para notificaciones
- [x] Usar `merge: true` para no perder datos
- [x] Manejar errores sin afectar respuesta al usuario
- [x] Agregar logging detallado
- [x] Desplegar a producción
- [x] Verificar que notificaciones funcionan

---

## 🎉 RESULTADO FINAL

**Ahora el sistema está completamente integrado:**

✅ Predicciones se generan con ChatGPT  
✅ Se guardan automáticamente en Firestore  
✅ Sistema de notificaciones las encuentra  
✅ Notificaciones se programan correctamente  
✅ Recálculo automático actualiza todo  

**URL desplegada:** `https://mumpabackend-21p95o7tc-mishu-lojans-projects.vercel.app`

**¡Sistema de predicciones + notificaciones completamente funcional!** 🎯💾🔔
