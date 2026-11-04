# DeltaCare — Measured Design System Specification

**Source Authority:** Extracted directly from the 49 `<style>` blocks in `inspo.html` (247 `--mc-*` CSS custom properties) and `inspo_files/fonts.css`.

---

## 1. Color Tokens (Exact Measured Hex/RGBA Values from `inspo.html`)

| Token Name | Measured Value | Usage in Reference & DeltaCare |
|---|---|---|
| `--mc-color-background-primary` | `#ffffff` | Primary page & card surface |
| `--mc-color-background-secondary` | `#ebebeb` | Muted section & media placeholder surface |
| `--mc-color-background-brand` | `#0057b8` | Brand blue section background (Alphabetical Condition Directory & Search) |
| `--mc-color-background-donations` | `#0d0d33` | Deep indigo institutional banner background |
| `--mc-color-background-footer` | `#012d61` | Deep navy global footer background |
| `--mc-color-text-primary` | `#080808` | Primary body & heading text |
| `--mc-color-text-secondary` | `#686868` | Secondary metadata & supporting text |
| `--mc-color-text-caption` | `#595959` | Captions, labels, and subtle helper text |
| `--mc-color-text-primary-inverse` | `#ffffff` | Text on dark/brand surfaces |
| `--mc-color-action-primary-default` | `#0057b8` | Primary interactive links, buttons, and active states |
| `--mc-color-action-primary-hover` | `#1371d5` | Primary button & link hover state |
| `--mc-color-action-primary-pressed` | `#002443` | Primary button & link active/pressed state |
| `--mc-color-action-secondary-default` | `#004181` | Secondary pill button border/text |
| `--mc-color-action-secondary-hover` | `#c5e2f9` | Secondary pill button hover surface |
| `--mc-color-action-secondary-pressed` | `#8fcdf6` | Secondary pill button active surface |
| `--mc-color-border-primary-default` | `#080808` | High-contrast borders |
| `--mc-color-border-secondary-default` | `#949494` | Form input & secondary borders |
| `--mc-color-border-tertiary-default` | `#d6d6d6` | Dividers, card borders, and header separators |
| `--mc-color-layer-overlay` | `rgba(8, 8, 8, 0.55)` | Hero and location card image gradient overlay |
| `--mc-color-signal-success-default` | `#008746` | Confirmed / Published status & validation success |
| `--mc-color-signal-warning-default` | `#c08800` | Pending confirmation / Pending approval warning |
| `--mc-color-signal-error-default` | `#e4002b` | Error / Cancelled / Clinical refusal alert |
| `--mc-color-focus-primary` | `#0057b8` | Focus ring outline (`2px dashed #0057b8`, offset `2px`) |

---

## 2. Typography System

### 2.1 Font Families
In `inspo_files/fonts.css`, the reference defines three font families:
1. **Display Serif (`--mc-typography-font-family-display`):** `mayo-display, Georgia, serif` (Weights: `300` Light, `400` Regular, `700` Bold)
2. **Body/Headline Serif (`--mc-typography-font-family-serif`):** `mayo-serif, Georgia, serif` (Weights: `300`, `400`, `700`, `900`)
3. **UI & Body Sans (`--mc-typography-font-family-sans`):** `mayo-sans, sans-serif` (Weights: `300`, `400`, `700`, `900`)

**DeltaCare Licensed Font Stack (English + Bangla):**
- **Display & Headline Serif (`--font-display` / `--font-serif`):** `'Source Serif 4', Georgia, 'Times New Roman', 'Noto Serif Bengali', serif`
- **UI & Body Sans (`--font-sans`):** `'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Noto Sans Bengali', sans-serif`

### 2.2 Measured Type Scale (Base `16px`)

| Token | Pixel Size | Rem Size | Line Height Token | Measured Line Height | Typical Usage |
|---|---:|---:|---|---:|---|
| `--mc-typography-font-size-19x` | `76px` | `4.75rem` | `--mc-typography-line-height-19x` | `1.0526` | Desktop Hero `<h1>` (`weight: 300`, Display Serif) |
| `--mc-typography-font-size-15x` | `60px` | `3.75rem` | `--mc-typography-line-height-15x` | `1.0667` | Large Display Headline |
| `--mc-typography-font-size-12x` | `48px` | `3.0rem` | `--mc-typography-line-height-12x` | `1.0833` | Mobile Hero `<h1>` / Desktop Section Display |
| `--mc-typography-font-size-10x` | `40px` | `2.5rem` | `--mc-typography-line-height-10x` | `1.1000` | Internal Page `<h1>` & Institutional Banner `<h2>` |
| `--mc-typography-font-size-8x` | `32px` | `2.0rem` | `--mc-typography-line-height-8x` | `1.2500` | Section `<h2>` (`Healing starts here`, `Locations`, `Featured care areas`) |
| `--mc-typography-font-size-6x` | `24px` | `1.5rem` | `--mc-typography-line-height-6x` | `1.3333` | Location Card `<h3>` & Subheadings |
| `--mc-typography-font-size-5x` | `20px` | `1.25rem` | `--mc-typography-line-height-5x` | `1.4000` | Lead paragraphs & card titles |
| `--mc-typography-font-size-4x` | `16px` | `1.0rem` | `--mc-typography-line-height-4x` | `1.5000` | Standard body copy, navigation links, buttons, A–Z letters |
| `--mc-typography-font-size-3x` | `12px` | `0.75rem` | `--mc-typography-line-height-3x` | `1.3333` | Legal links, badges, captions |

---

## 3. Spacing, Layout, Radius & Focus Tokens

### 3.1 Spacing Scale (`8px` Base Grid)
- `--mc-spacing-0-5x`: `4px` (`0.25rem`)
- `--mc-spacing-1x`: `8px` (`0.5rem`)
- `--mc-spacing-1-5x`: `12px` (`0.75rem`)
- `--mc-spacing-2x`: `16px` (`1rem`)
- `--mc-spacing-3x`: `24px` (`1.5rem`)
- `--mc-spacing-4x`: `32px` (`2rem`)
- `--mc-spacing-5x`: `40px` (`2.5rem`)
- `--mc-spacing-6x`: `48px` (`3rem`)
- `--mc-spacing-7x`: `56px` (`3.5rem`)
- `--mc-spacing-8x`: `64px` (`4rem`)
- `--mc-spacing-9x`: `72px` (`4.5rem`)
- `--mc-spacing-12x`: `96px` (`6rem`)

### 3.2 Containers & Grid
- `--mc-max-site-width`: `1296px`
- `--mc-grid-max-width`: `1320px`
- `--top-navigation-up`: `1200px`
- Horizontal gutters: `16px` mobile (`--mc-spacing-2x`), `24px` tablet (`--mc-spacing-3x`), `32px` desktop (`--mc-spacing-4x`)

### 3.3 Border Radii & Focus Ring
- `--mc-radius-x-small`: `4px`
- `--mc-radius-small`: `8px` (Story cards & Location image cards)
- `--mc-radius-medium`: `12px`
- `--mc-radius-large`: `16px`
- `--mc-radius-x-large`: `24px` (Pill buttons: `padding: 12px 24px`, `border-radius: 24px`)
- `--mc-radius-full`: `1000px` (A–Z `48px × 48px` circular buttons & social buttons)
- Focus ring: `outline: 2px dashed #0057b8; outline-offset: 2px;` (white `#ffffff` on dark/brand surfaces)

