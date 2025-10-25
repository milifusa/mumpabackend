# ⭐ API de Reviews para Recomendados - Munpa

Sistema completo de calificaciones (estrellas) y comentarios para recomendados. Los usuarios pueden calificar lugares/negocios y ver las opiniones de otros usuarios.

---

## 📱 ENDPOINTS PARA LA APP

### 1. Obtener todas las reviews de un recomendado

**GET** `/api/recommendations/:recommendationId/reviews`

Obtiene todas las reviews de un recomendado específico con estadísticas.

**Headers:**
```
Authorization: Bearer {token}
```

**Query Params:**
- `page` (opcional, default: 1): Número de página
- `limit` (opcional, default: 20): Reviews por página

**Ejemplo:**
```
GET /api/recommendations/rec123/reviews?page=1&limit=10
```

**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "id": "review123",
      "rating": 5,
      "comment": "Excelente atención, muy recomendable",
      "user": {
        "id": "user123",
        "displayName": "María García",
        "photoURL": "https://..."
      },
      "createdAt": "2025-01-20T10:30:00.000Z",
      "updatedAt": "2025-01-20T10:30:00.000Z"
    },
    {
      "id": "review456",
      "rating": 4,
      "comment": "Buen servicio",
      "user": {
        "id": "user456",
        "displayName": "Juan Pérez",
        "photoURL": "https://..."
      },
      "createdAt": "2025-01-19T15:20:00.000Z",
      "updatedAt": "2025-01-19T15:20:00.000Z"
    }
  ],
  "stats": {
    "totalReviews": 25,
    "averageRating": 4.5
  },
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

### 2. Crear o actualizar mi review

**POST** `/api/recommendations/:recommendationId/reviews`

Crea una nueva review o actualiza la existente del usuario actual.

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Body:**
```json
{
  "rating": 5,
  "comment": "Excelente atención, muy recomendable. El personal es muy amable y profesional."
}
```

**Campos:**
- `rating` (requerido): Calificación de 1 a 5 estrellas (número entero)
- `comment` (opcional): Comentario de la review

**Respuesta:**
```json
{
  "success": true,
  "message": "Review creada exitosamente",
  "data": {
    "id": "review123",
    "rating": 5,
    "comment": "Excelente atención, muy recomendable. El personal es muy amable y profesional.",
    "user": {
      "id": "user123",
      "displayName": "María García",
      "photoURL": "https://..."
    },
    "createdAt": "2025-01-20T10:30:00.000Z",
    "updatedAt": "2025-01-20T10:30:00.000Z"
  }
}
```

**Notas importantes:**
- Si el usuario ya tiene una review para este recomendado, se actualiza automáticamente
- Solo se permite una review por usuario por recomendado
- Las estadísticas del recomendado se actualizan automáticamente

### 3. Obtener mi review para un recomendado

**GET** `/api/recommendations/:recommendationId/reviews/my-review`

Obtiene la review del usuario actual para un recomendado específico (si existe).

**Headers:**
```
Authorization: Bearer {token}
```

**Respuesta (si existe):**
```json
{
  "success": true,
  "data": {
    "id": "review123",
    "rating": 5,
    "comment": "Excelente atención",
    "createdAt": "2025-01-20T10:30:00.000Z",
    "updatedAt": "2025-01-20T10:30:00.000Z"
  }
}
```

**Respuesta (si no existe):**
```json
{
  "success": true,
  "data": null
}
```

### 4. Eliminar mi review

**DELETE** `/api/recommendations/:recommendationId/reviews/my-review`

Elimina la review propia del usuario actual.

**Headers:**
```
Authorization: Bearer {token}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Review eliminada exitosamente"
}
```

---

## 🔐 ENDPOINTS ADMIN

### 1. Obtener todas las reviews de un recomendado (Admin)

**GET** `/api/admin/recommendations/:recommendationId/reviews`

Similar al endpoint de la app pero incluye el email del usuario.

**Headers:**
```
Authorization: Bearer {admin-jwt-token}
```

**Query Params:**
- `page` (opcional, default: 1)
- `limit` (opcional, default: 50)

**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "id": "review123",
      "recommendationId": "rec123",
      "rating": 5,
      "comment": "Excelente atención",
      "user": {
        "id": "user123",
        "displayName": "María García",
        "email": "maria@ejemplo.com",
        "photoURL": "https://..."
      },
      "createdAt": "2025-01-20T10:30:00.000Z",
      "updatedAt": "2025-01-20T10:30:00.000Z"
    }
  ],
  "stats": {
    "totalReviews": 25,
    "averageRating": 4.5
  },
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 25,
    "totalPages": 1
  }
}
```

### 2. Eliminar una review (Admin)

**DELETE** `/api/admin/recommendations/:recommendationId/reviews/:reviewId`

Elimina cualquier review (moderación).

**Headers:**
```
Authorization: Bearer {admin-jwt-token}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Review eliminada exitosamente"
}
```

---

## 📊 Estructura de Datos en Firestore

### Colección: `recommendationReviews`

**Documento:**
```json
{
  "recommendationId": "rec123",
  "userId": "user123",
  "rating": 5,
  "comment": "Excelente atención, muy recomendable",
  "createdAt": Timestamp,
  "updatedAt": Timestamp
}
```

### Actualización en `recommendations`

Los documentos de recomendados ahora incluyen:
```json
{
  // ... campos existentes ...
  "totalReviews": 25,
  "averageRating": 4.5
}
```

**Índices requeridos en Firestore:**
- `recommendationId` (Ascending) - Para buscar reviews por recomendado
- `recommendationId` (Ascending) + `userId` (Ascending) - Para buscar la review de un usuario específico

---

## 🎨 Ejemplo de Uso en React Native

### Componente de calificación con estrellas:

```tsx
import React, { useState } from 'react';
import { View, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const StarRating = ({ rating, onRatingChange, editable = false }) => {
  return (
    <View style={styles.starsContainer}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity
          key={star}
          onPress={() => editable && onRatingChange(star)}
          disabled={!editable}
        >
          <Icon
            name={star <= rating ? 'star' : 'star-border'}
            size={30}
            color="#FFD700"
          />
        </TouchableOpacity>
      ))}
    </View>
  );
};
```

### Pantalla de reviews completa:

```tsx
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, Alert } from 'react-native';
import { recommendationService } from '../services/recommendationService';

const RecommendationReviewsScreen = ({ route }) => {
  const { recommendationId } = route.params;
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({ totalReviews: 0, averageRating: 0 });
  const [myReview, setMyReview] = useState(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadReviews();
    loadMyReview();
  }, []);

  const loadReviews = async () => {
    try {
      const response = await recommendationService.getReviews(recommendationId);
      setReviews(response.data);
      setStats(response.stats);
    } catch (error) {
      console.error('Error cargando reviews:', error);
    }
  };

  const loadMyReview = async () => {
    try {
      const response = await recommendationService.getMyReview(recommendationId);
      if (response.data) {
        setMyReview(response.data);
        setRating(response.data.rating);
        setComment(response.data.comment || '');
      }
    } catch (error) {
      console.error('Error cargando mi review:', error);
    }
  };

  const submitReview = async () => {
    if (rating === 0) {
      Alert.alert('Error', 'Por favor selecciona una calificación');
      return;
    }

    setLoading(true);
    try {
      await recommendationService.createOrUpdateReview(recommendationId, {
        rating,
        comment
      });
      
      Alert.alert('Éxito', myReview ? 'Review actualizada' : 'Review creada');
      
      // Recargar reviews
      loadReviews();
      loadMyReview();
    } catch (error) {
      Alert.alert('Error', 'No se pudo guardar la review');
    } finally {
      setLoading(false);
    }
  };

  const deleteMyReview = async () => {
    Alert.alert(
      'Confirmar',
      '¿Estás seguro de eliminar tu review?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await recommendationService.deleteMyReview(recommendationId);
              setMyReview(null);
              setRating(0);
              setComment('');
              loadReviews();
              Alert.alert('Éxito', 'Review eliminada');
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar la review');
            }
          }
        }
      ]
    );
  };

  const renderReview = ({ item }) => (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        {item.user?.photoURL && (
          <Image source={{ uri: item.user.photoURL }} style={styles.avatar} />
        )}
        <View style={styles.reviewInfo}>
          <Text style={styles.userName}>{item.user?.displayName || 'Usuario'}</Text>
          <StarRating rating={item.rating} editable={false} />
          <Text style={styles.reviewDate}>
            {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>
      </View>
      {item.comment && (
        <Text style={styles.reviewComment}>{item.comment}</Text>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Estadísticas */}
      <View style={styles.statsCard}>
        <Text style={styles.statsTitle}>Calificación General</Text>
        <View style={styles.statsRow}>
          <Text style={styles.averageRating}>{stats.averageRating.toFixed(1)}</Text>
          <StarRating rating={Math.round(stats.averageRating)} editable={false} />
        </View>
        <Text style={styles.totalReviews}>
          {stats.totalReviews} {stats.totalReviews === 1 ? 'reseña' : 'reseñas'}
        </Text>
      </View>

      {/* Mi review o formulario */}
      <View style={styles.myReviewCard}>
        <Text style={styles.cardTitle}>
          {myReview ? 'Tu Reseña' : 'Califica este lugar'}
        </Text>
        
        <StarRating
          rating={rating}
          onRatingChange={setRating}
          editable={true}
        />
        
        <TextInput
          style={styles.commentInput}
          placeholder="Escribe tu opinión (opcional)"
          multiline
          numberOfLines={4}
          value={comment}
          onChangeText={setComment}
        />
        
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.submitButton}
            onPress={submitReview}
            disabled={loading}
          >
            <Text style={styles.submitButtonText}>
              {myReview ? 'Actualizar' : 'Publicar'}
            </Text>
          </TouchableOpacity>
          
          {myReview && (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={deleteMyReview}
            >
              <Text style={styles.deleteButtonText}>Eliminar</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Lista de reviews */}
      <Text style={styles.sectionTitle}>Todas las Reseñas</Text>
      <FlatList
        data={reviews}
        renderItem={renderReview}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            Aún no hay reseñas. ¡Sé el primero en opinar!
          </Text>
        }
      />
    </View>
  );
};

export default RecommendationReviewsScreen;
```

### Service para reviews:

```typescript
// services/recommendationService.ts

export const recommendationService = {
  // ... métodos existentes ...

  getReviews: async (recommendationId: string, page = 1, limit = 20) => {
    const response = await api.get(
      `/api/recommendations/${recommendationId}/reviews`,
      { params: { page, limit } }
    );
    return response.data;
  },

  getMyReview: async (recommendationId: string) => {
    const response = await api.get(
      `/api/recommendations/${recommendationId}/reviews/my-review`
    );
    return response.data;
  },

  createOrUpdateReview: async (
    recommendationId: string,
    data: { rating: number; comment?: string }
  ) => {
    const response = await api.post(
      `/api/recommendations/${recommendationId}/reviews`,
      data
    );
    return response.data;
  },

  deleteMyReview: async (recommendationId: string) => {
    const response = await api.delete(
      `/api/recommendations/${recommendationId}/reviews/my-review`
    );
    return response.data;
  }
};
```

### Mostrar rating en la lista de recomendados:

```tsx
const RecommendationCard = ({ recommendation }) => (
  <View style={styles.card}>
    <Image source={{ uri: recommendation.imageUrl }} style={styles.image} />
    
    <View style={styles.content}>
      <Text style={styles.name}>{recommendation.name}</Text>
      
      {/* Rating */}
      {recommendation.totalReviews > 0 && (
        <View style={styles.ratingRow}>
          <Icon name="star" size={16} color="#FFD700" />
          <Text style={styles.rating}>
            {recommendation.averageRating.toFixed(1)}
          </Text>
          <Text style={styles.reviewCount}>
            ({recommendation.totalReviews} {recommendation.totalReviews === 1 ? 'reseña' : 'reseñas'})
          </Text>
        </View>
      )}
      
      <Text style={styles.description}>{recommendation.description}</Text>
    </View>
  </View>
);
```

---

## 💻 Ejemplo en Angular (Dashboard Admin)

```typescript
// services/admin-recommendation.service.ts

@Injectable({
  providedIn: 'root'
})
export class AdminRecommendationService {
  // ... métodos existentes ...

  getReviews(recommendationId: string, page = 1, limit = 50): Observable<any> {
    return this.http.get(
      `/api/admin/recommendations/${recommendationId}/reviews`,
      { params: { page, limit } }
    );
  }

  deleteReview(recommendationId: string, reviewId: string): Observable<any> {
    return this.http.delete(
      `/api/admin/recommendations/${recommendationId}/reviews/${reviewId}`
    );
  }
}
```

**Componente de moderación:**
```typescript
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AdminRecommendationService } from '../services/admin-recommendation.service';

@Component({
  selector: 'app-recommendation-reviews',
  templateUrl: './recommendation-reviews.component.html'
})
export class RecommendationReviewsComponent implements OnInit {
  recommendationId: string;
  reviews: any[] = [];
  stats: any = { totalReviews: 0, averageRating: 0 };
  loading = true;

  constructor(
    private route: ActivatedRoute,
    private recommendationService: AdminRecommendationService
  ) {}

  ngOnInit() {
    this.recommendationId = this.route.snapshot.paramMap.get('id')!;
    this.loadReviews();
  }

  loadReviews() {
    this.loading = true;
    this.recommendationService.getReviews(this.recommendationId).subscribe({
      next: (response) => {
        this.reviews = response.data;
        this.stats = response.stats;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error cargando reviews:', error);
        this.loading = false;
      }
    });
  }

  deleteReview(reviewId: string) {
    if (confirm('¿Estás seguro de eliminar esta review?')) {
      this.recommendationService.deleteReview(this.recommendationId, reviewId).subscribe({
        next: () => {
          alert('✅ Review eliminada');
          this.loadReviews();
        },
        error: (error) => {
          alert(`❌ Error: ${error.error.message}`);
        }
      });
    }
  }
}
```

---

## ✨ Características

✅ **Sistema de estrellas** (1-5)  
✅ **Comentarios opcionales**  
✅ **Una review por usuario** (actualizable)  
✅ **Estadísticas automáticas** (total y promedio)  
✅ **Ordenamiento por fecha** (más recientes primero)  
✅ **Paginación** para listas grandes  
✅ **Información del autor** con foto y nombre  
✅ **Moderación admin** (eliminar reviews inapropiadas)  
✅ **Actualización automática** de estadísticas del recomendado  

---

## 📝 Notas Importantes

1. **Una review por usuario:** Cada usuario solo puede tener una review por recomendado. Si intenta crear otra, la existente se actualiza automáticamente.

2. **Estadísticas automáticas:** Cuando se crea, actualiza o elimina una review, las estadísticas del recomendado (`totalReviews` y `averageRating`) se recalculan automáticamente.

3. **Validación de rating:** El rating debe ser un número entero entre 1 y 5.

4. **Comentario opcional:** Los usuarios pueden calificar sin comentario, solo con estrellas.

5. **Índices de Firestore:** Necesitas crear estos índices:
   - `recommendationId` (Ascending)
   - `recommendationId` (Ascending) + `userId` (Ascending)

6. **Ordenamiento:** Las reviews se muestran de más reciente a más antigua por defecto.

7. **Privacidad:** En la app, solo se muestra el nombre y foto del usuario. En el admin dashboard también se incluye el email para moderación.

---

## 🎯 Casos de Uso

- **Usuario nuevo:** Puede ver todas las reviews y estadísticas antes de decidir
- **Usuario satisfecho:** Puede dejar una review positiva con estrellas y comentario
- **Usuario insatisfecho:** Puede expresar su experiencia para ayudar a otros
- **Cambio de opinión:** Puede actualizar su review en cualquier momento
- **Moderación:** Los admins pueden eliminar reviews inapropiadas
- **Decisión informada:** Los usuarios pueden ver el promedio y leer experiencias reales

