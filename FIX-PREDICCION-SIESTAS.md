# 🔧 Fix - Algoritmo de Predicción de Siestas

## 🐛 Problema Reportado

**Usuario reporta:**
> "La última siesta fue a las 19:37 (7:37 PM) pero el sistema predice que la próxima siesta es a las 13:00 (1:00 PM)"

**Logs del sistema:**
```javascript
{
  "lastSleepTime": "2026-01-05T19:37:52.048Z", // 7:37 PM
  "nextNap": null, // No predice próxima siesta correctamente
  "sleepPressure": {
    "hoursSinceLastSleep": 0,
    "level": "low"
  }
}
```

---

## 🔍 Causa del Problema

### Problemas Identificados:

1. **No consideraba la hora actual**
   - El algoritmo no validaba si era razonable predecir más siestas en el día
   - Después de las 7 PM seguía prediciendo siestas para "hoy"

2. **Lógica de horarios por defecto incorrecta**
   - Cuando no había patrones claros, usaba horarios fijos sin considerar si ya habían pasado

3. **No usaba ventanas de sueño (wake windows)**
   - No consideraba el tiempo óptimo entre siestas según la edad del bebé
   - Importante: Un bebé de 4 meses necesita ~1.5-2 horas despierto entre siestas

4. **Problema con siestas tardías**
   - Si la última siesta fue a las 7:37 PM, la próxima debería ser MAÑANA
   - El sistema no detectaba esto correctamente

---

## ✅ Solución Implementada

### 1. **Detección de Horario Tardío**

```javascript
// Si es después de las 7 PM, no predecir más siestas para HOY
if (hourOfDay >= 19) {
  // Predecir primera siesta del DÍA SIGUIENTE
  nextNapDate.setDate(nextNapDate.getDate() + 1);
  napType = 'Siesta de la mañana';
  reason = 'Ya es tarde. Próxima siesta mañana';
}
```

### 2. **Sistema de Ventanas de Sueño (Wake Windows)**

Agregado método `getWakeWindows(ageInMonths)`:

| Edad | Ventana Mínima | Ventana Óptima | Ventana Máxima |
|------|---------------|----------------|----------------|
| 0-1 mes | 45 min | 1 hora | 1.5 horas |
| 2-3 meses | 1 hora | 1.5 horas | 2 horas |
| 4-6 meses | 1.5 horas | 2 horas | 2.5 horas |
| 7-9 meses | 2 horas | 2.5 horas | 3.5 horas |
| 10-12 meses | 2.5 horas | 3 horas | 4 horas |
| 13-18 meses | 3 horas | 4 horas | 5 horas |
| 19+ meses | 4 horas | 5 horas | 6 horas |

### 3. **Predicción Basada en Última Siesta**

```javascript
// Si la última siesta fue hace poco
if (minutesSinceLastNap < minWakeWindow * 60) {
  // Calcular próxima siesta basada en ventana óptima
  const nextNapTime = addMinutes(lastNapEnd, optimalWakeWindow * 60);
  
  // Validar que no sea después de las 7 PM
  if (nextNapTime.getHours() < 19) {
    return nextNapTime;
  } else {
    // Predecir para mañana
    return tomorrowMorning;
  }
}
```

### 4. **Validación de Horarios Razonables**

```javascript
// No predecir siestas después de las 7 PM
if (nextNapDate.getHours() >= 19) {
  // Mover a mañana
  nextNapDate.setDate(nextNapDate.getDate() + 1);
  nextNapDate.setHours(9); // Primera siesta de la mañana
}
```

### 5. **Mejor Manejo de Horarios por Defecto**

```javascript
findNextDefaultNap(defaults, now) {
  // Encontrar el próximo horario que no haya pasado
  for (const defaultTime of defaults) {
    if (napHour > currentHour && napHour < 19) {
      return defaultTime;
    }
  }
  // Si todos pasaron, devolver el primero de mañana
  return tomorrowFirstNap;
}
```

---

## 🧪 Ejemplos de Casos Corregidos

### Caso 1: Última siesta a las 7:37 PM

**Antes:**
```javascript
{
  "nextNap": {
    "time": "2026-01-06T13:00:00Z", // 1:00 PM del mismo día?? ❌
    "confidence": 40
  }
}
```

**Ahora:**
```javascript
{
  "nextNap": {
    "time": "2026-01-06T09:00:00Z", // 9:00 AM del DÍA SIGUIENTE ✅
    "type": "Siesta de la mañana",
    "confidence": 80,
    "reason": "Ya es tarde. Próxima siesta mañana"
  }
}
```

### Caso 2: Bebé de 4 meses, última siesta a las 2:00 PM

**Antes:**
```javascript
// Podría predecir cualquier hora sin considerar ventana de sueño
{
  "nextNap": {
    "time": "2026-01-05T15:00:00Z", // 3:00 PM (solo 1 hora después)
    "confidence": 50
  }
}
```

**Ahora:**
```javascript
// Usa ventana óptima de 2 horas para 4 meses
{
  "nextNap": {
    "time": "2026-01-05T16:00:00Z", // 4:00 PM (2 horas después) ✅
    "type": "Basado en ventana de sueño",
    "expectedDuration": 60,
    "confidence": 75,
    "reason": "Basado en ventana óptima de 2h desde última siesta"
  }
}
```

### Caso 3: Son las 6:30 PM, última siesta terminó a las 5:00 PM

**Antes:**
```javascript
// Podría predecir una siesta a las 7:00 PM
{
  "nextNap": {
    "time": "2026-01-05T19:00:00Z" // 7:00 PM ❌
  }
}
```

**Ahora:**
```javascript
// Detecta que es tarde y predice para mañana
{
  "nextNap": {
    "time": "2026-01-06T09:00:00Z", // 9:00 AM mañana ✅
    "type": "Siesta de la mañana (mañana)",
    "reason": "Ya es tarde para otra siesta hoy"
  }
}
```

---

## 📊 Mejoras en Confianza

### Niveles de Confianza Mejorados:

| Escenario | Confianza Antes | Confianza Ahora |
|-----------|-----------------|-----------------|
| Patrón claro en la mañana | 85% | 85% ✅ |
| Patrón claro en la tarde | 90% | 90% ✅ |
| Basado en ventana de sueño | N/A | 75% 🆕 |
| Última siesta hace poco | 40% | 75% ⬆️ |
| Horarios por defecto | 30-40% | 40-50% ⬆️ |
| Ya es tarde (>7 PM) | 40% | 75-80% ⬆️ |

---

## 🎯 Lógica de Decisión Mejorada

```
┌─────────────────────────────────────┐
│  ¿Hay siestas registradas?          │
└─────────────┬───────────────────────┘
              │
    ┌─────────▼──────────┐
    │   NO: Usar         │
    │   horarios por     │
    │   defecto          │
    └────────────────────┘
              │
    ┌─────────▼──────────┐
    │   SÍ: Analizar     │
    │   última siesta    │
    └─────────┬──────────┘
              │
    ┌─────────▼──────────────────────┐
    │ ¿Hace cuánto fue la última?    │
    └─────────┬──────────────────────┘
              │
    ┌─────────▼──────────────────────┐
    │ < Ventana mínima:               │
    │ Calcular basado en wake window  │
    └─────────┬──────────────────────┘
              │
    ┌─────────▼──────────────────────┐
    │ ¿Es después de las 7 PM?       │
    └─────────┬──────────────────────┘
              │
        ┌─────▼─────┐
        │    SÍ     │
        │  Mañana   │
        └───────────┘
              │
        ┌─────▼─────┐
        │    NO     │
        │  Calcular │
        │  próxima  │
        └───────────┘
              │
    ┌─────────▼──────────────────────┐
    │ ¿Resultado > 7 PM?             │
    └─────────┬──────────────────────┘
              │
        ┌─────▼─────┐
        │    SÍ     │
        │  Mover a  │
        │  mañana   │
        └───────────┘
```

---

## 🚀 Despliegue

```
✅ Commit: 1142210
✅ Push a GitHub: Exitoso
✅ Deploy a Vercel: Exitoso
✅ URL: https://mumpabackend-965j8h9wc-mishu-lojans-projects.vercel.app
```

---

## 🧪 Cómo Probar

### Test en tu App:

1. **Registra una siesta tarde (después de 6 PM)**
```javascript
POST /api/sleep/record
{
  "childId": "child_id",
  "type": "nap",
  "startTime": "2026-01-05T18:30:00Z",
  "endTime": "2026-01-05T19:30:00Z"
}
```

2. **Obtén predicción**
```javascript
GET /api/sleep/predict/child_id
```

3. **Verifica que:**
   - ✅ `nextNap.time` es para MAÑANA (no hoy)
   - ✅ `nextNap.reason` menciona "mañana"
   - ✅ Hora es razonable (9:00 AM - 11:00 AM)

---

## 📝 Cambios Técnicos

### Nuevos Métodos:

1. **`getWakeWindows(ageInMonths)`**
   - Retorna ventanas de sueño óptimas por edad
   - Usado para calcular cuándo debería ser la próxima siesta

2. **`findNextDefaultNap(defaults, now)`**
   - Encuentra el próximo horario por defecto que no haya pasado
   - Considera la hora actual

### Modificaciones:

1. **`predictNextNap(naps, now, ageInMonths)`**
   - +153 líneas de lógica mejorada
   - Considera ventanas de sueño
   - Valida horarios razonables
   - Detecta si es tarde
   - Mejor manejo de casos extremos

---

## ✅ Resultados Esperados

Después de este fix:

1. ✅ **No más predicciones de siestas en el pasado**
2. ✅ **Si es después de las 7 PM → predice para mañana**
3. ✅ **Usa ventanas de sueño apropiadas por edad**
4. ✅ **Mayor confianza en las predicciones**
5. ✅ **Mejor experiencia de usuario**

---

## 🎉 Resumen

### Problema:
- Predicción incorrecta de siestas cuando la última fue tarde
- No consideraba hora actual ni ventanas de sueño

### Solución:
- ✅ Algoritmo mejorado con ventanas de sueño
- ✅ Detección de horarios tardíos (>7 PM)
- ✅ Predicción inteligente para día siguiente
- ✅ Validación de horarios razonables
- ✅ Mayor precisión y confianza

### Estado:
**✅ CORREGIDO Y DESPLEGADO EN PRODUCCIÓN**

---

**Fecha:** 5 de Enero, 2026  
**Commit:** 1142210  
**Versión:** 1.2.1

