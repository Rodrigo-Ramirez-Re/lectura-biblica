# Design system

The design system is the **tokens + components + rules** that every screen is built from. Storybook is only its catalogue.

## Layers

```
primitive tokens   raw values, private    --lb-ink-900: #…                libs/ui/tokens/src/primitives.css
      ↓
semantic tokens    meaning                --color-surface, --color-primary   libs/ui/tokens/src/theme.css
      ↓            = Tailwind theme       bg-surface, text-body, p-section
components         lb-button, lb-card, lb-progress …
```

Semantic tokens are Tailwind v4 theme variables, so each one is both a utility and a CSS variable for component styles. Tailwind's default palette, font families, font sizes, radii and shadows are removed. Its spacing scale and breakpoints stay as layout scaffolding.

Rule: components and features use **semantic** tokens/utilities only. The `--lb-` prefix is reserved for primitives; lint fails on any `--lb-*` outside `libs/ui/tokens`.

## Themes

Light and dark from a single declaration per color: every semantic color is `light-dark(<light primitive>, <dark primitive>)`, and `color-scheme` on the root picks the side. `:root` is `light dark` (the device decides); `[data-theme="light"]` and `[data-theme="dark"]` force one. The person's choice (`auto`, `light`, `dark`) is stored in settings and sets `data-theme`.

| Semantic           | Light     | Dark      | Use                                       |
| ------------------ | --------- | --------- | ----------------------------------------- |
| `surface`          | `#FBF8F3` | `#171512` | Page background (warm paper / warm night) |
| `surface-raised`   | `#FFFFFF` | `#221F1B` | Cards, sheets, navigation bar             |
| `surface-subtle`   | `#F3EEE6` | `#2E2A25` | Secondary panels, progress tracks         |
| `on-surface`       | `#1F1B16` | `#EDE7DD` | Text                                      |
| `on-surface-muted` | `#5C544A` | `#B3AA9C` | Secondary text                            |
| `primary`          | `#1F5E5B` | `#6FC2BB` | Actions, links, progress, current item    |
| `primary-strong`   | `#174845` | `#8FD3CD` | Pressed primary                           |
| `on-primary`       | `#FFFFFF` | `#0F1F1E` | Text on primary                           |
| `accent`           | `#8A5A00` | `#E0A84B` | Highlights (streaks, book of the month)   |
| `success`          | `#2F6B3A` | `#7CC98A` | Done states, always with icon or text     |
| `danger`           | `#B42318` | `#F28B82` | Errors, destructive actions               |
| `border`           | `#E6DFD3` | `#2E2A25` | Decorative dividers                       |
| `border-strong`    | `#8C8173` | `#7D7468` | Field and control borders (3:1)           |
| `focus`            | `#B45309` | `#F0B45A` | Focus ring                                |

Other tokens: type scale `display`, `heading-1…3`, `body`, `body-sm`, `caption`; spacing `gutter`, `section`, `touch` (44 px); container `content` (40 rem); radius `control`, `card`, `pill`; shadow `card`, `raised`. The catalogue with usage notes is `libs/ui/tokens/src/lib/foundations.ts`.

## Accessibility

Every text/background pair is listed in `contrastPairs` and asserted by a unit test in **both themes**: ≥ 4.5:1 for text, ≥ 3:1 for focus indicators, field borders and chart marks. Never rely on colour alone: every chart series and status carries a label or icon.

## Fonts

System stacks: sans (`system-ui`, …) for text, serif (`ui-serif, Georgia`, …) for book names and titles. Zero bytes to download, nothing from a CDN (offline requirement).

## Rules

- Mobile first; touch targets ≥ 44 × 44 px.
- Accessible by default: keyboard, focus-visible ring token, ARIA only when native semantics fall short.
- Presentational components: inputs/outputs only, no services, no business logic.
- Each component ships with: spec and Storybook story (states + variants).
- Prefix: `lb-` for selectors.

## Components

Built (`libs/ui/components`, catalogued in Storybook → Components, with a Tema toolbar for light, dark and automatic):

| Component                         | Use                                                                                                                       |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `button[lbButton]`, `a[lbButton]` | Actions and links styled as buttons. Variants `primary`, `secondary`, `ghost`, `danger`; sizes `md`, `lg`. 44 px minimum. |
| `section[lbCard]`                 | Raised panel; name it with `aria-labelledby` pointing at its heading.                                                     |
| `lb-progress`                     | Progress bar (`role="progressbar"`, value/max, accessible name) with a projected text caption.                            |
| `lb-stepper`                      | Whole number with − / + buttons or typing, clamped to min/max, value announced politely.                                  |
| `lb-form-field` + `[lbControl]`   | Label, hint and error wired to the control with `aria-describedby` / `aria-invalid`.                                      |
