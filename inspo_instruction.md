# MASTER ENGINEERING SPECIFICATION
## Enterprise Healthcare Website — Mayo Clinic Reference Recreation

**Document type:** Product, design, engineering, and production-readiness specification  
**Reference website:** https://www.mayoclinic.org/  
**Target environment:** Google Antigravity IDE  
**Primary market:** Bangladesh first, with architecture that can support international expansion  
**Project objective:** Reconstruct the reference website’s visual system and user experience at high fidelity, while improving usability, accessibility, performance, maintainability, and operational readiness.

---

# 1. Project Mission

Build a complete, production-ready healthcare information and service website inspired by the structure, interaction patterns, and visual quality of Mayo Clinic.

The result must:

1. Recreate the reference website’s visual language as closely as practical, including layout, typography, spacing, colors, navigation, cards, imagery treatment, page hierarchy, and responsive behavior.
2. Cover the major website sections and page types, not just the homepage.
3. Improve usability, accessibility, page speed, search, and navigation where improvements can be made without compromising visual fidelity.
4. Use reusable components and a maintainable design system.
5. Include real, working frontend and backend functionality—not decorative controls or fake interactions.
6. Be secure and ready for deployment after environment configuration, content approval, and operational testing.
7. Use original branding, approved content, and properly licensed assets. Do not imply that the site is Mayo Clinic or officially affiliated with it.

## 1.1 Non-negotiable principles

- **Visual fidelity:** Measure the reference. Do not guess at major dimensions, typography, colors, or spacing.
- **Functional completeness:** Every visible button, form, navigation item, filter, search control, and interactive element must work or be clearly marked as unavailable.
- **Responsive quality:** Desktop, tablet, and mobile layouts must be deliberately designed and tested.
- **Performance:** Avoid unnecessary JavaScript, oversized images, layout shifts, and excessive animation.
- **Accessibility:** Target WCAG 2.2 AA.
- **Security:** Treat patient-related data as highly sensitive. Do not use real patient data during development.
- **Maintainability:** Use typed, reusable, documented components and clear feature boundaries.
- **Honesty:** Do not claim a workflow is production-ready until it has been implemented, tested, configured, and reviewed.

---

# 2. Reference Website Reconnaissance

Do not begin by generating the entire application. First inspect the reference and document what must be recreated.

Reference URL: https://www.mayoclinic.org/

## 2.1 Pages to inspect

At minimum, inspect these page types and their important states:

| Page / section | Reference URL |
|---|---|
| Homepage | https://www.mayoclinic.org/ |
| Appointments | https://www.mayoclinic.org/appointments |
| Find a doctor | https://www.mayoclinic.org/appointments/find-a-doctor |
| Locations | https://www.mayoclinic.org/locations |
| Diseases and conditions | https://www.mayoclinic.org/diseases-conditions |
| International patients | https://www.mayoclinic.org/international |
| Departments and centers | https://www.mayoclinic.org/departments-centers |

Also inspect the reference sitemap and follow links to identify additional important routes. The list above is a starting inventory, not a claim that it covers every route.

## 2.2 Browser inspection procedure

Use a browser with developer tools. Inspect the reference at several viewport sizes.

### Elements and computed styles

For important elements, record:

- DOM hierarchy and semantic element type.
- Width, height, max-width, and min-height.
- Margin, padding, and gap.
- Font family, size, weight, line height, and letter spacing.
- Text color, background color, borders, radius, and shadows.
- Flexbox or grid behavior.
- Positioning, stacking order, and sticky behavior.
- Hover, focus, active, expanded, and selected states.

Use computed styles to establish the actual rendered values rather than relying only on stylesheets.

### Network panel

Inspect:

- Image and video assets.
- Font files and font formats.
- CSS and JavaScript bundles.
- Responsive image variants.
- Third-party services and embedded content.
- Asset dimensions and transfer sizes.
- Lazy-loading behavior.

Publicly delivered frontend assets may be inspected for reference and compatibility research. Their availability does not grant permission to reuse copyrighted content, trademarks, or proprietary assets.

### Sources and application behavior

Inspect:

- Publicly loaded scripts and styles.
- Route transitions.
- Search behavior.
- Menus and mega menus.
- Accordions, tabs, modals, filters, and pagination.
- Form validation and error states.
- Cookie and consent interfaces.
- Sticky headers and scroll-triggered behavior.

Do not attempt to access private systems, credentials, internal APIs, databases, or restricted source code.

### Performance panel

Record:

- Largest Contentful Paint (LCP).
- Interaction to Next Paint (INP).
- Cumulative Layout Shift (CLS).
- Long tasks and expensive scripts.
- Image decoding and loading behavior.
- Main-thread work and layout recalculations.

## 2.3 Required reconnaissance documents

Create these files in `/docs/reference-audit/` before full implementation:

```text
docs/
└── reference-audit/
    ├── REFERENCE_AUDIT.md
    ├── ROUTE_INVENTORY.md
    ├── COMPONENT_INVENTORY.md
    ├── DESIGN_SYSTEM.md
    ├── INTERACTION_SPEC.md
    ├── RESPONSIVE_SPEC.md
    ├── ASSET_INVENTORY.md
    └── TECHNICAL_ARCHITECTURE.md
```

Each document must contain actual findings, screenshots or screenshot references where possible, and notes about uncertainty. Do not fill the documents with invented measurements.

## 2.4 Screenshot inventory

Capture the reference at these viewport widths:

- 1920 px
- 1440 px
- 1024 px
- 768 px
- 390 px
- 360 px

For every important route, capture:

- Initial viewport.
- Full-page screenshot.
- Navigation open state.
- Search open state.
- Important interactive states.
- Mobile menu state.
- Form validation and error states, where available.

Use screenshots as visual acceptance references during implementation.

---

# 3. Technology Stack

Use a modern TypeScript stack. Prefer stable releases and verify compatibility before installing dependencies. Do not install libraries simply because they are listed here; use them when they solve a real project requirement.

## 3.1 Frontend

| Area | Recommended technology | Purpose |
|---|---|---|
| Framework | Next.js (App Router) | Routing, rendering, server components, metadata |
| UI library | React | Component architecture |
| Language | TypeScript | Type safety |
| Styling | Tailwind CSS + CSS variables | Utility styling and design tokens |
| Animation | Framer Motion | Controlled interface animation |
| Icons | Lucide React | Consistent icon system |
| Forms | React Hook Form | Form state and validation integration |
| Validation | Zod | Shared runtime schemas |
| Server-state fetching | TanStack Query, where needed | Client-side data synchronization |
| Client state | Zustand, only where needed | Small global client state |

Prefer server components for static and data-driven content. Use client components only where interactivity requires them.

## 3.2 Backend

| Area | Recommended technology | Purpose |
|---|---|---|
| API | Next.js Route Handlers | Application API |
| Database | PostgreSQL | Relational data |
| ORM | Prisma | Typed database access |
| Authentication | Auth.js or Supabase Auth | User authentication |
| Cache / rate limits | Redis | Caching and abuse protection |
| File storage | S3-compatible object storage | Secure media and document storage |
| Email | A reputable transactional email provider | Notifications |
| Search | PostgreSQL full-text search initially | Searchable content and doctors |

For larger search workloads, evaluate Meilisearch, OpenSearch, or Elasticsearch. Do not introduce a separate search service before the scale or feature requirements justify it.

## 3.3 Infrastructure and operations

- Hosting: Vercel or a comparable production hosting platform.
- CDN and edge security: Cloudflare or equivalent.
- Source control: GitHub.
- CI/CD: GitHub Actions.
- Error monitoring: Sentry or equivalent.
- Observability: OpenTelemetry where useful.
- Database backups: automated, encrypted, and regularly restore-tested.
- Secrets: deployment-platform secret manager; never commit secrets.
- Environments: local, preview/staging, and production.

---

# 4. Project Structure

Use a feature-oriented structure. Adjust it only when there is a clear architectural reason.

```text
healthcare-platform/
├── public/
│   ├── images/
│   ├── icons/
│   ├── fonts/
│   └── media/
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── docs/
│   ├── reference-audit/
│   ├── architecture/
│   ├── operations/
│   └── content/
├── tests/
│   ├── e2e/
│   ├── integration/
│   └── fixtures/
├── src/
│   ├── app/
│   │   ├── (website)/
│   │   │   ├── page.tsx
│   │   │   ├── appointments/
│   │   │   ├── doctors/
│   │   │   ├── locations/
│   │   │   ├── specialties/
│   │   │   ├── diseases-conditions/
│   │   │   ├── tests-procedures/
│   │   │   ├── international/
│   │   │   ├── research/
│   │   │   ├── education/
│   │   │   └── about/
│   │   ├── (auth)/
│   │   ├── admin/
│   │   ├── api/
│   │   ├── layout.tsx
│   │   ├── error.tsx
│   │   ├── not-found.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── layout/
│   │   ├── navigation/
│   │   ├── search/
│   │   ├── cards/
│   │   ├── forms/
│   │   ├── feedback/
│   │   ├── media/
│   │   └── ui/
│   ├── features/
│   │   ├── appointments/
│   │   ├── physicians/
│   │   ├── locations/
│   │   ├── specialties/
│   │   ├── content-search/
│   │   ├── authentication/
│   │   └── administration/
│   ├── hooks/
│   ├── lib/
│   │   ├── auth/
│   │   ├── db/
│   │   ├── security/
│   │   ├── validation/
│   │   ├── email/
│   │   └── utilities/
│   ├── data/
│   ├── config/
│   └── types/
├── .env.example
├── .gitignore
├── next.config.ts
├── package.json
├── tsconfig.json
└── README.md
```

---

# 5. Design System

The design system must be measured from the reference website. The values below are structural examples and placeholders, not verified Mayo Clinic design tokens.

## 5.1 Design token requirements

Record exact measured values for:

- Brand and accent colors.
- Primary, secondary, and muted text colors.
- Page and section backgrounds.
- Border colors.
- Font families and fallback stacks.
- Font sizes and weights.
- Line heights and letter spacing.
- Spacing scale.
- Content max-widths.
- Header and navigation heights.
- Card radii and shadows.
- Breakpoints.
- Focus-ring style.
- Motion duration and easing.

## 5.2 Example CSS token foundation

Replace placeholder values after the reference audit.

```css
:root {
  /* Placeholder values: measure and replace. */
  --color-brand: #174f78;
  --color-brand-dark: #103b5b;
  --color-accent: #2b789e;
  --color-text: #202a32;
  --color-muted: #5f6b73;
  --color-surface: #ffffff;
  --color-surface-muted: #f3f6f8;
  --color-border: #d7e0e5;
  --color-focus: #f0b429;

  --font-sans: Arial, Helvetica, sans-serif;

  --text-xs: 0.75rem;
  --text-sm: 0.875rem;
  --text-base: 1rem;
  --text-lg: 1.125rem;
  --text-xl: 1.25rem;
  --text-2xl: 1.5rem;
  --text-3xl: 1.875rem;
  --text-4xl: 2.25rem;

  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  --space-10: 2.5rem;
  --space-12: 3rem;
  --space-16: 4rem;

  --content-max: 76rem;
  --page-gutter: clamp(1rem, 3vw, 3rem);

  --radius-sm: 0.25rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;

  --shadow-card: 0 2px 12px rgb(0 0 0 / 8%);
}
```

## 5.3 Typography

- Identify the actual font families used by the reference where publicly observable.
- Record font weights and which weights are actually loaded.
- Use licensed fonts or suitable alternatives.
- Avoid synthetic bolding when a real font weight is available.
- Match heading scale, paragraph measure, line-height, and responsive typography.
- Ensure body text remains readable on mobile.

Example font-face declaration (replace file names and weights with the actual licensed font files):

```css
@font-face {
  font-family: "Project Sans";
  src: url("/fonts/project-sans-regular.woff2") format("woff2");
  font-style: normal;
  font-weight: 400;
  font-display: swap;
}

@font-face {
  font-family: "Project Sans";
  src: url("/fonts/project-sans-semibold.woff2") format("woff2");
  font-style: normal;
  font-weight: 600;
  font-display: swap;
}
```

## 5.4 Layout and responsive behavior

- Use a consistent centered content container.
- Match the reference’s full-bleed and contained sections intentionally.
- Avoid arbitrary fixed widths that break at intermediate screen sizes.
- Use CSS Grid and Flexbox according to the observed layout.
- Ensure menus, tables, cards, and forms work at narrow widths.
- Do not simply shrink desktop layouts; inspect and reproduce mobile-specific behavior.

Example breakpoints (adjust after inspection):

```css
:root {
  --breakpoint-sm: 40rem;
  --breakpoint-md: 48rem;
  --breakpoint-lg: 64rem;
  --breakpoint-xl: 80rem;
}
```

---

# 6. Global Components

Build reusable components before implementing all page templates.

## 6.1 Site shell

Required components:

- `SiteHeader`
- `UtilityNavigation`
- `PrimaryNavigation`
- `MegaMenu`
- `MobileNavigation`
- `GlobalSearch`
- `Breadcrumbs`
- `SiteFooter`
- `CookieConsent`, if required
- `SkipToContent`
- `BackToTop`, if supported by the reference and useful

The header must reproduce the reference’s dimensions, alignment, hierarchy, responsive behavior, and sticky behavior.

## 6.2 Content components

- `PageHero`
- `SectionHeading`
- `ContentCard`
- `FeatureCard`
- `LinkCard`
- `PhysicianCard`
- `LocationCard`
- `SpecialtyCard`
- `ArticleCard`
- `CallToAction`
- `QuoteBlock`
- `ImageWithCaption`
- `VideoEmbed`
- `StatisticsPanel`
- `RelatedLinks`

## 6.3 Interaction components

- `Accordion`
- `Tabs`
- `Modal`
- `Drawer`
- `Pagination`
- `FilterPanel`
- `SortControl`
- `SearchResults`
- `Toast`
- `Alert`
- `LoadingSkeleton`
- `EmptyState`
- `ErrorState`

All interactive components must support keyboard operation, visible focus, correct ARIA semantics, and mobile touch targets.

## 6.4 Global search example

This is a minimal client-side example. Production search must call a server endpoint, validate input, handle errors, and return real results.

```tsx
"use client";

import { useState } from "react";

type SearchResult = {
  id: string;
  title: string;
  href: string;
  category: string;
};

export function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalized = query.trim();
    if (!normalized) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(normalized)}`,
        { headers: { Accept: "application/json" } }
      );

      if (!response.ok) {
        throw new Error("Search is temporarily unavailable.");
      }

      const data = (await response.json()) as {
        results: SearchResult[];
      };

      setResults(data.results);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section aria-label="Site search">
      <form onSubmit={handleSubmit}>
        <label htmlFor="site-search">Search</label>
        <input
          id="site-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search doctors, conditions, services..."
        />
        <button type="submit" disabled={loading || !query.trim()}>
          {loading ? "Searching…" : "Search"}
        </button>
      </form>

      {error && <p role="alert">{error}</p>}

      <ul aria-live="polite">
        {results.map((result) => (
          <li key={result.id}>
            <a href={result.href}>{result.title}</a>
            <span>{result.category}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
```

---

# 7. Page Templates and Route Coverage

Build templates that can be reused with different content. Do not create every page as an unrelated one-off implementation.

## 7.1 Homepage

The homepage should include the reference’s major visual and functional sections, based on the audit:

- Header and navigation.
- Hero section.
- Primary calls to action.
- Search entry point.
- Featured care or service content.
- Doctor or specialty discovery.
- Location discovery.
- Featured health information.
- Institutional trust and credibility content.
- News, research, or education content where relevant.
- Footer and utility links.

Do not assume the exact order or content. Reproduce what is observed in the reference audit.

## 7.2 Appointments

Include:

- Appointment information.
- New-patient and returning-patient paths, if applicable.
- Appointment request form.
- Contact and next-step information.
- Validation, confirmation, and error states.
- Clear explanation of whether the request is received or actually scheduled.

## 7.3 Find a doctor

Include:

- Search by name, specialty, location, or other audited criteria.
- Filters and sorting.
- Physician result cards.
- Pagination or progressive loading.
- Empty and error states.
- Individual physician profiles.

## 7.4 Physician profile

Include fields only when the data is available and approved:

- Name and professional title.
- Profile image.
- Specialty and subspecialty.
- Locations.
- Biography.
- Education and training.
- Clinical interests.
- Languages.
- Appointment/contact action.
- Relevant credentials.

Do not fabricate physician credentials or clinical claims.

## 7.5 Locations

Include:

- Search and filtering.
- Location cards.
- Address and contact details.
- Services and departments.
- Map integration if a reliable map provider is configured.
- Directions link.
- Accessibility information where available.

## 7.6 Specialties and departments

Include:

- Specialty landing pages.
- Department details.
- Related physicians.
- Related locations.
- Related conditions and procedures.
- Contact or appointment calls to action.

## 7.7 Diseases and conditions

Include:

- Searchable index.
- Alphabetical or category navigation if observed.
- Condition detail pages.
- Symptoms, causes, risk factors, diagnosis, treatment, and prevention sections only when reviewed by qualified professionals.
- Sources and review dates.
- Related specialties and services.

Medical information must be reviewed by qualified professionals before publication. Do not publish generated medical advice as authoritative clinical guidance.

## 7.8 Tests and procedures

Include:

- Search and index.
- Detail pages.
- Preparation and recovery information, where approved.
- Related conditions and specialties.
- Clear medical disclaimers and review information.

## 7.9 International patients

Include:

- International patient information.
- Inquiry workflow.
- Language and contact information.
- Travel and care coordination details, only when verified.
- Privacy and consent notices.

## 7.10 Research, education, professionals, and institutional pages

Build route templates for the sections discovered during the route audit, including relevant pages for:

- Research.
- Medical education.
- Healthcare professionals.
- About the organization.
- News and publications.
- Careers.
- Giving and donations.
- Contact.
- Legal, privacy, and accessibility information.

---

# 8. Backend and Data Architecture

Use PostgreSQL with Prisma unless the project has a documented reason to choose another database.

## 8.1 Core data entities

At minimum, plan for:

- User
- Role / permission
- Physician
- Specialty
- PhysicianSpecialty
- Location
- PhysicianLocation
- AppointmentRequest
- ContentPage
- ContentCategory
- MediaAsset
- AuditLog
- ConsentRecord
- Notification

The final schema must be based on the actual feature scope. The following is a representative starting point, not a complete healthcare production schema.

## 8.2 Representative Prisma schema

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum UserRole {
  PATIENT
  STAFF
  EDITOR
  ADMIN
}

enum AppointmentStatus {
  RECEIVED
  UNDER_REVIEW
  CONTACTED
  SCHEDULED
  CANCELLED
  CLOSED
}

model User {
  id           String   @id @default(cuid())
  email        String   @unique
  name         String?
  passwordHash String?
  role         UserRole @default(PATIENT)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  appointmentRequests AppointmentRequest[]
}

model Physician {
  id          String   @id @default(cuid())
  slug        String   @unique
  name        String
  title       String?
  biography   String?
  imageUrl    String?
  isPublished Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  specialties PhysicianSpecialty[]
  locations   PhysicianLocation[]
}

model Specialty {
  id          String   @id @default(cuid())
  slug        String   @unique
  name        String
  description String?
  physicians  PhysicianSpecialty[]
}

model PhysicianSpecialty {
  physicianId String
  specialtyId String

  physician Physician @relation(fields: [physicianId], references: [id])
  specialty Specialty @relation(fields: [specialtyId], references: [id])

  @@id([physicianId, specialtyId])
}

model Location {
  id          String   @id @default(cuid())
  slug        String   @unique
  name        String
  address     String
  city        String?
  region      String?
  country     String?
  phone       String?
  isPublished Boolean  @default(false)

  physicians PhysicianLocation[]
}

model PhysicianLocation {
  physicianId String
  locationId  String

  physician Physician @relation(fields: [physicianId], references: [id])
  location  Location  @relation(fields: [locationId], references: [id])

  @@id([physicianId, locationId])
}

model AppointmentRequest {
  id          String            @id @default(cuid())
  userId      String?
  fullName    String
  email       String
  phone       String?
  message     String?
  status      AppointmentStatus @default(RECEIVED)
  createdAt   DateTime          @default(now())
  updatedAt   DateTime          @updatedAt

  user User? @relation(fields: [userId], references: [id])
}

model ContentPage {
  id              String   @id @default(cuid())
  slug            String   @unique
  title           String
  description     String?
  body             Json
  isPublished     Boolean  @default(false)
  publishedAt     DateTime?
  updatedAt       DateTime @updatedAt
}
```

Before production, add and review the necessary models and fields for:

- Appointment scheduling and availability.
- Patient identity and consent, if those features are legally and operationally approved.
- Content revisions and editorial workflow.
- Media metadata and access permissions.
- Taxonomy and related-content relationships.
- Notifications and delivery status.
- Audit history.
- Data retention and deletion workflows.
- Staff permissions and administrative actions.

Do not store sensitive medical information in a generic text field.

---

# 9. API Design

Use versioned, validated, documented endpoints. Keep authorization and business rules on the server.

Representative route plan:

```text
GET    /api/search
GET    /api/physicians
GET    /api/physicians/[slug]
GET    /api/specialties
GET    /api/locations
GET    /api/locations/[slug]
POST   /api/appointment-requests
GET    /api/account
POST   /api/auth/[...nextauth]
GET    /api/admin/content
POST   /api/admin/content
PATCH  /api/admin/content/[id]
DELETE /api/admin/content/[id]
```

## 9.1 API requirements

Every endpoint must have:

- Input validation with Zod or an equivalent schema.
- Authentication where required.
- Authorization and role checks.
- Consistent response shapes.
- Safe error messages.
- Rate limiting where abuse is possible.
- Logging that avoids sensitive data.
- Tests for expected and failure cases.

## 9.2 Appointment request example

A request submission is not the same as a confirmed appointment.

The workflow must:

1. Validate the submitted information.
2. Check consent and required fields.
3. Apply rate limiting and abuse prevention.
4. Store the request securely.
5. Return a clear received/pending status.
6. Notify the authorized operations team.
7. Allow authorized staff to review and update the request.
8. Send the user an appropriate status notification.
9. Only describe the appointment as scheduled after an actual scheduling confirmation.

Do not imply that a form submission reserves a real appointment unless the system is connected to a verified scheduling system and receives confirmation.

---

# 10. Authentication and Administration

## 10.1 Authentication

Implement:

- Secure sign-in and sign-out.
- Password hashing using a reputable algorithm if passwords are managed locally.
- Secure, HTTP-only cookies.
- Session expiration and rotation.
- Password reset flow.
- Email verification where appropriate.
- Rate limiting and suspicious-login protection.
- Optional multi-factor authentication for privileged accounts.

Do not create a custom cryptographic authentication system.

## 10.2 Role-based access control

Define permissions explicitly. Example roles:

- Public visitor.
- Patient/account holder.
- Content editor.
- Operations staff.
- Administrator.

Do not rely on hiding admin links in the frontend. Enforce permissions in server-side actions and API handlers.

## 10.3 Admin dashboard

If content must be managed after launch, build an admin interface for:

- Physicians.
- Specialties.
- Locations.
- Content pages.
- Media assets.
- Appointment requests.
- User and role management.
- Audit logs.
- Publishing and revision workflow.

Use draft, review, and publish states for medically relevant content.

---

# 11. Performance Requirements

The application must be measured on representative devices and network conditions.

## 11.1 Target metrics

Aim for:

| Metric | Target |
|---|---:|
| Lighthouse Performance | 90+ |
| Lighthouse Accessibility | 95+ |
| Lighthouse Best Practices | 95+ |
| Lighthouse SEO | 95+ |
| LCP | Under 2.5 seconds |
| INP | Under 200 ms |
| CLS | Under 0.1 |

These are targets, not guarantees. Report actual measurements and test conditions.

## 11.2 Image optimization

- Use Next.js Image or an equivalent optimized image pipeline.
- Serve appropriately sized responsive images.
- Prefer modern formats such as AVIF or WebP where supported.
- Set dimensions or aspect ratios to prevent layout shifts.
- Lazy-load below-the-fold images.
- Do not lazy-load the primary above-the-fold LCP image.
- Compress images without visibly damaging them.
- Use licensed or original assets.

## 11.3 JavaScript optimization

- Prefer server components.
- Split large interactive features.
- Dynamically load expensive components when appropriate.
- Avoid duplicate dependencies.
- Avoid large animation libraries for simple transitions.
- Keep third-party scripts to a minimum.
- Measure bundle size and main-thread work.

## 11.4 Caching

- Cache public content with appropriate revalidation.
- Use CDN caching for static assets.
- Invalidate content caches after publishing.
- Never publicly cache private account, patient, or appointment information.
- Define cache-control behavior deliberately for every sensitive endpoint.

---

# 12. Security, Privacy, and Healthcare Data

Security and privacy are release blockers, not optional enhancements.

## 12.1 Baseline controls

- HTTPS everywhere.
- Secure headers and a considered Content Security Policy.
- Secure, HTTP-only, same-site cookies.
- CSRF protection where applicable.
- Server-side validation.
- Parameterized database access through the ORM.
- Output encoding and XSS prevention.
- Rate limiting and abuse prevention.
- Least-privilege access.
- Audit logs for privileged operations.
- Secure file upload validation.
- Dependency and vulnerability scanning.
- Encrypted backups.
- Tested disaster recovery.
- Secret rotation and secure secret storage.

## 12.2 Patient information

- Use synthetic data in development and testing.
- Do not upload real patient records to Antigravity, source control, test fixtures, or third-party AI services.
- Collect only the information required for the stated workflow.
- Define retention, deletion, consent, access, and breach-response procedures.
- Restrict access to sensitive data.
- Log access and administrative changes without unnecessarily logging sensitive content.

## 12.3 Compliance

Do not claim HIPAA compliance or any other regulatory compliance merely because the application uses security features.

Before collecting or processing real patient information, obtain qualified legal, security, and compliance review for the jurisdictions in which the service will operate. For a Bangladesh-first launch, assess applicable Bangladesh privacy, cybersecurity, health-sector, consumer-protection, and data-handling requirements. International expansion requires a separate jurisdictional assessment.

---

# 13. SEO and Medical Content Governance

## 13.1 Technical SEO

Implement:

- Unique page titles and meta descriptions.
- Canonical URLs.
- XML sitemap.
- Robots configuration.
- Open Graph metadata.
- Structured data only where accurate and supported.
- Clean, stable URLs.
- Internal linking.
- Correct heading hierarchy.
- Redirect management.
- Useful 404 and error pages.

## 13.2 Medical content quality

Medical content must:

- Have a named qualified reviewer where appropriate.
- Include review or update dates.
- Cite reliable medical sources.
- Avoid unsupported promises and claims.
- Distinguish general education from personalized medical advice.
- Include emergency guidance where clinically and legally appropriate.
- Have an editorial process for corrections and outdated information.

Do not generate hundreds of thin medical pages simply to target search traffic.

---

# 14. Accessibility

Target WCAG 2.2 AA.

Required checks:

- Semantic HTML.
- Keyboard-accessible navigation.
- Visible focus states.
- Correct labels and descriptions for form controls.
- Accessible validation and error announcements.
- Sufficient color contrast.
- Useful alt text.
- Decorative images with empty alt text.
- Correct heading hierarchy.
- Dialog focus management.
- No keyboard traps.
- Reduced-motion support.
- Screen-reader testing.
- Touch targets appropriate for mobile.

Example reduced-motion rule:

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    scroll-behavior: auto !important;
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

# 15. Motion and Interaction Design

Use motion to clarify state changes and hierarchy, not as decoration.

Possible uses:

- Mega-menu opening and closing.
- Search panel transitions.
- Accordion expansion.
- Modal and drawer transitions.
- Subtle card hover feedback.
- Loading indicators.
- Scroll-to-section behavior.

Example Framer Motion component:

```tsx
"use client";

import { motion, useReducedMotion } from "framer-motion";

export function RevealSection({
  children,
}: {
  children: React.ReactNode;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.section
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: reduceMotion ? 0 : 0.35 }}
    >
      {children}
    </motion.section>
  );
}
```

Do not animate every element. Avoid scroll-jacking, excessive parallax, and motion that delays access to content.

---

# 16. Testing and Quality Assurance

## 16.1 Testing stack

- Unit tests: Vitest.
- Component tests: React Testing Library.
- End-to-end tests: Playwright.
- Accessibility checks: axe-core or equivalent.
- Performance: Lighthouse and field monitoring.
- Visual regression: Playwright screenshots or a dedicated visual testing tool.

## 16.2 Required test coverage

Test:

- Navigation and mobile menu.
- Global search.
- Doctor search and filters.
- Location search.
- Appointment request submission.
- Validation and error states.
- Authentication and authorization.
- Admin publishing workflow.
- Keyboard navigation.
- Responsive layouts.
- Broken links and missing images.
- Loading, empty, and error states.

## 16.3 Representative Playwright test

```ts
import { test, expect } from "@playwright/test";

test("homepage renders the main navigation and hero", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");

  await expect(page.locator("header")).toBeVisible();
  await expect(page.getByRole("main")).toBeVisible();

  // Replace this with the actual accessible name established by the design.
  await expect(
    page.getByRole("navigation", { name: /main/i })
  ).toBeVisible();
});
```

## 16.4 Visual comparison

Compare the implementation against the reference at:

- 1920 × 1080
- 1440 × 900
- 1024 × 768
- 768 × 1024
- 390 × 844
- 360 × 800

For every comparison, inspect:

- Header and navigation geometry.
- Hero proportions and image crop.
- Typography and line wrapping.
- Content widths and alignment.
- Section spacing.
- Card dimensions.
- Footer structure.
- Mobile overflow and menu behavior.

Fix the largest visual differences first. Do not spend time polishing tiny icon offsets while major layout proportions remain wrong.

---

# 17. Implementation Phases

Work in controlled phases. At the end of each phase, run checks and report what is complete, incomplete, and blocked.

## Phase 1 — Reconnaissance

- Inspect reference routes and page states.
- Capture screenshots at all required widths.
- Record typography, colors, spacing, assets, and interactions.
- Create all reference-audit documents.
- Produce a route and component inventory.

**Exit criteria:** The team can explain the page structure and reproduce the major layouts from measured references.

## Phase 2 — Foundation

- Initialize Next.js and TypeScript.
- Configure linting, formatting, and type checking.
- Configure Tailwind and global CSS.
- Set up environment variables.
- Configure database and Prisma.
- Establish CI checks.

**Exit criteria:** The application builds, runs, and passes lint and type checks.

## Phase 3 — Design system and global shell

- Implement measured design tokens.
- Implement typography.
- Build header, navigation, search, breadcrumbs, footer, and shared layout.
- Validate desktop and mobile behavior.

**Exit criteria:** The global shell is visually close to the reference and works at all target widths.

## Phase 4 — Homepage

- Implement homepage sections in audited order.
- Use optimized, approved assets.
- Implement working links and calls to action.
- Compare screenshots and correct visual differences.

**Exit criteria:** Homepage passes visual, responsive, accessibility, and functional review.

## Phase 5 — Internal page templates

Implement and test:

- Appointments.
- Doctor search and profiles.
- Locations.
- Specialties and departments.
- Diseases and conditions.
- Tests and procedures.
- International patient pages.
- Research, education, professional, and institutional pages.

**Exit criteria:** All approved routes have complete layouts, navigation, and appropriate content states.

## Phase 6 — Backend

- Finalize data model.
- Add migrations.
- Implement API routes.
- Add search.
- Add server-side validation.
- Add error handling and logging.
- Add automated tests.

**Exit criteria:** Frontend features use real persisted data where required; no critical feature relies on fake hardcoded success.

## Phase 7 — Authentication and administration

- Implement authentication.
- Implement role-based authorization.
- Build admin workflows.
- Add audit logs.
- Add content publishing and review states.

**Exit criteria:** Unauthorized users cannot access privileged operations; authorized users can manage approved content.

## Phase 8 — Appointment workflow

- Implement request submission.
- Implement staff review.
- Implement notifications.
- Implement status tracking.
- Integrate a real scheduling system only if one is available and approved.

**Exit criteria:** The user receives accurate status information and the system does not misrepresent a request as a confirmed appointment.

## Phase 9 — Performance, accessibility, and security

- Run Lighthouse.
- Run accessibility tests.
- Review caching.
- Review image and font loading.
- Review authentication and authorization.
- Run dependency and security scans.
- Test backup restoration.

**Exit criteria:** Targets are met or exceptions are documented with remediation plans.

## Phase 10 — Production deployment

- Configure production environment variables.
- Configure domain, HTTPS, CDN, and monitoring.
- Configure database backups.
- Run smoke tests.
- Verify analytics and error reporting.
- Complete privacy, legal, content, and security approvals.
- Prepare rollback and incident procedures.

**Exit criteria:** Deployment is stable, monitored, documented, and approved for the intended data and user workflows.

---

# 18. Environment Variables

Create `.env.example` and never commit real credentials.

```env
# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

# Database
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE"

# Authentication
AUTH_SECRET=
AUTH_URL=http://localhost:3000

# Redis (optional until required)
REDIS_URL=

# Object storage (if configured)
S3_ENDPOINT=
S3_REGION=
S3_BUCKET=
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=

# Email provider
EMAIL_FROM=
EMAIL_API_KEY=

# Monitoring
SENTRY_DSN=
```

Document which variables are required for local development, staging, and production. Validate required configuration at startup.

---

# 19. Production Acceptance Checklist

## Visual quality

- [ ] All priority routes have been audited.
- [ ] Design tokens are based on measured reference values.
- [ ] Desktop layouts match the reference closely.
- [ ] Tablet layouts are correct.
- [ ] Mobile layouts are intentionally designed.
- [ ] Typography, image crop, spacing, and alignment have been checked.
- [ ] No missing or broken assets.

## Functionality

- [ ] All navigation links work.
- [ ] Mega menu and mobile navigation work.
- [ ] Search returns real results.
- [ ] Filters and pagination work.
- [ ] Forms validate and submit.
- [ ] Appointment status is represented accurately.
- [ ] Authentication works.
- [ ] Authorization is enforced server-side.
- [ ] Admin operations work and are audited.
- [ ] Loading, empty, and error states are implemented.

## Performance

- [ ] LCP target is met on representative pages.
- [ ] INP target is met.
- [ ] CLS target is met.
- [ ] Images are optimized.
- [ ] Fonts are optimized.
- [ ] JavaScript bundles are reviewed.
- [ ] Caching rules are documented and tested.

## Accessibility

- [ ] Keyboard navigation works.
- [ ] Focus states are visible.
- [ ] Forms are labelled.
- [ ] Errors are announced accessibly.
- [ ] Contrast is sufficient.
- [ ] Reduced motion is supported.
- [ ] Screen-reader checks are complete.

## Security and operations

- [ ] HTTPS is enabled.
- [ ] Secrets are not committed.
- [ ] Server-side validation is in place.
- [ ] Rate limiting is configured.
- [ ] Sensitive data is protected.
- [ ] Audit logs are available.
- [ ] Backups are configured and restore-tested.
- [ ] Monitoring and alerting are configured.
- [ ] Privacy and compliance review is complete for the intended launch.

## Content governance

- [ ] Medical content has qualified review.
- [ ] Sources and review dates are recorded.
- [ ] No fabricated credentials or clinical claims.
- [ ] Legal and privacy pages are approved.
- [ ] All images and fonts have usage rights.

---

# 20. Antigravity Master Execution Instructions

Use this document as the source of truth for the project.

## 20.1 Before coding

1. Read this entire specification.
2. Inspect the live reference website and its important routes.
3. Create the reconnaissance documents.
4. Capture screenshots at the required viewport sizes.
5. Build a route inventory and component inventory.
6. Identify unknowns and ask only questions that materially block implementation.
7. Do not invent measurements or claim that an inspection has been completed when it has not.

## 20.2 During implementation

- Prioritize visual fidelity and functional correctness together.
- Build reusable components instead of duplicating page markup.
- Use semantic HTML and accessible interaction patterns.
- Use TypeScript strictly; avoid `any` unless justified and documented.
- Keep business logic out of presentation components.
- Validate all untrusted input on the server.
- Use real data sources for production functionality.
- Do not add placeholder buttons that appear functional.
- Do not hardcode fake search results or fake appointment confirmations.
- Do not expose secrets or sensitive data to the browser.
- Do not add dependencies without a clear need.
- Keep the application responsive throughout development.
- Maintain clear documentation and meaningful commit-sized changes.

## 20.3 Visual fidelity workflow

For each route:

1. Open the reference at the target viewport.
2. Capture the relevant screenshot.
3. Open the local implementation at the same viewport.
4. Compare the two.
5. Identify the five largest visual mismatches.
6. Fix those mismatches.
7. Repeat until the major structure, proportions, typography, spacing, and imagery are close.
8. Test responsive behavior and interaction states.
9. Record remaining differences in the audit document.

Do not call a page complete because it merely contains similar text and colors. Layout and hierarchy matter.

## 20.4 Production readiness workflow

For every feature, distinguish between:

- Implemented.
- Tested locally.
- Tested in staging.
- Security-reviewed.
- Content-approved.
- Production-configured.
- Production-verified.

Never mark a feature production-ready based only on generated code or a successful local build.

## 20.5 Reporting

After each phase, report:

- Files created or modified.
- Features implemented.
- Tests run and results.
- Visual comparison results.
- Known defects.
- Security or privacy concerns.
- Missing credentials or external integrations.
- Next phase and blockers.

Do not silently skip incomplete requirements.

---

# 21. Required Final Deliverables

The project is not complete until it includes:

1. Full source code.
2. Responsive implementation of all approved routes.
3. Reusable component library.
4. Design tokens and typography system.
5. Database schema and migrations.
6. API documentation.
7. Authentication and authorization implementation, if in scope.
8. Admin and content-management workflows, if in scope.
9. Search and appointment workflows, if in scope.
10. Automated tests.
11. Reference audit and visual comparison documents.
12. `.env.example`.
13. Setup and deployment README.
14. Backup and recovery instructions.
15. Security and privacy review notes.
16. Production acceptance report.

---

# 22. Final Directive

Build this as a serious, maintainable healthcare web platform—not a static visual mockup.

The reference website is the benchmark for visual structure and interaction quality. Measure before implementing. Reproduce the important page layouts and states with high fidelity. Improve accessibility, usability, and performance without casually changing the visual identity being studied.

Use original project branding and content, and only assets that the project is authorized to use. Do not attempt to obtain private Mayo Clinic source code, backend systems, databases, or restricted assets. Publicly inspectable frontend behavior is a reference, not a license.

Deliver working features, tests, documentation, and deployment configuration. Be explicit about anything that remains incomplete or requires external approval.
