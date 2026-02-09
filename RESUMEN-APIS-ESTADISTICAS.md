# 📊 Resumen Completo - APIs de Estadísticas Munpa

> Última actualización: 7 Feb 2026  
> 🚀 **16 Endpoints de Estadísticas Disponibles**

---

## 🎯 Quick Reference

### Por Categoría

#### 👥 **Usuarios** (3 endpoints)
- `GET /api/admin/stats` - Dashboard general
- `GET /api/admin/analytics/app-versions` - Versiones de app y plataformas
- `GET /api/admin/analytics/users-by-app` - Buscar usuarios por versión

#### 📈 **Engagement & Growth** (3 endpoints)
- `GET /api/admin/analytics/engagement` - DAU/MAU/Retención/Churn
- `GET /api/admin/analytics/growth` - Crecimiento histórico
- `GET /api/admin/analytics/content` - Posts más populares

#### 🛍️ **Marketplace** (1 endpoint)
- `GET /api/admin/marketplace/stats` - Productos, categorías, ventas

#### 🎉 **Eventos** (1 endpoint)
- `GET /api/admin/events/stats/summary` - Eventos, asistentes, comunidades

#### 🎨 **Marketing & UI** (4 endpoints)
- `GET /api/admin/analytics/banners` - Rendimiento de banners
- `GET /api/admin/analytics/ui` - Tracking de UI/UX
- `GET /api/admin/analytics/deeplinks` - Links compartidos
- `GET /api/admin/analytics/recommendations` - Recomendaciones de lugares

#### 🔔 **Comunicación** (2 endpoints)
- `GET /api/admin/notifications/stats` - Notificaciones enviadas
- `GET /api/admin/reminders/stats` - Recordatorios

#### 👶 **Desarrollo Infantil** (2 endpoints)
- `GET /api/admin/analytics/milestones` - Hitos de desarrollo
- `GET /api/admin/analytics/faq` - Consultas con OpenAI

---

## 📋 Tabla Completa de Endpoints

| # | Endpoint | Categoría | Descripción | Query Params |
|---|----------|-----------|-------------|--------------|
| 1 | `/api/admin/stats` | General | Dashboard general con todos los totales | - |
| 2 | `/api/admin/analytics/engagement` | Usuarios | DAU, MAU, retención, churn, engagement | - |
| 3 | `/api/admin/analytics/growth` | Usuarios | Crecimiento histórico de usuarios | `period` |
| 4 | `/api/admin/analytics/app-versions` | Usuarios | Distribución de versiones y plataformas | - |
| 5 | `/api/admin/analytics/users-by-app` | Usuarios | Buscar usuarios por app/versión | `platform`, `version`, `minVersion` |
| 6 | `/api/admin/analytics/content` | Contenido | Posts más populares y estadísticas | `limit`, `orderBy` |
| 7 | `/api/admin/marketplace/stats` | Marketplace | Productos, categorías, transacciones | - |
| 8 | `/api/admin/events/stats/summary` | Eventos | Resumen de eventos de comunidad | - |
| 9 | `/api/admin/analytics/banners` | Marketing | Rendimiento de banners (views, clicks, CTR) | - |
| 10 | `/api/admin/analytics/recommendations` | Marketing | Estadísticas de recomendaciones | `startDate`, `endDate`, `limit` |
| 11 | `/api/admin/analytics/ui` | Marketing | Tracking de pantallas y botones | `page`, `button` |
| 12 | `/api/admin/analytics/deeplinks` | Marketing | Estadísticas de links compartidos | - |
| 13 | `/api/admin/notifications/stats` | Comunicación | Notificaciones enviadas y engagement | - |
| 14 | `/api/admin/reminders/stats` | Comunicación | Recordatorios de vacunas, citas | - |
| 15 | `/api/admin/analytics/milestones` | Desarrollo | Hitos completados por categoría | - |
| 16 | `/api/admin/analytics/faq` | Desarrollo | Consultas FAQ con OpenAI | - |

---

## 🎯 KPIs Principales por Endpoint

### 1. Dashboard General (`/api/admin/stats`)
```
✅ Total de usuarios
✅ Usuarios activos/inactivos (30 días)
✅ Total de hijos
✅ Total de comunidades
✅ Total de posts
✅ Posts recientes (7 días)
✅ Total de listas
```

### 2. Engagement (`/api/admin/analytics/engagement`)
```
✅ DAU (Daily Active Users)
✅ WAU (Weekly Active Users)
✅ MAU (Monthly Active Users)
✅ DAU/MAU Ratio
✅ Retention Rate
✅ Churn Rate
✅ Engagement por post (likes, comments, shares)
```

### 3. Crecimiento (`/api/admin/analytics/growth`)
```
✅ Nuevos usuarios por período (día/semana/mes)
✅ Total acumulado
✅ Promedio de nuevos usuarios
✅ Fecha más activa
```

### 4. Versiones de App (`/api/admin/analytics/app-versions`)
```
✅ Total de usuarios con device info
✅ Distribución iOS vs Android
✅ Versión más usada
✅ Distribución de versiones de app
✅ Distribución de versiones de SO
✅ Dispositivos recientes
```

### 5. Usuarios por App (`/api/admin/analytics/users-by-app`)
```
✅ Filtrar por plataforma (iOS/Android)
✅ Filtrar por versión exacta
✅ Filtrar por versión mínima
✅ Lista de usuarios con device info completa
```

### 6. Contenido Popular (`/api/admin/analytics/content`)
```
✅ Top posts por likes, comments, engagement o views
✅ Engagement score ponderado
✅ Engagement rate (%)
✅ Distribución por tipo de post
✅ Top 10 comunidades más activas
✅ Promedios de likes y comentarios
```

### 7. Marketplace (`/api/admin/marketplace/stats`)
```
✅ Total de productos
✅ Productos activos
✅ Productos vendidos/donados/intercambiados
✅ Distribución por categoría
✅ Distribución por condición
✅ Ingresos del mes/total
```

### 8. Eventos (`/api/admin/events/stats/summary`)
```
✅ Total de eventos
✅ Eventos próximos/pasados/cancelados
✅ Distribución por tipo (presencial/virtual/híbrido)
✅ Total de asistentes
✅ Promedio de asistentes por evento
✅ Comunidades con más eventos
```

### 9. Banners (`/api/admin/analytics/banners`)
```
✅ Total de banners (activos/inactivos)
✅ Total de vistas y clicks
✅ CTR global
✅ Estadísticas por sección (home, marketplace, nutricion, etc.)
✅ Top 10 banners por clicks
✅ CTR por sección
```

### 10. Recomendaciones (`/api/admin/analytics/recommendations`)
```
✅ Total de recomendaciones
✅ Distribución por tipo (restaurante, parque, tienda, servicio)
✅ Rating promedio
✅ Total de reviews
✅ Top recomendaciones mejor calificadas
```

### 11. UI Analytics (`/api/admin/analytics/ui`)
```
✅ Vistas por pantalla
✅ Clicks por botón
✅ Duración promedio de sesión
✅ Bounce rate
```

### 12. DeepLinks (`/api/admin/analytics/deeplinks`)
```
✅ Total de links compartidos
✅ Distribución por tipo (product, community, event, post)
✅ Click-through rate
✅ Top links más compartidos
```

### 13. Notificaciones (`/api/admin/notifications/stats`)
```
✅ Notificaciones enviadas (total/mes/hoy)
✅ Distribución por tipo
✅ Notificaciones abiertas/clickeadas
✅ Open rate y click rate
✅ Notificaciones fallidas
```

### 14. Recordatorios (`/api/admin/reminders/stats`)
```
✅ Total de recordatorios
✅ Recordatorios activos/completados
✅ Distribución por tipo (vacuna, cita, hito)
✅ Completion rate
✅ Tiempo promedio de respuesta
```

### 15. Hitos de Desarrollo (`/api/admin/analytics/milestones`)
```
✅ Total de hitos disponibles
✅ Total de categorías
✅ Total de niños
✅ Total de hitos completados
✅ Promedio de completados por niño
✅ Completados por categoría
✅ Tasa de completación promedio por categoría
```

### 16. FAQ Consultas (`/api/admin/analytics/faq`)
```
✅ Total de consultas
✅ Usuarios únicos que consultaron
✅ Promedio de consultas por usuario
✅ Distribución por tipo (salud, alimentación, sueño, etc.)
✅ Consultas por día de la semana
✅ Top 10 usuarios más activos
✅ Últimas 10 consultas
```

---

## 🚀 Orden Recomendado para el Dashboard

### Página Principal (Home)
1. **Hero Stats**
   - `/api/admin/stats` - Dashboard general
   - `/api/admin/analytics/engagement` - DAU, MAU, Retention

2. **Gráficos Principales**
   - `/api/admin/analytics/growth` - Gráfico de crecimiento
   - `/api/admin/analytics/app-versions` - Distribución de plataformas

### Pestaña Usuarios
1. `/api/admin/analytics/engagement` - Engagement completo
2. `/api/admin/analytics/growth` - Crecimiento histórico
3. `/api/admin/analytics/app-versions` - Versiones y dispositivos
4. `/api/admin/analytics/users-by-app` - Búsqueda avanzada

### Pestaña Contenido
1. `/api/admin/analytics/content` - Posts populares
2. `/api/admin/events/stats/summary` - Eventos
3. `/api/admin/analytics/ui` - Interacciones UI

### Pestaña Marketplace
1. `/api/admin/marketplace/stats` - Estadísticas completas
2. `/api/admin/analytics/recommendations` - Recomendaciones

### Pestaña Marketing
1. `/api/admin/analytics/banners` - Rendimiento de banners
2. `/api/admin/analytics/deeplinks` - Links compartidos
3. `/api/admin/notifications/stats` - Notificaciones

### Pestaña Desarrollo Infantil
1. `/api/admin/analytics/milestones` - Progreso de hitos
2. `/api/admin/analytics/faq` - Consultas con IA
3. `/api/admin/reminders/stats` - Recordatorios

---

## 💡 Tips de Implementación

### Caching
Para optimizar el rendimiento, considera cachear las respuestas:

```javascript
// React Query
const { data: stats } = useQuery(
  'admin-stats', 
  fetchStats,
  { 
    staleTime: 5 * 60 * 1000, // 5 minutos
    cacheTime: 10 * 60 * 1000 // 10 minutos
  }
);
```

### Polling para datos en tiempo real
```javascript
const { data } = useQuery(
  'engagement-stats',
  fetchEngagement,
  { 
    refetchInterval: 60000 // Actualizar cada minuto
  }
);
```

### Cargar datos en paralelo
```javascript
const fetchAllStats = async () => {
  const results = await Promise.allSettled([
    fetch('/api/admin/stats'),
    fetch('/api/admin/analytics/engagement'),
    fetch('/api/admin/analytics/growth')
  ]);
  
  return results.map(r => r.status === 'fulfilled' ? r.value : null);
};
```

### Manejo de errores
```javascript
try {
  const stats = await fetchStats();
  setData(stats);
} catch (error) {
  if (error.response?.status === 401) {
    // Redirigir a login
  } else if (error.response?.status === 403) {
    // No tiene permisos de admin
  } else {
    // Error genérico
    showErrorToast('Error cargando estadísticas');
  }
}
```

---

## 📊 Ejemplos de Visualizaciones

### Gráfico de Líneas (Crecimiento)
```javascript
<LineChart
  data={growthData.growth}
  xKey="date"
  yKey="totalUsers"
  title="Crecimiento de Usuarios"
/>
```

### Gráfico de Barras (Engagement por Categoría)
```javascript
<BarChart
  data={milestonesData.byCategory}
  xKey="categoryName"
  yKey="completedCount"
  title="Hitos Completados por Categoría"
/>
```

### Gráfico de Pie (Plataformas)
```javascript
<PieChart
  data={[
    { name: 'iOS', value: appVersions.summary.platforms.ios },
    { name: 'Android', value: appVersions.summary.platforms.android }
  ]}
  title="Distribución de Plataformas"
/>
```

### Tabla (Top Posts)
```javascript
<Table
  columns={[
    { header: 'Contenido', key: 'content' },
    { header: 'Likes', key: 'likes' },
    { header: 'Engagement', key: 'engagementRate' }
  ]}
  data={contentData.topPosts}
/>
```

---

## 🔒 Seguridad

Todos los endpoints requieren:
- ✅ Token de autenticación válido
- ✅ Rol de administrador (`isAdmin: true`)

```javascript
// Headers requeridos
{
  'Authorization': 'Bearer {JWT_ADMIN_TOKEN}',
  'Content-Type': 'application/json'
}
```

---

## 🎨 Paleta de Colores Sugerida

### KPIs
- **Éxito/Positivo**: Verde (#10B981) - Retención, Engagement
- **Alerta/Negativo**: Rojo (#EF4444) - Churn, Errores
- **Neutro**: Azul (#3B82F6) - Totales, Conteos
- **Información**: Amarillo (#F59E0B) - Promedios, Pendientes

### Gráficos
- **Primario**: #6366F1 (Índigo)
- **Secundario**: #EC4899 (Rosa)
- **Terciario**: #10B981 (Verde)
- **Cuaternario**: #F59E0B (Amarillo)

---

## 📞 Documentación Completa

Para información detallada sobre cada endpoint, consulta:
- 📄 `API-ESTADISTICAS-ADMIN.md` - Documentación completa de todos los endpoints

---

## ✅ Checklist de Implementación

### Fase 1: Dashboard Básico
- [ ] Implementar `/api/admin/stats`
- [ ] Crear tarjetas de KPIs principales
- [ ] Mostrar gráfico de plataformas
- [ ] Mostrar usuarios activos

### Fase 2: Engagement & Growth
- [ ] Integrar `/api/admin/analytics/engagement`
- [ ] Integrar `/api/admin/analytics/growth`
- [ ] Crear gráfico de crecimiento histórico
- [ ] Mostrar métricas DAU/MAU

### Fase 3: Contenido
- [ ] Integrar `/api/admin/analytics/content`
- [ ] Tabla de posts populares
- [ ] Top comunidades

### Fase 4: Marketing
- [ ] Integrar `/api/admin/analytics/banners`
- [ ] Dashboard de banners por sección
- [ ] Estadísticas de notificaciones

### Fase 5: Desarrollo Infantil
- [ ] Integrar `/api/admin/analytics/milestones`
- [ ] Integrar `/api/admin/analytics/faq`
- [ ] Visualización de progreso por categoría

---

## 🚀 Status

**Estado:** ✅ Implementado y Desplegado  
**Versión:** 1.0.0  
**Fecha:** 7 Feb 2026  
**Endpoints:** 16 activos  
**Documentación:** Completa

---

¡Todos los endpoints están listos para ser usados en el dashboard de Munpa! 🎉
