# ❤️ API de Favoritos para Recomendados - Munpa

Sistema de favoritos que permite a los usuarios marcar recomendados para acceder rápidamente a ellos más tarde.

---

## 📱 ENDPOINTS PARA LA APP

### 1. Obtener mis recomendados favoritos

**GET** `/api/recommendations/favorites`

Obtiene todos los recomendados marcados como favoritos por el usuario actual.

**Headers:**
```
Authorization: Bearer {token}
```

**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "id": "rec123",
      "name": "Clínica Maternal Santa María",
      "description": "Atención especializada en embarazo",
      "address": "Av. Principal 123",
      "latitude": -12.0464,
      "longitude": -77.0428,
      "phone": "+51 999 999 999",
      "email": "info@clinica.com",
      "website": "https://clinica.com",
      "imageUrl": "https://...",
      "totalReviews": 25,
      "averageRating": 4.5,
      "isFavorite": true,
      "category": {
        "id": "cat123",
        "name": "Clínicas",
        "icon": "hospital"
      }
    }
  ]
}
```

### 2. Verificar si un recomendado es favorito

**GET** `/api/recommendations/:recommendationId/favorite`

Verifica si un recomendado específico está marcado como favorito.

**Headers:**
```
Authorization: Bearer {token}
```

**Ejemplo:**
```
GET /api/recommendations/rec123/favorite
```

**Respuesta:**
```json
{
  "success": true,
  "isFavorite": true
}
```

### 3. Agregar o quitar de favoritos (Toggle)

**POST** `/api/recommendations/:recommendationId/favorite`

Alterna el estado de favorito de un recomendado:
- Si no es favorito → lo marca como favorito
- Si ya es favorito → lo quita de favoritos

**Headers:**
```
Authorization: Bearer {token}
```

**Ejemplo:**
```
POST /api/recommendations/rec123/favorite
```

**Respuesta (agregado a favoritos):**
```json
{
  "success": true,
  "message": "Agregado a favoritos",
  "isFavorite": true
}
```

**Respuesta (eliminado de favoritos):**
```json
{
  "success": true,
  "message": "Eliminado de favoritos",
  "isFavorite": false
}
```

---

## 📊 Estructura de Datos en Firestore

**Colección:** `recommendationFavorites`

**Documento:**
```json
{
  "userId": "user123",
  "recommendationId": "rec123",
  "createdAt": Timestamp
}
```

**Índices requeridos en Firestore:**
- `userId` (Ascending) - Para obtener favoritos de un usuario
- `userId` (Ascending) + `recommendationId` (Ascending) - Para verificar favoritos

---

## 🎨 Ejemplo de Uso en React Native

### Service para favoritos:

```typescript
// services/recommendationService.ts

export const recommendationService = {
  // ... métodos existentes ...

  // Obtener mis favoritos
  getFavorites: async () => {
    const response = await api.get('/api/recommendations/favorites');
    return response.data;
  },

  // Verificar si es favorito
  isFavorite: async (recommendationId: string) => {
    const response = await api.get(`/api/recommendations/${recommendationId}/favorite`);
    return response.data;
  },

  // Toggle favorito
  toggleFavorite: async (recommendationId: string) => {
    const response = await api.post(`/api/recommendations/${recommendationId}/favorite`);
    return response.data;
  }
};
```

### Hook personalizado para favoritos:

```typescript
// hooks/useFavorite.ts
import { useState, useEffect } from 'react';
import { recommendationService } from '../services/recommendationService';

export const useFavorite = (recommendationId: string) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkFavorite();
  }, [recommendationId]);

  const checkFavorite = async () => {
    try {
      const response = await recommendationService.isFavorite(recommendationId);
      setIsFavorite(response.isFavorite);
    } catch (error) {
      console.error('Error checking favorite:', error);
    }
  };

  const toggleFavorite = async () => {
    setLoading(true);
    try {
      const response = await recommendationService.toggleFavorite(recommendationId);
      setIsFavorite(response.isFavorite);
      return response;
    } catch (error) {
      console.error('Error toggling favorite:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return { isFavorite, loading, toggleFavorite };
};
```

### Botón de favorito en tarjeta de recomendado:

```tsx
import React from 'react';
import { TouchableOpacity, View, Text } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useFavorite } from '../hooks/useFavorite';

const RecommendationCard = ({ recommendation, onPress }) => {
  const { isFavorite, loading, toggleFavorite } = useFavorite(recommendation.id);

  const handleFavoritePress = async () => {
    try {
      await toggleFavorite();
      // Opcionalmente mostrar un toast o mensaje
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar el favorito');
    }
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <Image source={{ uri: recommendation.imageUrl }} style={styles.image} />
      
      {/* Botón de favorito */}
      <TouchableOpacity
        style={styles.favoriteButton}
        onPress={handleFavoritePress}
        disabled={loading}
      >
        <Icon
          name={isFavorite ? 'favorite' : 'favorite-border'}
          size={24}
          color={isFavorite ? '#FF4444' : '#666'}
        />
      </TouchableOpacity>
      
      <View style={styles.content}>
        <Text style={styles.name}>{recommendation.name}</Text>
        
        {/* Rating */}
        {recommendation.totalReviews > 0 && (
          <View style={styles.rating}>
            <Icon name="star" size={16} color="#FFD700" />
            <Text>{recommendation.averageRating.toFixed(1)}</Text>
            <Text>({recommendation.totalReviews})</Text>
          </View>
        )}
        
        <Text style={styles.description} numberOfLines={2}>
          {recommendation.description}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  image: {
    width: '100%',
    height: 200,
  },
  favoriteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    padding: 8,
  },
  content: {
    padding: 16,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#666',
  },
});
```

### Pantalla de favoritos:

```tsx
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { recommendationService } from '../services/recommendationService';
import RecommendationCard from '../components/RecommendationCard';

const FavoritesScreen = ({ navigation }) => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      const response = await recommendationService.getFavorites();
      setFavorites(response.data);
    } catch (error) {
      console.error('Error cargando favoritos:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadFavorites();
  };

  const handleRecommendationPress = (recommendation) => {
    navigation.navigate('RecommendationDetail', { id: recommendation.id });
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text>Cargando favoritos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={favorites}
        renderItem={({ item }) => (
          <RecommendationCard
            recommendation={item}
            onPress={() => handleRecommendationPress(item)}
          />
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="favorite-border" size={64} color="#ccc" />
            <Text style={styles.emptyTitle}>No tienes favoritos</Text>
            <Text style={styles.emptyText}>
              Marca tus lugares favoritos para encontrarlos fácilmente
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});

export default FavoritesScreen;
```

### Animación del botón de favorito:

```tsx
import React, { useRef, useEffect } from 'react';
import { TouchableOpacity, Animated } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const FavoriteButton = ({ isFavorite, onPress, loading }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isFavorite) {
      // Animación de "bounce" cuando se marca como favorito
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.3,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isFavorite]);

  const handlePress = () => {
    if (!loading) {
      onPress();
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={loading}
      style={styles.button}
    >
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <Icon
          name={isFavorite ? 'favorite' : 'favorite-border'}
          size={24}
          color={isFavorite ? '#FF4444' : '#666'}
        />
      </Animated.View>
    </TouchableOpacity>
  );
};
```

### Integrar con Context para estado global:

```typescript
// context/FavoritesContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { recommendationService } from '../services/recommendationService';

const FavoritesContext = createContext(null);

export const FavoritesProvider = ({ children }) => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      const response = await recommendationService.getFavorites();
      setFavorites(response.data);
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (recommendationId: string) => {
    try {
      const response = await recommendationService.toggleFavorite(recommendationId);
      
      if (response.isFavorite) {
        // Agregar a la lista (necesitamos obtener el recomendado completo)
        // O simplemente recargar la lista
        await loadFavorites();
      } else {
        // Quitar de la lista
        setFavorites(prev => prev.filter(fav => fav.id !== recommendationId));
      }
      
      return response;
    } catch (error) {
      console.error('Error toggling favorite:', error);
      throw error;
    }
  };

  const isFavorite = (recommendationId: string) => {
    return favorites.some(fav => fav.id === recommendationId);
  };

  return (
    <FavoritesContext.Provider value={{
      favorites,
      loading,
      toggleFavorite,
      isFavorite,
      refresh: loadFavorites
    }}>
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within FavoritesProvider');
  }
  return context;
};
```

---

## ✨ Características

✅ **Toggle simple**: Un solo endpoint para agregar/quitar  
✅ **Verificación rápida**: Saber si un recomendado es favorito  
✅ **Lista completa**: Ver todos los favoritos con toda la información  
✅ **Información completa**: Incluye categoría, rating y reviews  
✅ **Estado persistente**: Se guarda en Firestore  
✅ **Por usuario**: Cada usuario tiene sus propios favoritos  

---

## 📝 Notas Importantes

1. **Toggle automático**: El endpoint `POST /api/recommendations/:recommendationId/favorite` detecta automáticamente si debe agregar o quitar el favorito.

2. **Sin duplicados**: Un usuario no puede tener el mismo recomendado marcado como favorito dos veces.

3. **Favoritos obsoletos**: Si un recomendado es eliminado, no aparecerá en la lista de favoritos (se filtra automáticamente).

4. **Índices de Firestore**: Necesitas crear estos índices:
   - `userId` (Ascending)
   - `userId` (Ascending) + `recommendationId` (Ascending)

5. **Optimización**: Considera usar Context API o Redux para mantener el estado de favoritos en toda la app y evitar múltiples llamadas.

---

## 🎯 Casos de Uso

- **Guardar para después**: Usuario encuentra un lugar interesante y lo guarda para visitarlo más tarde
- **Lista de deseos**: Crear una lista personal de lugares por visitar
- **Acceso rápido**: Encontrar rápidamente lugares favoritos sin buscar
- **Comparación**: Tener varios lugares guardados para comparar y decidir
- **Recomendaciones personales**: Compartir la lista de favoritos con amigos/familia

---

## 💡 Mejoras Sugeridas

1. **Colecciones de favoritos**: Permitir crear carpetas o categorías de favoritos
2. **Compartir favoritos**: Compartir la lista completa con otros usuarios
3. **Notificaciones**: Avisar cuando un favorito tiene una oferta o promoción
4. **Sincronización**: Mantener favoritos sincronizados entre dispositivos
5. **Límite**: Opcionalmente limitar el número de favoritos por usuario

