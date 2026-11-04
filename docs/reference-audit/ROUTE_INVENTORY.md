# DeltaCare — Route Inventory

**Source Authority:** `source of truth/02-SRS.md`, `04-SDD-architecture.md`, `inspo.html`, `inspo_instruction.md`, and Master Prompt Sections 7, 8, 12, 13.

---

## 1. Public Website Routes (`src/app/(website)/...`)

| Route Path | Page Title (EN / BN) | Template Type | Primary Purpose & Data Source |
|---|---|---|---|
| `/` | DeltaCare — Care at DeltaCare | Homepage Template | 9-section homepage following Master Prompt Section 7 & `inspo.html` visual design system |
| `/appointments` | Request Appointment | Appointment Workflow | Interactive appointment request wizard with live slot availability, doctor/department selection, and reference tracking |
| `/appointments/track` | Track Appointment Request | Status Lookup | Allows patients to check request status (`REQUESTED`, `PENDING_CONFIRMATION`, `CONFIRMED`, etc.) using their reference code & phone |
| `/doctors` | Find a Doctor | Directory + Filter Template | Searchable & filterable doctor directory (by name, department, specialty, branch, availability) |
| `/doctors/[slug]` | Doctor Profile | Detail Profile Template | Verified qualifications, specialty, chamber/branch, weekly schedule with effective dates, consultation fee, and booking CTA |
| `/departments` | Departments & Centers | Directory Template | All published hospital departments, clinical specialties, and featured care areas |
| `/departments/[slug]` | Department Detail | Detail Template | Overview, services & published fees, assigned specialists, branch locations, related conditions |
| `/diseases-conditions` | Diseases & Conditions Directory | A–Z + Search Index | Interactive A–Z alphabetical facet (`A`–`Z`, `#`) and keyword search over approved medical condition guides |
| `/diseases-conditions/[slug]` | Condition Guide | Medical Article Template | Approved overview, symptoms, causes, diagnosis, care at DeltaCare, reviewer attribution, last-reviewed date, and related doctors |
| `/tests-procedures` | Tests & Procedures | Directory + Search Template | Approved diagnostic tests and clinical procedures with preparation instructions and published fee transparency |
| `/tests-procedures/[slug]` | Procedure Detail | Medical Guide Template | Preparation, what to expect, recovery, published fee with effective date, and related department |
| `/locations` | Locations & Branches | Branch Directory | All DeltaCare hospital branches with imagery, address, hours, emergency phone, and services |
| `/locations/[slug]` | Branch Detail | Branch Detail Template | Branch campus overview, departments, doctors practicing at branch, hours, directions, and one-tap calling |
| `/patient-services` | Patient & Visitor Guide | Hub Template | Billing & fee transparency, visitor hours, international patient support, admissions guide, and private feedback link |
| `/international` | International & Out-of-Town Patients | Informational + Inquiry | Dedicated support coordinator info, travel/accommodation guidance, and inquiry form |
| `/about` | About DeltaCare | Institutional Template | Mission, clinical governance, quality & safety standards, leadership, and why choose DeltaCare |
| `/contact` | Contact Us & Callback Request | Form + Directory Template | One-tap emergency/branch phones, callback request form (`FR-COM-01`), and private feedback/complaint submission (`FR-COM-02`) |
| `/privacy-policy` | Privacy Policy & Patient Data Notice | Legal Template | Bangladesh data protection & privacy notice, data minimization & retention policy |
| `/terms` | Terms & Conditions | Legal Template | Website terms of use, medical disclaimer, and appointment policy |
| `/accessibility` | Digital Accessibility Statement | Legal Template | WCAG 2.2 AA commitment, keyboard shortcuts, and support contact |

---

## 2. Authentication & Patient Portal Routes (`src/app/(auth)/...` & `src/app/dashboard/...`)

| Route Path | Access Level | Purpose |
|---|---|---|
| `/login` | Public | Secure sign-in for Patients and Hospital Staff/Administrators with role-based redirect |
| `/register` | Public | Patient account registration with Zod validation and consent recording |
| `/forgot-password` | Public | Account recovery request flow |
| `/dashboard` | Authenticated (`PATIENT`+) | Patient Dashboard: view submitted appointment requests, status timeline, reschedule/cancel requests, and notifications |

---

## 3. DeltaCare Admin Dashboard Routes (`src/app/admin/...`)

| Route Path | Required Role(s) | Capabilities |
|---|---|---|
| `/admin` | All Staff Roles | Operational overview, real-time KPI cards, pending queues, recent audit activity |
| `/admin/appointments` | `SUPER_ADMIN`, `HOSPITAL_ADMIN`, `RECEPTIONIST`, `DEPT_MANAGER`, `DOCTOR` | Appointment queue, filter by status/branch/doctor/date, confirm, reject, reschedule, cancel, block availability |
| `/admin/doctors` | `SUPER_ADMIN`, `HOSPITAL_ADMIN`, `DEPT_MANAGER`, `CONTENT_EDITOR` | Create/edit/archive doctor profiles, qualifications, specialties, chamber assignments, schedules, and fees |
| `/admin/departments` | `SUPER_ADMIN`, `HOSPITAL_ADMIN`, `DEPT_MANAGER`, `CONTENT_EDITOR` | Manage departments, specialties, featured care areas, and services |
| `/admin/locations` | `SUPER_ADMIN`, `HOSPITAL_ADMIN` | Manage hospital branches, addresses, contact numbers, operating hours |
| `/admin/content` | `SUPER_ADMIN`, `HOSPITAL_ADMIN`, `CONTENT_EDITOR`, `DEPT_MANAGER` | Manage Diseases & Conditions, Tests & Procedures, and institutional content in English & Bangla |
| `/admin/approvals` | `SUPER_ADMIN`, `HOSPITAL_ADMIN`, `DEPT_MANAGER` | Review pending changes (`DRAFT -> PENDING_APPROVAL -> APPROVED -> PUBLISHED`), view field diffs, approve or reject with reason |
| `/admin/ai-updates` | `SUPER_ADMIN`, `HOSPITAL_ADMIN`, `DEPT_MANAGER`, `CONTENT_EDITOR` | Staff Update Assistant (`FR-UPD-01..06`): parse natural-language staff notes into structured change drafts requiring human approval |
| `/admin/feedback` | `SUPER_ADMIN`, `HOSPITAL_ADMIN`, `DEPT_MANAGER` | Private patient feedback & complaints queue, AI-assisted categorization, department routing, internal notes, resolution tracking |
| `/admin/communications` | `SUPER_ADMIN`, `HOSPITAL_ADMIN`, `RECEPTIONIST` | Callback requests queue & outbound notification logs (Email/SMS/WhatsApp adapter status) |
| `/admin/analytics` | `SUPER_ADMIN`, `HOSPITAL_ADMIN`, `DEPT_MANAGER` | Real-data operational analytics, doctor utilization, AI assistant metrics, unresolved queries, CSV export |
| `/admin/users` | `SUPER_ADMIN`, `HOSPITAL_ADMIN` | Staff & user account management, role assignment, branch scoping, audit trail viewer |

---

## 4. Versioned API Route Handlers (`src/app/api/v1/...`)

- `GET /api/v1/health` — System & database health check (`FR-ADM-05`)
- `GET /api/v1/public/search` — Global search across doctors, conditions, procedures, departments, services
- `GET /api/v1/public/doctors` & `GET /api/v1/public/doctors/[slug]` — Published doctors & filter API
- `GET /api/v1/public/availability` — Computed slot availability respecting `ScheduleRule`, `ScheduleException`, and slot capacity
- `POST /api/v1/public/appointments` & `GET /api/v1/public/appointments/track` — Transactional appointment request creation & status lookup
- `POST /api/v1/public/assistant/messages` — Grounded DeltaCare Assistant endpoint with clinical safety guardrails
- `POST /api/v1/public/contact-requests` — Callback & contact inquiry submission
- `POST /api/v1/public/feedback` — Private feedback & complaint submission
- `POST /api/v1/auth/login`, `POST /api/v1/auth/register`, `POST /api/v1/auth/logout`, `GET /api/v1/auth/me` — Session & authentication endpoints
- `GET|POST|PATCH /api/v1/admin/appointments` & `POST /api/v1/admin/appointments/[id]/status` — Staff appointment confirmation/reschedule/cancellation
- `GET|POST|PATCH /api/v1/admin/doctors` — Staff doctor, schedule, and fee management
- `GET|POST|PATCH /api/v1/admin/departments` — Department & service management
- `GET|POST|PATCH /api/v1/admin/locations` — Branch management
- `GET|POST|PATCH /api/v1/admin/content` — Medical & institutional content management
- `GET|POST /api/v1/admin/approval-requests` & `POST /api/v1/admin/approval-requests/[id]/review` — Content approval & atomic publishing
- `GET|POST /api/v1/admin/ai-updates` — AI-assisted staff update drafting & submission for approval
- `GET|PATCH /api/v1/admin/feedback` — Staff feedback & complaint triage
- `GET /api/v1/admin/analytics` — Real operational metrics & CSV export
- `GET|POST|PATCH /api/v1/admin/users` — RBAC user management & audit log inspection

