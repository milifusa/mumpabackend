# 🏠 API Home - Receta con IA

## Descripción

Endpoint para el **home** que genera una receta con IA (OpenAI) acorde a la edad del bebé. El usuario consulta desayuno, almuerzo o cena y recibe una receta personalizada.

---

## Endpoint

**GET** `/api/home/recipe`

**Autenticación:** Bearer Token requerido

**Query Parameters:**

| Parámetro | Tipo   | Requerido | Descripción                                      |
|-----------|--------|-----------|--------------------------------------------------|
| childId   | string | Sí        | ID del niño en Firestore                         |
| mealType  | string | Sí        | `breakfast` (desayuno), `lunch` (almuerzo) o `dinner` (cena) |

---

## Ejemplos

### Desayuno
```http
GET /api/home/recipe?childId=K6vfrjDYcwAp8cDgH9sh&mealType=breakfast
Authorization: Bearer {token}
```

### Almuerzo
```http
GET /api/home/recipe?childId=K6vfrjDYcwAp8cDgH9sh&mealType=lunch
Authorization: Bearer {token}
```

### Cena
```http
GET /api/home/recipe?childId=K6vfrjDYcwAp8cDgH9sh&mealType=dinner
Authorization: Bearer {token}
```

---

## Respuesta exitosa

```json
{
  "success": true,
  "data": {
    "id": "recipe_home_1738854321000",
    "mealType": "breakfast",
    "name": "Papilla de Avena con Manzana",
    "description": "Desayuno nutritivo y suave para bebés en alimentación complementaria",
    "ageAppropriate": true,
    "prepTime": 5,
    "cookTime": 10,
    "servings": 2,
    "difficulty": "fácil",
    "ingredients": [
      { "item": "Avena en hojuelas", "quantity": "3 cucharadas" },
      { "item": "Manzana", "quantity": "1 pequeña" }
    ],
    "instructions": [
      "Pelar y picar la manzana en trozos pequeños",
      "Cocinar la avena con agua durante 5 minutos",
      "Agregar la manzana y cocinar 5 minutos más"
    ],
    "nutritionalInfo": {
      "calories": "80-100 kcal",
      "protein": "2-3g",
      "carbs": "15-18g",
      "fat": "1-2g"
    },
    "tips": ["Puedes agregar canela suave para dar sabor natural"],
    "allergens": ["Gluten (avena)"],
    "childId": "K6vfrjDYcwAp8cDgH9sh",
    "childName": "Luna",
    "ageMonths": 8,
    "generatedAt": "2026-02-19T20:00:00.000Z"
  },
  "metadata": {
    "childAge": {
      "months": 8,
      "years": 0,
      "remainingMonths": 8,
      "displayAge": "8 meses"
    },
    "mealType": "breakfast",
    "mealName": "desayuno"
  }
}
```

---

## Bebé menor de 6 meses

Si el bebé tiene menos de 6 meses, no se genera receta y se devuelve mensaje de lactancia exclusiva:

```json
{
  "success": true,
  "data": null,
  "message": "Luna está en periodo de lactancia exclusiva. Las recetas recomendadas son leche materna o fórmula según indicación.",
  "metadata": {
    "childAge": { "months": 4, "displayAge": "4 meses" },
    "mealType": "breakfast"
  }
}
```

---

## Errores

| Código | Mensaje |
|--------|---------|
| 400 | childId y mealType son requeridos |
| 400 | mealType debe ser: breakfast, lunch o dinner |
| 403 | No tienes permiso para acceder a este niño |
| 404 | Niño no encontrado |
| 503 | Servicio de generación de recetas no disponible (OpenAI no configurado) |

---

## Uso en el frontend (home)

```javascript
// Obtener receta de desayuno para el hijo seleccionado
const fetchHomeRecipe = async (childId, mealType) => {
  const res = await fetch(
    `https://api.munpa.online/api/home/recipe?childId=${childId}&mealType=${mealType}`,
    {
      headers: { 'Authorization': `Bearer ${token}` }
    }
  );
  const json = await res.json();
  if (json.success && json.data) {
    return json.data; // Receta para mostrar en la tarjeta del home
  }
  if (json.success && json.message) {
    return null; // Bebé < 6 meses, mostrar mensaje
  }
  throw new Error(json.message || 'Error obteniendo receta');
};

// Ejemplo: mostrar receta de almuerzo
const recipe = await fetchHomeRecipe(selectedChildId, 'lunch');
```

---

## Caché (4 horas)

Las recetas se cachean por **4 horas** para reducir consultas a OpenAI. Si el usuario solicita la misma combinación `childId` + `mealType` dentro de las 4 horas, se devuelve la receta cacheada sin llamar a la IA.

Para forzar una nueva receta:
```http
GET /api/home/recipe?childId=xxx&mealType=breakfast&regenerate=true
```

En la respuesta, `metadata.cached` indica si viene del caché (`true`) o se generó nueva (`false`).

**Índice Firestore** (crear si es necesario):
- Colección: `homeRecipeCache`
- Campos: `childId` (Ascending), `mealType` (Ascending), `createdAt` (Descending)

---

## Push diario de receta

Estado: desactivado. El endpoint responde sin enviar notificaciones.

Antes, un **cron** enviaba cada día un push a las mamás a las **11:00 AM en la hora local del usuario**:

**Título:** `¿Ya le preparaste [nombre receta] a [nombre niño]?`  
**Ejemplo:** `¿Ya le preparaste Papilla de Avena con Manzana a Max?`

- **Endpoint cron:** `GET /api/cron/recipe-daily-reminder`
- **Horario:** 11:00 AM en la zona horaria del usuario (el cron corre cada hora y solo envía a usuarios cuya hora local sea 11:00)
- **Timezone:** Se usa `child.timezone` o `user.timezone` (fallback: America/Mexico_City)
- **Requisitos:** Niño 6+ meses, usuario con tokens FCM
- **Caché:** 12 horas para reducir consultas a OpenAI

---

## Obtener receta por ID (al hacer click en el push)

**GET** `/api/recipes/:id`

Cuando el usuario hace click en el push, la app recibe `recipeId` en el payload. Usa este endpoint para cargar la receta completa:

```http
GET /api/recipes/{recipeId}
Authorization: Bearer {token}
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "id": "abc123",
    "name": "Puré de verduras para bebé",
    "description": "...",
    "mealType": "lunch",
    "prepTime": 10,
    "cookTime": 15,
    "servings": 2,
    "ingredients": [...],
    "instructions": [...],
    "nutritionalInfo": {...},
    "tips": [...],
    "allergens": [...],
    "childId": "...",
    "childName": "Maximo"
  }
}
```

**Datos en el push (para deep link):**
- `recipeId` - ID para consultar la receta
- `screen` - "RecipeDetail"
- `type` - "recipe_daily_reminder"

---

## Requisitos

- **OPENAI_API_KEY** configurada en Vercel
- **CRON_SECRET** para el cron de recetas
- Usuario autenticado con acceso al niño (padre o compartido)
