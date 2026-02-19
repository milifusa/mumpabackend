# 📹 Guía: Consultas por Video

Implementación de videollamadas para consultas médicas usando **Agora RTC**.

---

## 📋 Resumen

| Componente | Tecnología |
|------------|------------|
| Backend (token) | Node.js + `agora-token` |
| Servicio de video | Agora.io |
| Frontend (React Native) | `react-native-agora` o `agora-react-native-rtm` |

---

## 1️⃣ Configuración Agora

### 1.1 Crear cuenta y proyecto

1. Registrarse en [console.agora.io](https://console.agora.io)
2. Crear un proyecto
3. Copiar **App ID** y **App Certificate** (Settings del proyecto)

### 1.2 Variables de entorno

En `.env` y en Vercel (Settings > Environment Variables):

```env
AGORA_APP_ID=tu-app-id
AGORA_APP_CERTIFICATE=tu-app-certificate
```

---

## 2️⃣ API Backend (ya implementada)

### 2.1 Unirse a videollamada

```http
POST /api/consultations/:consultationId/video/join
Authorization: Bearer {token}
Content-Type: application/json

{
  "role": "host"   // opcional: "host" | "audience"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "channelName": "consultation_7XJmn62pY5knyzyxX7y6",
    "uid": 12345678,
    "token": "006...",
    "appId": "abc123...",
    "enlace": { "channelName": "...", "uid": 12345678, "token": "...", "appId": "..." }
  }
}
```

- `channelName`: Nombre del canal (usar en el SDK)
- `uid`: ID de usuario en la llamada
- `token`: Token de autenticación Agora
- `appId`: App ID de Agora (si no está configurado, será `null`)

**Requisitos:**
- Consulta debe ser tipo `video`
- Estado: `accepted` o `in_progress`
- Usuario: padre o especialista asignado

### 2.2 Finalizar videollamada

```http
POST /api/consultations/:consultationId/video/end
Authorization: Bearer {token}
Content-Type: application/json

{
  "durationSeconds": 720   // opcional: duración en segundos
}
```

Si no se envía `durationSeconds`, se calcula desde `video.startedAt`.

---

## 3️⃣ Flujo completo

```
1. Padre crea consulta tipo "video"
   POST /api/children/:childId/consultations
   Body: { type: "video", ... }

2. Especialista acepta (y opcionalmente programa)
   POST /api/specialist/consultations/:id/accept
   Body: { scheduledFor: "2026-02-15T15:00:00Z" }

3. Llegada la hora:
   - Especialista: POST /api/specialist/consultations/:id/start
   - Ambos: POST /api/consultations/:id/video/join
   - Reciben: channelName, uid, token, appId

4. Inician videollamada en el frontend con el SDK de Agora

5. Al terminar:
   - POST /api/consultations/:id/video/end
   - Especialista: POST /api/specialist/consultations/:id/complete
```

---

## 4️⃣ Frontend (React Native)

### 4.1 Instalar SDK

```bash
npm install react-native-agora
# o
yarn add react-native-agora
```

### 4.2 Configuración (iOS/Android)

Ver [documentación oficial](https://docs.agora.io/en/video-calling/get-started/get-started-sdk).

### 4.3 Ejemplo de uso

```javascript
import RtcEngine, { RtcLocalView, RtcRemoteView, VideoProfile } from 'react-native-agora';

// 1. Obtener credenciales del backend
const res = await api.post(`/api/consultations/${consultationId}/video/join`, { role: 'host' });
const { channelName, uid, token, appId } = res.data.data;

if (!appId || !token) {
  Alert.alert('Error', 'Las videollamadas no están configuradas. Contacta al administrador.');
  return;
}

// 2. Inicializar SDK
const engine = await RtcEngine.create(appId);

// 3. Unirse al canal
await engine.joinChannel(token, channelName, null, Number(uid));

// 4. Habilitar video local
await engine.enableVideo();
await engine.setVideoProfile(VideoProfile.VideoProfile720P, false);
await engine.startPreview();

// 5. Al terminar
await engine.leaveChannel();
await engine.destroy();

// 6. Registrar duración en backend
await api.post(`/api/consultations/${consultationId}/video/end`, { durationSeconds });
```

### 4.4 Componente de ejemplo

```jsx
// VideoCallScreen.jsx
import { useEffect, useState } from 'react';
import RtcEngine, { RtcLocalView, RtcRemoteView } from 'react-native-agora';

export default function VideoCallScreen({ consultationId, api }) {
  const [engine, setEngine] = useState(null);
  const [remoteUid, setRemoteUid] = useState(null);
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await api.post(`/api/consultations/${consultationId}/video/join`);
      const { channelName, uid, token, appId } = data.data;

      if (!appId || !token) {
        Alert.alert('Error', 'Videollamada no disponible');
        return;
      }

      const rtc = await RtcEngine.create(appId);
      rtc.addListener('UserJoined', (uid) => setRemoteUid(uid));
      rtc.addListener('UserOffline', () => setRemoteUid(null));
      await rtc.enableVideo();
      await rtc.joinChannel(token, channelName, null, Number(uid));
      setEngine(rtc);
      setJoined(true);
    })();
    return () => {
      engine?.leaveChannel();
      engine?.destroy();
      api.post(`/api/consultations/${consultationId}/video/end`);
    };
  }, []);

  return (
    <View style={{ flex: 1 }}>
      {remoteUid && <RtcRemoteView uid={remoteUid} style={{ flex: 1 }} />}
      <RtcLocalView style={{ width: 120, height: 160, position: 'absolute', right: 10, top: 40 }} />
    </View>
  );
}
```

---

## 5️⃣ Alternativas a Agora

| Servicio | Ventajas | Desventajas |
|----------|----------|-------------|
| **Agora** | Integración sencilla, free tier | Costo por minuto tras free tier |
| **Twilio Video** | Empresa sólida | Más caro |
| **Daily.co** | API simple, grabación incluida | Menos integración RN |
| **100ms** | Bueno para RN | Menos documentación |

---

## 6️⃣ Endpoints implementados

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/consultations/:id/video/join` | Obtener token y canal |
| POST | `/api/consultations/:id/video/end` | Finalizar y registrar duración |

---

## 7️⃣ Estructura en Firestore

```javascript
consultations/{id}
  video: {
    roomId: "consultation_7XJmn62pY5knyzyxX7y6",
    startedAt: Timestamp,
    endedAt: Timestamp,
    duration: 720  // segundos
  }
```

---

## 8️⃣ Troubleshooting

**"Las videollamadas no están configuradas"**
- Verifica `AGORA_APP_ID` y `AGORA_APP_CERTIFICATE` en Vercel
- Redeploy tras agregar variables

**Token null**
- Revisa que el App Certificate sea correcto (sin espacios)
- Verifica que la consulta sea tipo `video`

**Error al unirse al canal**
- Token expira en 1 hora; genera uno nuevo si pasó el tiempo
- `channelName` debe coincidir entre padre y especialista
