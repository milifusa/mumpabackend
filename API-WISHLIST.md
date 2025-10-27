# 💝 API Wishlist (Lista de Deseos) - Munpa

Sistema completo de lista de deseos para que los usuarios guarden recomendados que quieren visitar en el futuro, con notas personales y prioridades.

---

## 📊 Estructura de Datos

### Wishlist Item:

```typescript
{
  // Identificadores
  wishlistId: string,           // ID del item en la wishlist
  
  // Datos del recomendado (completos)
  id: string,
  name: string,
  description: string,
  address: string,
  latitude: number,
  longitude: number,
  imageUrl: string,
  totalReviews: number,
  averageRating: number,
  verified: boolean,
  badges: string[],
  features: { ... },
  category: { ... },
  
  // Datos específicos de la wishlist
  addedAt: Date,                // Fecha de agregado
  notes: string,                // Notas personales del usuario
  priority: "high" | "medium" | "low"  // Prioridad
}
```

---

## 🎯 API Endpoints

### 1. Agregar a Wishlist

**POST** `/api/recommendations/wishlist`

Agrega un recomendado a la lista de deseos del usuario.

**Headers:**
```
Authorization: Bearer {token}
```

**Body:**
```json
{
  "recommendationId": "rec123",
  "notes": "Quiero llevar a mi bebé aquí para su primer chequeo",
  "priority": "high"
}
```

**Campos:**
- `recommendationId` (requerido): ID del recomendado
- `notes` (opcional): Notas personales del usuario
- `priority` (opcional): "high", "medium" o "low" (default: "medium")

**Respuesta:**
```json
{
  "success": true,
  "message": "Agregado a tu lista de deseos",
  "data": {
    "id": "wish123",
    "userId": "user456",
    "recommendationId": "rec123",
    "notes": "Quiero llevar a mi bebé aquí...",
    "priority": "high",
    "addedAt": "2025-01-20T10:30:00.000Z",
    "createdAt": "2025-01-20T10:30:00.000Z"
  }
}
```

**Errores:**
- `400`: `recommendationId` no proporcionado o prioridad inválida
- `400`: El recomendado ya está en la wishlist
- `404`: Recomendado no encontrado

---

### 2. Obtener Mi Wishlist

**GET** `/api/recommendations/wishlist`

Obtiene todos los items de la wishlist del usuario autenticado.

**Headers:**
```
Authorization: Bearer {token}
```

**Query Params:**
- `priority` (opcional): Filtrar por prioridad ("high", "medium", "low")

**Ejemplos:**
```
GET /api/recommendations/wishlist
GET /api/recommendations/wishlist?priority=high
```

**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      // Datos completos del recomendado
      "id": "rec123",
      "name": "Clínica Maternal Santa Rosa",
      "description": "Atención especializada...",
      "address": "Av. Principal 123",
      "latitude": -12.0464,
      "longitude": -77.0428,
      "imageUrl": "https://...",
      "totalReviews": 25,
      "averageRating": 4.5,
      "verified": true,
      "badges": ["changing_table", "nursing_room", "baby_friendly"],
      "features": {
        "hasChangingTable": true,
        "hasNursingRoom": true,
        "hasParking": true,
        "isStrollerAccessible": false,
        "acceptsEmergencies": true,
        "is24Hours": false
      },
      "category": {
        "id": "cat123",
        "name": "Clínicas",
        "icon": "hospital",
        "imageUrl": "https://..."
      },
      // Datos de la wishlist
      "wishlistId": "wish123",
      "addedAt": "2025-01-20T10:30:00.000Z",
      "notes": "Quiero llevar a mi bebé aquí...",
      "priority": "high"
    }
  ],
  "metadata": {
    "total": 5,
    "byPriority": {
      "high": 2,
      "medium": 2,
      "low": 1
    }
  }
}
```

**Orden:**
- Primero por prioridad: `high` > `medium` > `low`
- Luego por fecha de agregado (más recientes primero)

---

### 3. Actualizar Item de Wishlist

**PUT** `/api/recommendations/wishlist/:wishlistId`

Actualiza las notas y/o prioridad de un item en la wishlist.

**Headers:**
```
Authorization: Bearer {token}
```

**Body:**
```json
{
  "notes": "Nuevas notas actualizadas",
  "priority": "medium"
}
```

**Campos:**
- `notes` (opcional): Nuevas notas
- `priority` (opcional): Nueva prioridad ("high", "medium", "low")

**Respuesta:**
```json
{
  "success": true,
  "message": "Item actualizado exitosamente",
  "data": {
    "id": "wish123",
    "userId": "user456",
    "recommendationId": "rec123",
    "notes": "Nuevas notas actualizadas",
    "priority": "medium",
    "addedAt": "2025-01-20T10:30:00.000Z",
    "updatedAt": "2025-01-20T11:00:00.000Z"
  }
}
```

**Errores:**
- `400`: Prioridad inválida
- `403`: No tienes permiso para modificar este item
- `404`: Item no encontrado

---

### 4. Eliminar de Wishlist

**DELETE** `/api/recommendations/wishlist/:wishlistId`

Elimina un item de la wishlist.

**Headers:**
```
Authorization: Bearer {token}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Eliminado de tu lista de deseos"
}
```

**Errores:**
- `403`: No tienes permiso para eliminar este item
- `404`: Item no encontrado

---

### 5. Verificar si está en Wishlist

**GET** `/api/recommendations/:recommendationId/wishlist`

Verifica si un recomendado específico está en la wishlist del usuario.

**Headers:**
```
Authorization: Bearer {token}
```

**Respuesta (NO está en wishlist):**
```json
{
  "success": true,
  "data": {
    "inWishlist": false
  }
}
```

**Respuesta (SÍ está en wishlist):**
```json
{
  "success": true,
  "data": {
    "inWishlist": true,
    "wishlistId": "wish123",
    "addedAt": "2025-01-20T10:30:00.000Z",
    "notes": "Quiero llevar a mi bebé aquí...",
    "priority": "high"
  }
}
```

---

## 📱 Implementación en React Native

### Service:

```typescript
// services/wishlistService.ts
import api from './api';

export interface WishlistItem {
  wishlistId: string;
  id: string;
  name: string;
  description: string;
  address: string;
  imageUrl: string;
  totalReviews: number;
  averageRating: number;
  verified: boolean;
  badges: string[];
  features: any;
  category: any;
  addedAt: Date;
  notes: string;
  priority: 'high' | 'medium' | 'low';
}

export const wishlistService = {
  // Agregar a wishlist
  add: async (recommendationId: string, notes?: string, priority?: 'high' | 'medium' | 'low') => {
    const response = await api.post('/api/recommendations/wishlist', {
      recommendationId,
      notes,
      priority
    });
    return response.data;
  },

  // Obtener mi wishlist
  getAll: async (priority?: 'high' | 'medium' | 'low') => {
    const params = priority ? { priority } : {};
    const response = await api.get('/api/recommendations/wishlist', { params });
    return response.data;
  },

  // Actualizar item
  update: async (wishlistId: string, data: { notes?: string; priority?: 'high' | 'medium' | 'low' }) => {
    const response = await api.put(`/api/recommendations/wishlist/${wishlistId}`, data);
    return response.data;
  },

  // Eliminar de wishlist
  remove: async (wishlistId: string) => {
    const response = await api.delete(`/api/recommendations/wishlist/${wishlistId}`);
    return response.data;
  },

  // Verificar si está en wishlist
  check: async (recommendationId: string) => {
    const response = await api.get(`/api/recommendations/${recommendationId}/wishlist`);
    return response.data;
  }
};
```

---

## 🎨 Componentes UI - React Native

### Pantalla de Wishlist:

```tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  RefreshControl,
  Alert
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { wishlistService, WishlistItem } from '../services/wishlistService';
import { BadgesDisplay } from '../components/BadgesDisplay';

const WishlistScreen = ({ navigation }) => {
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterPriority, setFilterPriority] = useState<string | null>(null);

  useEffect(() => {
    loadWishlist();
  }, [filterPriority]);

  const loadWishlist = async () => {
    setLoading(true);
    try {
      const response = await wishlistService.getAll(filterPriority);
      setWishlist(response.data);
    } catch (error) {
      console.error('Error loading wishlist:', error);
      Alert.alert('Error', 'No se pudo cargar tu lista de deseos');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = (item: WishlistItem) => {
    Alert.alert(
      'Eliminar de Lista',
      `¿Quieres eliminar "${item.name}" de tu lista de deseos?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await wishlistService.remove(item.wishlistId);
              loadWishlist();
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar el item');
            }
          }
        }
      ]
    );
  };

  const handleEditNotes = (item: WishlistItem) => {
    // Navegar a modal de edición
    navigation.navigate('EditWishlistItem', {
      wishlistId: item.wishlistId,
      currentNotes: item.notes,
      currentPriority: item.priority,
      onUpdate: loadWishlist
    });
  };

  const renderPriorityBadge = (priority: string) => {
    const config = {
      high: { label: 'Alta', color: '#F44336', icon: 'priority-high' },
      medium: { label: 'Media', color: '#FF9800', icon: 'remove' },
      low: { label: 'Baja', color: '#4CAF50', icon: 'arrow-downward' }
    };

    const { label, color, icon } = config[priority] || config.medium;

    return (
      <View style={[styles.priorityBadge, { backgroundColor: color + '20' }]}>
        <Icon name={icon} size={12} color={color} />
        <Text style={[styles.priorityText, { color }]}>{label}</Text>
      </View>
    );
  };

  const renderItem = ({ item }: { item: WishlistItem }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('RecommendationDetail', { id: item.id })}
    >
      {/* Imagen */}
      <Image source={{ uri: item.imageUrl }} style={styles.image} />

      {/* Contenido */}
      <View style={styles.content}>
        {/* Header con prioridad */}
        <View style={styles.header}>
          <Text style={styles.name} numberOfLines={2}>
            {item.name}
          </Text>
          {renderPriorityBadge(item.priority)}
        </View>

        {/* Dirección */}
        <Text style={styles.address} numberOfLines={1}>
          📍 {item.address}
        </Text>

        {/* Badges */}
        <BadgesDisplay
          badges={item.badges.slice(0, 3)}
          verified={item.verified}
          compact={true}
        />

        {/* Rating */}
        {item.totalReviews > 0 && (
          <View style={styles.rating}>
            <Icon name="star" size={14} color="#FFD700" />
            <Text style={styles.ratingText}>
              {item.averageRating.toFixed(1)} ({item.totalReviews} reseñas)
            </Text>
          </View>
        )}

        {/* Notas */}
        {item.notes && (
          <View style={styles.notesContainer}>
            <Icon name="edit-note" size={16} color="#666" />
            <Text style={styles.notes} numberOfLines={2}>
              {item.notes}
            </Text>
          </View>
        )}

        {/* Fecha de agregado */}
        <Text style={styles.addedDate}>
          Agregado el {new Date(item.addedAt).toLocaleDateString('es-ES')}
        </Text>

        {/* Acciones */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleEditNotes(item)}
          >
            <Icon name="edit" size={20} color="#2196F3" />
            <Text style={styles.actionText}>Editar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleRemove(item)}
          >
            <Icon name="delete" size={20} color="#F44336" />
            <Text style={[styles.actionText, { color: '#F44336' }]}>Eliminar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header con filtros */}
      <View style={styles.headerContainer}>
        <Text style={styles.title}>💝 Mi Lista de Deseos</Text>
        
        {/* Filtros de prioridad */}
        <View style={styles.filters}>
          <TouchableOpacity
            style={[styles.filterButton, !filterPriority && styles.filterButtonActive]}
            onPress={() => setFilterPriority(null)}
          >
            <Text style={!filterPriority ? styles.filterTextActive : styles.filterText}>
              Todas
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterButton, filterPriority === 'high' && styles.filterButtonActive]}
            onPress={() => setFilterPriority('high')}
          >
            <Text style={filterPriority === 'high' ? styles.filterTextActive : styles.filterText}>
              Alta
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterButton, filterPriority === 'medium' && styles.filterButtonActive]}
            onPress={() => setFilterPriority('medium')}
          >
            <Text style={filterPriority === 'medium' ? styles.filterTextActive : styles.filterText}>
              Media
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterButton, filterPriority === 'low' && styles.filterButtonActive]}
            onPress={() => setFilterPriority('low')}
          >
            <Text style={filterPriority === 'low' ? styles.filterTextActive : styles.filterText}>
              Baja
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Lista */}
      <FlatList
        data={wishlist}
        renderItem={renderItem}
        keyExtractor={(item) => item.wishlistId}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadWishlist} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="favorite-border" size={64} color="#ccc" />
            <Text style={styles.emptyText}>Tu lista de deseos está vacía</Text>
            <Text style={styles.emptySubtext}>
              Agrega lugares que quieras visitar en el futuro
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
  headerContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  filters: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  filterButtonActive: {
    backgroundColor: '#2196F3',
  },
  filterText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
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
    height: 150,
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  name: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  address: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  ratingText: {
    fontSize: 12,
    color: '#666',
  },
  notesContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 12,
    padding: 12,
    backgroundColor: '#FFF9C4',
    borderRadius: 8,
  },
  notes: {
    flex: 1,
    fontSize: 13,
    color: '#666',
    fontStyle: 'italic',
  },
  addedDate: {
    fontSize: 11,
    color: '#999',
    marginTop: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2196F3',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
});

export default WishlistScreen;
```

### Botón "Agregar a Wishlist" en Detalle:

```tsx
const AddToWishlistButton = ({ recommendationId, onAdded }) => {
  const [inWishlist, setInWishlist] = useState(false);
  const [wishlistData, setWishlistData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkWishlistStatus();
  }, []);

  const checkWishlistStatus = async () => {
    try {
      const response = await wishlistService.check(recommendationId);
      if (response.data.inWishlist) {
        setInWishlist(true);
        setWishlistData(response.data);
      }
    } catch (error) {
      console.error('Error checking wishlist:', error);
    }
  };

  const handleAddToWishlist = async () => {
    Alert.prompt(
      'Agregar a Lista de Deseos',
      'Agrega una nota personal (opcional):',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Agregar',
          onPress: async (notes) => {
            // Seleccionar prioridad
            Alert.alert(
              'Prioridad',
              'Selecciona la prioridad:',
              [
                {
                  text: 'Baja',
                  onPress: () => addToWishlist(notes, 'low')
                },
                {
                  text: 'Media',
                  onPress: () => addToWishlist(notes, 'medium')
                },
                {
                  text: 'Alta',
                  onPress: () => addToWishlist(notes, 'high')
                }
              ]
            );
          }
        }
      ],
      'plain-text'
    );
  };

  const addToWishlist = async (notes: string, priority: string) => {
    setLoading(true);
    try {
      await wishlistService.add(recommendationId, notes, priority);
      setInWishlist(true);
      Alert.alert('¡Listo!', 'Agregado a tu lista de deseos');
      onAdded?.();
    } catch (error) {
      Alert.alert('Error', 'No se pudo agregar a la lista');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFromWishlist = async () => {
    Alert.alert(
      'Eliminar de Lista',
      '¿Quieres eliminar este lugar de tu lista de deseos?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await wishlistService.remove(wishlistData.wishlistId);
              setInWishlist(false);
              setWishlistData(null);
              Alert.alert('Eliminado', 'Eliminado de tu lista de deseos');
              onAdded?.();
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  return (
    <TouchableOpacity
      style={[styles.button, inWishlist && styles.buttonActive]}
      onPress={inWishlist ? handleRemoveFromWishlist : handleAddToWishlist}
      disabled={loading}
    >
      <Icon
        name={inWishlist ? 'bookmark' : 'bookmark-border'}
        size={20}
        color={inWishlist ? '#fff' : '#2196F3'}
      />
      <Text style={[styles.buttonText, inWishlist && styles.buttonTextActive]}>
        {inWishlist ? 'En Lista' : 'Agregar a Lista'}
      </Text>
    </TouchableOpacity>
  );
};
```

---

## ✨ Características

✅ **Notas Personales**: Los usuarios pueden agregar notas sobre por qué quieren visitar el lugar  
✅ **Prioridades**: Sistema de 3 niveles (alta, media, baja)  
✅ **Ordenamiento Inteligente**: Por prioridad primero, luego por fecha  
✅ **Filtros**: Filtrar por prioridad  
✅ **Datos Completos**: Incluye toda la información del recomendado  
✅ **Metadata**: Contador total y por prioridad  
✅ **Editable**: Actualizar notas y prioridad en cualquier momento  
✅ **Verificación Rápida**: Endpoint para saber si ya está en la lista  

---

## 📝 Notas Importantes

1. **Diferencia con Favoritos**: 
   - **Favoritos**: Lugares que te gustan
   - **Wishlist**: Lugares que planeas visitar

2. **Persistencia**: Los items se almacenan en la colección `recommendationWishlist` en Firestore.

3. **Permisos**: Solo el dueño puede modificar/eliminar sus items de wishlist.

4. **Filtrado**: Solo se devuelven recomendados activos (`isActive: true`).

5. **Orden por defecto**: Prioridad descendente, luego fecha descendente.

