# API Asistente IA para Administradores

API de **solo lectura** que permite a las administradoras hacer consultas sobre la plataforma Munpa y descargar reportes de la base de datos usando OpenAI. **No permite modificar nada.**

## Requisitos

- Usuario autenticado con rol **admin** (JWT del dashboard)
- Variable de entorno `OPENAI_API_KEY` configurada

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
    "question": "¿Cuántos usuarios activos hay en los últimos 30 días?",
    "answer": "Según los datos actuales, hay X usuarios activos en los últimos 30 días...",
    "contextDate": "2025-02-19T..."
  }
}
```

**Ejemplos de preguntas:**
- ¿Cuántos usuarios se registraron esta semana?
- ¿Cuántos posts hay en total?
- Resumen de la plataforma
- ¿Cuántas comunidades activas hay?

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
```

**Reportes disponibles:**

| report | Colección | Campos exportados |
|--------|-----------|-------------------|
| users | users | email, displayName, createdAt, lastLoginAt, isActive, role |
| children | children | name, birthDate, parentId, createdAt |
| communities | communities | name, description, memberCount, createdAt |
| posts | posts | title, content, authorId, communityId, createdAt |
| lists | lists | name, description, createdAt |
| recommendations | recommendations | name, address, cityId, countryId, totalReviews, averageRating, isActive |
| categories | categories | name, icon, order, isActive |

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
