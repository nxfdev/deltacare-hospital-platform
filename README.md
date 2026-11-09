# DeltaCare Hospital Platform

**Brand Name:** DeltaCare  
**Header Tagline:** Care at DeltaCare  
**Primary CTA:** Request Appointment  
**Platform Name:** DeltaCare Hospital Platform  
**Staff Console:** DeltaCare Staff Console  
**AI Patient Assistant:** DeltaCare Assistant  

---

## 1. Platform Overview

**DeltaCare** is a bilingual (English `en` & Bangla `bn`) healthcare website and multi-branch doctor chamber & fixed-slot appointment platform built with Next.js App Router, React 19, TypeScript (strict mode), Tailwind CSS + Mayo Clinic reference CSS custom properties (`--mc-*`), Zod runtime validation, `date-fns-tz` (`Asia/Dhaka` `UTC+6`), and Prisma / PostgreSQL relational architecture.

---

## 2. Reference Audit & Architecture Documentation

All 8 engineering and reference audit specifications are located in [`docs/reference-audit/`](file:///e:/projects/hospital%20final/docs/reference-audit):

- [`REFERENCE_AUDIT.md`](file:///e:/projects/hospital%20final/docs/reference-audit/REFERENCE_AUDIT.md) — Source audit, Requirements Traceability Matrix, and Resolved Conflict Log.
- [`ROUTE_INVENTORY.md`](file:///e:/projects/hospital%20final/docs/reference-audit/ROUTE_INVENTORY.md) — Public, authentication, patient portal, staff console, and stateless JSON `/api/v1/*` routes (APK-ready).
- [`COMPONENT_INVENTORY.md`](file:///e:/projects/hospital%20final/docs/reference-audit/COMPONENT_INVENTORY.md) — Component mapping to DeltaCare React components.
- [`DESIGN_SYSTEM.md`](file:///e:/projects/hospital%20final/docs/reference-audit/DESIGN_SYSTEM.md) — Extracted `--mc-*` color palette, typography scale, spacing, radii, and elevation tokens.
- [`INTERACTION_SPEC.md`](file:///e:/projects/hospital%20final/docs/reference-audit/INTERACTION_SPEC.md) — Keyboard focus, mega-menu, autocomplete search, and transactional fixed-slot booking behaviors.
- [`RESPONSIVE_SPEC.md`](file:///e:/projects/hospital%20final/docs/reference-audit/RESPONSIVE_SPEC.md) — Breakpoints and mobile drawer behaviors.
- [`ASSET_INVENTORY.md`](file:///e:/projects/hospital%20final/docs/reference-audit/ASSET_INVENTORY.md) — Complete asset provenance and portrait SVG inventory.
- [`TECHNICAL_ARCHITECTURE.md`](file:///e:/projects/hospital%20final/docs/reference-audit/TECHNICAL_ARCHITECTURE.md) — Layered architecture, Prisma schema, concurrency locking, RBAC matrix, and backup/restore runbook.

---

## 3. Setup & Commands

### Prerequisites
- Node.js `v20+`
- npm `v10+`
- PostgreSQL 16 database (`DATABASE_URL` in `.env`) with Prisma Client (`@prisma/client`).

### Quick Start
```bash
# 1. Install dependencies
npm install

# 2. Generate Prisma Client & push schema
npx prisma generate
npx prisma db push

# 3. Run TypeScript strict typecheck
npm run typecheck

# 4. Run Vitest unit & integration verification suite
npm test

# 5. Build production bundle
npm run build

# 6. Start development or production server
npm run dev
# or
npm start
```

---

## 4. Security & Authentication Policy

- Staff accounts (`HOSPITAL_ADMIN`, `CMS_EDITOR`, `APPOINTMENT_MANAGER`, `FRONT_DESK`, `DOCTOR`) use bcrypt-hashed passwords (`cost=10`) and enforce first-login password updates when `mustChangePassword` is enabled.
- No plaintext or public demo credentials are exposed in documentation or on the login UI.

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
