# API Medicamentos y Recordatorios

Este documento explica cómo integrar el módulo de medicamentos en el frontend.

## Autenticación
Todos los endpoints requieren header:

- `Authorization: Bearer <token>`

## Modelo de datos

### Medicamento
- `id` (string)
- `childId` (string)
- `name` (string)
- `dose` (number|string)
- `doseUnit` (string) Ej: `ml`, `mg`, `gotas`
- `times` (string[]) Horas en formato `HH:mm`
- `repeatEveryMinutes` (number|null) Intervalo en minutos (ej: 60)
- `startTime` (string|null) `HH:mm` inicio de ventana
- `endTime` (string|null) `HH:mm` fin de ventana
- `startDate` (string|null) `YYYY-MM-DD`
- `endDate` (string|null) `YYYY-MM-DD`
- `notes` (string)
- `timezone` (string) Ej: `America/Mexico_City`
- `scheduleDays` (number) Días a programar (1–60)
- `active` (boolean)
- `createdAt` (timestamp)
- `updatedAt` (timestamp)

### Recordatorio programado
Se guarda en `scheduled_med_notifications` y se procesa por el cron.
- `reminderId` (string)
- `medicationId` (string)
- `childId` (string)
- `userId` (string)
- `title` (string)
- `body` (string)
- `scheduledFor` (Date UTC)
- `data` (object) incluye `reminderId`

---

## Endpoints

### 1) Crear medicamento + programar recordatorios
`POST /api/medications`

#### Body
```json
{
  "childId": "abc123",
  "name": "Paracetamol",
  "dose": 5,
  "doseUnit": "ml",
  "times": ["08:00", "14:00", "20:00"],
  "startDate": "2026-01-21",
  "endDate": "2026-01-28",
  "scheduleDays": 14,
  "notes": "Con alimento",
  "timezone": "America/Mexico_City"
}
```

#### Cada hora (modo intervalos)
```json
{
  "childId": "abc123",
  "name": "Amoxicilina",
  "dose": 5,
  "doseUnit": "ml",
  "repeatEveryMinutes": 60,
  "startTime": "08:00",
  "endTime": "20:00",
  "scheduleDays": 7,
  "timezone": "America/Mexico_City"
}
```

#### Respuesta
```json
{
  "success": true,
  "message": "Medicamento registrado",
  "data": {
    "id": "med_123",
    "childId": "abc123",
    "name": "Paracetamol",
    "dose": 5,
    "doseUnit": "ml",
    "times": ["08:00", "14:00", "20:00"],
    "startDate": "2026-01-21",
    "endDate": "2026-01-28",
    "notes": "Con alimento",
    "timezone": "America/Mexico_City",
    "scheduleDays": 14,
    "active": true,
    "scheduledReminders": 42
  }
}
```

---

### 2) Listar medicamentos por hijo
`GET /api/medications/:childId`

#### Respuesta
```json
{
  "success": true,
  "data": [
    {
      "id": "med_123",
      "name": "Paracetamol",
      "dose": 5,
      "doseUnit": "ml",
      "times": ["08:00", "14:00", "20:00"],
      "scheduleDays": 14,
      "active": true
    }
  ]
}
```

---

### 3) Actualizar medicamento + reprogramar recordatorios
`PUT /api/medications/:medicationId`

#### Body (parcial)
```json
{
  "dose": 7.5,
  "times": ["09:00", "15:00", "21:00"],
  "scheduleDays": 30,
  "active": true
}
```

#### Actualizar a cada hora
```json
{
  "repeatEveryMinutes": 60,
  "startTime": "08:00",
  "endTime": "20:00"
}
```

#### Respuesta
```json
{
  "success": true,
  "message": "Medicamento actualizado",
  "data": {
    "id": "med_123",
    "scheduledReminders": 90
  }
}
```

---

### 4) Eliminar medicamento
`DELETE /api/medications/:medicationId`

#### Respuesta
```json
{
  "success": true,
  "message": "Medicamento eliminado"
}
```

---

### 5) Marcar recordatorio como tomado o no tomado
`POST /api/medications/reminders/:reminderId/taken`

#### Body (opcional)
```json
{
  "taken": false,
  "status": "missed",
  "note": "No estaba en casa"
}
```

#### Respuesta
```json
{
  "success": true,
  "message": "Medicamento marcado como no tomado",
  "status": "missed"
}
```

Notas:
- Si no envías body o no envías `status`, se marca como `taken`.
- Si envías `taken: false`, se marca como `missed`.
- `status` puede ser `taken`, `missed` o `skipped`.
- Si el usuario marca `missed` o `skipped`, se envía un push inmediato de recordatorio.
- Si no se marca como tomada en 2 horas, se envía un push automático de recordatorio.

---

## Push notifications

### Payload esperado
```json
{
  "type": "medication_reminder",
  "childId": "abc123",
  "medicationId": "med_123",
  "medicationName": "Paracetamol",
  "dose": "5",
  "doseUnit": "ml",
  "time": "2026-01-21T14:00:00.000Z",
  "reminderId": "rem_456",
  "screen": "MedicationScreen"
}
```

### Recomendación en frontend
- Al recibir el push, abrir `MedicationScreen`.
- Usar `reminderId` para mostrar “Marcar como tomado”.

---

## Notas importantes
- `times` debe ser siempre `HH:mm` (24h).
- `scheduleDays` controla cuántos días se programan por adelantado (1–60).
- Para intervalos, usa `repeatEveryMinutes` + `startTime` + `endTime` (mínimo 5 min).
- El cron existente procesa recordatorios cada ejecución:  
  `/api/sleep/notifications/process-scheduled`

