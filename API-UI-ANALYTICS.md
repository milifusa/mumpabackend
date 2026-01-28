# API Analytics UI (Pantallas y Botones)

Este API permite registrar **vistas** y **clicks** por pantalla/botón, y consultar estadísticas desde el dashboard.

## 1) Registrar evento (App)
`POST /api/analytics/ui/events`

**Auth:** `Authorization: Bearer <token>`

### Body
```json
{
  "page": "MedicamentosScreen",
  "button": "AgregarMedicamento",
  "eventType": "click",
  "metadata": {
    "platform": "ios"
  }
}
```

### `eventType` válidos
- `view`
- `click`

### Respuesta
```json
{
  "success": true,
  "message": "Evento registrado",
  "data": {
    "page": "MedicamentosScreen",
    "button": "AgregarMedicamento",
    "eventType": "click",
    "timestamp": "2026-01-22T..."
  }
}
```

---

## 2) Consultar estadísticas (Dashboard Admin)
`GET /api/admin/analytics/ui`

**Auth:** `Authorization: Bearer <token>` (admin)

### Query params (opcionales)
- `page=MedicamentosScreen`
- `button=AgregarMedicamento`

### Respuesta
```json
{
  "success": true,
  "data": [
    {
      "id": "MedicamentosScreen::AgregarMedicamento",
      "page": "MedicamentosScreen",
      "button": "AgregarMedicamento",
      "views": 124,
      "clicks": 31,
      "updatedAt": "2026-01-22T..."
    }
  ]
}
```

---

## Notas
- Si `button` es `null`, se cuentan vistas por pantalla.
- Los eventos se guardan en `ui_analytics_events` y los agregados en `ui_analytics`.
