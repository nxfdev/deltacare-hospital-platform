# Software Requirements Specification

**Scope:** Release 1 commercial MVP unless marked otherwise.

## Technical implementation baseline

The current recommended implementation baseline is Next.js App Router, React and strict TypeScript; Tailwind CSS with CSS variables; PostgreSQL with Prisma; and Next.js Route Handlers backed by application-service modules. Use Zod for runtime validation. The frontend and backend may live in one modular-monolith repository for the MVP.

Use server components for public content by default and client components only for required interactivity. Use PostgreSQL full-text search initially. Add Redis, a dedicated search service, microservices or a separate backend runtime only when measured requirements justify them. Authentication must use one selected solution (Auth.js or Supabase Auth) and enforce all permissions server-side. Rust is optional and not mandatory.

Testing baseline: Vitest, React Testing Library, Playwright and automated accessibility checks with axe-core or equivalent. Refer to `04-SDD-architecture.md` for the full stack and deployment decisions.

## Actors
Visitor/patient; appointment staff; content editor; department manager; approver/hospital administrator; IT administrator; restricted agency support operator.

## Functional requirements

### Public website
- FR-WEB-01 Responsive mobile/tablet/desktop pages.
- FR-WEB-02 Bangla and English navigation/content.
- FR-WEB-03 Display hospital profile, branches, hours and contacts.
- FR-WEB-04 Display departments, services, doctors, qualifications, specialties, chambers and schedules.
- FR-WEB-05 Search doctors by name and filter by department, specialty, branch and availability where data exists.
- FR-WEB-06 Show freshness/last-updated indicators for selected information.
- FR-WEB-07 Provide one-tap phone links.
- FR-WEB-08 Hide drafts, archived and expired content from current public views.

### Dashboard and publishing
- FR-CMS-01 Authorized staff create/edit/archive doctors, departments, services, branches, fees and schedules.
- FR-CMS-02 Records support applicable draft, pending approval, approved, published and archived states.
- FR-CMS-03 Enforce server-side role and resource/branch permissions.
- FR-CMS-04 Record actor, timestamp, action and changed fields for important changes.
- FR-CMS-05 Support effective-from/until dates for fees and schedules.
- FR-CMS-06 Restrict publication to authorized roles.
- FR-CMS-07 Provide preview before publication.
- FR-CMS-08 Support bilingual public fields.
- FR-CMS-09 Approval policy configurable by content type.

### Appointments
- FR-APT-01 Staff configure appointment types, doctors, branches, working hours, slot duration, capacity and booking rules.
- FR-APT-02 Visitors view enabled availability.
- FR-APT-03 Visitors submit appointment requests with minimum necessary contact data.
- FR-APT-04 Each request receives a unique reference.
- FR-APT-05 States: requested, pending confirmation, confirmed, reschedule requested, cancelled, completed, no-show.
- FR-APT-06 Staff confirm, reject, cancel or reschedule with permission.
- FR-APT-07 Prevent overbooking within configured slot capacity.
- FR-APT-08 Record status transitions and actor.
- FR-APT-09 Send updates through enabled channels.
- FR-APT-10 Never label a request confirmed before confirmation completes.
- FR-APT-11 Staff block unavailable periods.
- FR-APT-12 Hospital-configured cancellation/rescheduling policies.

### AI patient information assistant
- FR-AI-01 Answer administrative/informational questions only.
- FR-AI-02 Support Bangla, English and reasonable Banglish input.
- FR-AI-03 Retrieve only hospital-approved published sources.
- FR-AI-04 Never use unpublished drafts as patient-facing facts.
- FR-AI-05 Detect missing, stale or conflicting source information.
- FR-AI-06 Abstain and provide department contact/callback route when uncertain.
- FR-AI-07 Refuse diagnosis, treatment, medication and symptom-triage requests.
- FR-AI-08 Never claim an appointment is booked without appointment-service confirmation.
- FR-AI-09 Collect operational metrics while minimizing sensitive conversation retention.
- FR-AI-10 Disclose that the assistant is automated.
- FR-AI-11 Website channel is MVP; Messenger and WhatsApp are Release 2 unless separately contracted.

### Contact and feedback
- FR-COM-01 Visitor submits callback/contact request.
- FR-COM-02 Visitor submits private feedback.
- FR-COM-03 Staff categorize, assign and update feedback status.
- FR-COM-04 Private feedback is never publicly exposed.
- FR-COM-05 Collect only necessary fields and show privacy notice.

### Release 2: staff AI updates
- FR-UPD-01 Staff submit structured update requests.
- FR-UPD-02 AI converts notes into proposed structured changes.
- FR-UPD-03 AI drafts notices.
- FR-UPD-04 Validate and present proposed changes for human review.
- FR-UPD-05 AI cannot publish critical changes without approval.
- FR-UPD-06 Preserve original submission and generated draft.

### Analytics and administration
- FR-AN-01 Managers view appointment counts by status/date/doctor/branch.
- FR-AN-02 Managers view contact and feedback volumes.
- FR-AN-03 Managers view assistant usage, unresolved questions and top categories.
- FR-AN-04 Metrics define test-traffic treatment and data source.
- FR-AN-05 Advanced scheduled reporting may be Release 2.
- FR-ADM-01 IT admins manage users, roles and permissions.
- FR-ADM-02 Configure hospital identity, branches, contacts, languages and policies.
- FR-ADM-03 Agency support access is explicitly authorized and audited.
- FR-ADM-04 Each installation has unique identity, database and secrets.
- FR-ADM-05 Provide health checks for critical dependencies.

## Data requirements
Core entities: HospitalConfiguration, Branch, Department, Doctor, Specialty, DoctorBranch, ScheduleRule, ScheduleException, Service, Fee, ContentItem, User, Role, Permission, AppointmentType, Availability, Appointment, AppointmentEvent, ContactRequest, Feedback, KnowledgeSource, KnowledgeChunk, ConversationSession, AuditEvent, Notification, IntegrationConfiguration.

Minimize patient data. Do not collect national ID, medical history or diagnosis for routine appointments without a documented requirement and legal review. Define retention per category. Do not place secrets or patient data in logs.

## Non-functional requirements
- NFR-01 Initial availability target 99.5% monthly, subject to hosting contract and excluding agreed maintenance/third-party outages.
- NFR-02 Target p75 LCP <= 2.5 seconds on representative mobile connections after optimization; measure before making a service guarantee.
- NFR-03 Target p95 standard public read API latency < 500 ms under agreed pilot load, excluding external AI/provider latency.
- NFR-04 HTTPS for external traffic.
- NFR-05 Modern password hashing; no reversible password storage.
- NFR-06 Server-side authorization for all admin mutations.
- NFR-07 Audit important mutations.
- NFR-08 Encrypted backups and tested restoration.
- NFR-09 Repeatable migrations and deployments.
- NFR-10 Keyboard navigation, semantic markup and labeled forms.
- NFR-11 Full Unicode support for Bangla and English.
- NFR-12 Replaceable AI and messaging providers.
- NFR-13 Tenant isolation through separate deployments, databases, credentials and storage.
- NFR-14 No secrets, stack traces or sensitive patient data in error responses.
- NFR-15 Document retention, deletion, backup and incident procedures.

## Security requirements
Role/resource-scoped access; MFA for privileged users where feasible and mandatory for agency production access; rate limiting and anti-abuse controls; CSRF protection for cookie-authenticated mutations; Secure/HttpOnly/SameSite cookies; input validation/output encoding; secrets outside source control; encrypted storage/backups; audit access to patient submissions; dependency scanning and patch process; no sensitive analytics payloads.

## Acceptance gates
All Must requirements pass; no unresolved critical/high security defect; hospital approves loaded data; appointment concurrency tests pass; AI grounding/refusal/abstention tests pass; restore test passes; UAT sign-off recorded.
