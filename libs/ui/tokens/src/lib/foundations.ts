// Catalogue of the semantic tokens in theme.css, for documentation and contrast tests.
// Values live only in the CSS; a spec keeps both lists in sync.

export interface Token {
  readonly name: string;
  readonly usage: string;
}

export type Theme = 'light' | 'dark';

export const themes: readonly Theme[] = ['light', 'dark'];

export type ContrastLevel = 'text' | 'ui';

export interface ContrastPair {
  readonly foreground: string;
  readonly background: string;
  readonly level: ContrastLevel;
}

/** WCAG 2.2 AA: 1.4.3 for text, 1.4.11 for focus indicators, field borders and chart marks. */
export const minimumContrast: Record<ContrastLevel, number> = {
  text: 4.5,
  ui: 3,
};

export const colorTokens = [
  { name: 'surface', usage: 'Page background' },
  { name: 'surface-raised', usage: 'Cards, sheets and the navigation bar' },
  { name: 'surface-subtle', usage: 'Secondary panels, inactive tracks, pressed ghost buttons' },
  { name: 'on-surface', usage: 'Text on any surface' },
  { name: 'on-surface-muted', usage: 'Secondary text: dates, hints, captions' },
  { name: 'primary', usage: 'Primary actions, links, progress, the current item' },
  { name: 'primary-strong', usage: 'Pressed or hovered primary actions' },
  { name: 'on-primary', usage: 'Text and icons on primary' },
  { name: 'accent', usage: 'Highlights: streaks, the active book of the month' },
  { name: 'success', usage: 'Done states ("listo por hoy"), always with an icon or text' },
  { name: 'danger', usage: 'Errors and destructive actions' },
  { name: 'border', usage: 'Decorative dividers; never the only boundary of a control' },
  { name: 'border-strong', usage: 'Form field and control borders' },
  { name: 'focus', usage: 'Keyboard focus ring' },
] as const satisfies readonly Token[];

type Color = (typeof colorTokens)[number]['name'];

export const fontTokens = [
  { name: 'body', usage: 'System sans: running text, navigation, forms' },
  { name: 'display', usage: 'System serif: book names and screen titles' },
] as const satisfies readonly Token[];

export const typeScale = [
  { name: 'display', usage: 'The book of the month on Hoy' },
  { name: 'heading-1', usage: 'Screen titles' },
  { name: 'heading-2', usage: 'Section headings' },
  { name: 'heading-3', usage: 'Card titles' },
  { name: 'body', usage: 'Running text' },
  { name: 'body-sm', usage: 'Secondary text, navigation labels' },
  { name: 'caption', usage: 'Chart labels and metadata' },
] as const satisfies readonly Token[];

export const spacingTokens = [
  { name: 'gutter', usage: 'Horizontal padding between content and the viewport edge' },
  { name: 'section', usage: 'Vertical gap between sections of a screen' },
  { name: 'touch', usage: 'Minimum touch target (44 px)' },
] as const satisfies readonly Token[];

export const containerTokens = [
  { name: 'content', usage: 'Maximum width of screen content' },
] as const satisfies readonly Token[];

export const radiusTokens = [
  { name: 'control', usage: 'Buttons and form fields' },
  { name: 'card', usage: 'Cards and sheets' },
  { name: 'pill', usage: 'Badges and progress tracks' },
] as const satisfies readonly Token[];

export const shadowTokens = [
  { name: 'card', usage: 'Cards' },
  { name: 'raised', usage: 'Floating elements: update notice, undo toast' },
] as const satisfies readonly Token[];

const pairs = (foreground: Color, backgrounds: Color[], level: ContrastLevel = 'text') =>
  backgrounds.map((background) => ({ foreground, background, level }));

const surfaces: Color[] = ['surface', 'surface-raised', 'surface-subtle'];

/** Every foreground/background combination components may use, checked in both themes. */
export const contrastPairs: readonly ContrastPair[] = [
  ...pairs('on-surface', surfaces),
  ...pairs('on-surface-muted', surfaces),
  ...pairs('primary', surfaces),
  ...pairs('accent', surfaces),
  ...pairs('success', surfaces),
  ...pairs('danger', surfaces),
  ...pairs('on-primary', ['primary', 'primary-strong']),
  ...pairs('focus', surfaces, 'ui'),
  ...pairs('border-strong', surfaces, 'ui'),
  // Progress bars draw primary over a surface-subtle track.
  ...pairs('primary', ['surface-subtle'], 'ui'),
];
