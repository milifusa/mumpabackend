# 🚀 Quick Start - Sistema de Predicción de Sueño

Guía rápida para empezar a usar el sistema de predicción de sueño en 5 minutos.

---

## 📦 1. Instalación (Ya completada)

Las dependencias ya están instaladas:
```bash
✅ simple-statistics
✅ date-fns
```

---

## 🔥 2. Iniciar el Servidor

```bash
npm start
```

El servidor iniciará en `http://localhost:3000` (o el puerto configurado).

---

## 🧪 3. Probar el Sistema

### Opción A: Usar el Script de Prueba

```bash
# Configurar variables
export TEST_TOKEN="tu_firebase_token_aqui"
export TEST_CHILD_ID="id_del_niño"

# Ejecutar pruebas
node test-sleep-prediction.js
```

### Opción B: Usar cURL

```bash
# 1. Registrar una siesta
curl -X POST http://localhost:3000/api/sleep/record \
  -H "Authorization: Bearer TU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "childId": "child_123",
    "type": "nap",
    "startTime": "2026-01-05T14:00:00Z",
    "endTime": "2026-01-05T15:30:00Z",
    "duration": 90,
    "quality": "good"
  }'

# 2. Obtener predicción
curl http://localhost:3000/api/sleep/predict/child_123 \
  -H "Authorization: Bearer TU_TOKEN"
```

### Opción C: Usar Postman

Importa esta colección:

**POST** `/api/sleep/record`
```json
{
  "childId": "{{childId}}",
  "type": "nap",
  "startTime": "2026-01-05T14:00:00Z",
  "endTime": "2026-01-05T15:30:00Z",
  "quality": "good"
}
```

**GET** `/api/sleep/predict/{{childId}}`

---

## 📱 4. Integrar en tu App

### React Native / React

```javascript
import React, { useEffect, useState } from 'react';

function SleepTracker({ childId, authToken }) {
  const [prediction, setPrediction] = useState(null);

  useEffect(() => {
    // Cargar predicción
    fetch(`https://tu-api.com/api/sleep/predict/${childId}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    })
    .then(res => res.json())
    .then(data => setPrediction(data.prediction));
  }, [childId]);

  // Registrar siesta
  const startNap = async () => {
    await fetch('https://tu-api.com/api/sleep/record', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        childId,
        type: 'nap',
        startTime: new Date().toISOString()
      })
    });
  };

  return (
    <div>
      {prediction?.nextNap && (
        <div>
          <h2>Próxima Siesta</h2>
          <p>{new Date(prediction.nextNap.time).toLocaleTimeString()}</p>
          <p>Confianza: {prediction.nextNap.confidence}%</p>
        </div>
      )}
      <button onClick={startNap}>Iniciar Siesta</button>
    </div>
  );
}
```

### Flutter / Dart

```dart
import 'package:http/http.dart' as http;
import 'dart:convert';

class SleepService {
  final String baseUrl = 'https://tu-api.com';
  final String authToken;

  SleepService(this.authToken);

  Future<Map<String, dynamic>> getPrediction(String childId) async {
    final response = await http.get(
      Uri.parse('$baseUrl/api/sleep/predict/$childId'),
      headers: {
        'Authorization': 'Bearer $authToken',
      },
    );

    if (response.statusCode == 200) {
      return json.decode(response.body);
    } else {
      throw Exception('Error al cargar predicción');
    }
  }

  Future<void> recordSleep({
    required String childId,
    required String type,
    required DateTime startTime,
  }) async {
    await http.post(
      Uri.parse('$baseUrl/api/sleep/record'),
      headers: {
        'Authorization': 'Bearer $authToken',
        'Content-Type': 'application/json',
      },
      body: json.encode({
        'childId': childId,
        'type': type,
        'startTime': startTime.toIso8601String(),
      }),
    );
  }
}
```

---

## 🎯 5. Endpoints Principales

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/sleep/record` | Registrar evento de sueño |
| GET | `/api/sleep/predict/:childId` | Obtener predicción |
| GET | `/api/sleep/history/:childId` | Ver historial |
| GET | `/api/sleep/analysis/:childId` | Análisis detallado |
| GET | `/api/sleep/reminders/:childId` | Recordatorios |

---

## 📊 6. Datos de Ejemplo

Para probar rápidamente, puedes usar estos datos:

```javascript
// Registrar varios eventos de prueba
const eventos = [
  { type: 'nap', horasAtras: 8, duracion: 60 },
  { type: 'nap', horasAtras: 4, duracion: 90 },
  { type: 'nightsleep', horasAtras: 12, duracion: 600 }
];

for (const evento of eventos) {
  const endTime = new Date(Date.now() - evento.horasAtras * 3600000);
  const startTime = new Date(endTime - evento.duracion * 60000);
  
  await fetch('/api/sleep/record', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      childId: 'child_123',
      type: evento.type,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      duration: evento.duracion,
      quality: 'good'
    })
  });
}
```

---

## 🔍 7. Verificar que Funciona

Después de registrar algunos eventos, verifica:

```bash
# Ver historial
curl http://localhost:3000/api/sleep/history/child_123?days=7 \
  -H "Authorization: Bearer TU_TOKEN"

# Ver predicción
curl http://localhost:3000/api/sleep/predict/child_123 \
  -H "Authorization: Bearer TU_TOKEN"
```

Deberías ver:
- ✅ Lista de eventos registrados
- ✅ Predicción de próxima siesta
- ✅ Hora de dormir recomendada
- ✅ Análisis de patrones
- ✅ Recomendaciones personalizadas

---

## 💡 8. Tips para Mejores Predicciones

1. **Registra al menos 7 días de datos**
   - Más datos = predicciones más precisas

2. **Sé consistente con los horarios**
   - Rutinas regulares mejoran la confianza

3. **Registra todos los eventos**
   - Incluso siestas cortas de 20 minutos

4. **Incluye información de calidad**
   - Ayuda a identificar patrones

5. **Actualiza cuando el bebé despierta**
   - Registra la hora de fin y calidad

---

## 🐛 9. Troubleshooting Rápido

### Error: "Firebase no está configurado"
```bash
# Verifica que el archivo de credenciales existe
ls mumpabackend-firebase-adminsdk-*.json

# Verifica las variables de entorno
echo $FIREBASE_PROJECT_ID
```

### Error: "Niño no encontrado"
```bash
# Verifica que el childId existe en Firestore
# Colección: children
# Documento: childId
```

### Error: "Necesitamos más datos"
```bash
# Registra al menos 3 eventos de sueño
# Usa el script de prueba para generar datos
node test-sleep-prediction.js
```

---

## 📚 10. Documentación Completa

Para más detalles, consulta:

- **API Completa**: `API-SLEEP-PREDICTION.md`
- **Resumen del Sistema**: `RESUMEN-SISTEMA-SLEEP.md`
- **Componente de Ejemplo**: `EJEMPLO-COMPONENTE-SLEEP.jsx`
- **Script de Pruebas**: `test-sleep-prediction.js`

---

## 🎉 ¡Listo!

Tu sistema de predicción de sueño está funcionando. Ahora puedes:

1. ✅ Registrar eventos de sueño
2. ✅ Obtener predicciones inteligentes
3. ✅ Ver análisis de patrones
4. ✅ Recibir recomendaciones personalizadas
5. ✅ Configurar recordatorios

---

## 🆘 ¿Necesitas Ayuda?

```bash
# Ver logs del servidor
npm start

# Ejecutar pruebas
node test-sleep-prediction.js

# Ver documentación de endpoints
cat API-SLEEP-PREDICTION.md
```

**Email**: support@munpa.online

---

**¡Feliz predicción de sueño! 🛌💤**

