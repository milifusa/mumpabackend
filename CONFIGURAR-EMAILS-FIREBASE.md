# 📧 Configurar Emails de Restablecimiento de Contraseña en Firebase

## ⚠️ Problema Actual
Los emails de "Olvidé mi contraseña" no están llegando a los usuarios porque Firebase necesita configuración adicional.

## ✅ Solución: Configurar Firebase Authentication

### Paso 1: Acceder a Firebase Console

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto: **mumpabackend**
3. En el menú lateral, ve a **Authentication**

### Paso 2: Configurar Plantillas de Email

1. En Authentication, ve a la pestaña **Templates** (Plantillas)
2. Busca **Password reset** (Restablecer contraseña)
3. Haz clic en el ícono de lápiz ✏️ para editar

### Paso 3: Personalizar la Plantilla

#### 3.1 Configuración del Remitente (Sender)
```
Nombre del remitente: Munpa
Email del remitente: noreply@munpa.online
```

**IMPORTANTE:** Si usas un email personalizado (como `noreply@munpa.online`), necesitas:
- Verificar el dominio en Firebase
- O usar el email predeterminado de Firebase: `noreply@mumpabackend.firebaseapp.com`

#### 3.2 Asunto del Email
```
Español: Restablece tu contraseña de Munpa
English: Reset your Munpa password
```

#### 3.3 Cuerpo del Email (Plantilla)

**Versión en Español:**
```html
<p>Hola,</p>

<p>Recibimos una solicitud para restablecer la contraseña de tu cuenta de <strong>Munpa</strong>.</p>

<p>Para restablecer tu contraseña, haz clic en el siguiente botón:</p>

<p><a href="%LINK%" style="display: inline-block; padding: 12px 24px; background-color: #7c63d4; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">Restablecer Contraseña</a></p>

<p>O copia y pega este enlace en tu navegador:</p>
<p>%LINK%</p>

<p><strong>Este enlace expirará en 1 hora.</strong></p>

<p>Si no solicitaste restablecer tu contraseña, puedes ignorar este email.</p>

<p>Saludos,<br>
El equipo de Munpa 💝</p>

<hr>
<p style="font-size: 12px; color: #666;">
Este es un email automático, por favor no respondas a este mensaje.
</p>
```

### Paso 4: Configurar URL de Redirección

1. En la misma pantalla de Templates, desplázate hasta **Action URL**
2. Configura la URL a donde se redirigirá después de hacer clic:

```
https://munpa.online/reset-password
```

O si tienes múltiples URLs:
```
https://munpa.online/reset-password
https://www.munpa.online/reset-password
```

### Paso 5: Autorizar Dominios

1. En Authentication, ve a **Settings** > **Authorized domains**
2. Asegúrate de que estén autorizados:
   - `munpa.online`
   - `www.munpa.online`
   - `localhost` (para desarrollo)

### Paso 6: Verificar Configuración SMTP (Opcional)

Por defecto, Firebase usa su propio servicio de email. Si quieres usar tu propio servidor SMTP:

1. Ve a **Project Settings** > **Service accounts**
2. Genera una nueva clave privada
3. Configura SendGrid, Mailgun o tu proveedor de email preferido

## 🎨 Plantilla Personalizada Recomendada

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: white; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #7c63d4 0%, #9f89e8 100%); padding: 40px 20px; text-align: center;">
                            <h1 style="color: white; margin: 0; font-size: 28px;">🤱 Munpa</h1>
                            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 14px;">Tu compañera en el embarazo y crianza</p>
                        </td>
                    </tr>
                    
                    <!-- Body -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <h2 style="color: #333; margin: 0 0 20px 0; font-size: 24px;">Restablece tu contraseña</h2>
                            
                            <p style="color: #666; line-height: 1.6; margin: 0 0 20px 0;">
                                Hola,
                            </p>
                            
                            <p style="color: #666; line-height: 1.6; margin: 0 0 20px 0;">
                                Recibimos una solicitud para restablecer la contraseña de tu cuenta de Munpa.
                            </p>
                            
                            <p style="color: #666; line-height: 1.6; margin: 0 0 30px 0;">
                                Para restablecer tu contraseña, haz clic en el siguiente botón:
                            </p>
                            
                            <!-- Button -->
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center" style="padding: 0 0 30px 0;">
                                        <a href="%LINK%" style="display: inline-block; padding: 15px 40px; background-color: #7c63d4; color: white; text-decoration: none; border-radius: 25px; font-weight: bold; font-size: 16px;">
                                            Restablecer Contraseña
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="color: #666; line-height: 1.6; margin: 0 0 10px 0; font-size: 14px;">
                                O copia y pega este enlace en tu navegador:
                            </p>
                            
                            <p style="color: #7c63d4; line-height: 1.6; margin: 0 0 20px 0; font-size: 12px; word-break: break-all;">
                                %LINK%
                            </p>
                            
                            <div style="background-color: #fff8e1; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
                                <p style="color: #666; margin: 0; font-size: 14px;">
                                    ⚠️ <strong>Este enlace expirará en 1 hora.</strong>
                                </p>
                            </div>
                            
                            <p style="color: #999; line-height: 1.6; margin: 20px 0 0 0; font-size: 14px;">
                                Si no solicitaste restablecer tu contraseña, puedes ignorar este email de forma segura.
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f9f9f9; padding: 30px; text-align: center; border-top: 1px solid #eeeeee;">
                            <p style="color: #666; margin: 0 0 10px 0; font-size: 14px;">
                                Con cariño, el equipo de Munpa 💝
                            </p>
                            <p style="color: #999; margin: 0; font-size: 12px;">
                                Este es un email automático, por favor no respondas a este mensaje.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
```

## 🧪 Probar el Envío de Emails

### Desde la app/web:
1. Ve al formulario de "Olvidé mi contraseña"
2. Ingresa un email registrado
3. Deberías recibir el email en unos segundos

### Desde Postman o curl:
```bash
curl -X POST https://mumpabackend-jfqggku8i-mishu-lojans-projects.vercel.app/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "tu-email@ejemplo.com"
  }'
```

## 🔍 Solución de Problemas

### El email no llega:
1. **Revisa Spam/Correo no deseado**
2. **Verifica que el email esté registrado** en Firebase Auth
3. **Comprueba los logs de Firebase:**
   - Ve a Firebase Console > Authentication > Users
   - Busca el usuario y verifica su estado

4. **Revisa los logs del backend:**
   - Busca mensajes con `[FORGOT-PASSWORD]`
   - Debería aparecer: `✅ [FORGOT-PASSWORD] Email de restablecimiento enviado`

### Error "unauthorized-continue-uri":
- Necesitas agregar la URL a los dominios autorizados en Firebase Console

### Email llega pero el link no funciona:
- Verifica que la URL configurada en Firebase coincida con tu frontend
- Asegúrate de que tu app esté escuchando la ruta `/reset-password`

## 📱 Configuración en el Frontend

En tu app React Native / Web, necesitas manejar el deep link:

```javascript
// En tu componente de Reset Password
const ResetPasswordScreen = () => {
  const [oobCode, setOobCode] = useState('');
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    // Extraer el código del URL
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('oobCode');
    if (code) {
      setOobCode(code);
    }
  }, []);

  const handleResetPassword = async () => {
    try {
      const response = await fetch('https://tu-backend.com/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oobCode, newPassword })
      });
      
      if (response.ok) {
        alert('Contraseña actualizada exitosamente');
        // Redirigir al login
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    // Tu UI aquí
  );
};
```

## ✅ Checklist Final

- [ ] Configurar plantilla de email en Firebase Console
- [ ] Verificar dominio del remitente
- [ ] Autorizar dominios de redirección
- [ ] Probar envío de email desde la app
- [ ] Verificar que el link funcione
- [ ] Comprobar que el restablecimiento funcione
- [ ] Revisar que llegue a bandeja de entrada (no spam)

## 🆘 Soporte

Si después de configurar todo sigue sin funcionar, contacta:
- Firebase Support: https://firebase.google.com/support
- Revisa los logs del backend en Vercel

