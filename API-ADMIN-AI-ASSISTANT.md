# API Asistente IA para Administradores

API de **solo lectura** que usa **herramientas (tools)** de OpenAI para consultar Firestore. La IA ejecuta funciones que usan `count()` para estadísticas (1 lectura) y `limit(50)` para listas. **Nunca consultas abiertas.** Filtra datos sensibles. **No permite modificar nada.**

## Requisitos

- Usuario autenticado con rol **admin** (JWT del dashboard)
- Variable de entorno `OPENAI_API_KEY` configurada

## Listar modelos OpenAI

**GET** `/api/admin/openai-models`

Devuelve los modelos disponibles en tu cuenta de OpenAI (usa las variables de Vercel).

```bash
GET https://munpa.online/api/admin/openai-models
Authorization: Bearer <JWT_ADMIN>
```

## Herramientas (tools)

La IA usa funciones que consultan Firestore de forma eficiente:

| Herramienta | Uso | Firestore |
|-------------|-----|-----------|
| `contar_usuarios` | Total de usuarios | `count()` - 1 lectura |
| `contar_usuarias_embarazadas` | Total embarazadas | `count()` - 1 lectura |
| `listar_usuarias_embarazadas` | Emails y nombres | `limit(50)` |
| `contar_coleccion` | users, children, posts, etc. | `count()` |
| `listar_usuarios` | Lista de usuarios | `limit(50)` |

Datos sensibles (passwordHash, tokens, etc.) se filtran antes de enviar a la IA.

## Endpoints

### 1. Hacer consultas (OpenAI)

**POST** `/api/admin/ai-assistant`

Envía una pregunta y recibe una respuesta generada por IA basada en el contexto actual de la plataforma.

**Headers:**
```
Authorization: Bearer <JWT_ADMIN_TOKEN>
Content-Type: application/json
```

**Body:**
```json
{
  "question": "¿Cuántos usuarios activos hay en los últimos 30 días?"
}
```

**Respuesta exitosa:**
```json
{
  "success": true,
  "data": {
    "question": "¿Cuántas usuarias embarazadas hay? Quiero descargar la lista.",
    "answer": "Hay 45 usuarias embarazadas registradas. Puedes descargar la lista usando el enlace de exportación.",
    "contextDate": "2025-02-19T...",
    "suggestedExport": {
      "url": "/api/admin/ai-assistant/export?report=pregnant_users&format=csv",
      "params": "report=pregnant_users&format=csv"
    }
  }
}
```

Cuando la respuesta involucra datos exportables, se incluye `suggestedExport` con la URL para descargar. El frontend puede mostrar un botón "Descargar" que haga GET a la URL completa (ej: `https://munpa.online/api/admin/ai-assistant/export?report=pregnant_users&format=csv`) con el token en el header.

**Ejemplos de preguntas (cualquier tipo):**
- ¿Cuántos usuarios hay por género?
- ¿Cuántas usuarias embarazadas hay en los últimos 30 días? Quiero descargar la lista
- ¿Cuántos hijos hay por nacer vs nacidos?
- Resumen completo de la plataforma
- ¿Cuántos recomendados tienen rating alto?
- Dame la lista de comunidades para descargar
- ¿Cuántos usuarios nuevos esta semana?

**Limitaciones:** El asistente **nunca** ejecutará ni sugerirá modificaciones. Solo responde con la información disponible.

---

### 2. Descargar reportes (exportación)

**GET** `/api/admin/ai-assistant/export`

Descarga datos de la base de datos en formato JSON o CSV. Solo lectura.

**Headers:**
```
Authorization: Bearer <JWT_ADMIN_TOKEN>
```

**Query params:**

| Parámetro | Requerido | Descripción |
|-----------|-----------|-------------|
| `report` | Sí | Tipo de reporte: `users`, `children`, `communities`, `posts`, `lists`, `recommendations`, `categories` |
| `format` | No | `json` (default) o `csv` |
| `limit` | No | Máximo de registros (1-2000, default 500) |

**Ejemplos:**

```bash
# Usuarios en JSON
GET /api/admin/ai-assistant/export?report=users&format=json

# Usuarios en CSV (descarga archivo)
GET /api/admin/ai-assistant/export?report=users&format=csv

# Posts con límite de 100
GET /api/admin/ai-assistant/export?report=posts&limit=100

# Recomendados en CSV
GET /api/admin/ai-assistant/export?report=recommendations&format=csv

# Usuarias embarazadas (todas)
GET /api/admin/ai-assistant/export?report=pregnant_users&format=json

# Usuarias embarazadas de los últimos 30 días (descarga)
GET /api/admin/ai-assistant/export?report=pregnant_users&format=csv&days=30
```

**Reportes disponibles:**

| report | Colección | Campos exportados |
|--------|-----------|-------------------|
| users | users | email, displayName, createdAt, lastLoginAt, isActive, role |
| **pregnant_users** | users | email, displayName, gender, isPregnant, gestationWeeks, childrenCount, createdAt, lastLoginAt, cityName, countryName. Usar `&days=30` para filtrar últimas 30 días |
| children | children | name, birthDate, parentId, createdAt |
| communities | communities | name, description, memberCount, createdAt |
| posts | posts | title, content, authorId, communityId, createdAt |
| lists | lists | name, description, createdAt |
| recommendations | recommendations | name, address, cityId, countryId, totalReviews, averageRating, isActive, categoryId |
| categories | categories | name, icon, order, isActive |
| countries | countries | name, isActive |
| cities | cities | name, countryId, isActive |

**Respuesta JSON:**
```json
{
  "success": true,
  "data": [...],
  "meta": {
    "report": "users",
    "total": 150,
    "limit": 500
  }
}
```

**Respuesta CSV:** Se devuelve un archivo con `Content-Disposition: attachment` para descarga directa.

---

## Seguridad

- Solo usuarios con `role: 'admin'` o `isAdmin: true` pueden acceder
- Todas las operaciones son **solo lectura**
- No existe endpoint para modificar, crear o eliminar datos desde el asistente
- El prompt del sistema instruye a la IA a rechazar cualquier solicitud de modificación
