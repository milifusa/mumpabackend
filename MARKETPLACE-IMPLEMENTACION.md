# 🛍️ Guía de Implementación del Marketplace

## ✅ Estado Actual

### Ya Implementado en `server.js`:

1. ✅ **Constantes del Marketplace** (líneas 15867-15908)
   - `MARKETPLACE_CATEGORIES`
   - `PRODUCT_CONDITIONS`
   - `TRANSACTION_TYPES`
   - `PRODUCT_STATUS`

2. ✅ **Endpoint GET /api/marketplace/products** (líneas 15915-16028)
   - Listar productos con filtros
   - Paginación
   - Búsqueda
   - Ordenamiento

---

## 📋 Pendiente de Implementar

Para completar el marketplace, necesitas agregar los endpoints del archivo `marketplace-endpoints.js` al `server.js`.

### Opción 1: Copiar Manualmente (Recomendado)

**Paso 1:** Abre ambos archivos
- `server.js` (archivo principal)
- `marketplace-endpoints.js` (endpoints a copiar)

**Paso 2:** Copia el código de `marketplace-endpoints.js` al final de `server.js` (después de la línea 16030)

**Paso 3:** Verifica que no haya errores:
```bash
node server.js
```

### Opción 2: Usar Script de Integración

Crea un script para combinar los archivos:

```javascript
// integrate-marketplace.js
const fs = require('fs');

const serverContent = fs.readFileSync('./server.js', 'utf8');
const marketplaceContent = fs.readFileSync('./marketplace-endpoints.js', 'utf8');

// Quitar el comentario inicial del archivo marketplace-endpoints.js
const cleanMarketplace = marketplaceContent
  .split('\n')
  .filter((line, index) => index > 5) // Saltar los primeros comentarios
  .join('\n');

// Agregar al final de server.js
const updatedContent = serverContent.trimEnd() + '\n\n' + cleanMarketplace;

fs.writeFileSync('./server.js', updatedContent, 'utf8');

console.log('✅ Marketplace integrado exitosamente!');
```

Ejecutar:
```bash
node integrate-marketplace.js
```

---

## 🔧 Endpoints a Agregar

### Productos (6 endpoints más)
- `GET /api/marketplace/products/:id` - Ver detalle
- `POST /api/marketplace/products` - Crear producto
- `PUT /api/marketplace/products/:id` - Actualizar
- `DELETE /api/marketplace/products/:id` - Eliminar
- `PATCH /api/marketplace/products/:id/status` - Cambiar estado
- `GET /api/marketplace/my-products` - Mis productos

### Favoritos (3 endpoints)
- `GET /api/marketplace/favorites` - Listar favoritos
- `POST /api/marketplace/favorites/:productId` - Agregar
- `DELETE /api/marketplace/favorites/:productId` - Quitar

### Mensajes (4 endpoints)
- `GET /api/marketplace/messages` - Ver conversaciones
- `GET /api/marketplace/messages/:productId` - Mensajes de producto
- `POST /api/marketplace/messages` - Enviar mensaje
- `PATCH /api/marketplace/messages/:id/read` - Marcar leído

### Transacciones (1 endpoint)
- `GET /api/marketplace/transactions` - Mis transacciones

### Reportes (1 endpoint)
- `POST /api/marketplace/reports` - Reportar producto

### Admin (8 endpoints)
- `GET /api/admin/marketplace/products` - Ver todos
- `PATCH /api/admin/marketplace/products/:id/approve` - Aprobar
- `PATCH /api/admin/marketplace/products/:id/reject` - Rechazar
- `DELETE /api/admin/marketplace/products/:id` - Eliminar permanente
- `GET /api/admin/marketplace/reports` - Ver reportes
- `PATCH /api/admin/marketplace/reports/:id` - Procesar reporte
- `GET /api/admin/marketplace/stats` - Estadísticas
- `GET /api/admin/marketplace/transactions` - Ver transacciones

**Total: 26 endpoints adicionales**

---

## 📁 Estructura de Archivos Creados

```
mumpabackend/
├── server.js                          ✅ Ya tiene el primer endpoint
├── MARKETPLACE-ESTRUCTURA.md          ✅ Documentación de estructura
├── marketplace-endpoints.js           ✅ Código completo de endpoints
├── API-MARKETPLACE.md                 ✅ Documentación del API
└── MARKETPLACE-IMPLEMENTACION.md      ✅ Esta guía
```

---

## 🚀 Paso a Paso para Completar

### 1. Agregar Endpoints al server.js

```bash
# Abrir server.js
code server.js

# Ir al final del archivo (línea 16030)
# Pegar el contenido de marketplace-endpoints.js
```

### 2. Verificar que no haya errores

```bash
# Verificar sintaxis
node --check server.js

# Iniciar servidor de prueba
node server.js
```

### 3. Probar los endpoints

Usa Postman, Thunder Client o curl:

```bash
# Listar productos
curl http://localhost:3000/api/marketplace/products

# Ver detalle
curl http://localhost:3000/api/marketplace/products/{id}

# Crear producto (requiere autenticación)
curl -X POST http://localhost:3000/api/marketplace/products \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Carriola de prueba",
    "description": "Esta es una carriola de prueba con más de 20 caracteres",
    "category": "transporte",
    "condition": "como_nuevo",
    "photos": ["https://example.com/photo.jpg"],
    "type": "venta",
    "price": 1500,
    "location": {
      "state": "CDMX",
      "city": "Coyoacán"
    }
  }'
```

### 4. Crear índices en Firestore

Para mejor rendimiento, crea estos índices en Firestore:

```javascript
// Colección: marketplace_products
// Índices compuestos:
1. status (ASC) + createdAt (DESC)
2. type (ASC) + status (ASC) + createdAt (DESC)
3. category (ASC) + status (ASC) + createdAt (DESC)
4. userId (ASC) + status (ASC) + createdAt (DESC)
5. isApproved (ASC) + status (ASC) + createdAt (DESC)
6. isReported (ASC) + createdAt (DESC)

// Colección: marketplace_favorites
// Índices:
1. userId (ASC) + createdAt (DESC)
2. productId (ASC) + createdAt (DESC)

// Colección: marketplace_messages
// Índices:
1. productId (ASC) + createdAt (ASC)
2. senderId (ASC) + createdAt (DESC)
3. receiverId (ASC) + createdAt (DESC)

// Colección: marketplace_transactions
// Índices:
1. sellerId (ASC) + createdAt (DESC)
2. buyerId (ASC) + createdAt (DESC)
3. type (ASC) + createdAt (DESC)

// Colección: marketplace_reports
// Índices:
1. status (ASC) + createdAt (DESC)
2. productId (ASC) + createdAt (DESC)
```

---

## 🧪 Tests Recomendados

Crea un archivo de tests `test-marketplace.js`:

```javascript
const fetch = require('node-fetch');

const API_URL = 'http://localhost:3000';
let AUTH_TOKEN = 'tu-token-aqui';

// Test 1: Listar productos
async function testListProducts() {
  const response = await fetch(`${API_URL}/api/marketplace/products`);
  const data = await response.json();
  console.log('✅ Productos listados:', data.data.length);
}

// Test 2: Crear producto
async function testCreateProduct() {
  const response = await fetch(`${API_URL}/api/marketplace/products`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${AUTH_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      title: 'Carriola de prueba',
      description: 'Esta es una carriola de prueba con más de 20 caracteres para validación',
      category: 'transporte',
      condition: 'como_nuevo',
      photos: ['https://example.com/photo.jpg'],
      type: 'venta',
      price: 1500,
      location: {
        state: 'CDMX',
        city: 'Coyoacán'
      }
    })
  });
  
  const data = await response.json();
  console.log('✅ Producto creado:', data.data.id);
  return data.data.id;
}

// Test 3: Ver detalle
async function testGetProduct(productId) {
  const response = await fetch(`${API_URL}/api/marketplace/products/${productId}`);
  const data = await response.json();
  console.log('✅ Producto obtenido:', data.data.title);
}

// Ejecutar todos los tests
async function runTests() {
  console.log('🧪 Iniciando tests del marketplace...\n');
  
  await testListProducts();
  const productId = await testCreateProduct();
  await testGetProduct(productId);
  
  console.log('\n✅ Todos los tests completados!');
}

runTests().catch(console.error);
```

Ejecutar:
```bash
AUTH_TOKEN="tu-token" node test-marketplace.js
```

---

## 📊 Monitoreo y Logs

El marketplace incluye logs detallados:

```
✅ [MARKETPLACE] Producto creado: prod_123
✅ [MARKETPLACE] Producto actualizado: prod_123
✅ [MARKETPLACE] Estado actualizado: prod_123 -> vendido
✅ [MARKETPLACE] Transacción creada para producto: prod_123
✅ [MARKETPLACE] Producto agregado a favoritos: prod_123
✅ [MARKETPLACE] Mensaje enviado: msg_456
❌ [MARKETPLACE] Error obteniendo productos: error details
```

---

## 🔒 Seguridad

### Rate Limiting (Recomendado)

Agregar rate limiting para evitar spam:

```javascript
const rateLimit = require('express-rate-limit');

const marketplaceLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100 // máximo 100 requests por IP
});

app.use('/api/marketplace', marketplaceLimiter);
```

### Validación de Imágenes

Validar URLs de imágenes antes de guardar:

```javascript
function isValidImageUrl(url) {
  return url.match(/\.(jpeg|jpg|gif|png|webp)$/i) != null;
}
```

---

## 📱 Integración con Frontend

### Ejemplo React:

```javascript
// hooks/useMarketplace.js
import { useState, useEffect } from 'react';

export function useMarketplace() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = async (filters = {}) => {
    try {
      const params = new URLSearchParams(filters);
      const response = await fetch(`/api/marketplace/products?${params}`);
      const data = await response.json();
      setProducts(data.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return { products, loading, fetchProducts };
}
```

### Ejemplo Angular:

```typescript
// services/marketplace.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MarketplaceService {
  private apiUrl = '/api/marketplace';

  constructor(private http: HttpClient) {}

  getProducts(filters?: any): Observable<any> {
    return this.http.get(`${this.apiUrl}/products`, { params: filters });
  }

  createProduct(product: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/products`, product);
  }

  getProductDetail(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/products/${id}`);
  }
}
```

---

## 🎯 Próximos Pasos

1. ✅ Agregar endpoints al server.js
2. ✅ Crear índices en Firestore
3. ✅ Probar todos los endpoints
4. ✅ Integrar con frontend
5. ✅ Agregar sistema de notificaciones
6. ✅ Implementar chat en tiempo real (opcional)
7. ✅ Deploy a producción

---

## 💡 Tips

- Usa Postman Collections para organizar los tests
- Implementa logging de errores con Sentry
- Considera usar Cloud Functions para tareas pesadas
- Implementa caché para productos populares
- Usa CDN para las imágenes

---

## 📞 Soporte

Si tienes dudas:
1. Revisa `API-MARKETPLACE.md` para la documentación completa
2. Ve `marketplace-endpoints.js` para el código de referencia
3. Consulta `MARKETPLACE-ESTRUCTURA.md` para el modelo de datos

---

¡El marketplace está listo para ser completado! 🚀

