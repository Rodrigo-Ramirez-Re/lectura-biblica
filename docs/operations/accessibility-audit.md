# Accessibility audit

Whole-app audit against WCAG 2.2 AA (LB-032), run on 2026-11-26 against the production build served under `/lectura-biblica/`. It is repeated on every PR by `apps/reader-e2e/src/accessibility-audit.spec.ts`. The checks below a real device or screen reader can't automate are listed at the end for the owner.

## Method

Every screen is opened with realistic data: twelve days of reading Abdías in December 2026 and one note, restored from a backup. Anything collapsed (log options, "Ver como tabla") is opened first. Then:

| Check                 | How                                                                                                                                                                                                                                      | Engines                                                             |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| WCAG 2.2 A/AA rules   | axe-core, tags `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, `wcag22aa`, in the light theme, then in dark once the colour transitions end                                                                                                  | Chromium, WebKit (Playwright's Firefox crashes inside axe, LB-011)  |
| Reflow (1.4.10)       | 320 × 640 viewport: the page never scrolls sideways (measured against `clientWidth`, so a scrollbar can't hide it) and no element cuts its text off sideways or at the bottom                                                            | all three                                                           |
| Resize text (1.4.4)   | root font size at 200 % on a 1280 × 800 viewport: same two conditions. Overlapping text is not measured (manual check)                                                                                                                   | all three                                                           |
| Focus visible (2.4.7) | Tab through the whole tab order (up to 400 stops; Editar plan alone has over 200). Each stop must show an outline or a ring that it doesn't have without focus. The skip link is the first stop and Enter moves the focus to the content | Chromium, Firefox (Safari tabs to links only with a system setting) |
| Motion (2.3.3)        | `prefers-reduced-motion: reduce`: no transition or animation longer than 10 ms, no smooth scrolling                                                                                                                                      | all three                                                           |

Screens: Hoy (first run and with a plan), Plan, Editar plan, Historial del libro, Avance (empty and with data), Libros, a book page, Acerca de, Instalar, Página no encontrada.

Not checked automatically: overlapping text, the logical order of the tab stops (only that every stop is reached and visible), animations of `::before`/`::after` or from scripts, and smooth scrolling inside boxes. None is used today; the manual checks below cover them.

## Results

| Screen               | axe light / dark | Reflow 320 px | Text 200 % | Focus | Reduced motion |
| -------------------- | ---------------- | ------------- | ---------- | ----- | -------------- |
| Hoy, first run       | ✓                | ✓             | ✓          | ✓     | ✓              |
| Hoy with a plan      | ✓                | ✓             | ✓          | ✓     | ✓              |
| Plan                 | ✓                | ✓             | ✓          | ✓     | ✓              |
| Editar plan          | ✓                | ✓             | ✓          | ✓     | ✓              |
| Historial del libro  | ✓                | ✓             | ✓          | ✓     | ✓              |
| Avance, empty        | ✓                | ✓             | ✓          | ✓     | ✓              |
| Avance with data     | ✓ after fix 1    | ✓             | ✓          | ✓     | ✓              |
| Libros               | ✓                | ✓             | ✓          | ✓     | ✓              |
| A book page          | ✓                | ✓             | ✓          | ✓     | ✓              |
| Acerca de            | ✓                | ✓             | ✓          | ✓     | ✓              |
| Instalar             | ✓                | ✓             | ✓          | ✓     | ✓              |
| Página no encontrada | ✓                | ✓             | ✓          | ✓     | ✓              |

## Findings

1. **Scrollable tables not reachable by keyboard** (`scrollable-region-focusable`, 2.1.1). The "Ver como tabla" boxes on Avance and the monthly history scroll on their own, but a keyboard user couldn't focus them to scroll. **Fixed:** each box is now a focusable region named after its table, with the focus ring.
2. **Contrast flagged in dark mode on buttons.** Not a defect: switching the theme on an open page fades button colours over 150 ms, and axe measured them halfway. A page opened in dark passes. The audit waits for the transitions to end.
3. **Repeated names for the same table** (found in review). The scroll boxes repeated their table's caption as their name. They now point at the caption (`aria-labelledby`), so it is read once. Each box stays a tab stop even when its table is short, which is harmless and keeps the rule simple.
4. Found in the same phase by the LB-030 review and fixed there: the install button's section disappeared with the focus on it, and the result wasn't announced. The focus now moves to the title, and a status region that is always present says the result.

Already in place before the audit and confirmed by it: the skip link, focus moved to each screen's heading after navigating, 44 px touch targets, symbols as well as colour in the calendar, an equivalent table for every chart, and live regions for confirmations.

## Manual checks for the owner

On a real phone, after each release that changes screens:

- [ ] **TalkBack (Android)** and **VoiceOver (iPhone):** go through Hoy, log a reading, open Avance and a chart's table, and change the theme. Every control should be announced with its name and state, and nothing should be read twice.
- [ ] **System text size at its largest** (Android "Tamaño de fuente", iOS "Texto más grande"): nothing should be cut off.
- [ ] **Browser zoom 400 %** on a computer: one column, no sideways scrolling.
- [ ] **Windows high contrast / forced colours:** buttons, focus ring and the calendar's symbols should stay visible.
- [ ] **Keyboard on Safari** with "Usar el teclado para navegar" turned on: the same stops as in Chrome.
