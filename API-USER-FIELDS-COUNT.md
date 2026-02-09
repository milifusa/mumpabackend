# API: Conteo de Campos de Usuarios (displayName vs name)

## Endpoint

### GET `/api/admin/analytics/user-fields-count`

Analiza todos los usuarios y cuenta cuántos tienen los campos `displayName` y/o `name` poblados.

#### Headers Requeridos
```http
Authorization: Bearer {ADMIN_JWT_TOKEN}
Content-Type: application/json
```

#### Respuesta Exitosa (200 OK)

```json
{
  "success": true,
  "data": {
    "totalUsers": 150,
    "usersWithDisplayName": 120,
    "usersWithName": 80,
    "usersWithBoth": 60,
    "usersOnlyDisplayName": 60,
    "usersOnlyName": 20,
    "usersWithNeither": 10,
    "percentages": {
      "withDisplayName": "80.0",
      "withName": "53.3",
      "withBoth": "40.0",
      "onlyDisplayName": "40.0",
      "onlyName": "13.3",
      "withNeither": "6.7"
    }
  },
  "generatedAt": "2026-02-08T20:30:00.000Z"
}
```

#### Descripción de Campos

- `totalUsers`: Total de usuarios en la base de datos
- `usersWithDisplayName`: Usuarios que tienen el campo `displayName` (no vacío)
- `usersWithName`: Usuarios que tienen el campo `name` (no vacío)
- `usersWithBoth`: Usuarios que tienen **ambos** campos poblados
- `usersOnlyDisplayName`: Usuarios que **solo** tienen `displayName` (sin `name`)
- `usersOnlyName`: Usuarios que **solo** tienen `name` (sin `displayName`)
- `usersWithNeither`: Usuarios que **no tienen ninguno** de los dos campos

## Uso

```bash
curl -X GET "https://api.munpa.online/api/admin/analytics/user-fields-count" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"
```

## Notas

- Solo accesible por administradores
- Consulta todos los usuarios, puede tardar en bases de datos grandes
- Un campo se considera "poblado" si existe, no es null y no está vacío después de trim()
