# API: Conteo de Campos de Usuarios (displayName vs name)

## Descripción

Endpoint para analizar cuántos usuarios tienen los campos `displayName` y `name` poblados en sus perfiles de Firestore.

---

## Endpoint

### GET `/api/admin/analytics/user-fields-count`

Analiza todos los usuarios y cuenta cuántos tienen cada campo.

#### Headers Requeridos
```http
Authorization: Bearer {ADMIN_JWT_TOKEN}
Content-Type: application/json
```

#### Respuesta Exitosa (200 OK)

```json
{
  "success": true,
  "data": {
    "totalUsers": 150,
    "usersWithDisplayName": 120,
    "usersWithName": 80,
    "usersWithBoth": 60,
    "usersOnlyDisplayName": 60,
    "usersOnlyName": 20,
    "usersWithNeither": 10,
    "percentages": {
      "withDisplayName": "80.0",
      "withName": "53.3",
      "withBoth": "40.0",
      "onlyDisplayName": "40.0",
      "onlyName": "13.3",
      "withNeither": "6.7"
    }
  },
  "generatedAt": "2026-02-08T20:30:00.000Z"
}
```

#### Descripción de Campos

**Conteos absolutos:**
- `totalUsers`: Total de usuarios en la base de datos
- `usersWithDisplayName`: Usuarios que tienen el campo `displayName` (no vacío)
- `usersWithName`: Usuarios que tienen el campo `name` (no vacío)
- `usersWithBoth`: Usuarios que tienen **ambos** campos poblados
- `usersOnlyDisplayName`: Usuarios que **solo** tienen `displayName` (sin `name`)
- `usersOnlyName`: Usuarios que **solo** tienen `name` (sin `displayName`)
- `usersWithNeither`: Usuarios que **no tienen ninguno** de los dos campos

**Porcentajes:**
- Todos los porcentajes son relativos al `totalUsers`
- Formato: string con 1 decimal (e.g., "80.0")

#### Validación de Campos

Un campo se considera "poblado" cuando:
- Existe en el documento de Firestore
- No es `null` o `undefined`
- Después de hacer `.trim()`, no está vacío

---

## Ejemplos de Uso

### cURL

```bash
curl -X GET "https://api.munpa.online/api/admin/analytics/user-fields-count" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

### JavaScript (Dashboard Admin)

```javascript
async function getUserFieldsCount() {
  try {
    const response = await fetch(
      'https://api.munpa.online/api/admin/analytics/user-fields-count',
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const result = await response.json();
    
    if (result.success) {
      const { data } = result;
      console.log(`📊 Total de usuarios: ${data.totalUsers}`);
      console.log(`✅ Con displayName: ${data.usersWithDisplayName} (${data.percentages.withDisplayName}%)`);
      console.log(`✅ Con name: ${data.usersWithName} (${data.percentages.withName}%)`);
      console.log(`📌 Con ambos: ${data.usersWithBoth} (${data.percentages.withBoth}%)`);
      console.log(`⚠️  Solo displayName: ${data.usersOnlyDisplayName} (${data.percentages.onlyDisplayName}%)`);
      console.log(`⚠️  Solo name: ${data.usersOnlyName} (${data.percentages.onlyName}%)`);
      console.log(`❌ Sin ninguno: ${data.usersWithNeither} (${data.percentages.withNeither}%)`);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}
```

---

## Casos de Uso

### 1. Análisis de Calidad de Datos

Determinar qué porcentaje de usuarios tiene información completa en su perfil para mejorar la experiencia de usuario.

### 2. Migración de Campos

Si estás migrando de `name` a `displayName` (o viceversa), este endpoint te permite monitorear el progreso de la migración.

### 3. Dashboard Admin

Mostrar métricas de completitud de perfiles de usuario:

```tsx
function UserProfileStats({ data }) {
  return (
    <div className="stats-grid">
      <StatCard 
        title="Total Usuarios"
        value={data.totalUsers}
        icon="👥"
      />
      <StatCard 
        title="Con Display Name"
        value={data.usersWithDisplayName}
        percentage={data.percentages.withDisplayName}
        icon="✅"
      />
      <StatCard 
        title="Con Name"
        value={data.usersWithName}
        percentage={data.percentages.withName}
        icon="✅"
      />
      <StatCard 
        title="Perfiles Completos"
        value={data.usersWithBoth}
        percentage={data.percentages.withBoth}
        icon="🌟"
        color="green"
      />
      <StatCard 
        title="Perfiles Incompletos"
        value={data.usersWithNeither}
        percentage={data.percentages.withNeither}
        icon="⚠️"
        color="red"
      />
    </div>
  );
}
```

---

## Consideraciones

### Performance

- Este endpoint consulta **todos** los usuarios de la colección `users`
- Para bases de datos grandes (>10,000 usuarios), puede tardar varios segundos
- Se recomienda implementar caché en el cliente (e.g., actualizar cada hora)
- Firestore cobra por cada documento leído

### Seguridad

- **Solo accesible por administradores** (requiere `authenticateToken` + `isAdmin` middleware)
- El token JWT debe tener permisos de administrador

### Logs

El endpoint genera logs útiles:
```
📊 [ADMIN] Contando campos de usuarios...
✅ [ADMIN] Análisis completo: 150 usuarios
```

---

## Errores Comunes

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Token inválido o expirado"
}
```
**Solución:** Verifica que estés enviando un token JWT válido de administrador.

### 403 Forbidden
```json
{
  "success": false,
  "message": "No autorizado. Se requieren permisos de administrador."
}
```
**Solución:** El usuario autenticado no tiene permisos de administrador en Firestore.

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Error obteniendo estadísticas de usuarios",
  "error": "Firestore connection failed"
}
```
**Solución:** Problema con la conexión a Firestore. Verifica las variables de entorno y credenciales.

---

## Notas Adicionales

### Diferencia entre `name` y `displayName`

En Mumpa:
- **`name`**: Nombre completo del usuario (puede incluir apellido)
- **`displayName`**: Nombre para mostrar en la aplicación (generalmente más corto)

Este endpoint te ayuda a entender qué campo están usando más los usuarios y si hay inconsistencias en los datos.

### Actualización de la Estadística

La estadística se genera en tiempo real cada vez que se hace la consulta. No hay caché en el backend para garantizar que los datos sean siempre actuales.

Si necesitas caché, impleméntalo en el cliente:

```javascript
const CACHE_KEY = 'user_fields_count';
const CACHE_TTL = 3600000; // 1 hora

async function getCachedUserFieldsCount() {
  const cached = localStorage.getItem(CACHE_KEY);
  if (cached) {
    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp < CACHE_TTL) {
      return data;
    }
  }
  
  const data = await getUserFieldsCount();
  localStorage.setItem(CACHE_KEY, JSON.stringify({
    data,
    timestamp: Date.now()
  }));
  
  return data;
}
```

---

## Changelog

### 2026-02-08
- ✨ Endpoint creado
- Análisis completo de campos `displayName` y `name`
- Cálculo de porcentajes
- Documentación inicial
