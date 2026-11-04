# Implementation Roadmap

## Phase 0 — Discovery and paid scope
Workshop with first hospital; inspect current site/workflows; confirm branches, doctors, services, schedule/appointment rules, fees, approvers, hosting, retention, support and provider assumptions. Sign scope and acceptance criteria. **Exit:** signed proposal and named hospital product owner.

## Phase 1 — Foundation

**Baseline stack:** Next.js App Router, React, TypeScript, Tailwind CSS, PostgreSQL and Prisma. Use Zod for server-side schemas. Add Redis, a separate search engine or a separate backend service only when measured requirements justify them. Rust is optional, not mandatory.

Next.js App Router + React + strict TypeScript foundation; Tailwind/CSS-variable design tokens; PostgreSQL + Prisma schema/migrations; authentication choice (Auth.js or Supabase Auth); hospital configuration, roles, audit, CI, deployment automation, secrets, logs and health checks. **Exit:** secure admin and repeatable staging deployment.

## Phase 2 — Website and content management
Bilingual design system, public pages, doctor/department/branch/service/fee management, schedules/exceptions, approval/publish workflow, search and freshness indicators. **Exit:** hospital staff can maintain and approve public data.

## Phase 3 — Appointments
Availability calculation, request/reference, staff queue, status workflow, confirmation/cancellation/rescheduling, concurrency protection and contracted notification channel. **Exit:** front desk UAT passes without overbooking.

## Phase 4 — Website AI and feedback
Approved knowledge retrieval, Bangla/English/Banglish evaluation, safety/abstention, contact handover, website assistant, callback and private feedback, basic usage metrics. **Exit:** hospital approves scope and safety tests pass.

## Phase 5 — Production launch
Content verification, staff training, security review, backup/restore test, monitoring, incident contacts, go-live sign-off and hypercare. **Exit:** production acceptance and first-month review.

## Phase 6 — Paid expansion
Prioritize based on actual demand: WhatsApp Business, SMS, Messenger, AI staff update drafting, complaint routing, advanced analytics, custom integrations.

## Suggested responsibility ownership
Product/customer lead: scope, workshops, approvals and commercial terms. Backend: domain, APIs, database, auth, appointments. Frontend: public site/dashboard/accessibility. AI/integrations: retrieval, evaluation, provider adapters. QA/delivery: test plan, UAT, training, deployment. Small teams may combine roles but every responsibility needs an owner.

## Change control
Any addition involving clinical data, diagnostic reports, payments, HIMS integration, patient login or new messaging channels requires impact assessment, security/privacy review, cost/schedule estimate, updated acceptance criteria and written commercial approval.
