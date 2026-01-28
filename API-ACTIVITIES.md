# 🎨 API de Actividades para Bebés

**Endpoint:** `GET /api/activities/suggestions/:childId`  
**Autenticación:** Requerida (Bearer token)  
**Integración:** ChatGPT (gpt-3.5-turbo)

---

## 📋 DESCRIPCIÓN

API inteligente que sugiere actividades apropiadas para realizar con el bebé, basándose en:

✅ **Edad del bebé** (hitos de desarrollo)  
✅ **Tiempo despierto** (ventanas de vigilia)  
✅ **Nivel de energía** (calculado automáticamente)  
✅ **Momento del día** (mañana, tarde, noche)  
✅ **Recomendaciones pediátricas** (AAP, CDC)  

---

## 🚀 USO

### Request

```http
GET /api/activities/suggestions/K6vfrjDYcwAp8cDgH9sh
Authorization: Bearer YOUR_JWT_TOKEN
```

### Response

```json
{
  "success": true,
  "childInfo": {
    "name": "Maximo",
    "ageInMonths": 4,
    "ageDisplay": "4 meses"
  },
  "currentState": {
    "minutesAwake": 75,
    "hoursAwake": "1.3",
    "energyLevel": "medium",
    "energyLevelDisplay": "⚡ Energía media",
    "lastSleepEnd": "2026-01-09T14:30:00.000Z",
    "timeOfDay": "tarde",
    "nextNapIn": {
      "minutes": 45,
      "display": "45 minutos",
      "status": "soon"
    }
  },
  "wakeWindows": {
    "min": 1.5,
    "optimal": 2,
    "max": 2.5,
    "unit": "horas"
  },
  "suggestions": {
    "activities": [
      {
        "title": "Exploración sensorial con texturas",
        "description": "Ofrece diferentes telas (suave, rugosa, sedosa) para que explore con sus manos",
        "duration": 15,
        "category": "sensorial",
        "intensity": "media",
        "developmentBenefit": "Desarrollo táctil y cognitivo",
        "materials": ["Telas variadas", "Juguetes texturizados"]
      },
      {
        "title": "Canciones con movimientos",
        "description": "Canta canciones infantiles mientras mueves suavemente sus brazos y piernas al ritmo",
        "duration": 10,
        "category": "social",
        "intensity": "baja",
        "developmentBenefit": "Vínculo afectivo y coordinación",
        "materials": []
      },
      {
        "title": "Tiempo boca abajo",
        "description": "Colócalo boca abajo sobre una manta con juguetes coloridos al frente para fortalecer cuello",
        "duration": 10,
        "category": "motor",
        "intensity": "alta",
        "developmentBenefit": "Fortalece músculos del cuello, hombros y espalda",
        "materials": ["Manta", "Juguetes coloridos"]
      },
      {
        "title": "Juego de alcanzar objetos",
        "description": "Sostén un juguete llamativo frente a él y muévelo lentamente para que lo siga con la mirada y trate de alcanzarlo",
        "duration": 10,
        "category": "motor",
        "intensity": "media",
        "developmentBenefit": "Coordinación ojo-mano",
        "materials": ["Sonajero", "Juguete brillante"]
      },
      {
        "title": "Masaje infantil",
        "description": "Masajea suavemente sus piernas, brazos y espalda con aceite de bebé mientras le hablas",
        "duration": 15,
        "category": "calma",
        "intensity": "baja",
        "developmentBenefit": "Relajación y vínculo afectivo",
        "materials": ["Aceite de bebé"]
      }
    ],
    "generalTip": "A los 4 meses, el bebé está desarrollando control de cabeza y comenzando a alcanzar objetos. Mezcla actividades activas con momentos de calma.",
    "warningIfTired": null
  },
  "generatedAt": "2026-01-09T20:30:00.000Z"
}
```

---

## 🎯 CARACTERÍSTICAS

### 1. **Cálculo Automático de Nivel de Energía**

El sistema calcula automáticamente el nivel de energía basándose en las ventanas de vigilia:

| Nivel | Condición | Descripción |
|-------|-----------|-------------|
| `high` | < 50% de ventana óptima | Recién despierto, mucha energía |
| `medium` | 50%-80% de ventana óptima | En ventana ideal, alerta |
| `low` | 80%-100% de ventana óptima | Cansándose, actividades calmadas |
| `very-low` | > 100% de ventana óptima | Necesita dormir pronto |

**Ejemplo (bebé de 4 meses):**
```
Ventana óptima: 2 horas
Tiempo despierto: 1 hora → energyLevel: "high"
Tiempo despierto: 1.5 horas → energyLevel: "medium"
Tiempo despierto: 2 horas → energyLevel: "low"
Tiempo despierto: 2.5+ horas → energyLevel: "very-low"
```

### 2. **Categorías de Actividades**

Las actividades se clasifican en 6 categorías de desarrollo:

- 🏃 **motor**: Desarrollo físico y coordinación
- 👐 **sensorial**: Exploración de sentidos
- 🧠 **cognitivo**: Resolución de problemas, causa-efecto
- 👥 **social**: Vínculo, interacción social
- 💬 **lenguaje**: Comunicación y lenguaje
- 😴 **calma**: Relajación y transición a sueño

### 3. **Intensidad Ajustada**

ChatGPT ajusta la intensidad según el nivel de energía:

```javascript
energyLevel: "high" → intensidad: "alta"
energyLevel: "medium" → intensidad: "media"
energyLevel: "low" → intensidad: "baja"
energyLevel: "very-low" → solo actividades de "calma"
```

### 4. **Advertencias Inteligentes**

Si el bebé está muy cansado (`very-low`):

```json
{
  "warningIfTired": "⚠️ El bebé parece muy cansado. Considera comenzar la rutina de sueño."
}
```

---

## 🤖 INTEGRACIÓN CON CHATGPT

### Prompt Enviado a ChatGPT

```
Eres un experto en desarrollo infantil y educación temprana...

INFORMACIÓN DEL BEBÉ:
- Nombre: Maximo
- Edad: 4 meses
- Tiempo despierto: 75 minutos (1.3 horas)
- Nivel de energía: medium
- Momento del día: tarde (15:00h)

VENTANAS DE VIGILIA RECOMENDADAS:
- Mínimo: 1.5h
- Óptimo: 2h
- Máximo: 2.5h

SOLICITUD:
Sugiere 5-6 actividades apropiadas...
```

### Respuesta de ChatGPT

```json
{
  "activities": [...],
  "generalTip": "...",
  "warningIfTired": "..."
}
```

---

## 📊 VENTANAS DE VIGILIA POR EDAD

| Edad | Ventana Mínima | Ventana Óptima | Ventana Máxima |
|------|----------------|----------------|----------------|
| 0-1 meses | 0.75h | 1h | 1.5h |
| 2-3 meses | 1h | 1.5h | 2h |
| **4-6 meses** | **1.5h** | **2h** | **2.5h** |
| 7-9 meses | 2h | 2.5h | 3.5h |
| 10-12 meses | 2.5h | 3h | 4h |
| 13-18 meses | 3h | 4h | 5h |
| 19+ meses | 4h | 5h | 6h |

---

## 💡 CASOS DE USO

### Caso 1: Recién Despierto (Energía Alta)

```
Tiempo despierto: 30 min
Energía: HIGH
Hora: 10:00 AM

Sugerencias:
- Tiempo boca abajo (10 min)
- Juego de alcanzar objetos (10 min)
- Canciones con movimientos (10 min)
```

### Caso 2: Ventana Óptima (Energía Media)

```
Tiempo despierto: 90 min
Energía: MEDIUM
Hora: 3:00 PM

Sugerencias:
- Exploración sensorial (15 min)
- Lectura de cuentos (10 min)
- Juego de escondidas (10 min)
```

### Caso 3: Cerca de Siesta (Energía Baja)

```
Tiempo despierto: 2h 15min
Energía: LOW
Hora: 6:00 PM

Sugerencias:
- Masaje infantil (15 min)
- Canciones suaves (5 min)
- Mecerse en brazos (10 min)
⚠️ Próxima siesta en 15 minutos
```

### Caso 4: Muy Cansado (Energía Muy Baja)

```
Tiempo despierto: 3 horas
Energía: VERY-LOW
Hora: 7:00 PM

Sugerencias:
- Rutina de sueño (10 min)
- Baño tibio (15 min)
- Pecho/biberón (20 min)
⚠️ El bebé parece muy cansado. Considera comenzar la rutina de sueño.
```

---

## 🔧 FALLBACK (Sin OpenAI)

Si OpenAI no está disponible, el sistema usa sugerencias por defecto:

```json
{
  "activities": [
    // Actividades básicas por edad
  ],
  "generalTip": "Para un bebé de X meses, es importante mezclar momentos de estimulación con momentos de calma.",
  "warningIfTired": null
}
```

---

## 📱 EJEMPLO DE USO EN FRONTEND

### React Native

```javascript
import { api } from './services/api';

const ActivityScreen = ({ childId }) => {
  const [activities, setActivities] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivities();
  }, [childId]);

  const fetchActivities = async () => {
    try {
      const response = await api.get(`/api/activities/suggestions/${childId}`);
      setActivities(response.data);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <ActivityIndicator />;

  return (
    <ScrollView>
      {/* Estado del bebé */}
      <Card>
        <Text>👶 {activities.childInfo.name}</Text>
        <Text>📅 {activities.childInfo.ageDisplay}</Text>
        <Text>{activities.currentState.energyLevelDisplay}</Text>
        <Text>⏰ Despierto: {activities.currentState.hoursAwake}h</Text>
        {activities.currentState.nextNapIn && (
          <Text>
            😴 Próxima siesta en: {activities.currentState.nextNapIn.display}
          </Text>
        )}
      </Card>

      {/* Advertencia si está cansado */}
      {activities.suggestions.warningIfTired && (
        <Alert type="warning">
          {activities.suggestions.warningIfTired}
        </Alert>
      )}

      {/* Lista de actividades */}
      <Text style={styles.title}>Actividades Sugeridas</Text>
      {activities.suggestions.activities.map((activity, index) => (
        <ActivityCard key={index} activity={activity} />
      ))}

      {/* Tip general */}
      <Card>
        <Text>💡 {activities.suggestions.generalTip}</Text>
      </Card>
    </ScrollView>
  );
};

const ActivityCard = ({ activity }) => (
  <Card>
    <Text style={styles.activityTitle}>{activity.title}</Text>
    <Text>{activity.description}</Text>
    <View style={styles.metadata}>
      <Badge>{getCategoryIcon(activity.category)} {activity.category}</Badge>
      <Badge color={getIntensityColor(activity.intensity)}>
        {activity.intensity}
      </Badge>
      <Text>⏱️ {activity.duration} min</Text>
    </View>
    <Text style={styles.benefit}>✨ {activity.developmentBenefit}</Text>
    {activity.materials.length > 0 && (
      <Text>📦 Materiales: {activity.materials.join(', ')}</Text>
    )}
  </Card>
);
```

---

## 🎨 DISEÑO UI SUGERIDO

### Card de Actividad

```
┌─────────────────────────────────────────┐
│ 🏃 Tiempo boca abajo          [MEDIA]   │
├─────────────────────────────────────────┤
│ Colócalo boca abajo sobre una manta     │
│ con juguetes coloridos al frente        │
│                                         │
│ ⏱️ 10 min  🎯 Motor                    │
│ ✨ Fortalece músculos del cuello       │
│ 📦 Manta, Juguetes coloridos           │
└─────────────────────────────────────────┘
```

### Estado del Bebé

```
┌─────────────────────────────────────────┐
│ 👶 Maximo • 4 meses                    │
│ ⚡ Energía media                        │
│ ⏰ Despierto: 1.3h / 2h óptimas        │
│ 😴 Próxima siesta en: 45 minutos       │
└─────────────────────────────────────────┘
```

---

## 🔍 LOGGING

```
🎨 [ACTIVITIES] Generando sugerencias de actividades
   - childId: K6vfrjDYcwAp8cDgH9sh
   - userId: 1K2EUDRsAbZvopHDQRXjpaBG9wZ2
   - Nombre: Maximo
   - Edad: 4 meses
   - Minutos despierto: 75
   - Nivel de energía: medium
   - Hora del día: tarde
🤖 [ACTIVITIES] Consultando a ChatGPT...
✅ [ACTIVITIES] Respuesta de ChatGPT recibida en 1234ms
✅ [ACTIVITIES] 5 actividades sugeridas
```

---

## 📦 ARCHIVOS MODIFICADOS

- ✅ `/controllers/activitiesController.js` (NUEVO)
- ✅ `/server.js` (línea ~25700: endpoint agregado)

---

## 🚀 PRÓXIMOS PASOS (OPCIONAL)

### 1. **Guardar actividades realizadas**
```javascript
POST /api/activities/record
{
  "childId": "xxx",
  "activityTitle": "Tiempo boca abajo",
  "duration": 10,
  "enjoymentLevel": "high"
}
```

### 2. **Historial de actividades**
```javascript
GET /api/activities/history/:childId
```

### 3. **Actividades favoritas**
```javascript
POST /api/activities/favorite
{
  "childId": "xxx",
  "activityTitle": "Exploración sensorial"
}
```

### 4. **Notificaciones de actividades**
```
"⏰ Maximo lleva 1.5h despierto. ¿Qué tal un tiempo boca abajo?"
```

---

**Status:** ✅ IMPLEMENTADO  
**Próxima acción:** Desplegar y probar

