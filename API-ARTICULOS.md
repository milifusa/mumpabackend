## APIs de Articulos (dashboard + app)

Requiere `Authorization: Bearer <token>`.

### Categorias

- `GET /api/articles/categories`
- `POST /api/admin/article-categories`
- `PUT /api/admin/article-categories/:id`
- `DELETE /api/admin/article-categories/:id`

Body (crear/editar):
```json
{ "name": "Lactancia", "description": "Contenido sobre lactancia" }
```

### Palabras clave

- `GET /api/articles/keywords`
- `POST /api/admin/article-keywords`
- `PUT /api/admin/article-keywords/:id`
- `DELETE /api/admin/article-keywords/:id`

Body (crear/editar):
```json
{ "name": "recien nacido" }
```

### Articulos (dashboard)

- `POST /api/admin/articles/upload-image`
- `POST /api/admin/articles`
- `PUT /api/admin/articles/:articleId`
- `DELETE /api/admin/articles/:articleId`

Body (crear):
```json
{
  "title": "Cuidados del recien nacido",
  "htmlContent": "<h1>...</h1><p>...</p>",
  "publishedAt": "2026-01-28T12:00:00.000Z",
  "readingTimeMinutes": 4,
  "professionalId": "PROFESSIONAL_ID",
  "categoryId": "CATEGORY_ID",
  "keywordIds": ["KEYWORD_ID_1", "KEYWORD_ID_2"],
  "coverImageUrl": "https://...",
  "summary": "Resumen corto",
  "status": "published"
}
```

Upload de imagen (multipart/form-data):
- campo: `image`
- respuesta: `imageUrl`, `imageStoragePath`

Si `readingTimeMinutes` no se envia, se calcula automaticamente desde el HTML.

### Articulos (app)

- `GET /api/articles` (lista)
- `GET /api/articles/:articleId` (detalle)
- `GET /api/articles/category/:categoryId` (lista por categoría)

Campos extra en respuestas:
- `shareUrl` (deeplink `munpa://article/{id}`)
- `webUrl` (`https://munpa.online/article/{id}`)
- `authorProfessional` (perfil profesional que escribió el artículo)

Query params opcionales:
- `categoryId`, `keywordId`, `search`, `page`, `limit`

### Guardados (app)

- `POST /api/articles/:articleId/save`
- `DELETE /api/articles/:articleId/save`
- `GET /api/articles/saved`

### Estructura en Firestore

```
article_categories/{id}
{
  name, description, slug, createdAt, updatedAt
}

article_keywords/{id}
{
  name, slug, createdAt, updatedAt
}

articles/{id}
{
  title,
  htmlContent,
  summary,
  coverImageUrl,
  categoryId,
  keywordIds: [],
  readingTimeMinutes,
  publishedAt,
  professionalId,
  authorProfessional: { id, userId, name, headline, photoUrl, contactEmail, contactPhone, website },
  author: { uid, name },
  status: "draft" | "published",
  createdAt,
  updatedAt
}

users/{uid}/saved_articles/{articleId}
{
  articleId,
  savedAt
}
```
