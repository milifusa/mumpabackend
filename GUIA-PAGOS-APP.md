# 💳 Guía: Pagos en la App (Consultas + Productos Vendor)

Cobrar consultas médicas y productos del vendor con Stripe, incluyendo **Apple Pay** y **Google Pay**.

---

## 1️⃣ Configuración Stripe

### 1.1 Variables de entorno

En `.env` y en Vercel:

```env
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

### 1.2 Publishable Key (Frontend)

- **Nunca** pongas la clave secreta en el código del cliente.
- La publishable key va en el frontend para inicializar Stripe SDK.

```jsx
// Usar variable de entorno (recomendado)
<StripeProvider publishableKey={process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY}>
  <App />
</StripeProvider>

// O directamente (solo para pruebas)
<StripeProvider publishableKey="pk_live_51Sw059FNPFfINx9N0w6XVYTiwhLScYFkRByPqUUoZ9njM742TH328iULjnTlsmTRhlTEIBThmvh21KPtESshJDdt00rsRkc9tt">
  <App />
</StripeProvider>
```

En Expo/React Native, define en `app.json` o `.env`:

```env
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_51Sw059FNPFfINx9N0w6XVYTiwhLScYFkRByPqUUoZ9njM742TH328iULjnTlsmTRhlTEIBThmvh21KPtESshJDdt00rsRkc9tt
```

---

## 2️⃣ Métodos de pago: Apple Pay y Google Pay

El backend crea PaymentIntent con `payment_method_types: ['card']`. **Apple Pay y Google Pay funcionan a través del tipo `card`** en el SDK de Stripe: el frontend usa `paymentMethodType: 'ApplePay'` o `'GooglePay'` y el SDK crea un token de pago compatible.

**En el Stripe Dashboard** (Apple Pay y Google Pay Activados): [Settings → Payment methods](https://dashboard.stripe.com/settings/payment_methods)

### 2.1 Apple Pay (iOS)

1. **Stripe Dashboard**: Apple Pay debe estar activado (ya lo tienes).
2. **App**: En iOS, el botón Apple Pay aparece solo si el dispositivo y la cuenta están configurados.
3. **Dominio**: Si usas web, registra tu dominio en Stripe (para Apple Pay web).

```jsx
// React Native: Apple Pay aparece automáticamente si está disponible
const { error } = await confirmPayment(clientSecret, {
  paymentMethodType: 'Card',  // También soporta 'ApplePay' explícitamente
});

// Para forzar Apple Pay como método preferido:
const { error } = await confirmPayment(clientSecret, {
  paymentMethodType: 'ApplePay',
});
```

### 2.2 Google Pay (Android)

1. **Stripe Dashboard**: Google Pay debe estar activado (ya lo tienes).
2. **App**: En Android, el botón Google Pay aparece si el usuario tiene Google Pay configurado.

```jsx
// React Native: Google Pay aparece automáticamente si está disponible
const { error } = await confirmPayment(clientSecret, {
  paymentMethodType: 'Card',  // O 'GooglePay' explícitamente
});
```

### 2.3 Permitir varios métodos en la pantalla de pago

```jsx
import { 
  useConfirmPayment, 
  CardField, 
  ApplePayButton, 
  GooglePayButton 
} from '@stripe/stripe-react-native';

function PaymentScreen({ clientSecret }) {
  const { confirmPayment } = useConfirmPayment();

  const payWithCard = async () => {
    const { error } = await confirmPayment(clientSecret, { paymentMethodType: 'Card' });
    if (!error) navigation.navigate('Success');
  };

  const payWithApplePay = async () => {
    const { error } = await confirmPayment(clientSecret, { paymentMethodType: 'ApplePay' });
    if (!error) navigation.navigate('Success');
  };

  const payWithGooglePay = async () => {
    const { error } = await confirmPayment(clientSecret, { paymentMethodType: 'GooglePay' });
    if (!error) navigation.navigate('Success');
  };

  return (
    <View>
      {/* Apple Pay: solo visible en iOS */}
      <Platform.OS === 'ios' && (
        <ApplePayButton onPress={payWithApplePay} type="plain" />
      )}
      {/* Google Pay: solo visible en Android */}
      <Platform.OS === 'android' && (
        <GooglePayButton onPress={payWithGooglePay} />
      )}
      {/* Tarjeta: siempre disponible */}
      <CardField />
      <Button title="Pagar con tarjeta" onPress={payWithCard} />
    </View>
  );
}
```

---

## 3️⃣ Pagar consultas médicas

### 3.1 Flujo

```
1. Usuario crea consulta → status: awaiting_payment
2. App: POST /api/consultations/:id/payment/create-intent
3. App: confirmPayment(clientSecret) con Card / Apple Pay / Google Pay
4. Stripe envía webhook → backend actualiza consulta a pagada
5. Especialista recibe notificación
```

### 3.2 API

```http
POST /api/consultations/:consultationId/payment/create-intent
Authorization: Bearer {token}
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

### 3.3 Código React Native (consultas)

```javascript
import { useConfirmPayment } from '@stripe/stripe-react-native';
import { Platform, Alert } from 'react-native';

function PaymentConsultationScreen({ consultationId, api }) {
  const { confirmPayment } = useConfirmPayment();

  const handlePay = async () => {
    const { data } = await api.post(
      `/api/consultations/${consultationId}/payment/create-intent`
    );
    const { clientSecret } = data.data;

    // Apple Pay en iOS, Google Pay en Android, o Tarjeta
    const paymentMethod = Platform.OS === 'ios' 
      ? 'ApplePay' 
      : Platform.OS === 'android' 
        ? 'GooglePay' 
        : 'Card';

    const { error } = await confirmPayment(clientSecret, {
      paymentMethodType: paymentMethod,
    });

    if (error) {
      Alert.alert('Error de pago', error.message);
    } else {
      navigation.navigate('ConsultationDetail', { id: consultationId });
    }
  };

  return <Button title="Pagar" onPress={handlePay} />;
}
```

---

## 4️⃣ Pagar productos del vendor

### 4.1 Flujo

```
1. Usuario añade productos al carrito
2. App: POST /api/vendor/orders/checkout/create-intent
   Body: { items: [{ productId, quantity }] }
3. App: confirmPayment(clientSecret) con Card / Apple Pay / Google Pay
4. Stripe envía webhook → backend marca orden como pagada
5. Vendedor recibe notificación
```

### 4.2 API

```http
POST /api/vendor/orders/checkout/create-intent
Authorization: Bearer {token}
Content-Type: application/json

{
  "items": [
    { "productId": "abc123", "quantity": 2 },
    { "productId": "def456", "quantity": 1 }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "orderId": "ord_xxx",
    "clientSecret": "pi_xxx_secret_xxx",
    "paymentIntentId": "pi_xxx",
    "total": 45.99,
    "currency": "usd"
  }
}
```

### 4.3 Código React Native (vendor)

```javascript
import { useConfirmPayment } from '@stripe/stripe-react-native';

function VendorCheckoutScreen({ items, api, navigation }) {
  const { confirmPayment } = useConfirmPayment();

  const handlePay = async () => {
    const { data } = await api.post(
      '/api/vendor/orders/checkout/create-intent',
      { items }
    );
    const { clientSecret } = data.data;

    const { error } = await confirmPayment(clientSecret, {
      paymentMethodType: 'Card',  // o 'ApplePay' / 'GooglePay'
    });

    if (!error) {
      navigation.navigate('OrderSuccess', { orderId: data.data.orderId });
    }
  };

  return <Button title="Pagar" onPress={handlePay} />;
}
```

---

## 5️⃣ Webhook Stripe

Configurar en Stripe Dashboard:

- **URL:** `https://api.munpa.online/api/webhooks/stripe`
- **Eventos:** `payment_intent.succeeded`

El webhook actualiza:
- Consultas: `metadata.consultationId`
- Órdenes vendor: `metadata.orderId`

---

## 6️⃣ Resumen de endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/consultations/:id/payment/create-intent` | Crear PaymentIntent para consulta |
| POST | `/api/consultations/:id/payment` | Pago simulado (sin Stripe) |
| POST | `/api/vendor/orders/checkout/create-intent` | Crear PaymentIntent para orden vendor |
| POST | `/api/webhooks/stripe` | Webhook de Stripe |

---

## 7️⃣ Testing

### Tarjetas de prueba (modo test)

| Número | Resultado |
|--------|-----------|
| 4242 4242 4242 4242 | Pago exitoso |
| 4000 0000 0000 0002 | Rechazado |
| 4000 0025 0000 3155 | Requiere 3D Secure |

### Apple Pay / Google Pay en test

- **Apple Pay**: Usa tarjetas de prueba en Wallet (modo test).
- **Google Pay**: Añade tarjeta de prueba en Google Pay.

---

## 8️⃣ Checklist de implementación

- [ ] Variables `STRIPE_SECRET_KEY` y `STRIPE_WEBHOOK_SECRET` en backend
- [ ] `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` en frontend
- [ ] `StripeProvider` envolviendo la app
- [ ] Webhook configurado en Stripe Dashboard
- [ ] Screens de pago para consultas y órdenes vendor
- [ ] Botones Apple Pay / Google Pay (o `paymentMethodType: 'Card'` que los habilita automáticamente)
