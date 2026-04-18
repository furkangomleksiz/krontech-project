# API Overview

## Public endpoints (no auth required)

| Method | Path | Notes |
|---|---|---|
| GET | `/api/v1/public/pages/{slug}?locale=tr\|en` | Generic page metadata + content blocks + SEO |
| GET | `/api/v1/public/blog?locale=tr\|en&page=0&size=10` | Paginated blog list |
| GET | `/api/v1/public/blog/{slug}?locale=tr\|en` | Blog post detail |
| GET | `/api/v1/public/products/{slug}?locale=tr\|en` | Product detail + content blocks + SEO |
| GET | `/api/v1/public/resources?locale=tr\|en&page=0&size=24` | Paginated resources (optional `resourceType` filter) |
| GET | `/api/v1/preview?token={uuid}` | Token-gated preview for DRAFT/SCHEDULED content |

## Metadata routes (served by Next.js, not the API)

| Route | Notes |
|---|---|
| `GET /sitemap.xml` | Dynamic sitemap with hreflang `alternateRefs` for all locales |
| `GET /robots.txt` | Allows public content; blocks `/api/`, `/swagger-ui/`, `/api-docs/` |

## Form endpoint (public)

| Method | Path | Notes |
|---|---|---|
| POST | `/api/v1/forms/submit` | Validates DTO; requires `consentAccepted: true`; honeypot + per-IP rate limit |

## Auth endpoints

| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/api/v1/auth/login` | public | Returns JWT with `role`, `email`, `expiresAt` |
| GET  | `/api/v1/auth/me`    | ADMIN or EDITOR | Returns profile of the authenticated user |

## Admin — User management (ADMIN only)

| Method | Path | Notes |
|---|---|---|
| GET    | `/api/v1/admin/users`                | List all users |
| POST   | `/api/v1/admin/users`                | Create user (email, password, role) |
| PATCH  | `/api/v1/admin/users/{id}/role`      | Change user role |
| PATCH  | `/api/v1/admin/users/{id}/deactivate`| Soft-deactivate user |

## Admin — Pages (EDITOR + ADMIN; DELETE requires ADMIN)

| Method | Path | Notes |
|---|---|---|
| GET    | `/api/v1/admin/pages?locale=tr&status=DRAFT&page=0&size=20` | Paginated, all statuses |
| GET    | `/api/v1/admin/pages/{id}` | Full record including draft content + preview token |
| POST   | `/api/v1/admin/pages` | Create generic/landing page (status = DRAFT) |
| PUT    | `/api/v1/admin/pages/{id}` | Full update |
| PATCH  | `/api/v1/admin/pages/{id}/seo` | Update SEO fields only |
| DELETE | `/api/v1/admin/pages/{id}` | **ADMIN only**; also deletes content blocks |
| GET    | `/api/v1/admin/pages/{id}/blocks` | List content blocks ordered by sortOrder |
| PUT    | `/api/v1/admin/pages/{id}/blocks` | Replace all content blocks atomically |

## Admin — Blog (EDITOR + ADMIN; DELETE requires ADMIN)

| Method | Path | Notes |
|---|---|---|
| GET    | `/api/v1/admin/blog?locale=tr&status=DRAFT&page=0&size=20` | Paginated, all statuses |
| GET    | `/api/v1/admin/blog/{id}` | Full record including body |
| POST   | `/api/v1/admin/blog` | Create blog post (status = DRAFT) |
| PUT    | `/api/v1/admin/blog/{id}` | Full update |
| PATCH  | `/api/v1/admin/blog/{id}/seo` | Update SEO fields only |
| DELETE | `/api/v1/admin/blog/{id}` | **ADMIN only** |

## Admin — Products (EDITOR + ADMIN; DELETE requires ADMIN)

| Method | Path | Notes |
|---|---|---|
| GET    | `/api/v1/admin/products?locale=tr&status=DRAFT&page=0&size=20` | Paginated, all statuses |
| GET    | `/api/v1/admin/products/{id}` | Full record |
| POST   | `/api/v1/admin/products` | Create product (status = DRAFT) |
| PUT    | `/api/v1/admin/products/{id}` | Full update |
| PATCH  | `/api/v1/admin/products/{id}/seo` | Update SEO fields only |
| DELETE | `/api/v1/admin/products/{id}` | **ADMIN only** |

## Admin — Resources (EDITOR + ADMIN; DELETE requires ADMIN)

| Method | Path | Notes |
|---|---|---|
| GET    | `/api/v1/admin/resources?locale=tr&status=DRAFT&resourceType=DATASHEET&page=0&size=20` | Paginated; optional locale, status, resourceType filters |
| GET    | `/api/v1/admin/resources/{id}` | Full record |
| POST   | `/api/v1/admin/resources` | Create resource; must include `fileKey` or `externalUrl` |
| PUT    | `/api/v1/admin/resources/{id}` | Full update |
| PATCH  | `/api/v1/admin/resources/{id}/seo` | Update SEO fields only |
| DELETE | `/api/v1/admin/resources/{id}` | **ADMIN only** |

## Admin — Media (EDITOR + ADMIN; DELETE requires ADMIN)

| Method | Path | Notes |
|---|---|---|
| GET    | `/api/v1/admin/media?mimeType=image&page=0&size=25` | Paginated; optional mimeType prefix filter |
| GET    | `/api/v1/admin/media/{id}` | Full record with resolved `publicUrl` |
| **POST**   | **`/api/v1/admin/media/upload`** | **Upload a file + register metadata. `multipart/form-data` with `file` part (required) and `altText` part (optional). Returns full `MediaAdminResponse` including `objectKey` and `publicUrl`.** |
| POST   | `/api/v1/admin/media` | Register metadata for a file already in S3/MinIO (import flow) |
| PATCH  | `/api/v1/admin/media/{id}` | Update alt text and/or dimensions |
| DELETE | `/api/v1/admin/media/{id}` | **ADMIN only**; removes metadata only (S3 object preserved) |
| DELETE | `/api/v1/admin/media/{id}?deleteFile=true` | **ADMIN only**; removes metadata **and** S3 object |

### Upload request example

```http
POST /api/v1/admin/media/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data; boundary=----boundary

------boundary
Content-Disposition: form-data; name="file"; filename="hero.jpg"
Content-Type: image/jpeg

<binary file content>
------boundary
Content-Disposition: form-data; name="altText"

KronTech office building hero image
------boundary--
```

### Upload response example

```json
{
  "id": "a3b1c2d4-...",
  "objectKey": "uploads/2026/04/a3b1c2d4-e5f6.jpg",
  "publicUrl": "http://localhost:9000/media/uploads/2026/04/a3b1c2d4-e5f6.jpg",
  "fileName": "hero.jpg",
  "mimeType": "image/jpeg",
  "sizeBytes": 204800,
  "altText": "KronTech office building hero image",
  "width": null,
  "height": null,
  "createdAt": "2026-04-16T12:00:00Z",
  "updatedAt": "2026-04-16T12:00:00Z"
}
```

Set `objectKey` as `heroImageKey` on any content record to reference this asset.

## Admin — Publishing

| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/api/v1/admin/publishing/publish` | EDITOR + ADMIN | Transitions DRAFT/SCHEDULED → PUBLISHED; invalidates Redis cache key |

## Admin — Form submissions (ADMIN only)

| Method | Path | Notes |
|---|---|---|
| GET | `/api/v1/admin/forms?formType=CONTACT&page=0&size=25` | Paginated list; optional `formType` filter |
| GET | `/api/v1/admin/forms/export.csv?formType=CONTACT` | CSV export (RFC 4180); optional type filter |

## Public — Redirects (no auth)

| Method | Path | Notes |
|---|---|---|
| GET | `/api/v1/public/redirects` | All active redirect rules as a flat JSON array. Consumed by the Next.js Edge Middleware; cached for 5 min in-process. No pagination. |
| GET | `/api/v1/public/redirects/resolve?path=/old-path` | Resolves a single path — returns 200 + rule or 404. Useful for server-component debugging. |

## Admin — Redirects (EDITOR + ADMIN; DELETE requires ADMIN)

| Method | Path | Notes |
|---|---|---|
| GET    | `/api/v1/admin/redirects?page=0&size=50` | Paginated list, all statuses, sorted by sourcePath |
| GET    | `/api/v1/admin/redirects/{id}` | Single rule |
| POST   | `/api/v1/admin/redirects` | Create rule; 409 if sourcePath already exists |
| PUT    | `/api/v1/admin/redirects/{id}` | Full update |
| PATCH  | `/api/v1/admin/redirects/{id}/toggle` | Flip active ↔ inactive (preferred over delete) |
| DELETE | `/api/v1/admin/redirects/{id}` | **ADMIN only**; prefer deactivation for audit trail |

## API documentation

- Swagger UI: `http://localhost:8080/swagger-ui`
- OpenAPI JSON: `http://localhost:8080/api-docs`

## Error shape

All errors return a consistent `ApiError` body:

```json
{
  "timestamp": "2026-04-16T00:00:00Z",
  "status": 400,
  "error": "Bad Request",
  "message": "...",
  "path": "/api/v1/..."
}
```

## Quality controls in place

- DTO-based request/response (no entity leakage)
- Bean Validation on all write DTOs
- Global exception handler (`GlobalExceptionHandler`) — covers validation, 404, 409, 429, auth, and unexpected errors
- Stateless JWT filter (`JwtAuthenticationFilter`) — role extracted from `role` claim
- Per-IP + per-URI rate limiting via Redis (`RateLimitFilter`); falls back to in-memory if Redis is unavailable
- Method-level `@PreAuthorize` for ADMIN-only operations (delete, user management)
