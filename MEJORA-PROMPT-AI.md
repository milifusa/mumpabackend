# 🤖 MEJORA DEL PROMPT DE CHATGPT

## 📝 CAMBIOS NECESARIOS

Usuario solicitó: "debe incluir las predicciones tambien. y debe devolver la hora en el utc de la persona"

---

## ✅ MEJORAS A IMPLEMENTAR

### 1️⃣ Incluir Predicciones Previas en el Prompt

**Cambio en firma:**
```javascript
// ANTES:
async enhancePredictionsWithAI(childInfo, currentNaps, wakeTime, userTimezone)

// DESPUÉS:
async enhancePredictionsWithAI(childInfo, completedNaps, predictedNaps, wakeTime, userTimezone)
```

**Prompt mejorado:**
```
SIESTAS COMPLETADAS HOY (2):
  ✅ Siesta 1: 9:00 AM - 10:30 AM (90 min)
  ✅ Siesta 2: 12:00 PM - 1:30 PM (90 min)

PREDICCIONES ESTADÍSTICAS PREVIAS (2):
  📊 Siesta 3: 3:00 PM (60 min) - afternoon nap
  📊 Siesta 4: 6:00 PM (30 min) - evening catnap

PREGUNTA:
¿Son correctas estas predicciones o deberían ajustarse basándote en:
- Patrones reales de bebés de 4 meses
- Las 2 siestas ya completadas hoy
- La hora actual (2:30 PM)
```

### 2️⃣ Especificar Timezone Claramente

**Agregar al prompt:**
```
- Timezone del usuario: UTC-6 (América/México)
- Todas las horas deben devolverse en formato 24h LOCAL
- Ejemplo: Si son las 8 PM local, responde "20:00"
```

### 3️⃣ Validación de Respuesta

**ChatGPT debe devolver horas en formato 24h LOCAL:**
```json
{
  "remainingNaps": [
    {
      "napNumber": 3,
      "time": "15:00",  // ✅ 3 PM en hora LOCAL (no UTC)
      "duration": 60
    }
  ],
  "bedtime": {
    "time": "20:00"  // ✅ 8 PM en hora LOCAL (no UTC)
  }
}
```

---

## 🔧 IMPLEMENTACIÓN

### Archivo: `controllers/sleepPredictionController.js`

#### Cambio 1: Actualizar firma y llamada

```javascript
// Línea ~56 - Actualizar función
async enhancePredictionsWithAI(childInfo, completedNaps, predictedNaps, wakeTime, userTimezone) {
  // ...
  const timezoneOffset = TimezoneHelper.getTimezoneOffset(userTimezone);
  
  const prompt = `
INFORMACIÓN DEL BEBÉ:
- Edad: ${childInfo.ageInMonths} meses
- Timezone: UTC${timezoneOffset >= 0 ? '+' : ''}${timezoneOffset}
- Hora actual: ${localTime.toLocaleString('es-MX')}

SIESTAS COMPLETADAS HOY (${completedNaps.length}):
${completedNaps.map((nap, i) => {
  const start = TimezoneHelper.utcToUserTime(new Date(nap.startTime), userTimezone);
  const end = nap.endTime ? TimezoneHelper.utcToUserTime(new Date(nap.endTime), userTimezone) : null;
  return `  ✅ Siesta ${i + 1}: ${start.toLocaleTimeString()} - ${end?.toLocaleTimeString()} (${nap.duration} min)`;
}).join('\n')}

PREDICCIONES ESTADÍSTICAS PREVIAS (${predictedNaps.length}):
${predictedNaps.map(nap => {
  const napTime = TimezoneHelper.utcToUserTime(new Date(nap.time), userTimezone);
  return `  📊 Siesta ${nap.napNumber}: ${napTime.toLocaleTimeString()} (${nap.expectedDuration} min)`;
}).join('\n')}

PREGUNTA:
Basándote en patrones REALES de bebés de ${childInfo.ageInMonths} meses:
1. ¿Las predicciones estadísticas son correctas o necesitan ajuste?
2. ¿Qué siestas FALTAN hoy (después de las ${currentHour.toFixed(0)}h)?
3. ¿A qué HORA LOCAL deberían ser?
4. ¿Cuál debería ser la HORA LOCAL de dormir?

IMPORTANTE:
- Timezone: UTC${timezoneOffset >= 0 ? '+' : ''}${timezoneOffset}
- Devuelve TODAS las horas en formato 24h LOCAL (ej: "15:30")
- Considera AMBOS: siestas completadas Y predicciones previas
- Ajusta predicciones si es necesario

FORMATO RESPUESTA:
{
  "remainingNaps": [
    {"napNumber": 3, "time": "15:00", "duration": 60, "reason": "..."}
  ],
  "bedtime": {"time": "20:00", "reason": "..."},
  "confidence": 85
}
`;
}
```

#### Cambio 2: Actualizar llamada en predictDailyNapsFromWakeTime

```javascript
// Línea ~1125 - Actualizar llamada
const aiPrediction = await this.enhancePredictionsWithAI(
  { ageInMonths, name: 'Bebé' },
  napsOfDay,  // Siestas completadas
  [],  // TODO: pasar predicciones previas si existen
  wakeTime,
  userTimezone
);
```

---

## 🎯 RESULTADO ESPERADO

### Entrada a ChatGPT:
```
INFORMACIÓN DEL BEBÉ:
- Edad: 4 meses
- Timezone: UTC-6
- Hora actual: 2:30 PM

SIESTAS COMPLETADAS HOY (2):
  ✅ Siesta 1: 9:00 AM - 10:30 AM (90 min)
  ✅ Siesta 2: 12:00 PM - 1:30 PM (90 min)

PREDICCIONES ESTADÍSTICAS PREVIAS (2):
  📊 Siesta 3: 3:00 PM (60 min) - afternoon
  📊 Siesta 4: 6:00 PM (30 min) - evening

¿Son correctas o necesitan ajuste?
```

### Salida de ChatGPT:
```json
{
  "remainingNaps": [
    {
      "napNumber": 3,
      "time": "15:30",  // 3:30 PM LOCAL (ajustado de 3 PM)
      "duration": 45,   // Ajustado de 60 min
      "reason": "Siesta de tarde, ajustada 30 min después por ventana de vigilia"
    },
    {
      "napNumber": 4,
      "time": "18:00",  // 6:00 PM LOCAL
      "duration": 30,
      "reason": "Catnap vespertino antes de dormir"
    }
  ],
  "bedtime": {
    "time": "20:30",  // 8:30 PM LOCAL
    "reason": "2.5h después de última siesta"
  },
  "confidence": 88,
  "explanation": "Las predicciones estadísticas eran buenas, solo ajusté la siesta 3 ligeramente..."
}
```

---

## 📊 VENTAJAS

1. ✅ **ChatGPT ve el contexto completo**
   - Siestas ya completadas
   - Predicciones estadísticas previas
   - Puede ajustar o validar

2. ✅ **Horas en timezone del usuario**
   - Input: Todas las horas en hora LOCAL
   - Output: Todas las horas en hora LOCAL
   - Sin confusión de UTC

3. ✅ **Mejor precisión**
   - Puede comparar con predicciones previas
   - Puede ajustar si algo no tiene sentido
   - Aprende de los datos reales del día

---

## 🚀 PRÓXIMOS PASOS

1. Actualizar `enhancePredictionsWithAI()` con nueva firma
2. Pasar `predictedNaps` desde `predictDailyNapsFromWakeTime()`
3. Mejorar prompt con timezone explícito
4. Agregar validación de formato de respuesta
5. Deploy y probar

---

**Fecha:** 2026-01-09  
**Sistema:** Predicción de Sueño con ChatGPT  
**Versión:** 3.0 (con predicciones previas)

