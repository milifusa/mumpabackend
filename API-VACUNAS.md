## API Vacunas

Requiere `Authorization: Bearer <token>`.

### Calendarios de vacunacion

**Donde se cargan:**
- Coleccion: `vaccine_schedules`
- Endpoints admin:
  - `POST /api/admin/vaccines/schedules` crear
  - `PUT /api/admin/vaccines/schedules/:id` actualizar
  - `DELETE /api/admin/vaccines/schedules/:id` eliminar

**Formato del calendario (documento):**
```json
{
  "countryId": "COUNTRY_ID",
  "countryName": "Ecuador",
  "name": "Calendario Ecuador",
  "isActive": true,
  "items": [
    { "id": "bcg", "name": "BCG", "ageMonths": 0, "notes": "Al nacer" },
    { "id": "penta-2m", "name": "Pentavalente", "ageMonths": 2, "notes": "1ra dosis" },
    { "id": "hepb-1w", "name": "Hepatitis B", "ageWeeks": 1 }
  ],
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

**Reglas del formato:**
- `countryId` debe existir en `countries`.
- `items` es un array de vacunas; cada item debe tener `name`.
- Usar **solo uno**: `ageMonths` o `ageWeeks` para calcular `scheduledDate`.
- `id` es opcional, pero recomendado para trazabilidad.

- `GET /api/vaccines/schedules` listar calendarios activos
- `GET /api/vaccines/schedules/country/:countryId` obtener calendario por pais

Admin:
- `GET /api/admin/vaccines/schedules`
- `POST /api/admin/vaccines/schedules`
- `PUT /api/admin/vaccines/schedules/:id`
- `DELETE /api/admin/vaccines/schedules/:id`

Body ejemplo (crear calendario):
```json
{
  "countryId": "COUNTRY_ID",
  "name": "Calendario Ecuador",
  "items": [
    { "id": "bcg", "name": "BCG", "ageMonths": 0 },
    { "id": "penta-2m", "name": "Pentavalente", "ageMonths": 2, "notes": "1ra dosis" }
  ]
}
```

### Vacunas por bebe

- `GET /api/children/:childId/vaccines`
- `POST /api/children/:childId/vaccines`
- `PUT /api/children/:childId/vaccines/:vaccineId`
- `DELETE /api/children/:childId/vaccines/:vaccineId`
- `POST /api/children/:childId/vaccines/assign-schedule`

Body ejemplo (asignar calendario):
```json
{
  "countryId": "COUNTRY_ID"
}
```

Body ejemplo (registrar/actualizar vacuna):
```json
{
  "name": "Pentavalente",
  "scheduledDate": "2026-08-15T00:00:00.000Z",
  "appliedDate": "2026-08-20T00:00:00.000Z",
  "status": "pending",
  "location": "Centro de salud",
  "batch": "Lote-123",
  "notes": "Sin reaccion"
}
```

Notas:
- Si el bebe no tiene vacunas y no tiene `vaccinationCountryId`, `GET /vaccines` devuelve `needsVaccinationCountry=true`.
- Al asignar calendario se crean las vacunas con `scheduledDate` calculada desde `birthDate`.
- Se envia un recordatorio 1 semana antes via notificaciones diarias.
