# 🔧 FIX: ChatGPT debe sugerir 4 siestas (no 3)

## 🐛 PROBLEMA REPORTADO

Usuario: "recomienda 3 pero aun necesita 4 siestas por la edad y por las siestas debe tener en cuenta las ventanas de sueño propias por edad"

**Bebé de 4 meses:**
- ❌ Sugiere: 3 siestas
- ✅ Debería sugerir: 4 siestas
- ✅ Ventanas de vigilia: 1.5-2.5 horas

---

## ✅ SOLUCIÓN

### **Problema 1: Prompt no especifica número exacto**

**Prompt actual:**
```
"¿Cuántas siestas más debería tener este bebé HOY?"
```
❌ Muy vago, ChatGPT puede decidir cualquier número

**Prompt mejorado:**
```
DATOS PEDIÁTRICOS PARA 4 MESES:
- Siestas recomendadas por día: 3 a 4 siestas
- Ventana de vigilia óptima: 2 horas
- Ventana de vigilia mínima: 1.5 horas
- Ventana de vigilia máxima: 2.5 horas

SIESTAS COMPLETADAS HOY (2 de 4):
  ✅ Siesta 1: 9:00 AM - 10:30 AM (90 min)
  ✅ Siesta 2: 12:00 PM - 1:30 PM (90 min)

PREGUNTA CRÍTICA:
1. Este bebé debe tener 4 siestas HOY (máximo recomendado para su edad)
2. Ya completó 2 siestas
3. DEBE predecir 2 siestas MÁS
4. Cada siesta debe respetar ventanas de vigilia de 1.5-2.5h

REGLAS ESTRICTAS:
✅ DEBE predecir EXACTAMENTE 2 siestas (no menos)
✅ Cada siesta debe estar separada por 2h (±30 min)
```

---

## 📦 CAMBIOS NECESARIOS

### Archivo: `controllers/sleepPredictionController.js`

#### Línea ~56: Actualizar `enhancePredictionsWithAI()`

```javascript
async enhancePredictionsWithAI(childInfo, currentNaps, wakeTime, userTimezone) {
  try {
    // ... código existente ...
    
    // ✅ AGREGAR: Obtener datos pediátricos
    const expectedNaps = this.getExpectedNapsPerDay(childInfo.ageInMonths);
    const wakeWindows = this.getWakeWindows(childInfo.ageInMonths);
    const timezoneOffset = TimezoneHelper.getTimezoneOffset(userTimezone);
    
    console.log(`   - Siestas esperadas: ${expectedNaps.min}-${expectedNaps.max}`);
    console.log(`   - Ventanas de vigilia: ${wakeWindows.min}-${wakeWindows.max}h`);
    
    // ✅ MEJORAR: Prompt con datos específicos
    const prompt = `Eres un experto en patrones de sueño infantil con acceso a bases de datos pediátricas (AAP, NSF, CDC).

INFORMACIÓN DEL BEBÉ:
- Edad: ${childInfo.ageInMonths} meses
- Timezone: UTC${timezoneOffset >= 0 ? '+' : ''}${timezoneOffset}
- Hora actual: ${localTime.toLocaleString('es-MX')}

DATOS PEDIÁTRICOS PARA ${childInfo.ageInMonths} MESES:
- Siestas recomendadas por día: ${expectedNaps.min} a ${expectedNaps.max} siestas
- Ventana de vigilia óptima: ${wakeWindows.optimal} horas
- Ventana de vigilia mínima: ${wakeWindows.min} horas
- Ventana de vigilia máxima: ${wakeWindows.max} horas

SIESTAS COMPLETADAS HOY (${currentNaps.length} de ${expectedNaps.max}):
${currentNaps.map((nap, i) => {
  // ... formatear siestas ...
}).join('\\n')}

PREGUNTA CRÍTICA:
1. Este bebé debe tener ${expectedNaps.max} siestas HOY (máximo recomendado para su edad)
2. Ya completó ${currentNaps.length} siestas
3. DEBE predecir ${expectedNaps.max - currentNaps.length} siestas MÁS
4. Cada siesta debe respetar ventanas de vigilia de ${wakeWindows.min}-${wakeWindows.max}h

REGLAS ESTRICTAS:
✅ DEBE predecir EXACTAMENTE ${expectedNaps.max - currentNaps.length} siestas (no menos)
✅ Cada siesta debe estar separada por ${wakeWindows.optimal}h (±30 min)
✅ Solo predice siestas DESPUÉS de las ${currentHour.toFixed(0)}h
✅ Todas las horas en formato 24h LOCAL (UTC${timezoneOffset >= 0 ? '+' : ''}${timezoneOffset})

FORMATO DE RESPUESTA (JSON estricto):
{
  "remainingNaps": [
    {
      "napNumber": ${currentNaps.length + 1},
      "time": "15:00",
      "duration": 60,
      "reason": "Siesta de tarde, ${wakeWindows.optimal}h después de última siesta"
    }
  ],
  "bedtime": {
    "time": "20:00",
    "reason": "${wakeWindows.optimal}h después de última siesta"
  },
  "confidence": 85
}

IMPORTANTE: Debes devolver EXACTAMENTE ${expectedNaps.max - currentNaps.length} siestas en remainingNaps[].`;

    // ✅ MEJORAR: System message más específico
    const response = await this.openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `Eres un experto en patrones de sueño infantil con conocimiento de bases de datos pediátricas (AAP, NSF, CDC). Respondes SOLO en formato JSON válido. IMPORTANTE: Para bebés de ${childInfo.ageInMonths} meses, SIEMPRE debes sugerir ${expectedNaps.max} siestas totales por día.`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
      max_tokens: 1000
    });
    
    // ... resto del código ...
    
    // ✅ AGREGAR: Validación de respuesta
    const expectedRemaining = expectedNaps.max - currentNaps.length;
    if (aiResponse.remainingNaps && aiResponse.remainingNaps.length < expectedRemaining) {
      console.warn(`⚠️ [AI PREDICTION] ChatGPT devolvió ${aiResponse.remainingNaps.length} siestas pero debería devolver ${expectedRemaining}`);
    }
    
    return aiResponse;
  }
}
```

---

## 📊 EJEMPLO COMPLETO

### Entrada a ChatGPT (Bebé 4 meses, 2 PM):

```
DATOS PEDIÁTRICOS PARA 4 MESES:
- Siestas recomendadas por día: 3 a 4 siestas
- Ventana de vigilia óptima: 2 horas
- Ventana de vigilia mínima: 1.5 horas  
- Ventana de vigilia máxima: 2.5 horas

SIESTAS COMPLETADAS HOY (2 de 4):
  ✅ Siesta 1: 9:00 AM - 10:30 AM (90 min)
  ✅ Siesta 2: 12:00 PM - 1:30 PM (90 min)

PREGUNTA CRÍTICA:
1. Este bebé debe tener 4 siestas HOY
2. Ya completó 2 siestas
3. DEBE predecir 2 siestas MÁS  ← ✅ EXPLÍCITO
4. Cada siesta debe respetar ventanas de vigilia de 1.5-2.5h

REGLAS ESTRICTAS:
✅ DEBE predecir EXACTAMENTE 2 siestas (no menos)
✅ Cada siesta debe estar separada por 2h (±30 min)
```

### Salida de ChatGPT:

```json
{
  "remainingNaps": [
    {
      "napNumber": 3,
      "time": "15:30",  // 3:30 PM (2h después de siesta #2)
      "duration": 60,
      "reason": "Siesta de tarde, 2h después de última siesta"
    },
    {
      "napNumber": 4,
      "time": "18:00",  // 6:00 PM (2.5h después de siesta #3)
      "duration": 30,
      "reason": "Catnap vespertino, 2.5h después de siesta anterior"
    }
  ],
  "bedtime": {
    "time": "20:30",  // 8:30 PM (2.5h después de siesta #4)
    "reason": "2.5h después de última siesta"
  },
  "confidence": 88
}
```

✅ **Devuelve 2 siestas** (no 1, no 3, exactamente 2)  
✅ **Respeta ventanas de vigilia** (2h-2.5h)  
✅ **Total del día: 4 siestas** (2 completadas + 2 predichas)

---

## 🎯 VENTAJAS

1. ✅ **Número exacto**: ChatGPT sabe cuántas debe sugerir
2. ✅ **Ventanas correctas**: Usa datos pediátricos reales
3. ✅ **Consistencia**: Siempre sugiere el máximo para la edad
4. ✅ **Validación**: Detecta si ChatGPT se equivoca

---

## 🚀 RESULTADO ESPERADO

**Bebé de 4 meses:**
- Target: 4 siestas
- Registradas: 2
- ChatGPT debe sugerir: 2 más ✅

**Bebé de 7 meses:**
- Target: 3 siestas
- Registradas: 1
- ChatGPT debe sugerir: 2 más ✅

**Bebé de 10 meses:**
- Target: 2 siestas
- Registradas: 1
- ChatGPT debe sugerir: 1 más ✅

---

**Fecha:** 2026-01-09  
**Prioridad:** ALTA  
**Estatus:** PENDIENTE DE IMPLEMENTAR

