# 📊 APIs de Estadísticas y Analytics - Munpa Dashboard

## 🔐 Autenticación

Todos los endpoints requieren:
- **Token de Admin**: `Authorization: Bearer {adminToken}`
- **Rol de Admin**: `isAdmin: true` en el perfil del usuario

---

## 📈 Estadísticas Generales

### 1. Dashboard General
**Endpoint:** `GET /api/admin/stats`

**Descripción:** Estadísticas generales de toda la plataforma.

**Response:**
```json
{
  "success": true,
  "data": {
    "users": {
      "total": 15234,
      "activeLastMonth": 8945,
      "newThisMonth": 456
    },
    "communities": {
      "total": 234,
      "activeLastMonth": 189
    },
    "posts": {
      "total": 45678,
      "thisMonth": 3456
    },
    "marketplace": {
      "totalProducts": 2345,
      "activeProducts": 1876
    }
  }
}
```

---

## 👥 Estadísticas de Usuarios

### 2. Versiones de App y Plataformas
**Endpoint:** `GET /api/admin/analytics/app-versions`

**Descripción:** Distribución de versiones de app, plataformas (iOS/Android) y dispositivos.

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalUsers": 1542,
      "platforms": {
        "ios": 843,
        "android": 699,
        "unknown": 0
      },
      "mostUsedVersion": "1.2.3",
      "mostUsedVersionCount": 876
    },
    "versions": [
      {
        "version": "1.2.3",
        "count": 876,
        "percentage": "56.81"
      }
    ],
    "osVersions": [
      {
        "os": "ios-17.2",
        "count": 324,
        "percentage": "21.01"
      }
    ],
    "recentDevices": [...]
  }
}
```

### 3. Buscar Usuarios por App/Versión
**Endpoint:** `GET /api/admin/analytics/users-by-app`

**Query Parameters:**
- `platform`: `ios` | `android`
- `version`: Versión exacta (ej: `1.2.0`)
- `minVersion`: Usuarios con versión anterior

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 234,
    "users": [
      {
        "id": "user_123",
        "email": "usuario@example.com",
        "deviceInfo": {
          "appVersion": "1.2.0",
          "platform": "ios",
          ...
        }
      }
    ]
  }
}
```

---

## 🛍️ Estadísticas de Marketplace

### 4. Estadísticas de Marketplace
**Endpoint:** `GET /api/admin/marketplace/stats`

**Descripción:** Estadísticas de productos, categorías y transacciones.

**Response:**
```json
{
  "success": true,
  "data": {
    "products": {
      "total": 2345,
      "active": 1876,
      "sold": 456,
      "donated": 123,
      "exchanged": 89
    },
    "byCategory": {
      "ropa": 876,
      "juguetes": 654,
      "transporte": 432
    },
    "byCondition": {
      "nuevo": 234,
      "como_nuevo": 876,
      "usado": 1235
    },
    "revenue": {
      "thisMonth": 45000,
      "total": 456000
    }
  }
}
```

**Nota:** Hay dos definiciones de este endpoint (líneas 26581 y 28081), verificar cuál se está usando.

---

## 🎉 Estadísticas de Eventos

### 5. Resumen de Eventos
**Endpoint:** `GET /api/admin/events/stats/summary`

**Descripción:** Estadísticas de eventos de comunidad.

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 456,
    "upcoming": 123,
    "past": 333,
    "cancelled": 12,
    "byType": {
      "presencial": 234,
      "virtual": 156,
      "hibrido": 66
    },
    "totalAttendees": 5678,
    "averageAttendeesPerEvent": 12.4,
    "popularCommunities": [
      {
        "communityId": "comm_123",
        "communityName": "Mamás Primerizas",
        "eventCount": 45
      }
    ]
  }
}
```

---

## 💡 Estadísticas de Recomendaciones

### 6. Analytics de Recomendaciones
**Endpoint:** `GET /api/admin/analytics/recommendations`

**Descripción:** Estadísticas de recomendaciones de lugares/productos.

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 3456,
    "byType": {
      "restaurante": 876,
      "parque": 654,
      "tienda": 432,
      "servicio": 321
    },
    "averageRating": 4.3,
    "totalReviews": 12345,
    "topRated": [
      {
        "id": "rec_123",
        "name": "Restaurante Family",
        "rating": 4.9,
        "reviewCount": 234
      }
    ]
  }
}
```

---

## 🎨 Estadísticas de UI/UX

### 7. Analytics de Interfaz
**Endpoint:** `GET /api/admin/analytics/ui`

**Descripción:** Tracking de interacciones en la UI (clicks, vistas de pantallas, etc.).

**Response:**
```json
{
  "success": true,
  "data": {
    "screenViews": {
      "home": 45678,
      "marketplace": 23456,
      "communities": 12345
    },
    "buttonClicks": {
      "addToCart": 3456,
      "sharePost": 2345,
      "joinCommunity": 1234
    },
    "averageSessionDuration": 420,
    "bounceRate": "23.4%"
  }
}
```

---

## 🔗 Estadísticas de DeepLinks

### 8. Analytics de DeepLinks
**Endpoint:** `GET /api/admin/analytics/deeplinks`

**Descripción:** Estadísticas de links compartidos y accedidos.

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 5678,
    "byType": {
      "product": 2345,
      "community": 1876,
      "event": 987,
      "post": 470
    },
    "clickThroughRate": "34.5%",
    "topLinks": [
      {
        "url": "/products/abc123",
        "clicks": 456,
        "shares": 123
      }
    ]
  }
}
```

---

## 🔔 Estadísticas de Notificaciones

### 9. Estadísticas de Notificaciones
**Endpoint:** `GET /api/admin/notifications/stats`

**Descripción:** Estadísticas de notificaciones enviadas y engagement.

**Response:**
```json
{
  "success": true,
  "data": {
    "sent": {
      "total": 234567,
      "thisMonth": 12345,
      "today": 456
    },
    "byType": {
      "newPost": 45678,
      "eventReminder": 23456,
      "productSold": 12345,
      "newFollower": 8765
    },
    "engagement": {
      "opened": 123456,
      "clicked": 45678,
      "openRate": "52.7%",
      "clickRate": "19.5%"
    },
    "failed": 234
  }
}
```

---

## ⏰ Estadísticas de Recordatorios

### 10. Estadísticas de Recordatorios
**Endpoint:** `GET /api/admin/reminders/stats`

**Descripción:** Estadísticas de recordatorios de vacunas, citas, etc.

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 8765,
    "active": 3456,
    "completed": 5309,
    "byType": {
      "vaccine": 4567,
      "appointment": 2345,
      "milestone": 1853
    },
    "completionRate": "60.5%",
    "averageResponseTime": "2.3 días"
  }
}
```

---

## ⭐ Estadísticas de Engagement

### 11. Engagement y Retención
**Endpoint:** `GET /api/admin/analytics/engagement`

**Descripción:** Métricas avanzadas de engagement de usuarios.

**Response:**
```json
{
  "success": true,
  "data": {
    "activeUsers": {
      "dau": 123,
      "wau": 456,
      "mau": 789,
      "dauMauRatio": "15.59"
    },
    "retention": {
      "rate": "45.67%",
      "usersReturned": 234
    },
    "churn": {
      "rate": "23.45%",
      "inactiveUsers": 120
    },
    "contentEngagement": {
      "totalPosts": 3456,
      "totalLikes": 12345,
      "totalComments": 5678,
      "totalShares": 890,
      "avgEngagementPerPost": "5.43"
    }
  }
}
```

---

## 📈 Crecimiento

### 12. Crecimiento Histórico
**Endpoint:** `GET /api/admin/analytics/growth`

**Query Parameters:**
- `period`: `day` | `week` | `month` (default: `month`)

**Descripción:** Crecimiento de usuarios en el tiempo.

**Response:**
```json
{
  "success": true,
  "data": {
    "period": "month",
    "growth": [
      {
        "date": "2025-01",
        "newUsers": 45,
        "totalUsers": 45
      },
      {
        "date": "2025-02",
        "newUsers": 67,
        "totalUsers": 112
      }
    ],
    "summary": {
      "totalUsers": 1542,
      "periodsWithData": 12,
      "avgNewUsersPerPeriod": "128.50",
      "mostActiveDate": {
        "date": "2025-06",
        "newUsers": 234
      }
    }
  }
}
```

---

## 📝 Estadísticas de Contenido

### 13. Contenido Más Popular
**Endpoint:** `GET /api/admin/analytics/content`

**Query Parameters:**
- `limit`: Número de posts a devolver (default: 20)
- `orderBy`: `likes` | `comments` | `engagement` | `views` (default: `likes`)

**Descripción:** Posts más populares y estadísticas de contenido.

**Response:**
```json
{
  "success": true,
  "data": {
    "topPosts": [
      {
        "id": "post_123",
        "content": "Contenido del post...",
        "authorId": "user_456",
        "communityId": "comm_789",
        "postType": "normal",
        "likes": 234,
        "comments": 45,
        "shares": 12,
        "views": 1234,
        "engagementScore": 345,
        "engagementRate": "23.56%",
        "createdAt": "2025-02-01T..."
      }
    ],
    "summary": {
      "totalPosts": 3456,
      "avgLikes": "12.34",
      "avgComments": "5.67",
      "byType": {
        "normal": 2345,
        "event": 876,
        "poll": 235
      },
      "topCommunities": [
        {
          "communityId": "comm_123",
          "postCount": 567
        }
      ]
    }
  }
}
```

---

## 🎨 Estadísticas de Banners

### 14. Analytics de Banners
**Endpoint:** `GET /api/admin/analytics/banners`

**Descripción:** Estadísticas de rendimiento de banners.

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "total": 45,
      "active": 23,
      "inactive": 22,
      "totalViews": 12345,
      "totalClicks": 567,
      "overallCTR": "4.59%"
    },
    "bySection": {
      "home": {
        "total": 10,
        "active": 5,
        "views": 5678,
        "clicks": 234,
        "ctr": "4.12"
      },
      "marketplace": {
        "total": 8,
        "active": 4,
        "views": 3456,
        "clicks": 123,
        "ctr": "3.56"
      },
      "nutricion": {
        "total": 6,
        "active": 3,
        "views": 2345,
        "clicks": 89,
        "ctr": "3.79"
      }
    },
    "topBanners": [
      {
        "id": "banner_123",
        "title": "Promoción Especial",
        "section": "home",
        "views": 2345,
        "clicks": 123,
        "ctr": "5.24",
        "isActive": true
      }
    ]
  }
}
```

---

## 🎯 Estadísticas de Hitos de Desarrollo

### 15. Analytics de Hitos
**Endpoint:** `GET /api/admin/analytics/milestones`

**Descripción:** Estadísticas de hitos de desarrollo infantil.

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalMilestones": 480,
      "totalCategories": 5,
      "totalChildren": 234,
      "totalCompletions": 5678,
      "avgCompletionPerChild": "24.26"
    },
    "byCategory": [
      {
        "categoryId": "cat_123",
        "categoryName": "Motor Grueso",
        "totalMilestones": 96,
        "completedCount": 1234,
        "avgCompletionRate": "54.89%"
      },
      {
        "categoryId": "cat_456",
        "categoryName": "Lenguaje",
        "totalMilestones": 96,
        "completedCount": 1123,
        "avgCompletionRate": "49.92%"
      }
    ]
  }
}
```

---

## 💬 Estadísticas de FAQ

### 16. Analytics de Consultas FAQ
**Endpoint:** `GET /api/admin/analytics/faq`

**Descripción:** Estadísticas de consultas a OpenAI.

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalQueries": 1234,
      "uniqueUsers": 456,
      "avgQueriesPerUser": "2.70"
    },
    "queryTypes": {
      "salud": 234,
      "alimentacion": 345,
      "sueno": 123,
      "desarrollo": 234,
      "comportamiento": 178,
      "otro": 120
    },
    "byDayOfWeek": {
      "domingo": 123,
      "lunes": 234,
      "martes": 178,
      "miercoles": 156,
      "jueves": 189,
      "viernes": 167,
      "sabado": 187
    },
    "topUsers": [
      {
        "userId": "user_123",
        "queryCount": 45
      }
    ],
    "recentQueries": [
      {
        "id": "faq_123",
        "question": "¿Cuándo debería mi bebé empezar a gatear?",
        "userId": "user_456",
        "createdAt": "2025-02-07T..."
      }
    ]
  }
}
```

---

## 📊 Resumen de Todos los Endpoints

### Endpoints Disponibles:

| # | Endpoint | Descripción |
|---|----------|-------------|
| 1 | `GET /api/admin/stats` | Dashboard general |
| 2 | `GET /api/admin/analytics/app-versions` | Versiones de app |
| 3 | `GET /api/admin/analytics/users-by-app` | Buscar usuarios por app |
| 4 | `GET /api/admin/marketplace/stats` | Stats marketplace |
| 5 | `GET /api/admin/events/stats/summary` | Stats eventos |
| 6 | `GET /api/admin/analytics/recommendations` | Stats recomendaciones |
| 7 | `GET /api/admin/analytics/ui` | Analytics UI/UX |
| 8 | `GET /api/admin/analytics/deeplinks` | Stats deeplinks |
| 9 | `GET /api/admin/notifications/stats` | Stats notificaciones |
| 10 | `GET /api/admin/reminders/stats` | Stats recordatorios |
| 11 | `GET /api/admin/analytics/engagement` | ⭐ **NUEVO**: Engagement y retención |
| 12 | `GET /api/admin/analytics/growth` | ⭐ **NUEVO**: Crecimiento histórico |
| 13 | `GET /api/admin/analytics/content` | ⭐ **NUEVO**: Contenido popular |
| 14 | `GET /api/admin/analytics/banners` | ⭐ **NUEVO**: Analytics de banners |
| 15 | `GET /api/admin/analytics/milestones` | ⭐ **NUEVO**: Stats de hitos |
| 16 | `GET /api/admin/analytics/faq` | ⭐ **NUEVO**: Stats de consultas FAQ |

---

## 🎯 Endpoints Adicionales Útiles

### Gestión de Usuarios
```bash
GET /api/admin/users              # Lista de usuarios con paginación
GET /api/admin/users/:userId      # Detalles de un usuario específico
```

### Gestión de Comunidades
```bash
GET /api/admin/communities        # Lista de comunidades
GET /api/admin/communities/:id    # Detalles de comunidad
```

### Gestión de Eventos
```bash
GET /api/admin/events             # Lista de eventos
GET /api/admin/events/:eventId    # Detalles de evento
```

### Gestión de Productos
```bash
GET /api/admin/marketplace/products    # Lista de productos
GET /api/admin/marketplace/products/:id # Detalles de producto
```

---

## 📱 Ejemplo de Uso en Dashboard

```javascript
const DashboardStats = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Cargar estadísticas en paralelo
        const [
          generalStats,
          engagementStats,
          growthStats,
          contentStats,
          appVersions,
          marketplaceStats,
          eventsStats,
          bannersStats,
          milestonesStats,
          faqStats,
          notificationStats
        ] = await Promise.all([
          apiClient.get('/api/admin/stats'),
          apiClient.get('/api/admin/analytics/engagement'),
          apiClient.get('/api/admin/analytics/growth', { params: { period: 'month' }}),
          apiClient.get('/api/admin/analytics/content', { params: { limit: 10 }}),
          apiClient.get('/api/admin/analytics/app-versions'),
          apiClient.get('/api/admin/marketplace/stats'),
          apiClient.get('/api/admin/events/stats/summary'),
          apiClient.get('/api/admin/analytics/banners'),
          apiClient.get('/api/admin/analytics/milestones'),
          apiClient.get('/api/admin/analytics/faq'),
          apiClient.get('/api/admin/notifications/stats')
        ]);

        setStats({
          general: generalStats.data.data,
          engagement: engagementStats.data.data,
          growth: growthStats.data.data,
          content: contentStats.data.data,
          appVersions: appVersions.data.data,
          marketplace: marketplaceStats.data.data,
          events: eventsStats.data.data,
          banners: bannersStats.data.data,
          milestones: milestonesStats.data.data,
          faq: faqStats.data.data,
          notifications: notificationStats.data.data
        });
      } catch (error) {
        console.error('Error cargando stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) return <Spinner />;

  return (
    <div className="dashboard">
      <h1>📊 Dashboard de Munpa</h1>
      
      {/* KPIs Principales */}
      <div className="kpi-grid">
        <StatCard 
          title="Usuarios Totales" 
          value={stats.general.users.total}
          trend={`+${stats.growth.summary.avgNewUsersPerPeriod} por mes`}
        />
        
        <StatCard 
          title="DAU" 
          value={stats.engagement.activeUsers.dau}
          subtitle="Usuarios activos diarios"
        />
        
        <StatCard 
          title="MAU" 
          value={stats.engagement.activeUsers.mau}
          subtitle="Usuarios activos mensuales"
        />

        <StatCard 
          title="Retención" 
          value={stats.engagement.retention.rate}
          color="success"
        />

        <StatCard 
          title="Churn Rate" 
          value={stats.engagement.churn.rate}
          color="danger"
        />

        <StatCard 
          title="Posts Totales" 
          value={stats.content.summary.totalPosts}
          trend={`Avg ${stats.content.summary.avgLikes} likes`}
        />

        <StatCard 
          title="Engagement Promedio" 
          value={stats.engagement.contentEngagement.avgEngagementPerPost}
          subtitle="por post"
        />

        <StatCard 
          title="Eventos Próximos" 
          value={stats.events.upcoming}
        />
      </div>

      {/* Gráfico de Crecimiento */}
      <Card title="Crecimiento de Usuarios">
        <LineChart 
          data={stats.growth.growth}
          xKey="date"
          yKey="totalUsers"
          title="Usuarios Acumulados"
        />
      </Card>

      {/* Distribución de Plataformas */}
      <Card title="Plataformas y Versiones">
        <div className="chart-grid">
          <PieChart 
            data={[
              { name: 'iOS', value: stats.appVersions.summary.platforms.ios },
              { name: 'Android', value: stats.appVersions.summary.platforms.android }
            ]}
            title="Plataformas"
          />
          
          <BarChart 
            data={stats.appVersions.versions.slice(0, 5)}
            xKey="version"
            yKey="count"
            title="Top 5 Versiones"
          />
        </div>
      </Card>

      {/* Top Posts */}
      <Card title="Posts Más Populares">
        <Table
          columns={[
            { header: 'Contenido', key: 'content' },
            { header: 'Likes', key: 'likes' },
            { header: 'Comentarios', key: 'comments' },
            { header: 'Shares', key: 'shares' },
            { header: 'Engagement', key: 'engagementRate' }
          ]}
          data={stats.content.topPosts}
        />
      </Card>

      {/* Banners Performance */}
      <Card title="Rendimiento de Banners">
        <div className="stats-row">
          <Metric label="CTR Global" value={stats.banners.summary.overallCTR} />
          <Metric label="Total Vistas" value={stats.banners.summary.totalViews} />
          <Metric label="Total Clicks" value={stats.banners.summary.totalClicks} />
          <Metric label="Banners Activos" value={stats.banners.summary.active} />
        </div>
        
        <h3>Por Sección</h3>
        <Table
          columns={[
            { header: 'Sección', key: 'section' },
            { header: 'Activos', key: 'active' },
            { header: 'Vistas', key: 'views' },
            { header: 'Clicks', key: 'clicks' },
            { header: 'CTR', key: 'ctr' }
          ]}
          data={Object.entries(stats.banners.bySection).map(([section, data]) => ({
            section,
            ...data
          }))}
        />
      </Card>

      {/* Hitos de Desarrollo */}
      <Card title="Hitos de Desarrollo">
        <div className="stats-row">
          <Metric 
            label="Total Hitos" 
            value={stats.milestones.summary.totalMilestones} 
          />
          <Metric 
            label="Completados" 
            value={stats.milestones.summary.totalCompletions} 
          />
          <Metric 
            label="Promedio por Niño" 
            value={stats.milestones.summary.avgCompletionPerChild} 
          />
        </div>
        
        <BarChart 
          data={stats.milestones.byCategory}
          xKey="categoryName"
          yKey="completedCount"
          title="Completados por Categoría"
        />
      </Card>

      {/* FAQ Analytics */}
      <Card title="Consultas FAQ (OpenAI)">
        <div className="stats-row">
          <Metric label="Total Consultas" value={stats.faq.summary.totalQueries} />
          <Metric label="Usuarios Únicos" value={stats.faq.summary.uniqueUsers} />
          <Metric label="Promedio por Usuario" value={stats.faq.summary.avgQueriesPerUser} />
        </div>

        <div className="chart-grid">
          <PieChart 
            data={Object.entries(stats.faq.queryTypes).map(([type, count]) => ({
              name: type,
              value: count
            }))}
            title="Tipos de Consultas"
          />

          <BarChart 
            data={Object.entries(stats.faq.byDayOfWeek).map(([day, count]) => ({
              day,
              count
            }))}
            xKey="day"
            yKey="count"
            title="Consultas por Día"
          />
        </div>

        <h3>Últimas Consultas</h3>
        <ul>
          {stats.faq.recentQueries.map(query => (
            <li key={query.id}>{query.question}</li>
          ))}
        </ul>
      </Card>

      {/* Marketplace */}
      <Card title="Marketplace">
        <div className="stats-row">
          <Metric label="Productos Totales" value={stats.marketplace.products.total} />
          <Metric label="Productos Activos" value={stats.marketplace.products.active} />
          <Metric label="Vendidos" value={stats.marketplace.products.sold} />
          <Metric label="Donados" value={stats.marketplace.products.donated} />
        </div>
      </Card>

      {/* Notificaciones */}
      <Card title="Notificaciones">
        <div className="stats-row">
          <Metric label="Enviadas (Mes)" value={stats.notifications.sent.thisMonth} />
          <Metric label="Tasa de Apertura" value={stats.notifications.engagement.openRate} />
          <Metric label="Tasa de Click" value={stats.notifications.engagement.clickRate} />
        </div>
      </Card>
    </div>
  );
};

export default DashboardStats;
```

### Componentes Auxiliares

```javascript
// StatCard.jsx
const StatCard = ({ title, value, subtitle, trend, color = 'primary' }) => (
  <div className={`stat-card stat-card-${color}`}>
    <h3>{title}</h3>
    <div className="stat-value">{value}</div>
    {subtitle && <div className="stat-subtitle">{subtitle}</div>}
    {trend && <div className="stat-trend">{trend}</div>}
  </div>
);

// Metric.jsx
const Metric = ({ label, value }) => (
  <div className="metric">
    <span className="metric-label">{label}</span>
    <span className="metric-value">{value}</span>
  </div>
);
```

---

## 🔍 Filtros y Parámetros Comunes

La mayoría de endpoints de listado soportan:
- `page`: Número de página (default: 1)
- `limit`: Items por página (default: 20)
- `search`: Búsqueda por texto
- `orderBy`: Campo para ordenar
- `order`: `asc` | `desc`

Ejemplo:
```bash
GET /api/admin/users?page=1&limit=50&search=juan&orderBy=createdAt&order=desc
```

---

## 📊 KPIs Clave a Monitorear

### Engagement
- **DAU/MAU** (Daily/Monthly Active Users)
- **Session Duration** (Duración promedio de sesión)
- **Retention Rate** (Tasa de retención)
- **Churn Rate** (Tasa de abandono)

### Contenido
- **Posts por día**
- **Engagement por post** (likes, comentarios, shares)
- **Top comunidades** (más activas)
- **Top eventos** (más asistentes)

### Marketplace
- **Conversion Rate** (Tasa de conversión)
- **Average Order Value** (Valor promedio de orden)
- **Products Added vs Sold**
- **Top Categories**

### App Health
- **Version Adoption Rate** (Adopción de última versión)
- **Crash Rate** (Tasa de crashes)
- **API Response Times**
- **Error Rate**

---

## 🚀 Mejoras Sugeridas

### Endpoints que Podrían Agregarse:

1. **`GET /api/admin/analytics/engagement`**
   - DAU/MAU, retention, churn
   
2. **`GET /api/admin/analytics/content`**
   - Posts más populares, engagement rates
   
3. **`GET /api/admin/analytics/revenue`**
   - Ingresos por categoría, trending
   
4. **`GET /api/admin/analytics/growth`**
   - Crecimiento de usuarios en el tiempo
   
5. **`GET /api/admin/analytics/health`**
   - Performance, errores, uptime

---

## 📞 Soporte

Si necesitas agregar más endpoints de estadísticas o modificar los existentes, házmelo saber!
