# ✅ Cambio Implementado: Sistema de Fechas para Hijos

## 🎯 ¿Qué se cambió?

**ANTES:** Los usuarios elegían manualmente los meses del bebé (por ejemplo: "8 meses")

**AHORA:** Los usuarios ponen la fecha de nacimiento y la app calcula automáticamente los meses

---

## 🚀 Beneficios

1. **Más preciso**: La edad se calcula exactamente desde la fecha real
2. **Automático**: No hay que actualizar la edad cada mes
3. **Más fácil**: Los usuarios saben la fecha de nacimiento, no siempre los meses exactos
4. **Mejor UX**: Selector de fecha es más intuitivo que elegir número de meses

---

## 📱 Cambios en el Frontend Necesarios

### Para bebés nacidos:
```jsx
// ANTES
<input 
  type="number" 
  placeholder="Edad en meses"
  value={ageInMonths}
  onChange={e => setAgeInMonths(e.target.value)}
/>

// AHORA
<input 
  type="date" 
  placeholder="Fecha de nacimiento"
  max={new Date().toISOString().split('T')[0]}
  value={birthDate}
  onChange={e => setBirthDate(e.target.value)}
/>
```

### Para bebés no nacidos:
```jsx
// ANTES
<input 
  type="number" 
  placeholder="Semanas de gestación"
  value={gestationWeeks}
  onChange={e => setGestationWeeks(e.target.value)}
/>

// AHORA
<input 
  type="date" 
  placeholder="Fecha esperada de parto"
  min={new Date().toISOString().split('T')[0]}
  value={dueDate}
  onChange={e => setDueDate(e.target.value)}
/>
```

---

## 🔧 Cambios en la API

### Crear hijo - POST /api/auth/children

**Formato anterior (aún funciona):**
```json
{
  "name": "María",
  "ageInMonths": 8,
  "isUnborn": false
}
```

**Formato nuevo (recomendado):**
```json
{
  "name": "María",
  "birthDate": "2024-03-15",
  "isUnborn": false
}
```

### Actualizar hijo - PUT /api/auth/children/:childId

**Nuevo:**
```json
{
  "birthDate": "2024-03-15"
}
```

O para bebés no nacidos:
```json
{
  "dueDate": "2025-08-15"
}
```

---

## 🆕 Nuevos Endpoints Helper

### 1. Calcular edad desde fecha
`POST /api/auth/children/calculate-age`

Útil para mostrar la edad antes de crear el hijo:
```javascript
const response = await fetch('/api/auth/children/calculate-age', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: JSON.stringify({ birthDate: '2023-05-10' })
});

// Retorna: { ageInMonths: 19, formattedAge: "1 año y 7 meses" }
```

### 2. Calcular fecha de parto desde semanas
`POST /api/auth/children/calculate-due-date`

Para migrar datos antiguos o convertir semanas a fecha:
```javascript
const response = await fetch('/api/auth/children/calculate-due-date', {
  method: 'POST',
  body: JSON.stringify({ gestationWeeks: 25 })
});

// Retorna: { dueDate: "2025-06-15", weeksRemaining: 15 }
```

### 3. Calcular semanas desde fecha de parto
`POST /api/auth/children/calculate-gestation-weeks`

Para mostrar semanas actuales de embarazo:
```javascript
const response = await fetch('/api/auth/children/calculate-gestation-weeks', {
  method: 'POST',
  body: JSON.stringify({ dueDate: '2025-06-20' })
});

// Retorna: { currentWeeks: 30, daysUntilDue: 70 }
```

---

## ✅ Compatibilidad

- **Datos existentes**: Todos los hijos creados con el sistema anterior siguen funcionando
- **Apps antiguas**: Si tu app móvil no está actualizada, puede seguir usando `ageInMonths`
- **Migración gradual**: Puedes actualizar la app poco a poco

---

## 📊 Estructura de Datos

### Hijo Nacido (nuevo formato)
```javascript
{
  id: "abc123",
  name: "María",
  birthDate: "2024-03-15",        // ← NUEVO
  isUnborn: false,
  currentAgeInMonths: 10,          // Calculado automáticamente
  photoUrl: "https://..."
}
```

### Bebé No Nacido (nuevo formato)
```javascript
{
  id: "xyz789",
  name: "Mi bebé",
  dueDate: "2025-06-20",           // ← NUEVO
  isUnborn: true,
  currentGestationWeeks: 25,       // Calculado automáticamente
  daysUntilDue: 105,               // Días hasta el parto
  photoUrl: "https://..."
}
```

---

## 🎨 Ejemplo de UI Actualizada

```jsx
function AddChildForm() {
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [isUnborn, setIsUnborn] = useState(false);
  
  const handleSubmit = async () => {
    const childData = {
      name,
      isUnborn,
      [isUnborn ? 'dueDate' : 'birthDate']: isUnborn ? dueDate : birthDate
    };
    
    const response = await fetch('/api/auth/children', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(childData)
    });
    
    const result = await response.json();
    console.log('Hijo creado:', result.data);
  };
  
  return (
    <div>
      <input 
        placeholder="Nombre del bebé"
        value={name}
        onChange={e => setName(e.target.value)}
      />
      
      <label>
        <input 
          type="checkbox"
          checked={isUnborn}
          onChange={e => setIsUnborn(e.target.checked)}
        />
        ¿Aún no ha nacido?
      </label>
      
      {isUnborn ? (
        <input 
          type="date"
          placeholder="Fecha esperada de parto"
          value={dueDate}
          onChange={e => setDueDate(e.target.value)}
          min={new Date().toISOString().split('T')[0]}
        />
      ) : (
        <input 
          type="date"
          placeholder="Fecha de nacimiento"
          value={birthDate}
          onChange={e => setBirthDate(e.target.value)}
          max={new Date().toISOString().split('T')[0]}
        />
      )}
      
      <button onClick={handleSubmit}>
        Agregar Hijo
      </button>
    </div>
  );
}
```

---

## 📝 Próximos Pasos

1. **Actualizar el frontend**: Cambiar campos de número a selectores de fecha
2. **Probar**: Usar el archivo `test-birth-dates.js` para verificar
3. **Migrar datos** (opcional): Convertir registros antiguos al nuevo formato
4. **Actualizar app móvil**: Si tienes apps iOS/Android, actualízalas también

---

## 🔍 Validaciones Automáticas

El backend ahora valida:

- ✅ Fecha de nacimiento debe ser en el pasado (no futuro)
- ✅ Fecha de nacimiento no puede ser mayor a 18 años atrás
- ✅ Fecha de parto debe ser futura o reciente (máximo 2 semanas atrás)
- ✅ Formatos de fecha válidos (YYYY-MM-DD)

---

## 📚 Documentación Completa

Para más detalles, consulta:
- `SISTEMA-FECHAS-HIJOS.md` - Documentación técnica completa
- `test-birth-dates.js` - Script de prueba con ejemplos

---

## 💡 Tips de Implementación

### Mostrar edad calculada en tiempo real:
```jsx
const [birthDate, setBirthDate] = useState('');
const [calculatedAge, setCalculatedAge] = useState('');

const handleDateChange = async (date) => {
  setBirthDate(date);
  
  // Calcular y mostrar edad
  const response = await fetch('/api/auth/children/calculate-age', {
    method: 'POST',
    body: JSON.stringify({ birthDate: date })
  });
  
  const result = await response.json();
  setCalculatedAge(result.data.formattedAge);
};

return (
  <div>
    <input 
      type="date" 
      value={birthDate}
      onChange={e => handleDateChange(e.target.value)}
    />
    {calculatedAge && (
      <p>Edad: {calculatedAge}</p>
    )}
  </div>
);
```

### Validar fecha en el frontend:
```javascript
const validateBirthDate = (date) => {
  const birth = new Date(date);
  const today = new Date();
  const minDate = new Date();
  minDate.setFullYear(minDate.getFullYear() - 18);
  
  if (birth > today) {
    return 'La fecha de nacimiento no puede ser en el futuro';
  }
  
  if (birth < minDate) {
    return 'La fecha de nacimiento no puede ser mayor a 18 años atrás';
  }
  
  return null; // válida
};
```

---

## ❓ FAQ

**P: ¿Qué pasa con los hijos que ya tengo registrados?**
R: Siguen funcionando perfectamente. El sistema los reconoce y calcula su edad automáticamente.

**P: ¿Tengo que actualizar todos los registros?**
R: No, es opcional. Puedes dejar los registros antiguos como están.

**P: ¿Puedo seguir usando el formato antiguo (ageInMonths)?**
R: Sí, el backend acepta ambos formatos. Pero se recomienda usar fechas.

**P: ¿Qué pasa si cambio la fecha de un hijo?**
R: Simplemente envía la nueva fecha con PUT y el sistema recalculará todo automáticamente.

**P: ¿Funciona con todos los timezones?**
R: Sí, el sistema usa fechas sin hora, por lo que no hay problemas de timezone.

---

## ✨ Ventajas Adicionales

- Puedes calcular edad en días, semanas, meses, años
- Puedes mostrar "faltan X días para el parto"
- Puedes enviar notificaciones automáticas de cumpleaños
- Puedes calcular hitos de desarrollo más precisos
- Mejor para reportes y estadísticas

---

¿Tienes dudas? Revisa la documentación completa en `SISTEMA-FECHAS-HIJOS.md` 🚀

