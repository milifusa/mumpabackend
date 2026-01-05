# 📝 Guía Completa - Edición de Siestas y Pausas

## 🎯 Funcionalidades de Edición

Ahora puedes editar completamente las siestas para:
- ✅ Cambiar hora de inicio (si empezó antes/después)
- ✅ Cambiar hora de fin (si terminó antes/después)
- ✅ Agregar pausas/interrupciones
- ✅ Eliminar pausas
- ✅ Modificar calidad, ubicación, notas, etc.

---

## 🛠️ Endpoints Disponibles

### 1. Actualización Completa del Evento
**PUT** `/api/sleep/:eventId`

Actualiza cualquier campo del evento de sueño.

### 2. Editar Solo Horarios
**PATCH** `/api/sleep/:eventId/times`

Actualiza solo los horarios de inicio/fin.

### 3. Agregar Pausa
**POST** `/api/sleep/:eventId/pause`

Agrega una pausa/interrupción al evento.

### 4. Eliminar Pausa
**DELETE** `/api/sleep/:eventId/pause/:pauseId`

Elimina una pausa específica.

---

## 📖 Ejemplos de Uso

### Ejemplo 1: Cambiar Hora de Inicio (Empezó Antes)

```javascript
// Situación: Registraste que el bebé se durmió a las 14:00,
// pero en realidad empezó a las 13:45

const eventId = 'sleep_evt_123';
const newStartTime = '2026-01-05T13:45:00Z'; // 15 minutos antes

const response = await fetch(`${API_URL}/api/sleep/${eventId}/times`, {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    startTime: newStartTime
  })
});

// Respuesta:
{
  "success": true,
  "message": "Horarios actualizados exitosamente",
  "sleepEvent": {
    "id": "sleep_evt_123",
    "startTime": "2026-01-05T13:45:00Z",
    "endTime": "2026-01-05T15:30:00Z",
    "duration": 105,
    "grossDuration": 105,
    "netDuration": 105
  }
}
```

### Ejemplo 2: Cambiar Hora de Fin

```javascript
// Situación: El bebé se despertó más tarde de lo que pensabas

const response = await fetch(`${API_URL}/api/sleep/${eventId}/times`, {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    endTime: '2026-01-05T16:00:00Z' // Terminó 30 min después
  })
});
```

### Ejemplo 3: Cambiar Ambos Horarios

```javascript
// Situación: Necesitas ajustar tanto inicio como fin

const response = await fetch(`${API_URL}/api/sleep/${eventId}/times`, {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    startTime: '2026-01-05T13:50:00Z',
    endTime: '2026-01-05T15:45:00Z'
  })
});
```

### Ejemplo 4: Agregar Pausa (Despertó y Volvió a Dormir)

```javascript
// Situación: El bebé se despertó 10 minutos en medio de la siesta

const response = await fetch(`${API_URL}/api/sleep/${eventId}/pause`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    startTime: '2026-01-05T14:30:00Z', // Cuando se despertó
    endTime: '2026-01-05T14:40:00Z',   // Cuando volvió a dormir
    reason: 'Despertó llorando'
  })
});

// Respuesta:
{
  "success": true,
  "message": "Pausa agregada exitosamente",
  "pause": {
    "id": "pause_1736098765432",
    "startTime": "2026-01-05T14:30:00Z",
    "endTime": "2026-01-05T14:40:00Z",
    "duration": 10,
    "reason": "Despertó llorando",
    "createdAt": "2026-01-05T15:00:00Z"
  },
  "totalPauses": 1,
  "netDuration": 80  // Duración original 90min - 10min de pausa
}
```

### Ejemplo 5: Agregar Pausa Solo con Duración

```javascript
// Situación: Sabes que hubo una pausa de 5 minutos pero no recuerdas exactamente cuándo

const response = await fetch(`${API_URL}/api/sleep/${eventId}/pause`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    duration: 5,
    reason: 'Breve despertar'
  })
});
```

### Ejemplo 6: Agregar Múltiples Pausas

```javascript
// Situación: Hubo varias interrupciones durante la siesta

// Primera pausa
await fetch(`${API_URL}/api/sleep/${eventId}/pause`, {
  method: 'POST',
  headers: { 
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    duration: 5,
    reason: 'Ruido externo'
  })
});

// Segunda pausa
await fetch(`${API_URL}/api/sleep/${eventId}/pause`, {
  method: 'POST',
  headers: { 
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    duration: 8,
    reason: 'Necesitó cambio de pañal'
  })
});

// Resultado: netDuration = grossDuration - (5 + 8) minutos
```

### Ejemplo 7: Eliminar Pausa

```javascript
// Situación: Te equivocaste al registrar una pausa

const pauseId = 'pause_1736098765432';

const response = await fetch(`${API_URL}/api/sleep/${eventId}/pause/${pauseId}`, {
  method: 'DELETE',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

// Respuesta:
{
  "success": true,
  "message": "Pausa eliminada exitosamente",
  "totalPauses": 0,
  "netDuration": 90  // Vuelve a la duración completa
}
```

### Ejemplo 8: Actualización Completa con Pausas

```javascript
// Situación: Actualizas todo el evento incluyendo pausas

const response = await fetch(`${API_URL}/api/sleep/${eventId}`, {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    startTime: '2026-01-05T13:45:00Z',
    endTime: '2026-01-05T15:30:00Z',
    quality: 'good',
    wakeUps: 2,
    notes: 'Dos interrupciones breves pero volvió a dormir',
    pauses: [
      {
        id: 'pause_1',
        duration: 5,
        reason: 'Primera interrupción'
      },
      {
        id: 'pause_2',
        duration: 8,
        reason: 'Segunda interrupción'
      }
    ]
  })
});
```

---

## 📊 Cálculo de Duraciones

El sistema ahora maneja tres tipos de duración:

### 1. **Gross Duration** (Duración Bruta)
Tiempo total desde inicio hasta fin, sin descontar pausas.
```
grossDuration = endTime - startTime
```

### 2. **Net Duration** (Duración Neta)
Tiempo efectivo de sueño, descontando pausas.
```
netDuration = grossDuration - suma(pausas)
```

### 3. **Duration** (Duración)
Por defecto es igual a `netDuration` (la duración efectiva de sueño).

### Ejemplo Visual:
```
Inicio: 14:00
Fin: 16:00
Pausa 1: 5 minutos
Pausa 2: 10 minutos

grossDuration = 120 minutos (2 horas)
netDuration = 105 minutos (120 - 5 - 10)
duration = 105 minutos
```

---

## 🎨 Componente React Native - Edición

```jsx
import React, { useState } from 'react';
import { View, Text, Button, TextInput } from 'react-native';

const EditSleepEvent = ({ eventId, initialData, onUpdate }) => {
  const [startTime, setStartTime] = useState(initialData.startTime);
  const [endTime, setEndTime] = useState(initialData.endTime);
  const [pauses, setPauses] = useState(initialData.pauses || []);

  // Editar horarios
  const updateTimes = async () => {
    const response = await fetch(`${API_URL}/api/sleep/${eventId}/times`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ startTime, endTime })
    });

    const data = await response.json();
    if (data.success) {
      alert('Horarios actualizados');
      onUpdate();
    }
  };

  // Agregar pausa
  const addPause = async (duration, reason) => {
    const response = await fetch(`${API_URL}/api/sleep/${eventId}/pause`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ duration, reason })
    });

    const data = await response.json();
    if (data.success) {
      setPauses([...pauses, data.pause]);
      alert('Pausa agregada');
    }
  };

  // Eliminar pausa
  const removePause = async (pauseId) => {
    const response = await fetch(`${API_URL}/api/sleep/${eventId}/pause/${pauseId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const data = await response.json();
    if (data.success) {
      setPauses(pauses.filter(p => p.id !== pauseId));
      alert('Pausa eliminada');
    }
  };

  return (
    <View>
      <Text>Editar Siesta</Text>
      
      {/* Editar horarios */}
      <View>
        <Text>Hora de inicio:</Text>
        <TextInput 
          value={startTime} 
          onChangeText={setStartTime}
          placeholder="2026-01-05T14:00:00Z"
        />
        
        <Text>Hora de fin:</Text>
        <TextInput 
          value={endTime} 
          onChangeText={setEndTime}
          placeholder="2026-01-05T15:30:00Z"
        />
        
        <Button title="Actualizar Horarios" onPress={updateTimes} />
      </View>

      {/* Pausas */}
      <View>
        <Text>Pausas:</Text>
        {pauses.map(pause => (
          <View key={pause.id}>
            <Text>{pause.duration} min - {pause.reason}</Text>
            <Button 
              title="Eliminar" 
              onPress={() => removePause(pause.id)} 
              color="red"
            />
          </View>
        ))}
        
        <Button 
          title="+ Agregar Pausa" 
          onPress={() => {
            // Mostrar modal para agregar pausa
            const duration = prompt('Duración (minutos):');
            const reason = prompt('Razón:');
            addPause(parseInt(duration), reason);
          }} 
        />
      </View>
    </View>
  );
};

export default EditSleepEvent;
```

---

## 🎯 Casos de Uso Comunes

### Caso 1: Bebé empezó a dormir antes
**Problema**: Olvidaste iniciar el registro cuando el bebé se durmió.

**Solución**:
```javascript
// Ajustar hora de inicio
PATCH /api/sleep/:eventId/times
{ "startTime": "hora_real_de_inicio" }
```

### Caso 2: Bebé se despertó brevemente
**Problema**: El bebé lloró 5 minutos y volvió a dormir.

**Solución**:
```javascript
// Agregar pausa
POST /api/sleep/:eventId/pause
{ "duration": 5, "reason": "Lloró brevemente" }
```

### Caso 3: Múltiples interrupciones
**Problema**: Hubo varias interrupciones durante la siesta.

**Solución**:
```javascript
// Agregar cada pausa
POST /api/sleep/:eventId/pause (múltiples veces)

// O actualizar el evento completo con array de pausas
PUT /api/sleep/:eventId
{ 
  "pauses": [
    { "id": "p1", "duration": 5, "reason": "Primera" },
    { "id": "p2", "duration": 10, "reason": "Segunda" }
  ]
}
```

### Caso 4: Corregir error en registro
**Problema**: Te equivocaste al registrar los horarios.

**Solución**:
```javascript
// Corregir ambos horarios
PATCH /api/sleep/:eventId/times
{
  "startTime": "hora_correcta_inicio",
  "endTime": "hora_correcta_fin"
}
```

---

## 📱 UI/UX Recomendado

### Pantalla de Edición Sugerida:

```
┌─────────────────────────────────┐
│  Editar Siesta                  │
├─────────────────────────────────┤
│                                 │
│  📅 Horarios                    │
│  ├─ Inicio:  [14:00] [📝]      │
│  └─ Fin:     [15:30] [📝]      │
│                                 │
│  💤 Duración                    │
│  ├─ Total:   90 min             │
│  ├─ Pausas:  15 min             │
│  └─ Efectiva: 75 min            │
│                                 │
│  ⏸️ Pausas/Interrupciones       │
│  ├─ 5 min - Ruido [❌]         │
│  ├─ 10 min - Lloró [❌]        │
│  └─ [➕ Agregar Pausa]          │
│                                 │
│  📝 Notas                       │
│  └─ [Campo de texto]            │
│                                 │
│  [💾 Guardar Cambios]           │
│                                 │
└─────────────────────────────────┘
```

---

## 🔍 Verificar Cambios

Después de editar, puedes verificar los cambios:

```javascript
// Obtener historial actualizado
const response = await fetch(`${API_URL}/api/sleep/history/${childId}?days=1`, {
  headers: { 'Authorization': `Bearer ${token}` }
});

const data = await response.json();
const event = data.sleepHistory.find(e => e.id === eventId);

console.log('Duración bruta:', event.grossDuration, 'min');
console.log('Duración neta:', event.netDuration, 'min');
console.log('Pausas:', event.pauses.length);
```

---

## ⚠️ Validaciones

El sistema valida automáticamente:

- ✅ **Horarios lógicos**: endTime debe ser después de startTime
- ✅ **Duración no negativa**: netDuration nunca será negativa
- ✅ **Propiedad**: Solo el dueño puede editar sus eventos
- ✅ **Recálculo automático**: Las duraciones se recalculan al cambiar horarios o pausas

---

## 🎉 Resumen

Ahora tienes **control total** sobre los eventos de sueño:

1. ✅ **Editar horarios** - Ajusta inicio y fin cuando sea necesario
2. ✅ **Agregar pausas** - Registra interrupciones durante el sueño
3. ✅ **Eliminar pausas** - Corrige errores en pausas registradas
4. ✅ **Actualización completa** - Cambia cualquier campo del evento
5. ✅ **Cálculos automáticos** - Duración neta se calcula automáticamente

---

## 📞 Endpoints Resumen

```
PUT    /api/sleep/:eventId              - Actualización completa
PATCH  /api/sleep/:eventId/times        - Solo horarios
POST   /api/sleep/:eventId/pause        - Agregar pausa
DELETE /api/sleep/:eventId/pause/:pauseId - Eliminar pausa
```

---

**¡Ahora puedes editar siestas con total flexibilidad! 📝✨**

