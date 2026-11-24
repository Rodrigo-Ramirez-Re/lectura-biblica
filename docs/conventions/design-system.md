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

Light and dark. The semantic tokens are redefined for dark under `prefers-color-scheme: dark` and under `[data-theme="dark"]`; `[data-theme="light"]` forces light. The person's choice (`auto`, `light`, `dark`) is stored in settings.

## Accessibility

Every text/background pair is listed in `contrastPairs` and asserted by a unit test in **both themes**: ≥ 4.5:1 for text, ≥ 3:1 for focus indicators and chart marks. Never rely on colour alone: every chart series and status carries a label or icon.

## Fonts

System font stack, or a font bundled with the app. Never a CDN (offline requirement).

## Rules

- Mobile first; touch targets ≥ 44 × 44 px.
- Accessible by default: keyboard, focus-visible ring token, ARIA only when native semantics fall short.
- Presentational components: inputs/outputs only, no services, no business logic.
- Each component ships with: spec and Storybook story (states + variants).
- Prefix: `lb-` for selectors.
