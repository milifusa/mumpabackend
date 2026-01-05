# 🛌 API de Predicción de Sueño Inteligente

Sistema avanzado de predicción de patrones de sueño infantil, similar a la app **Napper**.

## 🌟 Características

- ✅ Predicción inteligente de siestas y hora de dormir
- ✅ Análisis de patrones de sueño basado en datos históricos
- ✅ Recomendaciones personalizadas por edad
- ✅ Cálculo de presión de sueño
- ✅ Estadísticas y análisis detallados
- ✅ Sistema de recordatorios inteligentes
- ✅ Ventanas de tiempo óptimas para dormir

---

## 📋 Endpoints Disponibles

### 1. Registrar Evento de Sueño

**POST** `/api/sleep/record`

Registra una siesta o sueño nocturno del bebé.

**Headers:**
```
Authorization: Bearer {firebase_token}
```

**Body:**
```json
{
  "childId": "abc123",
  "type": "nap",
  "startTime": "2026-01-05T14:00:00Z",
  "endTime": "2026-01-05T15:30:00Z",
  "duration": 90,
  "quality": "good",
  "wakeUps": 1,
  "location": "crib",
  "temperature": 21,
  "noiseLevel": 0.3,
  "notes": "Durmió bien después del paseo"
}
```

**Campos:**
- `childId` (requerido): ID del niño
- `type` (requerido): `"nap"` o `"nightsleep"`
- `startTime` (requerido): Hora de inicio (ISO 8601)
- `endTime` (opcional): Hora de fin
- `duration` (opcional): Duración en minutos
- `quality` (opcional): `"poor"`, `"fair"`, `"good"`, `"excellent"`
- `wakeUps` (opcional): Número de despertares
- `location` (opcional): `"crib"`, `"stroller"`, `"car"`, `"carrier"`
- `temperature` (opcional): Temperatura en °C
- `noiseLevel` (opcional): Nivel de ruido (0-1)
- `notes` (opcional): Notas adicionales

**Respuesta:**
```json
{
  "success": true,
  "message": "Evento de sueño registrado exitosamente",
  "sleepEventId": "evt_123",
  "sleepEvent": {
    "id": "evt_123",
    "childId": "abc123",
    "type": "nap",
    "startTime": "2026-01-05T14:00:00Z",
    "duration": 90
  }
}
```

---

### 2. Obtener Predicción de Sueño

**GET** `/api/sleep/predict/:childId`

Genera predicción inteligente de próxima siesta y hora de dormir.

**Headers:**
```
Authorization: Bearer {firebase_token}
```

**Respuesta:**
```json
{
  "success": true,
  "prediction": {
    "nextNap": {
      "time": "2026-01-05T16:30:00Z",
      "windowStart": "2026-01-05T16:00:00Z",
      "windowEnd": "2026-01-05T17:00:00Z",
      "expectedDuration": 75,
      "confidence": 85,
      "type": "Siesta de la tarde",
      "reason": "Basado en 12 siestas anteriores"
    },
    "bedtime": {
      "time": "2026-01-05T19:30:00Z",
      "windowStart": "2026-01-05T19:10:00Z",
      "windowEnd": "2026-01-05T19:50:00Z",
      "confidence": 90,
      "consistency": "Alta",
      "reason": "Basado en 7 noches anteriores"
    },
    "patterns": {
      "totalDailySleep": 780,
      "napStats": {
        "averageDuration": 75,
        "averagePerDay": 2.1,
        "totalNaps": 15
      },
      "nightStats": {
        "averageDuration": 600,
        "averageWakeUps": 1.5,
        "totalNights": 7
      },
      "overallQuality": "Buena",
      "consistency": 82
    },
    "recommendations": [
      {
        "type": "success",
        "category": "general",
        "title": "¡Excelente trabajo!",
        "message": "Los patrones de sueño son saludables y consistentes.",
        "action": "Continúa con la rutina actual."
      }
    ],
    "sleepPressure": {
      "level": "medium",
      "hoursSinceLastSleep": 2.5,
      "lastSleepTime": "2026-01-05T12:00:00Z",
      "recommendation": "Comienza a preparar el ambiente para dormir"
    },
    "predictedAt": "2026-01-05T15:00:00Z",
    "confidence": 87
  },
  "childInfo": {
    "name": "Sofía",
    "ageInMonths": 8,
    "dataPoints": 22
  }
}
```

**Niveles de Presión de Sueño:**
- `low`: < 1.5 horas - Momento para jugar
- `medium`: 1.5-3 horas - Preparar ambiente
- `high`: 3-4 horas - Hora de dormir pronto
- `critical`: > 4 horas - ¡Dormir urgentemente!

---

### 3. Obtener Historial de Sueño

**GET** `/api/sleep/history/:childId?days=7`

Obtiene el historial de sueño con estadísticas.

**Query Parameters:**
- `days` (opcional): Número de días (default: 7)

**Respuesta:**
```json
{
  "success": true,
  "sleepHistory": [
    {
      "id": "evt_1",
      "type": "nap",
      "startTime": "2026-01-04T14:00:00Z",
      "endTime": "2026-01-04T15:30:00Z",
      "duration": 90,
      "quality": "good",
      "wakeUps": 0
    }
  ],
  "statistics": {
    "totalEvents": 15,
    "totalNaps": 12,
    "totalNights": 3,
    "avgNapDuration": 75,
    "avgNightDuration": 600
  },
  "days": 7
}
```

---

### 4. Análisis Detallado de Patrones

**GET** `/api/sleep/analysis/:childId?days=30`

Análisis completo de patrones de sueño con recomendaciones.

**Query Parameters:**
- `days` (opcional): Número de días a analizar (default: 30)

**Respuesta:**
```json
{
  "success": true,
  "analysis": {
    "patterns": {
      "totalDailySleep": 780,
      "napStats": {
        "averageDuration": 75,
        "averagePerDay": 2.5
      },
      "nightStats": {
        "averageDuration": 600,
        "averageWakeUps": 2.0
      },
      "overallQuality": "Buena",
      "consistency": 75
    },
    "recommendations": [
      {
        "type": "tip",
        "category": "night_wakings",
        "title": "Múltiples despertares nocturnos",
        "message": "Promedio de 2.0 despertares por noche.",
        "action": "Considera implementar técnicas de auto-calmado."
      }
    ],
    "childInfo": {
      "name": "Lucas",
      "ageInMonths": 10
    },
    "dataRange": {
      "days": 30,
      "totalEvents": 85,
      "firstEvent": "2025-12-06T08:00:00Z",
      "lastEvent": "2026-01-05T20:00:00Z"
    }
  }
}
```

**Tipos de Recomendaciones:**
- `success` - Todo va bien
- `warning` - Requiere atención
- `info` - Información útil
- `tip` - Consejo para mejorar

**Categorías:**
- `duration` - Duración total de sueño
- `naps` - Número de siestas
- `night_wakings` - Despertares nocturnos
- `consistency` - Regularidad de horarios
- `quality` - Calidad general

---

### 5. Estadísticas Semanales/Mensuales

**GET** `/api/sleep/stats/:childId?period=week`

Estadísticas agrupadas por días.

**Query Parameters:**
- `period`: `"week"` o `"month"` (default: week)

**Respuesta:**
```json
{
  "success": true,
  "period": "week",
  "days": 7,
  "dailyStats": [
    {
      "date": "2026-01-01",
      "totalSleep": 780,
      "naps": 3,
      "nightSleep": 600,
      "events": [...]
    }
  ],
  "summary": {
    "totalEvents": 28,
    "avgSleepPerDay": 765,
    "avgNapsPerDay": 2.5
  }
}
```

---

### 6. Recordatorios Inteligentes

**GET** `/api/sleep/reminders/:childId`

Obtiene recordatorios basados en predicciones.

**Respuesta:**
```json
{
  "success": true,
  "reminders": [
    {
      "type": "nap",
      "title": "🛌 Hora de siesta pronto",
      "message": "La próxima siesta de Sofía es en 15 minutos",
      "time": "2026-01-05T14:00:00Z",
      "minutesUntil": 15,
      "priority": "high"
    },
    {
      "type": "bedtime",
      "title": "🌙 Hora de dormir se acerca",
      "message": "Es hora de empezar la rutina de Sofía",
      "time": "2026-01-05T19:30:00Z",
      "minutesUntil": 45,
      "priority": "medium"
    }
  ],
  "sleepPressure": {
    "level": "medium",
    "hoursSinceLastSleep": 2.3
  },
  "nextPrediction": {
    "nap": {...},
    "bedtime": {...}
  }
}
```

**Prioridades:**
- `critical` - Urgente
- `high` - Alta
- `medium` - Media

---

### 7. Actualizar Evento de Sueño

**PUT** `/api/sleep/:eventId`

Actualiza un evento de sueño existente.

**Body:** (mismos campos que POST /api/sleep/record)

---

### 8. Eliminar Evento de Sueño

**DELETE** `/api/sleep/:eventId`

Elimina un evento de sueño.

---

## 📊 Datos Recomendados por Edad

### 0-3 meses
- **Sueño total:** 14-17 horas/día
- **Siestas:** 4-5 por día
- **Horarios típicos:** 9:00 AM, 12:00 PM, 3:00 PM, 5:30 PM
- **Hora de dormir:** 7:30 PM

### 4-6 meses
- **Sueño total:** 13-16 horas/día
- **Siestas:** 3-4 por día
- **Horarios típicos:** 9:00 AM, 1:00 PM, 4:30 PM
- **Hora de dormir:** 7:00 PM

### 7-12 meses
- **Sueño total:** 12-15 horas/día
- **Siestas:** 2-3 por día
- **Horarios típicos:** 9:30 AM, 2:00 PM
- **Hora de dormir:** 7:00 PM

### 13-18 meses
- **Sueño total:** 11-14 horas/día
- **Siestas:** 1-2 por día
- **Horarios típicos:** 1:00 PM
- **Hora de dormir:** 7:30 PM

### 19+ meses
- **Sueño total:** 10-13 horas/día
- **Siestas:** 1 por día
- **Horarios típicos:** 1:30 PM
- **Hora de dormir:** 8:00 PM

---

## 🧮 Algoritmo de Predicción

### 1. Análisis de Patrones Históricos
- Analiza últimos 14 días de datos
- Identifica ventanas de sueño recurrentes
- Calcula promedios y desviaciones estándar

### 2. Ajuste por Edad
- Aplica rangos recomendados según edad
- Considera número típico de siestas
- Ajusta duración esperada

### 3. Cálculo de Confianza
- Más datos = mayor confianza
- Consistencia aumenta confianza
- Mínimo 3 eventos para predicciones

### 4. Presión de Sueño
- Tiempo desde último sueño
- Edad del bebé
- Duración del último sueño

### 5. Ventanas Óptimas
- Ventana de ±30 minutos para siestas
- Ventana de ±20 minutos para dormir nocturno

---

## 💡 Mejores Prácticas

### Para Desarrolladores Frontend

1. **Registrar eventos en tiempo real**
```javascript
// Cuando el bebé se duerme
await fetch('/api/sleep/record', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    childId: 'abc123',
    type: 'nap',
    startTime: new Date().toISOString()
  })
});

// Cuando despierta - actualizar con endTime
await fetch(`/api/sleep/${eventId}`, {
  method: 'PUT',
  body: JSON.stringify({
    endTime: new Date().toISOString()
  })
});
```

2. **Mostrar próxima siesta**
```javascript
const prediction = await fetch(`/api/sleep/predict/${childId}`);
const { nextNap } = prediction.prediction;

// Mostrar contador regresivo
const minutesUntil = Math.floor(
  (new Date(nextNap.time) - new Date()) / 60000
);
```

3. **Notificaciones push**
```javascript
// Verificar recordatorios cada 5 minutos
setInterval(async () => {
  const reminders = await fetch(`/api/sleep/reminders/${childId}`);
  
  reminders.reminders.forEach(reminder => {
    if (reminder.priority === 'high') {
      showPushNotification(reminder);
    }
  });
}, 5 * 60 * 1000);
```

4. **Dashboard visual**
```javascript
// Gráficas de patrones
const stats = await fetch(`/api/sleep/stats/${childId}?period=month`);
const analysis = await fetch(`/api/sleep/analysis/${childId}?days=30`);

// Renderizar gráfica de líneas con sueño diario
renderChart(stats.dailyStats);

// Mostrar recomendaciones
showRecommendations(analysis.recommendations);
```

### Para Padres

1. **Registra todos los eventos**
   - Siestas cortas también cuentan
   - Incluye calidad y despertares
   - Agrega notas sobre contexto

2. **Sé consistente**
   - Registra durante al menos 1 semana
   - Más datos = mejores predicciones
   - Mantén horarios regulares

3. **Sigue las recomendaciones**
   - Respeta las ventanas de sueño
   - Observa señales de sueño del bebé
   - Ajusta según necesidad

4. **Revisa estadísticas**
   - Observa tendencias mensuales
   - Identifica qué funciona
   - Adapta según crecimiento

---

## 🔒 Seguridad

- ✅ Todos los endpoints requieren autenticación
- ✅ Los usuarios solo acceden a datos de sus hijos
- ✅ Validación de datos en servidor
- ✅ Timestamps en UTC

---

## 🚀 Próximas Mejoras

- [ ] Machine Learning con TensorFlow.js
- [ ] Integración con wearables
- [ ] Análisis de ciclos de sueño REM
- [ ] Comparación con otros bebés de la misma edad
- [ ] Exportar reportes en PDF
- [ ] Integración con Google Calendar

---

## 📝 Ejemplo Completo de Flujo

```javascript
// 1. Usuario registra que el bebé se durmió
const sleepStart = await api.post('/api/sleep/record', {
  childId: 'child_123',
  type: 'nap',
  startTime: new Date().toISOString(),
  location: 'crib'
});

// 2. Después de 90 minutos, el bebé despierta
await api.put(`/api/sleep/${sleepStart.sleepEventId}`, {
  endTime: new Date().toISOString(),
  quality: 'good',
  wakeUps: 0
});

// 3. Obtener predicción de próxima siesta
const prediction = await api.get(`/api/sleep/predict/child_123`);
console.log('Próxima siesta:', prediction.nextNap.time);

// 4. Ver análisis de la semana
const analysis = await api.get('/api/sleep/analysis/child_123?days=7');
console.log('Recomendaciones:', analysis.recommendations);

// 5. Configurar recordatorios
const reminders = await api.get('/api/sleep/reminders/child_123');
reminders.forEach(r => scheduleNotification(r));
```

---

## 🆘 Soporte

Para preguntas o problemas:
- Email: support@munpa.online
- Documentación: https://munpa.online/docs
- GitHub: https://github.com/munpa/backend

---

**Versión:** 1.0.0  
**Última actualización:** 5 de Enero, 2026

