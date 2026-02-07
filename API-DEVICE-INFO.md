# API de Device Info & App Analytics

## 📋 Descripción

Sistema para capturar, almacenar y analizar información sobre las versiones de la app, plataformas (iOS/Android) y dispositivos de los usuarios. Útil para:
- Estadísticas de adopción de versiones
- Identificar usuarios en versiones antiguas
- Detectar problemas por plataforma
- Planificar deprecación de versiones

---

## 🔧 Middleware Automático

### Captura de Headers

El backend captura automáticamente información del dispositivo de **todos** los requests que incluyan los siguientes headers:

```http
X-App-Version: 1.2.3
X-Platform: ios
X-Build-Number: 45
X-Device-Model: iPhone 14 Pro
X-OS-Version: 17.2
```

Esta información queda disponible en `req.deviceInfo` para todos los endpoints.

### Ejemplo de Configuración en React Native

```javascript
import DeviceInfo from 'react-native-device-info';
import { Platform } from 'react-native';
import axios from 'axios';

// Configurar axios con headers automáticos
const setupApiClient = async () => {
  const apiClient = axios.create({
    baseURL: 'https://api.munpa.online',
    headers: {
      'X-App-Version': DeviceInfo.getVersion(),
      'X-Platform': Platform.OS,
      'X-Build-Number': DeviceInfo.getBuildNumber(),
      'X-Device-Model': await DeviceInfo.getModel(),
      'X-OS-Version': DeviceInfo.getSystemVersion()
    }
  });

  // Agregar interceptor para incluir token
  apiClient.interceptors.request.use(config => {
    const token = getUserToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  return apiClient;
};
```

---

## 📍 Endpoints

### 1. Actualizar Device Info del Usuario

**Endpoint:** `POST /api/users/device-info`

**Descripción:** Guarda la información del dispositivo en el perfil del usuario. Se recomienda llamar al iniciar sesión o al abrir la app.

**Headers:**
```http
Authorization: Bearer {token}
X-App-Version: 1.2.3
X-Platform: ios
```

**Body (Opcional):**
```json
{
  "appVersion": "1.2.3",
  "platform": "ios",
  "buildNumber": "45",
  "deviceModel": "iPhone 14 Pro",
  "osVersion": "17.2"
}
```

**Nota:** Si no se envía el body, usa automáticamente la info de los headers.

**Response:**
```json
{
  "success": true,
  "message": "Información del dispositivo actualizada",
  "data": {
    "appVersion": "1.2.3",
    "platform": "ios",
    "buildNumber": "45",
    "deviceModel": "iPhone 14 Pro",
    "osVersion": "17.2",
    "userAgent": "Munpa/1.2.3...",
    "lastUpdated": "2026-02-07T18:00:00.000Z"
  }
}
```

---

### 2. Estadísticas de Versiones (Admin)

**Endpoint:** `GET /api/admin/analytics/app-versions`

**Descripción:** Obtiene estadísticas completas sobre versiones de app, plataformas y dispositivos de todos los usuarios.

**Headers:**
```http
Authorization: Bearer {adminToken}
```

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
      },
      {
        "version": "1.2.2",
        "count": 432,
        "percentage": "28.02"
      },
      {
        "version": "1.2.1",
        "count": 156,
        "percentage": "10.12"
      },
      {
        "version": "1.2.0",
        "count": 78,
        "percentage": "5.06"
      }
    ],
    "osVersions": [
      {
        "os": "ios-17.2",
        "count": 324,
        "percentage": "21.01"
      },
      {
        "os": "android-14",
        "count": 298,
        "percentage": "19.33"
      },
      {
        "os": "ios-17.1",
        "count": 267,
        "percentage": "17.32"
      }
    ],
    "recentDevices": [
      {
        "userId": "user_123",
        "email": "usuario@example.com",
        "platform": "ios",
        "appVersion": "1.2.3",
        "buildNumber": "45",
        "deviceModel": "iPhone 14 Pro",
        "osVersion": "17.2",
        "lastUpdated": "2026-02-07T18:00:00.000Z"
      }
    ]
  }
}
```

---

### 3. Buscar Usuarios por App/Versión (Admin)

**Endpoint:** `GET /api/admin/analytics/users-by-app`

**Descripción:** Busca usuarios según plataforma, versión específica o versión mínima. Útil para notificar usuarios en versiones antiguas.

**Headers:**
```http
Authorization: Bearer {adminToken}
```

**Query Parameters:**
- `platform` - Filtrar por plataforma: `ios` o `android` (opcional)
- `version` - Filtrar por versión exacta: `1.2.0` (opcional)
- `minVersion` - Usuarios con versión anterior a esta (opcional)

**Ejemplos:**

```bash
# Todos los usuarios de iOS
GET /api/admin/analytics/users-by-app?platform=ios

# Usuarios en versión exacta 1.2.0
GET /api/admin/analytics/users-by-app?version=1.2.0

# Usuarios con versión anterior a 1.2.3 (desactualizados)
GET /api/admin/analytics/users-by-app?minVersion=1.2.3

# Usuarios de Android con versión anterior a 1.2.0
GET /api/admin/analytics/users-by-app?platform=android&minVersion=1.2.0
```

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
          "buildNumber": "40",
          "deviceModel": "iPhone 13",
          "osVersion": "16.4",
          "lastUpdated": "2026-01-15T10:00:00.000Z"
        }
      }
    ]
  }
}
```

**Nota:** Limita resultados a 100 usuarios para rendimiento.

---

## 📱 Integración en el Frontend

### Al Iniciar Sesión

```javascript
const updateDeviceInfo = async () => {
  try {
    const response = await apiClient.post('/api/users/device-info');
    console.log('Device info actualizado:', response.data);
  } catch (error) {
    console.error('Error actualizando device info:', error);
    // No fallar el login si esto falla
  }
};

// Llamar después del login exitoso
const handleLogin = async (email, password) => {
  const user = await signIn(email, password);
  await updateDeviceInfo(); // Actualizar info del dispositivo
  navigate('Home');
};
```

### Verificación de Versión Mínima

```javascript
const checkAppVersion = async () => {
  try {
    const currentVersion = DeviceInfo.getVersion();
    const minVersionRequired = '1.2.0'; // Desde backend o config
    
    if (compareVersions(currentVersion, minVersionRequired) < 0) {
      // Mostrar modal de actualización requerida
      Alert.alert(
        'Actualización Requerida',
        'Por favor actualiza la app a la última versión',
        [
          {
            text: 'Actualizar',
            onPress: () => {
              const storeUrl = Platform.OS === 'ios'
                ? 'https://apps.apple.com/app/...'
                : 'https://play.google.com/store/apps/...';
              Linking.openURL(storeUrl);
            }
          }
        ],
        { cancelable: false }
      );
    }
  } catch (error) {
    console.error('Error checking version:', error);
  }
};
```

---

## 🎯 Casos de Uso

### 1. Dashboard de Admin - Ver Adopción de Versiones

```javascript
const VersionDashboard = () => {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      const response = await apiClient.get('/api/admin/analytics/app-versions');
      setStats(response.data.data);
    };
    fetchStats();
  }, []);

  return (
    <div>
      <h2>Estadísticas de App</h2>
      <div>
        <h3>Total Usuarios: {stats?.summary.totalUsers}</h3>
        <p>iOS: {stats?.summary.platforms.ios}</p>
        <p>Android: {stats?.summary.platforms.android}</p>
      </div>
      
      <h3>Versiones Activas:</h3>
      <ul>
        {stats?.versions.map(v => (
          <li key={v.version}>
            {v.version}: {v.count} usuarios ({v.percentage}%)
          </li>
        ))}
      </ul>
    </div>
  );
};
```

### 2. Notificar Usuarios en Versiones Antiguas

```javascript
const notifyOutdatedUsers = async () => {
  // Obtener usuarios con versión anterior a 1.2.3
  const response = await apiClient.get(
    '/api/admin/analytics/users-by-app?minVersion=1.2.3'
  );
  
  const outdatedUsers = response.data.data.users;
  
  console.log(`${outdatedUsers.length} usuarios necesitan actualizar`);
  
  // Enviar notificaciones push o emails
  for (const user of outdatedUsers) {
    await sendPushNotification(user.id, {
      title: 'Nueva versión disponible',
      body: 'Actualiza la app para disfrutar las nuevas funciones'
    });
  }
};
```

### 3. Identificar Problemas por Plataforma

```javascript
const getIssuesByPlatform = async (platform) => {
  const response = await apiClient.get(
    `/api/admin/analytics/users-by-app?platform=${platform}`
  );
  
  const users = response.data.data.users;
  
  // Analizar versiones problemáticas
  const versionCounts = {};
  users.forEach(u => {
    const version = u.deviceInfo.appVersion;
    versionCounts[version] = (versionCounts[version] || 0) + 1;
  });
  
  console.log(`Distribución ${platform}:`, versionCounts);
};
```

---

## 📊 Datos Almacenados

En el documento del usuario (`users/{userId}`):

```javascript
{
  email: "usuario@example.com",
  deviceInfo: {
    appVersion: "1.2.3",
    platform: "ios",
    buildNumber: "45",
    deviceModel: "iPhone 14 Pro",
    osVersion: "17.2",
    userAgent: "Munpa/1.2.3 (iPhone; iOS 17.2)",
    lastUpdated: Timestamp
  },
  lastDeviceUpdate: Timestamp
}
```

---

## 🔒 Seguridad y Privacidad

- ✅ Autenticación requerida para actualizar device info
- ✅ Solo admins pueden ver estadísticas agregadas
- ✅ Los datos se usan solo para analytics y soporte
- ✅ No se comparte información personal identificable
- ✅ Cumple con GDPR/privacidad de datos

---

## 💡 Mejores Prácticas

### Para el Frontend

1. **Actualizar al login:** Llamar al endpoint al iniciar sesión
2. **Headers en todas las requests:** Configurar headers globalmente en axios
3. **No bloquear UI:** Hacer las actualizaciones en background
4. **Manejar errores silenciosamente:** No mostrar errores al usuario
5. **Caché local:** Guardar versión para comparaciones offline

### Para Admins

1. **Deprecación gradual:** Dar 2-3 versiones de gracia antes de forzar update
2. **Notificaciones anticipadas:** Avisar con semanas de anticipación
3. **Monitoreo constante:** Revisar estadísticas semanalmente
4. **Testing por plataforma:** Probar features en ambas plataformas
5. **Documentar breaking changes:** Comunicar claramente cambios importantes

---

## 📈 Métricas Clave

### KPIs a Monitorear

1. **Adopción de última versión:** Meta >70% en 2 semanas
2. **Usuarios en versiones antiguas:** Mantener <10%
3. **Distribución iOS/Android:** Balancear recursos de desarrollo
4. **Versiones de OS:** Decidir soporte de OS antiguos
5. **Velocidad de actualización:** Tiempo desde release hasta adopción

---

## 🚀 Roadmap Futuro

### Funcionalidades Planeadas

- [ ] Forzar actualización para versiones críticas
- [ ] Notificaciones automáticas a usuarios desactualizados
- [ ] Gráficas de adopción en el tiempo
- [ ] Comparar crashes por versión
- [ ] Detectar usuarios con múltiples dispositivos
- [ ] Analytics de uso por feature y versión
- [ ] Beta testing opt-in tracking
- [ ] Rollback automático si versión tiene problemas

---

## 📞 Ejemplos de Queries Útiles

```bash
# Ver todas las versiones activas
GET /api/admin/analytics/app-versions

# Usuarios de iOS con versión desactualizada
GET /api/admin/analytics/users-by-app?platform=ios&minVersion=1.3.0

# Usuarios en Android 13 o anterior
GET /api/admin/analytics/app-versions
# Luego filtrar en frontend por osVersions

# Total de usuarios por plataforma
GET /api/admin/analytics/app-versions
# Ver data.summary.platforms
```
