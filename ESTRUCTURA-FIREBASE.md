# 🔥 Estructura de Datos en Firebase Firestore

## 📊 Organización Completa

Todo se almacena en **Firebase Firestore** de manera organizada y escalable.

---

## 🗂️ Estructura de Collections

```
firestore/
│
├── users/                          # Usuarios principales
│   └── {userId}/
│       ├── displayName: string
│       ├── email: string
│       ├── gender: string
│       ├── childrenCount: number
│       ├── isPregnant: boolean
│       ├── gestationWeeks: number
│       ├── createdAt: timestamp
│       └── updatedAt: timestamp
│
├── children/                       # Hijos del usuario
│   └── {childId}/
│       ├── parentId: string        # ID del usuario padre
│       ├── name: string
│       ├── birthDate: timestamp
│       ├── ageInMonths: number
│       ├── currentAgeInMonths: number
│       ├── isUnborn: boolean
│       ├── gestationWeeks: number
│       ├── photoUrl: string
│       ├── allergies: string[]     # ⭐ NUEVO
│       ├── createdAt: timestamp
│       ├── updatedAt: timestamp
│       │
│       └── SUBCOLLECTIONS:         # ⭐ NUEVAS SUBCOLLECTIONS
│           │
│           ├── vaccines/           # 💉 VACUNAS
│           │   └── {vaccineId}/
│           │       ├── name: string
│           │       ├── scheduledDate: timestamp
│           │       ├── appliedDate: timestamp
│           │       ├── status: string ('pending', 'applied', 'skipped')
│           │       ├── location: string
│           │       ├── batch: string
│           │       ├── notes: string
│           │       ├── createdAt: timestamp
│           │       └── updatedAt: timestamp
│           │
│           ├── appointments/       # 🏥 CITAS MÉDICAS
│           │   └── {appointmentId}/
│           │       ├── type: string ('checkup', 'specialist', 'emergency', 'vaccine')
│           │       ├── date: timestamp
│           │       ├── doctor: string
│           │       ├── location: string
│           │       ├── reason: string
│           │       ├── notes: string
│           │       ├── status: string ('scheduled', 'completed', 'cancelled')
│           │       ├── createdAt: timestamp
│           │       └── updatedAt: timestamp
│           │
│           ├── medications/        # 💊 MEDICAMENTOS
│           │   └── {medicationId}/
│           │       ├── name: string
│           │       ├── dosage: string
│           │       ├── frequency: string
│           │       ├── startDate: timestamp
│           │       ├── endDate: timestamp
│           │       ├── reason: string
│           │       ├── prescribedBy: string
│           │       ├── notes: string
│           │       ├── status: string ('active', 'completed', 'discontinued')
│           │       ├── createdAt: timestamp
│           │       └── updatedAt: timestamp
│           │
│           ├── medical_history/    # 📖 HISTORIAL MÉDICO
│           │   └── {historyId}/
│           │       ├── type: string ('diagnosis', 'treatment', 'surgery', 'hospitalization', 'other')
│           │       ├── date: timestamp
│           │       ├── title: string
│           │       ├── description: string
│           │       ├── doctor: string
│           │       ├── location: string
│           │       ├── attachments: string[] (URLs)
│           │       ├── createdAt: timestamp
│           │       └── updatedAt: timestamp
│           │
│           ├── measurements/       # 📏 MEDICIONES
│           │   └── {measurementId}/
│           │       ├── date: timestamp
│           │       ├── weight: number (kg)
│           │       ├── height: number (cm)
│           │       ├── headCircumference: number (cm)
│           │       ├── notes: string
│           │       └── createdAt: timestamp
│           │
│           ├── sleep_tracking/     # 😴 SEGUIMIENTO DE SUEÑO
│           │   └── {sleepId}/
│           │       ├── date: timestamp
│           │       ├── sleepTime: timestamp
│           │       ├── wakeTime: timestamp
│           │       ├── duration: number (minutos)
│           │       ├── quality: string ('good', 'fair', 'poor')
│           │       ├── naps: array [{time: timestamp, duration: number}]
│           │       ├── notes: string
│           │       └── createdAt: timestamp
│           │
│           ├── feeding_log/        # 🍼 REGISTRO DE ALIMENTACIÓN
│           │   └── {feedingId}/
│           │       ├── date: timestamp
│           │       ├── type: string ('breastfeeding', 'bottle', 'solid', 'water')
│           │       ├── amount: number (ml o gramos)
│           │       ├── duration: number (minutos)
│           │       ├── food: string
│           │       ├── breast: string ('left', 'right', 'both')
│           │       ├── notes: string
│           │       └── createdAt: timestamp
│           │
│           ├── milestones/         # 🎉 HITOS DEL DESARROLLO
│           │   └── {milestoneId}/
│           │       ├── type: string ('first_smile', 'first_word', 'first_step', 'first_tooth', 'custom')
│           │       ├── title: string
│           │       ├── date: timestamp
│           │       ├── description: string
│           │       ├── photos: string[] (URLs)
│           │       ├── celebrationEmoji: string
│           │       └── createdAt: timestamp
│           │
│           ├── diary/              # 📔 DIARIO DEL BEBÉ
│           │   └── {diaryId}/
│           │       ├── date: timestamp
│           │       ├── title: string
│           │       ├── content: string
│           │       ├── mood: string ('happy', 'sad', 'neutral', 'excited')
│           │       ├── photos: string[] (URLs)
│           │       ├── tags: string[]
│           │       ├── createdAt: timestamp
│           │       └── updatedAt: timestamp
│           │
│           ├── albums/             # 📸 ÁLBUMES DE FOTOS
│           │   └── {albumId}/
│           │       ├── name: string
│           │       ├── description: string
│           │       ├── coverPhoto: string (URL)
│           │       ├── photos: array [{url: string, caption: string, date: timestamp}]
│           │       ├── theme: string ('birthday', 'first_year', 'vacation', 'custom')
│           │       ├── photoCount: number
│           │       ├── createdAt: timestamp
│           │       └── updatedAt: timestamp
│           │
│           └── caregivers/         # 👨‍👩‍👧‍👦 CUIDADORES
│               └── {caregiverId}/
│                   ├── email: string
│                   ├── name: string
│                   ├── relationship: string ('father', 'mother', 'grandparent', 'other')
│                   ├── permissions: object {
│                   │   canEdit: boolean,
│                   │   canViewMedical: boolean,
│                   │   canViewPhotos: boolean
│                   │ }
│                   ├── status: string ('pending', 'active', 'declined')
│                   ├── invitedAt: timestamp
│                   └── invitedBy: string (userId)
│
├── communities/                    # Comunidades existentes
│   └── {communityId}/
│       └── ... (ya existente)
│
├── doula_conversations/            # Conversaciones con Douli
│   └── {conversationId}/
│       └── ... (ya existente)
│
└── user_memory/                    # Memoria del usuario
    └── {userId}/
        └── ... (ya existente)
```

---

## 🎯 Ventajas de esta Estructura

### 1. **Escalabilidad** 📈
- Cada hijo tiene sus propias subcollections
- No hay límite de documentos por hijo
- Queries eficientes y rápidas

### 2. **Organización** 📁
- Datos claramente separados por categoría
- Fácil de entender y mantener
- Búsquedas específicas por tipo de dato

### 3. **Seguridad** 🔒
- Reglas de Firestore pueden controlar acceso
- Validación de permisos a nivel de documento
- Cada usuario solo ve sus propios datos

### 4. **Performance** ⚡
- Queries indexadas automáticamente
- Solo carga datos necesarios
- Paginación fácil de implementar

---

## 📝 Ejemplo de Datos Reales

### Usuario
```javascript
users/abc123 = {
  displayName: "María García",
  email: "maria@example.com",
  gender: "F",
  childrenCount: 2,
  isPregnant: false,
  createdAt: Timestamp(2024-01-01)
}
```

### Hijo
```javascript
children/child456 = {
  parentId: "abc123",
  name: "Sofía",
  birthDate: Timestamp(2023-06-15),
  ageInMonths: 6,
  currentAgeInMonths: 7,
  isUnborn: false,
  photoUrl: "https://storage.firebase.com/...",
  allergies: ["Lactosa", "Fresas"],
  createdAt: Timestamp(2023-06-15)
}
```

### Vacuna del hijo
```javascript
children/child456/vaccines/vac789 = {
  name: "BCG",
  scheduledDate: Timestamp(2023-06-15),
  appliedDate: Timestamp(2023-06-15),
  status: "applied",
  location: "Hospital Central",
  batch: "LOT-2023-001",
  notes: "Sin reacciones adversas",
  createdAt: Timestamp(2023-06-15),
  updatedAt: Timestamp(2023-06-15)
}
```

### Medición del hijo
```javascript
children/child456/measurements/meas001 = {
  date: Timestamp(2024-01-10),
  weight: 8.5,           // kg
  height: 70,            // cm
  headCircumference: 45, // cm
  notes: "Control de 7 meses",
  createdAt: Timestamp(2024-01-10)
}
```

### Hito del desarrollo
```javascript
children/child456/milestones/mile001 = {
  type: "first_word",
  title: "Primera palabra",
  date: Timestamp(2024-01-05),
  description: "¡Dijo 'mamá' por primera vez!",
  photos: [
    "https://storage.firebase.com/photo1.jpg"
  ],
  celebrationEmoji: "🎉",
  createdAt: Timestamp(2024-01-05)
}
```

### Álbum de fotos
```javascript
children/child456/albums/album001 = {
  name: "Primer Año",
  description: "Momentos especiales del primer año de Sofía",
  coverPhoto: "https://storage.firebase.com/cover.jpg",
  photos: [
    {
      url: "https://storage.firebase.com/photo1.jpg",
      caption: "Primer mes",
      date: Timestamp(2023-07-15)
    },
    {
      url: "https://storage.firebase.com/photo2.jpg",
      caption: "Primer baño",
      date: Timestamp(2023-06-16)
    }
  ],
  theme: "first_year",
  photoCount: 2,
  createdAt: Timestamp(2024-01-01),
  updatedAt: Timestamp(2024-01-10)
}
```

---

## 🔍 Queries Importantes

### Obtener todos los hijos de un usuario
```javascript
firestore()
  .collection('children')
  .where('parentId', '==', userId)
  .orderBy('createdAt', 'desc')
  .get()
```

### Obtener vacunas pendientes de un hijo
```javascript
firestore()
  .collection('children')
  .doc(childId)
  .collection('vaccines')
  .where('status', '==', 'pending')
  .orderBy('scheduledDate', 'asc')
  .get()
```

### Obtener mediciones de los últimos 6 meses
```javascript
const sixMonthsAgo = new Date();
sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

firestore()
  .collection('children')
  .doc(childId)
  .collection('measurements')
  .where('date', '>=', sixMonthsAgo)
  .orderBy('date', 'desc')
  .get()
```

### Obtener hitos ordenados por fecha
```javascript
firestore()
  .collection('children')
  .doc(childId)
  .collection('milestones')
  .orderBy('date', 'desc')
  .limit(10)
  .get()
```

---

## 📊 Tamaño de Almacenamiento

### Estimación por hijo:

| Tipo de Dato | Documentos Estimados | Espacio Aprox. |
|--------------|---------------------|----------------|
| Vacunas | ~20 documentos | ~20 KB |
| Citas Médicas | ~50 documentos | ~50 KB |
| Medicamentos | ~10 documentos | ~10 KB |
| Historial Médico | ~30 documentos | ~100 KB |
| Mediciones | ~100 documentos | ~50 KB |
| Sueño | ~365 documentos | ~200 KB |
| Alimentación | ~1,000 documentos | ~500 KB |
| Hitos | ~50 documentos | ~200 KB |
| Diario | ~100 documentos | ~300 KB |
| Álbumes | ~10 álbumes | ~50 KB |
| **TOTAL** | **~1,735 docs** | **~1.5 MB** |

**Nota:** Las fotos se almacenan en Firebase Storage (no en Firestore), solo se guardan las URLs.

---

## 🔐 Reglas de Seguridad Recomendadas

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Usuarios
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Hijos
    match /children/{childId} {
      allow read, write: if request.auth != null && 
        resource.data.parentId == request.auth.uid;
      
      // Subcollections de hijos
      match /{subcollection}/{docId} {
        allow read, write: if request.auth != null && 
          get(/databases/$(database)/documents/children/$(childId)).data.parentId == request.auth.uid;
      }
    }
  }
}
```

---

## 💰 Costos Estimados (Firebase)

### Plan Gratuito (Spark):
- ✅ 1 GB de almacenamiento
- ✅ 50,000 lecturas/día
- ✅ 20,000 escrituras/día
- ✅ 20,000 eliminaciones/día

### Para 1,000 usuarios activos:
- Lecturas: ~10,000/día ✅ Dentro del límite
- Escrituras: ~3,000/día ✅ Dentro del límite
- Almacenamiento: ~1.5 GB ⚠️ Requiere plan Blaze

### Plan Blaze (Pago por uso):
- $0.18 por 100,000 lecturas
- $0.18 por 100,000 escrituras
- $0.18/GB/mes de almacenamiento

**Costo estimado mensual para 1,000 usuarios:** ~$10-20 USD

---

## ✅ Ventajas de Usar Firebase

1. ✅ **Tiempo Real** - Updates automáticos en la app
2. ✅ **Offline** - Funciona sin internet
3. ✅ **Escalable** - Crece con tu app
4. ✅ **Seguro** - Reglas de seguridad robustas
5. ✅ **Rápido** - Queries optimizadas
6. ✅ **Sincronización** - Entre dispositivos automática

---

## 🎯 Resumen

**SÍ, TODO SE ALMACENA EN FIREBASE:**

- ✅ Usuarios en `users/`
- ✅ Hijos en `children/`
- ✅ Vacunas en `children/{id}/vaccines/`
- ✅ Citas en `children/{id}/appointments/`
- ✅ Medicamentos en `children/{id}/medications/`
- ✅ Historial médico en `children/{id}/medical_history/`
- ✅ Mediciones en `children/{id}/measurements/`
- ✅ Sueño en `children/{id}/sleep_tracking/`
- ✅ Alimentación en `children/{id}/feeding_log/`
- ✅ Hitos en `children/{id}/milestones/`
- ✅ Diario en `children/{id}/diary/`
- ✅ Álbumes en `children/{id}/albums/`
- ✅ Cuidadores en `children/{id}/caregivers/`

**¡Toda la información está segura, organizada y lista para usar! 🔥**

