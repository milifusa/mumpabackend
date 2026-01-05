# 📅 Nueva Funcionalidad - Predicción de Todas las Siestas del Día

## 🎉 ¿Qué Cambió?

### Antes:
- Solo mostraba la **próxima siesta**
- No tenías visión completa del día

### Ahora:
- Muestra **TODAS las siestas del día**
- Predicción dinámica que se actualiza con cada siesta registrada
- Horario completo del día

---

## 📊 Nuevo Formato de Respuesta

### GET `/api/sleep/predict/:childId`

```json
{
  "success": true,
  "prediction": {
    "nextNap": {
      "time": "2026-01-06T14:00:00Z",
      "windowStart": "2026-01-06T13:40:00Z",
      "windowEnd": "2026-01-06T14:20:00Z",
      "expectedDuration": 60,
      "confidence": 85,
      "napNumber": 2,
      "type": "Siesta del mediodía",
      "status": "upcoming"
    },
    
    "dailySchedule": {
      "naps": [
        {
          "time": "2026-01-06T09:00:00Z",
          "windowStart": "2026-01-06T08:40:00Z",
          "windowEnd": "2026-01-06T09:20:00Z",
          "expectedDuration": 60,
          "confidence": 90,
          "napNumber": 1,
          "type": "Siesta de la mañana",
          "status": "passed"
        },
        {
          "time": "2026-01-06T14:00:00Z",
          "windowStart": "2026-01-06T13:40:00Z",
          "windowEnd": "2026-01-06T14:20:00Z",
          "expectedDuration": 60,
          "confidence": 85,
          "napNumber": 2,
          "type": "Siesta del mediodía",
          "status": "upcoming"
        },
        {
          "time": "2026-01-06T17:00:00Z",
          "windowStart": "2026-01-06T16:40:00Z",
          "windowEnd": "2026-01-06T17:20:00Z",
          "expectedDuration": 60,
          "confidence": 80,
          "napNumber": 3,
          "type": "Siesta de la tarde",
          "status": "upcoming"
        }
      ],
      "totalNaps": 3,
      "completedNaps": 1,
      "remainingNaps": 2,
      "napsCompleted": [
        {
          "id": "evt_123",
          "startTime": "2026-01-06T09:10:00Z",
          "endTime": "2026-01-06T10:15:00Z",
          "duration": 65,
          "status": "completed"
        }
      ]
    },
    
    "bedtime": {
      "time": "2026-01-06T19:00:00Z",
      "confidence": 40
    }
  }
}
```

---

## 🎯 Campos Explicados

### `dailySchedule.naps[]`
**Todas las siestas sugeridas del día**

| Campo | Descripción |
|-------|-------------|
| `time` | Hora sugerida de la siesta |
| `windowStart` | Inicio de la ventana óptima |
| `windowEnd` | Fin de la ventana óptima |
| `expectedDuration` | Duración esperada en minutos |
| `confidence` | Nivel de confianza (0-100%) |
| `napNumber` | Número de siesta del día (1, 2, 3...) |
| `type` | Tipo: "Mañana", "Mediodía", "Tarde" |
| `status` | Estado: "passed", "upcoming" |

### `dailySchedule`
**Resumen del horario del día**

| Campo | Descripción |
|-------|-------------|
| `totalNaps` | Total de siestas esperadas |
| `completedNaps` | Siestas ya registradas |
| `remainingNaps` | Siestas que faltan |
| `napsCompleted[]` | Lista de siestas completadas |

### `nextNap`
**La próxima siesta inmediata** (la primera de `naps[]` que no ha pasado)

---

## 📱 Cómo Usar en Tu App

### 1. Mostrar Horario Completo del Día

```jsx
const SleepScheduleDay = ({ prediction }) => {
  const { dailySchedule } = prediction;

  return (
    <View>
      <Text>Horario de Hoy ({dailySchedule.totalNaps} siestas)</Text>
      <Text>Completadas: {dailySchedule.completedNaps}/{dailySchedule.totalNaps}</Text>
      
      {dailySchedule.naps.map((nap, index) => (
        <NapCard 
          key={index}
          nap={nap}
          isCompleted={nap.status === 'passed'}
          isNext={prediction.nextNap?.napNumber === nap.napNumber}
        />
      ))}
    </View>
  );
};
```

### 2. Mostrar Próxima Siesta

```jsx
const NextNapWidget = ({ prediction }) => {
  const { nextNap, dailySchedule } = prediction;

  if (!nextNap) {
    return <Text>No hay más siestas programadas hoy</Text>;
  }

  const minutesUntil = Math.floor(
    (new Date(nextNap.time) - new Date()) / 60000
  );

  return (
    <View>
      <Text>Próxima Siesta ({nextNap.napNumber}/{dailySchedule.totalNaps})</Text>
      <Text>{nextNap.type}</Text>
      <Text>{format(nextNap.time, 'HH:mm')}</Text>
      <Text>En {minutesUntil} minutos</Text>
      <ProgressBar 
        current={dailySchedule.completedNaps} 
        total={dailySchedule.totalNaps} 
      />
    </View>
  );
};
```

### 3. Timeline Visual del Día

```jsx
const DailyTimeline = ({ prediction }) => {
  const { dailySchedule, bedtime } = prediction;
  const now = new Date();

  return (
    <ScrollView horizontal>
      {dailySchedule.naps.map((nap, index) => {
        const napTime = new Date(nap.time);
        const isPast = napTime < now;
        
        return (
          <TimelineItem 
            key={index}
            time={format(napTime, 'HH:mm')}
            label={`Siesta ${nap.napNumber}`}
            icon={isPast ? '✅' : '😴'}
            isPast={isPast}
          />
        );
      })}
      
      <TimelineItem 
        time={format(bedtime.time, 'HH:mm')}
        label="Dormir"
        icon="🌙"
      />
    </ScrollView>
  );
};
```

### 4. Actualización Dinámica

```jsx
const SleepTracker = ({ childId }) => {
  const [prediction, setPrediction] = useState(null);

  const loadPrediction = async () => {
    const response = await fetch(`${API_URL}/api/sleep/predict/${childId}`);
    const data = await response.json();
    setPrediction(data.prediction);
  };

  // Recargar después de registrar siesta
  const onNapRecorded = async () => {
    await recordNap(...);
    await loadPrediction(); // 🔄 Actualiza el horario
  };

  return (
    <View>
      <DailyTimeline prediction={prediction} />
      <NextNapWidget prediction={prediction} />
      <Button title="Registrar Siesta" onPress={onNapRecorded} />
    </View>
  );
};
```

---

## 🔄 Actualización Dinámica

### El horario se actualiza automáticamente cuando:

1. ✅ **Registras una nueva siesta**
   ```javascript
   POST /api/sleep/record
   → Vuelve a llamar GET /api/sleep/predict/:childId
   → El horario se ajusta
   ```

2. ✅ **Eliminas una siesta**
   ```javascript
   DELETE /api/sleep/:eventId
   → Vuelve a llamar GET /api/sleep/predict/:childId
   → El horario se recalcula
   ```

3. ✅ **Editas una siesta**
   ```javascript
   PUT /api/sleep/:eventId
   → Vuelve a llamar GET /api/sleep/predict/:childId
   → El horario se ajusta
   ```

---

## 🗑️ Eliminar Siestas

### Endpoint Existente

```javascript
DELETE /api/sleep/:eventId
```

### Ejemplo de Uso

```javascript
const deleteSleepEvent = async (eventId) => {
  try {
    const response = await fetch(`${API_URL}/api/sleep/${eventId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.ok) {
      // Actualizar predicción
      await loadPrediction();
      Alert.alert('✅', 'Siesta eliminada');
    }
  } catch (error) {
    Alert.alert('Error', 'No se pudo eliminar');
  }
};
```

### UI Sugerida

```jsx
const NapHistoryItem = ({ nap, onDelete }) => {
  return (
    <View style={styles.napItem}>
      <View>
        <Text>{format(nap.startTime, 'HH:mm')}</Text>
        <Text>{nap.duration} min</Text>
      </View>
      
      <TouchableOpacity 
        onPress={() => {
          Alert.alert(
            'Eliminar',
            '¿Eliminar esta siesta?',
            [
              { text: 'Cancelar' },
              { 
                text: 'Eliminar', 
                onPress: () => onDelete(nap.id),
                style: 'destructive'
              }
            ]
          );
        }}
      >
        <Icon name="trash" color="red" />
      </TouchableOpacity>
    </View>
  );
};
```

---

## 📊 Ejemplo de Flujo Completo

### Escenario: Día con 3 siestas (bebé de 4 meses)

#### 8:00 AM - Ver predicción inicial
```json
{
  "dailySchedule": {
    "totalNaps": 3,
    "completedNaps": 0,
    "naps": [
      { "time": "09:00", "type": "Mañana", "status": "upcoming" },
      { "time": "13:00", "type": "Mediodía", "status": "upcoming" },
      { "time": "16:30", "type": "Tarde", "status": "upcoming" }
    ]
  }
}
```

#### 9:15 AM - Registrar primera siesta
```javascript
POST /api/sleep/record
{ startTime: "09:15", endTime: "10:00", duration: 45 }

// Actualizar predicción
GET /api/sleep/predict/:childId
```

#### Respuesta actualizada:
```json
{
  "dailySchedule": {
    "totalNaps": 3,
    "completedNaps": 1,  // ✅ Ahora es 1
    "naps": [
      { "time": "09:00", "status": "passed" },     // ✅ Marcada como pasada
      { "time": "13:15", "status": "upcoming" },   // 🔄 Ajustada
      { "time": "16:45", "status": "upcoming" }    // 🔄 Ajustada
    ]
  },
  "nextNap": {
    "time": "13:15",  // 🎯 Próxima siesta
    "napNumber": 2
  }
}
```

#### 1:30 PM - Eliminar siesta incorrecta
```javascript
DELETE /api/sleep/evt_123

// Actualizar predicción
GET /api/sleep/predict/:childId
```

#### Respuesta:
```json
{
  "dailySchedule": {
    "completedNaps": 0,  // 🔄 Vuelve a 0
    "naps": [
      { "time": "13:30", "status": "upcoming" },  // 🔄 Recalculada
      { "time": "16:30", "status": "upcoming" }
    ]
  }
}
```

---

## 🎨 UI Recomendada

### Timeline Horizontal
```
┌─────────────────────────────────────┐
│  Horario de Hoy (3 siestas)        │
├─────────────────────────────────────┤
│                                     │
│  ✅    →    😴    →    😴    →  🌙 │
│ 9:00   ahora  14:00   17:00   19:00│
│ Siesta  •    Siesta  Siesta  Dormir│
│  65min       60min   60min          │
│                                     │
│  Completadas: 1/3  ━━━━░░░░        │
└─────────────────────────────────────┘
```

### Cards de Siestas
```
┌─────────────────────────────────────┐
│  🌅 Siesta 1 - Mañana       ✅      │
│  9:00 - 10:05 (65 min)              │
│  Completada                         │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  ☀️ Siesta 2 - Mediodía      ⏰     │
│  14:00 (en 2h 15min)                │
│  60 min estimados                   │
│  Confianza: 85%                     │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  🌤️ Siesta 3 - Tarde         ⏰     │
│  17:00 (en 5h 15min)                │
│  60 min estimados                   │
│  Confianza: 80%                     │
└─────────────────────────────────────┘
```

---

## 🔍 Lógica de Predicción

### Con Historial (7+ días de datos)
1. Analiza patrones históricos
2. Identifica horarios más frecuentes
3. Genera predicciones basadas en patrones
4. Confianza: 60-90%

### Sin Historial (< 7 días)
1. Usa horarios por defecto según edad
2. Ajusta según ventanas de sueño
3. Confianza: 40-60%

### Actualización en Tiempo Real
- Cada registro/eliminación recalcula
- Se ajusta a ventanas de sueño reales
- Considera última siesta registrada

---

## ✅ Beneficios

### Para Padres:
- 📅 Visión completa del día
- ⏰ Mejor planificación de actividades
- 📊 Tracking de progreso (1/3, 2/3, 3/3)
- 🎯 Saben qué esperar

### Para la App:
- 📈 Mayor engagement
- 🔄 Actualización dinámica
- 💎 Funcionalidad premium
- 🎨 Mejores visualizaciones

---

## 🚀 Próximas Mejoras Posibles

- [ ] Notificaciones 15 min antes de cada siesta
- [ ] Modo "Auto-ajuste" según comportamiento real
- [ ] Comparación plan vs. realidad
- [ ] Estadísticas de cumplimiento
- [ ] Sugerencias de ajuste de horarios

---

## 📞 Endpoints Relacionados

```
GET    /api/sleep/predict/:childId        - Predicción completa del día
GET    /api/sleep/history/:childId        - Historial
POST   /api/sleep/record                  - Registrar siesta
PUT    /api/sleep/:eventId                - Editar siesta
DELETE /api/sleep/:eventId                - Eliminar siesta
PATCH  /api/sleep/:eventId/times          - Editar horarios
POST   /api/sleep/:eventId/pause          - Agregar pausa
DELETE /api/sleep/:eventId/pause/:pauseId - Eliminar pausa
```

---

**¡Ahora tienes predicción completa del día con actualización dinámica! 📅✨**

**Versión:** 1.3.0  
**Fecha:** 5 de Enero, 2026

