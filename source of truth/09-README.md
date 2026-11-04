# Hospital Digital Operations Platform — Engineering Documentation

This bundle is the baseline product and engineering specification derived from the submitted decisions.

## Files
- `00-product-definition.md` — vision, release scope, exclusions and packages.
- `01-BRD.md` — business requirements.
- `02-SRS.md` — functional/non-functional requirements and security.
- `03-user-stories.md` — stories and acceptance criteria.
- `04-SDD-architecture.md` — TypeScript/Next.js architecture, data model, APIs, AI and deployment.
- `05-test-plan.md` — testing strategy and release gates.
- `06-risk-register.md` — risks and mitigations.
- `07-glossary.md` — terminology.
- `08-implementation-roadmap.md` — phased delivery.

## Baseline decisions
Bangladesh first; dedicated installation/database per hospital; shared codebase; Next.js App Router + React + TypeScript; Tailwind CSS; PostgreSQL + Prisma; modular monolith; bilingual website; informational AI only; appointment workflow with staff oversight; no HIMS/EMR/diagnostic reports in MVP; website-first AI; staged messaging integrations; hospital owns data subject to applicable law and contract.

## Updated technical baseline

The newest visual-reference engineering specification supersedes the earlier Rust-first stack preference. The recommended baseline is:

- **Frontend/application:** Next.js App Router, React and strict TypeScript.
- **Styling and interaction:** Tailwind CSS + CSS variables; Framer Motion selectively; Lucide React.
- **Forms/validation:** React Hook Form + Zod.
- **Database/data access:** PostgreSQL + Prisma.
- **Authentication:** choose Auth.js or Supabase Auth after deployment discovery; do not default to both.
- **Search:** PostgreSQL full-text search initially.
- **Testing:** Vitest, React Testing Library, Playwright and axe-core.
- **Operations:** GitHub Actions, Sentry or equivalent, Cloudflare or equivalent, managed hosting or container deployment, encrypted backups and restore tests.
- **Optional infrastructure:** Redis, separate search engines and additional services only when measured needs justify them.

Rust is not mandatory and is not the default for this project. Keep the architecture modular so a separate service in another language can be introduced later only for a justified workload.

The supplied visual-reference specification governs the visual reconnaissance process and frontend quality expectations. The existing product definition, BRD and SRS continue to govern the hospital product's agreed MVP scope; do not automatically expand the MVP to every reference-site route or clinical content feature.

## Important status
This is the engineering baseline, not a substitute for discovery and a signed scope with the first hospital. Confirm schedule rules, data fields, privacy/retention terms, provider choices, hosting region, SLAs and package pricing before implementation.

## First vertical slice
1. Admin login.
2. Create a branch, department and doctor.
3. Submit a doctor schedule for approval.
4. Publish to bilingual public website.
5. Search for the doctor as a visitor.
6. Submit and process an appointment request.
7. Verify audit events and backup/restore.
