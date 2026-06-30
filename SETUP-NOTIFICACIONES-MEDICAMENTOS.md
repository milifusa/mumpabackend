# ⚡ Configuración Final - Notificaciones de Medicamentos

## ✅ Ya Implementado

- [x] Cron job configurado en `vercel.json` (cada 10 minutos)
- [x] Endpoint `/api/cron/process-medication-notifications` creado
- [x] Campo `sent` agregado a notificaciones
- [x] Código desplegado a producción

---

## 🔧 Paso Final Requerido

### Agregar `CRON_SECRET` en Vercel

1. Ve a: https://vercel.com/dashboard
2. Selecciona tu proyecto `mumpabackend`
3. Ve a **Settings** → **Environment Variables**
4. Agrega una nueva variable:

```
Name: CRON_SECRET
Value: [genera un secreto seguro, ej: munpa_cron_2026_x7Y9kL3mP8qN5wR2]
Environment: Production, Preview, Development
```

**Genera un secreto seguro:**
```bash
# Opción 1: En terminal
openssl rand -base64 32

# Opción 2: Sitio web
# Ve a: https://randomkeygen.com/
```

5. Clic en **Save**
6. Redeploy (opcional, o espera al próximo deploy automático)

---

## 🧪 Probar que Funciona

### Opción 1: Esperar 10 minutos

El cron se ejecutará automáticamente. Verifica los logs:

1. Ve a Vercel Dashboard → Tu Proyecto → **Functions**
2. Busca `/api/cron/process-medication-notifications`
3. Deberías ver ejecuciones cada 10 minutos

### Opción 2: Probar manualmente (Recomendado)

```bash
# Opción 1: Authorization Bearer (Vercel lo envía así)
curl -X GET https://api.munpa.online/api/cron/process-medication-notifications \
  -H "Authorization: Bearer YOUR_SECRET_HERE"

# Opción 2: x-cron-secret (alternativa si Bearer falla)
curl -X GET https://api.munpa.online/api/cron/process-medication-notifications \
  -H "x-cron-secret: YOUR_SECRET_HERE"
```

**Respuesta esperada:**
```json
{
  "success": true,
  "sent": 0,
  "scheduled": 0,
  "errors": 0,
  "noTokens": 0,
  "total": 0,
  "timestamp": "2026-02-07T20:30:00.000Z"
}
```

---

## 🔍 Crear Índice en Firestore

Para consultas eficientes, crea este índice:

1. Ve a: https://console.firebase.google.com/
2. Selecciona tu proyecto
3. **Firestore Database** → **Indexes** → **Composite**
4. Clic en **Create Index**

**Configuración:**
- Collection ID: `scheduled_med_notifications`
- Fields to index:
  - `scheduledFor` - **Ascending**
  - `sent` - **Ascending**
- Query scopes: **Collection**

5. Clic en **Create**

**Alternativa (CLI):**
```bash
firebase firestore:indexes:create \
  --collection-id=scheduled_med_notifications \
  --field-path=scheduledFor \
  --field-path=sent
```

---

## 📊 Monitoreo

### Ver ejecuciones del cron:

**Vercel Dashboard:**
1. Proyecto → Functions → Logs
2. Filtrar por `/api/cron/process-medication-notifications`

**Logs esperados:**
```
🔔 [CRON] Iniciando procesamiento de notificaciones de medicamentos...
📦 [CRON] Encontradas X notificaciones pendientes
✅ [CRON] Resumen: X enviados, Y programados, 0 errores, 0 sin tokens
```

### Verificar notificaciones en Firestore:

```javascript
// Firestore Console → scheduled_med_notifications
// Filtros:
//   sent == false
//   scheduledFor >= now
```

---

## 🎯 Qué Esperar

### Comportamiento:

1. **Usuario crea medicamento** → Se programan recordatorios con `sent: false`
2. **Cada 10 minutos** → Cron busca notificaciones desde 2 horas atrás hasta 20 minutos adelante
3. **Si falta < 2 min** → Se envía push y se marca `sent: true`
4. **Después de enviar** → Se programa follow-up automático (2 horas después)

### Ejemplo Timeline:

```
14:00 - Usuario programa medicamento para 16:00
14:10 - Cron: "Falta 110 min, esperar"
15:50 - Cron: "Falta 10 min, esperar"
15:58 - Cron: "Falta 2 min, esperar"
16:00 - Cron: "Falta 0 min, ENVIAR ✓"
18:00 - Cron: "Enviar follow-up ✓"
```

---

## 🚨 Troubleshooting

### Problema: "Unauthorized" al probar

**Causa:** `CRON_SECRET` no configurado o incorrecto

**Solución:**
1. Verifica que agregaste `CRON_SECRET` en Vercel
2. Usa el mismo valor en el header `Authorization: Bearer YOUR_SECRET`

### Problema: No se envían notificaciones

**Probar push manualmente:**
```bash
curl -X POST https://api.munpa.online/api/notifications/test-medication-reminder \
  -H "Authorization: Bearer TU_TOKEN"
```

**Verificar:**

1. ¿Usuario tiene tokens FCM?
   ```javascript
   // Firestore: users/{userId}
   // Campo: fcmTokens (array)
   ```

2. ¿La app usa Expo? Los tokens pueden ser `ExponentPushToken[...]` y el cron ya los soporta (usa `sendPushNotification` que envía Expo + FCM).

3. ¿La notificación está en la ventana?
   ```javascript
   // Ventana: 2 horas atrás hasta 20 min adelante
   scheduledFor >= (now - 2 horas) && scheduledFor <= (now + 20 min)
   ```

4. ¿El campo `sent` es `false`?

5. ¿Timezone correcto? Si no se envía `timezone` al crear el medicamento, se usa `America/Guayaquil`. Si el medicamento se creó antes con UTC, las horas estarían mal. Edita el medicamento y guarda de nuevo para recalcular con el timezone correcto.

### Problema: Notificaciones duplicadas

**Causa:** Índice faltante causa múltiples lecturas

**Solución:** Crear índice compuesto (ver arriba)

---

## 📈 Resultados Esperados

### Antes (sistema antiguo):
- 43,200 consultas/mes
- $5-10/mes en costos de Firestore

### Ahora:
- **4,320 consultas/mes** (90% menos)
- **$0.50-1/mes** en costos de Firestore
- **Ahorro: ~$54-108/año** 💰

---

## 📞 Próximos Pasos

1. **Configurar `CRON_SECRET`** ← IMPORTANTE
2. Crear índice en Firestore
3. Esperar 10 minutos o probar manualmente
4. Verificar logs en Vercel
5. Crear medicamento de prueba y verificar que llegue push

---

## 📚 Documentación Completa

Ver: `SOLUCION-EFICIENTE-NOTIFICACIONES.md`

---

**Estado:** ✅ Listo para usar  
**Requiere:** CRON_SECRET en Vercel  
**Costo:** ~$1/mes (90% de ahorro)  
**Precisión:** ±10 minutos
