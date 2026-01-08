# 🔄 RECÁLCULO AUTOMÁTICO DE PREDICCIONES

## ❗ PROBLEMA IDENTIFICADO

**Usuario reporta:** "No se están recalculando las horas de dormir ni las siguientes siestas en base a lo que se ingresa"

**Causa:** El sistema de predicción NO se actualiza automáticamente. El frontend debe solicitar nuevas predicciones después de cada cambio.

---

## ✅ SOLUCIÓN: Cuándo Solicitar Nuevas Predicciones

El **FRONTEND** debe llamar a `/api/sleep/predict/:childId` en estos momentos:

### 1️⃣ **Después de Registrar Hora de Despertar**
```javascript
// POST /api/sleep/wake-time
const response = await registerWakeTime(childId, wakeTime);

// ✅ INMEDIATAMENTE después:
const predictions = await fetchSleepPredictions(childId);
updateUI(predictions);
```

**Por qué:** La hora de despertar es la BASE para calcular todas las siestas del día.

---

### 2️⃣ **Después de Terminar una Siesta**
```javascript
// PATCH /api/sleepEvents/:eventId (agregar endTime)
const response = await endNap(eventId, endTime);

// ✅ INMEDIATAMENTE después:
const predictions = await fetchSleepPredictions(childId);
updateUI(predictions);
```

**Por qué:** Al terminar una siesta, el sistema debe recalcular:
- Las siestas restantes del día
- La hora de dormir (basada en la última siesta)

---

### 3️⃣ **Después de Editar una Siesta**
```javascript
// PATCH /api/sleepEvents/:eventId
const response = await editNap(eventId, {startTime, endTime, pauses});

// ✅ INMEDIATAMENTE después:
const predictions = await fetchSleepPredictions(childId);
updateUI(predictions);
```

**Por qué:** Si cambias la hora de inicio/fin, afecta las predicciones siguientes.

---

### 4️⃣ **Después de Eliminar una Siesta**
```javascript
// DELETE /api/sleepEvents/:eventId
const response = await deleteNap(eventId);

// ✅ INMEDIATAMENTE después:
const predictions = await fetchSleepPredictions(childId);
updateUI(predictions);
```

**Por qué:** Al eliminar una siesta, el sistema debe recalcular el día completo.

---

### 5️⃣ **Al Cargar la Pantalla Principal**
```javascript
useEffect(() => {
  const loadData = async () => {
    const predictions = await fetchSleepPredictions(childId);
    updateUI(predictions);
  };
  
  loadData();
}, [childId]);
```

**Por qué:** Para mostrar las predicciones actualizadas al usuario.

---

### 6️⃣ **Periódicamente (Cada 5-10 minutos)**
```javascript
useEffect(() => {
  // Actualizar predicciones cada 5 minutos
  const interval = setInterval(async () => {
    const predictions = await fetchSleepPredictions(childId);
    updateUI(predictions);
  }, 5 * 60 * 1000); // 5 minutos

  return () => clearInterval(interval);
}, [childId]);
```

**Por qué:** Para que las predicciones "se muevan" a medida que pasa el tiempo.

---

## 🎯 EJEMPLO COMPLETO: Flujo de Registro de Siesta

```javascript
// components/NapTracking.js

const handleEndNap = async (eventId) => {
  try {
    // 1. Terminar la siesta
    console.log('🛌 Terminando siesta...');
    await api.patch(`/api/sleepEvents/${eventId}`, {
      endTime: new Date().toISOString()
    });
    
    console.log('✅ Siesta terminada');
    
    // 2. ✅ RECALCULAR PREDICCIONES INMEDIATAMENTE
    console.log('🔄 Solicitando nuevas predicciones...');
    const response = await api.get(`/api/sleep/predict/${childId}`, {
      headers: {
        'x-timezone': Localization.timezone
      }
    });
    
    const { prediction } = response.data;
    
    // 3. Actualizar UI con nuevas predicciones
    console.log('✅ Nuevas predicciones recibidas:');
    console.log(`   - Siestas restantes: ${prediction.dailySchedule.remaining}`);
    console.log(`   - Hora de dormir: ${prediction.bedtime.time}`);
    
    setPredictions(prediction);
    
    // 4. Mostrar notificación
    showSuccessMessage('Siesta registrada. Predicciones actualizadas.');
    
  } catch (error) {
    console.error('❌ Error:', error);
    showErrorMessage('Error al actualizar predicciones');
  }
};
```

---

## 🚀 IMPLEMENTACIÓN RECOMENDADA

### **Opción 1: Hook Personalizado (Recomendado)**

Crear un hook que automáticamente recalcule después de cada acción:

```javascript
// hooks/useSleepPredictions.js

export const useSleepPredictions = (childId) => {
  const [predictions, setPredictions] = useState(null);
  const [loading, setLoading] = useState(false);

  // Función para refrescar predicciones
  const refreshPredictions = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/api/sleep/predict/${childId}`, {
        headers: {
          'x-timezone': Localization.timezone
        }
      });
      setPredictions(response.data.prediction);
    } catch (error) {
      console.error('Error refreshing predictions:', error);
    } finally {
      setLoading(false);
    }
  };

  // Función wrapper para acciones que requieren recálculo
  const withRefresh = (action) => async (...args) => {
    await action(...args);
    await refreshPredictions();
  };

  // Cargar inicialmente
  useEffect(() => {
    refreshPredictions();
  }, [childId]);

  return {
    predictions,
    loading,
    refreshPredictions,
    withRefresh
  };
};
```

**Uso:**

```javascript
// En tu componente
const { predictions, refreshPredictions, withRefresh } = useSleepPredictions(childId);

// Envolver acciones
const endNap = withRefresh(async (eventId) => {
  await api.patch(`/api/sleepEvents/${eventId}`, {
    endTime: new Date().toISOString()
  });
});

// Cuando terminas siesta:
await endNap(eventId); // ✅ Automáticamente refresca predicciones
```

---

### **Opción 2: Context API**

```javascript
// context/SleepPredictionContext.js

export const SleepPredictionProvider = ({ childId, children }) => {
  const [predictions, setPredictions] = useState(null);

  const refreshPredictions = async () => {
    const response = await api.get(`/api/sleep/predict/${childId}`);
    setPredictions(response.data.prediction);
  };

  return (
    <SleepContext.Provider value={{ predictions, refreshPredictions }}>
      {children}
    </SleepContext.Provider>
  );
};
```

**Uso:**

```javascript
const { refreshPredictions } = useSleepContext();

// Después de cualquier acción:
await endNap(eventId);
await refreshPredictions(); // ✅ Refrescar
```

---

## 📊 QUÉ DEVUELVE `/api/sleep/predict/:childId`

```json
{
  "success": true,
  "prediction": {
    "dailySchedule": {
      "allNaps": [
        {
          "napNumber": 1,
          "time": "2026-01-09T15:00:00.000Z",
          "status": "completed"  // Ya hecha
        },
        {
          "napNumber": 2,
          "time": "2026-01-09T18:00:00.000Z",
          "status": "upcoming",  // ✅ Predicción
          "confidence": 85,
          "basedOn": "chatgpt-enhanced"
        },
        {
          "napNumber": 3,
          "time": "2026-01-09T23:00:00.000Z",
          "status": "upcoming",  // ✅ Predicción
          "confidence": 85
        }
      ],
      "completed": 1,
      "remaining": 2,
      "progress": {
        "percentage": 33
      }
    },
    "bedtime": {
      "time": "2026-01-10T02:07:00.000Z",  // ✅ Basado en última siesta
      "confidence": 75,
      "reason": "Última siesta hoy: 9:22 PM + 2.75h"
    }
  }
}
```

---

## ⚠️ IMPORTANTE

### **NO hacer esto:**
```javascript
// ❌ MAL: No refrescar después de acciones
await endNap(eventId);
// Usuario ve predicciones viejas
```

### **SÍ hacer esto:**
```javascript
// ✅ BIEN: Refrescar después de acciones
await endNap(eventId);
await refreshPredictions();
// Usuario ve predicciones actualizadas
```

---

## 🎉 RESULTADO

Con esta implementación:

✅ **Predicciones siempre actualizadas** - Después de cada acción  
✅ **Hora de dormir dinámica** - Se ajusta con cada siesta  
✅ **Siestas restantes correctas** - Basadas en lo ya registrado  
✅ **Experiencia fluida** - Usuario ve cambios inmediatos  

---

## 🧪 CÓMO PROBAR

1. **Registra hora de despertar** → Verifica que aparezcan 4 siestas predichas
2. **Termina siesta #1** → Verifica que ahora solo muestre 3 siestas restantes
3. **Termina siesta #2** → Verifica que ahora solo muestre 2 siestas restantes
4. **Verifica hora de dormir** → Debe cambiar después de cada siesta

---

## 📝 CHECKLIST DE IMPLEMENTACIÓN

- [ ] Agregar `refreshPredictions()` después de `registerWakeTime()`
- [ ] Agregar `refreshPredictions()` después de `endNap()`
- [ ] Agregar `refreshPredictions()` después de `editNap()`
- [ ] Agregar `refreshPredictions()` después de `deleteNap()`
- [ ] Agregar `refreshPredictions()` en `useEffect` al cargar componente
- [ ] (Opcional) Agregar refresh periódico cada 5 minutos
- [ ] Verificar que `x-timezone` header se envíe en todas las llamadas

---

**Fecha:** 2026-01-08  
**Versión:** 1.0  
**Sistema:** Predicción de Sueño con IA

