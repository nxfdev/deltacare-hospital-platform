# DeltaCare — Complete Source Audit, Conflict Resolution & Requirements Traceability Matrix

**Date:** 2026-11-03  
**Platform:** DeltaCare Hospital Platform (`DeltaCare`, `Care at DeltaCare`, `DeltaCare Admin`, `DeltaCare Assistant`)  
**Status:** Phase 0 Complete — All 4 Sources Inspected & Verified

---

## 1. Repository & Source Inventory Audit

The workspace (`e:\projects\hospital final`) was inspected prior to writing any application code. It currently contains **only** the four source materials (no pre-existing Next.js or Prisma codebase is present yet):

1. **`source of truth/`** (Directory containing 10 Markdown files — all 10 read and analyzed):
   - `00-product-definition.md` (3,976 bytes) — Vision, Release 1/2/3 scope, explicit exclusions, commercial packages, key success measures.
   - `01-BRD.md` (3,326 bytes) — Business objectives, stakeholders, BR-01 through BR-15, business rules, launch acceptance.
   - `02-SRS.md` (8,218 bytes) — Technical baseline, actors, FR-WEB-01..08, FR-CMS-01..09, FR-APT-01..12, FR-AI-01..11, FR-COM-01..05, FR-UPD-01..06, FR-AN-01..05, FR-ADM-01..05, data entities, NFR-01..15, security requirements.
   - `03-user-stories.md` (2,804 bytes) — Patient/Visitor (US-P01..05), Front Desk (US-S01..03), Content Editor/Dept Manager (US-C01..02), Hospital Admin (US-A01..03), Agency Operator (US-O01..02), Release 2 stories.
   - `04-SDD-architecture.md` (15,717 bytes) — TypeScript-first modular monolith architecture, 14 logical modules, conceptual relational data model, scheduling & concurrency, publishing state machine, AI safety & grounding, `/api/v1/*` REST endpoints, ADRs 001–011.
   - `05-test-plan.md` (3,108 bytes) — Vitest, React Testing Library, Playwright, axe-core, Lighthouse, core test cases (`T-WEB-01`..`T-ISO-01`), AI regression dataset.
   - `06-risk-register.md` (2,425 bytes) — Risks `R-01` through `R-18` and mitigations.
   - `07-glossary.md` (1,435 bytes) — Standardized terminology (Abstention, Approval workflow, Banglish, Branch, Dedicated installation, Effective date, Slot capacity, Source grounding).
   - `08-implementation-roadmap.md` (2,904 bytes) — Phases 0–6, first vertical slice, change control.
   - `09-README.md` (3,208 bytes) — Documentation index, baseline decisions, first vertical slice definition.

2. **`inspo.html`** (File — 1,165,674 bytes):
   - Saved HTML snapshot of `https://www.mayoclinic.org/` containing 49 embedded `<style>` blocks (504,473 bytes of CSS) and full DOM markup (266,646 bytes of body HTML).
   - Provides 247 exact `--mc-*` CSS custom properties, typography hierarchy, grid geometry, mega-menu structure, hero card structure, alphabet facet + global search 2-column section, story cards, 3-column location image cards, mosaic featured care areas, donation banner, and multi-column footer with language selector.

3. **`inspo_instruction.md`** (File — 45,650 bytes, 1,574 lines):
   - Supplementary frontend engineering and design specification covering visual reconnaissance, reusable global shell and content/interaction components, page templates, accessibility (WCAG 2.2 AA), performance targets, SEO/medical governance, and testing gates.

4. **`inspo_files/`** (Directory — 48 files):
   - Contains local image assets (`.jpg`, `.png`, `.svg`), stylesheet files (`fonts.css`, `mayo-clinic-fonts-arabic.css`), and saved scripts from the reference snapshot.

---

## 2. Source Conflicts & Resolution Log

| Conflict ID | Topic | Source A | Source B | Resolution & Justification |
|---|---|---|---|---|
| **CONF-01** | **Homepage Section Order** | **Master Prompt Section 7** specifies: (1) Global Header, (2) Hero, (3) Appointment Request, (4) Global Search, (5) Alphabetical Diseases & Conditions Directory, (6) Locations & Branches, (7) Featured Care Areas, (8) Additional Homepage Content (Story Cards / Why Choose DeltaCare / Doctor Discovery), (9) Footer. | **`inspo.html` DOM order** places: (1) Header, (2) Hero, (3) 2-Column Alphabetical Facet + Search, (4) Story Cards ("Healing starts here" & "World-class care"), (5) Locations, (6) Featured Care Areas, (7) Research Banner, (8) Footer. | **Resolution:** Follow **Master Prompt Section 7** explicit section order while using the exact measured `--mc-*` visual components and geometry from `inspo.html`. Specifically, place the prominent **Appointment Request** experience immediately after the Hero, followed by the **Global Search + Alphabetical Diseases & Conditions Directory**, **Locations & Branches**, **Featured Care Areas**, and **Additional Content (Story Cards: Healing Starts Here / Patient-Centered Care & Doctor Discovery)**, then **Footer**. |
| **CONF-02** | **Patient Login & Registration** | **`00-product-definition.md` (line 51)** notes `patient login requirement (default: no login)` as a customer decision, while **`02-SRS.md`** defines Visitor/Patient + Staff actors. | **Master Prompt Sections 7, 8, 12** & **`inspo_instruction.md` Section 8.2/10.2** explicitly require `Register/Log in` in the Global Header, `/login`, `/register`, `/dashboard` (Patient Dashboard), and `PATIENT` role in RBAC, alongside unauthenticated visitor appointment requests. | **Resolution:** Support **both** frictionless guest/visitor appointment requests (`FR-APT-03`, no login required to request an appointment) **and** optional Patient Registration/Login (`/login`, `/register`, `/dashboard`) so patients who register can track their appointment requests, view status history, and manage contact preferences, while staff/admins log in to `/admin` (DeltaCare Admin). |
| **CONF-03** | **Release 1 MVP vs. Release 2 Features** | **`00-product-definition.md` & `01-BRD.md`** mark AI Staff Update Drafting (`FR-UPD-01..06`), Complaint Classification/Routing (`BR-13`), and Multi-Channel Adapters (SMS, WhatsApp, Messenger) as Release 2 / Should / Could. | **Master Prompt Sections 14, 15, 16, 17** require implementing the DeltaCare Assistant, Staff Update Assistant (with human approval workflow), Patient Communication adapters, and Feedback & Complaints routing. | **Resolution:** Implement the complete Release 1 MVP **plus** the Release 2 application workflows (Staff Update Assistant with human review/approval, Feedback & Complaints categorization/routing, and clean provider adapter interfaces for Email/SMS/WhatsApp/Messenger with database-backed notification logs) within the modular monolith so all required sections of the Master Prompt are fully functional. |
| **CONF-04** | **Clinical Content Scope vs. Non-HIMS Boundary** | **`inspo.html` & `inspo_instruction.md`** include Diseases & Conditions (`A–Z`) and Tests & Procedures directories. | **`00-product-definition.md` & `02-SRS.md`** state the platform is not an EMR/HIMS or clinical decision-support system, and all public content must be hospital-approved with review dates and disclaimers. | **Resolution:** Implement the Diseases & Conditions (`A–Z`) and Tests & Procedures directories as **dashboard-managed, hospital-approved educational & service guides** with explicit medical disclaimers, named reviewers, and effective/review dates (`FR-WEB-06`, `FR-CMS-02`), while strictly excluding EMR, prescriptions, diagnosis, or lab report storage. |
| **CONF-05** | **Reference Fonts & Proprietary Assets** | **`inspo_files/fonts.css`** references `MayoClinicSerifDisplay`, `MayoClinicSans`, and `MayoClinicSerif` hosted on `mayoclinic.org`, and `inspo_files/mayo-clinic-logo.svg` is Mayo Clinic's trademark. | **Master Prompt Sections 2, 3, 26** & **`inspo_instruction.md` Section 5.3** prohibit using Mayo Clinic trademarks/logos or unlicensed proprietary fonts. | **Resolution:** Use **DeltaCare** original SVG branding and open-source/licensed equivalents matching the exact typographic metrics of the reference (`Source Serif 4` / `Playfair Display` + `Georgia` for display/serif, `Plus Jakarta Sans` / `Inter` for sans-serif, and `Noto Sans Bengali` / `Hind Siliguri` for Bangla Unicode typography). |

---

## 3. Requirements Traceability Matrix (RTM)

| Req ID | Source Document | Requirement Summary | Application Feature / Module | Target Route / Endpoint | Phase | Verification Method |
|---|---|---|---|---|---|---|
| **BR-01 / NFR-13** | `01-BRD.md`, `02-SRS.md` | Dedicated deployment config, isolated DB & hospital identity | `hospital` module, `HospitalConfiguration` model, env config | `/api/v1/admin/settings`, `.env.example` | Phase 1 & 4 | Config & integration test (`T-ISO-01`) |
| **BR-02 / FR-WEB-01..02 / NFR-11** | `01-BRD.md`, `02-SRS.md` | Responsive Bangla (`bn`) and English (`en`) public website | i18n provider & dictionary, language switcher in Header & Footer, bilingual DB fields (`*_en`, `*_bn`) | All public routes | Phase 1, 2, 3 | Playwright E2E locale switch (`T-WEB-01`) |
| **FR-WEB-03** | `02-SRS.md` | Display hospital profile, branches, hours, contacts, emergency numbers | Locations & Branches directory, Branch Detail pages, Header/Footer contact links | `/locations`, `/locations/[slug]`, `/contact` | Phase 2 & 3 | E2E & component tests |
| **FR-WEB-04** | `02-SRS.md` | Display departments, services, doctors, qualifications, specialties, chambers, schedules | Doctor Directory, Doctor Profile, Departments & Specialties, Services & Fees | `/doctors`, `/doctors/[slug]`, `/departments`, `/departments/[slug]`, `/services` | Phase 3 & 4 | E2E & integration tests |
| **FR-WEB-05 / US-P01** | `02-SRS.md`, `03-user-stories.md` | Search doctors by name; filter by department, specialty, branch, availability | Doctor Search & Filter bar, Global Search (`PostgreSQL` full-text / indexed search) | `/doctors`, `/search`, `GET /api/v1/public/doctors`, `GET /api/v1/public/search` | Phase 2, 3, 4 | Vitest & Playwright (`T-WEB-02`) |
| **FR-WEB-06** | `02-SRS.md` | Show freshness / last-updated indicators & effective dates for schedules, fees, medical pages | `FreshnessBadge` component on Doctor Schedules, Service Fees, and Condition/Procedure pages | `/doctors/[slug]`, `/services`, `/diseases-conditions/[slug]` | Phase 3 | Component & E2E check |
| **FR-WEB-07 / US-P03** | `02-SRS.md`, `03-user-stories.md` | One-tap phone links (`tel:`) and validated callback/contact form | Emergency & branch phone links, Contact/Callback Request workflow | `/contact`, `POST /api/v1/public/contact-requests` | Phase 3 & 4 | Integration & E2E test |
| **FR-WEB-08** | `02-SRS.md` | Hide drafts, archived, and expired content from public views | Publication state & effective-date filtering in all public query services | `src/server/application/public/*` | Phase 4 | Unit & integration tests (`T-WEB-03`, `T-AI-04`) |
| **FR-CMS-01..09 / US-C01..02 / US-A02** | `02-SRS.md`, `03-user-stories.md` | Staff CRUD for doctors, departments, services, branches, conditions, care areas, fees, schedules; `draft -> pending_approval -> approved -> published -> archived` workflow; preview & audit log | DeltaCare Admin CMS & Approval Queue (`publishing` & `audit` modules) | `/admin/doctors`, `/admin/departments`, `/admin/schedules`, `/admin/approvals`, `/api/v1/admin/*` | Phase 4 & 5 | Unit & integration tests (`T-CMS-01..04`) |
| **FR-APT-01..12 / US-P04 / US-S01..03** | `02-SRS.md`, `03-user-stories.md` | Slot availability calculation, appointment request with unique reference, transactional capacity check, status transitions (`REQUESTED`, `PENDING_CONFIRMATION`, `CONFIRMED`, `RESCHEDULE_REQUESTED`, `CANCELLED`, `COMPLETED`, `NO_SHOW`), schedule exception blocking | `scheduling` & `appointments` modules, Homepage & `/appointments` form, Admin Appointment Queue, Patient Dashboard | `/appointments`, `/dashboard`, `/admin/appointments`, `POST /api/v1/public/appointments`, `POST /api/v1/admin/appointments/[id]/*` | Phase 2, 3, 4, 5 | Concurrency & workflow tests (`T-APT-01..04`) |
| **FR-AI-01..11 / US-P05** | `02-SRS.md`, `03-user-stories.md` | DeltaCare Assistant grounded strictly in published hospital sources; Bangla/English/Banglish support; refuses clinical/diagnosis/prescription advice; abstains on unknown fees/stale data; never claims unconfirmed booking | `knowledge` & `assistant` modules, floating & dedicated DeltaCare Assistant widget | `POST /api/v1/public/assistant/messages`, `/assistant` | Phase 6 | AI safety & grounding test suite (`T-AI-01..06`) |
| **FR-COM-01..05** | `02-SRS.md` | Callback/contact requests & private feedback/complaints with categorization, department routing, internal notes, resolution workflow | `communications` module, `/patient-services/feedback`, Admin Feedback & Complaints queue | `POST /api/v1/public/feedback`, `/admin/feedback` | Phase 5 & 6 | Integration test (`T-FB-01`) |
| **FR-UPD-01..06** | `02-SRS.md` | Staff AI Update Assistant: parses staff notes into structured draft proposals requiring human approval before publishing | `assistant` / `publishing` module in DeltaCare Admin | `/admin/ai-updates`, `POST /api/v1/admin/ai-updates` | Phase 6 | Integration test |
| **FR-AN-01..05 / US-A03** | `02-SRS.md`, `03-user-stories.md` | Real database analytics: appointment counts by status/doctor/branch/date, contact & feedback volumes, AI assistant usage & unresolved queries, CSV export | `analytics` module in DeltaCare Admin | `/admin/analytics`, `GET /api/v1/admin/analytics` | Phase 5 | Integration test |
| **FR-ADM-01..05 / US-A01** | `02-SRS.md`, `03-user-stories.md` | RBAC user/role/permission management, branch scoping, hospital settings, `/api/v1/health` check | `identity` & `operations` modules | `/admin/users`, `/admin/settings`, `GET /api/v1/health` | Phase 4 & 5 | Security test (`T-SEC-01`) |

---

## 4. Missing External Dependencies & Integration Boundaries

In accordance with Section 26 Rule 20, the following external credentials are not present in the local workspace and are cleanly abstracted behind environment-configured adapters with local development fallbacks:

1. **Cloud AI API Key (`OPENAI_API_KEY` / `GEMINI_API_KEY`):** Abstracted behind `AIProviderAdapter`. When no external key is configured, the deterministic Grounded Knowledge Retrieval & Safety Engine executes full intent classification, clinical refusal (`FR-AI-07`), published knowledge retrieval (`FR-AI-03`), and safe abstention (`FR-AI-06`) in English, Bangla, and Banglish.
2. **SMS / WhatsApp / Email Provider Keys (`SMTP_*`, `SMS_API_KEY`, `WHATSAPP_ACCESS_TOKEN`):** Abstracted behind `NotificationChannelAdapter`. All outbound messages are persisted in the `Notification` table with delivery status tracking and audit records.
3. **S3-Compatible Object Storage (`S3_*`):** Abstracted behind `StorageService`. Local development uses approved local assets in `/public/images/inspo/` with metadata tracked in `MediaAsset`.

