# Sistema de Fechas para Gestión de Hijos

## 🎯 Resumen de Cambios

Se ha actualizado el sistema de gestión de hijos para usar **fechas reales** en lugar de edades en meses o semanas de gestación. Esto permite:

- ✅ Cálculo automático y preciso de la edad del bebé
- ✅ No es necesario actualizar manualmente la edad cada mes
- ✅ Mayor precisión en el seguimiento del desarrollo
- ✅ Compatibilidad completa con datos legacy existentes

---

## 📋 Nuevo Sistema

### Para Bebés Nacidos
**Antes:** Se guardaba `ageInMonths` (edad en meses en el momento del registro)
**Ahora:** Se guarda `birthDate` (fecha de nacimiento)

```json
{
  "name": "María",
  "birthDate": "2024-03-15",
  "isUnborn": false,
  "photoUrl": "..."
}
```

### Para Bebés No Nacidos
**Antes:** Se guardaba `gestationWeeks` (semanas de gestación en el momento del registro)
**Ahora:** Se guarda `dueDate` (fecha esperada de parto)

```json
{
  "name": "Bebé",
  "dueDate": "2025-06-20",
  "isUnborn": true,
  "photoUrl": "..."
}
```

---

## 🔧 Endpoints Actualizados

### 1. Crear Hijo - `POST /api/auth/children`

#### Nuevo formato (recomendado):

**Para bebé nacido:**
```json
{
  "name": "Juan",
  "birthDate": "2023-05-10",
  "isUnborn": false,
  "photoUrl": "https://..."
}
```

**Para bebé no nacido:**
```json
{
  "name": "Bebé",
  "dueDate": "2025-08-15",
  "isUnborn": true
}
```

#### Formato legacy (aún soportado):
```json
{
  "name": "María",
  "ageInMonths": 8,
  "isUnborn": false
}
```

### 2. Actualizar Hijo - `PUT /api/auth/children/:childId`

**Actualizar con fecha de nacimiento:**
```json
{
  "birthDate": "2023-05-10"
}
```

**Actualizar fecha de parto:**
```json
{
  "dueDate": "2025-08-15"
}
```

**Cambiar de no nacido a nacido:**
```json
{
  "isUnborn": false,
  "birthDate": "2025-01-15"
}
```

### 3. Endpoint Admin - `PUT /api/admin/children/:childId`

Funciona exactamente igual que el endpoint de usuario, soportando ambos formatos.

---

## 🆕 Nuevos Endpoints Helper

### 1. Calcular Edad desde Fecha de Nacimiento
`POST /api/auth/children/calculate-age`

```json
// Request
{
  "birthDate": "2023-05-10"
}

// Response
{
  "success": true,
  "data": {
    "ageInMonths": 19,
    "ageInDays": 577,
    "ageInYears": 1,
    "monthsRemainder": 7,
    "formattedAge": "1 año y 7 meses"
  }
}
```

### 2. Calcular Fecha de Parto desde Semanas
`POST /api/auth/children/calculate-due-date`

```json
// Request
{
  "gestationWeeks": 25
}

// Response
{
  "success": true,
  "data": {
    "dueDate": "2025-05-15",
    "currentWeeks": 25,
    "weeksRemaining": 15,
    "daysRemaining": 105,
    "isOverdue": false
  }
}
```

### 3. Calcular Semanas desde Fecha de Parto
`POST /api/auth/children/calculate-gestation-weeks`

```json
// Request
{
  "dueDate": "2025-06-20"
}

// Response
{
  "success": true,
  "data": {
    "currentWeeks": 30,
    "daysUntilDue": 70,
    "isOverdue": false,
    "dueDateFormatted": "20 de junio de 2025"
  }
}
```

---

## 🔄 Compatibilidad con Datos Existentes

El sistema es **totalmente compatible** con datos legacy:

1. **Hijos existentes** con `ageInMonths` o `gestationWeeks` seguirán funcionando
2. El sistema detecta automáticamente qué formato usar
3. Al consultar hijos, se devuelve la edad calculada automáticamente
4. Puedes actualizar gradualmente los registros antiguos al nuevo formato

### Respuesta de GET /api/auth/children

**Nuevo formato:**
```json
{
  "id": "abc123",
  "name": "María",
  "birthDate": "2024-03-15",
  "isUnborn": false,
  "currentAgeInMonths": 8,
  "registeredAgeInMonths": null,
  "daysSinceCreation": 240
}
```

**Legacy (aún soportado):**
```json
{
  "id": "xyz789",
  "name": "Pedro",
  "ageInMonths": 12,
  "registeredAt": "2024-06-01",
  "isUnborn": false,
  "currentAgeInMonths": 17,
  "registeredAgeInMonths": 12,
  "daysSinceCreation": 159
}
```

---

## 🎨 Implementación en Frontend

### Ejemplo con selector de fecha:

```javascript
// Para bebé nacido
const handleCreateChild = async () => {
  const response = await fetch('/api/auth/children', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: childName,
      birthDate: selectedDate, // "2024-03-15"
      isUnborn: false
    })
  });
  
  const result = await response.json();
  console.log('Edad calculada:', result.data.currentAgeInMonths, 'meses');
};

// Para bebé no nacido
const handleCreateUnbornChild = async () => {
  const response = await fetch('/api/auth/children', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: 'Mi Bebé',
      dueDate: expectedDueDate, // "2025-06-20"
      isUnborn: true
    })
  });
  
  const result = await response.json();
  console.log('Semanas de gestación:', result.data.currentGestationWeeks);
};
```

### Componente de Selector de Fecha (React/React Native):

```jsx
import { useState } from 'react';
import DatePicker from 'react-datepicker';

function AddChildForm() {
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState(new Date());
  const [isUnborn, setIsUnborn] = useState(false);
  
  const handleSubmit = async () => {
    const formattedDate = birthDate.toISOString().split('T')[0];
    
    await createChild({
      name,
      [isUnborn ? 'dueDate' : 'birthDate']: formattedDate,
      isUnborn
    });
  };
  
  return (
    <div>
      <input 
        value={name} 
        onChange={e => setName(e.target.value)}
        placeholder="Nombre del bebé"
      />
      
      <label>
        <input 
          type="checkbox"
          checked={isUnborn}
          onChange={e => setIsUnborn(e.target.checked)}
        />
        ¿Aún no ha nacido?
      </label>
      
      <DatePicker
        selected={birthDate}
        onChange={date => setBirthDate(date)}
        dateFormat="yyyy-MM-dd"
        maxDate={isUnborn ? null : new Date()}
        minDate={isUnborn ? new Date() : null}
        placeholderText={isUnborn ? 'Fecha esperada de parto' : 'Fecha de nacimiento'}
      />
      
      <button onClick={handleSubmit}>Agregar Hijo</button>
    </div>
  );
}
```

---

## 📊 Validaciones

### Para Bebés Nacidos (`birthDate`):
- ✅ La fecha debe ser en el pasado
- ✅ No puede ser mayor a 18 años atrás
- ❌ No puede ser una fecha futura

### Para Bebés No Nacidos (`dueDate`):
- ✅ La fecha debe ser futura o reciente (máximo 2 semanas en el pasado)
- ✅ Permite cierto margen para partos tardíos
- ❌ No puede ser muy antigua

---

## 🔍 Funciones de Cálculo

### 1. `calculateAgeFromBirthDate(birthDate)`
Calcula la edad exacta en meses desde la fecha de nacimiento.

```javascript
// Ejemplo de cálculo:
// Fecha de nacimiento: 2023-05-10
// Fecha actual: 2025-01-15
// Edad: 1 año y 8 meses = 20 meses
```

### 2. `calculateGestationFromDueDate(dueDate)`
Calcula las semanas de gestación actuales desde la fecha de parto esperada.

```javascript
// Ejemplo de cálculo:
// Fecha de parto: 2025-06-20
// Fecha actual: 2025-01-15
// Días hasta el parto: 156 días
// Semanas de gestación: (280 - 156) / 7 ≈ 17 semanas
```

### 3. Legacy: `calculateCurrentAge()` y `calculateCurrentGestationWeeks()`
Aún disponibles para datos antiguos que usan el sistema de registro de edad en el momento.

---

## 🚀 Migración de Datos Existentes

Si deseas migrar tus datos legacy al nuevo formato:

### Script de ejemplo:

```javascript
// Migrar un hijo de ageInMonths a birthDate
const migrateChild = async (childId, ageInMonths, registeredAt) => {
  // Calcular fecha de nacimiento aproximada
  const registered = new Date(registeredAt);
  const birthDate = new Date(registered);
  birthDate.setMonth(birthDate.getMonth() - ageInMonths);
  
  // Actualizar con nuevo formato
  await fetch(`/api/auth/children/${childId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      birthDate: birthDate.toISOString().split('T')[0]
    })
  });
};

// Migrar de gestationWeeks a dueDate
const migrateUnbornChild = async (childId, gestationWeeks, registeredAt) => {
  // Calcular fecha de parto aproximada
  const registered = new Date(registeredAt);
  const weeksRemaining = 40 - gestationWeeks;
  const dueDate = new Date(registered);
  dueDate.setDate(dueDate.getDate() + (weeksRemaining * 7));
  
  await fetch(`/api/auth/children/${childId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      dueDate: dueDate.toISOString().split('T')[0]
    })
  });
};
```

---

## ✨ Ventajas del Nuevo Sistema

1. **Precisión**: La edad se calcula exactamente desde la fecha de nacimiento
2. **Automático**: No necesitas actualizar la edad manualmente
3. **Simple**: Solo necesitas guardar una fecha
4. **Flexible**: Permite cálculos más avanzados (edad en días, semanas, etc.)
5. **Compatible**: Los datos antiguos siguen funcionando sin problemas
6. **UX Mejorada**: Los usuarios pueden seleccionar fechas en lugar de contar meses

---

## 📝 Notas Importantes

- El sistema de cálculo de edad considera años, meses y días exactos
- Para embarazos, se asume que un embarazo completo son 40 semanas (280 días)
- Las fechas se manejan en formato ISO 8601 (YYYY-MM-DD)
- Todos los cálculos usan la zona horaria del servidor
- La migración de datos legacy es opcional pero recomendada

---

## 🤝 Soporte

Si tienes preguntas o necesitas ayuda con la implementación:
1. Revisa los ejemplos en este documento
2. Prueba los endpoints helper para validar tus cálculos
3. Usa el formato legacy si necesitas tiempo para actualizar el frontend

