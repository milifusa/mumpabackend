# 🌍 GUÍA DE ZONAS HORARIAS

## 🎯 Problema Resuelto

Antes teníamos problemas donde:
- El servidor está en UTC
- Los usuarios están en diferentes zonas horarias (ej: UTC-6, México)
- "Hoy" en UTC no es "hoy" en México
- Las predicciones mostraban horarios incorrectos

## ✅ Solución Implementada

El backend ahora acepta la **zona horaria del usuario** y hace todos los cálculos correctamente.

---

## 📱 CÓMO ENVIAR LA TIMEZONE DESDE EL FRONTEND

### **Opción 1: Header HTTP (Recomendado)**

```javascript
// React Native / Expo
import * as Localization from 'expo-localization';

const timezone = Localization.timezone; // 'America/Mexico_City'

const response = await fetch('/api/sleep/predict/K6vfrj...', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'X-Timezone': timezone  // ✅ Enviar timezone
  }
});
```

### **Opción 2: Query Parameter**

```javascript
const response = await fetch(`/api/sleep/predict/K6vfrj...?timezone=${timezone}`, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

### **Opción 3: Body (solo para POST)**

```javascript
const response = await fetch('/api/sleep/wake-time', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    childId: 'K6vfrj...',
    wakeTime: '2026-01-08T13:15:00.000Z',
    timezone: 'America/Mexico_City'  // ✅ Enviar timezone
  })
});
```

---

## 🌎 ZONAS HORARIAS SOPORTADAS

El sistema acepta cualquier timezone válida de IANA:

### **México:**
- `America/Mexico_City` (UTC-6)
- `America/Cancun` (UTC-5)
- `America/Tijuana` (UTC-8)
- `America/Hermosillo` (UTC-7)

### **USA:**
- `America/New_York` (UTC-5)
- `America/Chicago` (UTC-6)
- `America/Los_Angeles` (UTC-8)

### **España:**
- `Europe/Madrid` (UTC+1)

### **Argentina:**
- `America/Argentina/Buenos_Aires` (UTC-3)

**Lista completa:** https://en.wikipedia.org/wiki/List_of_tz_database_time_zones

---

## 🔧 OBTENER TIMEZONE EN EL FRONTEND

### **React Native (Expo)**

```javascript
import * as Localization from 'expo-localization';

// Obtener timezone del dispositivo
const timezone = Localization.timezone;
console.log(timezone); // 'America/Mexico_City'

// Obtener locale
const locale = Localization.locale;
console.log(locale); // 'es-MX'
```

### **React Native (sin Expo)**

```javascript
import { NativeModules, Platform } from 'react-native';

const getDeviceTimezone = () => {
  const { TimeZone } = NativeModules;
  
  if (Platform.OS === 'ios') {
    return TimeZone.getTimeZone();
  } else {
    return TimeZone.getTimeZone();
  }
};

const timezone = getDeviceTimezone();
```

### **React Web**

```javascript
// Obtener timezone del navegador
const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
console.log(timezone); // 'America/Mexico_City'
```

---

## 📊 ENDPOINTS QUE USAN TIMEZONE

Todos estos endpoints ahora consideran la timezone del usuario:

| Endpoint | Método | Usa Timezone |
|----------|--------|--------------|
| `/api/sleep/predict/:childId` | GET | ✅ Sí |
| `/api/sleep/wake-time/:childId` | GET | ✅ Sí |
| `/api/sleep/wake-time` | POST | ✅ Sí |
| `/api/sleep/reminders/:childId` | GET | ✅ Sí |
| `/api/sleep/history/:childId` | GET | ⚠️ Opcional |

---

## 🧪 EJEMPLO COMPLETO

### **Configurar en tu API Client**

```javascript
// utils/apiClient.js
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'https://mumpabackend.vercel.app';

export const apiClient = {
  async request(endpoint, options = {}) {
    const token = await AsyncStorage.getItem('authToken');
    const timezone = Localization.timezone;
    
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-Timezone': timezone,  // ✅ Siempre enviar timezone
      ...options.headers
    };
    
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers
    });
    
    return response.json();
  },
  
  get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  },
  
  post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
};
```

### **Usar en tu Componente**

```javascript
// screens/SleepPrediction.js
import { apiClient } from '../utils/apiClient';

const SleepPredictionScreen = () => {
  const [prediction, setPrediction] = useState(null);
  
  useEffect(() => {
    loadPrediction();
  }, []);
  
  const loadPrediction = async () => {
    try {
      // ✅ El timezone se envía automáticamente
      const data = await apiClient.get(`/api/sleep/predict/${childId}`);
      setPrediction(data.prediction);
    } catch (error) {
      console.error('Error:', error);
    }
  };
  
  return (
    <View>
      {prediction && (
        <>
          <Text>Próxima siesta: {formatTime(prediction.nextNap?.time)}</Text>
          <Text>Hora de dormir: {formatTime(prediction.bedtime?.time)}</Text>
        </>
      )}
    </View>
  );
};
```

---

## 🎨 RESPUESTAS CON TIMEZONE

Ahora las respuestas incluyen horarios en la timezone del usuario:

```json
{
  "success": true,
  "wakeTime": "2026-01-08T13:15:00.000Z",
  "wakeTimeLocal": "2026-01-08 07:15:00",
  "timezone": "America/Mexico_City",
  "hasRegisteredToday": true
}
```

---

## 🔍 LOGS DEL SERVIDOR

En los logs de Vercel verás:

```
🌍 [TIMEZONE] Usuario timezone: America/Mexico_City
📅 [TIMEZONE] "Hoy" en America/Mexico_City:
   - Hora local: 2026-01-08 15:30:00
   - Inicio del día (UTC): 2026-01-08T06:00:00.000Z
   - Fin del día (UTC): 2026-01-09T05:59:59.999Z
⏰ [TIMEZONE] Offset de America/Mexico_City: -6 horas vs UTC
```

---

## ⚠️ TIMEZONE POR DEFECTO

Si NO envías timezone, el sistema usa por defecto:

```
America/Mexico_City (UTC-6)
```

Es mejor SIEMPRE enviar el timezone para predicciones precisas.

---

## 🎯 BENEFICIOS

✅ **"Hoy" correcto** - El sistema sabe qué es "hoy" para el usuario  
✅ **Predicciones precisas** - Las siestas se predicen en horario local  
✅ **Sin confusión** - Ya no hay desfase entre servidor y cliente  
✅ **Multi-región** - Funciona para cualquier zona horaria  

---

## 🚀 DEPLOY

El sistema ya está deployado en producción con soporte completo de timezone.

**Versión:** 2.1.0  
**Fecha:** Enero 2026  
**Estado:** ✅ Producción

