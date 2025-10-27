# ✨ API Badges de Calidad - Munpa

Sistema de badges y features para destacar las cualidades de los recomendados, especialmente orientados a familias con bebés y embarazadas.

---

## 📊 Estructura de Datos

### Campos Principales:

```typescript
{
  verified: boolean,      // Badge verde "Verificado por Munpa"
  
  badges: string[],       // Array de badges (auto-generados + manuales)
  
  features: {             // Features que generan badges automáticamente
    hasChangingTable: boolean,       // Tiene cambiador/mudador
    hasNursingRoom: boolean,         // Tiene sala de lactancia
    hasParking: boolean,             // Tiene estacionamiento
    isStrollerAccessible: boolean,   // Accesible con coches
    acceptsEmergencies: boolean,     // Acepta emergencias 24/7
    is24Hours: boolean               // Abierto 24 horas
  }
}
```

---

## 🏷️ Badges Disponibles

### Badges Automáticos (generados desde `features`):

| Badge | Clave | Generado cuando |
|-------|-------|-----------------|
| 🔄 Cambiador | `changing_table` | `hasChangingTable: true` |
| 🤱 Sala de Lactancia | `nursing_room` | `hasNursingRoom: true` |
| 🅿️ Estacionamiento | `parking` | `hasParking: true` |
| 🚼 Accesible con Coches | `stroller_accessible` | `isStrollerAccessible: true` |
| 🚨 Emergencias 24/7 | `emergency_24_7` | `acceptsEmergencies: true` |
| 🕐 Abierto 24 Horas | `24_hours` | `is24Hours: true` |
| 👶 Baby Friendly | `baby_friendly` | Al menos 3 features activos |

### Badges Manuales (opcionales):

Puedes agregar badges adicionales directamente en el array `badges`:

```json
{
  "badges": ["pet_friendly", "eco_friendly", "wifi_available", "playground"]
}
```

---

## 🔧 Lógica de Generación Automática

### Backend (server.js):

1. **Al crear un recomendado**: Se procesan los `features` y se generan los badges automáticamente.
2. **Al actualizar un recomendado**: Se recalculan los badges basados en los nuevos `features`.
3. **Badge "baby_friendly"**: Se asigna automáticamente si el lugar tiene **3 o más features** activos.

```javascript
// Ejemplo de lógica:
const autoBadges = [];
if (features.hasChangingTable) autoBadges.push('changing_table');
if (features.hasNursingRoom) autoBadges.push('nursing_room');
if (features.hasParking) autoBadges.push('parking');
// ... etc

const featuresCount = Object.values(features).filter(v => v === true).length;
if (featuresCount >= 3) {
  autoBadges.push('baby_friendly');
}
```

---

## 🎨 API Endpoints

### 1. Crear Recomendado con Badges (Admin)

**POST** `/api/admin/recommendations`

```json
{
  "name": "Clínica Maternal Santa Rosa",
  "categoryId": "cat123",
  "description": "Clínica especializada en maternidad",
  "address": "Av. Principal 123",
  "verified": true,
  "features": {
    "hasChangingTable": true,
    "hasNursingRoom": true,
    "hasParking": true,
    "isStrollerAccessible": true,
    "acceptsEmergencies": true,
    "is24Hours": false
  },
  "badges": ["wifi_available"]
}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Recomendado creado exitosamente",
  "data": {
    "id": "rec123",
    "name": "Clínica Maternal Santa Rosa",
    "verified": true,
    "badges": [
      "wifi_available",
      "changing_table",
      "nursing_room",
      "parking",
      "stroller_accessible",
      "emergency_24_7",
      "baby_friendly"
    ],
    "features": {
      "hasChangingTable": true,
      "hasNursingRoom": true,
      "hasParking": true,
      "isStrollerAccessible": true,
      "acceptsEmergencies": true,
      "is24Hours": false
    }
  }
}
```

### 2. Actualizar Badges (Admin)

**PUT** `/api/admin/recommendations/:recommendationId`

```json
{
  "verified": true,
  "features": {
    "hasChangingTable": true,
    "hasNursingRoom": false,
    "hasParking": true,
    "isStrollerAccessible": true,
    "acceptsEmergencies": false,
    "is24Hours": false
  }
}
```

### 3. Obtener Recomendados con Badges (App)

**GET** `/api/recommendations`

**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "id": "rec123",
      "name": "Clínica Maternal",
      "verified": true,
      "badges": [
        "changing_table",
        "nursing_room",
        "parking",
        "baby_friendly"
      ],
      "features": {
        "hasChangingTable": true,
        "hasNursingRoom": true,
        "hasParking": true,
        "isStrollerAccessible": false,
        "acceptsEmergencies": false,
        "is24Hours": false
      }
    }
  ]
}
```

---

## 📱 Implementación en React Native

### Service:

```typescript
// services/recommendationService.ts

export interface RecommendationFeatures {
  hasChangingTable: boolean;
  hasNursingRoom: boolean;
  hasParking: boolean;
  isStrollerAccessible: boolean;
  acceptsEmergencies: boolean;
  is24Hours: boolean;
}

export interface Recommendation {
  id: string;
  name: string;
  description: string;
  verified: boolean;
  badges: string[];
  features: RecommendationFeatures;
  // ... otros campos
}
```

### Componente de Badges:

```tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface BadgeItem {
  key: string;
  label: string;
  icon: string;
  color: string;
}

const BADGE_CONFIG: Record<string, BadgeItem> = {
  changing_table: {
    key: 'changing_table',
    label: 'Cambiador',
    icon: 'child-care',
    color: '#2196F3'
  },
  nursing_room: {
    key: 'nursing_room',
    label: 'Sala de Lactancia',
    icon: 'pregnant-woman',
    color: '#FF69B4'
  },
  parking: {
    key: 'parking',
    label: 'Estacionamiento',
    icon: 'local-parking',
    color: '#4CAF50'
  },
  stroller_accessible: {
    key: 'stroller_accessible',
    label: 'Coches Bienvenidos',
    icon: 'accessible',
    color: '#9C27B0'
  },
  emergency_24_7: {
    key: 'emergency_24_7',
    label: 'Emergencias 24/7',
    icon: 'local-hospital',
    color: '#F44336'
  },
  '24_hours': {
    key: '24_hours',
    label: 'Abierto 24h',
    icon: 'access-time',
    color: '#FF9800'
  },
  baby_friendly: {
    key: 'baby_friendly',
    label: 'Baby Friendly',
    icon: 'favorite',
    color: '#E91E63'
  }
};

interface BadgesDisplayProps {
  badges: string[];
  verified?: boolean;
  compact?: boolean;
}

export const BadgesDisplay: React.FC<BadgesDisplayProps> = ({
  badges,
  verified = false,
  compact = false
}) => {
  return (
    <View style={styles.container}>
      {/* Badge de Verificado */}
      {verified && (
        <View style={[styles.badge, styles.verifiedBadge]}>
          <Icon name="verified" size={16} color="#fff" />
          {!compact && <Text style={styles.verifiedText}>Verificado</Text>}
        </View>
      )}

      {/* Badges de Features */}
      {badges.map((badgeKey) => {
        const config = BADGE_CONFIG[badgeKey];
        if (!config) return null;

        return (
          <View
            key={badgeKey}
            style={[
              styles.badge,
              { backgroundColor: config.color + '20' } // 20 = transparencia
            ]}
          >
            <Icon name={config.icon} size={16} color={config.color} />
            {!compact && (
              <Text style={[styles.badgeText, { color: config.color }]}>
                {config.label}
              </Text>
            )}
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  verifiedBadge: {
    backgroundColor: '#4CAF50',
  },
  verifiedText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
```

### Uso en una Pantalla:

```tsx
import React from 'react';
import { View, Text, Image, ScrollView, StyleSheet } from 'react-native';
import { BadgesDisplay } from '../components/BadgesDisplay';

const RecommendationDetailScreen = ({ route }) => {
  const { recommendation } = route.params;

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <Image source={{ uri: recommendation.imageUrl }} style={styles.image} />
      
      <View style={styles.content}>
        <Text style={styles.name}>{recommendation.name}</Text>
        <Text style={styles.description}>{recommendation.description}</Text>

        {/* Badges */}
        <BadgesDisplay
          badges={recommendation.badges}
          verified={recommendation.verified}
        />

        {/* Features Detalladas */}
        <Text style={styles.sectionTitle}>Características</Text>
        
        {recommendation.features.hasChangingTable && (
          <FeatureItem icon="child-care" text="Cambiador disponible" />
        )}
        {recommendation.features.hasNursingRoom && (
          <FeatureItem icon="pregnant-woman" text="Sala de lactancia" />
        )}
        {recommendation.features.hasParking && (
          <FeatureItem icon="local-parking" text="Estacionamiento" />
        )}
        {recommendation.features.isStrollerAccessible && (
          <FeatureItem icon="accessible" text="Accesible con coches" />
        )}
        {recommendation.features.acceptsEmergencies && (
          <FeatureItem icon="local-hospital" text="Acepta emergencias" />
        )}
        {recommendation.features.is24Hours && (
          <FeatureItem icon="access-time" text="Abierto 24 horas" />
        )}
      </View>
    </ScrollView>
  );
};

const FeatureItem = ({ icon, text }) => (
  <View style={styles.featureItem}>
    <Icon name={icon} size={20} color="#4CAF50" />
    <Text style={styles.featureText}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  image: {
    width: '100%',
    height: 200,
  },
  content: {
    padding: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 24,
    marginBottom: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  featureText: {
    fontSize: 14,
    color: '#333',
  },
});

export default RecommendationDetailScreen;
```

### Lista Compacta con Badges:

```tsx
const RecommendationCard = ({ recommendation, onPress }) => (
  <TouchableOpacity style={styles.card} onPress={onPress}>
    <Image source={{ uri: recommendation.imageUrl }} style={styles.cardImage} />
    
    <View style={styles.cardContent}>
      <Text style={styles.cardName}>{recommendation.name}</Text>
      <Text style={styles.cardAddress} numberOfLines={1}>
        {recommendation.address}
      </Text>
      
      {/* Badges Compactos */}
      <BadgesDisplay
        badges={recommendation.badges.slice(0, 3)} // Máximo 3
        verified={recommendation.verified}
        compact={true}
      />
      
      {/* Rating */}
      <View style={styles.rating}>
        <Icon name="star" size={14} color="#FFD700" />
        <Text style={styles.ratingText}>
          {recommendation.averageRating.toFixed(1)} ({recommendation.totalReviews})
        </Text>
      </View>
    </View>
  </TouchableOpacity>
);
```

---

## 🎯 Filtrar por Badges

### Endpoint de Búsqueda (puedes implementar):

```typescript
GET /api/recommendations?badges=changing_table,nursing_room
```

### Implementación en la App:

```tsx
const [selectedBadges, setSelectedBadges] = useState<string[]>([]);

const filteredRecommendations = recommendations.filter(rec => {
  if (selectedBadges.length === 0) return true;
  
  // El recomendado debe tener TODOS los badges seleccionados
  return selectedBadges.every(badge => rec.badges.includes(badge));
});
```

### Selector de Badges:

```tsx
const BadgeFilter = ({ selectedBadges, onToggle }) => {
  const filterableBadges = [
    'changing_table',
    'nursing_room',
    'parking',
    'stroller_accessible'
  ];

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      {filterableBadges.map(badgeKey => {
        const config = BADGE_CONFIG[badgeKey];
        const isSelected = selectedBadges.includes(badgeKey);

        return (
          <TouchableOpacity
            key={badgeKey}
            style={[
              styles.filterBadge,
              isSelected && { backgroundColor: config.color }
            ]}
            onPress={() => onToggle(badgeKey)}
          >
            <Icon
              name={config.icon}
              size={18}
              color={isSelected ? '#fff' : config.color}
            />
            <Text
              style={[
                styles.filterText,
                isSelected && { color: '#fff' }
              ]}
            >
              {config.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};
```

---

## 🎨 Implementación en Angular (Dashboard)

### Component:

```typescript
// badge-editor.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';

interface Features {
  hasChangingTable: boolean;
  hasNursingRoom: boolean;
  hasParking: boolean;
  isStrollerAccessible: boolean;
  acceptsEmergencies: boolean;
  is24Hours: boolean;
}

@Component({
  selector: 'app-badge-editor',
  template: `
    <div class="badge-editor">
      <h3>Verificación</h3>
      <mat-slide-toggle [(ngModel)]="verified" (change)="onChange()">
        Verificado por Munpa
      </mat-slide-toggle>

      <h3>Características</h3>
      <div class="features-grid">
        <mat-checkbox [(ngModel)]="features.hasChangingTable" (change)="onChange()">
          <mat-icon>child_care</mat-icon>
          Tiene Cambiador
        </mat-checkbox>

        <mat-checkbox [(ngModel)]="features.hasNursingRoom" (change)="onChange()">
          <mat-icon>pregnant_woman</mat-icon>
          Sala de Lactancia
        </mat-checkbox>

        <mat-checkbox [(ngModel)]="features.hasParking" (change)="onChange()">
          <mat-icon>local_parking</mat-icon>
          Estacionamiento
        </mat-checkbox>

        <mat-checkbox [(ngModel)]="features.isStrollerAccessible" (change)="onChange()">
          <mat-icon>accessible</mat-icon>
          Accesible con Coches
        </mat-checkbox>

        <mat-checkbox [(ngModel)]="features.acceptsEmergencies" (change)="onChange()">
          <mat-icon>local_hospital</mat-icon>
          Acepta Emergencias
        </mat-checkbox>

        <mat-checkbox [(ngModel)]="features.is24Hours" (change)="onChange()">
          <mat-icon>access_time</mat-icon>
          Abierto 24 Horas
        </mat-checkbox>
      </div>

      <div class="preview">
        <h4>Vista Previa de Badges:</h4>
        <div class="badges-preview">
          <span class="badge verified" *ngIf="verified">
            <mat-icon>verified</mat-icon>
            Verificado
          </span>
          <span class="badge" *ngFor="let badge of generatedBadges">
            {{ badgeLabels[badge] }}
          </span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .badge-editor {
      padding: 20px;
    }
    .features-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
      margin-top: 16px;
    }
    .preview {
      margin-top: 24px;
      padding: 16px;
      background: #f5f5f5;
      border-radius: 8px;
    }
    .badges-preview {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 12px;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 6px 12px;
      border-radius: 16px;
      background: #e3f2fd;
      color: #2196f3;
      font-size: 12px;
      font-weight: 600;
    }
    .badge.verified {
      background: #4caf50;
      color: white;
    }
  `]
})
export class BadgeEditorComponent {
  @Input() verified: boolean = false;
  @Input() features: Features = {
    hasChangingTable: false,
    hasNursingRoom: false,
    hasParking: false,
    isStrollerAccessible: false,
    acceptsEmergencies: false,
    is24Hours: false
  };

  @Output() badgesChange = new EventEmitter<{
    verified: boolean;
    features: Features;
    badges: string[];
  }>();

  badgeLabels = {
    changing_table: 'Cambiador',
    nursing_room: 'Sala de Lactancia',
    parking: 'Estacionamiento',
    stroller_accessible: 'Accesible con Coches',
    emergency_24_7: 'Emergencias 24/7',
    '24_hours': 'Abierto 24h',
    baby_friendly: 'Baby Friendly'
  };

  get generatedBadges(): string[] {
    const badges: string[] = [];
    if (this.features.hasChangingTable) badges.push('changing_table');
    if (this.features.hasNursingRoom) badges.push('nursing_room');
    if (this.features.hasParking) badges.push('parking');
    if (this.features.isStrollerAccessible) badges.push('stroller_accessible');
    if (this.features.acceptsEmergencies) badges.push('emergency_24_7');
    if (this.features.is24Hours) badges.push('24_hours');

    const count = Object.values(this.features).filter(v => v).length;
    if (count >= 3) badges.push('baby_friendly');

    return badges;
  }

  onChange() {
    this.badgesChange.emit({
      verified: this.verified,
      features: this.features,
      badges: this.generatedBadges
    });
  }
}
```

---

## ✨ Características del Sistema

✅ **Generación Automática**: Badges se crean automáticamente desde features  
✅ **Badge "Baby Friendly"**: Asignado automáticamente con 3+ features  
✅ **Badges Manuales**: Permite agregar badges personalizados  
✅ **Sin Duplicados**: Sistema evita duplicados al combinar badges  
✅ **Retrocompatibilidad**: Valores por defecto si no existen en BD  
✅ **Verificación Manual**: Badge "Verificado por Munpa" controlado por admin  
✅ **Filtrable**: Buscar recomendados por badges específicos  

---

## 📝 Notas Importantes

1. **Persistencia**: Los badges se almacenan en Firestore junto con el recomendado.

2. **Actualización Automática**: Al cambiar features, los badges se recalculan automáticamente.

3. **Valores por Defecto**: Si un recomendado antiguo no tiene estos campos, se devuelven valores por defecto (false/vacío).

4. **UI/UX**: Se recomienda mostrar máximo 3-4 badges en vistas compactas y todos en la vista de detalle.

5. **Iconografía**: Usa Material Icons para consistencia visual.

