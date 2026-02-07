# 🎯 API de Hitos del Desarrollo Infantil

## 📋 Descripción

Sistema completo para gestionar y hacer seguimiento de los hitos del desarrollo infantil. Los hitos están organizados por rangos de edad (meses) y categorías de desarrollo.

---

## 🗂️ Estructura de Datos

### Colección: `milestones` (Hitos)

```javascript
{
  id: "milestone_123",
  
  // Información básica
  title: "Sonríe a las personas",
  description: "El bebé comienza a sonreír en respuesta a estímulos sociales",
  
  // Organización
  category: "social",           // social, motor-grueso, motor-fino, lenguaje, cognitivo
  ageRangeMonths: {
    min: 0,                      // Edad mínima en meses
    max: 3                       // Edad máxima en meses
  },
  
  // Configuración
  order: 1,                      // Orden dentro de la categoría
  isActive: true,                // Si está activo
  
  // Recursos (opcional)
  tips: "Háblale y sonríele frecuentemente al bebé",
  videoUrl: "https://...",       // URL de video explicativo (opcional)
  imageUrl: "https://...",       // URL de imagen (opcional)
  
  // Metadata
  createdAt: Timestamp,
  updatedAt: Timestamp,
  createdBy: "admin_uid"
}
```

### Colección: `children/:childId/milestoneProgress`

```javascript
{
  id: "progress_123",
  childId: "child_abc",
  milestoneId: "milestone_123",
  
  // Estado
  completed: true,
  completedAt: Timestamp,
  completedBy: "parent_uid",      // UID del padre que lo marcó
  
  // Notas (opcional)
  notes: "Lo logró a los 2 meses y medio",
  
  // Metadata
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

---

## 📊 Categorías de Desarrollo

| Categoría | ID | Descripción | Icono |
|-----------|-------|-------------|-------|
| Social y Emocional | `social` | Interacción con otros, emociones | 👥 |
| Motor Grueso | `motor-grueso` | Movimientos grandes (gatear, caminar) | 🏃 |
| Motor Fino | `motor-fino` | Movimientos pequeños (agarrar, pinza) | ✋ |
| Lenguaje y Comunicación | `lenguaje` | Habla, comprensión | 💬 |
| Cognitivo | `cognitivo` | Pensamiento, aprendizaje, resolución | 🧠 |

---

## 📅 Rangos de Edad

- 0-3 meses
- 3-6 meses
- 6-9 meses
- 9-12 meses
- 12-18 meses
- 18-24 meses
- 2-3 años
- 3-4 años
- 4-5 años

---

## 🔐 Endpoints Admin

### 1. Crear Hito

```http
POST /api/admin/milestones
Authorization: Bearer {admin_token}
```

**Body:**
```json
{
  "title": "Sonríe a las personas",
  "description": "El bebé comienza a sonreír en respuesta a estímulos sociales",
  "category": "social",
  "ageRangeMonths": {
    "min": 0,
    "max": 3
  },
  "order": 1,
  "tips": "Háblale y sonríele frecuentemente al bebé",
  "videoUrl": "https://...",
  "imageUrl": "https://...",
  "isActive": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Hito creado exitosamente",
  "data": {
    "id": "milestone_123",
    "title": "Sonríe a las personas",
    "category": "social",
    "ageRangeMonths": { "min": 0, "max": 3 },
    "createdAt": "2026-02-05T10:00:00Z"
  }
}
```

---

### 2. Listar Todos los Hitos (Admin)

```http
GET /api/admin/milestones
Authorization: Bearer {admin_token}
```

**Query Parameters:**
- `category` - Filtrar por categoría
- `ageMin` - Edad mínima en meses
- `ageMax` - Edad máxima en meses
- `includeInactive` - Incluir inactivos (default: false)
- `page` - Número de página
- `limit` - Items por página

**Ejemplo:**
```bash
GET /api/admin/milestones?category=social&ageMin=0&ageMax=6
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "milestone_123",
      "title": "Sonríe a las personas",
      "description": "...",
      "category": "social",
      "ageRangeMonths": { "min": 0, "max": 3 },
      "order": 1,
      "isActive": true,
      "tips": "...",
      "completionCount": 150,
      "createdAt": "2026-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "total": 45,
    "page": 1,
    "limit": 20,
    "totalPages": 3
  }
}
```

---

### 3. Obtener Hito Específico (Admin)

```http
GET /api/admin/milestones/:milestoneId
Authorization: Bearer {admin_token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "milestone_123",
    "title": "Sonríe a las personas",
    "description": "...",
    "category": "social",
    "ageRangeMonths": { "min": 0, "max": 3 },
    "order": 1,
    "isActive": true,
    "tips": "...",
    "videoUrl": "...",
    "imageUrl": "...",
    "completionCount": 150,
    "completionRate": 75,
    "createdAt": "2026-01-01T00:00:00Z",
    "updatedAt": "2026-02-01T10:00:00Z"
  }
}
```

---

### 4. Actualizar Hito

```http
PUT /api/admin/milestones/:milestoneId
Authorization: Bearer {admin_token}
```

**Body:** (todos los campos opcionales)
```json
{
  "title": "Nuevo título",
  "description": "Nueva descripción",
  "category": "social",
  "ageRangeMonths": { "min": 0, "max": 3 },
  "order": 2,
  "tips": "Nuevos tips",
  "isActive": false
}
```

---

### 5. Eliminar Hito

```http
DELETE /api/admin/milestones/:milestoneId
Authorization: Bearer {admin_token}
```

---

### 6. Estadísticas de Hitos (Admin)

```http
GET /api/admin/milestones/stats/summary
Authorization: Bearer {admin_token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalMilestones": 150,
    "activeMillestones": 145,
    "byCategory": {
      "social": 30,
      "motor-grueso": 25,
      "motor-fino": 20,
      "lenguaje": 35,
      "cognitivo": 35
    },
    "byAgeRange": {
      "0-3": 15,
      "3-6": 18,
      "6-9": 20
    },
    "totalCompletions": 15000,
    "averageCompletionRate": 68
  }
}
```

---

## 📱 Endpoints App (Usuarios)

### 1. Obtener Hitos por Edad del Niño

```http
GET /api/children/:childId/milestones
Authorization: Bearer {token}
```

**Query Parameters:**
- `category` - Filtrar por categoría (opcional)
- `ageBuffer` - Meses extra antes/después (default: 3)

**Ejemplo:**
```bash
GET /api/children/child_123/milestones?category=social
```

**Comportamiento:**
- Calcula la edad actual del niño en meses
- Devuelve hitos del rango de edad ± buffer meses
- Incluye el estado de completado para cada hito

**Response:**
```json
{
  "success": true,
  "data": {
    "childAge": {
      "months": 4,
      "displayAge": "4 meses"
    },
    "ageRange": {
      "min": 1,
      "max": 7
    },
    "milestones": [
      {
        "id": "milestone_123",
        "title": "Sonríe a las personas",
        "description": "...",
        "category": "social",
        "categoryName": "Social y Emocional",
        "ageRangeMonths": { "min": 0, "max": 3 },
        "order": 1,
        "tips": "...",
        "videoUrl": "...",
        "imageUrl": "...",
        
        // Estado del niño
        "completed": true,
        "completedAt": "2026-01-15T10:00:00Z",
        "notes": "Lo logró muy rápido"
      },
      {
        "id": "milestone_124",
        "title": "Levanta la cabeza boca abajo",
        "category": "motor-grueso",
        "completed": false,
        "completedAt": null,
        "notes": null
      }
    ],
    "summary": {
      "total": 25,
      "completed": 18,
      "completionRate": 72
    }
  }
}
```

---

### 2. Obtener Hitos Agrupados por Categoría

```http
GET /api/children/:childId/milestones/by-category
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "childAge": {
      "months": 4,
      "displayAge": "4 meses"
    },
    "categories": [
      {
        "category": "social",
        "categoryName": "Social y Emocional",
        "icon": "👥",
        "milestones": [
          {
            "id": "milestone_123",
            "title": "Sonríe a las personas",
            "completed": true
          }
        ],
        "stats": {
          "total": 5,
          "completed": 4,
          "completionRate": 80
        }
      },
      {
        "category": "motor-grueso",
        "categoryName": "Motor Grueso",
        "icon": "🏃",
        "milestones": [...],
        "stats": {
          "total": 4,
          "completed": 2,
          "completionRate": 50
        }
      }
    ],
    "overall": {
      "total": 25,
      "completed": 18,
      "completionRate": 72
    }
  }
}
```

---

### 3. Marcar Hito como Completado

```http
POST /api/children/:childId/milestones/:milestoneId/complete
Authorization: Bearer {token}
```

**Body:**
```json
{
  "notes": "Lo logró a los 2 meses y medio"
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
    "completedAt": "2026-02-05T16:30:00Z",
    "notes": "Lo logró a los 2 meses y medio"
  }
}
```

---

### 4. Desmarcar Hito (Revertir)

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

### 5. Actualizar Notas de un Hito

```http
PATCH /api/children/:childId/milestones/:milestoneId/notes
Authorization: Bearer {token}
```

**Body:**
```json
{
  "notes": "Actualización: ahora lo hace sin ayuda"
}
```

---

### 6. Reporte de Progreso Completo

```http
GET /api/children/:childId/milestones/progress-report
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "child": {
      "id": "child_123",
      "name": "Sofía",
      "birthDate": "2025-10-15",
      "ageMonths": 4,
      "ageDisplay": "4 meses"
    },
    
    "overallProgress": {
      "totalMilestones": 25,
      "completed": 18,
      "completionRate": 72,
      "lastUpdated": "2026-02-05T16:30:00Z"
    },
    
    "progressByCategory": [
      {
        "category": "social",
        "categoryName": "Social y Emocional",
        "icon": "👥",
        "total": 5,
        "completed": 4,
        "completionRate": 80,
        "color": "#4CAF50"
      },
      {
        "category": "motor-grueso",
        "categoryName": "Motor Grueso",
        "icon": "🏃",
        "total": 4,
        "completed": 2,
        "completionRate": 50,
        "color": "#2196F3"
      },
      {
        "category": "motor-fino",
        "categoryName": "Motor Fino",
        "icon": "✋",
        "total": 3,
        "completed": 3,
        "completionRate": 100,
        "color": "#FF9800"
      },
      {
        "category": "lenguaje",
        "categoryName": "Lenguaje y Comunicación",
        "icon": "💬",
        "total": 6,
        "completed": 4,
        "completionRate": 67,
        "color": "#9C27B0"
      },
      {
        "category": "cognitivo",
        "categoryName": "Cognitivo",
        "icon": "🧠",
        "total": 7,
        "completed": 5,
        "completionRate": 71,
        "color": "#F44336"
      }
    ],
    
    "recentlyCompleted": [
      {
        "milestoneId": "milestone_123",
        "title": "Sonríe a las personas",
        "category": "social",
        "completedAt": "2026-02-05T16:30:00Z",
        "ageAtCompletion": "4 meses"
      }
    ],
    
    "upcomingMilestones": [
      {
        "milestoneId": "milestone_125",
        "title": "Responde a su nombre",
        "category": "lenguaje",
        "expectedAge": "6-9 meses"
      }
    ]
  }
}
```

---

## 🎨 Casos de Uso

### Caso 1: Admin Carga Hitos Iniciales

```bash
# Crear hito de 0-3 meses
POST /api/admin/milestones
{
  "title": "Sonríe a las personas",
  "category": "social",
  "ageRangeMonths": { "min": 0, "max": 3 },
  "order": 1
}

# Crear hito de motor grueso
POST /api/admin/milestones
{
  "title": "Levanta la cabeza boca abajo",
  "category": "motor-grueso",
  "ageRangeMonths": { "min": 0, "max": 3 },
  "order": 1
}
```

---

### Caso 2: Padre Ve Hitos de su Bebé

```bash
# Bebé de 4 meses
GET /api/children/child_123/milestones/by-category

# Response muestra hitos de 0-7 meses agrupados por categoría
# con el estado de completado de cada uno
```

---

### Caso 3: Padre Marca Hito como Completado

```bash
POST /api/children/child_123/milestones/milestone_123/complete
{
  "notes": "¡Primera sonrisa a los 2 meses!"
}
```

---

### Caso 4: Ver Reporte de Progreso

```bash
GET /api/children/child_123/milestones/progress-report

# Response muestra:
# - Progreso general: 72%
# - Progreso por categoría:
#   * Social: 80%
#   * Motor Grueso: 50%
#   * Lenguaje: 67%
# - Últimos hitos completados
# - Próximos hitos esperados
```

---

## 📊 Integración en el Frontend

### Pantalla de Hitos

```typescript
const MilestonesScreen = ({ childId }) => {
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMilestones();
  }, [childId]);

  const loadMilestones = async () => {
    try {
      const response = await fetch(
        `/api/children/${childId}/milestones/by-category`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      const data = await response.json();
      
      if (data.success) {
        setMilestones(data.data.categories);
      }
    } catch (error) {
      console.error('Error cargando hitos:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleMilestone = async (milestoneId, isCompleted) => {
    if (isCompleted) {
      // Desmarcar
      await fetch(
        `/api/children/${childId}/milestones/${milestoneId}/complete`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
    } else {
      // Marcar como completado
      await fetch(
        `/api/children/${childId}/milestones/${milestoneId}/complete`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            notes: ''
          })
        }
      );
    }
    
    // Recargar
    loadMilestones();
  };

  return (
    <View>
      <Text>Edad: {milestones[0]?.childAge}</Text>
      
      {milestones.map(category => (
        <View key={category.category}>
          <Text>{category.icon} {category.categoryName}</Text>
          <ProgressBar 
            progress={category.stats.completionRate} 
            color={category.color}
          />
          
          {category.milestones.map(milestone => (
            <CheckboxItem
              key={milestone.id}
              checked={milestone.completed}
              onPress={() => toggleMilestone(milestone.id, milestone.completed)}
              label={milestone.title}
            />
          ))}
        </View>
      ))}
    </View>
  );
};
```

---

### Pantalla de Reporte de Progreso

```typescript
const ProgressReportScreen = ({ childId }) => {
  const [report, setReport] = useState(null);

  useEffect(() => {
    loadReport();
  }, [childId]);

  const loadReport = async () => {
    const response = await fetch(
      `/api/children/${childId}/milestones/progress-report`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    const data = await response.json();
    
    if (data.success) {
      setReport(data.data);
    }
  };

  return (
    <ScrollView>
      {/* Progreso general */}
      <CircularProgress 
        value={report.overallProgress.completionRate}
        text={`${report.overallProgress.completionRate}%`}
      />
      
      {/* Progreso por categoría */}
      {report.progressByCategory.map(cat => (
        <View key={cat.category}>
          <Text>{cat.icon} {cat.categoryName}</Text>
          <ProgressBar 
            progress={cat.completionRate}
            color={cat.color}
          />
          <Text>{cat.completed}/{cat.total} completados</Text>
        </View>
      ))}
      
      {/* Recientemente completados */}
      <Text>Recientemente Completados:</Text>
      {report.recentlyCompleted.map(m => (
        <MilestoneCard key={m.milestoneId} milestone={m} />
      ))}
      
      {/* Próximos hitos */}
      <Text>Próximos Hitos:</Text>
      {report.upcomingMilestones.map(m => (
        <MilestoneCard key={m.milestoneId} milestone={m} />
      ))}
    </ScrollView>
  );
};
```

---

## 🎨 Dashboard Admin

### Gestión de Hitos

```typescript
const MilestonesManagement = () => {
  const [milestones, setMilestones] = useState([]);
  const [filter, setFilter] = useState({
    category: '',
    ageMin: 0,
    ageMax: 12
  });

  const loadMilestones = async () => {
    const params = new URLSearchParams(filter);
    const response = await fetch(
      `/api/admin/milestones?${params}`,
      {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      }
    );
    const data = await response.json();
    setMilestones(data.data);
  };

  const createMilestone = async (formData) => {
    await fetch('/api/admin/milestones', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    });
    
    loadMilestones();
  };

  return (
    <div>
      <h1>Gestión de Hitos</h1>
      
      {/* Filtros */}
      <Filters onChange={setFilter} />
      
      {/* Botón crear */}
      <button onClick={() => setShowModal(true)}>
        + Nuevo Hito
      </button>
      
      {/* Tabla de hitos */}
      <table>
        <thead>
          <tr>
            <th>Título</th>
            <th>Categoría</th>
            <th>Edad</th>
            <th>Orden</th>
            <th>Completados</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {milestones.map(m => (
            <tr key={m.id}>
              <td>{m.title}</td>
              <td>{m.category}</td>
              <td>{m.ageRangeMonths.min}-{m.ageRangeMonths.max} meses</td>
              <td>{m.order}</td>
              <td>{m.completionCount}</td>
              <td>
                <button onClick={() => editMilestone(m)}>Editar</button>
                <button onClick={() => deleteMilestone(m.id)}>Eliminar</button>
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

## 📝 Resumen

### ✅ Funcionalidades Implementadas

**Admin:**
- ✅ CRUD completo de hitos
- ✅ Filtrado por categoría y edad
- ✅ Estadísticas generales

**App:**
- ✅ Ver hitos según edad del niño
- ✅ Agrupar por categoría
- ✅ Marcar/desmarcar completados
- ✅ Agregar notas
- ✅ Reporte de progreso con %

**Características:**
- ✅ 5 categorías de desarrollo
- ✅ Organización por meses
- ✅ Progreso por categoría
- ✅ Buffer de edad configurable
- ✅ Últimos completados
- ✅ Próximos hitos

---

**Última actualización:** 2026-02-05  
**Versión API:** 1.0
