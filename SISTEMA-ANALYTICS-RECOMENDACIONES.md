# 📊 Sistema de Analytics para Recomendaciones - Munpa

## 📋 Resumen

Sistema completo de analytics para rastrear todas las interacciones de los usuarios con las recomendaciones.

### Características

✅ **9 tipos de eventos** - Vista, llamadas, WhatsApp, email, website, mapa, compartir, favoritos, wishlist  
✅ **Contadores agregados** - Estadísticas en tiempo real en cada recomendación  
✅ **Parámetros UTM** - Tracking de origen del tráfico  
✅ **Tasa de conversión** - Interacciones vs vistas  
✅ **Estadísticas globales** - Dashboard para admin  
✅ **Sin autenticación** - Funciona para todos los usuarios  

---

## 🗂️ Estructura de Datos

### Colección: `recommendation_analytics`

```javascript
{
  id: "event_123",
  
  // Identificadores
  recommendationId: "rec_456",
  userId: "user_789" || null,  // Opcional (si está logueado)
  
  // Tipo de evento
  eventType: "view",  // view, call, whatsapp, email, website, map, share, favorite, wishlist
  
  // Origen
  source: "app",  // app, web, email, share
  
  // Metadata adicional
  metadata: {
    phone: "+521234567890",  // Si es call o whatsapp
    url: "https://...",      // Si es website
    platform: "ios",         // ios, android, web
    // ... cualquier otro dato relevante
  },
  
  // Parámetros UTM
  utmParams: {
    utm_source: "facebook",
    utm_medium: "social",
    utm_campaign: "promocion_primavera",
    utm_content: "banner_top",
    utm_term: "recomendacion"
  },
  
  // Timestamps
  timestamp: Timestamp,
  createdAt: Timestamp
}
```

### Campo `analytics` en `recommendations`

```javascript
{
  id: "rec_456",
  title: "Pediatra Excelente",
  // ... otros campos
  
  analytics: {
    views: 245,                // Vistas totales
    calls: 18,                 // Llamadas realizadas
    whatsappClicks: 32,        // Clicks en WhatsApp
    emailClicks: 5,            // Clicks en email
    websiteClicks: 12,         // Clicks en website
    mapClicks: 28,             // Clicks en mapa
    shares: 15,                // Veces compartido
    favorites: 22,             // Agregado a favoritos
    wishlists: 10,             // Agregado a wishlist
    totalInteractions: 142     // Total interacciones (excluye views)
  }
}
```

---

## 🔧 API - Endpoints

### 1. Registrar Evento de Analytics (Público)

```http
POST /api/recommendations/:recommendationId/analytics/events
```

**Body:**
```json
{
  "eventType": "call",
  "userId": "user_123",
  "source": "app",
  "metadata": {
    "phone": "+521234567890",
    "platform": "ios"
  },
  "utmParams": {
    "utm_source": "app",
    "utm_medium": "navigation",
    "utm_campaign": "recommendation_share"
  }
}
```

**Tipos de eventos válidos:**
- `view` - Vista de recomendación
- `call` - Llamada telefónica
- `whatsapp` - Contacto por WhatsApp
- `email` - Click en email
- `website` - Click en website
- `map` - Click en mapa
- `share` - Compartir recomendación
- `favorite` - Agregar a favoritos
- `wishlist` - Agregar a wishlist

**Respuesta:**
```json
{
  "success": true,
  "message": "Evento registrado exitosamente",
  "data": {
    "eventId": "event_123",
    "eventType": "call",
    "timestamp": "2025-01-15T10:30:00Z"
  }
}
```

**Ejemplo con curl:**
```bash
curl -X POST https://api.munpa.online/api/recommendations/rec_456/analytics/events \
  -H "Content-Type: application/json" \
  -d '{
    "eventType": "view",
    "source": "app",
    "utmParams": {
      "utm_source": "home",
      "utm_medium": "navigation"
    }
  }'
```

---

### 2. Obtener Estadísticas de una Recomendación (Público)

```http
GET /api/recommendations/:recommendationId/analytics
```

**Query Parameters:**
| Parámetro | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| `startDate` | string (ISO) | - | Fecha de inicio |
| `endDate` | string (ISO) | - | Fecha de fin |
| `eventType` | string | - | Filtrar por tipo de evento |
| `groupBy` | string | day | day, week, month |

**Ejemplo:**
```bash
GET /api/recommendations/rec_456/analytics?startDate=2025-01-01&endDate=2025-01-31&eventType=call
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "recommendationId": "rec_456",
    
    "aggregatedStats": {
      "views": 245,
      "calls": 18,
      "whatsappClicks": 32,
      "emailClicks": 5,
      "websiteClicks": 12,
      "mapClicks": 28,
      "shares": 15,
      "favorites": 22,
      "wishlists": 10,
      "totalInteractions": 142
    },
    
    "eventStats": {
      "view": 245,
      "call": 18,
      "whatsapp": 32,
      "email": 5,
      "website": 12,
      "map": 28,
      "share": 15,
      "favorite": 22,
      "wishlist": 10
    },
    
    "conversionRate": 57.96,  // (142 / 245) * 100
    
    "trafficSources": {
      "direct": 150,
      "facebook": 45,
      "instagram": 30,
      "email": 20
    },
    
    "recentEvents": [
      {
        "id": "event_123",
        "eventType": "call",
        "timestamp": "2025-01-15T10:30:00Z",
        "source": "app"
      }
    ],
    
    "totalEvents": 387,
    
    "dateRange": {
      "start": "2025-01-01",
      "end": "2025-01-31"
    }
  }
}
```

---

### 3. Estadísticas Globales (Admin)

```http
GET /api/admin/analytics/recommendations
Authorization: Bearer {token}
```

**Query Parameters:**
| Parámetro | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| `startDate` | string (ISO) | - | Fecha de inicio |
| `endDate` | string (ISO) | - | Fecha de fin |
| `limit` | number | 20 | Máximo de recomendaciones |

**Ejemplo:**
```bash
GET /api/admin/analytics/recommendations?limit=10
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "totalStats": {
      "views": 5420,
      "calls": 387,
      "whatsappClicks": 642,
      "emailClicks": 128,
      "websiteClicks": 289,
      "mapClicks": 456,
      "shares": 234,
      "favorites": 567,
      "wishlists": 189,
      "totalInteractions": 2892
    },
    
    "totalRecommendations": 20,
    
    "topByViews": [
      {
        "id": "rec_456",
        "title": "Pediatra Excelente",
        "category": "salud",
        "analytics": {
          "views": 245,
          "totalInteractions": 142
        }
      }
    ],
    
    "topByInteractions": [
      {
        "id": "rec_789",
        "title": "Guardería La Casita",
        "category": "educacion",
        "analytics": {
          "views": 180,
          "totalInteractions": 156
        }
      }
    ],
    
    "topByConversion": [
      {
        "id": "rec_321",
        "title": "Dentista Infantil",
        "category": "salud",
        "analytics": {
          "views": 120,
          "totalInteractions": 98
        },
        "conversionRate": 81.67
      }
    ]
  }
}
```

---

## 📱 Integración en el Frontend (App)

### Servicio de Analytics (TypeScript)

```typescript
// recommendationAnalyticsService.ts

import AsyncStorage from '@react-native-async-storage/async-storage';

class RecommendationAnalyticsService {
  private baseUrl = 'https://api.munpa.online';

  // Registrar cualquier evento
  async trackEvent(
    recommendationId: string,
    eventType: string,
    metadata: any = {},
    utmParams: any = {}
  ): Promise<void> {
    try {
      const userId = await AsyncStorage.getItem('userId');
      
      const response = await fetch(
        `${this.baseUrl}/api/recommendations/${recommendationId}/analytics/events`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            eventType,
            userId: userId || null,
            source: 'app',
            metadata,
            utmParams
          })
        }
      );

      const data = await response.json();
      
      if (!data.success) {
        console.warn('[Analytics] Error:', data.message);
      }
    } catch (error) {
      console.error('[Analytics] Error tracking event:', error);
    }
  }

  // Trackear vista
  async trackView(
    recommendationId: string,
    metadata: any = {}
  ): Promise<void> {
    await this.trackEvent(recommendationId, 'view', metadata);
  }

  // Trackear llamada
  async trackCall(
    recommendationId: string,
    phone: string,
    metadata: any = {}
  ): Promise<void> {
    await this.trackEvent(recommendationId, 'call', {
      ...metadata,
      phone
    });
  }

  // Trackear WhatsApp
  async trackWhatsApp(
    recommendationId: string,
    phone: string,
    metadata: any = {}
  ): Promise<void> {
    await this.trackEvent(recommendationId, 'whatsapp', {
      ...metadata,
      phone
    });
  }

  // Trackear email
  async trackEmail(
    recommendationId: string,
    email: string,
    metadata: any = {}
  ): Promise<void> {
    await this.trackEvent(recommendationId, 'email', {
      ...metadata,
      email
    });
  }

  // Trackear website
  async trackWebsite(
    recommendationId: string,
    url: string,
    metadata: any = {}
  ): Promise<void> {
    await this.trackEvent(recommendationId, 'website', {
      ...metadata,
      url
    });
  }

  // Trackear mapa
  async trackMap(
    recommendationId: string,
    location: { latitude: number; longitude: number },
    metadata: any = {}
  ): Promise<void> {
    await this.trackEvent(recommendationId, 'map', {
      ...metadata,
      location
    });
  }

  // Trackear compartir
  async trackShare(
    recommendationId: string,
    platform: string,
    metadata: any = {}
  ): Promise<void> {
    await this.trackEvent(recommendationId, 'share', {
      ...metadata,
      platform
    });
  }

  // Obtener estadísticas
  async getAnalytics(recommendationId: string): Promise<any> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/recommendations/${recommendationId}/analytics`
      );
      
      const data = await response.json();
      return data.success ? data.data : null;
    } catch (error) {
      console.error('[Analytics] Error getting analytics:', error);
      return null;
    }
  }

  // Generar URL para compartir con UTM
  generateShareUrl(
    recommendationId: string,
    utmParams: {
      utm_source?: string;
      utm_medium?: string;
      utm_campaign?: string;
      utm_content?: string;
    }
  ): string {
    const baseUrl = `https://munpa.app/recommendations/${recommendationId}`;
    const params = new URLSearchParams(utmParams as any);
    return `${baseUrl}?${params.toString()}`;
  }

  // Extraer parámetros UTM de una URL
  extractUTMParams(url: string): any {
    const urlObj = new URL(url);
    return {
      utm_source: urlObj.searchParams.get('utm_source'),
      utm_medium: urlObj.searchParams.get('utm_medium'),
      utm_campaign: urlObj.searchParams.get('utm_campaign'),
      utm_content: urlObj.searchParams.get('utm_content'),
      utm_term: urlObj.searchParams.get('utm_term')
    };
  }
}

export default new RecommendationAnalyticsService();
```

---

### Uso en RecommendationDetailScreen

```typescript
import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, Linking } from 'react-native';
import recommendationAnalyticsService from '../services/recommendationAnalyticsService';

const RecommendationDetailScreen = ({ route }) => {
  const { recommendationId } = route.params;
  const [recommendation, setRecommendation] = useState(null);

  useEffect(() => {
    // Trackear vista al cargar la recomendación
    recommendationAnalyticsService.trackView(recommendationId, {
      source: 'detail_screen',
      platform: Platform.OS
    });
  }, [recommendationId]);

  const handleCall = async () => {
    const phone = recommendation.phone;
    
    // Trackear llamada
    await recommendationAnalyticsService.trackCall(recommendationId, phone, {
      source: 'detail_screen'
    });
    
    // Hacer la llamada
    Linking.openURL(`tel:${phone}`);
  };

  const handleWhatsApp = async () => {
    const phone = recommendation.phone;
    const message = `Hola, vi tu recomendación en Munpa`;
    
    // Trackear WhatsApp
    await recommendationAnalyticsService.trackWhatsApp(recommendationId, phone, {
      source: 'detail_screen'
    });
    
    // Abrir WhatsApp
    Linking.openURL(`whatsapp://send?phone=${phone}&text=${encodeURIComponent(message)}`);
  };

  const handleWebsite = async () => {
    const url = recommendation.website;
    
    // Trackear website
    await recommendationAnalyticsService.trackWebsite(recommendationId, url, {
      source: 'detail_screen'
    });
    
    // Abrir navegador
    Linking.openURL(url);
  };

  const handleMap = async () => {
    const { latitude, longitude } = recommendation.location;
    
    // Trackear mapa
    await recommendationAnalyticsService.trackMap(recommendationId, { latitude, longitude }, {
      source: 'detail_screen'
    });
    
    // Abrir Google Maps
    const url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
    Linking.openURL(url);
  };

  const handleShare = async () => {
    const shareUrl = recommendationAnalyticsService.generateShareUrl(recommendationId, {
      utm_source: 'app',
      utm_medium: 'share',
      utm_campaign: 'recommendation_share'
    });
    
    // Trackear compartir
    await recommendationAnalyticsService.trackShare(recommendationId, 'native_share', {
      source: 'detail_screen'
    });
    
    // Compartir
    Share.share({
      message: `Mira esta recomendación en Munpa: ${shareUrl}`,
      url: shareUrl
    });
  };

  return (
    <View>
      <Text>{recommendation?.title}</Text>
      
      <TouchableOpacity onPress={handleCall}>
        <Text>📞 Llamar</Text>
      </TouchableOpacity>
      
      <TouchableOpacity onPress={handleWhatsApp}>
        <Text>💬 WhatsApp</Text>
      </TouchableOpacity>
      
      <TouchableOpacity onPress={handleWebsite}>
        <Text>🌐 Sitio Web</Text>
      </TouchableOpacity>
      
      <TouchableOpacity onPress={handleMap}>
        <Text>📍 Ver en Mapa</Text>
      </TouchableOpacity>
      
      <TouchableOpacity onPress={handleShare}>
        <Text>📤 Compartir</Text>
      </TouchableOpacity>
    </View>
  );
};
```

---

## 🎯 Casos de Uso

### 1. Trackear todas las interacciones de un usuario

```typescript
// Usuario ve la recomendación
await recommendationAnalyticsService.trackView('rec_456');

// Usuario hace click en WhatsApp
await recommendationAnalyticsService.trackWhatsApp('rec_456', '+521234567890');

// Usuario abre el mapa
await recommendationAnalyticsService.trackMap('rec_456', {
  latitude: 19.4326,
  longitude: -99.1332
});

// Usuario comparte
await recommendationAnalyticsService.trackShare('rec_456', 'facebook');
```

### 2. Compartir con parámetros UTM

```typescript
// Generar URL para compartir en redes sociales
const facebookUrl = recommendationAnalyticsService.generateShareUrl('rec_456', {
  utm_source: 'facebook',
  utm_medium: 'social',
  utm_campaign: 'recommendation_share'
});

// Compartir en Facebook
Linking.openURL(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(facebookUrl)}`);
```

### 3. Ver estadísticas de una recomendación

```typescript
const analytics = await recommendationAnalyticsService.getAnalytics('rec_456');

console.log('Vistas:', analytics.aggregatedStats.views);
console.log('Llamadas:', analytics.aggregatedStats.calls);
console.log('Tasa de conversión:', analytics.conversionRate + '%');
```

---

## 🔥 Índices de Firestore Necesarios

```javascript
// Colección: recommendation_analytics
// Índice compuesto 1:
// - recommendationId (Ascending)
// - timestamp (Descending)

// Índice compuesto 2:
// - recommendationId (Ascending)
// - eventType (Ascending)
// - timestamp (Descending)

// Colección: recommendations
// Índice para ordenar por vistas:
// - analytics.views (Descending)
```

**Cómo crear:**
1. Ve a Firestore Console
2. Click en "Índices"
3. Click en "Crear índice"
4. Colección: `recommendation_analytics`
5. Agregar los campos según los índices descritos arriba

---

## 📊 Dashboard de Analytics (Ejemplo)

```typescript
// AdminDashboard.tsx

const AnalyticsDashboard = () => {
  const [globalStats, setGlobalStats] = useState(null);

  useEffect(() => {
    loadGlobalStats();
  }, []);

  const loadGlobalStats = async () => {
    const response = await fetch(
      'https://api.munpa.online/api/admin/analytics/recommendations',
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    const data = await response.json();
    setGlobalStats(data.data);
  };

  return (
    <div>
      <h2>Estadísticas Globales</h2>
      
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Vistas Totales</h3>
          <p>{globalStats?.totalStats.views.toLocaleString()}</p>
        </div>
        
        <div className="stat-card">
          <h3>Llamadas</h3>
          <p>{globalStats?.totalStats.calls.toLocaleString()}</p>
        </div>
        
        <div className="stat-card">
          <h3>WhatsApp</h3>
          <p>{globalStats?.totalStats.whatsappClicks.toLocaleString()}</p>
        </div>
        
        <div className="stat-card">
          <h3>Interacciones</h3>
          <p>{globalStats?.totalStats.totalInteractions.toLocaleString()}</p>
        </div>
      </div>
      
      <h3>Top 10 Recomendaciones por Vistas</h3>
      <table>
        <thead>
          <tr>
            <th>Recomendación</th>
            <th>Vistas</th>
            <th>Interacciones</th>
            <th>Conversión</th>
          </tr>
        </thead>
        <tbody>
          {globalStats?.topByViews.map(rec => (
            <tr key={rec.id}>
              <td>{rec.title}</td>
              <td>{rec.analytics.views}</td>
              <td>{rec.analytics.totalInteractions}</td>
              <td>
                {rec.analytics.views > 0
                  ? ((rec.analytics.totalInteractions / rec.analytics.views) * 100).toFixed(2)
                  : 0}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
```

---

## 📝 Resumen de Features

| Feature | Descripción | Endpoint |
|---------|-------------|----------|
| **Registrar evento** | Trackear cualquier interacción | POST `/api/recommendations/:id/analytics/events` |
| **Estadísticas individuales** | Analytics de una recomendación | GET `/api/recommendations/:id/analytics` |
| **Estadísticas globales** | Dashboard de admin | GET `/api/admin/analytics/recommendations` |
| **9 tipos de eventos** | view, call, whatsapp, email, website, map, share, favorite, wishlist | - |
| **Parámetros UTM** | Tracking de origen del tráfico | Incluidos en eventos |
| **Tasa de conversión** | Interacciones / vistas | Calculado automáticamente |
| **Sin autenticación** | Funciona para todos los usuarios | Público (excepto admin) |

---

## 🎉 ¡Sistema Completo!

El sistema de analytics está **100% funcional** y listo para:
- ✅ Trackear vistas de recomendaciones
- ✅ Trackear llamadas telefónicas
- ✅ Trackear contactos por WhatsApp
- ✅ Trackear clicks en websites
- ✅ Trackear aperturas de mapa
- ✅ Trackear compartidos
- ✅ Calcular tasas de conversión
- ✅ Generar reportes para admin
- ✅ Identificar recomendaciones más populares

