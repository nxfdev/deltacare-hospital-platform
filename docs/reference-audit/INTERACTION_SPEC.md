# DeltaCare — Interaction & Behavior Specification

**Source Authority:** `inspo.html`, `inspo_instruction.md` Section 15, and `02-SRS.md`.

---

## 1. Header & Mega-Menu Navigation (`SiteHeader` / `MegaMenu`)

- **Desktop Dropdown Behavior (`>= 1200px`):**
  - Clicking a primary navigation tab (`Care at DeltaCare`, `Health Library`, `Departments & Doctors`, `Patient Services`, `About & Contact`) toggles its full-width mega-menu panel (`top: 85px`, `background: #ffffff`, `box-shadow: 0 12px 24px rgba(0,0,0,0.12)`).
  - Active tab displays a `3px solid #0057b8` bottom indicator and rotates the chevron icon `180deg` (`transition: 0.3s ease-in-out`).
  - Pressing `Escape` or clicking outside closes the active mega-menu and returns focus to the trigger button.
  - Each mega-menu contains a 2-column or 3-column list of links with right-aligned chevrons and a featured right-hand visual teaser card (`.cmp-teaser`) with a dark gradient overlay and zoom-on-hover image treatment.
- **Header Search Drawer:**
  - Clicking the `Search` button in the header swaps the navigation bar into a focused search bar (`flex-basis: 856px`) with an auto-focused input and a close (`X`) button.

---

## 2. Global Search & Autocomplete (`GlobalSearch`)

- **Trigger Threshold:** Typing 2 or more characters triggers a debounced (`200ms`) request to `GET /api/v1/public/search?q=...&locale=...`.
- **Keyboard Navigation:**
  - `ArrowDown` / `ArrowUp` cycles through live suggestions grouped by category (`Doctors`, `Departments`, `Diseases & Conditions`, `Tests & Procedures`, `Services`).
  - `Enter` navigates directly to the highlighted suggestion or submits the full search query to `/diseases-conditions` or `/doctors`.
  - `Escape` closes the suggestion listbox.
- **Accessibility:** Uses `role="combobox"`, `aria-expanded`, `aria-controls`, and `aria-live="polite"` result announcements matching the reference instructions (`When results are available, use up and down arrow keys to navigate...`).

---

## 3. Alphabetical Diseases & Conditions Facet (`AlphabetConditionSearch`)

- Displays circular `48px × 48px` buttons for `A` through `Z` and `#`.
- Default state on `#0057b8` surface: `background-color: rgba(255, 255, 255, 0.1)`, `border: 1px solid rgba(255, 255, 255, 0.5)`, `color: #ffffff`.
- Hover / Selected state: `background-color: #ffffff`, `color: #0057b8`, `border-color: #ffffff`.
- Clicking a letter filters the condition preview cards immediately in-page AND links to `/diseases-conditions?letter=X`.

---

## 4. Appointment Request & Concurrency Workflow

- **Interactive Selection:**
  1. Select Department or Specialty (filters available doctors).
  2. Select Doctor and Branch Chamber (loads published `ScheduleRule` and `ScheduleException` slots via `GET /api/v1/public/availability`).
  3. Select Preferred Date & Time Slot (displays remaining slot capacity).
  4. Enter Patient Contact Information (Full Name, Phone, optional Email, Reason/Notes, Privacy Consent checkbox).
- **Submission & Status Honesty (`FR-APT-10`):**
  - Submitting calls `POST /api/v1/public/appointments`.
  - Server re-validates slot capacity inside a database transaction (`R-04` mitigation) and assigns a unique reference code (`DC-2026-XXXX`).
  - UI explicitly displays status as **`REQUESTED — Pending Staff Confirmation`** (never claiming the appointment is confirmed until staff confirms it in DeltaCare Admin).

---

## 5. DeltaCare Assistant (Grounded AI Patient Assistant)

- **Disclosure (`FR-AI-10`):** Always displays `Automated Assistant — Grounds answers strictly in DeltaCare approved hospital information. Does not provide medical diagnosis or clinical advice.`
- **Safety & Refusal (`FR-AI-07`):** Any query asking for symptom diagnosis, medication dosage, prescriptions, or emergency clinical triage triggers an immediate, polite refusal with one-tap emergency contact numbers (`tel:...`) and a link to request a doctor appointment.
- **Source Grounding (`FR-AI-03`, `FR-AI-04`):** Queries only `PUBLISHED` records whose `effectiveFrom <= now` and `(effectiveTo is null OR effectiveTo >= now)`. Unpublished drafts are never retrieved.
- **Abstention (`FR-AI-06`):** If a fee, doctor schedule, or service is not found in published data, the assistant explicitly abstains from guessing and provides a direct link to the branch phone number and callback request form.

---

## 6. Motion & Reduced-Motion Support

- Transitions use `--mc-transition-timing: 0.3s` and `--mc-transition-easing: ease-in-out`.
- `@media (prefers-reduced-motion: reduce)` disables all non-essential animations and smooth scrolling.

