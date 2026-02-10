# 📅 Cron Job: `/api/notifications/daily-reminders`

## 🎯 ¿Qué hace?

Este cron job envía **recordatorios diarios personalizados** a los padres sobre el desarrollo de sus hijos usando **IA (OpenAI GPT)**.

---

## ⏰ Cuándo se ejecuta

Se ejecuta **todos los días a las 9:00 AM** (hora del servidor).

Configurado en `vercel.json`:
```json
{
  "path": "/api/notifications/daily-reminders",
  "schedule": "0 9 * * *"
}
```

---

## 📋 Funcionamiento Detallado

### 1️⃣ **Obtiene todos los usuarios**
```javascript
// Busca TODOS los usuarios en Firestore
const usersSnapshot = await db.collection('users').get();
```

### 2️⃣ **Filtra usuarios elegibles**
Para cada usuario verifica:
- ✅ Tiene tokens FCM (notificaciones push)
- ✅ Tiene hijos registrados (propios o compartidos)

**Usuarios saltados:**
- ❌ Sin tokens FCM → `usersWithoutTokens++`
- ❌ Sin hijos → `usersWithoutChildren++`

### 3️⃣ **Obtiene hijos del usuario**
```javascript
// Hijos propios
const childrenSnapshot = await db.collection('children')
  .where('parentId', '==', userId)
  .get();

// Hijos compartidos
const sharedChildrenSnapshot = await db.collection('children')
  .where('sharedWith', 'array-contains', userId)
  .get();

const allChildren = [...childrenSnapshot.docs, ...sharedChildrenSnapshot.docs];
```

### 4️⃣ **Calcula la edad de cada hijo**
```javascript
const birthDate = childData.birthDate.toDate();
const now = new Date();
const ageInDays = Math.floor((now - birthDate) / (1000 * 60 * 60 * 24));
const ageInMonths = Math.floor(ageInDays / 30);
```

### 5️⃣ **Busca recordatorios apropiados**

**Prioridad 1: Vacuna programada próxima (1 semana antes)**
```javascript
const reminder = await getUpcomingScheduledVaccineReminder(childId, childName);
```

**Prioridad 2: Recordatorio según edad**
```javascript
const reminder = getDailyReminder(ageInMonths, ageInDays);
```

Tipos de recordatorios:
- 🎯 **Milestone** (hitos del desarrollo): "Tu bebé puede empezar a gatear"
- 💡 **Tip** (consejos): "Establece rutinas de sueño"
- 💉 **Vaccine** (vacunas): "Vacuna de 2 meses"

### 6️⃣ **Genera mensaje personalizado con IA**
```javascript
const gptReminder = await generatePersonalizedReminder(
  child,
  reminderType,
  ageInMonths,
  ageInDays
);
```

Usa **OpenAI GPT** para crear mensajes únicos y personalizados basados en:
- Nombre del hijo
- Edad exacta
- Tipo de recordatorio
- Contexto del desarrollo

**Ejemplo de personalización:**
```
Mensaje genérico: "Tu bebé puede empezar a gatear"
Con IA: "¡Sofía puede estar lista para gatear! A los 8 meses..."
```

### 7️⃣ **Agrupa hijos para un solo mensaje**

**Si tiene 1 hijo:**
```
Título: "👶 Consejo para Sofía"
Mensaje: "¡Sofía puede estar lista para gatear! ..."
```

**Si tiene múltiples hijos:**
```
Título: "👶 Recordatorios para tus 2 hijos"
Mensaje: 
"🎯 Sofía (8 meses)
¡Puede estar lista para gatear! ...

🎯 Lucas (3 meses)
Establece rutinas de sueño ..."
```

### 8️⃣ **Envía notificación push**
```javascript
await admin.messaging().sendEachForMulticast({
  tokens: userData.fcmTokens,
  notification: {
    title,
    body: message
  },
  data: {
    type: 'daily_reminder',
    childrenCount: eligibleChildren.length.toString()
  },
  android: {
    priority: 'high',
    notification: {
      channelId: 'daily_reminders',
      priority: 'high',
      sound: 'default'
    }
  },
  apns: {
    payload: {
      aps: {
        sound: 'default',
        badge: 1
      }
    }
  }
});
```

### 9️⃣ **Limpia tokens inválidos**
Si un token FCM falla, lo elimina automáticamente:
```javascript
if (!response.success) {
  // Remover token inválido de la BD
  await db.collection('users').doc(userId).update({
    fcmTokens: admin.firestore.FieldValue.arrayRemove(token)
  });
}
```

---

## 📊 Estadísticas que Retorna

```json
{
  "success": true,
  "message": "Recordatorios diarios enviados",
  "stats": {
    "totalUsers": 1250,
    "notificationsSent": 450,
    "errors": 2,
    "usersWithoutTokens": 300,
    "usersWithoutChildren": 400,
    "childrenTooOld": 80,
    "noReminderForAge": 18
  }
}
```

**Explicación:**
- `totalUsers`: Total de usuarios en la BD
- `notificationsSent`: Notificaciones enviadas exitosamente
- `errors`: Fallos al enviar
- `usersWithoutTokens`: Usuarios sin tokens FCM (no pueden recibir notificaciones)
- `usersWithoutChildren`: Usuarios sin hijos registrados
- `childrenTooOld`: Hijos muy grandes (>24 meses sin recordatorios)
- `noReminderForAge`: Hijos sin recordatorio para su edad específica

---

## 🎯 Ejemplos de Recordatorios

### Milestone (8 meses):
```
Título: "👶 Hito de desarrollo de Sofía"
Mensaje: "¡Sofía puede estar lista para gatear! A los 8 meses, 
muchos bebés empiezan a moverse por sí solos. Coloca juguetes 
a una pequeña distancia para motivarla."
```

### Tip (3 meses):
```
Título: "👶 Consejo para Lucas"
Mensaje: "Establece rutinas de sueño para Lucas. A los 3 meses, 
los bebés empiezan a desarrollar patrones de sueño más regulares. 
Crea una rutina nocturna tranquila."
```

### Vaccine (próxima semana):
```
Título: "💉 Vacuna programada para Sofía"
Mensaje: "Recuerda: La vacuna de 6 meses de Sofía está programada 
para el 15 de febrero. ¡No olvides acudir!"
```

### Múltiples hijos:
```
Título: "👶 Recordatorios para tus 2 hijos"
Mensaje: 
"🎯 Sofía (8 meses)
¡Puede estar lista para gatear! Coloca juguetes cerca para motivarla.

🎯 Lucas (3 meses)
Establece rutinas de sueño. Los bebés de esta edad empiezan a 
desarrollar patrones regulares."
```

---

## 🔧 Funciones Helper Importantes

### `getDailyReminder(ageInMonths, ageInDays)`
Retorna el recordatorio apropiado según la edad del bebé.

### `getUpcomingScheduledVaccineReminder(childId, childName)`
Busca vacunas programadas para la próxima semana.

### `generatePersonalizedReminder(child, type, ageInMonths, ageInDays)`
Usa OpenAI para generar un mensaje único y personalizado.

---

## 🎨 Canales de Notificación

### Android:
```javascript
{
  channelId: 'daily_reminders',
  priority: 'high',
  sound: 'default'
}
```

### iOS:
```javascript
{
  sound: 'default',
  badge: 1
}
```

---

## 💰 Costo Aproximado

### Por cada recordatorio con IA:
- **OpenAI API**: ~$0.001 por mensaje
- **Firebase FCM**: Gratis (ilimitado)

### Ejemplo con 450 usuarios/día:
- 450 mensajes × $0.001 = **$0.45/día**
- **$13.50/mes** en IA
- FCM: **$0** (gratis)

---

## 🚨 Casos Especiales

### Usuario sin hijos:
```
❌ Saltado → usersWithoutChildren++
```

### Usuario sin tokens FCM:
```
❌ Saltado → usersWithoutTokens++
```

### Hijo sin `birthDate`:
```
⚠️ [DAILY] {childName} no tiene birthDate
❌ Saltado
```

### Hijo > 24 meses sin recordatorios:
```
⏭️ No hay recordatorio para {childName} ({ageInMonths} meses)
❌ Saltado → childrenTooOld++
```

### Error enviando notificación:
```
❌ Error enviando a token: {error}
→ Token removido de la BD
→ errors++
```

---

## 🔍 Logs de Ejemplo

```
📅 [DAILY] Iniciando envío de recordatorios diarios...
👥 [DAILY] Total usuarios en BD: 1250

👶 [DAILY] Usuario abc123 tiene 2 hijo(s) total(es)
   👶 Hijo: Sofía, 8 meses, 240 días
   ✅ Tiene recordatorio: Tu bebé puede empezar a gatear
   👶 Hijo: Lucas, 3 meses, 90 días
   ✅ Tiene recordatorio: Establece rutinas de sueño
   📊 Hijos elegibles para abc123: 2/2

✅ [DAILY] Notificación enviada a abc123 (2 hijo(s))

📊 [DAILY] Resumen:
   • Total usuarios: 1250
   • Notificaciones enviadas: 450
   • Errores: 2
   • Sin tokens: 300
   • Sin hijos: 400
   • Hijos muy grandes: 80
   • Sin recordatorio para edad: 18
```

---

## ⚙️ Configuración Recomendada

### Frecuencia:
- **Actual**: 1 vez al día (9:00 AM)
- **Alternativa**: 2 veces al día (9:00 AM y 7:00 PM)

### Límites:
- Sin límite de usuarios
- Sin límite de hijos por usuario
- Procesa TODOS los usuarios activos

### Performance:
- Procesa ~100 usuarios/minuto
- ~12 minutos para 1,200 usuarios
- Timeout de Vercel: 300 segundos (5 min) en Pro plan

---

## 🎯 Beneficios

1. **Personalización**: Cada mensaje usa el nombre del hijo
2. **IA Inteligente**: Mensajes únicos generados por GPT
3. **Multi-hijo**: Un solo mensaje para múltiples hijos
4. **Prioriza vacunas**: Vacunas próximas tienen prioridad
5. **Limpieza automática**: Remueve tokens inválidos
6. **Compartición**: Incluye hijos compartidos con el usuario

---

## 📝 Resumen

El cron job `/api/notifications/daily-reminders`:

✅ Se ejecuta **diariamente a las 9:00 AM**  
✅ Envía recordatorios **personalizados con IA** sobre el desarrollo de los hijos  
✅ Usa **OpenAI GPT** para mensajes únicos  
✅ Agrupa **múltiples hijos** en un solo mensaje  
✅ Prioriza **vacunas próximas**  
✅ Limpia **tokens FCM inválidos** automáticamente  
✅ Cuesta aproximadamente **$13.50/mes** en IA (450 usuarios/día)  

Es uno de los cron jobs más importantes porque mantiene a los padres **comprometidos y educados** sobre el desarrollo de sus hijos. 🎯
