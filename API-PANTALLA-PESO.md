## Endpoints para pantalla de Crecimiento (Weight, Height, Head, Summary)

Estos endpoints soportan la pantalla de crecimiento (peso, altura, cabeza y resumen).
Requieren `Authorization: Bearer <token>`.

### 1) Historial de peso (Weight)
`GET /api/children/:childId/measurements/weight`

Respuesta (lista ordenada por `measuredAt` desc):
```json
{
  "success": true,
  "data": [
    {
      "id": "abc123",
      "valueKg": 3.46,
      "measuredAt": "2025-09-05T11:26:00.000Z",
      "ageWeeks": 4,
      "percentile": 52.3,
      "source": "app",
      "notes": "Control 1 dia",
      "createdBy": { "uid": "USER_ID", "name": "Mishu Lojan" }
    }
  ]
}
```

Notas:
- Si la subcoleccion `measurements_weight` esta vacia, el backend hace fallback
  a la coleccion `measurements` y mapea `weight -> valueKg`, `date -> measuredAt`.

### 2) Crear peso
`POST /api/children/:childId/measurements/weight`

Body:
```json
{ "valueKg": 3.46, "measuredAt": "2025-09-05T11:26:00.000Z", "notes": "Opcional", "source": "app" }
```

Respuesta:
```json
{
  "success": true,
  "message": "Peso registrado exitosamente",
  "data": {
    "id": "abc123",
    "valueKg": 3.46,
    "measuredAt": "2025-09-05T11:26:00.000Z",
    "ageWeeks": 4,
    "percentile": 52.3,
    "source": "app",
    "notes": "Opcional",
    "createdBy": { "uid": "USER_ID", "name": "Mishu Lojan" }
  }
}
```

### 3) Editar peso
`PUT /api/children/:childId/measurements/weight/:id`

Body (cualquier campo):
```json
{ "valueKg": 3.55, "measuredAt": "2025-09-06T09:00:00.000Z", "notes": "Reajuste" }
```

### 4) Eliminar peso
`DELETE /api/children/:childId/measurements/weight/:id`

Respuesta:
```json
{ "success": true, "message": "Peso eliminado exitosamente" }
```

---

## Height (Altura)

### Historial de altura
`GET /api/children/:childId/measurements/height`

Campos por item:
- `id`, `valueCm`, `measuredAt`, `ageWeeks?`, `percentile?`, `source?`, `notes?`, `createdBy`

### Crear altura
`POST /api/children/:childId/measurements/height`

Body:
```json
{ "valueCm": 52, "measuredAt": "2025-09-05T11:26:00.000Z", "notes": "Opcional", "source": "app" }
```

### Editar altura
`PUT /api/children/:childId/measurements/height/:id`

### Eliminar altura
`DELETE /api/children/:childId/measurements/height/:id`

---

## Head (Perimetro cefalico)

### Historial de head
`GET /api/children/:childId/measurements/head`

Campos por item:
- `id`, `valueCm`, `measuredAt`, `ageWeeks?`, `percentile?`, `source?`, `notes?`, `createdBy`

### Crear head
`POST /api/children/:childId/measurements/head`

Body:
```json
{ "valueCm": 34, "measuredAt": "2025-09-05T11:26:00.000Z", "notes": "Opcional", "source": "app" }
```

### Editar head
`PUT /api/children/:childId/measurements/head/:id`

### Eliminar head
`DELETE /api/children/:childId/measurements/head/:id`

---

## Summary (tabla de historial)

`GET /api/children/:childId/measurements/summary`

Respuesta:
```json
{
  "success": true,
  "data": {
    "latest": {
      "id": "abc123",
      "measuredAt": "2025-09-05T11:26:00.000Z",
      "weightKg": 3.46,
      "heightCm": 52,
      "headCm": 34,
      "weightPercentile": 48.1,
      "heightPercentile": 62.4,
      "headPercentile": 51.2,
      "ageWeeks": 4,
      "notes": null,
      "createdBy": null
    },
    "history": [
      {
        "id": "abc123",
        "measuredAt": "2025-09-05T11:26:00.000Z",
        "weightKg": 3.46,
        "heightCm": 52,
        "headCm": 34,
        "weightPercentile": 48.1,
        "heightPercentile": 62.4,
        "headPercentile": 51.2,
        "ageWeeks": 4,
        "notes": null,
        "createdBy": null
      }
    ]
  }
}
```

---

## Percentiles para la grafica

Endpoint:
`GET /api/growth/percentiles?sex=M|F&type=weight|height|head&ageWeeks=...`

Ejemplos:
- `GET /api/growth/percentiles?sex=F&type=weight` -> devuelve toda la curva de peso
- `GET /api/growth/percentiles?sex=F&type=height&ageWeeks=12` -> devuelve un punto interpolado de altura
- `GET /api/growth/percentiles?sex=F&type=head&ageWeeks=12` -> devuelve un punto interpolado de cabeza

Respuesta (curva completa):
```json
{
  "success": true,
  "data": [
    { "ageWeeks": 0, "p3": 2.4, "p50": 3.2, "p97": 4.2 },
    { "ageWeeks": 1, "p3": 2.6, "p50": 3.4, "p97": 4.4 }
  ],
  "meta": { "sex": "F", "type": "weight" }
}
```

Respuesta (punto):
```json
{
  "success": true,
  "data": { "ageWeeks": 12, "p3": 4.8, "p50": 6.1, "p97": 7.7 },
  "meta": { "sex": "F", "type": "height" }
}
```

Si no hay curvas configuradas, responde 200 con data de respaldo (synthetic):
```json
{
  "success": true,
  "data": [
    { "ageWeeks": 0, "p3": 2.4, "p50": 3.2, "p97": 4.0 }
  ],
  "meta": { "sex": "F", "type": "weight", "empty": true, "synthetic": true },
  "message": "Curvas de percentiles no configuradas"
}
```

---

## Estructura en Firestore

### Pesos
```
children/{childId}/measurements_weight/{id}
{
  valueKg: number,
  measuredAt: Timestamp,
  notes: string,
  source: string | null,
  createdBy: { uid: string, name: string },
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### Altura
```
children/{childId}/measurements_height/{id}
{
  valueCm: number,
  measuredAt: Timestamp,
  notes: string,
  source: string | null,
  createdBy: { uid: string, name: string },
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### Perimetro cefalico
```
children/{childId}/measurements_head/{id}
{
  valueCm: number,
  measuredAt: Timestamp,
  notes: string,
  source: string | null,
  createdBy: { uid: string, name: string },
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### Curvas de percentiles (weight/height/head)
```
growth_percentiles/{docId}
{
  type: "weight" | "height" | "head",
  sex: "M" | "F",
  points: [
    { ageWeeks: 0, p3: 2.4, p50: 3.2, p97: 4.2 },
    { ageWeeks: 1, p3: 2.6, p50: 3.4, p97: 4.4 }
  ]
}
```

---

## Checklist para el Frontend

1) Cargar historial con `GET /api/children/:childId/measurements/weight`
2) Usar `valueKg` y `measuredAt` para la lista y la grafica
3) Cargar curvas con `GET /api/growth/percentiles?sex=M|F&type=weight|height|head`
4) Si se necesita un punto especifico por edad, usar `ageWeeks`
5) Usar `GET /api/children/:childId/measurements/summary` para la tabla Summary
6) En caso de 404 en percentiles, mostrar grafica sin curvas
