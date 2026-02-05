## API Denticion (erupcion y caida)

Requiere `Authorization: Bearer <token>`.

### Resumen
- `GET /api/children/:childId/teething/summary`

Respuesta incluye:
- `ageMonths`
- `teeth` (estado por diente)
- `timeline` (eventos ordenados desc)

### Eventos
- `GET /api/children/:childId/teething/events?month=9`
- `POST /api/children/:childId/teething/events`
- `PUT /api/children/:childId/teething/events/:eventId`
- `DELETE /api/children/:childId/teething/events/:eventId`

Body (crear/editar):
```json
{
  "toothId": "upper-central-incisor-left",
  "type": "erupt",
  "occurredAt": "2026-02-02T14:13:00.000Z",
  "symptoms": ["tooth_ache", "drooling"],
  "notes": "Dolor leve"
}
```

### Regla del Raton Perez
- Si `type` es `shed` y la edad del nino es >= 48 meses, el evento marca `notifyToothFairy: true` y se crea una notificacion en `notifications`.

### Estructura Firestore
```
children/{childId}/teething_events/{eventId}
{
  toothId,
  toothName,
  type: "erupt" | "shed",
  occurredAt,
  symptoms: [],
  notes,
  notifyToothFairy,
  createdBy: { uid, name },
  createdAt,
  updatedAt
}
```
