# DeltaCare — Asset Inventory

**Source Authority:** `inspo_files/` (48 files inspected) and Master Prompt Sections 2, 3, 4, 26.

---

## 1. Visual & Image Assets in `inspo_files/`

All image files in `e:\projects\hospital final\inspo_files\` were inspected and catalogued. To make them directly servable by Next.js (`public/images/inspo/...`) without modifying or deleting the original `inspo_files/` folder (preserving Rule 18: *Do not modify or delete source materials*), these authorized visual assets will be copied into `public/images/inspo/` during Phase 1 setup.

| Original File in `inspo_files/` | Format & Size | Dimensions / Aspect | Reference Role in `inspo.html` | DeltaCare Usage |
|---|---|---|---|---|
| `healing-starts-here-MC11REJU-600x800.jpg` | JPEG (17,533 B) | `600 × 800` (3:4 portrait) | Story Card 1 (`Healing starts here`) | Homepage Story Card 1 (`Healing starts here` / Diagnostic & Specialist Excellence) |
| `world-class care-MC1XASH-600x800.jpg` | JPEG (24,838 B) | `600 × 800` (3:4 portrait) | Story Card 2 (`World-class care for global patients`) | Homepage Story Card 2 (`World-class care for patients across Bangladesh & beyond`) |
| `Arizona.png` | PNG (57,691 B) | Campus photo | Location Card 1 | DeltaCare Flagship Campus — Dhanmondi Branch |
| `Florida.png` | PNG (108,482 B) | Campus photo | Location Card 2 | DeltaCare Specialized Center — Gulshan Branch |
| `Minnesota.png` | PNG (109,483 B) | Campus photo | Location Card 3 | DeltaCare Medical Campus — Uttara Branch |
| `Mayo Clinic Health System.png` | PNG (64,286 B) | Campus photo | Location Card 4 | DeltaCare Regional Center — Chattogram Branch |
| `Mayo Clinic Healthcare London UK.png` | PNG (38,037 B) | Campus photo | Location Card 5 | DeltaCare Diagnostic & Consultation Center — Sylhet Branch |
| `pt-visitor-Getty-1419492732-415x275.jpg` | JPEG (19,379 B) | `415 × 275` | Mega-Menu 1 Teaser (`Patient & Visitor Guide`) | Mega-Menu Teaser: `Patient & Visitor Guide` |
| `1710753_3980687_0060.png` | PNG (15,438 B) | `415 × 275` | Mega-Menu 2 Teaser (`Health Library`) | Mega-Menu Teaser: `DeltaCare Health Library & Guides` |
| `cont-ed-1676659-3734290-0048-C-415x275.jpg` | JPEG (10,797 B) | `415 × 275` | Mega-Menu 3 Teaser (`Medical Professionals`) | Mega-Menu Teaser: `Clinical Departments & Specialists` |
| `mccms-Getty-1082003662-415x275.jpg` | JPEG (15,271 B) | `415 × 275` | Mega-Menu 4 Teaser (`Education & Research`) | Mega-Menu Teaser: `Medical Education & Clinical Quality` |
| `giving-to-mayo-em100063715-p-195580295-415x275.png` | PNG (18,591 B) | `415 × 275` | Mega-Menu 5 Teaser (`Patient Support`) | Mega-Menu Teaser: `Community Care & Patient Assistance` |
| `giving-charity.svg` | SVG (1,105 B) | Vector icon | Institutional banner icon (`From research to reality, faster`) | Institutional banner emblem (`Advancing Healthcare in Bangladesh`) |
| `Google_Play_Store_badge_EN.svg` | SVG (7,954 B) | Vector badge | Footer Google Play badge | Footer patient portal / mobile access badge |
| `App_Store_Badge_EN.svg` | SVG (18,285 B) | Vector badge | Footer App Store badge | Footer patient portal / mobile access badge |
| `mayo-clinic-logo.svg` | SVG (3,796 B) | Vector logo | Mayo Clinic triple-shield logo | **DO NOT USE** (Replaced by original **DeltaCare** SVG shield/cross logo per Branding Section 2 & Rule 4) |

---

## 2. Non-Image Files in `inspo_files/`

- `fonts.css` (3,222 B) & `mayo-clinic-fonts-arabic.css` (1,955 B): Inspected to extract exact font-family names, weights (`300`, `400`, `700`, `900`), and `font-display: swap` configuration.
- `*.js.download`, `il6Ego`, `saved_resource.html`: Saved Webpack/Next.js and Tealium (`utag`) client bundles from the browser snapshot. Inspected for reference only; not executed in DeltaCare.

---

## 3. Missing / External Media Dependencies Recorded

- **Hero Video Asset:** In `inspo.html`, the `<video class="cmp-media__video">` element has empty `<source type="video/mp4">` tags because the browser's `Save Page As` did not download the remote `.mp4` stream.
  - **Resolution:** Implement the Hero section with a high-resolution, responsive medical campus & clinical care visual composition (using supplied imagery + SVG architectural/clinical lighting overlay and optional video source support) plus the interactive Play/Pause ambient motion toggle from the reference.

