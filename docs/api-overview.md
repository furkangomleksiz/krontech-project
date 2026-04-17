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

## Form endpoint

| Method | Path | Notes |
|---|---|---|
| POST | `/api/v1/forms/submit` | Validates DTO; requires `consentAccepted: true` |

## Auth endpoints

| Method | Path | Notes |
|---|---|---|
| POST | `/api/v1/auth/login` | Returns JWT with `role` claim |

## Admin endpoints (ADMIN or EDITOR role required)

| Method | Path | Notes |
|---|---|---|
| POST | `/api/v1/admin/publishing/publish` | Accepts DRAFT or SCHEDULED; sets PUBLISHED + invalidates cache key |

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
- Global exception handler (`GlobalExceptionHandler`)
- Stateless JWT filter (`JwtAuthenticationFilter`)
- Per-IP + per-URI rate limiting via Redis (`RateLimitFilter`); falls back to in-memory if Redis is unavailable
