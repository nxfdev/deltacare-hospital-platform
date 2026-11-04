# Software Design Description (SDD)

## 1. Goals

Build a bilingual hospital website and operations platform as a **TypeScript-first modular monolith**. The website must support a high-fidelity, content-rich healthcare experience inspired by the supplied Mayo Clinic reference specification, while retaining the previously agreed Bangladesh-first product scope and hospital-specific workflows.

Use one shared codebase with a separate production installation, database, credentials, storage boundary and backups for each hospital. Do not start with microservices. **Rust is not mandatory and is not the default stack for this project.** Reconsider another language only if a measured requirement justifies it.

The supplied visual-reference specification is the source for the frontend stack, visual reconnaissance process, accessibility target and quality workflow. The product requirements in the existing product definition, BRD and SRS remain the source for the MVP feature scope; the reference specification does not automatically add every Mayo Clinic page or clinical feature to the commercial MVP.

## 2. Recommended technology stack

Use stable releases and verify compatibility before installation. Treat optional tools as conditional, not mandatory dependencies.

| Layer | Recommended technology | Purpose / guidance |
|---|---|---|
| Language | TypeScript (strict mode) | Shared typed application code |
| Web framework | Next.js App Router | Routing, server rendering, metadata, server components and route handlers |
| UI | React | Reusable page templates, dashboard and interactive components |
| Styling | Tailwind CSS + CSS variables | Responsive styling and measured design tokens |
| Motion | Framer Motion, selectively | Navigation and state transitions; respect reduced-motion settings |
| Icons | Lucide React | Consistent iconography |
| Forms | React Hook Form + Zod | Form state and schema validation |
| Client data | TanStack Query, where useful | Client-side synchronization for interactive dashboard workflows |
| Global client state | Zustand, only if needed | Small shared client state; prefer local state/server state otherwise |
| Database | PostgreSQL | Transactional data and relational integrity |
| ORM / migrations | Prisma | Typed database access and schema migrations |
| API | Next.js Route Handlers / server-side application services | Versioned application endpoints; keep business rules outside UI components |
| Authentication | Auth.js **or** Supabase Auth | Select one after deployment and session requirements are confirmed; do not run both by default |
| Search | PostgreSQL full-text search initially | Doctor, service and approved-content search |
| Cache / rate limits | Redis, only when justified | Add when measured traffic, distributed rate limits or caching require it |
| File storage | S3-compatible object storage | Media and approved documents; private files must use controlled access |
| Background jobs | Durable PostgreSQL-backed job mechanism initially | Reminders, notifications, indexing and scheduled reports; choose a maintained library during implementation |
| AI | Provider abstraction around a cloud AI API initially | Approved-information retrieval, evaluation, safe abstention and replaceable providers |
| Email / messaging | Provider adapters | Email first if required; SMS, WhatsApp and Messenger are staged integrations |
| API documentation | OpenAPI | Document public and administrative endpoints |
| Logging / errors | Structured application logs + Sentry or equivalent | Request correlation, error reporting and operational diagnostics |
| Metrics / tracing | OpenTelemetry where useful | Performance and dependency observability |
| Unit tests | Vitest | Domain and utility tests |
| Component tests | React Testing Library | Accessible component behavior |
| Browser E2E | Playwright | User journeys, responsive checks and screenshot comparison |
| Accessibility | axe-core or equivalent | Automated accessibility checks alongside manual testing |
| Deployment | Vercel or comparable managed hosting; containerized deployment where operationally preferable | Choose per-customer isolation, region, cost and operational needs |
| Edge / CDN security | Cloudflare or equivalent | DNS, CDN, WAF and edge protections |
| CI/CD | GitHub Actions | Lint, typecheck, tests, build and controlled deployment |
| Source control | GitHub | Versioning and review |

### Stack selection rules

- Prefer Next.js server components for public, mostly read-only pages and server-rendered content. Use client components only for interactions that require browser state.
- Use Next.js Route Handlers for the initial API surface. Keep domain rules in application/service modules so the system can be extracted behind a separate API later if scale or integration needs justify it.
- Use Prisma for normal data access. Use explicit SQL/transactions where necessary for appointment capacity and concurrency; correctness takes priority over ORM convenience.
- PostgreSQL is the source of truth. Do not add Redis, a separate search engine, microservices or a message broker before a demonstrated need.
- Use Auth.js or Supabase Auth only after deciding whether the deployment model and customer requirements favor application-managed authentication or a managed identity service. Enforce authorization on the server regardless.
- Begin with a cloud AI provider behind an adapter. Do not send patient records or sensitive data to an AI provider. Local/private inference is a later option only after privacy, performance and total-cost evaluation.
- Use Rust only if a later isolated workload has a concrete performance, systems-integration or operational reason. It is not required for the website, dashboard or initial backend.

## 3. Deployment topology

One hospital = one production installation, one PostgreSQL database/credential set, isolated object storage or tenant-specific storage prefix with separate credentials/policies, provider credentials, domain and backups. Prefer fully separate environments and databases for stronger isolation. Use one shared codebase and configuration/feature flags, not customer-specific code forks.

A typical installation contains:
- Next.js application (public website, staff dashboard and server endpoints).
- PostgreSQL database.
- Object storage bucket or isolated storage boundary.
- Durable job runner for reminders and background tasks.
- External AI, email and messaging provider adapters as enabled by contract.
- Monitoring, backup and alerting configuration.

Vercel is a viable deployment option for the Next.js application, but do not assume it is automatically the best choice for every hospital. Confirm data residency, contractual terms, networking, background-job execution, database connectivity, backup ownership and cost. A container-based deployment on a managed cloud or VPS may be preferable for some dedicated installations.

## 4. Logical modules

Keep modules separated by business capability:

`identity`, `hospital`, `directory`, `scheduling`, `catalog`, `publishing`, `appointments`, `communications`, `knowledge`, `assistant`, `analytics`, `integrations`, `audit`, `operations`.

The public website and staff dashboard should consume the same validated application services and data model, but have separate route/layout boundaries and authorization rules.

## 5. Core flows

**Public read:** browser -> Next.js server component/page -> application service -> Prisma/PostgreSQL -> rendered response.

**Staff mutation:** authenticated request -> server-side authorization -> application command/service -> domain validation -> database transaction -> audit event -> approval/publish workflow.

**Appointment:** patient availability query -> slot validation -> transactional request/reservation -> staff queue -> confirmation -> notification job.

**AI:** channel adapter -> normalization -> safety/intent policy -> retrieve approved sources -> generate grounded answer -> validate coverage/confidence -> answer or abstain -> minimal analytics.

AI must not directly mutate schedules, fees or appointments. Actions must call explicit application services with authorization and confirmation rules.

## 6. Conceptual data model

- `hospitals(id, name_bn, name_en, timezone, default_locale, status)`
- `branches(id, hospital_id, name_bn, name_en, address_bn, address_en, phone, status)`
- `departments(id, branch_id, name_bn, name_en, description_bn, description_en, status)`
- `doctors(id, hospital_id, name_bn, name_en, qualifications, bio_bn, bio_en, status)`
- `doctor_specialties(doctor_id, specialty_id)`
- `doctor_branches(doctor_id, branch_id, room, status)`
- `schedule_rules(id, doctor_branch_id, weekday, start_time, end_time, slot_minutes, capacity, effective_from, effective_to, status)`
- `schedule_exceptions(id, doctor_branch_id, starts_at, ends_at, exception_type, reason)`
- `services(id, department_id, name_bn, name_en, description_bn, description_en, status)`
- `fees(id, service_id, amount, currency, fee_label, effective_from, effective_to, publication_state)`
- `content_items(id, type, locale, payload_json, publication_state, version)`
- `appointments(id, reference, doctor_branch_id, starts_at, patient_name, phone, status, source, created_at)`
- `appointment_events(id, appointment_id, from_status, to_status, actor_id, reason, created_at)`
- `users`, `roles`, `permissions`, `user_roles`, `role_permissions`
- `approval_requests(id, entity_type, entity_id, proposed_version, status, requested_by, reviewed_by)`
- `audit_events(id, actor_id, action, entity_type, entity_id, diff_json, occurred_at, request_id)`
- `contact_requests`, `feedback`, `notifications`, `knowledge_sources`, `knowledge_chunks`, `analytics_events`

Use UUID/ULID identifiers. Store instants as UTC timestamps (`timestamptz`); recurring schedule rules use local hospital time and configured timezone. Use UTF-8 throughout. Keep patient-sensitive fields out of analytics.

The Prisma schema is the implementation representation of this model. Add database constraints and indexes deliberately; do not assume ORM-level validation replaces database integrity.

## 7. Scheduling and concurrency

Represent recurring rules and one-off exceptions separately. Generate availability over a bounded horizon. Re-check capacity inside a transaction at booking/confirmation. Use PostgreSQL row locking, exclusion/unique constraints or another proven transactional strategy to prevent overbooking. Decide whether pending requests hold capacity and for how long. Schedule changes must surface affected bookings.

## 8. Publishing workflow

Default: `draft -> pending_approval -> approved -> published`, with reject/archive paths.
- Non-critical copy may be directly published by an authorized editor if hospital policy permits.
- Doctor credentials, schedules and fees require approval.
- Emergency contacts/urgent notices use a restricted approver path.
- AI drafts always require human approval.
- Publishing atomically updates public views and refreshes the AI knowledge index.

## 9. AI design and safety

Index only approved, published sources. Attach source ID/version, locale, branch and effective dates. Filter retrieval by hospital, branch, locale and validity. Re-index on publish; invalidate stale chunks.
- Administrative/informational use only.
- Refuse diagnosis, treatment, medication and symptom triage.
- Do not infer fees or availability.
- Abstain on missing, stale or conflicting information.
- Do not index patient free-text submissions.
- Minimize conversation retention and redact personal data from logs.
- Version prompts and model settings for reproducibility.

Start with a cloud AI API behind provider interfaces; consider local inference only after measured usage, privacy need and total cost justify it.

## 10. API design

Use versioned REST endpoints implemented initially through Next.js Route Handlers. Keep route handlers thin and delegate to application services. Example endpoints:
- `GET /api/v1/public/doctors`
- `GET /api/v1/public/doctors/{id}`
- `GET /api/v1/public/availability`
- `POST /api/v1/public/appointments`
- `GET /api/v1/admin/appointments`
- `POST /api/v1/admin/appointments/{id}/confirm`
- `POST /api/v1/admin/appointments/{id}/reschedule`
- `POST /api/v1/admin/doctors`
- `PATCH /api/v1/admin/doctors/{id}`
- `POST /api/v1/admin/approval-requests/{id}/approve`
- `POST /api/v1/public/assistant/messages`
- `POST /api/v1/public/contact-requests`
- `POST /api/v1/public/feedback`

Use Zod or equivalent validation, rate limits, idempotency keys for appointment creation/provider callbacks, consistent response envelopes and OpenAPI documentation. Never rely on client-side validation or hidden UI controls for security.

## 11. Security

Separate credentials per hospital; HTTPS; secure password hashing if credentials are locally managed; server-side RBAC and branch scoping; MFA for privileged accounts; rate limiting; CSRF protection for cookie-authenticated mutations; strict validation; secrets manager/protected environment; encrypted backups; restricted audit access; dependency scanning; no production patient data in development. Use secure, HTTP-only, same-site cookies where cookie sessions are used.

## 12. Jobs and observability

Use durable idempotent jobs with retry/backoff/dead-letter handling for reminders, knowledge refresh, reports and retention. A PostgreSQL-backed job mechanism is sufficient initially; select and document a maintained implementation compatible with the deployment target. Structured logs should include request IDs. Track latency, errors, DB pool, queue depth, provider failures, appointment conversion and AI abstention. Alert on backup failure, disk pressure and sustained errors. Never log passwords, tokens or unnecessary patient details.

## 13. Suggested repository

```text
hospital-platform/
  prisma/
    schema.prisma
    migrations/
  public/
    images/
    icons/
    fonts/
    media/
  docs/
    reference-audit/
    architecture/
    operations/
    content/
  tests/
    unit/
    integration/
    e2e/
    fixtures/
  src/
    app/
      (website)/
      (auth)/
      admin/
      api/
      layout.tsx
      globals.css
    components/
      layout/
      navigation/
      search/
      cards/
      forms/
      feedback/
      media/
      ui/
    features/
      appointments/
      physicians/
      locations/
      specialties/
      content-search/
      authentication/
      administration/
      assistant/
    server/
      application/
      domain/
      infrastructure/
      auth/
      db/
      security/
      jobs/
      providers/
    lib/
      validation/
      utilities/
    config/
    types/
  .env.example
  .gitignore
  next.config.ts
  package.json
  tsconfig.json
  README.md
```

## 14. Architecture decisions

- ADR-001: modular monolith for MVP; no microservices initially.
- ADR-002: dedicated deployment/database and isolated credentials per hospital.
- ADR-003: Next.js App Router + React + TypeScript as the primary application stack.
- ADR-004: Tailwind CSS with measured CSS-variable design tokens.
- ADR-005: PostgreSQL as primary transactional store; Prisma as default data-access and migration tool.
- ADR-006: Next.js Route Handlers initially; application services remain framework-independent.
- ADR-007: Auth.js or Supabase Auth, one selected after deployment/authentication discovery.
- ADR-008: cloud AI behind provider adapter initially.
- ADR-009: human approval for critical/AI-generated changes.
- ADR-010: no clinical records or diagnostic reports in MVP.
- ADR-011: Rust is optional and not required by the baseline architecture.
