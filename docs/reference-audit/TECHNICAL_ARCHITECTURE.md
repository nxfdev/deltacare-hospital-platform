# DeltaCare — Technical Architecture Specification

**Source Authority:** `source of truth/04-SDD-architecture.md`, `02-SRS.md`, and Master Prompt Sections 5, 11–23.

---

## 1. Architectural Pattern: TypeScript-First Modular Monolith

In strict compliance with `04-SDD-architecture.md` (ADRs 001–011):
- **Framework:** Next.js (App Router) with React Server Components by default and Client Components only where browser interactivity is required.
- **Language:** TypeScript (strict mode).
- **Styling:** Tailwind CSS configured with exact `--mc-*` CSS custom property design tokens measured from `inspo.html`.
- **Database & ORM:** PostgreSQL + Prisma ORM schema with full relational integrity, indexes, unique constraints, and migrations, plus a resilient local persistence layer so the application runs and passes all E2E/integration tests seamlessly even in sandboxed environments without a live external PostgreSQL daemon, while keeping `prisma/schema.prisma`, migrations, and Prisma Client 100% production-ready.
- **Authentication:** Single unified session-based authentication system (`HTTP-only`, `SameSite=Lax`, signed session token / Auth.js compatible architecture) enforcing server-side RBAC and branch scoping (`ADR-007`).

---

## 2. Logical Domain Modules (`src/server/` & `src/features/`)

Following `04-SDD-architecture.md` Section 4:
1. `identity` — Users, Roles (`SUPER_ADMIN`, `HOSPITAL_ADMIN`, `DEPT_MANAGER`, `DOCTOR`, `RECEPTIONIST`, `CONTENT_EDITOR`, `PATIENT`), Permissions, password hashing (`scrypt`/`bcrypt`), session validation, RBAC guards.
2. `hospital` — `HospitalConfiguration`, `Branch` locations, emergency contacts, operating hours, bilingual settings.
3. `directory` — `Department`, `Specialty`, `Doctor`, `DoctorBranch`, `FeaturedCareArea`.
4. `scheduling` — `ScheduleRule` (weekday, start/end time, slot duration, capacity, effective dates) and `ScheduleException` (blocked dates/leaves, surfacing affected bookings).
5. `catalog` — `Service` & `Fee` (amount, currency `BDT`, effective dates, publication state) and approved medical guides (`DiseaseCondition`, `MedicalProcedure`).
6. `publishing` — Editorial state machine (`DRAFT -> PENDING_APPROVAL -> APPROVED -> PUBLISHED -> ARCHIVED`), `ApprovalRequest` queue, atomic publication, and freshness timestamps.
7. `appointments` — Slot availability engine, transactional capacity verification, `Appointment` creation with unique `DC-YYYY-XXXX` reference, status state machine (`REQUESTED`, `PENDING_CONFIRMATION`, `CONFIRMED`, `RESCHEDULE_REQUESTED`, `CANCELLED`, `COMPLETED`, `NO_SHOW`), and `AppointmentEvent` history.
8. `communications` — `ContactRequest` (callbacks), `Feedback` (private feedback & complaints with category/department routing & internal notes), and `Notification` adapter (Email, SMS, WhatsApp).
9. `knowledge` & `assistant` — Published-only knowledge indexer (`KnowledgeChunk`), clinical safety guardrails, Bangla/English/Banglish query normalization, grounded response builder, and Staff AI Update Assistant (`AIUpdateDraft`).
10. `analytics` & `audit` — Real-time operational metrics (`FR-AN-01..04`) and immutable `AuditEvent` logging (`actorId`, `action`, `entityType`, `entityId`, `diffJson`, `occurredAt`).

---

## 3. Security & Privacy Controls

- **Server-Side Authorization (`NFR-06`):** Every `/api/v1/admin/*` route handler and admin page verifies user role and branch scope on the server.
- **Input Validation:** Shared Zod schemas validate all public forms (Appointment Request, Contact/Callback, Private Feedback, Login/Register, Search) and admin mutations.
- **Rate Limiting & Abuse Protection (`NFR-16`):** Token-bucket rate limiter protects public form submissions and authentication endpoints.
- **Data Minimization (`02-SRS.md`):** Routine appointment requests collect only necessary contact fields (Name, Phone, optional Email, Preferred Slot, Department/Doctor, brief note) and record explicit privacy notice consent. National ID and sensitive clinical histories are not collected.
- **Audit Logging (`FR-CMS-04`, `FR-APT-08`):** Every state transition on appointments, doctors, schedules, fees, approvals, and user roles writes an immutable `AuditEvent`.

