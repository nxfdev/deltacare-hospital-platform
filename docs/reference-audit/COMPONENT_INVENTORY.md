# DeltaCare — Component Inventory

**Source Authority:** `inspo.html` (AEM `.cmp-*` component architecture) and `inspo_instruction.md` Section 6.

---

## 1. Global Shell & Navigation Components (`src/components/layout/` & `src/components/navigation/`)

| Component | Reference Class in `inspo.html` | Measured Behavior & Specification |
|---|---|---|
| `SkipToContent` | `.cmp-skip-to-main__link-global` | Visually hidden until focused; jumps to `#main-content` with `2px dashed #0057b8` focus ring |
| `SiteHeader` | `#header__container`, `.cmp-nav-container` | Sticky/fixed-capable top header (`min-height: 85px`), max-width `1296px` (`--mc-max-site-width`), white surface (`#ffffff`), subtle bottom border (`#d6d6d6`) |
| `BrandLogo` | `.cmp-image` (Header logo) | Custom DeltaCare emblem + wordmark SVG (`Care at DeltaCare` tagline integration) |
| `MegaMenu` | `.cmp-tabs--navigation`, `.cmp-tab__content` | 5 primary navigation categories (`Care at DeltaCare`, `Health Library`, `Departments & Doctors`, `Patient Services`, `About & Contact`). Full-viewport-width dropdown (`top: 85px`, `background: #ffffff`, `z-index: 50`) with chevron-right link rows + right-hand `.cmp-teaser` image card (`415x275` aspect ratio with dark gradient overlay) |
| `HeaderRightActions` | `#header__content-right` | `Request Appointment` navigation link with chevron, `Register / Log in` with user icon (`24px`), `Language Switcher` (`EN | বাংলা`), Search drawer toggle button (`24px` search icon), and responsive mobile Hamburger button |
| `HeaderSearchDrawer` | `.cmp-search-container` | Expandable full-width search bar (`flex-basis: 856px`) with live typeahead suggestions (3+ characters), keyboard arrow navigation, clear button, and close button |
| `SiteFooter` | `.cmp-container--background-color-footer`, `#cmp-footer` | Deep navy (`#012d61`) multi-column footer with 3 top rectangular icon action buttons (`Find a doctor`, `Explore careers`, `Contact & callback`), 3 navigation columns (`About DeltaCare`, `Patient Services & Departments`, `International & Financial Assistance`), social circle buttons (`48px`), app/portal badges, legal links bar, and language selector dropdown |

---

## 2. Homepage & Content Components (`src/components/homepage/` & `src/components/cards/`)

| Component | Reference Class in `inspo.html` | Measured Behavior & Specification |
|---|---|---|
| `HeroBanner` | `.cmp-hero-card`, `.cmp-media__hero-full-bleed` | Full-bleed edge-to-edge hero container with dark bottom gradient overlay (`rgba(8,8,8,0.55)`), display-xlarge light headline (`76px` desktop / `48px` mobile, `mayo-display` serif equivalent, weight `300`, line-height `1.0526`), and dual CTAs: primary text-link with chevron (`Explore Patient-Centered Care`) + pill outline/solid button (`Request Appointment`) |
| `AppointmentRequestSection` | Custom + `.cmp-text-card--border--blueDash` | Prominent homepage & standalone appointment request module allowing visitors to select Department, Doctor, Branch, Preferred Date/Time, and Contact Info; persists to PostgreSQL and returns a unique `DC-YYYY-XXXX` reference code with explicit `REQUESTED (Pending Staff Confirmation)` badge |
| `AlphabetConditionSearch` | `.cmp-container--background-color-primary`, `.cmp-alphabet-facet`, `.cmp-search` | Full-width brand-blue (`#0057b8`) section (`padding-top/bottom: 48px`) with 2-column layout: Left column has `Find diseases & conditions by first letter` with `48px × 48px` circular letter buttons (`A–Z`, `#`, `rgba(255,255,255,0.1)` fill, `1px solid rgba(255,255,255,0.5)` border, white bold text, inverting to white bg + `#0057b8` text on hover/active); Right column has `Search diseases, treatments, doctors & services` pill input with instant autocomplete |
| `LocationsSection` | `.cmp-column-control__layoutType--ThreeColumn`, `.cmp-image-video-card` | 3-column grid (`max-width: 1320px`). First cell is a centered `.cmp-text-card` (`Locations`, description, `Explore all locations` pill button). Remaining cells are `.cmp-image-video-card` cards (`border-radius: 8px`, aspect ratio `4:3`, dark gradient overlay, bottom-left inverse serif title `24px` with chevron-right and subtitle) |
| `FeaturedCareAreasSection` | `.cmp-column-control__layoutType--MosaicSmall`, `.cmp-link-list__two-column` | Mosaic 12-column layout: Left 4 columns contain `.cmp-text-card--top` (`Featured care areas` heading + description); Right 8 columns contain a 2-column `.cmp-link-list` where each care area link has a bottom border, `#0057b8` bold label, hover underline, and right chevron |
| `StorySplitSection` | `.cmp-story-card`, `.cmp-story-card__tall` | 2-column asymmetric split feature rows (`Healing starts here` with left text + right `600×800` portrait image `border-radius: 8px`; `World-class care for patients across Bangladesh & beyond` with left `600×800` image + right text card and secondary pill CTA) |
| `InstitutionalBanner` | `.cmp-container--background-color-donations` | Deep indigo (`#0d0d33`) full-bleed banner with emblem SVG (`giving-charity.svg`), `40px` inverse serif headline, supporting copy, and primary blue pill CTA (`#0057b8`) |
| `DoctorCard` |Physician directory card | Displays verified photo, name (EN/BN), designation, qualifications, department badge, branch room, next available day, published consultation fee with effective date, and `Request Appointment` / `View Profile` actions |
| `FreshnessBadge` | Governance indicator (`FR-WEB-06`) | Displays `Last verified: [Date]` and `Effective from: [Date]` on schedules, fees, and medical articles |

---

## 3. Interactive & Assistant Components (`src/components/ui/` & `src/features/assistant/`)

| Component | Purpose |
|---|---|
| `DeltaCareAssistantWidget` | Floating & full-panel bilingual AI Patient Assistant (`DeltaCare Assistant`). Clearly discloses automated status (`FR-AI-10`), provides quick-prompt chips in English & Bangla, displays source citations from approved hospital records, enforces clinical refusal guardrails, and offers one-click handover to callback/contact form |
| `ApprovalDiffModal` | Used in DeltaCare Admin (`/admin/approvals`) to inspect side-by-side field changes before approving and publishing |
| `StatusBadge` | Consistent semantic status pills for appointments (`REQUESTED`, `PENDING_CONFIRMATION`, `CONFIRMED`, `RESCHEDULE_REQUESTED`, `CANCELLED`, `COMPLETED`, `NO_SHOW`) and content (`DRAFT`, `PENDING_APPROVAL`, `APPROVED`, `PUBLISHED`, `ARCHIVED`) |

