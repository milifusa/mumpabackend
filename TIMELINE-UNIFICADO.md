# 📅 Timeline Unificado: Hechos + Predicciones

## ✅ Problema Resuelto

**ANTES:**
- ❌ Siestas completadas separadas de las predicciones
- ❌ Difícil ver el progreso del día
- ❌ No se distinguía claramente pasado vs futuro

**AHORA:**
- ✅ **Timeline único** con todo el día
- ✅ **Hechos y predicciones juntos** ordenados por hora
- ✅ **Progreso visual** del día (33%, 67%, 100%)
- ✅ **Clara distinción** entre lo que ya pasó y lo que viene

---

## 🎯 Formato de Respuesta

### Nuevo Formato (v1.3.0)

```json
{
  "success": true,
  "prediction": {
    "dailySchedule": {
      "date": "2026-01-06",
      
      "allNaps": [
        {
          "time": "2026-01-06T09:00:00Z",
          "startTime": "2026-01-06T09:00:00Z",
          "endTime": "2026-01-06T10:27:00Z",
          "duration": 87,
          "actualDuration": 87,
          "quality": "good",
          "status": "completed",
          "type": "completed",
          "isReal": true,           // ✅ HECHO
          "id": "abc123"
        },
        {
          "time": "2026-01-06T13:00:00Z",
          "expectedDuration": 102,
          "confidence": 75,
          "status": "upcoming",
          "type": "prediction",
          "isReal": false,          // 🔮 PREDICCIÓN
          "napNumber": 2,
          "windowStart": "2026-01-06T12:30:00Z",
          "windowEnd": "2026-01-06T13:30:00Z"
        },
        {
          "time": "2026-01-06T16:30:00Z",
          "expectedDuration": 65,
          "confidence": 70,
          "status": "upcoming",
          "type": "prediction",
          "isReal": false,          // 🔮 PREDICCIÓN
          "napNumber": 3,
          "windowStart": "2026-01-06T16:00:00Z",
          "windowEnd": "2026-01-06T17:00:00Z"
        }
      ],
      
      "totalExpected": 3,
      "completed": 1,
      "remaining": 2,
      
      "progress": {
        "completed": 1,
        "total": 3,
        "percentage": 33          // ✅ 33% del día completado
      }
    }
  }
}
```

---

## 📊 Ejemplo Visual del Día

### Escenario: 6 de Enero, 2:00 PM

```
┌─────────────────────────────────────────────────────────┐
│  📅 Horario de Máximo - Lunes 6 de Enero               │
│  Progreso del día: ████████░░░░░░░░░░░░ 33%            │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ✅ 9:00 AM  - COMPLETADA (87 min)                     │
│     └─ Calidad: Buena                                  │
│     └─ Real: Sí                                        │
│     └─ Status: completed                               │
│                                                         │
│  ⏰ AHORA: 2:00 PM                                     │
│                                                         │
│  🔮 1:00 PM  - PREDICCIÓN (102 min)                    │
│     └─ Ventana: 12:30 PM - 1:30 PM                    │
│     └─ Confianza: 75%                                  │
│     └─ Status: upcoming                                │
│                                                         │
│  🔮 4:30 PM  - PREDICCIÓN (65 min)                     │
│     └─ Ventana: 4:00 PM - 5:00 PM                     │
│     └─ Confianza: 70%                                  │
│     └─ Status: upcoming                                │
│                                                         │
│  🌙 7:00 PM  - Hora de dormir                          │
└─────────────────────────────────────────────────────────┘

Siestas: 1/3 completadas (2 pendientes)
```

---

## 🎨 Cómo Mostrar en la UI

### Componente React Native

```jsx
import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

const DailyNapTimeline = ({ dailySchedule }) => {
  const { allNaps, progress } = dailySchedule;

  return (
    <View style={styles.container}>
      {/* Barra de Progreso */}
      <View style={styles.progressContainer}>
        <Text style={styles.progressText}>
          Progreso del día: {progress.completed}/{progress.total}
        </Text>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${progress.percentage}%` }
            ]} 
          />
        </View>
        <Text style={styles.progressPercentage}>
          {progress.percentage}%
        </Text>
      </View>

      {/* Timeline de Siestas */}
      <ScrollView style={styles.timeline}>
        {allNaps.map((nap, index) => (
          <NapCard 
            key={nap.id || index} 
            nap={nap} 
            index={index}
          />
        ))}
      </ScrollView>
    </View>
  );
};

const NapCard = ({ nap, index }) => {
  const isCompleted = nap.status === 'completed';
  const isPrediction = nap.status === 'upcoming';
  
  const time = format(parseISO(nap.time), 'h:mm a', { locale: es });
  
  return (
    <View style={[
      styles.napCard,
      isCompleted && styles.completedCard,
      isPrediction && styles.predictionCard
    ]}>
      {/* Icono de Estado */}
      <View style={styles.iconContainer}>
        {isCompleted ? (
          <Text style={styles.completedIcon}>✅</Text>
        ) : (
          <Text style={styles.predictionIcon}>🔮</Text>
        )}
      </View>

      {/* Contenido */}
      <View style={styles.cardContent}>
        <Text style={styles.napTime}>{time}</Text>
        
        {isCompleted ? (
          <>
            <Text style={styles.napStatus}>COMPLETADA</Text>
            <Text style={styles.napDuration}>
              Duración: {nap.duration} min
            </Text>
            <Text style={styles.napQuality}>
              Calidad: {nap.quality}
            </Text>
          </>
        ) : (
          <>
            <Text style={styles.napStatus}>PREDICCIÓN</Text>
            <Text style={styles.napDuration}>
              Duración esperada: {nap.expectedDuration} min
            </Text>
            <Text style={styles.napConfidence}>
              Confianza: {nap.confidence}%
            </Text>
            <Text style={styles.napWindow}>
              Ventana: {format(parseISO(nap.windowStart), 'h:mm a')} - 
              {format(parseISO(nap.windowEnd), 'h:mm a')}
            </Text>
          </>
        )}
      </View>

      {/* Badge de Tipo */}
      <View style={[
        styles.badge,
        isCompleted && styles.completedBadge,
        isPrediction && styles.predictionBadge
      ]}>
        <Text style={styles.badgeText}>
          {isCompleted ? 'HECHO' : 'FUTURO'}
        </Text>
      </View>
    </View>
  );
};

const styles = {
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5'
  },
  progressContainer: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  progressText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333'
  },
  progressBar: {
    height: 12,
    backgroundColor: '#e0e0e0',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 8
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 6
  },
  progressPercentage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'right'
  },
  timeline: {
    flex: 1
  },
  napCard: {
    flexDirection: 'row',
    padding: 16,
    marginBottom: 12,
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  completedCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50'
  },
  predictionCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3'
  },
  iconContainer: {
    marginRight: 12,
    justifyContent: 'center'
  },
  completedIcon: {
    fontSize: 32
  },
  predictionIcon: {
    fontSize: 32
  },
  cardContent: {
    flex: 1
  },
  napTime: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4
  },
  napStatus: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8
  },
  napDuration: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4
  },
  napQuality: {
    fontSize: 14,
    color: '#666'
  },
  napConfidence: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4
  },
  napWindow: {
    fontSize: 12,
    color: '#999'
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start'
  },
  completedBadge: {
    backgroundColor: '#E8F5E9'
  },
  predictionBadge: {
    backgroundColor: '#E3F2FD'
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#666'
  }
};

export default DailyNapTimeline;
```

---

## 🎯 Campos Clave

### Para Siestas Completadas (`isReal: true`)

```javascript
{
  "time": "2026-01-06T09:00:00Z",      // Hora de inicio
  "startTime": "2026-01-06T09:00:00Z", // Hora de inicio
  "endTime": "2026-01-06T10:27:00Z",   // Hora de fin
  "duration": 87,                      // Duración real
  "actualDuration": 87,                // Duración real
  "quality": "good",                   // Calidad del sueño
  "status": "completed",               // ✅ Estado
  "type": "completed",                 // ✅ Tipo
  "isReal": true,                      // ✅ Es un hecho
  "id": "abc123"                       // ID en Firestore
}
```

### Para Predicciones (`isReal: false`)

```javascript
{
  "time": "2026-01-06T13:00:00Z",      // Hora predicha
  "expectedDuration": 102,             // Duración esperada
  "confidence": 75,                    // % de confianza
  "status": "upcoming",                // 🔮 Estado
  "type": "prediction",                // 🔮 Tipo
  "isReal": false,                     // 🔮 Es predicción
  "napNumber": 2,                      // Número de siesta
  "windowStart": "...",                // Inicio ventana
  "windowEnd": "..."                   // Fin ventana
}
```

---

## 📈 Progreso del Día

### Objeto `progress`

```javascript
{
  "completed": 1,      // Siestas completadas
  "total": 3,          // Total esperado hoy
  "percentage": 33     // Porcentaje completado
}
```

### Cálculo del Porcentaje

```javascript
percentage = Math.round((completed / total) * 100)

Ejemplos:
- 0/3 siestas = 0%
- 1/3 siestas = 33%
- 2/3 siestas = 67%
- 3/3 siestas = 100%
```

---

## 🔄 Evolución Durante el Día

### 9:00 AM - Inicio del Día

```json
{
  "allNaps": [
    { "time": "09:00", "status": "upcoming", "isReal": false },
    { "time": "13:00", "status": "upcoming", "isReal": false },
    { "time": "16:30", "status": "upcoming", "isReal": false }
  ],
  "progress": { "completed": 0, "total": 3, "percentage": 0 }
}
```

### 10:30 AM - Primera Siesta Completada

```json
{
  "allNaps": [
    { "time": "09:00", "status": "completed", "isReal": true },  // ✅
    { "time": "13:00", "status": "upcoming", "isReal": false },
    { "time": "16:30", "status": "upcoming", "isReal": false }
  ],
  "progress": { "completed": 1, "total": 3, "percentage": 33 }
}
```

### 2:00 PM - Segunda Siesta Completada

```json
{
  "allNaps": [
    { "time": "09:00", "status": "completed", "isReal": true },  // ✅
    { "time": "13:00", "status": "completed", "isReal": true },  // ✅
    { "time": "16:30", "status": "upcoming", "isReal": false }
  ],
  "progress": { "completed": 2, "total": 3, "percentage": 67 }
}
```

### 5:30 PM - Todas Completadas

```json
{
  "allNaps": [
    { "time": "09:00", "status": "completed", "isReal": true },  // ✅
    { "time": "13:00", "status": "completed", "isReal": true },  // ✅
    { "time": "16:30", "status": "completed", "isReal": true }   // ✅
  ],
  "progress": { "completed": 3, "total": 3, "percentage": 100 }
}
```

---

## 🎨 Ideas de UI

### 1. Lista con Línea de Tiempo

```
┌─────────────────────────────┐
│  Progreso: ████████░░ 67%   │
├─────────────────────────────┤
│                             │
│  ✅ 9:00 AM                 │
│  │  Completada (87 min)    │
│  │                          │
│  ✅ 1:00 PM                 │
│  │  Completada (102 min)   │
│  │                          │
│  ⏰ AHORA (2:30 PM)         │
│  │                          │
│  🔮 4:30 PM                 │
│     Predicción (65 min)     │
│                             │
└─────────────────────────────┘
```

### 2. Cards Horizontales

```
┌──────────────────────────────────────────────────┐
│  Progreso del día: 2/3 (67%)                     │
│  ████████████████████████░░░░░░░░░░░░            │
└──────────────────────────────────────────────────┘

┌─────────┐  ┌─────────┐  ┌─────────┐
│ ✅ 9:00 │  │ ✅ 1:00 │  │ 🔮 4:30 │
│ 87 min  │  │ 102 min │  │ 65 min  │
│ Buena   │  │ Buena   │  │ Pred.   │
└─────────┘  └─────────┘  └─────────┘
```

### 3. Timeline Vertical con Línea

```
     ✅ ─────  9:00 AM
     │        Completada
     │        87 minutos
     │        Calidad: Buena
     │
     ✅ ─────  1:00 PM
     │        Completada
     │        102 minutos
     │        Calidad: Excelente
     │
    ⏰ ─────  AHORA (2:30 PM)
     │
     🔮 ─────  4:30 PM
     │        Predicción
     │        65 minutos
     │        Confianza: 70%
     │
     🌙 ─────  7:00 PM
              Hora de dormir
```

---

## 🔍 Filtros Útiles

### Obtener Solo Completadas

```javascript
const completedNaps = allNaps.filter(nap => nap.isReal === true);
```

### Obtener Solo Predicciones

```javascript
const predictions = allNaps.filter(nap => nap.isReal === false);
```

### Obtener Próxima Siesta

```javascript
const now = new Date();
const nextNap = allNaps.find(nap => 
  parseISO(nap.time) > now && nap.status === 'upcoming'
);
```

### Verificar si Todas Completadas

```javascript
const allCompleted = allNaps.every(nap => nap.status === 'completed');
```

---

## 🎯 Ventajas del Sistema

### 1. **Vista Unificada**
- Todo el día en un solo lugar
- No hay que combinar arrays manualmente
- Ordenado cronológicamente

### 2. **Progreso Visual**
- Fácil mostrar barra de progreso
- Porcentaje calculado automáticamente
- Motivación para completar el día

### 3. **Clara Distinción**
- `isReal: true/false` para diferenciar
- `status: 'completed'/'upcoming'`
- Colores diferentes en UI

### 4. **Fácil Implementación**
- Un solo array para iterar
- Campos consistentes
- Lógica simple en frontend

### 5. **Actualización Dinámica**
- Cada vez que se registra una siesta
- El progreso se actualiza automáticamente
- Las predicciones se ajustan

---

## 📊 Métricas de Progreso

### Estados Posibles

```
0%   - Día recién empezado (ninguna siesta)
33%  - 1 de 3 siestas completadas
50%  - 1 de 2 siestas completadas
67%  - 2 de 3 siestas completadas
100% - Todas las siestas completadas
```

### Mensajes Motivacionales

```javascript
const getMotivationalMessage = (percentage) => {
  if (percentage === 0) return "¡Comencemos el día! 🌅";
  if (percentage < 50) return "¡Buen comienzo! 💪";
  if (percentage < 100) return "¡Casi terminamos! 🎯";
  return "¡Día completado! 🎉";
};
```

---

## 🚀 Ya Desplegado

```
✅ Commit: c918c0a
✅ GitHub: Actualizado
✅ Vercel: En producción
✅ URL: https://mumpabackend-65eqqq9dh-mishu-lojans-projects.vercel.app
```

---

## 🧪 Ejemplo de Uso en App

```javascript
// Obtener predicción
const response = await fetch(
  `${API_URL}/api/sleep/predict/${childId}`
);
const data = await response.json();

const { dailySchedule } = data.prediction;

// Mostrar progreso
console.log(`Progreso: ${dailySchedule.progress.percentage}%`);
console.log(`Completadas: ${dailySchedule.progress.completed}/${dailySchedule.progress.total}`);

// Iterar todas las siestas del día
dailySchedule.allNaps.forEach(nap => {
  if (nap.isReal) {
    console.log(`✅ ${nap.time}: Completada (${nap.duration} min)`);
  } else {
    console.log(`🔮 ${nap.time}: Predicción (${nap.expectedDuration} min)`);
  }
});
```

---

## ✨ Resumen

### Lo que cambió:
- ❌ Antes: Siestas completadas y predicciones separadas
- ✅ Ahora: Timeline unificado con todo el día

### Beneficios:
- 📅 **Vista completa del día** en un solo array
- ✅ **Hechos claramente marcados** (`isReal: true`)
- 🔮 **Predicciones identificables** (`isReal: false`)
- 📊 **Progreso calculado automáticamente**
- 🎨 **Fácil de mostrar en UI**

**¡Ahora puedes mostrar un timeline completo del día con progreso! 🎉📅✨**

