# 🆕 API de Recomendaciones Recientes - Munpa

Endpoint para mostrar las recomendaciones más recientes agregadas por el administrador.

---

## 📱 ENDPOINT PARA LA APP

### Obtener recomendaciones recientes

**GET** `/api/recommendations/recent`

Obtiene las recomendaciones más recientes (por defecto 10) con toda su información.

**Headers:**
```
Authorization: Bearer {token}
```

**Query Params:**
- `limit` (opcional, default: 10): Número de recomendaciones a obtener

**Ejemplo:**
```
GET /api/recommendations/recent
GET /api/recommendations/recent?limit=20
```

**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "id": "rec123",
      "name": "Clínica Maternal Santa María",
      "description": "Atención especializada en embarazo y parto",
      "address": "Av. Principal 123, Ciudad",
      "imageUrl": "https://...",
      "totalReviews": 25,
      "averageRating": 4.5,
      "commentsCount": 18,
      "category": {
        "id": "cat123",
        "name": "Clínicas",
        "icon": "hospital",
        "imageUrl": "https://..."
      },
      "createdAt": "2025-01-20T10:30:00.000Z"
    },
    {
      "id": "rec456",
      "name": "Tienda de Productos Bebé",
      "description": "Todo para tu bebé",
      "address": "Calle 456",
      "imageUrl": "https://...",
      "totalReviews": 12,
      "averageRating": 4.2,
      "commentsCount": 8,
      "category": {
        "id": "cat456",
        "name": "Tiendas",
        "icon": "store",
        "imageUrl": "https://..."
      },
      "createdAt": "2025-01-19T15:20:00.000Z"
    }
  ]
}
```

---

## 📊 Datos Incluidos

Cada recomendación incluye:

- ✅ **Información básica**: id, nombre, descripción, dirección, imagen
- ✅ **Estadísticas de reviews**:
  - `totalReviews`: Total de calificaciones recibidas
  - `averageRating`: Promedio de estrellas (1-5)
  - `commentsCount`: Número de reviews con comentarios escritos
- ✅ **Categoría completa**: nombre, icono e imagen
- ✅ **Fecha de creación**: Para ordenamiento cronológico

---

## 🎨 Ejemplo de Uso en React Native

### Service:

```typescript
// services/recommendationService.ts

export const recommendationService = {
  // ... métodos existentes ...

  getRecent: async (limit = 10) => {
    const response = await api.get('/api/recommendations/recent', {
      params: { limit }
    });
    return response.data;
  }
};
```

### Componente de lista de recientes:

```tsx
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { recommendationService } from '../services/recommendationService';

const RecentRecommendationsScreen = ({ navigation }) => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecentRecommendations();
  }, []);

  const loadRecentRecommendations = async () => {
    try {
      const response = await recommendationService.getRecent(10);
      setRecommendations(response.data);
    } catch (error) {
      console.error('Error cargando recomendaciones recientes:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderRecommendation = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('RecommendationDetail', { id: item.id })}
    >
      {/* Imagen */}
      {item.imageUrl && (
        <Image source={{ uri: item.imageUrl }} style={styles.image} />
      )}

      <View style={styles.content}>
        {/* Badge de "Nuevo" */}
        <View style={styles.newBadge}>
          <Text style={styles.newBadgeText}>NUEVO</Text>
        </View>

        {/* Categoría */}
        {item.category && (
          <View style={styles.categoryBadge}>
            <Icon name={item.category.icon} size={14} color="#666" />
            <Text style={styles.categoryName}>{item.category.name}</Text>
          </View>
        )}

        {/* Nombre */}
        <Text style={styles.name}>{item.name}</Text>

        {/* Descripción */}
        {item.description && (
          <Text style={styles.description} numberOfLines={2}>
            {item.description}
          </Text>
        )}

        {/* Estadísticas */}
        <View style={styles.stats}>
          {/* Rating */}
          {item.totalReviews > 0 && (
            <View style={styles.statItem}>
              <Icon name="star" size={16} color="#FFD700" />
              <Text style={styles.statText}>{item.averageRating.toFixed(1)}</Text>
              <Text style={styles.statSubtext}>({item.totalReviews})</Text>
            </View>
          )}

          {/* Comentarios */}
          {item.commentsCount > 0 && (
            <View style={styles.statItem}>
              <Icon name="comment" size={16} color="#2196F3" />
              <Text style={styles.statText}>{item.commentsCount}</Text>
              <Text style={styles.statSubtext}>comentarios</Text>
            </View>
          )}
        </View>

        {/* Dirección */}
        {item.address && (
          <View style={styles.addressRow}>
            <Icon name="location-on" size={14} color="#999" />
            <Text style={styles.address} numberOfLines={1}>
              {item.address}
            </Text>
          </View>
        )}

        {/* Fecha de agregado */}
        <Text style={styles.date}>
          Agregado hace {getTimeAgo(item.createdAt)}
        </Text>
      </View>
    </TouchableOpacity>
  );

  // Función auxiliar para mostrar tiempo relativo
  const getTimeAgo = (date) => {
    const now = new Date();
    const createdAt = new Date(date);
    const diffInMs = now - createdAt;
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInDays === 0) {
      if (diffInHours === 0) return 'menos de una hora';
      return `${diffInHours} ${diffInHours === 1 ? 'hora' : 'horas'}`;
    }
    if (diffInDays < 7) {
      return `${diffInDays} ${diffInDays === 1 ? 'día' : 'días'}`;
    }
    const diffInWeeks = Math.floor(diffInDays / 7);
    return `${diffInWeeks} ${diffInWeeks === 1 ? 'semana' : 'semanas'}`;
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text>Cargando recomendaciones...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Recién Agregados</Text>
        <Text style={styles.headerSubtitle}>
          Descubre los lugares más recientes
        </Text>
      </View>

      <FlatList
        data={recommendations}
        renderItem={renderRecommendation}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="inbox" size={64} color="#ccc" />
            <Text style={styles.emptyText}>
              No hay recomendaciones recientes
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
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  listContent: {
    padding: 16,
  },
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
  content: {
    padding: 16,
  },
  newBadge: {
    position: 'absolute',
    top: -200 + 12,
    right: 12,
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  newBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 12,
    color: '#666',
    textTransform: 'uppercase',
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  stats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  statSubtext: {
    fontSize: 12,
    color: '#666',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  address: {
    fontSize: 12,
    color: '#999',
    flex: 1,
  },
  date: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
  },
});

export default RecentRecommendationsScreen;
```

### Sección de recientes en el Home:

```tsx
const HomeScreen = () => {
  const [recentRecommendations, setRecentRecommendations] = useState([]);

  useEffect(() => {
    loadRecentRecommendations();
  }, []);

  const loadRecentRecommendations = async () => {
    try {
      const response = await recommendationService.getRecent(5);
      setRecentRecommendations(response.data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Otros contenidos del home */}

      {/* Sección de recientes */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recién Agregados</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('RecentRecommendations')}
          >
            <Text style={styles.seeAllText}>Ver todos</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          horizontal
          data={recentRecommendations}
          renderItem={({ item }) => (
            <RecommendationCardHorizontal item={item} />
          )}
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalList}
        />
      </View>
    </ScrollView>
  );
};
```

---

## ⚠️ Índice Requerido en Firestore

Necesitas crear este índice en Firebase Console:

**Colección:** `recommendations`  
**Campos:**
- `isActive` (Ascending)
- `createdAt` (Descending)

Ve a: Firebase Console → Firestore Database → Indexes → Create Index

---

## ✨ Características

✅ **Ordenamiento cronológico**: Las más recientes primero  
✅ **Solo activas**: Solo muestra recomendaciones activas  
✅ **Información completa**: Nombre, categoría, rating, comentarios  
✅ **Conteo de comentarios**: Solo cuenta reviews que tienen texto  
✅ **Categoría incluida**: Con icono e imagen  
✅ **Límite configurable**: Por defecto 10, ajustable  

---

## 💡 Casos de Uso

- **Home de la app**: Mostrar sección "Recién agregados"
- **Descubrimiento**: Usuarios encuentran nuevos lugares
- **Promoción**: Destacar lugares recién agregados por el admin
- **Feed de novedades**: Mantener a los usuarios informados

---

## 🎯 Diferencia con otros endpoints

- `/api/recommendations` - Todos los recomendados (con filtro por categoría)
- `/api/recommendations/recent` - Los 10 más recientes (ordenados por fecha)
- `/api/recommendations/favorites` - Los favoritos del usuario
- `/api/recommendations/:id` - Un recomendado específico

