# 🎉 Nuevas Funcionalidades de Eventos - IMPLEMENTADAS

## ✅ Resumen de Implementación

Se han agregado **3 nuevas funcionalidades avanzadas** al sistema de eventos:

1. **Lista de Espera** - Cuando un evento se llena
2. **Check-in con QR** - Verificación de asistencia presencial
3. **Integración con Google Calendar** - Exportar eventos

---

## 1️⃣ LISTA DE ESPERA

### 📋 Funcionamiento

Cuando un evento alcanza su límite de asistentes (`maxAttendees`), los usuarios que intenten confirmar asistencia serán automáticamente agregados a una **lista de espera**.

### 🔄 Promoción Automática

Cuando un asistente confirma cancela su asistencia:
1. Se libera el cupo
2. El **primer usuario** de la lista de espera es **promovido automáticamente**
3. Se le envía una **notificación push** informándole

### 📡 Endpoints

#### Confirmar Asistencia (con lista de espera automática)
```http
POST /api/posts/:postId/attend
```

**Comportamiento:**
- Si hay cupo disponible → Confirma asistencia normal
- Si el evento está lleno → Agrega a lista de espera

**Respuesta cuando se agrega a lista de espera:**
```json
{
  "success": true,
  "message": "Agregado a lista de espera. Te notificaremos si se libera un cupo.",
  "data": {
    "postId": "post_xyz",
    "attendeeCount": 20,
    "waitlistCount": 3,
    "userInWaitlist": true,
    "userAttending": false
  }
}
```

#### Salir de la Lista de Espera
```http
DELETE /api/posts/:postId/waitlist
```

**Response:**
```json
{
  "success": true,
  "message": "Saliste de la lista de espera exitosamente",
  "data": {
    "postId": "post_xyz",
    "waitlistCount": 2,
    "userInWaitlist": false
  }
}
```

### 🔔 Notificaciones

#### Usuario Agregado a Lista de Espera
- **Tipo**: `event_waitlist_added`
- **Título**: "📋 Agregado a lista de espera"
- **Cuerpo**: "Te agregamos a la lista de espera de '[Evento]'. Te notificaremos si se libera un cupo."

#### Usuario Promovido de Lista de Espera
- **Tipo**: `event_waitlist_promoted`
- **Título**: "🎉 ¡Tienes un cupo disponible!"
- **Cuerpo**: "Se liberó un cupo para '[Evento]'. ¡Ya estás confirmado!"

### 📊 Estructura de Datos

```javascript
{
  eventData: {
    attendees: ["user1", "user2", ...],  // Máximo: maxAttendees
    attendeeCount: 20,
    waitlist: ["user3", "user4", ...],    // NUEVO: Lista de espera
    waitlistCount: 5,                      // NUEVO: Contador
    maxAttendees: 20
  }
}
```

---

## 2️⃣ CHECK-IN CON QR

### 📱 Funcionamiento

Sistema de verificación de asistencia presencial usando códigos QR únicos por evento.

### 🔑 Código Único

Cada evento genera un **código único de 8 caracteres** (ej: `A7K9M2X1`) que se usa para:
- Generar código QR
- Validar check-ins
- Prevenir check-ins fraudulentos

### 📡 Endpoints

#### Generar Código QR (Solo Organizador)
```http
GET /api/posts/:postId/qr-code
```

**Requiere:** Usuario debe ser el organizador del evento

**Response:**
```json
{
  "success": true,
  "data": {
    "postId": "post_xyz",
    "eventTitle": "Reunión de Mamás",
    "checkInCode": "A7K9M2X1",
    "checkInUrl": "https://munpa.app/event/post_xyz/checkin?code=A7K9M2X1",
    "qrData": "https://munpa.app/event/post_xyz/checkin?code=A7K9M2X1"
  }
}
```

**Uso en Frontend:**
```javascript
// El frontend puede usar cualquier librería de QR
import QRCode from 'qrcode';

const generateQR = async (qrData) => {
  const qrImage = await QRCode.toDataURL(qrData);
  // Mostrar qrImage en la interfaz
};
```

#### Hacer Check-in (Escanear QR)
```http
POST /api/posts/:postId/checkin
```

**Body:**
```json
{
  "code": "A7K9M2X1"
}
```

**Validaciones:**
- Usuario debe estar en la lista de asistentes
- Código debe ser válido
- No se puede hacer check-in más de una vez

**Response:**
```json
{
  "success": true,
  "message": "Check-in realizado exitosamente",
  "data": {
    "postId": "post_xyz",
    "checkedInCount": 15,
    "userCheckedIn": true,
    "checkInTime": "2026-02-15T16:05:23Z"
  }
}
```

### 🔔 Notificaciones

#### Check-in Registrado (al organizador)
- **Tipo**: `event_checkin`
- **Título**: "✅ Check-in registrado"
- **Cuerpo**: "[Usuario] hizo check-in en '[Evento]'"

### 📊 Estructura de Datos

```javascript
{
  eventData: {
    checkInCode: "A7K9M2X1",                    // NUEVO: Código único
    checkedInAttendees: ["user1", "user2"],     // NUEVO: Quiénes hicieron check-in
    checkedInCount: 2,                          // NUEVO: Contador
    checkInTimes: {                             // NUEVO: Timestamp de cada check-in
      "user1": "2026-02-15T16:05:00Z",
      "user2": "2026-02-15T16:07:00Z"
    }
  }
}
```

### 🎯 Flujo Completo

1. **Antes del Evento:**
   - Organizador genera QR desde la app
   - Se muestra el código QR en pantalla

2. **Durante el Evento:**
   - Organizador muestra QR en la entrada
   - Asistentes escanean QR con la app
   - O ingresan código manualmente

3. **Confirmación:**
   - Check-in se registra instantáneamente
   - Organizador ve la lista actualizada
   - Se puede ver quién asistió vs. quién confirmó

---

## 3️⃣ INTEGRACIÓN CON GOOGLE CALENDAR

### 📅 Funcionalidades

Permite a los usuarios agregar eventos de Munpa directamente a Google Calendar o cualquier app de calendario compatible.

### 📡 Endpoints

#### Descargar Archivo .ics
```http
GET /api/posts/:postId/calendar
```

**Respuesta:** Archivo `.ics` descargable

**Uso:**
- Compatible con Google Calendar, Apple Calendar, Outlook, etc.
- El usuario descarga el archivo y lo abre
- El evento se agrega automáticamente a su calendario

**Contenido del archivo:**
```
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Munpa//Event Calendar//ES
...
SUMMARY:Reunión de Mamás - Parque Central
DTSTART:20260215T160000Z
DTEND:20260215T190000Z
LOCATION:Parque Central, Av. Principal 123
DESCRIPTION:Nos juntamos para que los niños jueguen...
...
END:VCALENDAR
```

#### Obtener URL de Google Calendar
```http
GET /api/posts/:postId/calendar/google
```

**Response:**
```json
{
  "success": true,
  "data": {
    "googleCalendarUrl": "https://calendar.google.com/calendar/render?action=TEMPLATE&text=...",
    "eventTitle": "Reunión de Mamás",
    "eventDate": "2026-02-15T16:00:00Z",
    "eventEndDate": "2026-02-15T19:00:00Z"
  }
}
```

**Uso en Frontend:**
```javascript
// Abrir directamente en Google Calendar
const addToGoogleCalendar = (url) => {
  window.open(url, '_blank');
};
```

### ⏰ Recordatorio Incluido

Los archivos .ics incluyen un **recordatorio automático de 24 horas antes** del evento.

### 🎯 Opciones de Integración

#### Botón "Agregar a Calendario"
```jsx
<View>
  <Button 
    title="📅 Agregar a Google Calendar"
    onPress={() => {
      const url = await getGoogleCalendarUrl(eventId);
      Linking.openURL(url);
    }}
  />
  <Button 
    title="📥 Descargar .ics"
    onPress={() => {
      const url = `/api/posts/${eventId}/calendar`;
      Linking.openURL(url);
    }}
  />
</View>
```

---

## 📊 ESTADÍSTICAS Y MÉTRICAS

Con las nuevas funcionalidades, los organizadores pueden ver:

### Para Lista de Espera:
- Total de personas en lista de espera
- Posición en la fila (próximamente)
- Tasa de conversión (espera → asistente)

### Para Check-in:
- **Tasa de asistencia real**: `checkedInCount / attendeeCount`
- Quiénes confirmaron pero no asistieron
- Hora de llegada de cada asistente
- Patrón de puntualidad

### Para Calendar:
- Cuántos usuarios exportaron el evento
- Recordatorios efectivos
- Engagement con el evento

---

## 🔄 FLUJOS DE USUARIO COMPLETOS

### Flujo 1: Evento se Llena
```
1. Usuario 1-20: Confirman asistencia ✅
2. Usuario 21: Intenta confirmar → Agregado a lista de espera 📋
3. Usuario 22-25: También en lista de espera 📋
4. Usuario 5: Cancela asistencia ❌
5. Usuario 21: Automáticamente promovido! 🎉
6. Notificación: "¡Tienes un cupo disponible!"
```

### Flujo 2: Check-in en el Evento
```
1. Organizador: Genera QR desde la app 📱
2. Muestra QR en la entrada del evento
3. Asistente: Escanea QR con app de Munpa
4. Check-in registrado ✅
5. Organizador: Ve contador actualizado en tiempo real
6. Post-evento: Compara confirmados vs. asistentes reales
```

### Flujo 3: Agregar a Calendario
```
1. Usuario: Ve evento en la app
2. Toca "Agregar a mi calendario" 📅
3. Selecciona opción:
   - "Google Calendar" → Abre directamente
   - "Descargar .ics" → Compatible con cualquier app
4. Evento agregado con recordatorio 24h antes ⏰
```

---

## 🎨 EJEMPLOS DE UI

### Card de Evento con Lista de Espera

```
┌────────────────────────────────────┐
│ 📅 EVENTO - LLENO                  │
│ [Foto del evento]                  │
│                                    │
│ Workshop: Lactancia Materna        │
│ 📅 20 Mar 2026 - 10:00 AM         │
│ 📍 Centro Comunitario              │
│ 👥 15/15 asistentes (LLENO)        │
│ 📋 5 en lista de espera            │
│                                    │
│ [Unirme a lista de espera 📋]      │
│                                    │
│ Publicado por Dra. María Sánchez   │
└────────────────────────────────────┘
```

### Pantalla de QR para Check-in

```
┌────────────────────────────────────┐
│ ✅ Check-in del Evento             │
│                                    │
│ Reunión de Mamás                   │
│ Sábado, 15 de Febrero              │
│                                    │
│ ┌──────────────────────┐          │
│ │                      │          │
│ │    [CÓDIGO QR]       │          │
│ │                      │          │
│ └──────────────────────┘          │
│                                    │
│ Código: A7K9M2X1                   │
│                                    │
│ 📊 Check-ins: 12/20                │
│                                    │
│ Últimos check-ins:                 │
│ • María López (hace 2 min)         │
│ • Ana García (hace 5 min)          │
│ • Laura Pérez (hace 8 min)         │
│                                    │
│ [Ver todos los asistentes]         │
└────────────────────────────────────┘
```

### Botón de Calendario

```
┌────────────────────────────────────┐
│ 📅 Agregar a Calendario            │
│                                    │
│ [📅 Google Calendar]               │
│ [📥 Descargar archivo .ics]        │
│ [📧 Enviar por email]              │
└────────────────────────────────────┘
```

---

## 🔐 PERMISOS Y SEGURIDAD

### Lista de Espera:
- ✅ Cualquier miembro puede unirse
- ✅ Solo el usuario puede salirse
- ✅ Promoción automática e inmediata
- ✅ Notificaciones garantizadas

### Check-in QR:
- ✅ Solo organizador puede generar QR
- ✅ Solo asistentes confirmados pueden hacer check-in
- ✅ Un check-in por persona
- ✅ Código único por evento (no reutilizable)
- ✅ Timestamp de cada check-in guardado

### Calendario:
- ✅ Solo miembros de la comunidad
- ✅ Enlaces de Google Calendar públicos pero temporales
- ✅ Archivos .ics generados on-demand

---

## 📈 MÉTRICAS CLAVE

### KPIs Nuevos Disponibles:

1. **Tasa de Lista de Espera**
   - `waitlistCount / maxAttendees`
   - Indica demanda vs. capacidad

2. **Tasa de Asistencia Real**
   - `checkedInCount / attendeeCount`
   - Muestra compromiso real

3. **Tasa de Exportación a Calendario**
   - Usuarios que agregaron a calendario
   - Indica intención seria de asistir

4. **Tiempo Promedio de Check-in**
   - Analizar puntualidad
   - Optimizar horarios futuros

---

## 🚀 PRÓXIMAS MEJORAS SUGERIDAS

### Lista de Espera:
- [ ] Mostrar posición en la fila al usuario
- [ ] Límite de tiempo para aceptar promoción (48h)
- [ ] Notificaciones personalizadas de posición

### Check-in:
- [ ] Check-in automático por geolocalización
- [ ] Badges especiales para asistentes frecuentes
- [ ] Estadísticas de puntualidad

### Calendario:
- [ ] Sincronización bidireccional
- [ ] Agregar múltiples eventos a la vez
- [ ] Compartir calendario de eventos de la comunidad

---

## 🧪 TESTING

### Test de Lista de Espera

```bash
# 1. Crear evento con límite
POST /api/communities/{id}/posts
{
  "postType": "event",
  "eventData": {
    "title": "Test Event",
    "eventDate": "2026-03-01T15:00:00Z",
    "maxAttendees": 2
  }
}

# 2. Usuario 1 y 2 confirman (OK)
POST /api/posts/{id}/attend

# 3. Usuario 3 confirma (lista de espera)
POST /api/posts/{id}/attend
# Response: userInWaitlist: true

# 4. Usuario 1 cancela
DELETE /api/posts/{id}/attend

# 5. Verificar que Usuario 3 fue promovido
GET /api/posts/{id}/attendees
# Usuario 3 debe estar en attendees[]
```

### Test de Check-in

```bash
# 1. Organizador genera QR
GET /api/posts/{id}/qr-code
# Obtener checkInCode

# 2. Asistente hace check-in
POST /api/posts/{id}/checkin
{
  "code": "A7K9M2X1"
}
# Response: userCheckedIn: true

# 3. Intentar check-in duplicado (debe fallar)
POST /api/posts/{id}/checkin
{
  "code": "A7K9M2X1"
}
# Response: 400 "Ya hiciste check-in"
```

### Test de Calendar

```bash
# 1. Obtener URL de Google Calendar
GET /api/posts/{id}/calendar/google
# Debe retornar URL válida

# 2. Descargar archivo .ics
GET /api/posts/{id}/calendar
# Debe descargar archivo válido
# Abrir en app de calendario para verificar
```

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

- [x] Estructura de datos actualizada
- [x] Lista de espera automática
- [x] Promoción automática de lista de espera
- [x] Endpoint para salir de lista de espera
- [x] Sistema de QR único por evento
- [x] Endpoint para generar QR
- [x] Endpoint para check-in
- [x] Validaciones de check-in
- [x] Exportación a formato .ics
- [x] URL de Google Calendar
- [x] Notificaciones push para todas las acciones
- [x] Logging completo
- [x] Documentación

---

## 📞 SOPORTE

**Archivos de Referencia:**
- `API-EVENTOS-COMUNIDAD.md` - Documentación original
- `RESUMEN-EVENTOS-COMUNIDAD.md` - Guía de uso
- Este archivo - Nuevas funcionalidades

**Código Fuente:**
- `server.js` - Endpoints implementados

---

✅ **TODAS LAS FUNCIONALIDADES IMPLEMENTADAS Y LISTAS PARA PRODUCCIÓN** 🎉

Fecha de implementación: 5 de febrero de 2026
