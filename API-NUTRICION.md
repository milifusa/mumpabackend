# API de Nutrición - Recetas Personalizadas con IA

## 📋 Descripción

API que genera recetas personalizadas para niños según su edad usando OpenAI. Las recetas se adaptan automáticamente a las necesidades nutricionales y capacidades de masticación/digestión de cada etapa del desarrollo infantil.

---

## 🔑 Autenticación

Todos los endpoints requieren autenticación con Bearer Token:

```http
Authorization: Bearer {token}
```

---

## 📍 Endpoints

### Obtener Recetas Personalizadas

**Endpoint:** `GET /api/children/:childId/nutrition/recipes`

**Descripción:** Genera recetas personalizadas según la edad del niño usando IA. Las recetas se cachean por 24 horas para optimizar rendimiento y costos.

**Parámetros de Ruta:**
- `childId` - ID del niño (string, requerido)

**Query Parameters:**
- `mealType` - Tipo de comida (opcional, default: 'all')
  - `'breakfast'` - Solo desayunos (2 recetas)
  - `'lunch'` - Solo almuerzos (2 recetas)
  - `'dinner'` - Solo cenas (2 recetas)
  - `'all'` - Todas las comidas (6 recetas: 2 de cada tipo)
- `regenerate` - Forzar regeneración (opcional, default: 'false')
  - `'true'` - Regenera recetas aunque haya caché válido
  - `'false'` - Usa caché si tiene menos de 24 horas

**Headers:**
```http
GET /api/children/{childId}/nutrition/recipes?mealType=all
Authorization: Bearer {token}
```

---

## 📊 Respuesta Exitosa

```json
{
  "success": true,
  "data": [
    {
      "id": "recipe_1738854321000_0",
      "mealType": "breakfast",
      "name": "Papilla de Avena con Manzana",
      "description": "Desayuno nutritivo y suave para bebés en alimentación complementaria",
      "ageAppropriate": true,
      "prepTime": 5,
      "cookTime": 10,
      "servings": 2,
      "difficulty": "fácil",
      "ingredients": [
        {
          "item": "Avena en hojuelas",
          "quantity": "3 cucharadas"
        },
        {
          "item": "Manzana",
          "quantity": "1 pequeña"
        },
        {
          "item": "Agua o leche materna",
          "quantity": "1 taza"
        }
      ],
      "instructions": [
        "Pelar y picar la manzana en trozos pequeños",
        "Cocinar la avena con agua durante 5 minutos",
        "Agregar la manzana y cocinar 5 minutos más",
        "Licuar o triturar hasta obtener consistencia suave",
        "Dejar enfriar antes de servir"
      ],
      "nutritionalInfo": {
        "calories": "80-100 kcal",
        "protein": "2-3g",
        "carbs": "15-18g",
        "fat": "1-2g"
      },
      "tips": [
        "Puedes agregar canela suave para dar sabor natural",
        "Si el bebé prefiere más líquido, agrega más leche o agua",
        "Prepara porciones extra y refrigera hasta 24 horas"
      ],
      "allergens": [
        "Gluten (avena)",
        "Lácteos (si usas leche)"
      ],
      "childId": "K6vfrjDYcwAp8cDgH9sh",
      "ageMonths": 8,
      "generatedAt": "2026-02-07T16:30:00.000Z"
    },
    {
      "id": "recipe_1738854321000_1",
      "mealType": "breakfast",
      "name": "Tortitas de Plátano sin Azúcar",
      "description": "Desayuno dulce natural sin azúcar añadido",
      "ageAppropriate": true,
      "prepTime": 5,
      "cookTime": 8,
      "servings": 4,
      "difficulty": "fácil",
      "ingredients": [
        {
          "item": "Plátano maduro",
          "quantity": "1 grande"
        },
        {
          "item": "Huevo",
          "quantity": "1 unidad"
        },
        {
          "item": "Harina de avena",
          "quantity": "2 cucharadas"
        }
      ],
      "instructions": [
        "Triturar el plátano con un tenedor",
        "Mezclar el plátano con el huevo batido",
        "Agregar la harina de avena y mezclar bien",
        "Calentar sartén antiadherente a fuego medio",
        "Verter pequeñas porciones y cocinar 3-4 minutos por lado"
      ],
      "nutritionalInfo": {
        "calories": "60-70 kcal por tortita",
        "protein": "3g",
        "carbs": "10g",
        "fat": "2g"
      },
      "tips": [
        "Sirve con yogur natural sin azúcar",
        "Puedes congelar las tortitas y recalentar",
        "Añade una pizca de canela para más sabor"
      ],
      "allergens": [
        "Huevo",
        "Gluten (avena)"
      ],
      "childId": "K6vfrjDYcwAp8cDgH9sh",
      "ageMonths": 8,
      "generatedAt": "2026-02-07T16:30:00.000Z"
    }
    // ... 4 recetas más (2 de almuerzo, 2 de cena)
  ],
  "metadata": {
    "childAge": {
      "months": 8,
      "years": 0,
      "remainingMonths": 8,
      "displayAge": "8 meses"
    },
    "cached": false,
    "generatedAt": "2026-02-07T16:30:00.000Z",
    "totalRecipes": 6
  }
}
```

---

## 🎯 Adaptación por Edad

### Menor de 6 meses
- **No se generan recetas**
- Respuesta indica que está en periodo de lactancia exclusiva
- Solo leche materna o fórmula

### 6-12 meses (Alimentación Complementaria)
- Papillas y purés suaves
- Alimentos machacados
- Sin sal, azúcar ni miel
- Introducción gradual de sabores
- Texturas muy suaves

### 12-24 meses
- Alimentos más sólidos
- Texturas variadas
- Comida picada en trozos pequeños
- Baja en sal
- Sin azúcar añadido

### 24-36 meses (2-3 años)
- Comidas similares a adultos
- Porciones pequeñas
- Variedad y color
- Nutrición balanceada

### 3+ años
- Alimentación normal pero saludable
- Comidas balanceadas
- Presentaciones atractivas para niños
- Énfasis en nutrición

---

## 💾 Sistema de Caché

### Funcionamiento
- Las recetas se cachean automáticamente por **24 horas**
- El caché es específico por:
  - `childId` - Niño específico
  - `mealType` - Tipo de comida solicitado
  - `ageMonths` - Edad en meses
  
### Ventajas
- ✅ Respuesta instantánea en llamadas subsecuentes
- ✅ Reduce costos de API de OpenAI
- ✅ Consistencia en las recetas mostradas

### Regenerar Recetas
Si quieres nuevas recetas antes de 24 horas:

```http
GET /api/children/{childId}/nutrition/recipes?regenerate=true
```

---

## 📱 Ejemplos de Uso

### Obtener todas las recetas del día

```javascript
const fetchDailyRecipes = async (childId) => {
  const response = await fetch(
    `https://api.munpa.online/api/children/${childId}/nutrition/recipes?mealType=all`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );
  
  const result = await response.json();
  
  if (result.success) {
    const breakfasts = result.data.filter(r => r.mealType === 'breakfast');
    const lunches = result.data.filter(r => r.mealType === 'lunch');
    const dinners = result.data.filter(r => r.mealType === 'dinner');
    
    console.log(`Desayunos: ${breakfasts.length}`);
    console.log(`Almuerzos: ${lunches.length}`);
    console.log(`Cenas: ${dinners.length}`);
  }
};
```

### Solo desayunos

```javascript
const fetchBreakfasts = async (childId) => {
  const response = await fetch(
    `https://api.munpa.online/api/children/${childId}/nutrition/recipes?mealType=breakfast`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );
  
  const result = await response.json();
  // Devuelve 2 recetas de desayuno
};
```

### Forzar nuevas recetas

```javascript
const getNewRecipes = async (childId) => {
  const response = await fetch(
    `https://api.munpa.online/api/children/${childId}/nutrition/recipes?regenerate=true`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );
  
  const result = await response.json();
  console.log(`Cached: ${result.metadata.cached}`); // false
};
```

---

## 🎨 Renderizar Recetas en el Frontend

```javascript
const RecipeCard = ({ recipe }) => {
  const getMealIcon = (mealType) => {
    switch(mealType) {
      case 'breakfast': return '🌅';
      case 'lunch': return '☀️';
      case 'dinner': return '🌙';
      default: return '🍽️';
    }
  };
  
  return (
    <View style={styles.card}>
      <Text style={styles.mealType}>
        {getMealIcon(recipe.mealType)} {recipe.mealType.toUpperCase()}
      </Text>
      
      <Text style={styles.title}>{recipe.name}</Text>
      <Text style={styles.description}>{recipe.description}</Text>
      
      <View style={styles.meta}>
        <Text>⏱️ Prep: {recipe.prepTime}min</Text>
        <Text>👨‍🍳 Cook: {recipe.cookTime}min</Text>
        <Text>🍽️ Porciones: {recipe.servings}</Text>
        <Text>📊 {recipe.difficulty}</Text>
      </View>
      
      <Text style={styles.sectionTitle}>Ingredientes:</Text>
      {recipe.ingredients.map((ing, i) => (
        <Text key={i}>• {ing.quantity} de {ing.item}</Text>
      ))}
      
      <Text style={styles.sectionTitle}>Preparación:</Text>
      {recipe.instructions.map((step, i) => (
        <Text key={i}>{i+1}. {step}</Text>
      ))}
      
      {recipe.tips.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>💡 Tips:</Text>
          {recipe.tips.map((tip, i) => (
            <Text key={i}>• {tip}</Text>
          ))}
        </>
      )}
      
      {recipe.allergens.length > 0 && (
        <View style={styles.allergens}>
          <Text style={styles.warning}>⚠️ Alérgenos:</Text>
          <Text>{recipe.allergens.join(', ')}</Text>
        </View>
      )}
    </View>
  );
};
```

---

## ⚠️ Errores Comunes

### Error 404: Niño no encontrado

```json
{
  "success": false,
  "message": "Niño no encontrado"
}
```

**Solución:** Verifica que el `childId` sea correcto.

---

### Error 403: Sin permiso

```json
{
  "success": false,
  "message": "No tienes permiso para acceder a este niño"
}
```

**Solución:** El niño no pertenece al usuario autenticado.

---

### Error 503: OpenAI no disponible

```json
{
  "success": false,
  "message": "Servicio de generación de recetas no disponible",
  "error": "OpenAI no configurado"
}
```

**Solución:** El servicio de IA no está disponible. Intenta más tarde.

---

## 📊 Información Nutricional

Cada receta incluye estimaciones nutricionales:

```javascript
{
  "nutritionalInfo": {
    "calories": "80-100 kcal",
    "protein": "2-3g",
    "carbs": "15-18g",
    "fat": "1-2g"
  }
}
```

**Nota:** Los valores son aproximados y pueden variar según ingredientes específicos y porciones.

---

## 🔒 Seguridad y Privacidad

- ✅ Autenticación requerida
- ✅ Validación de propiedad del niño
- ✅ Solo el padre/madre puede acceder a recetas de su hijo
- ✅ No se comparte información entre usuarios
- ✅ Caché aislado por usuario y niño

---

## 💡 Mejores Prácticas

### Para el Frontend

1. **Cache local adicional:** Guarda las recetas en AsyncStorage/localStorage para acceso offline
2. **Loading states:** Muestra skeleton/spinner mientras se generan recetas (puede tomar 5-10 segundos)
3. **Error handling:** Maneja errores de red y muestra mensajes amigables
4. **Refresh manual:** Permite al usuario regenerar recetas si no le gustan
5. **Favoritos:** Implementa sistema para marcar recetas favoritas localmente

### Para los Usuarios

1. **Primera vez:** La primera llamada tarda más (genera con IA)
2. **Llamadas subsecuentes:** Son instantáneas (caché de 24h)
3. **Variedad:** Usa `regenerate=true` si quieres nuevas opciones
4. **Planificación:** Genera recetas una vez al día y planifica con anticipación

---

## 🚀 Roadmap Futuro

### Funcionalidades Planeadas

- [ ] Preferencias alimenticias (vegetariano, vegano, etc.)
- [ ] Alergias/intolerancias del niño
- [ ] Recetas favoritas guardadas
- [ ] Compartir recetas entre usuarios
- [ ] Lista de compras automática
- [ ] Historial de recetas generadas
- [ ] Calificación y comentarios de recetas
- [ ] Variaciones de recetas existentes
- [ ] Plan semanal de comidas
- [ ] Integración con calendario

---

## 📞 Soporte

Si encuentras algún problema o tienes sugerencias, contacta al equipo de desarrollo.
