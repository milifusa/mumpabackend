# 📧 Resumen del Sistema de Emails - Munpa

## ✅ Lo que se ha implementado

### 1. Servicio de Emails (`services/emailService.js`)
Sistema completo con **Resend** que incluye:

#### Templates Implementados (10):
1. ✉️ **Bienvenida al registrarse**
2. ✉️ **Primer hijo agregado**
3. ✉️ **Confirmación de asistencia a evento**
4. ✉️ **Recordatorio de evento (24h antes)**
5. ✉️ **Evento cancelado**
6. ✉️ **Cumpleaños del hijo**
7. ✉️ **Recordatorio de cumpleaños (día antes)**
8. ✉️ **Resumen semanal de hitos**
9. ✉️ **Producto vendido**
10. ✉️ **Resumen semanal de actividad**

### 2. Cron Jobs Automatizados
Configurados en `vercel.json` y `server.js`:

| Cron Job | Frecuencia | Descripción |
|----------|-----------|-------------|
| `/api/cron/process-birthdays` | Diario 8am | Envía cumpleaños y recordatorios |
| `/api/cron/process-event-reminders` | Diario 9am | Recordatorios 24h antes de eventos |

### 3. Endpoints de Prueba
Para testing del sistema:
- `POST /api/test/send-welcome-email`
- `POST /api/test/send-birthday-email`

### 4. Documentación Completa
- ✅ `SISTEMA-EMAILS.md` - Guía completa técnica
- ✅ `QUICKSTART-EMAILS.md` - Guía de inicio rápido
- ✅ `.env.example` - Variables de entorno actualizadas

---

## 🎯 Eventos que Disparan Emails

### Automáticos (Cron Jobs)
```
├── Cumpleaños
│   ├── Día del cumpleaños → Email especial 🎂
│   └── Día anterior → Recordatorio 🎈
└── Eventos
    └── 24h antes → Recordatorio ⏰
```

### Manuales (Al momento de la acción)
```
├── Registro de usuario → Email de bienvenida
├── Agregar primer hijo → Email de felicitación
├── Confirmar asistencia a evento → Confirmación
├── Cancelar evento → Notificación a asistentes
├── Vender producto → Notificación al vendedor
└── Resumen semanal → Digest de actividad (futuro)
```

---

## 🚀 Cómo Usar en el Código

### Ejemplo 1: Email al Registrar Usuario

```javascript
// En tu endpoint de registro
const { sendWelcomeEmail } = require('./services/emailService');

app.post('/api/auth/register', async (req, res) => {
  try {
    // ... crear usuario en Firebase
    
    // Enviar email de bienvenida (no bloquea la respuesta)
    sendWelcomeEmail(
      userData.displayName,
      userData.email
    ).catch(err => console.error('Error:', err));
    
    res.json({ success: true, userId: newUserId });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
```

### Ejemplo 2: Email al Confirmar Evento

```javascript
// En tu endpoint de asistencia a eventos
const { sendEventConfirmation } = require('./services/emailService');

app.post('/api/posts/:postId/attend', authenticateToken, async (req, res) => {
  try {
    // ... agregar usuario a lista de asistentes
    
    // Enviar confirmación
    sendEventConfirmation(
      req.user.displayName,
      req.user.email,
      eventData
    ).catch(err => console.error('Error:', err));
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
```

### Ejemplo 3: Email de Cumpleaños (Automático via Cron)

```javascript
// Ya implementado en server.js
// Corre automáticamente todos los días a las 8am
// No necesitas hacer nada, solo funciona ✨
```

---

## 📋 Próximos Pasos para Ti

### Paso 1: Configuración Básica (15 min)
Sigue la guía: `QUICKSTART-EMAILS.md`

1. Registrarte en [Resend](https://resend.com) ✅
2. Obtener API Key ✅
3. Ejecutar `npm install resend` ✅
4. Agregar `RESEND_API_KEY` a Vercel ✅
5. Desplegar cambios ✅

### Paso 2: Integrar en Endpoints Existentes
Agregar llamadas a `emailService` en tus endpoints actuales:

#### En Registro de Usuario:
```javascript
// Archivo: server.js (busca tu endpoint de registro)
// Agregar después de crear el usuario:

const { sendWelcomeEmail } = require('./services/emailService');

sendWelcomeEmail(
  newUser.displayName || newUser.name,
  newUser.email
).catch(err => console.error('Error enviando bienvenida:', err));
```

#### En Creación de Hijo:
```javascript
// Archivo: server.js (busca POST /api/auth/children)
// Agregar después de crear el hijo:

const { sendFirstChildEmail } = require('./services/emailService');

// Verificar si es el primer hijo
const childrenCount = await db.collection('children')
  .where('parentId', '==', userId)
  .get();

if (childrenCount.size === 1) {
  const age = calculateAge(childData.birthdate);
  
  sendFirstChildEmail(
    req.user.displayName,
    req.user.email,
    childData.name,
    age
  ).catch(err => console.error('Error:', err));
}
```

#### En Asistencia a Eventos:
```javascript
// Archivo: server.js (busca POST /api/posts/:postId/attend)
// Agregar después de confirmar asistencia:

const { sendEventConfirmation } = require('./services/emailService');

sendEventConfirmation(
  req.user.displayName,
  req.user.email,
  {
    id: postId,
    title: post.eventData.title,
    description: post.content,
    eventDate: post.eventData.eventDate,
    location: post.eventData.location,
    checkInCode: post.eventData.checkInCode
  }
).catch(err => console.error('Error:', err));
```

#### En Cancelación de Eventos:
```javascript
// Archivo: server.js (busca PATCH /api/admin/events/:eventId/cancel)
// Agregar después de cancelar el evento:

const { sendEventCancelled } = require('./services/emailService');

// Notificar a todos los asistentes
for (const attendee of event.attendees) {
  sendEventCancelled(
    attendee.userName,
    attendee.userEmail,
    eventData,
    reason // opcional
  ).catch(err => console.error('Error:', err));
}
```

---

## 💰 Costos Estimados

### Plan Gratuito de Resend:
- ✅ 3,000 emails/mes gratis
- ✅ Suficiente para empezar

### Estimación de Uso Mensual:
```
Usuarios activos: 1,500
Emails por usuario/mes: 5 (promedio)
= 7,500 emails/mes

Plan recomendado: Pro ($20/mes)
```

### Desglose de Emails:
```
Email de bienvenida:         ~50/mes (nuevos usuarios)
Cumpleaños:                  ~125/mes (4 cumpleaños/día)
Recordatorios de eventos:    ~300/mes (10 eventos/mes x 30 asistentes)
Confirmaciones de eventos:   ~300/mes
Resumen semanal (futuro):    ~6,000/mes (1,500 usuarios x 4 semanas)
```

---

## 🎨 Personalización

### Cambiar Colores del Brand

En `services/emailService.js`:

```javascript
// Buscar estas líneas y cambiar los colores:

// Gradiente principal
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

// Cambiar a tus colores:
background: linear-gradient(135deg, #TU_COLOR_1 0%, #TU_COLOR_2 100%);
```

### Agregar Logo

```javascript
const emailTemplate = (content, preheader = '') => `
  ...
  <div class="header">
    <img src="https://munpa.online/logo.png" alt="Munpa" style="max-width: 150px;" />
    <h1 class="logo">Munpa 💜</h1>
  </div>
  ...
`;
```

### Crear Nuevos Templates

Sigue el patrón existente en `emailService.js`:

```javascript
const myNewEmail = (userName, userEmail, data) => {
  const content = `
    <h1>Mi Nuevo Email</h1>
    <p>Hola ${userName},</p>
    <p>Contenido aquí...</p>
  `;
  
  return {
    to: userEmail,
    from: FROM_EMAIL,
    subject: 'Asunto del Email',
    html: emailTemplate(content, 'Preheader text'),
  };
};

// Función de envío
const sendMyNewEmail = async (userName, userEmail, data) => {
  const emailData = myNewEmail(userName, userEmail, data);
  return await sendEmail(emailData);
};

// Exportar
module.exports = {
  // ... otros exports
  sendMyNewEmail,
};
```

---

## 🐛 Troubleshooting Común

### Problema: "Resend is not defined"
**Solución**: Ejecutar `npm install resend`

### Problema: "API key is invalid"
**Solución**: Verificar que `RESEND_API_KEY` esté correctamente configurada en Vercel

### Problema: Emails no llegan
**Solución**: 
1. Revisar logs en [resend.com/logs](https://resend.com/logs)
2. Verificar carpeta de spam
3. Confirmar que el email del destinatario es válido

### Problema: Emails van a spam
**Solución**: Verificar dominio `munpa.online` en Resend (ver `QUICKSTART-EMAILS.md` - Paso Opcional)

### Problema: Cron jobs no se ejecutan
**Solución**: 
1. Verificar en Vercel Dashboard → Settings → Cron Jobs
2. Confirmar que los paths coinciden con los endpoints
3. Probar manualmente: `curl https://api.munpa.online/api/cron/process-birthdays`

---

## 📊 Monitoreo

### Ver Estadísticas:

1. Ve a [resend.com](https://resend.com/emails)
2. Verás métricas de:
   - ✅ Emails enviados
   - 📬 Tasa de entrega
   - 👀 Tasa de apertura  
   - 🖱️ Tasa de clicks

### Configurar Webhooks (Opcional):

Para tracking avanzado, configura webhooks en Resend:

1. En Resend: Settings → Webhooks
2. URL: `https://api.munpa.online/api/webhooks/email-events`
3. Eventos: Seleccionar todos

---

## ✅ Verificación de Implementación

### Checklist:

- [ ] Código desplegado a producción
- [ ] `RESEND_API_KEY` configurada en Vercel
- [ ] Cron jobs visibles en Vercel Dashboard
- [ ] Email de prueba enviado y recibido
- [ ] Email de bienvenida integrado en registro
- [ ] Email de confirmación en eventos
- [ ] Cron de cumpleaños funcionando
- [ ] Cron de recordatorios funcionando

### Pruebas Recomendadas:

1. **Email de Bienvenida**:
   ```bash
   curl -X POST https://api.munpa.online/api/test/send-welcome-email \
     -H "Content-Type: application/json" \
     -d '{"userName":"Test","userEmail":"tu@email.com"}'
   ```

2. **Email de Cumpleaños**:
   ```bash
   curl -X POST https://api.munpa.online/api/test/send-birthday-email \
     -H "Content-Type: application/json" \
     -d '{"userName":"Test","userEmail":"tu@email.com","childName":"Sofía","age":2}'
   ```

3. **Cron de Cumpleaños**:
   ```bash
   curl https://api.munpa.online/api/cron/process-birthdays
   ```

---

## 📞 Recursos

### Documentación:
- 📄 `SISTEMA-EMAILS.md` - Guía técnica completa
- 🚀 `QUICKSTART-EMAILS.md` - Inicio rápido (15 min)
- 🔐 `.env.example` - Variables de entorno

### Enlaces Útiles:
- [Resend Dashboard](https://resend.com)
- [Resend Docs](https://resend.com/docs)
- [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs)

---

## 🎉 Estado Final

**Estado:** ✅ Implementado y Listo para Configurar  
**Archivos Creados:** 5  
**Templates de Email:** 10  
**Cron Jobs:** 2  
**Endpoints de Prueba:** 2  

**Próximo Paso:** Seguir `QUICKSTART-EMAILS.md` (15 minutos) 🚀

---

¡El sistema de emails está completo y listo para usar! Solo necesitas seguir la guía de inicio rápido para configurar tu cuenta de Resend y comenzar a enviar emails. 📧✨
