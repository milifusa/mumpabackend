# 📱 Guía Rápida - Hitos del Desarrollo (Frontend)

## 🎯 Endpoints Principales

### 1. Categorías

#### Obtener todas las categorías
```http
GET /api/milestones/categories
```
**Sin autenticación requerida**

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "fQaVcHEBHwDYnyLtYsYO",
      "name": "Social",
      "description": "Interacción social y emociones",
      "icon": "👥",
      "color": "#4CAF50",
      "order": 1
    },
    {
      "id": "IllBvxKzqNSINPVYYwXI",
      "name": "Motriz",
      "description": "Movimientos corporales",
      "icon": "🏃",
      "color": "#2196F3",
      "order": 2
    },
    {
      "id": "Z8lzzytnEN99AzEn6Si9",
      "name": "Cognitiva",
      "description": "Pensamiento y aprendizaje",
      "icon": "🧠",
      "color": "#F44336",
      "order": 3
    },
    {
      "id": "ztdwfgdKJfxTOySUeVBr",
      "name": "Comunicación",
      "description": "Habla y comprensión",
      "icon": "💬",
      "color": "#9C27B0",
      "order": 4
    }
  ],
  "total": 4
}
```

---

### 2. Hitos por Edad del Niño

#### Obtener hitos relevantes para un niño
```http
GET /api/children/:childId/milestones
Authorization: Bearer {token}
```

**Query Parameters:**
- `category` (opcional) - Filtrar por categoryId
- `ageBuffer` (opcional, default: 3) - Meses antes/después de la edad actual

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "milestone_123",
      "title": "Sonríe a las personas",
      "description": "El bebé comienza a sonreír",
      "categoryId": "fQaVcHEBHwDYnyLtYsYO",
      "ageMonthsMin": 2,
      "ageMonthsMax": 2,
      "order": 1,
      "completed": false,
      "completedAt": null,
      "notes": null,
      "tips": "Háblale y sonríele frecuentemente",
      "videoUrl": null,
      "imageUrl": null
    }
  ]
}
```

---

### 3. Hitos Agrupados por Categoría

#### Obtener hitos organizados por categoría
```http
GET /api/children/:childId/milestones/by-category
Authorization: Bearer {token}
```

**Query Parameters:**
- `ageBuffer` (opcional, default: 3)

**Response:**
```json
{
  "success": true,
  "data": {
    "fQaVcHEBHwDYnyLtYsYO": {
      "categoryId": "fQaVcHEBHwDYnyLtYsYO",
      "categoryName": "Social",
      "categoryIcon": "👥",
      "categoryColor": "#4CAF50",
      "milestones": [
        {
          "id": "milestone_123",
          "title": "Sonríe a las personas",
          "ageMonthsMin": 2,
          "ageMonthsMax": 2,
          "completed": false
        }
      ],
      "totalMilestones": 10,
      "completedMilestones": 3,
      "completionPercentage": 30
    }
  }
}
```

---

### 4. Marcar Hito como Completado

#### Completar un hito
```http
POST /api/children/:childId/milestones/:milestoneId/complete
Authorization: Bearer {token}
Content-Type: application/json
```

**Body:**
```json
{
  "notes": "Lo logró a los 2 meses y medio" // opcional
}
```

**Response:**
```json
{
  "success": true,
  "message": "Hito marcado como completado",
  "data": {
    "milestoneId": "milestone_123",
    "completed": true,
    "completedAt": "2026-02-07T10:00:00Z",
    "notes": "Lo logró a los 2 meses y medio"
  }
}
```

---

### 5. Desmarcar Hito

#### Quitar marca de completado
```http
DELETE /api/children/:childId/milestones/:milestoneId/complete
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "message": "Hito desmarcado"
}
```

---

### 6. Actualizar Notas de Hito

#### Agregar o actualizar notas
```http
PATCH /api/children/:childId/milestones/:milestoneId/notes
Authorization: Bearer {token}
Content-Type: application/json
```

**Body:**
```json
{
  "notes": "Nueva observación sobre este hito"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Notas actualizadas",
  "data": {
    "notes": "Nueva observación sobre este hito"
  }
}
```

---

### 7. Reporte de Progreso

#### Obtener reporte completo del progreso
```http
GET /api/children/:childId/milestones/progress-report
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "childInfo": {
      "id": "child_abc",
      "name": "María",
      "ageMonths": 6
    },
    "byCategory": [
      {
        "categoryId": "fQaVcHEBHwDYnyLtYsYO",
        "categoryName": "Social",
        "categoryIcon": "👥",
        "categoryColor": "#4CAF50",
        "total": 10,
        "completed": 8,
        "percentage": 80
      }
    ],
    "overallProgress": {
      "totalMilestones": 40,
      "completedMilestones": 32,
      "percentage": 80
    },
    "completedMilestones": [
      {
        "milestoneId": "milestone_123",
        "title": "Sonríe a las personas",
        "categoryId": "fQaVcHEBHwDYnyLtYsYO",
        "completedAt": "2026-01-15T10:00:00Z",
        "ageAtCompletion": 2
      }
    ],
    "upcomingMilestones": [
      {
        "milestoneId": "milestone_456",
        "title": "Se sienta con apoyo",
        "categoryId": "IllBvxKzqNSINPVYYwXI",
        "expectedAge": "6-6 meses"
      }
    ]
  }
}
```

---

## 🎨 Ejemplo de Integración en React Native

### Hook personalizado para hitos

```typescript
import { useState, useEffect } from 'react';

interface Milestone {
  id: string;
  title: string;
  categoryId: string;
  ageMonthsMin: number;
  ageMonthsMax: number;
  completed: boolean;
  completedAt: string | null;
  notes: string | null;
}

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export function useMilestones(childId: string) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);

  // Cargar categorías (solo una vez)
  useEffect(() => {
    fetch('/api/milestones/categories')
      .then(res => res.json())
      .then(data => setCategories(data.data));
  }, []);

  // Cargar hitos del niño
  useEffect(() => {
    if (!childId) return;
    
    setLoading(true);
    fetch(`/api/children/${childId}/milestones`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setMilestones(data.data);
        setLoading(false);
      });
  }, [childId]);

  // Marcar como completado
  const completeMilestone = async (milestoneId: string, notes?: string) => {
    await fetch(`/api/children/${childId}/milestones/${milestoneId}/complete`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ notes })
    });
    
    // Actualizar estado local
    setMilestones(prev => prev.map(m => 
      m.id === milestoneId 
        ? { ...m, completed: true, completedAt: new Date().toISOString(), notes }
        : m
    ));
  };

  // Desmarcar
  const uncompleteMilestone = async (milestoneId: string) => {
    await fetch(`/api/children/${childId}/milestones/${milestoneId}/complete`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    setMilestones(prev => prev.map(m => 
      m.id === milestoneId 
        ? { ...m, completed: false, completedAt: null }
        : m
    ));
  };

  return {
    categories,
    milestones,
    loading,
    completeMilestone,
    uncompleteMilestone
  };
}
```

### Componente de UI

```typescript
import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useMilestones } from './useMilestones';

export function MilestonesScreen({ childId }) {
  const { categories, milestones, loading, completeMilestone, uncompleteMilestone } = useMilestones(childId);

  if (loading) return <Text>Cargando...</Text>;

  // Agrupar hitos por categoría
  const milestonesByCategory = milestones.reduce((acc, milestone) => {
    if (!acc[milestone.categoryId]) {
      acc[milestone.categoryId] = [];
    }
    acc[milestone.categoryId].push(milestone);
    return acc;
  }, {});

  return (
    <ScrollView>
      {categories.map(category => {
        const categoryMilestones = milestonesByCategory[category.id] || [];
        const completed = categoryMilestones.filter(m => m.completed).length;
        const total = categoryMilestones.length;
        const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

        return (
          <View key={category.id} style={{ marginBottom: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontSize: 24 }}>{category.icon}</Text>
              <Text style={{ fontSize: 18, fontWeight: 'bold', marginLeft: 10 }}>
                {category.name}
              </Text>
              <Text style={{ marginLeft: 'auto' }}>
                {completed}/{total} ({percentage}%)
              </Text>
            </View>

            {categoryMilestones.map(milestone => (
              <TouchableOpacity
                key={milestone.id}
                onPress={() => 
                  milestone.completed 
                    ? uncompleteMilestone(milestone.id)
                    : completeMilestone(milestone.id)
                }
                style={{
                  padding: 15,
                  backgroundColor: milestone.completed ? '#E8F5E9' : '#F5F5F5',
                  borderRadius: 8,
                  marginTop: 10
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    borderWidth: 2,
                    borderColor: category.color,
                    backgroundColor: milestone.completed ? category.color : 'transparent',
                    marginRight: 10
                  }} />
                  <View style={{ flex: 1 }}>
                    <Text style={{
                      fontSize: 16,
                      textDecorationLine: milestone.completed ? 'line-through' : 'none'
                    }}>
                      {milestone.title}
                    </Text>
                    <Text style={{ fontSize: 12, color: '#666', marginTop: 5 }}>
                      {milestone.ageMonthsMin === milestone.ageMonthsMax 
                        ? `${milestone.ageMonthsMin} meses`
                        : `${milestone.ageMonthsMin}-${milestone.ageMonthsMax} meses`
                      }
                    </Text>
                    {milestone.notes && (
                      <Text style={{ fontSize: 12, color: '#666', marginTop: 5, fontStyle: 'italic' }}>
                        📝 {milestone.notes}
                      </Text>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        );
      })}
    </ScrollView>
  );
}
```

---

## 📊 Estructura de Datos

### Category
```typescript
interface Category {
  id: string;              // ID de Firestore
  name: string;            // "Social", "Motriz", etc.
  description: string;
  icon: string;            // Emoji
  color: string;           // Hex color
  order: number;
}
```

### Milestone
```typescript
interface Milestone {
  id: string;              // ID de Firestore
  title: string;
  description: string;
  categoryId: string;      // Referencia a Category
  ageMonthsMin: number;    // Edad mínima en meses
  ageMonthsMax: number;    // Edad máxima en meses
  order: number;
  completed: boolean;      // Estado para este niño
  completedAt: string | null;
  notes: string | null;
  tips: string;
  videoUrl: string | null;
  imageUrl: string | null;
}
```

---

## 🔑 IDs de Categorías Actuales

- **Social**: `fQaVcHEBHwDYnyLtYsYO`
- **Motriz**: `IllBvxKzqNSINPVYYwXI`
- **Cognitiva**: `Z8lzzytnEN99AzEn6Si9`
- **Comunicación**: `ztdwfgdKJfxTOySUeVBr`

**Importante:** Siempre obtén las categorías desde el API, no uses estos IDs hardcodeados.
