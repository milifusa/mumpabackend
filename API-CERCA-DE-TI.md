# 📍 API "Cerca de Ti" - Geolocalización - Munpa

Sistema de geolocalización que encuentra recomendaciones cercanas ordenadas por distancia usando la fórmula de Haversine.

---

## 📱 ENDPOINT PARA LA APP

### Obtener recomendaciones cercanas

**GET** `/api/recommendations/nearby`

Obtiene recomendaciones ordenadas por distancia desde la ubicación del usuario.

**Headers:**
```
Authorization: Bearer {token}
```

**Query Params:**
- `latitude` (requerido): Latitud del usuario (número decimal)
- `longitude` (requerido): Longitud del usuario (número decimal)
- `radius` (opcional, default: 10): Radio de búsqueda en kilómetros
- `categoryId` (opcional): Filtrar por categoría específica
- `limit` (opcional, default: 20): Número máximo de resultados

**Ejemplos:**
```
GET /api/recommendations/nearby?latitude=-12.0464&longitude=-77.0428

GET /api/recommendations/nearby?latitude=-12.0464&longitude=-77.0428&radius=5

GET /api/recommendations/nearby?latitude=-12.0464&longitude=-77.0428&categoryId=cat123&limit=10
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
      "address": "Av. Principal 123, Lima",
      "latitude": -12.0450,
      "longitude": -77.0425,
      "phone": "+51 999 999 999",
      "email": "info@clinica.com",
      "website": "https://clinica.com",
      "imageUrl": "https://...",
      "totalReviews": 25,
      "averageRating": 4.5,
      "distance": 0.3,
      "estimatedTime": "5 min",
      "category": {
        "id": "cat123",
        "name": "Clínicas",
        "icon": "hospital",
        "imageUrl": "https://..."
      }
    },
    {
      "id": "rec456",
      "name": "Tienda de Productos Bebé",
      "description": "Todo para tu bebé",
      "address": "Calle 456, Lima",
      "latitude": -12.0500,
      "longitude": -77.0450,
      "phone": "+51 888 888 888",
      "email": "info@tienda.com",
      "website": "https://tienda.com",
      "imageUrl": "https://...",
      "totalReviews": 12,
      "averageRating": 4.2,
      "distance": 1.8,
      "estimatedTime": "10 min",
      "category": {
        "id": "cat456",
        "name": "Tiendas",
        "icon": "store",
        "imageUrl": "https://..."
      }
    }
  ],
  "metadata": {
    "userLocation": {
      "latitude": -12.0464,
      "longitude": -77.0428
    },
    "radius": 10,
    "found": 2
  }
}
```

---

## 📊 Campos Específicos de Geolocalización

### `distance` (number)
- Distancia en kilómetros desde la ubicación del usuario
- Redondeado a 1 decimal
- Ejemplo: `0.3`, `1.8`, `5.2`

### `estimatedTime` (string)
- Tiempo estimado de viaje (calculado a 40 km/h promedio en ciudad)
- Formatos:
  - `"menos de 1 min"` - Para distancias muy cortas
  - `"5 min"` - Para menos de 1 hora
  - `"1 hora"` - Para exactamente 1 hora
  - `"2 horas"` - Para múltiples horas
  - `"1 h 30 min"` - Para horas con minutos

---

## 🧮 Cálculo de Distancia

Se utiliza la **fórmula de Haversine** que calcula la distancia entre dos puntos en una esfera (la Tierra):

```javascript
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radio de la Tierra en km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
}
```

Esta fórmula considera la curvatura de la Tierra y proporciona resultados precisos.

---

## 🎨 Ejemplo de Uso en React Native

### Service:

```typescript
// services/recommendationService.ts

export const recommendationService = {
  // ... métodos existentes ...

  getNearby: async (latitude: number, longitude: number, options?: {
    radius?: number;
    categoryId?: string;
    limit?: number;
  }) => {
    const params: any = { latitude, longitude };
    if (options?.radius) params.radius = options.radius;
    if (options?.categoryId) params.categoryId = options.categoryId;
    if (options?.limit) params.limit = options.limit;

    const response = await api.get('/api/recommendations/nearby', { params });
    return response.data;
  }
};
```

### Hook para obtener ubicación:

```typescript
// hooks/useLocation.ts
import { useState, useEffect } from 'react';
import * as Location from 'expo-location';

export const useLocation = () => {
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getLocation();
  }, []);

  const getLocation = async () => {
    try {
      setLoading(true);
      
      // Pedir permiso
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Permiso de ubicación denegado');
        setLoading(false);
        return;
      }

      // Obtener ubicación actual
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setLocation({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });
      setError(null);
    } catch (err) {
      setError('Error obteniendo ubicación');
      console.error('Error getting location:', err);
    } finally {
      setLoading(false);
    }
  };

  return { location, loading, error, refresh: getLocation };
};
```

### Pantalla completa "Cerca de Ti":

```tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import MapView, { Marker, Circle } from 'react-native-maps';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useLocation } from '../hooks/useLocation';
import { recommendationService } from '../services/recommendationService';

const NearbyScreen = ({ navigation }) => {
  const { location, loading: locationLoading, error: locationError, refresh: refreshLocation } = useLocation();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [radius, setRadius] = useState(10); // km
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showMap, setShowMap] = useState(true);

  useEffect(() => {
    if (location) {
      loadNearbyRecommendations();
    }
  }, [location, radius, selectedCategory]);

  const loadNearbyRecommendations = async () => {
    if (!location) return;

    setLoading(true);
    try {
      const response = await recommendationService.getNearby(
        location.latitude,
        location.longitude,
        {
          radius,
          categoryId: selectedCategory,
          limit: 50
        }
      );
      setRecommendations(response.data);
    } catch (error) {
      console.error('Error loading nearby recommendations:', error);
      Alert.alert('Error', 'No se pudieron cargar las recomendaciones cercanas');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    await refreshLocation();
    if (location) {
      await loadNearbyRecommendations();
    }
  };

  const renderRecommendation = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('RecommendationDetail', { id: item.id })}
    >
      <View style={styles.cardContent}>
        {/* Icono de categoría */}
        <View style={styles.iconContainer}>
          <Icon
            name={item.category?.icon || 'place'}
            size={32}
            color="#2196F3"
          />
        </View>

        {/* Información */}
        <View style={styles.info}>
          <Text style={styles.name}>{item.name}</Text>
          
          {/* Categoría */}
          {item.category && (
            <Text style={styles.category}>{item.category.name}</Text>
          )}

          {/* Dirección */}
          <Text style={styles.address} numberOfLines={1}>
            {item.address}
          </Text>

          {/* Rating */}
          {item.totalReviews > 0 && (
            <View style={styles.rating}>
              <Icon name="star" size={14} color="#FFD700" />
              <Text style={styles.ratingText}>
                {item.averageRating.toFixed(1)} ({item.totalReviews})
              </Text>
            </View>
          )}
        </View>

        {/* Distancia y tiempo */}
        <View style={styles.distanceContainer}>
          <View style={styles.distanceBadge}>
            <Icon name="directions-walk" size={16} color="#4CAF50" />
            <Text style={styles.distanceText}>{item.distance} km</Text>
          </View>
          <Text style={styles.timeText}>{item.estimatedTime}</Text>
          
          {/* Botón de navegación */}
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => openMaps(item.latitude, item.longitude)}
          >
            <Icon name="directions" size={20} color="#2196F3" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  const openMaps = (latitude: number, longitude: number) => {
    const url = Platform.select({
      ios: `maps:0,0?q=${latitude},${longitude}`,
      android: `geo:0,0?q=${latitude},${longitude}`,
    });
    Linking.openURL(url);
  };

  if (locationLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Obteniendo tu ubicación...</Text>
      </View>
    );
  }

  if (locationError || !location) {
    return (
      <View style={styles.centerContainer}>
        <Icon name="location-off" size={64} color="#ccc" />
        <Text style={styles.errorText}>{locationError || 'No se pudo obtener tu ubicación'}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={refreshLocation}>
          <Text style={styles.retryButtonText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header con controles */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Cerca de Ti</Text>
        <Text style={styles.headerSubtitle}>
          {recommendations.length} lugares dentro de {radius} km
        </Text>

        {/* Toggle Vista */}
        <View style={styles.viewToggle}>
          <TouchableOpacity
            style={[styles.toggleButton, showMap && styles.toggleButtonActive]}
            onPress={() => setShowMap(true)}
          >
            <Icon name="map" size={20} color={showMap ? '#fff' : '#666'} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleButton, !showMap && styles.toggleButtonActive]}
            onPress={() => setShowMap(false)}
          >
            <Icon name="list" size={20} color={!showMap ? '#fff' : '#666'} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Slider de radio */}
      <View style={styles.radiusControl}>
        <Text style={styles.radiusLabel}>Radio: {radius} km</Text>
        <Slider
          style={styles.slider}
          minimumValue={1}
          maximumValue={50}
          step={1}
          value={radius}
          onValueChange={setRadius}
          minimumTrackTintColor="#2196F3"
          maximumTrackTintColor="#ddd"
        />
      </View>

      {/* Mapa o Lista */}
      {showMap ? (
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: location.latitude,
            longitude: location.longitude,
            latitudeDelta: radius / 111, // Aproximación
            longitudeDelta: radius / 111,
          }}
          showsUserLocation
          showsMyLocationButton
        >
          {/* Círculo de radio */}
          <Circle
            center={{
              latitude: location.latitude,
              longitude: location.longitude,
            }}
            radius={radius * 1000} // Convertir a metros
            strokeColor="rgba(33, 150, 243, 0.5)"
            fillColor="rgba(33, 150, 243, 0.1)"
          />

          {/* Marcadores de recomendaciones */}
          {recommendations.map((item) => (
            <Marker
              key={item.id}
              coordinate={{
                latitude: item.latitude,
                longitude: item.longitude,
              }}
              title={item.name}
              description={`${item.distance} km - ${item.estimatedTime}`}
              onCalloutPress={() => navigation.navigate('RecommendationDetail', { id: item.id })}
            >
              <View style={styles.markerContainer}>
                <Icon name={item.category?.icon || 'place'} size={24} color="#2196F3" />
              </View>
            </Marker>
          ))}
        </MapView>
      ) : (
        <FlatList
          data={recommendations}
          renderItem={renderRecommendation}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="location-searching" size={64} color="#ccc" />
              <Text style={styles.emptyText}>
                No hay recomendaciones cerca de ti
              </Text>
              <Text style={styles.emptySubtext}>
                Intenta aumentar el radio de búsqueda
              </Text>
            </View>
          }
        />
      )}
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
    padding: 20,
  },
  header: {
    padding: 16,
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
    marginBottom: 12,
  },
  viewToggle: {
    flexDirection: 'row',
    gap: 8,
  },
  toggleButton: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: '#2196F3',
  },
  radiusControl: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  radiusLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  map: {
    flex: 1,
  },
  markerContainer: {
    backgroundColor: '#fff',
    padding: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#2196F3',
  },
  listContent: {
    padding: 16,
  },
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
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  category: {
    fontSize: 12,
    color: '#2196F3',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  address: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    color: '#666',
  },
  distanceContainer: {
    alignItems: 'flex-end',
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  distanceText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  timeText: {
    fontSize: 11,
    color: '#999',
    marginBottom: 8,
  },
  navButton: {
    padding: 8,
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#2196F3',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
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

export default NearbyScreen;
```

---

## ✨ Características

✅ **Cálculo preciso de distancia** con fórmula de Haversine  
✅ **Ordenamiento automático** por distancia (más cercano primero)  
✅ **Filtro por radio** configurable (default 10 km)  
✅ **Filtro por categoría** opcional  
✅ **Tiempo estimado** calculado automáticamente  
✅ **Solo recomendaciones con coordenadas** válidas  
✅ **Metadata incluida** (ubicación del usuario, radio, cantidad)  

---

## 📝 Notas Importantes

1. **Permisos de ubicación**: La app debe solicitar permisos de ubicación antes de llamar al endpoint.

2. **Coordenadas requeridas**: Solo se incluyen recomendaciones que tienen `latitude` y `longitude` válidos.

3. **Radio máximo**: Por defecto 10 km, pero configurable hasta 50 km o más.

4. **Velocidad promedio**: El tiempo estimado asume 40 km/h (tráfico urbano promedio).

5. **Precisión**: La fórmula de Haversine proporciona resultados precisos para distancias cortas y medias.

---

## 🎯 Casos de Uso

- **Pantalla "Cerca de Ti"**: Lista de lugares ordenados por distancia
- **Mapa interactivo**: Mostrar marcadores con círculo de radio
- **Búsqueda rápida**: "Encuentra clínicas cerca de mí"
- **Filtros por categoría**: "Tiendas de bebé a menos de 5 km"
- **Navegación**: Botón para abrir en Google Maps/Apple Maps

