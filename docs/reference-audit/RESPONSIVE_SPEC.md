# DeltaCare — Responsive Layout Specification

**Source Authority:** Measured media queries in `inspo.html` (`all_styles.css`) and `inspo_instruction.md` Section 5.4 & 16.4.

---

## 1. Reference Breakpoints Measured from `inspo.html`

In `inspo.html`, the AEM grid and component stylesheets use the following `em`-based breakpoints (at `16px` root font size):

| Breakpoint Name | Media Query in `inspo.html` | Pixel Equivalent | Layout Behavior |
|---|---|---:|---|
| `mayo_x-small` | `max-width: 22.4375em` | `<= 359px` | Single-column compact mobile layout (`16px` gutter, full-bleed story media, collapsible A–Z drawer) |
| `mayo_small` | `22.4376em` to `37.49em` | `360px – 599px` | Standard mobile layout (`360px` / `390px` target viewports); 5-column collapsible A–Z grid (`grid-template-columns: repeat(5, 1fr)`); stacked story cards |
| `mayo_medium` | `37.4901em` to `56.5em` | `600px – 904px` | Tablet portrait (`768px` target viewport); 2-column link lists; 2-column location cards; visible A–Z `48px` grid |
| `mayo_large` | `56.56em` to `89.94em` | `905px – 1439px` | Tablet landscape & laptop (`1024px` target viewport); `76px` hero headline; 2-column split story cards; 3-column location grid; hamburger menu up to `1199px`, full top nav at `>= 1200px` (`--top-navigation-up: 1200px`) |
| `mayo_x-large` | `min-width: 90em` | `>= 1440px` | Desktop & wide desktop (`1440px` and `1920px` target viewports); centered max container (`1296px` / `1320px`), full mega-menu navigation |

---

## 2. Section-by-Section Responsive Adaptation

1. **Global Header (`SiteHeader`):**
   - **Desktop (`>= 1200px`):** Logo on left, 5 Mega-Menu triggers in center-left, `Request Appointment`, `Register / Log in`, `EN | বাংলা` switcher, and `Search` icon on right.
   - **Mobile & Tablet (`< 1200px`):** Compact header bar (`68px` height) with Logo on left, `Log in`, `Search`, and accessible `Hamburger` drawer button on right. Mobile drawer supports accordion expansion for all 5 navigation categories plus language toggle and primary `Request Appointment` CTA.

2. **Hero Section (`HeroBanner`):**
   - **Desktop (`>= 905px`):** Full-bleed height `560px–640px`, bottom-left overlay content aligned to `1320px` grid, `76px` light serif headline, side-by-side CTAs (`column-gap: 24px`).
   - **Mobile (`< 600px`):** Aspect-ratio-controlled hero media (`min-height: 440px`) with darker bottom gradient for contrast, `40px–48px` headline, full-width stacked CTAs (`row-gap: 16px`).

3. **Appointment Request Bar / Module:**
   - **Desktop:** Horizontal multi-field booking card with side-by-side Department, Doctor, Branch, Date/Slot, and Patient Contact inputs.
   - **Mobile:** Step-by-step / single-column vertical form with `48px` minimum touch target heights on all inputs and buttons.

4. **Alphabetical Condition Directory & Global Search (`#0057b8` Surface):**
   - **Desktop (`>= 905px`):** 2-column layout (Left 7 cols: `Find diseases & conditions by first letter` with `auto-fill, 48px` circle buttons; Right 5 cols: Global Search input & quick category pills).
   - **Mobile (`< 600px`):** Search input placed first for immediate reachability, followed by expandable/scrollable `repeat(5, 1fr)` `48px` circular letter buttons.

5. **Locations & Branches Grid:**
   - **Desktop (`>= 905px`):** 3-column grid (Cell 1: `Locations` text card + `Explore all locations` pill CTA; Cells 2–6: `.cmp-image-video-card` branch cards).
   - **Tablet (`600px–904px`):** 2-column grid.
   - **Mobile (`< 600px`):** 1-column stack with `16:10` / `4:3` rounded image cards.

6. **Featured Care Areas (Mosaic Layout):**
   - **Desktop (`>= 905px`):** 12-column mosaic (Left 4 cols: sticky/top-aligned heading + description; Right 8 cols: 2-column `.cmp-link-list` with `24px` column gap).
   - **Mobile (`< 600px`):** Stacked heading followed by 1-column full-width link list with `48px` minimum row height.

7. **Story Split Cards (`Healing starts here` & `World-class care`):**
   - **Desktop (`>= 905px`):** 12-column split (5 cols centered text card + 7 cols `600×800` portrait image with `8px` radius, alternating left/right).
   - **Mobile (`< 600px`):** Image stacks cleanly below text card with full-bleed or contained responsive treatment.

8. **Global Footer:**
   - **Desktop (`>= 905px`):** 4-column layout (Col 1: 3 icon action buttons; Cols 2–4: institutional, clinical, and patient-service link groups), followed by social circle icons + app badges + inline legal links + language selector.
   - **Mobile (`< 600px`):** Full-width action buttons at top, accordion/stacked link groups, wrapped social circle buttons, vertical legal links, and bottom language selector.

