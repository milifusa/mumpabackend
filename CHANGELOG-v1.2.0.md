# 📝 CHANGELOG - Versión 1.2.0

## 🎉 Sistema de Edición de Siestas con Pausas

**Fecha**: 5 de Enero, 2026  
**Versión**: 1.2.0  
**Commit**: 1a4f071

---

## ✨ NUEVAS FUNCIONALIDADES

### 1. **Edición de Horarios** ⏰

Ahora puedes editar los horarios de inicio y fin de cualquier evento de sueño.

**Nuevo Endpoint:**
```
PATCH /api/sleep/:eventId/times
```

**Casos de uso:**
- ✅ Bebé empezó a dormir antes de lo registrado
- ✅ Bebé se despertó más tarde/temprano
- ✅ Corrección de errores en registro
- ✅ Ajuste de horarios retrospectivo

**Ejemplo:**
```javascript
PATCH /api/sleep/evt_123/times
{
  "startTime": "2026-01-05T13:45:00Z",
  "endTime": "2026-01-05T15:30:00Z"
}
```

---

### 2. **Sistema de Pausas** ⏸️

Registra interrupciones durante el sueño del bebé.

**Nuevos Endpoints:**
```
POST   /api/sleep/:eventId/pause          - Agregar pausa
DELETE /api/sleep/:eventId/pause/:pauseId - Eliminar pausa
```

**Casos de uso:**
- ✅ Bebé se despertó y volvió a dormir
- ✅ Interrupciones por ruido
- ✅ Cambio de pañal durante la siesta
- ✅ Alimentación breve

**Ejemplo:**
```javascript
POST /api/sleep/evt_123/pause
{
  "duration": 5,
  "reason": "Despertó brevemente"
}
```

---

### 3. **Cálculo de Duración Neta** 📊

El sistema ahora calcula tres tipos de duración:

- **Gross Duration**: Tiempo total (inicio a fin)
- **Net Duration**: Tiempo efectivo (descontando pausas)
- **Duration**: Por defecto = Net Duration

**Ejemplo:**
```
Inicio: 14:00
Fin: 16:00
Pausa 1: 5 min
Pausa 2: 10 min

grossDuration = 120 min (2 horas)
netDuration = 105 min (120 - 15)
duration = 105 min
```

---

### 4. **Actualización Completa Mejorada** 🔄

El endpoint PUT ahora recalcula automáticamente las duraciones.

**Endpoint Mejorado:**
```
PUT /api/sleep/:eventId
```

**Mejoras:**
- ✅ Recálculo automático de duraciones
- ✅ Soporte para array de pausas
- ✅ Validación de datos mejorada
- ✅ Retorna evento actualizado completo

---

## 📦 ARCHIVOS NUEVOS

### 1. **GUIA-EDICION-SIESTAS.md**
Documentación completa con:
- 📖 Explicación de todas las funcionalidades
- 💡 8 ejemplos prácticos
- 📱 Componente React Native
- 🎯 Casos de uso comunes
- 🎨 Sugerencias de UI/UX

### 2. **test-edit-sleep.js**
Script de pruebas automatizado que prueba:
- ✅ Edición de hora de inicio
- ✅ Edición de hora de fin
- ✅ Agregar pausas (simple y con horarios)
- ✅ Eliminar pausas
- ✅ Actualización completa
- ✅ Edición de ambos horarios

### 3. **DESPLIEGUE-EXITOSO.md**
Documentación del despliegue anterior.

---

## 🔧 CAMBIOS TÉCNICOS

### Controller (sleepPredictionController.js)

**Método `recordSleepEvent` mejorado:**
```javascript
// Ahora calcula:
- grossDuration (duración bruta)
- netDuration (duración neta sin pausas)
- Soporta array de pausas en creación
```

**Método `updateSleepEvent` mejorado:**
```javascript
// Ahora:
- Recalcula duraciones automáticamente
- Procesa pausas correctamente
- Valida campos editables
- Retorna evento actualizado completo
```

### Server.js

**3 Nuevos Endpoints:**

1. **PATCH /api/sleep/:eventId/times**
   - Edita solo horarios
   - Recalcula duraciones
   - Más eficiente para cambios de tiempo

2. **POST /api/sleep/:eventId/pause**
   - Agrega pausa con duración o horarios
   - Actualiza duración neta automáticamente
   - Retorna ID de pausa para referencia

3. **DELETE /api/sleep/:eventId/pause/:pauseId**
   - Elimina pausa específica
   - Recalcula duración neta
   - Retorna nuevo total de pausas

---

## 📊 ESTRUCTURA DE DATOS ACTUALIZADA

### Colección: sleepEvents

**Campos Nuevos:**
```javascript
{
  // ... campos existentes ...
  
  grossDuration: Number,  // Duración total (con pausas)
  netDuration: Number,    // Duración efectiva (sin pausas)
  
  pauses: [               // Array de pausas
    {
      id: String,         // ID único de la pausa
      startTime: String,  // Hora inicio (opcional)
      endTime: String,    // Hora fin (opcional)
      duration: Number,   // Duración en minutos
      reason: String,     // Motivo de la pausa
      createdAt: String   // Timestamp de creación
    }
  ]
}
```

---

## 🧪 TESTING

### Nuevo Script de Pruebas

```bash
# Ejecutar pruebas de edición
npm run test:edit

# O manualmente:
TEST_TOKEN=tu_token TEST_CHILD_ID=child_id node test-edit-sleep.js
```

**Pruebas incluidas:**
1. ✅ Crear evento de prueba
2. ✅ Editar hora de inicio
3. ✅ Editar hora de fin
4. ✅ Agregar primera pausa
5. ✅ Agregar segunda pausa
6. ✅ Ver evento completo
7. ✅ Eliminar pausa
8. ✅ Actualización completa
9. ✅ Editar ambos horarios
10. ✅ Verificar resultado final

---

## 📱 INTEGRACIÓN EN APP

### Ejemplo React Native

```jsx
// Editar horarios
const updateTimes = async (eventId, startTime, endTime) => {
  await fetch(`${API_URL}/api/sleep/${eventId}/times`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ startTime, endTime })
  });
};

// Agregar pausa
const addPause = async (eventId, duration, reason) => {
  await fetch(`${API_URL}/api/sleep/${eventId}/pause`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ duration, reason })
  });
};

// Eliminar pausa
const removePause = async (eventId, pauseId) => {
  await fetch(`${API_URL}/api/sleep/${eventId}/pause/${pauseId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
};
```

---

## 🚀 DESPLIEGUE

### Información del Deploy

```
✅ Commit: 1a4f071
✅ Push a GitHub: Exitoso
✅ Deploy a Vercel: Exitoso
✅ URL: https://mumpabackend-pz09itwwo-mishu-lojans-projects.vercel.app
✅ Estado: Production Ready
```

### Auto-Deploy Configurado

Cada push a `main` desplegará automáticamente a Vercel.

---

## 📈 ESTADÍSTICAS

```
📝 Archivos modificados:    6
📄 Archivos nuevos:         3
➕ Líneas agregadas:        1,604
🔌 Endpoints nuevos:        3
🧪 Tests nuevos:            10
📖 Documentación:           1 guía completa
```

---

## 🎯 CASOS DE USO RESUELTOS

### ✅ Problema 1: "Empezó a dormir antes"
**Solución**: `PATCH /api/sleep/:eventId/times` con nuevo `startTime`

### ✅ Problema 2: "Se despertó en medio de la siesta"
**Solución**: `POST /api/sleep/:eventId/pause` con duración de interrupción

### ✅ Problema 3: "Múltiples interrupciones"
**Solución**: Múltiples llamadas a `POST /api/sleep/:eventId/pause`

### ✅ Problema 4: "Error al registrar horarios"
**Solución**: `PATCH /api/sleep/:eventId/times` con horarios correctos

### ✅ Problema 5: "Pausa registrada por error"
**Solución**: `DELETE /api/sleep/:eventId/pause/:pauseId`

---

## 🔄 MIGRACIÓN

### Eventos Existentes

Los eventos existentes sin pausas funcionarán normalmente:
- `duration` se mantiene como está
- `grossDuration` y `netDuration` se calcularán en próximas ediciones
- `pauses` será array vacío por defecto

### Compatibilidad

✅ **100% compatible con versión anterior**
- Endpoints antiguos siguen funcionando
- Estructura de datos es retrocompatible
- No requiere migración de datos

---

## 📚 DOCUMENTACIÓN

### Archivos Actualizados

1. **GUIA-EDICION-SIESTAS.md** - Guía completa (NUEVO)
2. **test-edit-sleep.js** - Script de pruebas (NUEVO)
3. **DESPLIEGUE-EXITOSO.md** - Info de deploy (NUEVO)
4. **package.json** - Versión 1.2.0
5. **controllers/sleepPredictionController.js** - Lógica mejorada
6. **server.js** - 3 endpoints nuevos

### Cómo Usar

```bash
# Ver guía completa
cat GUIA-EDICION-SIESTAS.md

# Probar funcionalidades
npm run test:edit

# Ver documentación API
cat API-SLEEP-PREDICTION.md
```

---

## 🎉 RESUMEN

### Lo Que Puedes Hacer Ahora

1. ✅ **Editar horarios** de inicio y fin
2. ✅ **Agregar pausas** durante el sueño
3. ✅ **Eliminar pausas** incorrectas
4. ✅ **Ver duración neta** (sin pausas)
5. ✅ **Actualizar eventos** completamente

### Beneficios

- 📊 **Datos más precisos** - Duración real de sueño
- 🔧 **Mayor flexibilidad** - Edita cualquier aspecto
- 📝 **Mejor tracking** - Registra interrupciones
- 🎯 **Corrección de errores** - Ajusta registros incorrectos
- 📈 **Análisis mejorado** - Patrones más precisos

---

## 🔮 PRÓXIMAS MEJORAS (v1.3.0)

- [ ] Edición masiva de eventos
- [ ] Plantillas de pausas comunes
- [ ] Historial de ediciones
- [ ] Notificaciones de pausas largas
- [ ] Análisis de calidad de sueño por pausas

---

## 📞 SOPORTE

### Recursos

- 📖 **Guía**: `GUIA-EDICION-SIESTAS.md`
- 🧪 **Tests**: `npm run test:edit`
- 📚 **API**: `API-SLEEP-PREDICTION.md`
- 🌐 **Vercel**: https://vercel.com/mishu-lojans-projects/mumpabackend

### Contacto

- **Email**: support@munpa.online
- **GitHub**: https://github.com/milifusa/mumpabackend

---

**¡Sistema de edición completamente funcional! 📝✨**

**Versión**: 1.2.0  
**Estado**: ✅ Production Ready  
**Deploy**: https://mumpabackend-pz09itwwo-mishu-lojans-projects.vercel.app

