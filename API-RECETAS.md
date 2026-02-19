# 🍳 API de Recetas según ingredientes

Genera recetas basadas en lo que tienes en la nevera, adaptadas a la edad del hijo.

---

## Endpoint

```http
POST /api/recipes/from-ingredients
Authorization: Bearer {token}
Content-Type: application/json

{
  "ingredients": "leche, huevos, pan, queso, tomate, pollo",
  "childId": "abc123"
}
```

### Parámetros

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `ingredients` | string | Sí | Texto con los alimentos que tienes en la nevera (separados por comas o libre) |
| `childId` | string | No | ID del hijo para adaptar la receta a su edad. Si no se envía, se sugieren recetas genéricas |

### Response

Misma estructura que las recetas de nutrición (`/api/children/:childId/nutrition/recipes`): `data` es un array de recetas.

```json
{
  "success": true,
  "data": [
    {
      "id": "recipe_1738854321000_0",
      "mealType": "lunch",
      "name": "Tortilla de queso y tomate",
      "description": "Receta rápida y nutritiva para niños",
      "ageAppropriate": true,
      "prepTime": 5,
      "cookTime": 10,
      "servings": 2,
      "difficulty": "fácil",
      "ingredients": [
        { "item": "Huevos", "quantity": "2 unidades" },
        { "item": "Queso", "quantity": "50g" },
        { "item": "Tomate", "quantity": "1 pequeño" }
      ],
      "instructions": [
        "Batir los huevos",
        "Cortar el tomate en cubitos",
        "..."
      ],
      "nutritionalInfo": {
        "calories": "150-180 kcal",
        "protein": "12-14g",
        "carbs": "3-5g",
        "fat": "10-12g"
      },
      "tips": ["Cortar en trozos pequeños para evitar atragantamiento"],
      "allergens": ["Huevo", "Lácteos"],
      "childId": "abc123",
      "ageMonths": 18,
      "generatedAt": "2026-02-08T20:00:00.000Z"
    }
  ],
  "metadata": {
    "childName": "Luna",
    "ageMonths": 18
  }
}
```

---

## Requisitos

- **OPENAI_API_KEY** en variables de entorno (backend)
- Usuario autenticado
- Si se envía `childId`, el usuario debe ser padre o tener acceso compartido al hijo

---

## Ejemplo (curl)

```bash
curl -X POST "https://api.munpa.online/api/recipes/from-ingredients" \
  -H "Authorization: Bearer TU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"ingredients": "plátano, avena, leche", "childId": "xxx"}'
```
