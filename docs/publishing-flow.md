# Publishing Flow

## State machine

Each content record (`Page`, `BlogPost`, `Product`, `ResourceItem`) carries a `status` field:

```
DRAFT ─────────────────────────────────────────────────────▶ PUBLISHED
  │                                                              ▲
  │                                                              │
  ▼                                                              │
SCHEDULED ──────────────────────────────────────────────────────┘
         (auto-promoted by scheduler when scheduledAt passes)

PUBLISHED ──────────────▶ DRAFT   (via unpublish)
SCHEDULED ──────────────▶ DRAFT   (via unpublish)
```

### Valid transitions

| From      | To        | Trigger                            | Who can do it    |
|-----------|-----------|------------------------------------|------------------|
| DRAFT     | SCHEDULED | `POST /publishing/schedule`        | EDITOR, ADMIN    |
| DRAFT     | PUBLISHED | `POST /publishing/publish`         | EDITOR, ADMIN    |
| SCHEDULED | PUBLISHED | `POST /publishing/publish`         | EDITOR, ADMIN    |
| SCHEDULED | PUBLISHED | Scheduler (auto, when `scheduledAt` passes) | system |
| SCHEDULED | DRAFT     | `POST /publishing/unpublish`       | EDITOR, ADMIN    |
| PUBLISHED | DRAFT     | `POST /publishing/unpublish`       | EDITOR, ADMIN    |

### Invalid transitions (HTTP 409 Conflict)

- PUBLISHED → PUBLISHED (already published; unpublish first)
- SCHEDULED → SCHEDULED (already scheduled)
- PUBLISHED → SCHEDULED (unpublish to DRAFT first, then schedule)
- DRAFT → DRAFT (already draft; nothing to unpublish)

---

## API endpoints

All endpoints require `Authorization: Bearer <token>` with `ADMIN` or `EDITOR` role.
Every endpoint returns a `PublishStateResponse` showing the resulting state.

### Publish (DRAFT or SCHEDULED → PUBLISHED)

```http
POST /api/v1/admin/publishing/publish
Content-Type: application/json

{ "slug": "secure-access-gateway", "locale": "en" }
```

Response `200 OK`:
```json
{
  "id": "b3a1...",
  "slug": "secure-access-gateway",
  "locale": "en",
  "status": "PUBLISHED",
  "publishedAt": "2026-04-16T10:00:00Z",
  "scheduledAt": null
}
```

### Schedule (DRAFT → SCHEDULED)

```http
POST /api/v1/admin/publishing/schedule
Content-Type: application/json

{
  "slug": "kronos-announcement",
  "locale": "tr",
  "scheduledAt": "2026-05-01T09:00:00Z"
}
```

`scheduledAt` must be a future instant (validated with `@Future`).

### Unpublish (PUBLISHED or SCHEDULED → DRAFT)

```http
POST /api/v1/admin/publishing/unpublish
Content-Type: application/json

{ "slug": "old-blog-post", "locale": "en" }
```

Evicts the content from cache immediately so the page is no longer served publicly.

### Rotate preview token

```http
POST /api/v1/admin/publishing/pages/{id}/preview-token
```

Response `200 OK`:
```json
{
  "pageId": "b3a1...",
  "token": "7f4c9e...",
  "previewPath": "/api/v1/preview?token=7f4c9e..."
}
```

The token grants access to the page **regardless of publish status**. Useful for sharing
DRAFT and SCHEDULED content with stakeholders before going live.
Each call rotates (invalidates) the previous token.

---

## Preview strategy

- Preview tokens are UUID v4 values stored in the `pages.preview_token` column.
- The **backend** preview endpoint `GET /api/v1/preview?token={token}` returns full page JSON (title, summary, SEO, content blocks).
- No auth is required on the preview endpoint — the token IS the credential.
- Tokens are rotated (not deleted) — the previous token stops working immediately.
- Tokens are never included in any public list response to avoid leaking draft content.

### Frontend preview rendering

The Next.js app exposes `/preview?token={token}` — a client-side page that:

1. Reads `?token` from the query string.
2. Fetches `GET {NEXT_PUBLIC_API_BASE_URL}/preview?token={token}`.
3. Renders a "PREVIEW MODE" banner + the page's title, summary, and content blocks.
4. Shows block payload details (structured fields for hero/text/split-cta; collapsed JSON for other types).

**Admin workflow:**
1. Open the content edit form in `/admin/…`.
2. Click **Get Preview Link** in the publish bar — this calls `POST /admin/publishing/pages/{id}/preview-token`.
3. An **Open Preview ↗** button appears, linking to `/preview?token={uuid}`.
4. Share the URL with reviewers; it works without authentication.
5. Rotating the token invalidates the previous link immediately.

**UX simplification noted:** The preview renders the raw content block structure rather than the full public site template, which requires no CDN image or component hydration. This is deliberate — it provides a clear picture of structure and copy without requiring a production-identical rendering pipeline in the preview route.

---

## Scheduled publish

`ScheduledPublishingService` runs a `@Scheduled(fixedDelay=60s)` job that:

1. Queries `pages WHERE status = 'SCHEDULED' AND scheduled_at <= now()`
2. For each matching page, calls `PublishingService.promoteToPublished(page)` which:
   - Sets `status = PUBLISHED`, `publishedAt = now()`
   - Evicts the Redis cache
   - Writes an audit log entry with `actor = "system"`

**Configuration:**  
`app.publishing.scheduler-delay-ms` (default `60000` ms, override via `PUBLISHING_SCHEDULER_DELAY_MS`).

**Multi-instance note:** The scheduler fires on every application instance. In production
with more than one instance, use a distributed lock (e.g. Redisson `RLock`) around the
promotion loop to avoid double-promotion races. For a single-instance deployment this is safe.

---

## Cache invalidation

`CacheService` maintains the following key patterns and evicts them on every
`publish`, `unpublish`, or scheduled-promotion event:

| Key pattern                    | Eviction trigger                    |
|-------------------------------|-------------------------------------|
| `cache:page:{locale}:{slug}`  | Any status change on the page       |
| `cache:blog:list:{locale}`    | Any status change (list may change) |
| `cache:resource:list:{locale}`| Any status change (list may change) |

Cache eviction failures are logged and swallowed — they must not block the publish flow.
The Next.js ISR revalidation picks up the change on the next request cycle.

---

## Audit trail

Every successful state transition writes a row to `audit_logs`:

| Field       | Example value                       |
|-------------|-------------------------------------|
| actor       | `editor@krontech.local` or `system` |
| action      | `PUBLISH`, `SCHEDULE`, `UNPUBLISH`, `SCHEDULED_PUBLISH`, `ROTATE_PREVIEW_TOKEN` |
| targetType  | `PAGE`                              |
| targetId    | UUID of the Page row                |
| targetSlug  | `secure-access-gateway`             |
| details     | `DRAFT → PUBLISHED`                 |

Query the audit trail via `GET /api/v1/admin/audit` (ADMIN only, supports filters by
`targetId`, `action`, `actor`).

---

## Adding a new content type to the publish flow

1. The entity already extends `Page`, so it inherits `status`, `publishedAt`,
   `scheduledAt`, and `previewToken`.
2. The publishing endpoints use `slug + locale` to look up any `Page` subtype — no
   changes needed to `PublishingService`.
3. If the type has its own list cache (e.g. `cache:product:list:{locale}`), add the
   key to `CacheService.evictContent()`.
