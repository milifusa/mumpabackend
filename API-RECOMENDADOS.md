# ⭐ API de Recomendados - Munpa

Sistema completo de lugares/negocios recomendados vinculados a categorías. Incluye información de ubicación, contacto, redes sociales y más.

---

## 📱 ENDPOINTS PARA LA APP (Solo Lectura)

### 1. Obtener todos los recomendados activos

**GET** `/api/recommendations`

Obtiene todos los recomendados activos. Opcionalmente filtra por categoría.

**Headers:**
```
Authorization: Bearer {token}
```

**Query Params:**
- `categoryId` (opcional): Filtrar por categoría específica

**Ejemplo:**
```
GET /api/recommendations
GET /api/recommendations?categoryId=cat123
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
      "latitude": -12.0464,
      "longitude": -77.0428,
      "phone": "+51 999 999 999",
      "email": "info@clinica.com",
      "website": "https://clinica.com",
      "facebook": "https://facebook.com/clinica",
      "instagram": "https://instagram.com/clinica",
      "twitter": "https://twitter.com/clinica",
      "whatsapp": "+51999999999",
      "imageUrl": "https://...",
      "category": {
        "id": "cat123",
        "name": "Clínicas",
        "icon": "hospital"
      }
    }
  ]
}
```

### 2. Obtener un recomendado específico

**GET** `/api/recommendations/:recommendationId`

Obtiene los detalles completos de un recomendado.

**Headers:**
```
Authorization: Bearer {token}
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "id": "rec123",
    "name": "Clínica Maternal Santa María",
    "description": "Atención especializada en embarazo y parto",
    "address": "Av. Principal 123, Ciudad",
    "latitude": -12.0464,
    "longitude": -77.0428,
    "phone": "+51 999 999 999",
    "email": "info@clinica.com",
    "website": "https://clinica.com",
    "facebook": "https://facebook.com/clinica",
    "instagram": "https://instagram.com/clinica",
    "twitter": "https://twitter.com/clinica",
    "whatsapp": "+51999999999",
    "imageUrl": "https://...",
    "category": {
      "id": "cat123",
      "name": "Clínicas",
      "icon": "hospital",
      "imageUrl": "https://..."
    }
  }
}
```

---

## 🔐 ENDPOINTS ADMIN (CRUD Completo)

### 1. Obtener todos los recomendados (Admin)

**GET** `/api/admin/recommendations`

**Headers:**
```
Authorization: Bearer {admin-jwt-token}
```

**Query Params:**
- `page` (opcional, default: 1): Número de página
- `limit` (opcional, default: 20): Elementos por página
- `search` (opcional): Buscar por nombre, descripción o dirección
- `categoryId` (opcional): Filtrar por categoría

**Ejemplo:**
```
GET /api/admin/recommendations?page=1&limit=10&search=clinica
GET /api/admin/recommendations?categoryId=cat123
```

**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "id": "rec123",
      "categoryId": "cat123",
      "name": "Clínica Maternal Santa María",
      "description": "Atención especializada",
      "address": "Av. Principal 123",
      "latitude": -12.0464,
      "longitude": -77.0428,
      "phone": "+51 999 999 999",
      "email": "info@clinica.com",
      "website": "https://clinica.com",
      "facebook": "https://facebook.com/clinica",
      "instagram": "https://instagram.com/clinica",
      "twitter": "https://twitter.com/clinica",
      "whatsapp": "+51999999999",
      "imageUrl": "https://...",
      "isActive": true,
      "category": {
        "id": "cat123",
        "name": "Clínicas"
      },
      "createdAt": "2025-01-20T...",
      "updatedAt": "2025-01-20T..."
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

### 2. Obtener un recomendado específico (Admin)

**GET** `/api/admin/recommendations/:recommendationId`

**Headers:**
```
Authorization: Bearer {admin-jwt-token}
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "id": "rec123",
    "categoryId": "cat123",
    "name": "Clínica Maternal Santa María",
    "description": "Atención especializada",
    "address": "Av. Principal 123",
    "latitude": -12.0464,
    "longitude": -77.0428,
    "phone": "+51 999 999 999",
    "email": "info@clinica.com",
    "website": "https://clinica.com",
    "facebook": "https://facebook.com/clinica",
    "instagram": "https://instagram.com/clinica",
    "twitter": "https://twitter.com/clinica",
    "whatsapp": "+51999999999",
    "imageUrl": "https://...",
    "isActive": true,
    "category": {
      "id": "cat123",
      "name": "Clínicas",
      "imageUrl": "https://..."
    },
    "createdAt": "2025-01-20T...",
    "updatedAt": "2025-01-20T..."
  }
}
```

### 3. Crear nuevo recomendado (Admin)

**POST** `/api/admin/recommendations`

**Headers:**
```
Authorization: Bearer {admin-jwt-token}
Content-Type: application/json
```

**Body:**
```json
{
  "categoryId": "cat123",
  "name": "Clínica Maternal Santa María",
  "description": "Atención especializada en embarazo y parto",
  "address": "Av. Principal 123, Ciudad",
  "latitude": -12.0464,
  "longitude": -77.0428,
  "phone": "+51 999 999 999",
  "email": "info@clinica.com",
  "website": "https://clinica.com",
  "facebook": "https://facebook.com/clinica",
  "instagram": "https://instagram.com/clinica",
  "twitter": "https://twitter.com/clinica",
  "whatsapp": "+51999999999",
  "imageUrl": "https://storage.googleapis.com/.../imagen.jpg",
  "isActive": true
}
```

**Campos:**
- `categoryId` (requerido): ID de la categoría
- `name` (requerido): Nombre del lugar/negocio
- `description` (opcional): Descripción detallada
- `address` (opcional): Dirección completa
- `latitude` (opcional): Latitud (número decimal)
- `longitude` (opcional): Longitud (número decimal)
- `phone` (opcional): Teléfono de contacto
- `email` (opcional): Email de contacto
- `website` (opcional): URL del sitio web
- `facebook` (opcional): URL de Facebook
- `instagram` (opcional): URL de Instagram
- `twitter` (opcional): URL de Twitter
- `whatsapp` (opcional): Número de WhatsApp
- `imageUrl` (opcional): URL de la imagen
- `isActive` (opcional, default: true): Si está activo

**Respuesta:**
```json
{
  "success": true,
  "message": "Recomendado creado exitosamente",
  "data": {
    "id": "rec123",
    "categoryId": "cat123",
    "name": "Clínica Maternal Santa María",
    ...
  }
}
```

### 4. Actualizar recomendado (Admin)

**PUT** `/api/admin/recommendations/:recommendationId`

**Headers:**
```
Authorization: Bearer {admin-jwt-token}
Content-Type: application/json
```

**Body:**
```json
{
  "name": "Clínica Maternal Santa María - Actualizado",
  "description": "Nueva descripción",
  "phone": "+51 999 888 777",
  "isActive": true
}
```

**Nota:** Todos los campos son opcionales. Solo se actualizarán los campos enviados.

**Respuesta:**
```json
{
  "success": true,
  "message": "Recomendado actualizado exitosamente",
  "data": {
    "id": "rec123",
    ...
  }
}
```

### 5. Eliminar recomendado (Admin)

**DELETE** `/api/admin/recommendations/:recommendationId`

**Headers:**
```
Authorization: Bearer {admin-jwt-token}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Recomendado eliminado exitosamente"
}
```

---

## 📊 Estructura de Datos en Firestore

**Colección:** `recommendations`

**Documento:**
```json
{
  "categoryId": "cat123",
  "name": "Clínica Maternal Santa María",
  "description": "Atención especializada en embarazo y parto",
  "address": "Av. Principal 123, Ciudad",
  "latitude": -12.0464,
  "longitude": -77.0428,
  "phone": "+51 999 999 999",
  "email": "info@clinica.com",
  "website": "https://clinica.com",
  "facebook": "https://facebook.com/clinica",
  "instagram": "https://instagram.com/clinica",
  "twitter": "https://twitter.com/clinica",
  "whatsapp": "+51999999999",
  "imageUrl": "https://...",
  "isActive": true,
  "createdAt": Timestamp,
  "updatedAt": Timestamp
}
```

**Índices requeridos en Firestore:**
- `isActive` (Ascending) - Para las consultas de la app
- `categoryId` (Ascending) + `isActive` (Ascending) - Para filtrar por categoría

---

## 🎨 Ejemplo de Uso en React Native

```typescript
// services/recommendationService.ts
import api from './api';

export const recommendationService = {
  // Obtener todos los recomendados (APP)
  getRecommendations: async (categoryId?: string) => {
    const params = categoryId ? { categoryId } : {};
    const response = await api.get('/api/recommendations', { params });
    return response.data;
  },

  // Obtener un recomendado específico (APP)
  getRecommendation: async (recommendationId: string) => {
    const response = await api.get(`/api/recommendations/${recommendationId}`);
    return response.data;
  }
};
```

**Componente de lista:**
```tsx
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, Linking } from 'react-native';
import { recommendationService } from '../services/recommendationService';
import Icon from 'react-native-vector-icons/MaterialIcons';

const RecommendationsScreen = ({ route, navigation }) => {
  const { categoryId } = route.params;
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecommendations();
  }, []);

  const loadRecommendations = async () => {
    try {
      const response = await recommendationService.getRecommendations(categoryId);
      setRecommendations(response.data);
    } catch (error) {
      console.error('Error cargando recomendados:', error);
    } finally {
      setLoading(false);
    }
  };

  const openLocation = (latitude, longitude) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
    Linking.openURL(url);
  };

  const openPhone = (phone) => {
    Linking.openURL(`tel:${phone}`);
  };

  const openWhatsApp = (whatsapp) => {
    Linking.openURL(`whatsapp://send?phone=${whatsapp}`);
  };

  const renderRecommendation = ({ item }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => navigation.navigate('RecommendationDetail', { id: item.id })}
    >
      {item.imageUrl && (
        <Image source={{ uri: item.imageUrl }} style={styles.image} />
      )}
      
      <View style={styles.content}>
        <Text style={styles.name}>{item.name}</Text>
        
        {item.category && (
          <View style={styles.category}>
            <Icon name={item.category.icon} size={16} />
            <Text style={styles.categoryName}>{item.category.name}</Text>
          </View>
        )}
        
        {item.description && (
          <Text style={styles.description} numberOfLines={2}>
            {item.description}
          </Text>
        )}
        
        {item.address && (
          <View style={styles.row}>
            <Icon name="location-on" size={16} />
            <Text style={styles.address}>{item.address}</Text>
          </View>
        )}
        
        <View style={styles.actions}>
          {item.phone && (
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => openPhone(item.phone)}
            >
              <Icon name="phone" size={20} color="#4CAF50" />
            </TouchableOpacity>
          )}
          
          {item.whatsapp && (
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => openWhatsApp(item.whatsapp)}
            >
              <Icon name="chat" size={20} color="#25D366" />
            </TouchableOpacity>
          )}
          
          {item.latitude && item.longitude && (
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => openLocation(item.latitude, item.longitude)}
            >
              <Icon name="map" size={20} color="#2196F3" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return <Text>Cargando recomendados...</Text>;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={recommendations}
        renderItem={renderRecommendation}
        keyExtractor={(item) => item.id}
      />
    </View>
  );
};
```

**Pantalla de detalle con mapa:**
```tsx
import React, { useEffect, useState } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, Linking } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { recommendationService } from '../services/recommendationService';

const RecommendationDetailScreen = ({ route }) => {
  const { id } = route.params;
  const [recommendation, setRecommendation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecommendation();
  }, []);

  const loadRecommendation = async () => {
    try {
      const response = await recommendationService.getRecommendation(id);
      setRecommendation(response.data);
    } catch (error) {
      console.error('Error cargando recomendado:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !recommendation) {
    return <Text>Cargando...</Text>;
  }

  return (
    <ScrollView style={styles.container}>
      {recommendation.imageUrl && (
        <Image 
          source={{ uri: recommendation.imageUrl }} 
          style={styles.headerImage}
        />
      )}
      
      <View style={styles.content}>
        <Text style={styles.title}>{recommendation.name}</Text>
        
        {recommendation.category && (
          <Text style={styles.category}>{recommendation.category.name}</Text>
        )}
        
        {recommendation.description && (
          <Text style={styles.description}>{recommendation.description}</Text>
        )}
        
        {/* Mapa */}
        {recommendation.latitude && recommendation.longitude && (
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: recommendation.latitude,
              longitude: recommendation.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
          >
            <Marker
              coordinate={{
                latitude: recommendation.latitude,
                longitude: recommendation.longitude,
              }}
              title={recommendation.name}
              description={recommendation.address}
            />
          </MapView>
        )}
        
        {/* Información de contacto */}
        <View style={styles.contactSection}>
          <Text style={styles.sectionTitle}>Contacto</Text>
          
          {recommendation.address && (
            <Text style={styles.contactItem}>📍 {recommendation.address}</Text>
          )}
          
          {recommendation.phone && (
            <TouchableOpacity onPress={() => Linking.openURL(`tel:${recommendation.phone}`)}>
              <Text style={styles.contactLink}>📞 {recommendation.phone}</Text>
            </TouchableOpacity>
          )}
          
          {recommendation.email && (
            <TouchableOpacity onPress={() => Linking.openURL(`mailto:${recommendation.email}`)}>
              <Text style={styles.contactLink}>✉️ {recommendation.email}</Text>
            </TouchableOpacity>
          )}
          
          {recommendation.website && (
            <TouchableOpacity onPress={() => Linking.openURL(recommendation.website)}>
              <Text style={styles.contactLink}>🌐 Sitio web</Text>
            </TouchableOpacity>
          )}
        </View>
        
        {/* Redes sociales */}
        <View style={styles.socialSection}>
          <Text style={styles.sectionTitle}>Redes Sociales</Text>
          
          <View style={styles.socialButtons}>
            {recommendation.facebook && (
              <TouchableOpacity 
                style={styles.socialButton}
                onPress={() => Linking.openURL(recommendation.facebook)}
              >
                <Text>Facebook</Text>
              </TouchableOpacity>
            )}
            
            {recommendation.instagram && (
              <TouchableOpacity 
                style={styles.socialButton}
                onPress={() => Linking.openURL(recommendation.instagram)}
              >
                <Text>Instagram</Text>
              </TouchableOpacity>
            )}
            
            {recommendation.twitter && (
              <TouchableOpacity 
                style={styles.socialButton}
                onPress={() => Linking.openURL(recommendation.twitter)}
              >
                <Text>Twitter</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </ScrollView>
  );
};
```

---

## 💻 Ejemplo de Uso en Angular (Dashboard Admin)

```typescript
// services/admin-recommendation.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AdminRecommendationService {
  
  constructor(private http: HttpClient) {}

  getRecommendations(page = 1, limit = 20, search = '', categoryId?: string): Observable<any> {
    const params: any = { page, limit, search };
    if (categoryId) params.categoryId = categoryId;
    return this.http.get('/api/admin/recommendations', { params });
  }

  getRecommendation(recommendationId: string): Observable<any> {
    return this.http.get(`/api/admin/recommendations/${recommendationId}`);
  }

  createRecommendation(data: any): Observable<any> {
    return this.http.post('/api/admin/recommendations', data);
  }

  updateRecommendation(recommendationId: string, data: any): Observable<any> {
    return this.http.put(`/api/admin/recommendations/${recommendationId}`, data);
  }

  deleteRecommendation(recommendationId: string): Observable<any> {
    return this.http.delete(`/api/admin/recommendations/${recommendationId}`);
  }
}
```

**Componente de formulario:**
```typescript
// components/recommendation-form.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AdminRecommendationService } from '../services/admin-recommendation.service';
import { AdminCategoryService } from '../services/admin-category.service';

@Component({
  selector: 'app-recommendation-form',
  templateUrl: './recommendation-form.component.html'
})
export class RecommendationFormComponent implements OnInit {
  recommendationForm: FormGroup;
  recommendationId: string | null = null;
  isEditMode = false;
  loading = false;
  categories: any[] = [];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private recommendationService: AdminRecommendationService,
    private categoryService: AdminCategoryService
  ) {
    this.recommendationForm = this.fb.group({
      categoryId: ['', Validators.required],
      name: ['', Validators.required],
      description: [''],
      address: [''],
      latitude: [null],
      longitude: [null],
      phone: [''],
      email: ['', Validators.email],
      website: [''],
      facebook: [''],
      instagram: [''],
      twitter: [''],
      whatsapp: [''],
      imageUrl: [''],
      isActive: [true]
    });
  }

  ngOnInit() {
    this.loadCategories();
    
    this.recommendationId = this.route.snapshot.paramMap.get('id');
    if (this.recommendationId) {
      this.isEditMode = true;
      this.loadRecommendation();
    }
  }

  loadCategories() {
    this.categoryService.getCategories().subscribe({
      next: (response) => {
        this.categories = response.data;
      }
    });
  }

  loadRecommendation() {
    this.recommendationService.getRecommendation(this.recommendationId!).subscribe({
      next: (response) => {
        this.recommendationForm.patchValue(response.data);
      }
    });
  }

  onSubmit() {
    if (this.recommendationForm.valid) {
      this.loading = true;
      
      const request = this.isEditMode
        ? this.recommendationService.updateRecommendation(this.recommendationId!, this.recommendationForm.value)
        : this.recommendationService.createRecommendation(this.recommendationForm.value);

      request.subscribe({
        next: () => {
          alert(`✅ Recomendado ${this.isEditMode ? 'actualizado' : 'creado'} exitosamente`);
          this.router.navigate(['/admin/recommendations']);
        },
        error: (error) => {
          alert(`❌ Error: ${error.error.message}`);
          this.loading = false;
        }
      });
    }
  }
}
```

---

## 🗺️ Obtener Coordenadas (Latitud/Longitud)

Para obtener las coordenadas de un lugar, puedes usar:

### Opción 1: Google Maps
1. Busca el lugar en Google Maps
2. Click derecho sobre el marcador
3. Copia las coordenadas (aparecen en el menú)

### Opción 2: Geocoding API
```typescript
// Convertir dirección a coordenadas
const geocodeAddress = async (address: string) => {
  const response = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=YOUR_API_KEY`
  );
  const data = await response.json();
  
  if (data.results && data.results.length > 0) {
    const location = data.results[0].geometry.location;
    return {
      latitude: location.lat,
      longitude: location.lng
    };
  }
  
  return null;
};
```

---

## ✨ Características

✅ **CRUD completo** para administradores  
✅ **Solo lectura** para usuarios de la app  
✅ **Vinculado a categorías**  
✅ **Información de ubicación** (dirección + coordenadas)  
✅ **Datos de contacto** (teléfono, email, WhatsApp)  
✅ **Redes sociales** (Facebook, Instagram, Twitter)  
✅ **Sitio web**  
✅ **Imagen del lugar**  
✅ **Búsqueda** por nombre, descripción o dirección  
✅ **Filtro por categoría**  
✅ **Paginación**  
✅ **Estado activo/inactivo**  

---

## 📝 Notas Importantes

1. **Índices de Firestore:** Necesitas crear estos índices en Firebase Console:
   - `isActive` (Ascending)
   - `categoryId` (Ascending) + `isActive` (Ascending)

2. **Coordenadas:** La latitud y longitud son números decimales. Ejemplo:
   - Lima, Perú: `-12.0464, -77.0428`
   - Ciudad de México: `19.4326, -99.1332`

3. **URLs de redes sociales:** Se recomienda guardar las URLs completas:
   - Facebook: `https://facebook.com/nombre`
   - Instagram: `https://instagram.com/nombre`
   - Twitter: `https://twitter.com/nombre`

4. **WhatsApp:** Guardar el número en formato internacional sin espacios ni guiones:
   - Ejemplo: `+51999999999` (Perú)
   - Ejemplo: `+521234567890` (México)

5. **Imágenes:** Usa `/api/admin/upload/image` con `type: 'recommendations'` para subir imágenes.

