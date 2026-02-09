# 📧 Sistema de Emails Automatizados - Munpa

## Descripción

Sistema completo de emails transaccionales y automatizados usando **Resend** para enviar emails en eventos específicos de la aplicación.

---

## 🚀 Configuración

### 1. Instalar Resend

```bash
npm install resend
```

### 2. Obtener API Key de Resend

1. Regístrate en [Resend.com](https://resend.com)
2. Crea un API Key en el dashboard
3. Verifica tu dominio (o usa el dominio de prueba temporal)

### 3. Configurar Variables de Entorno

Agregar a `.env`:

```env
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxx
```

### 4. Verificar Dominio (Producción)

Para usar tu dominio `munpa.online`:

1. En Resend Dashboard → Domains → Add Domain
2. Agregar `munpa.online`
3. Configurar DNS records:
   - SPF: `v=spf1 include:amazonses.com ~all`
   - DKIM: (Resend te dará los valores exactos)
   - DMARC: `v=DMARC1; p=none;`

---

## 📋 Eventos de Email Implementados

### 1. Autenticación y Onboarding
- ✅ **Bienvenida al registrarse** - `sendWelcomeEmail()`
- ✅ **Primer hijo agregado** - `sendFirstChildEmail()`

### 2. Eventos de Comunidad
- ✅ **Confirmación de asistencia** - `sendEventConfirmation()`
- ✅ **Recordatorio 24h antes** - `sendEventReminder()`
- ✅ **Evento cancelado** - `sendEventCancelled()`

### 3. Cumpleaños
- ✅ **Día del cumpleaños** - `sendBirthdayEmail()`
- ✅ **Recordatorio día antes** - `sendBirthdayReminder()`

### 4. Desarrollo
- ✅ **Resumen semanal de hitos** - `sendWeeklyMilestones()`

### 5. Marketplace
- ✅ **Producto vendido** - `sendProductSold()`

### 6. Engagement
- ✅ **Resumen semanal** - `sendWeeklyDigest()`

---

## 💻 Uso en el Código

### Ejemplo 1: Email de Bienvenida al Registrar Usuario

```javascript
// En el endpoint de registro de usuario
const { sendWelcomeEmail } = require('./services/emailService');

app.post('/api/auth/register', async (req, res) => {
  try {
    // ... crear usuario en Firebase
    
    const userData = {
      name: 'María García',
      email: 'maria@example.com'
    };
    
    // Enviar email de bienvenida (asíncrono, no bloquea la respuesta)
    sendWelcomeEmail(userData.name, userData.email).catch(err => {
      console.error('Error enviando email de bienvenida:', err);
    });
    
    res.json({ success: true, message: 'Usuario registrado' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
```

### Ejemplo 2: Email al Confirmar Asistencia a Evento

```javascript
// En el endpoint de asistencia a eventos
const { sendEventConfirmation } = require('./services/emailService');

app.post('/api/posts/:postId/attend', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.uid;
    const { postId } = req.params;
    
    // ... lógica de agregar asistente
    
    const eventData = {
      id: postId,
      title: 'Taller de Lactancia',
      eventDate: { _seconds: Date.now() / 1000 },
      location: {
        name: 'Centro Comunitario',
        address: 'Av. Principal 123'
      },
      description: 'Aprende técnicas de lactancia...',
      checkInCode: 'ABC123'
    };
    
    // Enviar confirmación
    sendEventConfirmation(
      req.user.displayName,
      req.user.email,
      eventData
    ).catch(err => console.error('Error enviando confirmación:', err));
    
    res.json({ success: true, message: 'Asistencia confirmada' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
```

### Ejemplo 3: Email al Agregar Primer Hijo

```javascript
// En el endpoint de crear hijo
const { sendFirstChildEmail } = require('./services/emailService');

app.post('/api/auth/children', authenticateToken, async (req, res) => {
  try {
    const { name, birthdate } = req.body;
    const userId = req.user.uid;
    
    // ... crear hijo en Firestore
    
    // Verificar si es el primer hijo
    const childrenSnapshot = await db
      .collection('children')
      .where('parentId', '==', userId)
      .get();
    
    if (childrenSnapshot.size === 1) {
      // Es el primer hijo
      const age = calculateAge(birthdate);
      
      sendFirstChildEmail(
        req.user.displayName,
        req.user.email,
        name,
        age
      ).catch(err => console.error('Error enviando email:', err));
    }
    
    res.json({ success: true, childId: newChildId });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
```

---

## ⏰ Cron Jobs para Emails Automáticos

### 1. Cron Job de Cumpleaños (Diario a las 8am)

```javascript
// En server.js
const { sendBirthdayEmail, sendBirthdayReminder } = require('./services/emailService');

app.get('/api/cron/process-birthdays', async (req, res) => {
  try {
    console.log('🎂 [CRON] Procesando cumpleaños...');
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Obtener todos los hijos
    const childrenSnapshot = await db.collection('children').get();
    
    let birthdaysToday = 0;
    let birthdaysTomorrow = 0;
    
    for (const childDoc of childrenSnapshot.docs) {
      const child = childDoc.data();
      const birthdate = new Date(child.birthdate);
      
      // Mismo día y mes que hoy
      if (birthdate.getDate() === today.getDate() && 
          birthdate.getMonth() === today.getMonth()) {
        
        // Obtener datos del padre
        const parentDoc = await db.collection('users').doc(child.parentId).get();
        const parent = parentDoc.data();
        
        if (parent && parent.email) {
          const age = today.getFullYear() - birthdate.getFullYear();
          
          sendBirthdayEmail(
            parent.displayName || parent.name,
            parent.email,
            child.name,
            age
          ).catch(err => console.error('Error enviando cumpleaños:', err));
          
          birthdaysToday++;
        }
      }
      
      // Mismo día y mes que mañana (recordatorio)
      if (birthdate.getDate() === tomorrow.getDate() && 
          birthdate.getMonth() === tomorrow.getMonth()) {
        
        const parentDoc = await db.collection('users').doc(child.parentId).get();
        const parent = parentDoc.data();
        
        if (parent && parent.email) {
          const age = tomorrow.getFullYear() - birthdate.getFullYear();
          
          sendBirthdayReminder(
            parent.displayName || parent.name,
            parent.email,
            child.name,
            age
          ).catch(err => console.error('Error enviando recordatorio:', err));
          
          birthdaysTomorrow++;
        }
      }
    }
    
    console.log(`✅ [CRON] Procesados ${birthdaysToday} cumpleaños hoy, ${birthdaysTomorrow} mañana`);
    
    res.json({
      success: true,
      birthdaysToday,
      birthdaysTomorrow
    });
    
  } catch (error) {
    console.error('❌ [CRON] Error procesando cumpleaños:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});
```

### 2. Cron Job de Recordatorios de Eventos (Diario a las 9am)

```javascript
// En server.js
const { sendEventReminder } = require('./services/emailService');

app.get('/api/cron/process-event-reminders', async (req, res) => {
  try {
    console.log('⏰ [CRON] Procesando recordatorios de eventos...');
    
    const now = new Date();
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    // Buscar eventos que ocurren en las próximas 24 horas
    const postsSnapshot = await db.collection('posts')
      .where('postType', '==', 'event')
      .where('eventData.status', '==', 'upcoming')
      .get();
    
    let remindersSent = 0;
    
    for (const postDoc of postsSnapshot.docs) {
      const post = postDoc.data();
      const eventDate = new Date(post.eventData.eventDate._seconds * 1000);
      
      // Verificar si el evento es en las próximas 24 horas
      if (eventDate > now && eventDate <= in24Hours) {
        
        // Enviar recordatorio a cada asistente
        for (const attendee of post.eventData.attendees || []) {
          sendEventReminder(
            attendee.userName,
            attendee.userEmail,
            {
              id: postDoc.id,
              ...post.eventData
            }
          ).catch(err => console.error('Error enviando recordatorio:', err));
          
          remindersSent++;
        }
      }
    }
    
    console.log(`✅ [CRON] Enviados ${remindersSent} recordatorios de eventos`);
    
    res.json({ success: true, remindersSent });
    
  } catch (error) {
    console.error('❌ [CRON] Error procesando recordatorios:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});
```

### 3. Cron Job de Resumen Semanal (Lunes a las 10am)

```javascript
// En server.js
const { sendWeeklyDigest } = require('./services/emailService');

app.get('/api/cron/send-weekly-digest', async (req, res) => {
  try {
    console.log('📰 [CRON] Enviando resúmenes semanales...');
    
    const usersSnapshot = await db.collection('users').get();
    let digestsSent = 0;
    
    for (const userDoc of usersSnapshot.docs) {
      const user = userDoc.data();
      
      if (!user.email) continue;
      
      // Obtener datos para el resumen
      const topPosts = []; // Implementar query de posts populares
      const upcomingEvents = []; // Implementar query de eventos próximos
      const newProducts = []; // Implementar query de productos nuevos
      const communityStats = {}; // Implementar stats de comunidades
      
      sendWeeklyDigest(
        user.displayName || user.name,
        user.email,
        {
          topPosts,
          upcomingEvents,
          newProducts,
          communityStats
        }
      ).catch(err => console.error('Error enviando resumen:', err));
      
      digestsSent++;
    }
    
    console.log(`✅ [CRON] Enviados ${digestsSent} resúmenes semanales`);
    
    res.json({ success: true, digestsSent });
    
  } catch (error) {
    console.error('❌ [CRON] Error enviando resúmenes:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});
```

### 4. Configurar en `vercel.json`

```json
{
  "crons": [
    {
      "path": "/api/cron/process-birthdays",
      "schedule": "0 8 * * *"
    },
    {
      "path": "/api/cron/process-event-reminders",
      "schedule": "0 9 * * *"
    },
    {
      "path": "/api/cron/send-weekly-digest",
      "schedule": "0 10 * * 1"
    },
    {
      "path": "/api/cron/process-medication-notifications",
      "schedule": "*/10 * * * *"
    }
  ]
}
```

---

## 🎨 Personalización de Templates

### Cambiar Colores del Brand

En `emailService.js`, busca y modifica:

```javascript
// Gradiente principal
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

// Color de botones
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
```

### Agregar Logo

```javascript
const emailTemplate = (content, preheader = '') => `
  ...
  <div class="header">
    <img src="https://munpa.online/logo.png" alt="Munpa" style="max-width: 150px;" />
  </div>
  ...
`;
```

---

## 📊 Monitoreo y Analytics

### Ver Estadísticas en Resend Dashboard

Resend proporciona automáticamente:
- **Delivery Rate**: % de emails entregados
- **Open Rate**: % de emails abiertos
- **Click Rate**: % de emails con clicks
- **Bounce Rate**: % de emails rechazados
- **Spam Rate**: % de emails marcados como spam

### Webhook para Tracking

```javascript
// Endpoint para recibir webhooks de Resend
app.post('/api/webhooks/email-events', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const event = req.body;
    
    console.log('📧 [WEBHOOK] Evento de email:', event.type);
    
    switch (event.type) {
      case 'email.sent':
        console.log(`✅ Email enviado: ${event.data.email_id}`);
        break;
      case 'email.delivered':
        console.log(`📬 Email entregado: ${event.data.email_id}`);
        break;
      case 'email.opened':
        console.log(`👀 Email abierto: ${event.data.email_id}`);
        break;
      case 'email.clicked':
        console.log(`🖱️ Link clickeado: ${event.data.email_id}`);
        break;
      case 'email.bounced':
        console.log(`❌ Email rebotó: ${event.data.email_id}`);
        break;
    }
    
    res.json({ received: true });
    
  } catch (error) {
    console.error('❌ [WEBHOOK] Error:', error);
    res.status(500).json({ error: error.message });
  }
});
```

---

## 🔒 Seguridad y Mejores Prácticas

### 1. Rate Limiting
```javascript
// Limitar envíos por usuario
const emailRateLimit = new Map();

const canSendEmail = (userId, emailType) => {
  const key = `${userId}:${emailType}`;
  const lastSent = emailRateLimit.get(key);
  const now = Date.now();
  
  if (lastSent && now - lastSent < 60000) { // 1 minuto
    return false;
  }
  
  emailRateLimit.set(key, now);
  return true;
};
```

### 2. Validar Emails

```javascript
const isValidEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};
```

### 3. Unsubscribe

Agregar link de desuscripción en todos los emails:

```javascript
<p>
  Si no deseas recibir estos emails, puedes 
  <a href="${APP_URL}/settings/notifications?unsubscribe=${userId}&type=${emailType}">
    desuscribirte aquí
  </a>
</p>
```

---

## 💰 Costos

### Resend Pricing

| Plan | Emails/mes | Costo |
|------|-----------|-------|
| **Free** | 3,000 | $0 |
| **Pro** | 50,000 | $20 |
| **Business** | 100,000 | $80 |

**Estimación para Munpa:**
- 1,500 usuarios activos
- ~5 emails/usuario/mes promedio
- = ~7,500 emails/mes
- **Plan recomendado**: Free inicialmente, luego Pro

---

## ✅ Checklist de Implementación

### Fase 1: Setup Inicial
- [ ] Registrarse en Resend
- [ ] Obtener API Key
- [ ] Instalar `npm install resend`
- [ ] Agregar `RESEND_API_KEY` a `.env`
- [ ] Implementar `emailService.js`
- [ ] Probar email de bienvenida

### Fase 2: Emails Transaccionales
- [ ] Email de bienvenida al registrarse
- [ ] Email al agregar primer hijo
- [ ] Email de confirmación de evento
- [ ] Email de evento cancelado

### Fase 3: Emails Automáticos
- [ ] Cron job de cumpleaños
- [ ] Cron job de recordatorios de eventos
- [ ] Configurar en `vercel.json`

### Fase 4: Engagement
- [ ] Resumen semanal de actividad
- [ ] Resumen de hitos
- [ ] Notificaciones de marketplace

### Fase 5: Producción
- [ ] Verificar dominio `munpa.online`
- [ ] Configurar DNS (SPF, DKIM, DMARC)
- [ ] Probar en producción
- [ ] Configurar webhooks
- [ ] Monitorear métricas

---

## 🐛 Troubleshooting

### Emails no se envían

1. **Verificar API Key**
   ```bash
   echo $RESEND_API_KEY
   ```

2. **Ver logs en Resend Dashboard**
   - Ir a resend.com → Logs
   - Ver errores específicos

3. **Verificar rate limits**
   - Free tier: 100 emails/día
   - Esperar o upgradear plan

### Emails van a spam

1. **Verificar dominio**
   - Usar dominio verificado en lugar de `resend.dev`

2. **Configurar SPF/DKIM**
   - Agregar records DNS correctos

3. **Evitar palabras spam**
   - No usar: "GRATIS", "GANA", "URGENTE" en mayúsculas

### Dominio no verifica

1. **Verificar DNS**
   ```bash
   dig TXT munpa.online
   dig CNAME resend._domainkey.munpa.online
   ```

2. **Esperar propagación**
   - DNS puede tardar hasta 48 horas

---

## 📞 Soporte

Si tienes problemas:
1. Consulta [Resend Docs](https://resend.com/docs)
2. Revisa los logs en Resend Dashboard
3. Verifica configuración de DNS

---

## 🎉 Estado

**Estado:** ✅ Listo para Implementar  
**Servicio:** Resend  
**Templates:** 10 implementados  
**Cron Jobs:** 3 configurados  
**Fecha:** 8 Feb 2026
