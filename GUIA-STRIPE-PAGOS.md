# 💳 Guía: Pagos con Stripe

Integración de Stripe para pagar consultas médicas.

---

## 1️⃣ Configuración Stripe

### 1.1 Crear cuenta

1. Registrarse en [dashboard.stripe.com](https://dashboard.stripe.com)
2. Activar la cuenta (modo test o live)

### 1.2 Credenciales

- **Clave secreta** (Secret Key): Developers → API keys → Secret key
- **Clave pública** (Publishable Key): Para el frontend
- **Webhook signing secret**: Developers → Webhooks → Add endpoint

### 1.3 Variables de entorno

En `.env` y en Vercel:

```env
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

---

## 2️⃣ Flujo recomendado (frontend confirma)

```
1. App: POST /api/consultations/:id/payment/create-intent
   → Recibe { clientSecret, paymentIntentId }

2. App: Stripe SDK confirmPayment(clientSecret)
   → Usuario ingresa tarjeta, Stripe procesa

3. Stripe: Envía webhook payment_intent.succeeded a tu backend

4. Backend: Webhook actualiza consulta (status=pending, payment=completed)
5. Backend: Notifica al especialista
```

---

## 3️⃣ API Backend

### 3.1 Crear PaymentIntent

```http
POST /api/consultations/:consultationId/payment/create-intent
Authorization: Bearer {user_token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "clientSecret": "pi_xxx_secret_xxx",
    "paymentIntentId": "pi_xxx"
  }
}
```

- `clientSecret`: Usar con Stripe SDK para confirmar el pago
- `paymentIntentId`: Identificador del PaymentIntent

### 3.2 Webhook (Stripe lo llama)

```
POST /api/webhooks/stripe
```

Configurar en Stripe Dashboard:
- URL: `https://api.munpa.online/api/webhooks/stripe`
- Eventos: `payment_intent.succeeded`

El webhook actualiza la consulta y notifica al especialista.

### 3.3 Pago simulado (sin Stripe)

Si `STRIPE_SECRET_KEY` no está configurado:

```http
POST /api/consultations/:consultationId/payment
Authorization: Bearer {user_token}
```

Simula un pago exitoso (para desarrollo).

---

## 4️⃣ Frontend (React Native)

### 4.1 Instalar

```bash
npm install @stripe/stripe-react-native
```

### 4.2 Configuración

```jsx
import { StripeProvider } from '@stripe/stripe-react-native';

// En App.js
<StripeProvider publishableKey="pk_test_xxx">
  <App />
</StripeProvider>
```

### 4.3 Obtener clientSecret y confirmar

```javascript
// 1. Crear PaymentIntent
const { data } = await api.post(`/api/consultations/${consultationId}/payment/create-intent`);
const { clientSecret } = data.data;

// 2. Confirmar con Stripe
import { useConfirmPayment } from '@stripe/stripe-react-native';

const { confirmPayment } = useConfirmPayment();

const { error } = await confirmPayment(clientSecret, {
  paymentMethodType: 'Card',
  // O usar paymentMethodId si ya tienes uno
});

if (error) {
  Alert.alert('Error', error.message);
} else {
  // Pago enviado. El webhook actualizará la consulta.
  // Puedes hacer polling o navegar a "Pago enviado"
  navigation.navigate('ConsultationDetail', { id: consultationId });
}
```

### 4.4 Usar CardField

```jsx
import { CardField, useConfirmPayment } from '@stripe/stripe-react-native';

function PaymentScreen() {
  const { confirmPayment } = useConfirmPayment();
  const [clientSecret, setClientSecret] = useState(null);

  useEffect(() => {
    api.post(`/api/consultations/${id}/payment/create-intent`)
      .then(r => setClientSecret(r.data.data.clientSecret));
  }, []);

  const handlePay = async () => {
    const { error } = await confirmPayment(clientSecret, { paymentMethodType: 'Card' });
    if (!error) Alert.alert('Éxito', 'Pago procesado');
  };

  return (
    <>
      <CardField />
      <Button title="Pagar" onPress={handlePay} />
    </>
  );
}
```

---

## 5️⃣ Webhook en Stripe Dashboard

1. Developers → Webhooks → Add endpoint
2. URL: `https://api.munpa.online/api/webhooks/stripe`
3. Eventos: seleccionar `payment_intent.succeeded`
4. Copiar el **Signing secret** → `STRIPE_WEBHOOK_SECRET`

---

## 6️⃣ Testing

### Tarjetas de prueba (modo test)

| Número | Resultado |
|--------|-----------|
| 4242 4242 4242 4242 | Pago exitoso |
| 4000 0000 0000 0002 | Rechazado |
| 4000 0025 0000 3155 | Requiere 3D Secure |

- Fecha: cualquier fecha futura
- CVC: cualquier 3 dígitos
- Código postal: cualquier

---

## 7️⃣ Resumen de endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/consultations/:id/payment/create-intent` | Crear PaymentIntent, retorna clientSecret |
| POST | `/api/consultations/:id/payment` | Pago simulado (sin Stripe) o confirmar con paymentMethodId |
| POST | `/api/webhooks/stripe` | Webhook de Stripe (no requiere auth) |
