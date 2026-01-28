# 🐛 FIX: Problema con Hora de Despertar (AM/PM)

**Fecha:** 2026-01-12  
**Issue:** Se registró 8:17 AM como 2:17 AM  
**Status:** ✅ DEBUGGING MEJORADO Y DESPLEGADO

---

## 🔍 PROBLEMA REPORTADO

```
Usuario ingresó: 8:17 AM
Se registró como: 2:17 AM
```

**Diferencia:** 6 horas = Posible problema de timezone o formato AM/PM

---

## ✅ SOLUCIÓN IMPLEMENTADA

### 1. Logging Extendido

Ahora el endpoint `POST /api/sleep/wake-time` muestra información detallada:

```javascript
console.log('🔍 [WAKE TIME DEBUG] ====================================');
console.log('📥 Received wakeTime:', wakeTime);
console.log('🌍 Received timezone:', timezone);
console.log('📅 Parsed Date Object:', wakeTimeDate);
console.log('📅 ISO String:', wakeTimeDate.toISOString());
console.log('📅 Hours (UTC):', wakeTimeDate.getUTCHours());
console.log('📅 Hours (Local):', wakeTimeDate.getHours());
console.log('⏰ Validation - Local Hours:', hours);
console.log('⏰ Validation - UTC Hours:', utcHours);
```

### 2. Validación de Hora Sospechosa

Si la hora está entre 2 AM y 5 AM, se registra una alerta:

```javascript
if (hours >= 2 && hours < 5) {
  console.warn('⚠️ ALERTA: Hora de despertar sospechosa (2 AM - 5 AM)');
  console.warn('⚠️ Es posible que haya un problema con AM/PM en el frontend');
}
```

### 3. Respuesta con Debug Info

Ahora la respuesta incluye información de debug:

```json
{
  "success": true,
  "id": "doc_id",
  "message": "Hora de despertar registrada exitosamente",
  "wakeTime": "2026-01-12T14:17:00.000Z",
  "localTime": "8:17 AM",
  "debug": {
    "receivedWakeTime": "2026-01-12T08:17:00",
    "parsedISOString": "2026-01-12T14:17:00.000Z",
    "localHours": 8,
    "utcHours": 14,
    "timezone": "America/Mexico_City"
  }
}
```

---

## 🔎 CÓMO DIAGNOSTICAR

### Paso 1: Verificar Request desde Frontend

Cuando registres una hora de despertar, verifica en la respuesta:

```typescript
const response = await fetch('/api/sleep/wake-time', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    childId: 'child_123',
    wakeTime: '2026-01-12T08:17:00',  // ¿Qué formato estás enviando?
    timezone: 'America/Mexico_City'
  })
});

const data = await response.json();
console.log('🔍 Debug info:', data.debug);
```

### Paso 2: Revisar Logs en Vercel

1. Ve a: https://vercel.com/mishu-lojans-projects/mumpabackend
2. Click en "Functions"
3. Busca logs con `[WAKE TIME DEBUG]`
4. Verifica los valores registrados

---

## 🛠️ POSIBLES CAUSAS Y SOLUCIONES

### Causa 1: Frontend Enviando Hora Local Sin Timezone

**Problema:**
```typescript
// ❌ MAL: Enviar hora sin timezone explícito
const wakeTime = '2026-01-12T08:17:00';  // ¿Es UTC o local?
```

**Solución:**
```typescript
// ✅ BIEN: Especificar timezone explícito
const wakeTime = '2026-01-12T08:17:00-06:00';  // Mexico City

// O mejor aún, usar Date con timezone
import { format, zonedTimeToUtc } from 'date-fns-tz';

const userTimezone = 'America/Mexico_City';
const localTime = new Date('2026-01-12T08:17:00'); // Hora local del usuario
const utcTime = zonedTimeToUtc(localTime, userTimezone);

await fetch('/api/sleep/wake-time', {
  method: 'POST',
  body: JSON.stringify({
    childId: childId,
    wakeTime: utcTime.toISOString(),  // Enviar como UTC
    timezone: userTimezone
  })
});
```

---

### Causa 2: Componente de Time Picker Usando 24h en vez de 12h

**Problema:**
```typescript
// Si el usuario selecciona 8:17 AM
// Pero el picker está en formato 24h y lo interpreta como 08:17 UTC
// Cuando debería ser 08:17 hora local
```

**Solución en React Native:**
```typescript
import DateTimePicker from '@react-native-community/datetimepicker';
import { zonedTimeToUtc } from 'date-fns-tz';

function WakeTimePicker() {
  const [wakeTime, setWakeTime] = useState(new Date());
  const userTimezone = 'America/Mexico_City';

  const handleSave = async () => {
    // Convertir hora local a UTC antes de enviar
    const utcTime = zonedTimeToUtc(wakeTime, userTimezone);
    
    console.log('📅 Hora seleccionada (local):', wakeTime.toString());
    console.log('📅 Hora en UTC:', utcTime.toISOString());
    
    await fetch('/api/sleep/wake-time', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        childId: childId,
        wakeTime: utcTime.toISOString(),
        timezone: userTimezone
      })
    });
  };

  return (
    <DateTimePicker
      value={wakeTime}
      mode="time"
      is24Hour={false}  // ✅ IMPORTANTE: Usar formato 12h con AM/PM
      display="spinner"
      onChange={(event, selectedDate) => {
        if (selectedDate) {
          setWakeTime(selectedDate);
        }
      }}
    />
  );
}
```

---

### Causa 3: Backend Interpretando Mal el Timezone

**Antes (Sin validación):**
```javascript
// El backend recibía la hora y la guardaba sin verificar
wakeTime: admin.firestore.Timestamp.fromDate(new Date(wakeTime))
```

**Ahora (Con validación):**
```javascript
// Ahora verifica y loggea toda la información
const wakeTimeDate = new Date(wakeTime);
console.log('📅 Parsed Date Object:', wakeTimeDate);
console.log('📅 Hours (Local):', wakeTimeDate.getHours());

// Alerta si la hora es sospechosa
if (hours >= 2 && hours < 5) {
  console.warn('⚠️ ALERTA: Hora sospechosa');
}
```

---

## 🧪 PRUEBA DE VALIDACIÓN

### Caso 1: Enviar 8:17 AM (Correcto)

**Request:**
```json
{
  "childId": "child_123",
  "wakeTime": "2026-01-12T08:17:00-06:00",
  "timezone": "America/Mexico_City"
}
```

**Respuesta Esperada:**
```json
{
  "success": true,
  "localTime": "8:17 AM",  ✅
  "debug": {
    "localHours": 8,  ✅
    "utcHours": 14,
    "timezone": "America/Mexico_City"
  }
}
```

---

### Caso 2: Error de AM/PM (8:17 AM → 2:17 AM)

**Request Problemático:**
```json
{
  "childId": "child_123",
  "wakeTime": "2026-01-12T02:17:00-06:00",  ❌ 2 AM en lugar de 8 AM
  "timezone": "America/Mexico_City"
}
```

**Respuesta con Alerta:**
```json
{
  "success": true,
  "localTime": "2:17 AM",  ⚠️
  "debug": {
    "localHours": 2,  ⚠️ SOSPECHOSO
    "utcHours": 8
  }
}
```

**Log en Consola:**
```
⚠️ ALERTA: Hora de despertar sospechosa (2 AM - 5 AM)
⚠️ Es posible que haya un problema con AM/PM en el frontend
```

---

## 📱 CÓDIGO RECOMENDADO PARA FRONTEND

### Opción 1: React Native con date-fns-tz

```typescript
import DateTimePicker from '@react-native-community/datetimepicker';
import { zonedTimeToUtc, format } from 'date-fns-tz';

const WakeTimeSelector = () => {
  const [wakeTime, setWakeTime] = useState(new Date());
  const userTimezone = 'America/Mexico_City';

  const saveWakeTime = async () => {
    try {
      // 1. Mostrar hora local al usuario
      const localTimeDisplay = format(wakeTime, 'h:mm a', { 
        timeZone: userTimezone 
      });
      console.log('⏰ Hora seleccionada:', localTimeDisplay);

      // 2. Convertir a UTC para enviar al backend
      const utcTime = zonedTimeToUtc(wakeTime, userTimezone);
      console.log('🌍 Hora en UTC:', utcTime.toISOString());

      // 3. Enviar al backend
      const response = await fetch(
        'https://api.munpa.online/api/sleep/wake-time',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            childId: currentChildId,
            wakeTime: utcTime.toISOString(),
            timezone: userTimezone
          })
        }
      );

      const data = await response.json();

      // 4. Verificar respuesta
      console.log('✅ Registrado:', data.localTime);
      console.log('🔍 Debug:', data.debug);

      // 5. Alertar si hay problema
      if (data.debug.localHours >= 2 && data.debug.localHours < 5) {
        Alert.alert(
          '⚠️ Hora Sospechosa',
          `Se registró ${data.localTime}. ¿Es correcto?`,
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Sí, es correcto', onPress: () => {} }
          ]
        );
      }

    } catch (error) {
      console.error('❌ Error:', error);
      Alert.alert('Error', 'No se pudo registrar la hora de despertar');
    }
  };

  return (
    <View>
      <Text>Selecciona la hora de despertar:</Text>
      
      <DateTimePicker
        value={wakeTime}
        mode="time"
        is24Hour={false}  // ✅ Importante: Mostrar AM/PM
        display="spinner"
        onChange={(event, selectedDate) => {
          if (selectedDate) {
            setWakeTime(selectedDate);
          }
        }}
      />

      <Button title="Guardar" onPress={saveWakeTime} />
    </View>
  );
};
```

---

### Opción 2: React Native sin date-fns-tz

```typescript
const WakeTimeSelector = () => {
  const [wakeTime, setWakeTime] = useState(new Date());

  const saveWakeTime = async () => {
    // Obtener offset del timezone del usuario
    const userTimezone = 'America/Mexico_City';
    const timezoneOffset = -6; // Mexico City es UTC-6

    // Crear fecha UTC desde la hora local
    const year = wakeTime.getFullYear();
    const month = wakeTime.getMonth();
    const day = wakeTime.getDate();
    const hours = wakeTime.getHours();
    const minutes = wakeTime.getMinutes();

    // Crear fecha en UTC ajustando el offset
    const utcDate = new Date(Date.UTC(
      year,
      month,
      day,
      hours - timezoneOffset,  // Ajustar por timezone
      minutes
    ));

    console.log('📅 Hora local:', wakeTime.toLocaleString());
    console.log('🌍 Hora UTC:', utcDate.toISOString());

    const response = await fetch(
      'https://api.munpa.online/api/sleep/wake-time',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          childId: currentChildId,
          wakeTime: utcDate.toISOString(),
          timezone: userTimezone
        })
      }
    );

    const data = await response.json();
    console.log('✅ Respuesta:', data);
  };

  return (
    <DateTimePicker
      value={wakeTime}
      mode="time"
      is24Hour={false}
      onChange={(event, date) => date && setWakeTime(date)}
    />
  );
};
```

---

## 🎯 CHECKLIST DE VERIFICACIÓN

### En el Frontend:

- [ ] El time picker está configurado con `is24Hour={false}` para mostrar AM/PM
- [ ] Se está convirtiendo correctamente la hora local a UTC antes de enviar
- [ ] Se está enviando el campo `timezone` en el request
- [ ] Se verifica la respuesta del servidor con `data.debug`
- [ ] Se muestra alerta al usuario si la hora registrada es sospechosa

### En el Backend:

- [x] Se agregó logging detallado
- [x] Se valida si la hora está en rango sospechoso (2-5 AM)
- [x] Se retorna información de debug en la respuesta
- [x] Se guarda el timezone junto con la hora

---

## 🔧 PRÓXIMOS PASOS

1. **Verificar Request del Frontend:**
   - Intenta registrar otra hora de despertar
   - Revisa los logs en Vercel
   - Verifica la respuesta con `data.debug`

2. **Si el Problema Persiste:**
   - Comparte los logs de `[WAKE TIME DEBUG]`
   - Comparte el código del componente que registra la hora
   - Verifica el timezone configurado en el perfil del niño

3. **Corrección en Frontend:**
   - Implementar uno de los códigos de arriba
   - Probar con varias horas (7 AM, 8 AM, 9 AM)
   - Verificar que se registren correctamente

---

## 📊 EJEMPLO VISUAL DEL PROBLEMA

### Escenario Actual (Problema):

```
┌─────────────────────────────────────────────┐
│ FRONTEND (App)                              │
├─────────────────────────────────────────────┤
│ Usuario selecciona: 8:17 AM                 │
│ Picker devuelve: Date(2026-01-12 08:17)    │
│ Se envía: "2026-01-12T08:17:00"            │ ❌ Sin timezone!
└─────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────┐
│ BACKEND                                     │
├─────────────────────────────────────────────┤
│ Recibe: "2026-01-12T08:17:00"              │
│ Interpreta como UTC: 08:17 UTC             │
│ Convierte a local: 02:17 AM (México)       │ ❌ INCORRECTO!
└─────────────────────────────────────────────┘
```

### Solución Correcta:

```
┌─────────────────────────────────────────────┐
│ FRONTEND (App)                              │
├─────────────────────────────────────────────┤
│ Usuario selecciona: 8:17 AM                 │
│ Picker devuelve: Date(2026-01-12 08:17)    │
│ Convierte a UTC: 14:17 UTC                 │ ✅
│ Envía: "2026-01-12T14:17:00.000Z"          │ ✅
│ + timezone: "America/Mexico_City"           │ ✅
└─────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────┐
│ BACKEND                                     │
├─────────────────────────────────────────────┤
│ Recibe: "2026-01-12T14:17:00.000Z"         │
│ Parsea: 14:17 UTC                          │
│ Convierte a local: 08:17 AM (México)       │ ✅ CORRECTO!
│ Retorna: localTime: "8:17 AM"              │ ✅
└─────────────────────────────────────────────┘
```

---

**Status:** ✅ Sistema de debugging desplegado. Ahora podemos diagnosticar exactamente dónde está el problema.

**Próximo paso:** Prueba registrar otra hora y compárteme los logs o la respuesta del servidor para ver qué está pasando.
