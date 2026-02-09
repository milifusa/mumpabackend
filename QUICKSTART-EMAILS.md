# 🚀 Guía de Inicio Rápido - Sistema de Emails

## ⏱️ Tiempo estimado: 15 minutos

Esta guía te llevará paso a paso para configurar el sistema de emails automatizados en Munpa.

---

## 📋 Checklist Pre-requisitos

Antes de comenzar, asegúrate de tener:
- [ ] Acceso a la cuenta de Vercel donde está desplegado Munpa
- [ ] Acceso al repositorio de GitHub
- [ ] Node.js instalado localmente (para pruebas)

---

## Paso 1: Crear Cuenta en Resend (5 min)

### 1.1 Registro
1. Ve a [resend.com](https://resend.com)
2. Haz clic en "Sign Up"
3. Regístrate con tu email (o GitHub)

### 1.2 Obtener API Key
1. Una vez dentro, ve a **API Keys** en el menú lateral
2. Haz clic en **"Create API Key"**
3. Dale un nombre: `Munpa Production`
4. Permisos: Selecciona **"Sending access"**
5. Haz clic en **"Add"**
6. **COPIA la API Key** (solo se muestra una vez)
   ```
   re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

---

## Paso 2: Instalar Dependencias (2 min)

### 2.1 En tu terminal local:

```bash
cd /Users/Mishu/Documents/mumpabackend
npm install resend
```

### 2.2 Verificar instalación:

```bash
npm list resend
```

Deberías ver algo como:
```
mumpabackend@1.0.0 /Users/Mishu/Documents/mumpabackend
└── resend@3.2.0
```

---

## Paso 3: Configurar Variables de Entorno (3 min)

### 3.1 Local (para pruebas)

Edita tu archivo `.env` local:

```bash
# Agregar al final del archivo .env
RESEND_API_KEY=re_tu_api_key_aqui
```

### 3.2 Vercel (para producción)

1. Ve a [vercel.com](https://vercel.com)
2. Abre tu proyecto **Munpa Backend**
3. Ve a **Settings** → **Environment Variables**
4. Agrega una nueva variable:
   - **Name**: `RESEND_API_KEY`
   - **Value**: `re_tu_api_key_aqui` (la que copiaste en el Paso 1)
   - **Environment**: Selecciona todos (Production, Preview, Development)
5. Haz clic en **"Save"**

---

## Paso 4: Probar Localmente (3 min)

### 4.1 Iniciar servidor local:

```bash
cd /Users/Mishu/Documents/mumpabackend
node server.js
```

### 4.2 Probar email de bienvenida:

Abre una nueva terminal y ejecuta:

```bash
curl -X POST http://localhost:3000/api/test/send-welcome-email \
  -H "Content-Type: application/json" \
  -d '{
    "userName": "Tu Nombre",
    "userEmail": "tu@email.com"
  }'
```

**Nota**: Necesitarás crear este endpoint de prueba primero. Alternativamente, puedes probar registrando un nuevo usuario.

### 4.3 Verificar email:

1. Ve a tu bandeja de entrada (`tu@email.com`)
2. Deberías ver un email de **Munpa** con el asunto "¡Bienvenida a Munpa, [Tu Nombre]!"
3. Si no lo ves, revisa la carpeta de spam

---

## Paso 5: Desplegar a Producción (2 min)

### 5.1 Hacer commit de los cambios:

```bash
cd /Users/Mishu/Documents/mumpabackend
git add .
git commit -m "Add email system with Resend"
git push
```

### 5.2 Desplegar en Vercel:

```bash
vercel --prod --yes
```

O simplemente espera a que Vercel despliegue automáticamente desde GitHub.

### 5.3 Verificar deployment:

1. Ve a [vercel.com](https://vercel.com)
2. Abre tu proyecto
3. En la pestaña **Deployments**, verifica que el último deployment esté en **"Ready"**
4. Verifica que los cron jobs estén configurados en **Settings** → **Cron Jobs**

---

## Paso 6: Verificar Cron Jobs (2 min)

### 6.1 En Vercel Dashboard:

1. Ve a **Settings** → **Cron Jobs**
2. Deberías ver:
   - ✅ `/api/cron/process-birthdays` - Diario a las 8am
   - ✅ `/api/cron/process-event-reminders` - Diario a las 9am

### 6.2 Probar manualmente (opcional):

```bash
curl https://api.munpa.online/api/cron/process-birthdays
```

Deberías recibir:
```json
{
  "success": true,
  "birthdaysToday": 0,
  "birthdaysTomorrow": 1,
  "emailsSent": 1
}
```

---

## 🎉 ¡Listo!

Tu sistema de emails está configurado y funcionando. Ahora:

### Emails que se enviarán automáticamente:

✅ **Al registrarse**: Email de bienvenida  
✅ **Al agregar primer hijo**: Email de felicitación  
✅ **Al confirmar asistencia a evento**: Email de confirmación  
✅ **24h antes de evento**: Recordatorio  
✅ **Día de cumpleaños del hijo**: Email especial  
✅ **Día antes del cumpleaños**: Recordatorio  

### Próximos Pasos Opcionales:

1. **Verificar dominio personalizado** (para mejor deliverability)
2. **Configurar webhooks** (para tracking avanzado)
3. **Agregar más templates** (resumen semanal, etc.)

---

## 🐛 Troubleshooting Rápido

### Problema: Emails no se envían

**Solución 1**: Verificar API Key
```bash
# En tu terminal
echo $RESEND_API_KEY
```

**Solución 2**: Ver logs en Resend
1. Ve a [resend.com](https://resend.com)
2. Clic en **"Logs"** en el menú lateral
3. Busca errores recientes

**Solución 3**: Verificar rate limits
- Plan Free: 100 emails/día
- Si excediste el límite, espera hasta mañana o upgradea

### Problema: Emails van a spam

**Solución**: Verificar dominio (ver Paso Opcional abajo)

### Problema: Cron jobs no se ejecutan

**Solución**: Verificar en Vercel
1. Ve a **Settings** → **Cron Jobs**
2. Verifica que los paths sean correctos
3. Verifica que el schedule sea correcto (formato cron)

---

## 📊 Monitoreo

### Ver estadísticas de emails:

1. Ve a [resend.com](https://resend.com)
2. Clic en **"Emails"** en el menú lateral
3. Verás:
   - Emails enviados
   - Tasa de entrega
   - Tasa de apertura
   - Tasa de clicks

---

## 🎯 Paso Opcional: Verificar Dominio (Recomendado para Producción)

Este paso mejora la deliverability (menos emails en spam) pero no es obligatorio para empezar.

### 1. Agregar dominio en Resend:

1. En [resend.com](https://resend.com), ve a **Domains**
2. Haz clic en **"Add Domain"**
3. Ingresa: `munpa.online`
4. Haz clic en **"Add"**

### 2. Configurar DNS:

Resend te dará 3 registros DNS para agregar. Ve a tu proveedor de DNS (GoDaddy, Cloudflare, etc.) y agrega:

**Registro SPF**:
```
Type: TXT
Name: @
Value: v=spf1 include:amazonses.com ~all
```

**Registro DKIM** (ejemplo):
```
Type: CNAME
Name: resend._domainkey
Value: resend._domainkey.munpa.online.amazonses.com
```

**Registro DMARC**:
```
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=none;
```

### 3. Verificar:

1. Espera 5-10 minutos para propagación DNS
2. En Resend, haz clic en **"Verify"**
3. Si todo está bien, verás un ✅ verde

### 4. Actualizar código:

En `services/emailService.js`, cambia:

```javascript
const FROM_EMAIL = 'Munpa <hola@munpa.online>';  // Usa tu dominio verificado
```

---

## 📞 Soporte

Si tienes problemas:
1. Revisa los logs en Resend Dashboard
2. Revisa los logs en Vercel
3. Consulta [Resend Docs](https://resend.com/docs)
4. Revisa `SISTEMA-EMAILS.md` para más detalles

---

## ✅ Verificación Final

Marca cada item cuando lo completes:

- [ ] Cuenta creada en Resend
- [ ] API Key obtenida
- [ ] `npm install resend` ejecutado
- [ ] Variable `RESEND_API_KEY` agregada localmente
- [ ] Variable `RESEND_API_KEY` agregada en Vercel
- [ ] Email de prueba enviado y recibido
- [ ] Código desplegado a producción
- [ ] Cron jobs visibles en Vercel
- [ ] Primeros emails automáticos enviados ✨

---

**Tiempo total**: ~15 minutos  
**Dificultad**: Fácil 😊  
**Estado**: ✅ Listo para usar  

¡Felicidades! 🎉 Tu sistema de emails está funcionando.
