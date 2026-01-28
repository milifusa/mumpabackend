# 🎯 PREDICCIONES DINÁMICAS BASADAS EN HORA DE DESPERTAR

**Fecha:** 2026-01-13  
**Feature:** Cálculo dinámico de número de siestas según hora de despertar real  
**Status:** ✅ **IMPLEMENTADO Y DESPLEGADO**

---

## 🎯 PROBLEMA REPORTADO

El sistema estaba prediciendo **siempre el máximo de siestas** (4 siestas para un bebé de 4 meses) sin considerar la hora de despertar real:

### Ejemplo del Usuario:

```
👶 Bebé de 4 meses
🕐 Hora de despertar normal: 6:30 AM → 4 siestas ✅
🕐 Hora de despertar HOY: 8:00 AM → 4 siestas ❌ (debería ser 3)

Problema:
- Despertó 1.5 horas MÁS TARDE de lo normal
- No hay tiempo suficiente para 4 siestas
- Sistema sigue recomendando 4 siestas
- Usuario: "debe tener en cuenta la hora de despertar"
```

---

## ❌ LÓGICA ANTERIOR (INCORRECTA)

### Código Anterior:

```javascript
// Siempre forzaba el máximo de siestas por edad
const expectedNaps = this.getExpectedNapsPerDay(childInfo.ageInMonths);
// Para 4 meses: { min: 3, max: 4 }

const prompt = `
1. Este bebé DEBE tener ${expectedNaps.max} siestas HOY  ❌
2. Ya completó ${currentNaps.length} siestas
3. DEBE predecir EXACTAMENTE ${expectedNaps.max - currentNaps.length} siestas MÁS  ❌
`;

// Resultado: SIEMPRE predecía 4 siestas, sin importar hora de despertar
```

### Ejemplo Real:

```
Despertó: 8:00 AM
Bedtime objetivo: 7:30 PM (19:30)
Tiempo disponible: 11.5 horas

Ventana de vigilia: 2 horas
Duración promedio de siesta: 1.25 horas
Ciclo completo: 2 + 1.25 = 3.25 horas

Siestas que caben: 11.5 / 3.25 = 3.5 siestas ≈ 3 siestas

❌ Sistema predicía: 4 siestas (imposible de lograr)
```

---

## ✅ SOLUCIÓN IMPLEMENTADA

### Cálculo Dinámico de Siestas

El sistema ahora calcula **cuántas siestas caben realmente** basándose en:

1. **Hora de despertar real** (no promedio histórico)
2. **Hora de dormir óptima** para la edad
3. **Ventanas de vigilia** recomendadas
4. **Duración promedio de siestas**

### Nuevo Código:

```javascript
// 🔄 CALCULAR CUÁNTAS SIESTAS CABEN REALMENTE
const wakeTimeLocal = TimezoneHelper.utcToUserTime(new Date(wakeTime), userTimezone);
const wakeHour = wakeTimeLocal.getHours() + wakeTimeLocal.getMinutes() / 60;

// Hora de dormir óptima según edad
let optimalBedtime;
if (childInfo.ageInMonths <= 6) {
  optimalBedtime = 19.5; // 7:30 PM para 4-6 meses
} else if (childInfo.ageInMonths <= 12) {
  optimalBedtime = 20; // 8:00 PM para 7-12 meses
} else {
  optimalBedtime = 20.5; // 8:30 PM para 12+ meses
}

// Calcular horas disponibles
const hoursUntilBedtime = optimalBedtime - wakeHour;

// Calcular cuántas siestas caben
const avgNapDuration = childInfo.ageInMonths <= 6 ? 1.25 : 1.5; // horas
const cycleTime = wakeWindows.optimal + avgNapDuration;
const theoreticalNaps = Math.floor(hoursUntilBedtime / cycleTime);

// Ajustar al rango esperado por edad
const realisticNapCount = Math.min(
  Math.max(theoreticalNaps, expectedNaps.min),
  expectedNaps.max
);

console.log(`✅ Siestas que caben REALMENTE: ${realisticNapCount}`);
```

---

## 📊 EJEMPLOS DE CÁLCULO

### Ejemplo 1: Despertar Normal (6:30 AM)

```
Edad: 4 meses
Despertó: 6:30 AM (6.5h)
Bedtime: 7:30 PM (19.5h)
Tiempo disponible: 19.5 - 6.5 = 13 horas

Ventana de vigilia: 2h
Duración siesta: 1.25h
Ciclo: 2 + 1.25 = 3.25h

Siestas que caben: 13 / 3.25 = 4 siestas ✅

Resultado: Predice 4 siestas ✅ (máximo para su edad)
```

### Ejemplo 2: Despertar Tarde (8:00 AM) - CASO DEL USUARIO

```
Edad: 4 meses
Despertó: 8:00 AM (8.0h) ← 1.5h más tarde
Bedtime: 7:30 PM (19.5h)
Tiempo disponible: 19.5 - 8.0 = 11.5 horas

Ventana de vigilia: 2h
Duración siesta: 1.25h
Ciclo: 2 + 1.25 = 3.25h

Siestas que caben: 11.5 / 3.25 = 3.5 ≈ 3 siestas ✅

Resultado: Predice 3 siestas ✅ (ajustado por tiempo disponible)
```

### Ejemplo 3: Despertar Muy Tarde (9:00 AM)

```
Edad: 4 meses
Despertó: 9:00 AM (9.0h)
Bedtime: 7:30 PM (19.5h)
Tiempo disponible: 19.5 - 9.0 = 10.5 horas

Ventana de vigilia: 2h
Duración siesta: 1.25h
Ciclo: 2 + 1.25 = 3.25h

Siestas que caben: 10.5 / 3.25 = 3.2 ≈ 3 siestas ✅

Resultado: Predice 3 siestas ✅
```

---

## 🤖 NUEVO PROMPT DE CHATGPT

### Información Adicional en el Prompt:

```javascript
const prompt = `
INFORMACIÓN DEL BEBÉ:
- Edad: ${childInfo.ageInMonths} meses
- Hora de despertar hoy: ${wakeTimeLocal.toLocaleTimeString()} (${wakeHour.toFixed(2)}h)
- Hora de dormir objetivo: ${optimalBedtime.toFixed(2)}h
- Horas disponibles: ${hoursUntilBedtime.toFixed(2)} horas

ANÁLISIS DE TIEMPO DISPONIBLE:
- Despertó a las ${wakeHour.toFixed(2)}h
- Debe dormir a las ${optimalBedtime.toFixed(2)}h
- Tiempo disponible: ${hoursUntilBedtime.toFixed(2)} horas
- Siestas que caben REALMENTE: ${realisticNapCount} siestas

PREGUNTA CRÍTICA:
Basándote en la HORA DE DESPERTAR REAL (${wakeHour.toFixed(2)}h) 
y el tiempo disponible hasta bedtime (${hoursUntilBedtime.toFixed(2)}h):

1. ¿Cuántas siestas caben REALMENTE hoy?
2. Si despertó tarde (>8 AM), probablemente caben MENOS siestas
3. La última siesta debe terminar AL MENOS ${wakeWindows.optimal}h antes de bedtime

REGLAS ESTRICTAS:
✅ CALCULA dinámicamente cuántas siestas caben
✅ NO uses el máximo si no hay tiempo
✅ Si despertó tarde (>8 AM), probablemente caben MENOS siestas
✅ Última siesta debe terminar antes de las ${optimalBedtime - wakeWindows.optimal}h

IMPORTANTE: 
- NO fuerces ${expectedNaps.max} siestas si no hay tiempo suficiente
- CALCULA cuántas caben basándote en hora de despertar real
- Si despertó tarde, predice MENOS siestas (ej: 3 en vez de 4)
`;
```

### Nuevo Mensaje del Sistema:

```javascript
{
  role: "system",
  content: `Eres un experto en patrones de sueño infantil. 
  
  CRÍTICO: Debes calcular dinámicamente cuántas siestas caben 
  basándote en la hora de despertar real y el tiempo disponible hasta bedtime. 
  
  NO fuerces el máximo si el bebé despertó tarde. 
  
  Si despertó a las 8 AM en vez de 6:30 AM, probablemente solo caben 3 siestas en vez de 4. 
  
  Usa lógica matemática: (horas disponibles) / (ventana de vigilia + duración de siesta).`
}
```

---

## 📊 LOGS MEJORADOS

### Logs al Calcular Predicciones:

```
🤖 [AI PREDICTION] Preparando consulta a ChatGPT...
   - Edad: 4 meses
   - Hora actual: 13/01/2026 10:30:00
   - Hora de despertar: 8.00h ← NUEVO
   - Horas hasta bedtime: 11.50h ← NUEVO
   - Siestas que caben: 3 ← NUEVO (antes forzaba 4)
   - Siestas recomendadas: 3 (ajustado de 3-4) ← NUEVO
   - Siestas completadas: 0
   - Ventanas de vigilia: 1.5-2.5h

🤖 [AI PREDICTION] Consultando a ChatGPT...
🎯 [AI PREDICTION] Solicitando predicción para 3 siestas recomendadas (0 completadas)

✅ [AI PREDICTION] Respuesta recibida en 1843ms
✅ [AI PREDICTION] Siestas sugeridas: 3
✅ [AI PREDICTION] Confianza: 85%
✅ [AI PREDICTION] Explicación: "Despertó 1.5h más tarde, solo caben 3 siestas"
📊 [AI PREDICTION] Total de siestas para hoy: 3 (0 completadas + 3 predichas)
✅ [AI PREDICTION] Total de siestas dentro del rango esperado (3-4)
```

---

## 🎯 CASOS DE USO

### Caso 1: Despertar Normal

```
POST /api/sleep/wake-time
{
  "childId": "child_123",
  "wakeTime": "2026-01-13T06:30:00Z",
  "timezone": "America/Mexico_City"
}

GET /api/sleep/predict/child_123

Respuesta:
{
  "predictedNaps": [
    { "napNumber": 1, "time": "08:30", ... },  ← 2h después despertar
    { "napNumber": 2, "time": "12:00", ... },  ← 2h después siesta 1
    { "napNumber": 3, "time": "15:30", ... },  ← 2h después siesta 2
    { "napNumber": 4, "time": "18:00", ... }   ← 2h después siesta 3
  ],
  "predictedBedtime": { "time": "19:30", ... }
}

✅ 4 siestas (hay tiempo suficiente)
```

### Caso 2: Despertar Tarde (Caso del Usuario)

```
POST /api/sleep/wake-time
{
  "childId": "child_123",
  "wakeTime": "2026-01-13T08:00:00Z",  ← 1.5h más tarde
  "timezone": "America/Mexico_City"
}

GET /api/sleep/predict/child_123

Respuesta:
{
  "predictedNaps": [
    { "napNumber": 1, "time": "10:00", ... },  ← 2h después despertar
    { "napNumber": 2, "time": "13:30", ... },  ← 2h después siesta 1
    { "napNumber": 3, "time": "16:30", ... }   ← 2h después siesta 2
  ],
  "predictedBedtime": { "time": "19:30", ... },
  "aiExplanation": "Despertó 1.5h más tarde, solo caben 3 siestas para llegar a bedtime óptimo"
}

✅ 3 siestas (ajustado dinámicamente)
```

---

## 📱 RESPUESTA EN LA APP

### Antes (Incorrecto):

```
🕐 Hora de despertar: 8:00 AM (1.5h tarde)

Predicciones:
  ❌ Siesta 1: 10:00 AM
  ❌ Siesta 2: 1:00 PM
  ❌ Siesta 3: 4:00 PM
  ❌ Siesta 4: 7:00 PM ← Imposible (bedtime es 7:30 PM)
  
Problema: La cuarta siesta interfiere con bedtime
```

### Ahora (Correcto):

```
🕐 Hora de despertar: 8:00 AM (1.5h tarde)

Predicciones:
  ✅ Siesta 1: 10:00 AM
  ✅ Siesta 2: 1:30 PM
  ✅ Siesta 3: 4:30 PM
  ✅ Hora de dormir: 7:30 PM

💡 "Hoy solo necesita 3 siestas porque despertó más tarde"
```

---

## 🔄 HORA DE DORMIR ÓPTIMA POR EDAD

El sistema ahora define bedtime óptimo según edad:

```javascript
let optimalBedtime;
if (childInfo.ageInMonths <= 6) {
  optimalBedtime = 19.5; // 7:30 PM (bebés pequeños)
} else if (childInfo.ageInMonths <= 12) {
  optimalBedtime = 20; // 8:00 PM (bebés medianos)
} else {
  optimalBedtime = 20.5; // 8:30 PM (bebés grandes)
}
```

### Tabla de Referencia:

| Edad | Bedtime Óptimo | Siestas Típicas |
|------|----------------|-----------------|
| 0-6 meses | 7:30 PM | 3-4 siestas |
| 7-12 meses | 8:00 PM | 2-3 siestas |
| 13+ meses | 8:30 PM | 1-2 siestas |

---

## 🎯 BENEFICIOS

### 1. ✅ **Predicciones Realistas**
- Ya no sugiere siestas imposibles de lograr
- Considera la hora de despertar real del día
- Se ajusta dinámicamente

### 2. ✅ **Mejor Experiencia de Usuario**
- Padres no se frustran intentando lograr 4 siestas cuando solo caben 3
- Predicciones alineadas con la realidad del día
- Explicación clara del por qué (ej: "despertó tarde")

### 3. ✅ **Más Inteligente**
- Usa matemática real: tiempo disponible / ciclo de sueño
- Respeta hora de dormir óptima para la edad
- ChatGPT recibe contexto completo para mejores predicciones

### 4. ✅ **Flexibilidad**
- Se adapta a cambios en la rutina
- Fin de semana con despertar tarde → menos siestas
- Día normal con despertar temprano → más siestas

---

## 📊 FÓRMULA DE CÁLCULO

```
Tiempo Disponible = Bedtime Óptimo - Hora de Despertar

Ciclo de Sueño = Ventana de Vigilia + Duración Promedio de Siesta

Siestas Teóricas = Tiempo Disponible / Ciclo de Sueño

Siestas Reales = min(max(Siestas Teóricas, Mínimo por Edad), Máximo por Edad)
```

### Ejemplo:

```
Bedtime Óptimo = 19.5h (7:30 PM)
Hora de Despertar = 8.0h (8:00 AM)
Tiempo Disponible = 19.5 - 8.0 = 11.5h

Ventana de Vigilia = 2h
Duración Siesta = 1.25h
Ciclo = 2 + 1.25 = 3.25h

Siestas Teóricas = 11.5 / 3.25 = 3.54
Siestas Teóricas (redondeado) = 3

Mínimo por Edad (4 meses) = 3
Máximo por Edad (4 meses) = 4

Siestas Reales = min(max(3, 3), 4) = 3 ✅
```

---

## ⚠️ VALIDACIONES

El sistema valida el resultado:

```javascript
const totalNapsForDay = currentNaps.length + aiResponse.remainingNaps.length;

if (totalNapsForDay < expectedNaps.min) {
  console.warn(`⚠️ Total de siestas (${totalNapsForDay}) es menor que mínimo (${expectedNaps.min})`);
} else if (totalNapsForDay > expectedNaps.max) {
  console.warn(`⚠️ Total de siestas (${totalNapsForDay}) excede máximo (${expectedNaps.max})`);
} else {
  console.log(`✅ Total de siestas dentro del rango esperado`);
}
```

---

## 🧪 PRUEBA

### Escenario de Prueba:

```
1. Registrar despertar tardío:
   POST /api/sleep/wake-time
   { "wakeTime": "2026-01-13T08:00:00Z" }
   
2. Obtener predicciones:
   GET /api/sleep/predict/child_123
   
3. Verificar:
   → Solo 3 siestas predichas (no 4)
   → Última siesta termina antes de 7:30 PM
   → Explicación indica "despertó tarde"
```

---

## 📚 DOCUMENTACIÓN RELACIONADA

- `API-SLEEP-PREDICTION.md` - Sistema completo de predicciones
- `AUTO-RECALCULATE-PREDICTIONS.md` - Recálculo automático
- `API-SLEEP-NOTIFICATIONS.md` - Notificaciones de sueño

---

## ✅ CHECKLIST

### Backend
- [x] Calcular hora de despertar real en timezone del usuario
- [x] Definir bedtime óptimo por edad
- [x] Calcular tiempo disponible
- [x] Calcular ciclo de sueño (vigilia + duración)
- [x] Calcular número realista de siestas
- [x] Actualizar prompt de ChatGPT con contexto completo
- [x] Actualizar mensaje del sistema de ChatGPT
- [x] Agregar logs detallados
- [x] Validar rango de siestas
- [x] Desplegar a producción

### Frontend (Recomendado)
- [ ] Mostrar explicación del por qué del número de siestas
- [ ] Indicar si el número de siestas es diferente al usual
- [ ] Mostrar "Hoy solo 3 siestas porque despertó tarde"

---

## 🎉 RESULTADO FINAL

**El sistema ahora es verdaderamente inteligente:**

✅ Considera hora de despertar REAL del día (no promedios)  
✅ Calcula dinámicamente cuántas siestas caben  
✅ Respeta hora de dormir óptima para la edad  
✅ Predicciones realistas y alcanzables  
✅ Explicación clara del por qué  

**Ejemplo Real del Usuario:**

```
Bebé de 4 meses
Normalmente despierta: 6:30 AM → 4 siestas
Hoy despertó: 8:00 AM → 3 siestas ✅

"Debe tener en cuenta la hora de despertar" ✅ RESUELTO
```

**URL desplegada:** `https://mumpabackend-9oqq3irm1-mishu-lojans-projects.vercel.app`

**¡Predicciones ahora basadas en la realidad del día!** 🎯🧠
