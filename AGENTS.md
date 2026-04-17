# Project Instructions

## Project Overview
This repository contains a rebuild of the krontech.com website as a modern, manageable, scalable platform.

The goal is not only to visually reproduce the public website, but to design and implement a maintainable system that includes:
- a public multilingual website
- an admin/content management system
- SEO and GEO support
- publishing workflows
- media management
- form handling
- caching and performance considerations
- local development with Docker Compose

This project is an engineering assignment. Prioritize architecture quality, consistency, and maintainability over unnecessary complexity.

---

## Mandatory Stack
- Frontend: Next.js + TypeScript
- Backend: Spring Boot
- Database: PostgreSQL
- Cache / rate limiting / lightweight invalidation support: Redis
- Object storage: S3-compatible storage
- Containerization: Docker / Docker Compose

Use TypeScript strictly. Avoid `any` unless there is a very strong reason, and if used, explain why in code comments.

---

## Architectural Principles

### High-level architecture
Use a **modular monolith** architecture, not microservices.

Repository should be structured as a monorepo with at least:
- `apps/web` for the Next.js frontend
- `apps/api` for the Spring Boot backend
- `docs` for architecture and technical decisions
- root-level Docker Compose and environment examples

Do not introduce distributed systems complexity unless absolutely necessary.

### Backend architecture
Use clear module boundaries in the Spring Boot backend. Organize by domain, not by technical layer only.

Preferred backend modules include:
- auth
- users
- pages
- components
- blog
- products
- resources
- media
- seo
- forms
- publishing
- localization
- redirects
- audit

Use a conventional layered structure within each module where appropriate:
- controller
- service
- repository
- entity
- dto / request / response
- mapper

Business logic should live in services, not controllers.

### Frontend architecture
Use a component-based architecture in Next.js.

Separate:
- app routing
- shared UI components
- page section components / block renderer
- API client layer
- SEO utilities
- localization utilities
- admin-side components if admin is included in the same app

Prefer reusable and composable components over duplicated page-specific code.

---

## Core Functional Expectations

The system must support at minimum:
- homepage
- product detail page
- blog list page
- blog detail page
- resources page
- form pages such as contact / demo request

The system should also support:
- multilingual routing such as `/tr` and `/en`
- localized content modeling
- SEO metadata fields
- GEO-friendly content structure
- media upload and reuse
- draft / publish workflow
- preview capability
- scheduled publishing
- basic audit logging
- role-based admin access with `ADMIN` and `EDITOR`
- form submission storage and export-ready structure

---

## API Design Rules
Use **REST** API design unless a strong reason emerges otherwise.

Requirements:
- clear and consistent REST endpoint naming
- OpenAPI / Swagger documentation
- DTO-based request/response design
- validation on all write operations
- rate limiting
- predictable error responses

Do not expose JPA entities directly from controllers.

---

## Authentication and Authorization
Use JWT-based authentication for admin/API access.

Requirements:
- Spring Security
- role-based authorization
- at minimum `ADMIN` and `EDITOR`
- secure validation flow
- clean separation between auth logic and business modules

Keep the implementation simple and explainable. Do not overengineer the token system.

---

## Content Modeling Rules
Model content for long-term maintainability.

Important principles:
- support localized content variants cleanly
- avoid hardcoding page content directly into frontend files
- use reusable block/component instances for page composition
- store SEO metadata in a structured and reusable way
- support slugs, publish status, preview, and scheduling
- support media references and reuse

Design content schemas so that:
- new page types can be added later
- multiple locales can be linked together
- content can be rendered dynamically by the frontend

Prefer structured relational modeling with limited JSON usage where appropriate for flexible component props.

---

## Multilingual Rules
The project must support multiple languages correctly.

Requirements:
- locale-aware routing
- locale-linked content records
- `hreflang` support
- locale-aware SEO metadata
- no duplicated ad hoc translation logic scattered throughout the codebase

Design localization explicitly. Do not treat it as a later add-on.

---

## SEO and GEO Rules
SEO and GEO are first-class concerns in this project.

Support:
- meta title
- meta description
- canonical URLs
- robots meta
- Open Graph fields
- dynamic sitemap
- robots.txt
- hreflang
- redirect rules
- structured data / schema.org
- semantic HTML
- meaningful content block structure
- FAQ / rich structured content when appropriate

Frontend output should be search-engine friendly and LLM-friendly.

Avoid thin placeholder SEO implementations.

---

## Caching and Performance Rules
Design with performance in mind.

Consider:
- Next.js SSR / ISR strategy
- API caching
- Redis cache usage
- CDN cache compatibility
- cache invalidation when content changes
- image optimization
- lazy loading
- Core Web Vitals awareness

When content is published or updated, think through which cache layers are affected.

Do not implement fake caching just for appearance. Prefer a clean, explainable strategy.

---

## Forms and Lead Handling
Form pages must support:
- client-side validation
- server-side validation
- anti-spam protection placeholder or real implementation
- consent / privacy fields
- admin-side viewing of submissions
- export-friendly structure
- webhook-friendly extension points if useful

Keep data modeling clear and future-proof.

---

## Testing Expectations
Include meaningful tests, not just empty scaffolding.

Backend:
- unit tests for important business logic
- integration tests for critical API endpoints

Frontend:
- test only where it meaningfully supports confidence
- prefer concise but valuable coverage

Do not inflate test count with low-value tests.

---

## Tooling and Delivery Expectations
Repository should include:
- working monorepo structure
- Docker Compose that can start the local environment
- `.env.example`
- readable `README.md`
- architecture documentation in `docs/`
- meaningful commits and understandable file organization

Assume the project may be reviewed by engineers who care about tradeoffs and clarity.

---

## Coding Style Rules

### General
- Prefer simple, explicit code
- Avoid magic
- Avoid premature abstraction
- Avoid dead files and stub-heavy scaffolds
- Write code that a team can maintain

### Java / Spring Boot
- Use clear package names
- Use constructor injection
- Use DTOs
- Keep controllers thin
- Keep validation explicit
- Use descriptive method names
- Keep configuration organized
- Avoid excessive annotation magic when plain code is clearer

### TypeScript / Next.js
- Strict typing
- Avoid `any`
- Prefer small reusable components
- Prefer server-appropriate rendering strategies
- Keep routing and content-fetching logic cleanly separated
- Use semantic HTML and accessible markup

---

## Documentation Expectations
Whenever generating significant architecture or module structure, also update documentation in `docs/`.

Important docs to maintain:
- `docs/architecture.md`
- `docs/content-model.md`
- `docs/api-overview.md`
- `docs/caching-strategy.md`
- `docs/publishing-flow.md`

Explanations should be concise and engineering-oriented.

---

## What To Avoid
Do not:
- generate a huge overcomplicated enterprise architecture
- introduce microservices
- introduce GraphQL by default
- create vague placeholders without implementation intent
- hardcode all content in frontend source files
- hide key business logic inside random utility files
- optimize for speed of generation over repo coherence

---

## Preferred Development Strategy
When asked to implement large features:
1. first design the data model and interfaces
2. then scaffold files
3. then implement core logic
4. then add validation and tests
5. then update docs

When asked to bootstrap the repository:
- create the monorepo structure
- scaffold backend and frontend
- set up Docker Compose
- set up environment examples
- create initial documentation
- do **not** attempt to fully implement every feature in one pass unless explicitly asked

---

## Output Behavior for the Coding Agent
When working on large tasks:
- state what files you plan to create or modify
- keep changes coherent
- prefer smaller correct increments over broad speculative generation
- if assumptions are required, choose sensible defaults and document them in `docs/`

When bootstrapping:
- generate a clean, minimal, extensible foundation
- leave clear extension points for pages, content blocks, SEO, forms, and publishing
- ensure the repository remains buildable and understandable

## Frontend Visual Reference Rules

The visual target for the frontend is based on the reference screenshots located under `specs/frontend/`.

When implementing public-facing pages:
- use the screenshots in `specs/frontend/` as the primary visual reference
- match layout structure, spacing, visual hierarchy, and overall styling closely
- prefer reusable components rather than page-specific one-off markup
- preserve maintainability even when matching the source site closely
- if a screenshot is ambiguous, choose the most consistent interpretation and document it briefly

Do not invent a new design system unrelated to the screenshots.
Do not rely on vague stylistic guesses when explicit screenshot references are available.