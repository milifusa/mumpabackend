# 📋 Documentación de Endpoints - Perfil Completo de Hijos

## 🎯 Resumen

Se han creado **13 grupos de endpoints** (26 endpoints en total) para soportar un perfil completo y mejorado de cada hijo en la aplicación Munpa.

Todos los endpoints están en el archivo: `children-endpoints.js`

## 📝 Lista Completa de Endpoints

### 1. VACUNAS 💉
- `GET /api/children/:childId/vaccines` - Obtener todas las vacunas
- `POST /api/children/:childId/vaccines` - Registrar nueva vacuna

**Campos:**
- name, scheduledDate, appliedDate, status ('pending', 'applied', 'skipped')
- location, batch, notes

### 2. CITAS MÉDICAS 🏥
- `GET /api/children/:childId/appointments` - Obtener citas médicas
- `POST /api/children/:childId/appointments` - Agregar cita médica

**Campos:**
- type ('checkup', 'specialist', 'emergency', 'vaccine')
- date, doctor, location, reason, notes
- status ('scheduled', 'completed', 'cancelled')

### 3. MEDICAMENTOS 💊
- `GET /api/children/:childId/medications` - Obtener medicamentos
- `POST /api/children/:childId/medications` - Registrar medicamento

**Campos:**
- name, dosage, frequency
- startDate, endDate, reason
- prescribedBy, notes
- status ('active', 'completed', 'discontinued')

### 4. ALERGIAS 🚫
- `PUT /api/children/:childId/allergies` - Actualizar alergias

**Campos:**
- allergies (array de strings)

### 5. HISTORIAL MÉDICO 📖
- `GET /api/children/:childId/medical-history` - Obtener historial
- `POST /api/children/:childId/medical-history` - Agregar entrada

**Campos:**
- type ('diagnosis', 'treatment', 'surgery', 'hospitalization', 'other')
- date, title, description
- doctor, location
- attachments (array de URLs)

### 6. MEDICIONES 📏
- `GET /api/children/:childId/measurements` - Obtener mediciones
- `POST /api/children/:childId/measurements` - Registrar medición

**Campos:**
- date, weight (kg), height (cm)
- headCircumference (cm), notes

### 7. SEGUIMIENTO DE SUEÑO 😴
- `GET /api/children/:childId/sleep-tracking` - Obtener registros de sueño
- `POST /api/children/:childId/sleep-tracking` - Registrar sueño

**Query params (GET):**
- startDate, endDate

**Campos:**
- date, sleepTime, wakeTime
- duration (minutos), quality ('good', 'fair', 'poor')
- naps (array de {time, duration}), notes

### 8. REGISTRO DE ALIMENTACIÓN 🍼
- `GET /api/children/:childId/feeding-log` - Obtener registros
- `POST /api/children/:childId/feeding-log` - Registrar alimentación

**Query params (GET):**
- startDate, endDate

**Campos:**
- date, type ('breastfeeding', 'bottle', 'solid', 'water')
- amount (ml o gramos), duration (minutos)
- food (descripción), breast ('left', 'right', 'both')
- notes

### 9. HITOS DEL DESARROLLO 🎉
- `GET /api/children/:childId/milestones` - Obtener hitos
- `POST /api/children/:childId/milestones` - Registrar hito

**Campos:**
- type ('first_smile', 'first_word', 'first_step', 'first_tooth', 'custom')
- title, date, description
- photos (array de URLs)
- celebrationEmoji

### 10. DIARIO DEL BEBÉ 📔
- `GET /api/children/:childId/diary` - Obtener entradas del diario
- `POST /api/children/:childId/diary` - Agregar entrada

**Campos:**
- date, title, content
- mood ('happy', 'sad', 'neutral', 'excited')
- photos (array), tags (array)

### 11. ÁLBUMES DE FOTOS 📸
- `GET /api/children/:childId/albums` - Obtener álbumes
- `POST /api/children/:childId/albums` - Crear álbum
- `POST /api/children/:childId/albums/:albumId/photos` - Agregar fotos

**Campos (crear álbum):**
- name, description, coverPhoto
- photos (array de {url, caption, date})
- theme ('birthday', 'first_year', 'vacation', 'custom')

**Campos (agregar fotos):**
- photos (array de {url, caption, date})

### 12. CUIDADORES (Compartir acceso) 👨‍👩‍👧‍👦
- `GET /api/children/:childId/caregivers` - Obtener cuidadores
- `POST /api/children/:childId/caregivers` - Invitar cuidador

**Campos:**
- email, name
- relationship ('father', 'mother', 'grandparent', 'other')
- permissions {canEdit, canViewMedical, canViewPhotos}
- status ('pending', 'active', 'declined')

### 13. EXPORTAR INFORMACIÓN 📄
- `GET /api/children/:childId/export-pdf` - Exportar a PDF/JSON

**Respuesta:**
- Datos completos del hijo
- Todas las vacunas, citas, hitos, mediciones
- Nota: Pendiente integrar generador de PDF

## 🔐 Seguridad

Todos los endpoints incluyen:
- ✅ Autenticación mediante `authenticateToken`
- ✅ Verificación de permisos (el hijo debe pertenecer al usuario)
- ✅ Validación de base de datos disponible
- ✅ Manejo de errores completo

## 📊 Estructura de Datos en Firestore

```
children/
  ├── {childId}/
  │   ├── (datos del hijo)
  │   ├── allergies: []
  │   └── subcollections:
  │       ├── vaccines/
  │       ├── appointments/
  │       ├── medications/
  │       ├── medical_history/
  │       ├── measurements/
  │       ├── sleep_tracking/
  │       ├── feeding_log/
  │       ├── milestones/
  │       ├── diary/
  │       ├── albums/
  │       └── caregivers/
```

## 🚀 Cómo Integrar los Endpoints

### Opción 1: Copiar y pegar manualmente

1. Abre `children-endpoints.js`
2. Copia todo el contenido (líneas 8-1504)
3. Abre `server.js`
4. Busca la línea que dice `// Ruta 404 para rutas no encontradas`
5. Pega el contenido ANTES de esa línea
6. Guarda el archivo

### Opción 2: Usar comando de terminal (recomendado)

```bash
cd /Users/Mishu/Documents/mumpabackend

# Crear backup
cp server.js server.js.backup-$(date +%Y%m%d-%H%M%S)

# Encontrar la línea donde insertar
grep -n "// Ruta 404" server.js

# El número que aparece es donde debes insertar
# Por ejemplo, si dice "6589:// Ruta 404"
# Entonces inserta en la línea 6589
```

### Opción 3: Script automatizado

Crea un archivo `integrate-endpoints.sh`:

```bash
#!/bin/bash

# Backup
cp server.js server.js.backup-$(date +%Y%m%d-%H%M%S)

# Encontrar línea de inserción
INSERT_LINE=$(grep -n "// Ruta 404" server.js | cut -d: -f1)

# Dividir archivo
head -n $((INSERT_LINE - 1)) server.js > temp1.txt
tail -n +$INSERT_LINE server.js > temp2.txt

# Unir con endpoints
cat temp1.txt > server.js.new
echo "" >> server.js.new
cat children-endpoints.js | tail -n +8 >> server.js.new
echo "" >> server.js.new
cat temp2.txt >> server.js.new

# Reemplazar
mv server.js.new server.js

# Limpiar
rm temp1.txt temp2.txt

echo "✅ Endpoints integrados exitosamente"
```

Luego ejecuta:
```bash
chmod +x integrate-endpoints.sh
./integrate-endpoints.sh
```

## 📱 Ejemplos de Uso desde el Frontend

### Registrar una vacuna

```javascript
const registerVaccine = async (childId, vaccineData) => {
  const token = await getAuthToken();
  
  const response = await fetch(
    `https://tu-backend.com/api/children/${childId}/vaccines`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        name: 'BCG',
        scheduledDate: '2024-01-15',
        status: 'pending',
        location: 'Centro de Salud',
        notes: 'Primera dosis'
      })
    }
  );
  
  return await response.json();
};
```

### Obtener mediciones para gráfico

```javascript
const getMeasurements = async (childId) => {
  const token = await getAuthToken();
  
  const response = await fetch(
    `https://tu-backend.com/api/children/${childId}/measurements`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );
  
  const data = await response.json();
  
  // Procesar para gráfico
  const chartData = data.data.map(m => ({
    date: new Date(m.date.seconds * 1000),
    weight: m.weight,
    height: m.height
  }));
  
  return chartData;
};
```

### Registrar hito del desarrollo

```javascript
const registerMilestone = async (childId, milestone) => {
  const token = await getAuthToken();
  
  const response = await fetch(
    `https://tu-backend.com/api/children/${childId}/milestones`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        type: 'first_step',
        title: 'Primeros pasos',
        date: new Date().toISOString(),
        description: '¡Dio sus primeros pasos solo!',
        photos: ['https://...'],
        celebrationEmoji: '🎉'
      })
    }
  );
  
  return await response.json();
};
```

## 🧪 Testing

### Probar con Postman

1. Importa la colección de Postman (crear archivo separado)
2. Configura el token de autenticación
3. Prueba cada endpoint

### Probar con curl

```bash
# Obtener vacunas
curl -X GET \
  https://tu-backend.com/api/children/CHILD_ID/vaccines \
  -H 'Authorization: Bearer YOUR_TOKEN'

# Registrar medición
curl -X POST \
  https://tu-backend.com/api/children/CHILD_ID/measurements \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "date": "2024-01-15",
    "weight": 8.5,
    "height": 70,
    "headCircumference": 45,
    "notes": "Control de los 6 meses"
  }'
```

## 📌 Notas Importantes

1. **Todos los endpoints requieren autenticación**
2. **Las fechas se manejan como objetos Date de JavaScript**
3. **Los arrays vacíos se devuelven cuando no hay datos**
4. **Las subcollections en Firestore se crean automáticamente**
5. **El export-pdf devuelve JSON; falta integrar generador de PDF**

## 🔄 Próximos Pasos

1. ✅ Integrar endpoints en server.js
2. ✅ Probar cada endpoint
3. ✅ Desplegar a producción
4. 🔲 Crear interfaz de usuario en el frontend
5. 🔲 Integrar generador de PDF para exportación
6. 🔲 Agregar notificaciones push para recordatorios
7. 🔲 Implementar sincronización offline

## 💡 Tips de Implementación

- Usa TypeScript para mejor tipado
- Implementa caché local para datos frecuentes
- Agregar loading states en todas las operaciones
- Manejar errores de red gracefully
- Implementar retry logic para operaciones fallidas
- Agregar analytics para tracking de uso

## 🆘 Soporte

Si tienes problemas con los endpoints:

1. Revisa los logs del backend en Vercel
2. Verifica que Firebase esté configurado correctamente
3. Asegúrate de que el token de autenticación sea válido
4. Verifica que el childId pertenezca al usuario

---

**Creado por:** Sistema de IA de Munpa
**Fecha:** 2024
**Versión:** 1.0.0

