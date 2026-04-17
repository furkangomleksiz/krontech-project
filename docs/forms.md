# Form Submission Flow

Covers the Contact and Demo Request forms: validation strategy, anti-spam, persistence model, admin access, export, and the webhook extension point.

---

## End-to-end flow

```
User fills form
  │
  ├─► Client-side validation (ContactForm.tsx / ContactBand.tsx)
  │     Required fields, email regex, message length, consent checkbox.
  │     Errors appear inline below each field via role="alert" spans.
  │     The hidden honeypot field (name="website") is always sent as "".
  │
  ├─► POST /api/v1/forms/submit (lib/api/forms.ts)
  │
  ├─► RateLimitFilter — general 120 req/min per IP:URI
  │
  ├─► @Valid on FormSubmissionRequest DTO
  │     @AssertTrue on consentAccepted → 400 if false
  │     @Email, @NotBlank, @Size → 400 with first violation message
  │
  ├─► FormSubmissionService.save()
  │     1. Honeypot check — if website is non-blank → fake success, no persist
  │     2. Form rate limit — 5 per IP per hour (Redis key form-submit:{ip})
  │        → 429 FormSubmissionLimitException if exceeded
  │     3. Map DTO → FormSubmission entity, persist
  │     4. Publish FormSubmissionCreatedEvent
  │
  ├─► WebhookNotificationService (@EventListener)
  │     If FORM_WEBHOOK_URL is set → POST to that URL (currently logs only)
  │
  └─► 201 Created { submissionId, status: "RECEIVED" }
        Frontend shows success state.
        API-level errors (400, 429, 5xx) are shown inline via apiError state.
```

---

## Forms in the frontend

### ContactForm

`src/components/sections/ContactForm.tsx` — full-page contact form on `/[locale]/contact`.

Fields:
| Field       | Required | Validation                    |
|-------------|----------|-------------------------------|
| firstName   | Yes      | min 2 chars                   |
| lastName    | Yes      | min 2 chars                   |
| email       | Yes      | regex email format            |
| company     | Yes      |                               |
| department  | No       | dropdown (not validated)      |
| jobTitle    | No       |                               |
| phone       | No       |                               |
| subject     | No       | dropdown                      |
| message     | Yes      | min 10 chars                  |
| consentAccepted | Yes  | checkbox must be checked      |
| website     | —        | honeypot, hidden, always blank |

Validation strategy: validate all on submit → show errors inline → clear per-field error as user corrects it.

### ContactBand

`src/components/layout/ContactBand.tsx` — compact form above the footer, every page.

Uses the same `submitForm()` API client. Validation is simplified (single error message, not per-field) to keep the compact layout clean.

### Shared API client

`src/lib/api/forms.ts` exports `submitForm(payload: FormPayload): Promise<FormResult>`.

Both components use this function. It parses the `ApiError` response body so field-level or rate-limit messages from the server are surfaced to the user.

---

## Backend validation

All validation is in one of two places:

1. **DTO layer** (`FormSubmissionRequest.java`) — Bean Validation annotations.
   `@AssertTrue`, `@NotBlank`, `@Email`, `@Size`. Spring's `@Valid` at the controller
   triggers this before the service is called. `MethodArgumentNotValidException` is
   caught by `GlobalExceptionHandler` and returns a structured `400 ApiError`.

2. **Service layer** (`FormSubmissionService.java`) — anti-spam logic only.
   Honeypot check and rate limit check. No business validation here.

There is deliberately no validation in the controller method body itself.

---

## Anti-spam strategy

Three layers, no CAPTCHA (by design — CAPTCHA adds friction and is not justified at this stage):

### 1. Honeypot field
- A `<input name="website">` is rendered visually hidden (CSS `position: absolute; left: -9999px`).
- Real users never see or fill it. Bots that fill all visible (and hidden) fields will populate it.
- The frontend always sends `website: ""`.
- If the backend receives a non-blank `website`, the service returns a fake `RECEIVED` response without persisting. Bots get no signal they were detected.

### 2. Per-IP hourly rate limit
- `RateLimitService.allowFormSubmission(ip)` uses Redis key `form-submit:{ip}` with a 1-hour TTL.
- Default limit: 5 submissions per IP per hour (configurable via `FORM_RATE_LIMIT_PER_HOUR`).
- If Redis is unavailable, the check fails open (submissions are allowed) — a Redis outage should not block all form traffic.
- Exceeding the limit throws `FormSubmissionLimitException` → HTTP 429 with a human-readable message.

### 3. Consent gate
- `@AssertTrue` on `consentAccepted` rejects requests where consent is `false` before the service is reached.
- Enforced at both client and server level.

### Future options
- Email verification (confirmation link before submission counts) — add if spam volume increases.
- CAPTCHA (hCaptcha or Cloudflare Turnstile) — add as a last resort; keep honeypot + rate limit first.
- Domain/disposable-email blocklist — add as a server-side filter in the service.

---

## Persistence model

```
form_submissions
  id              UUID PK
  created_at      TIMESTAMP  ← submission time
  updated_at      TIMESTAMP
  form_type       VARCHAR    CONTACT | DEMO_REQUEST
  full_name       VARCHAR
  email           VARCHAR
  company         VARCHAR
  department      VARCHAR    optional
  job_title       VARCHAR    optional
  phone           VARCHAR    optional
  message         TEXT
  consent_accepted BOOLEAN   always true (enforced by @AssertTrue)
  source_page     VARCHAR    URL path of the originating page
  ip_address      VARCHAR    for audit / duplicate detection
```

The schema supports export to CSV, CRM import, and reporting without transformation.

Consent is persisted as a boolean for audit purposes. The submission timestamp is `created_at` from `BaseEntity` (no separate `submitted_at` column needed).

---

## Admin endpoints

All admin form endpoints require the `ADMIN` role (JWT with role claim `ROLE_ADMIN`).

### Paginated list

```
GET /api/v1/admin/forms?page=0&size=25&formType=CONTACT
```

Response: `Page<FormSubmissionAdminResponse>` — all fields including `ipAddress`.

`formType` is optional. Omit to list all types.

### CSV export

```
GET /api/v1/admin/forms/export.csv?formType=CONTACT
```

Response: `text/csv` download with RFC 4180-compliant quoting (values double-quoted, embedded quotes doubled).

Columns: `id, submittedAt, formType, fullName, email, company, department, jobTitle, phone, message, consentAccepted, sourcePage, ipAddress`

`formType` is optional. Omit to export all types.

---

## Webhook extension point

After every successful persist, `FormSubmissionService` publishes `FormSubmissionCreatedEvent`.

`WebhookNotificationService` (`@EventListener`) receives it.

- If `FORM_WEBHOOK_URL` is **empty** (default): logs the submission.
- If `FORM_WEBHOOK_URL` is **set**: the TODO block in `WebhookNotificationService.onFormSubmission()` is the integration point. Inject `RestClient` or `WebClient` and POST a JSON payload to the URL.

To make webhook delivery non-blocking:
1. Add `@EnableAsync` to a configuration class.
2. Annotate `onFormSubmission()` with `@Async`.

The event carries the full `FormSubmission` entity, so the webhook payload can include all fields.

---

## Configuration reference

```yaml
# application.yml
app:
  forms:
    rate-limit:
      max-per-hour: 5              # per-IP hourly limit; override with FORM_RATE_LIMIT_PER_HOUR
  webhook:
    form-submission:
      url: ""                      # leave empty to disable; set via FORM_WEBHOOK_URL
```

---

## Test coverage

`FormSubmissionServiceTest`:

| Test | What it verifies |
|------|-----------------|
| `shouldPersistValidContactSubmission` | Happy path: entity saved, event published |
| `shouldPersistDemoRequestFormType`    | DEMO_REQUEST form type persists correctly |
| `shouldSilentlySucceedWithoutPersistingWhenHoneypotFilled` | Honeypot: repository.save NOT called, fake success returned |
| `shouldRejectWhenFormRateLimitExceeded` | 429 path: service throws FormSubmissionLimitException |

Bean Validation (`@AssertTrue`, `@Email`, `@NotBlank`) is the responsibility of the DTO layer and is verified by Spring's constraint infrastructure, not duplicated in service unit tests.
