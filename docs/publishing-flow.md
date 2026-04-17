# Publishing Flow

## Lifecycle

```
DRAFT ──► SCHEDULED ──► PUBLISHED
  │                        │
  └──────────────────────► ┘ (direct publish also valid)
```

1. Content starts as `DRAFT`
2. An EDITOR or ADMIN may schedule publishing by setting `publishAt` (status becomes `SCHEDULED`)
3. Publishing action (`POST /api/v1/admin/publishing/publish`) accepts both `DRAFT` and `SCHEDULED` pages
4. On publish: `status → PUBLISHED`, `publishAt → now()` if not already set, cache key deleted
5. Public frontend serves revalidated content on next request

## What is wired now

| Step | Implemented |
|---|---|
| DRAFT/SCHEDULED → PUBLISHED via API | Yes |
| Redis cache key invalidation on publish | Yes |
| Scheduled background promotion (SCHEDULED → PUBLISHED at time) | Not yet |
| Preview links for draft pages | Not yet |

## Roles

- `EDITOR` — can trigger publish via `/api/v1/admin/publishing/publish`
- `ADMIN` — same permissions; will gain user management in a later pass

## Preview (next pass)

Recommended approach:
- Sign a short-lived token containing `pageId`
- Add a `/api/v1/public/preview?token=...` endpoint returning the draft
- Frontend preview route bypasses ISR cache using the token

## Audit (next pass)

`AuditLog` entity and repository are in place. The recording hook should fire from:
- Login events
- Publish actions
- Form export operations
- Redirect updates
