# DeltaCare Hospital Platform

**Brand Name:** DeltaCare  
**Header Tagline:** Care at DeltaCare  
**Primary CTA:** Request Appointment  
**Platform Name:** DeltaCare Hospital Platform  
**Admin Console:** DeltaCare Admin  
**AI Patient Assistant:** DeltaCare Assistant  

---

## 1. Platform Overview

**DeltaCare** is a complete, production-ready, bilingual (English `en` & Bangla `bn`) healthcare website and hospital digital operations platform built with Next.js App Router, React 19, TypeScript (strict mode), Tailwind CSS + Mayo Clinic reference CSS custom properties (`--mc-*`), Zod runtime validation, and Prisma / PostgreSQL relational architecture.

### Authoritative Sources Preserved & Honored
1. **[`source of truth/`](file:///e:/projects/hospital%20final/source%20of%20truth)** (10 Markdown engineering documents: `00-product-definition.md` through `09-README.md`) — Primary functional, domain, RBAC, appointment workflow, CMS approval, and AI safety authority.
2. **[`inspo.html`](file:///e:/projects/hospital%20final/inspo.html)** — Primary visual reference (247 `--mc-*` CSS tokens, Display Serif typography, 5-tab Mega-Menu with right-hand `.cmp-teaser` cards, `48px` circular `A–Z` & `#` alphabet buttons on `#0057b8` brand blue, 3-column Locations campus grid, Featured Care Areas chevron links, Story split blocks, `#0d0d33` institutional banner, and `#012d61` deep navy footer).
3. **[`inspo_instruction.md`](file:///e:/projects/hospital%20final/inspo_instruction.md)** — Supplementary frontend & engineering specification.
4. **[`inspo_files/`](file:///e:/projects/hospital%20final/inspo_files)** — Supporting visual assets copied to `public/images/inspo/` while keeping `inspo_files/` completely untouched.

---

## 2. Reference Audit & Architecture Documentation

All 8 mandatory engineering and reference audit specifications are located in [`docs/reference-audit/`](file:///e:/projects/hospital%20final/docs/reference-audit):

- [`REFERENCE_AUDIT.md`](file:///e:/projects/hospital%20final/docs/reference-audit/REFERENCE_AUDIT.md) — Source audit, Requirements Traceability Matrix (`FR-WEB`, `FR-CMS`, `FR-APT`, `FR-AI`, `FR-UPD`, `FR-FB`, `FR-NTF`, `FR-REP`, `NFR-01..12`), and Resolved Conflict Log (`CONF-01..03`).
- [`ROUTE_INVENTORY.md`](file:///e:/projects/hospital%20final/docs/reference-audit/ROUTE_INVENTORY.md) — Public, authentication, patient portal, admin console, and REST API `/api/v1/*` routes.
- [`COMPONENT_INVENTORY.md`](file:///e:/projects/hospital%20final/docs/reference-audit/COMPONENT_INVENTORY.md) — Component mapping from `inspo.html` `.cmp-*` primitives to DeltaCare React components.
- [`DESIGN_SYSTEM.md`](file:///e:/projects/hospital%20final/docs/reference-audit/DESIGN_SYSTEM.md) — Extracted `--mc-*` color palette, typography scale, spacing, radii, and elevation tokens.
- [`INTERACTION_SPEC.md`](file:///e:/projects/hospital%20final/docs/reference-audit/INTERACTION_SPEC.md) — Keyboard focus (`2px dashed #0057b8`), mega-menu, autocomplete search, hero motion pause/play, and transactional slot booking behaviors.
- [`RESPONSIVE_SPEC.md`](file:///e:/projects/hospital%20final/docs/reference-audit/RESPONSIVE_SPEC.md) — Breakpoints (`sm`, `md`, `lg`, `xl` `1200px` navigation switch) and mobile drawer behaviors.
- [`ASSET_INVENTORY.md`](file:///e:/projects/hospital%20final/docs/reference-audit/ASSET_INVENTORY.md) — Complete asset provenance and synthetic portrait SVG inventory.
- [`TECHNICAL_ARCHITECTURE.md`](file:///e:/projects/hospital%20final/docs/reference-audit/TECHNICAL_ARCHITECTURE.md) — Layered architecture, Prisma schema, concurrency locking, RBAC matrix, and backup/restore runbook.

---

## 3. Setup & Commands

### Prerequisites
- Node.js `v20+` (verified on `v24.20.0`)
- npm `v10+`
- Optional PostgreSQL 16 database (for Prisma relational deployment; local/test runtime automatically persists state transactionally in `.data/deltacare-db.json` seeded from [`src/server/db/seedData.ts`](file:///e:/projects/hospital%20final/src/server/db/seedData.ts)).

### Quick Start
```bash
# 1. Install dependencies
npm install

# 2. Run TypeScript strict typecheck
npm run typecheck

# 3. Run Vitest unit & integration verification suite
npm test

# 4. Build production bundle
npm run build

# 5. Start development or production server
npm run dev
# or
npm start
```

---

## 4. Synthetic Demo Credentials

All seeded doctors, BMDC registration numbers, schedules, and users are clearly labeled **Synthetic Development Data**:

| Role | Email | Password | Portal Route |
|---|---|---|---|
| **Super Admin** | `superadmin@deltacare.bd` | `DeltaCare#2026` | `/admin` |
| **Hospital Admin (Approver)** | `admin@deltacare.bd` | `DeltaCare#2026` | `/admin` |
| **Front-Desk Receptionist** | `frontdesk@deltacare.bd` | `DeltaCare#2026` | `/admin` |
| **Content Editor (CMS)** | `editor@deltacare.bd` | `DeltaCare#2026` | `/admin` |
| **Patient** | `patient@deltacare.bd` | `DeltaCare#2026` | `/dashboard` |

### Sample Appointment Tracking Codes
- **`DC-2026-1041`** + Phone **`01711223344`** (`CONFIRMED` status with audit history)
- **`DC-2026-1042`** + Phone **`01711223344`** (`REQUESTED` status — pending front-desk confirmation)

---

## 5. Backup, Restore & Operational Runbook

1. **PostgreSQL Production Backup:**
   ```bash
   pg_dump "$DATABASE_URL" --format=custom --file=deltacare_backup_$(date +%F).dump
   ```
2. **PostgreSQL Restore:**
   ```bash
   pg_restore --clean --if-exists --dbname="$DATABASE_URL" deltacare_backup_YYYY-MM-DD.dump
   ```
3. **Local JSON Transactional Store Reset:**
   Delete `.data/deltacare-db.json` or call `resetDbStateForTests()` in [`src/server/db/store.ts`](file:///e:/projects/hospital%20final/src/server/db/store.ts) to re-initialize from the canonical synthetic seed dataset.

