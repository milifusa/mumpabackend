# ⏰ Configurar Cron Job en Vercel

Guía completa para activar el envío automático de recordatorios diarios.

---

## ⚠️ Requisitos Previos

### **Plan de Vercel**
Los cron jobs **solo funcionan en planes Pro o Enterprise** de Vercel.

- ✅ **Plan Pro:** $20/mes - Incluye cron jobs
- ❌ **Plan Hobby (gratis):** No soporta cron jobs

**¿No tienes plan Pro?** → Usa una [alternativa gratuita](#alternativa-gratuita-cron-joborg)

---

## 📝 Pasos para Configurar en Vercel

### **1. Ya está configurado en `vercel.json`**

El archivo ya incluye:

```json
{
  "crons": [
    {
      "path": "/api/notifications/daily-reminders",
      "schedule": "0 9 * * *"
    }
  ]
}
```

**Schedule:** `0 9 * * *` significa **9:00 AM todos los días** (hora UTC)

### **2. Ajustar la Zona Horaria**

Vercel usa **UTC** por defecto. México tiene varios husos horarios:

| Zona Horaria México | UTC Offset | Horario Vercel para 9am |
|---------------------|------------|-------------------------|
| 🇲🇽 CDMX (Centro) | UTC-6 | `0 15 * * *` (3pm UTC) |
| 🇲🇽 Tijuana (Pacífico) | UTC-8 | `0 17 * * *` (5pm UTC) |
| 🇲🇽 Cancún (Este) | UTC-5 | `0 14 * * *` (2pm UTC) |

**Para enviar a las 9am en Ciudad de México:**

```json
{
  "crons": [
    {
      "path": "/api/notifications/daily-reminders",
      "schedule": "0 15 * * *"
    }
  ]
}
```

### **3. Desplegar a Vercel**

```bash
# Commit los cambios
git add vercel.json
git commit -m "⏰ Configurar cron job para recordatorios diarios"
git push origin main
```

Vercel **detecta automáticamente** el archivo `vercel.json` y configura el cron job.

### **4. Verificar en Dashboard de Vercel**

1. Ve a tu proyecto en [vercel.com](https://vercel.com)
2. Click en **Settings** → **Cron Jobs**
3. Debes ver:

```
Path: /api/notifications/daily-reminders
Schedule: 0 15 * * *
Status: Active ✅
```

### **5. Ver Logs de Ejecución**

En el dashboard de Vercel:
- **Deployments** → Click en tu deployment
- **Functions** → Busca el log del cron
- Verás: `📅 [DAILY] Iniciando envío de recordatorios diarios...`

---

## 🔒 Seguridad del Endpoint

### **Opción 1: Token de Autenticación (Actual)**

El endpoint requiere token de admin:

```javascript
app.post('/api/notifications/daily-reminders', 
  authenticateToken, 
  isAdmin, 
  async (req, res) => { ... }
);
```

**Problema:** Vercel Cron **no puede enviar headers personalizados**.

### **Opción 2: CRON_SECRET (Recomendado)**

Voy a modificar el endpoint para aceptar un secreto en lugar de JWT.

**Pasos:**

#### **A. Agregar variable de entorno en Vercel**

1. Ve a **Settings** → **Environment Variables**
2. Agrega:
   - **Name:** `CRON_SECRET`
   - **Value:** `munpa-cron-secret-2025-change-me`
   - **Environments:** Production, Preview, Development

#### **B. Modificar el endpoint (ya lo hago abajo)**

El endpoint validará el header `x-cron-secret` en lugar de JWT.

---

## 📅 Sintaxis de Schedule (Cron Expression)

Formato: `minute hour day month weekday`

| Expresión | Significado |
|-----------|-------------|
| `0 9 * * *` | 9:00 AM todos los días |
| `0 */2 * * *` | Cada 2 horas |
| `0 9 * * 1` | 9:00 AM solo lunes |
| `30 8 * * 1-5` | 8:30 AM lunes a viernes |
| `0 20 * * 0` | 8:00 PM solo domingos |

**Herramienta útil:** [crontab.guru](https://crontab.guru) para crear expresiones.

---

## 🎯 Alternativa Gratuita: cron-job.org

Si no tienes plan Pro de Vercel, usa un servicio externo **GRATIS**:

### **1. Crear cuenta en [cron-job.org](https://cron-job.org)**

Es gratis y muy confiable.

### **2. Crear nuevo cron job**

- **Title:** Munpa - Recordatorios Diarios
- **URL:** `https://api.munpa.online/api/notifications/daily-reminders`
- **Schedule:** 
  - Ejecutar: `Every day`
  - Hora: `09:00` (zona horaria México)
  
### **3. Configurar Headers**

En la sección **Advanced**:
- **Request Method:** POST
- **Request Headers:**
  ```
  Authorization: Bearer {tu_admin_token_aqui}
  ```

O con CRON_SECRET:
  ```
  x-cron-secret: munpa-cron-secret-2025-change-me
  ```

### **4. Activar y probar**

- Click en **Save**
- Click en **Test run now** para probar inmediatamente
- Verifica en los logs de Vercel que funcionó

---

## 🧪 Probar Manualmente

Antes de configurar el cron, prueba que el endpoint funcione:

```bash
# Con token de admin
curl -X POST https://api.munpa.online/api/notifications/daily-reminders \
  -H "Authorization: Bearer {tu_admin_token}" \
  -H "Content-Type: application/json"

# Con CRON_SECRET (después de modificar endpoint)
curl -X POST https://api.munpa.online/api/notifications/daily-reminders \
  -H "x-cron-secret: munpa-cron-secret-2025-change-me" \
  -H "Content-Type: application/json"
```

**Respuesta esperada:**

```json
{
  "success": true,
  "message": "Recordatorios diarios enviados",
  "data": {
    "notificationsSent": 45,
    "errors": 0,
    "results": [...]
  }
}
```

---

## 📊 Monitoreo

### **Ver estadísticas después de ejecutar:**

```bash
curl https://api.munpa.online/api/admin/reminders/stats \
  -H "Authorization: Bearer {admin_token}"
```

Verás:
```json
{
  "total": 45,
  "last24h": 45,
  "byType": {
    "vaccine": 5,
    "tip": 35,
    "milestone": 5
  },
  "bySource": {
    "chatgpt": 40,
    "fallback": 5
  }
}
```

---

## 🔧 Troubleshooting

### **El cron no se ejecuta**

1. ✅ Verifica que tienes plan **Pro** de Vercel
2. ✅ Revisa **Settings → Cron Jobs** en Vercel dashboard
3. ✅ Verifica que el `schedule` esté en UTC
4. ✅ Revisa logs en **Deployments → Functions**

### **Error 401 Unauthorized**

El endpoint necesita autenticación. Opciones:

**A.** Usar CRON_SECRET (recomendado) - Ver arriba  
**B.** Usar servicio externo como cron-job.org que permite headers

### **No llegan notificaciones a usuarios**

1. ✅ Verifica que el endpoint se ejecutó: logs en Vercel
2. ✅ Verifica que hay usuarios con hijos: `GET /api/admin/reminders/stats`
3. ✅ Verifica que usuarios tienen tokens FCM
4. ✅ Revisa logs: `📅 [DAILY] Notificación enviada a...`

### **Todos los mensajes son 'fallback'**

1. ✅ Verifica `OPENAI_API_KEY` en variables de entorno
2. ✅ Revisa créditos en [platform.openai.com](https://platform.openai.com)
3. ✅ Verifica logs: `✅ [DAILY] Mensaje generado por ChatGPT`

---

## 📅 Cambiar Frecuencia

Puedes cambiar la frecuencia sin modificar el cron job:

```bash
# Cambiar a semanal
curl -X PUT https://api.munpa.online/api/admin/reminders/config \
  -H "Authorization: Bearer {admin_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "frequency": "weekly"
  }'
```

El cron seguirá ejecutándose diariamente, pero el sistema verificará internamente si debe enviar según la frecuencia configurada.

---

## ⚡ Mejoras Recomendadas

### **1. Agregar validación con CRON_SECRET**

Modificar endpoint para aceptar `x-cron-secret` header.

### **2. Notificaciones de errores**

Si el cron falla, enviar email al admin.

### **3. Webhook de confirmación**

Después de cada ejecución, enviar webhook con stats a Discord/Slack.

---

## 📝 Resumen Rápido

### **Con Vercel Pro:**

1. ✅ `vercel.json` ya configurado
2. ✅ Ajustar horario a zona horaria México: `0 15 * * *`
3. ✅ `git push origin main`
4. ✅ Verificar en Vercel Dashboard

### **Sin Vercel Pro (Gratis):**

1. ✅ Crear cuenta en [cron-job.org](https://cron-job.org)
2. ✅ URL: `https://api.munpa.online/api/notifications/daily-reminders`
3. ✅ POST con header: `Authorization: Bearer {admin_token}`
4. ✅ Schedule: 9:00 AM diario

---

## 🎉 ¡Listo!

Una vez configurado, los recordatorios se enviarán automáticamente todos los días a las 9am. 

Ver estadísticas en: `GET /api/admin/reminders/stats`

---

**¿Dudas?** Revisa los logs en Vercel o contacta al equipo de desarrollo.

