# API - Deeplinks (Admin + Analytics)

Base: `https://api.munpa.online`

## Crear o actualizar deeplink (Admin)
`POST /api/admin/deeplinks`

Headers:
- `Authorization: Bearer <token_admin>`

Body:
```json
{
  "key": "home_sleep_tab",
  "name": "Home - Tab Sueno",
  "path": "home/sleep",
  "params": { "childId": "K6vfrjDYcwAp8cDgH9sh" },
  "category": "home",
  "description": "Abre el tab de sueno",
  "enabled": true
}
```

Respuesta:
```json
{
  "success": true,
  "message": "Deeplink guardado",
  "data": {
    "key": "home_sleep_tab",
    "name": "Home - Tab Sueno",
    "path": "home/sleep",
    "params": { "childId": "K6vfrjDYcwAp8cDgH9sh" },
    "category": "home",
    "description": "Abre el tab de sueno",
    "enabled": true,
    "deeplinkUrl": "munpa://home/sleep?childId=K6vfrjDYcwAp8cDgH9sh"
  }
}
```

## Listar deeplinks con stats (Admin)
`GET /api/admin/deeplinks`

Headers:
- `Authorization: Bearer <token_admin>`

Query opcional:
- `category=home`
- `enabled=true|false`

Respuesta:
```json
{
  "success": true,
  "data": [
    {
      "key": "home_sleep_tab",
      "name": "Home - Tab Sueno",
      "path": "home/sleep",
      "enabled": true,
      "deeplinkUrl": "munpa://home/sleep?childId=K6vfrjDYcwAp8cDgH9sh",
      "analytics": {
        "totalClicks": 12,
        "totalOpens": 4,
        "totalViews": 0,
        "totalEvents": 16,
        "lastEventAt": { "_seconds": 1769125904, "_nanoseconds": 568000000 }
      }
    }
  ]
}
```

## Registrar evento de deeplink (Auth)
`POST /api/analytics/deeplinks/events`

Headers:
- `Authorization: Bearer <token>`

Body:
```json
{
  "key": "home_sleep_tab",
  "eventType": "click",
  "path": "home/sleep",
  "params": { "childId": "K6vfrjDYcwAp8cDgH9sh" },
  "source": "dashboard_admin",
  "metadata": { "platform": "ios" }
}
```

Respuesta:
```json
{
  "success": true,
  "message": "Evento deeplink registrado",
  "data": {
    "key": "home_sleep_tab",
    "eventType": "click"
  }
}
```

## Consultar stats de deeplinks (Admin)
`GET /api/admin/analytics/deeplinks`

Headers:
- `Authorization: Bearer <token_admin>`

Query opcional:
- `key=home_sleep_tab`

Respuesta:
```json
{
  "success": true,
  "data": [
    {
      "key": "home_sleep_tab",
      "totalClicks": 12,
      "totalOpens": 4,
      "totalViews": 0,
      "totalEvents": 16,
      "lastEventAt": { "_seconds": 1769125904, "_nanoseconds": 568000000 }
    }
  ]
}
```

---

## Crear short link para deeplink (Admin)
`POST /api/admin/deeplinks/short`

Headers:
- `Authorization: Bearer <token_admin>`

Body:
```json
{
  "path": "recommendations",
  "params": { "childId": "K6vfrjDYcwAp8cDgH9sh" },
  "key": "reco_tab",
  "webFallback": "https://munpa.online",
  "enabled": true
}
```

Respuesta:
```json
{
  "success": true,
  "data": {
    "code": "aZ91kQb",
    "deeplinkUrl": "munpa://recommendations?childId=K6vfrjDYcwAp8cDgH9sh",
    "shortUrl": "https://api.munpa.online/dl/aZ91kQb"
  }
}
```

## Crear short link publico (sin token)
`POST /api/deeplinks/short`

Body:
```json
{
  "path": "recommendations",
  "params": { "childId": "K6vfrjDYcwAp8cDgH9sh" },
  "key": "reco_tab"
}
```

Respuesta:
```json
{
  "success": true,
  "data": {
    "code": "aZ91kQb",
    "shortUrl": "https://api.munpa.online/dl/aZ91kQb"
  }
}
```

## Resolver short link (Publico)
`GET /dl/:code`

Abre el deeplink en la app y si no se puede, redirige al `webFallback`.

