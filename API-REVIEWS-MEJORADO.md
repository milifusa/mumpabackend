# ⭐ API Reviews Mejorado - Sistema Completo con Fotos y Sistema "Útil"

Sistema completo de reviews para recomendados con fotos, información contextual y sistema de marcado como "útil".

---

## 📊 Estructura de Datos Completa

```typescript
{
  id: string,
  userId: string,
  userName: string,
  userAvatar: string,
  rating: number,                    // 1-5
  comment: string,
  photos: string[],                  // URLs de fotos (máx 5)
  childAge: string,                  // "6 meses", "2 años", etc.
  visitedWith: string,               // "Solo", "Pareja", "Familia", "Amigos"
  helpfulCount: number,              // Contador de "útil"
  isHelpfulByMe: boolean,           // Si el usuario actual lo marcó
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🎯 Endpoints Implementados

### 1. Crear/Actualizar Review (MEJORADO)

**POST** `/api/recommendations/:recommendationId/reviews`

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Body:**
```json
{
  "rating": 5,
  "comment": "Excelente lugar para bebés, muy limpio y el personal es súper amable",
  "photos": [
    "https://storage.../photo1.jpg",
    "https://storage.../photo2.jpg"
  ],
  "childAge": "6 meses",
  "visitedWith": "Pareja"
}
```

**Campos:**
- `rating` (requerido): 1-5 estrellas
- `comment` (opcional): Texto de la reseña
- `photos` (opcional): Array de URLs (máx 5)
- `childAge` (opcional): Edad del bebé al visitar
- `visitedWith` (opcional): "Solo", "Pareja", "Familia", "Amigos"

**Respuesta:**
```json
{
  "success": true,
  "message": "Review creada exitosamente",
  "data": {
    "id": "review123",
    "userId": "user456",
    "userName": "María López",
    "userAvatar": "https://...",
    "rating": 5,
    "comment": "Excelente lugar...",
    "photos": ["https://...photo1.jpg", "https://...photo2.jpg"],
    "childAge": "6 meses",
    "visitedWith": "Pareja",
    "helpfulCount": 0,
    "createdAt": "2025-01-20T10:00:00Z",
    "updatedAt": "2025-01-20T10:00:00Z"
  }
}
```

---

### 2. Subir Foto de Review (Una foto)

**POST** `/api/recommendations/:recommendationId/reviews/upload-photo`

**Headers:**
```
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**Body (FormData):**
```
photo: [archivo de imagen]
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Foto subida exitosamente",
  "data": {
    "photoUrl": "https://storage.googleapis.com/.../review-rec123-user456-1674220800000-photo.jpg"
  }
}
```

---

### 3. Subir Múltiples Fotos (Hasta 5)

**POST** `/api/recommendations/:recommendationId/reviews/upload-photos`

**Headers:**
```
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**Body (FormData):**
```
photos: [archivo1, archivo2, archivo3, ...]  // Máximo 5
```

**Respuesta:**
```json
{
  "success": true,
  "message": "3 foto(s) subida(s) exitosamente",
  "data": {
    "photoUrls": [
      "https://storage.../photo1.jpg",
      "https://storage.../photo2.jpg",
      "https://storage.../photo3.jpg"
    ]
  }
}
```

---

### 4. Marcar Review como Útil (Toggle)

**POST** `/api/recommendations/:recommendationId/reviews/:reviewId/helpful`

**Headers:**
```
Authorization: Bearer {token}
```

**Respuesta:**
```json
{
  "success": true,
  "isHelpful": true,     // true si se marcó, false si se desmarcó
  "helpfulCount": 15     // Contador actualizado
}
```

---

### 5. Verificar si Marqué como Útil

**GET** `/api/recommendations/:recommendationId/reviews/:reviewId/helpful`

**Headers:**
```
Authorization: Bearer {token}
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "isHelpful": true
  }
}
```

---

### 6. Obtener Reviews (MEJORADO)

**GET** `/api/recommendations/:recommendationId/reviews?page=1&limit=20`

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
      "id": "review123",
      "userId": "user456",
      "userName": "María López",
      "userAvatar": "https://...",
      "rating": 5,
      "comment": "Excelente lugar...",
      "photos": [
        "https://storage.../photo1.jpg",
        "https://storage.../photo2.jpg"
      ],
      "childAge": "6 meses",
      "visitedWith": "Pareja",
      "helpfulCount": 15,
      "isHelpfulByMe": false,
      "createdAt": "2025-01-20T10:00:00Z",
      "updatedAt": "2025-01-20T10:00:00Z"
    }
  ],
  "stats": {
    "totalReviews": 25,
    "averageRating": 4.5
  },
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 25,
    "totalPages": 2
  }
}
```

---

### 7. Obtener Mi Review (MEJORADO)

**GET** `/api/recommendations/:recommendationId/reviews/my-review`

**Headers:**
```
Authorization: Bearer {token}
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "id": "review123",
    "rating": 5,
    "comment": "Excelente lugar...",
    "photos": ["https://...photo1.jpg"],
    "childAge": "6 meses",
    "visitedWith": "Pareja",
    "helpfulCount": 3,
    "createdAt": "2025-01-20T10:00:00Z",
    "updatedAt": "2025-01-20T10:00:00Z"
  }
}
```

---

### 8. Migración de Reviews Existentes (ADMIN)

**POST** `/api/admin/reviews/migrate-fields`

**Headers:**
```
Authorization: Bearer {admin-token}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Migración de reviews completada exitosamente",
  "data": {
    "total": 50,      // Total de reviews
    "updated": 45,    // Actualizadas
    "skipped": 5      // Ya tenían los campos
  }
}
```

---

## 📱 Implementación en React Native

### Service Completo:

```typescript
// services/reviewService.ts
import api from './api';

export interface Review {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  rating: number;
  comment: string;
  photos: string[];
  childAge: string;
  visitedWith: string;
  helpfulCount: number;
  isHelpfulByMe: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const reviewService = {
  // Crear/actualizar review
  createOrUpdate: async (
    recommendationId: string,
    data: {
      rating: number;
      comment?: string;
      photos?: string[];
      childAge?: string;
      visitedWith?: 'Solo' | 'Pareja' | 'Familia' | 'Amigos';
    }
  ) => {
    const response = await api.post(
      `/api/recommendations/${recommendationId}/reviews`,
      data
    );
    return response.data;
  },

  // Subir una foto
  uploadPhoto: async (recommendationId: string, photoFile: any) => {
    const formData = new FormData();
    formData.append('photo', {
      uri: photoFile.uri,
      type: photoFile.type || 'image/jpeg',
      name: photoFile.fileName || 'photo.jpg',
    });

    const response = await api.post(
      `/api/recommendations/${recommendationId}/reviews/upload-photo`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  // Subir múltiples fotos
  uploadPhotos: async (recommendationId: string, photoFiles: any[]) => {
    const formData = new FormData();
    
    photoFiles.forEach((file, index) => {
      formData.append('photos', {
        uri: file.uri,
        type: file.type || 'image/jpeg',
        name: file.fileName || `photo${index}.jpg`,
      });
    });

    const response = await api.post(
      `/api/recommendations/${recommendationId}/reviews/upload-photos`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  // Obtener reviews
  getAll: async (recommendationId: string, page = 1, limit = 20) => {
    const response = await api.get(
      `/api/recommendations/${recommendationId}/reviews`,
      { params: { page, limit } }
    );
    return response.data;
  },

  // Obtener mi review
  getMine: async (recommendationId: string) => {
    const response = await api.get(
      `/api/recommendations/${recommendationId}/reviews/my-review`
    );
    return response.data;
  },

  // Eliminar mi review
  deleteMine: async (recommendationId: string) => {
    const response = await api.delete(
      `/api/recommendations/${recommendationId}/reviews/my-review`
    );
    return response.data;
  },

  // Toggle "útil"
  toggleHelpful: async (recommendationId: string, reviewId: string) => {
    const response = await api.post(
      `/api/recommendations/${recommendationId}/reviews/${reviewId}/helpful`
    );
    return response.data;
  },

  // Verificar si marqué como útil
  checkHelpful: async (recommendationId: string, reviewId: string) => {
    const response = await api.get(
      `/api/recommendations/${recommendationId}/reviews/${reviewId}/helpful`
    );
    return response.data;
  },
};
```

---

### Componente de Review Card:

```tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { reviewService } from '../services/reviewService';

const ReviewCard = ({ review, recommendationId, onHelpfulToggle }) => {
  const [isHelpful, setIsHelpful] = useState(review.isHelpfulByMe);
  const [helpfulCount, setHelpfulCount] = useState(review.helpfulCount);
  const [loading, setLoading] = useState(false);

  const handleHelpfulToggle = async () => {
    if (loading) return;

    setLoading(true);
    try {
      const response = await reviewService.toggleHelpful(
        recommendationId,
        review.id
      );
      
      setIsHelpful(response.isHelpful);
      setHelpfulCount(response.helpfulCount);
      onHelpfulToggle?.(review.id, response.isHelpful);
    } catch (error) {
      console.error('Error toggling helpful:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <View style={styles.stars}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Icon
            key={star}
            name="star"
            size={16}
            color={star <= rating ? '#FFD700' : '#DDD'}
          />
        ))}
      </View>
    );
  };

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <Image
          source={{ uri: review.userAvatar || 'https://via.placeholder.com/40' }}
          style={styles.avatar}
        />
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{review.userName}</Text>
          {renderStars(review.rating)}
        </View>
        <Text style={styles.date}>
          {new Date(review.createdAt).toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
          })}
        </Text>
      </View>

      {/* Tags */}
      <View style={styles.tags}>
        {review.childAge && (
          <View style={[styles.tag, styles.tagBlue]}>
            <Icon name="child-care" size={14} color="#2196F3" />
            <Text style={styles.tagText}>{review.childAge}</Text>
          </View>
        )}
        {review.visitedWith && (
          <View style={[styles.tag, styles.tagPurple]}>
            <Icon name="people" size={14} color="#9C27B0" />
            <Text style={styles.tagText}>{review.visitedWith}</Text>
          </View>
        )}
      </View>

      {/* Comentario */}
      {review.comment && (
        <Text style={styles.comment}>{review.comment}</Text>
      )}

      {/* Fotos */}
      {review.photos && review.photos.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.photosContainer}
        >
          {review.photos.map((photo, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => {
                // Abrir en modal de galería
              }}
            >
              <Image source={{ uri: photo }} style={styles.photo} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Botón Útil */}
      <TouchableOpacity
        style={[
          styles.helpfulButton,
          isHelpful && styles.helpfulButtonActive
        ]}
        onPress={handleHelpfulToggle}
        disabled={loading}
      >
        <Icon
          name={isHelpful ? 'thumb-up' : 'thumb-up-outline'}
          size={18}
          color={isHelpful ? '#2196F3' : '#666'}
        />
        <Text
          style={[
            styles.helpfulText,
            isHelpful && styles.helpfulTextActive
          ]}
        >
          Útil ({helpfulCount})
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  stars: {
    flexDirection: 'row',
    gap: 2,
  },
  date: {
    fontSize: 12,
    color: '#999',
  },
  tags: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagBlue: {
    backgroundColor: '#E3F2FD',
  },
  tagPurple: {
    backgroundColor: '#F3E5F5',
  },
  tagText: {
    fontSize: 11,
    fontWeight: '600',
  },
  comment: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 12,
  },
  photosContainer: {
    marginBottom: 12,
  },
  photo: {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginRight: 8,
  },
  helpfulButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f5f5f5',
  },
  helpfulButtonActive: {
    backgroundColor: '#E3F2FD',
  },
  helpfulText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '600',
  },
  helpfulTextActive: {
    color: '#2196F3',
  },
});

export default ReviewCard;
```

---

## ✨ Resumen de Mejoras

### ✅ Implementado:

1. **Fotos en Reviews** (hasta 5 fotos)
   - Subida individual
   - Subida múltiple
   - Almacenamiento en Firebase Storage

2. **Información Contextual**
   - `childAge`: Edad del bebé al visitar
   - `visitedWith`: Con quién visitó el lugar

3. **Sistema "Útil"**
   - Marcar/desmarcar reviews como útiles
   - Contador de "útil"
   - Estado personalizado (isHelpfulByMe)

4. **Endpoints Actualizados**
   - POST reviews con nuevos campos
   - GET reviews con nuevos campos
   - GET my-review con nuevos campos

5. **Endpoint de Migración**
   - Actualiza reviews existentes automáticamente

---

## 🚀 Pasos para Implementar

### 1. Ejecutar Migración (UNA VEZ):

```bash
POST https://tu-api.vercel.app/api/admin/reviews/migrate-fields

Headers:
Authorization: Bearer {admin-token}
```

### 2. Actualizar Frontend:

Ver ejemplos de React Native arriba con:
- `ReviewCard` completo
- `reviewService` con todos los métodos
- Soporte para fotos, tags y botón "útil"

### 3. Probar Flujo Completo:

1. Crear review con fotos
2. Ver review en la lista
3. Marcar como útil
4. Verificar contador

---

## 📝 Notas Importantes

1. **Máximo 5 fotos** por review
2. **Validación de `visitedWith`**: Solo acepta "Solo", "Pareja", "Familia", "Amigos"
3. **Sistema "Útil"**: Toggle automático (si ya marcó, desmarca)
4. **Migración segura**: No sobrescribe datos existentes
5. **Retrocompatibilidad**: Valores por defecto si no existen

¡Sistema completo de reviews listo para usar! 🎉

