import { readFile } from 'node:fs/promises';
import { expect, test, type Page } from '@playwright/test';
import { expectNoAccessibilityViolations } from './support/accessibility';

/**
 * Whole-app accessibility audit (LB-032): every screen, both themes, the narrowest phone, large
 * text, keyboard focus and reduced motion. Results and manual checks: docs/operations/accessibility-audit.md.
 */

const TODAY = '2026-12-13';

async function openOn(page: Page, day: string, path: string) {
  await page.clock.setFixedTime(new Date(`${day}T10:00:00`));
  await page.goto(path);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
}

/** Twelve days of reading Abdías in December 2026 with one note, restored from a backup. */
async function seed(page: Page): Promise<{ blockId: string }> {
  await openOn(page, '2026-12-01', './');
  await page.getByRole('button', { name: 'Empezar' }).click();
  await page.getByRole('button', { name: 'Ya leí' }).click();
  await expect(page.getByText('Listo por hoy')).toBeVisible();
  await page.goto('./acerca');
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Exportar respaldo' }).click();
  const backup = JSON.parse(await readFile(await (await download).path(), 'utf8'));
  const [log] = backup.logs;
  const blockId: string = log.blockId;
  backup.logs = Array.from({ length: 12 }, (_, i) => ({
    ...log,
    id: `l${i}`,
    date: `2026-12-${String(i + 1).padStart(2, '0')}`,
  }));
  backup.notes = [
    { id: 'n1', blockId, bookId: 'abdias', date: '2026-12-02', text: 'Edom y la soberbia.' },
  ];
  await page.getByLabel('Importar respaldo').setInputFiles({
    name: 'respaldo.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(backup)),
  });
  await page.getByRole('button', { name: 'Reemplazar mis datos' }).click();
  await expect(page.getByText('Listo por hoy')).toBeVisible();
  return { blockId };
}

interface Screen {
  readonly name: string;
  readonly path: (blockId: string) => string;
  readonly seeded: boolean;
  /** Waits for the data and opens what is collapsed, so everything on the screen is checked. */
  readonly ready?: (page: Page) => Promise<void>;
}

const openAll = async (page: Page, text: string) => {
  for (const toggle of await page.getByText(text).all()) await toggle.click();
};

const SCREENS: readonly Screen[] = [
  { name: 'Hoy, first run', path: () => './', seeded: false },
  {
    name: 'Hoy with a plan',
    path: () => './',
    seeded: true,
    ready: async (page) => {
      await expect(page.getByText('Libro de este bloque')).toBeVisible();
      await openAll(page, 'Otra cantidad u otro día');
    },
  },
  { name: 'Plan', path: () => './plan', seeded: true },
  { name: 'Editar plan', path: () => './plan/editar', seeded: true },
  { name: 'Historial del libro', path: (id) => `./plan/bloque/${id}`, seeded: true },
  { name: 'Avance, empty', path: () => './avance', seeded: false },
  {
    name: 'Avance with data',
    path: () => './avance',
    seeded: true,
    ready: async (page) => {
      await expect(page.getByTestId('on-pace-verdict')).toBeVisible();
      await openAll(page, 'Ver como tabla');
    },
  },
  { name: 'Libros', path: () => './libros', seeded: false },
  {
    name: 'a book page',
    path: () => './libros/abdias',
    seeded: true,
    ready: async (page) => {
      await expect(page.getByText('Edom y la soberbia.')).toBeVisible();
    },
  },
  { name: 'Acerca de', path: () => './acerca', seeded: true },
  { name: 'Instalar', path: () => './instalar', seeded: false },
  { name: 'Página no encontrada', path: () => './no-existe', seeded: false },
];

async function open(page: Page, screen: Screen) {
  const { blockId } = screen.seeded ? await seed(page) : { blockId: '' };
  await openOn(page, TODAY, screen.path(blockId));
  await screen.ready?.(page);
}

/**
 * Wider than the viewport: the page scrolls sideways. `clientWidth` leaves out a classic scrollbar,
 * so even a small overflow counts. Boxes that scroll on their own are fine.
 */
const horizontalOverflow = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

/**
 * Elements that cut their own text off, sideways or at the bottom, instead of wrapping or
 * scrolling it. Overlapping text is not measured here; the manual checks cover it.
 */
const clippedText = (page: Page) =>
  page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('body *')]
      .filter((element) => {
        if (!element.textContent?.trim() || element.classList.contains('sr-only')) return false;
        const style = getComputedStyle(element);
        const clips = (overflow: string) => ['hidden', 'clip'].includes(overflow);
        return (
          (clips(style.overflowX) && element.scrollWidth > element.clientWidth + 1) ||
          (clips(style.overflowY) && element.scrollHeight > element.clientHeight + 1)
        );
      })
      .map(
        (element) =>
          `${element.tagName.toLowerCase()}: ${element.textContent?.trim().slice(0, 40)}`,
      ),
  );

for (const screen of SCREENS) {
  test.describe(`Accessibility audit — ${screen.name} (LB-032)`, () => {
    test('passes axe in light and in dark', async ({ page }) => {
      await page.emulateMedia({ colorScheme: 'light' });
      await open(page, screen);
      await expectNoAccessibilityViolations(page);

      await page.emulateMedia({ colorScheme: 'dark' });
      // Buttons fade between theme colours; measure once they have arrived.
      await page.evaluate(() =>
        Promise.race([
          Promise.all(
            document
              .getAnimations()
              .filter((animation) => animation instanceof CSSTransition)
              .map((animation) => animation.finished),
          ),
          new Promise((resolve) => setTimeout(resolve, 1000)),
        ]),
      );
      await expectNoAccessibilityViolations(page);
    });

    test('reflows on a 320 px screen and keeps text whole at 200 %', async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 640 });
      await open(page, screen);
      expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);
      expect(await clippedText(page)).toEqual([]);

      await page.setViewportSize({ width: 1280, height: 800 });
      await page.evaluate(() => (document.documentElement.style.fontSize = '200%'));
      expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);
      expect(await clippedText(page)).toEqual([]);
    });

    test('shows where the keyboard focus is on every stop', async ({ page, browserName }) => {
      // WebKit only tabs to form controls unless the system setting says otherwise.
      test.skip(browserName === 'webkit', 'Safari tabs to links only with a system setting');
      await open(page, screen);

      // Walks the whole tab order once: each stop is marked, and the walk ends when the focus
      // comes back to a marked element (or leaves the page). Reaching the cap is a failure.
      // Editar plan alone has over 200 stops: three controls for each of the 66 books.
      const CAP = 400;
      let stops = 0;
      for (; stops < CAP; stops++) {
        await page.keyboard.press('Tab');
        const stop = await page.evaluate((index) => {
          const element = document.activeElement as HTMLElement | null;
          if (!element || element === document.body) return { done: true } as const;
          if (element.dataset['auditStop']) return { done: true } as const;
          element.dataset['auditStop'] = String(index);
          const ring = (style: CSSStyleDeclaration) =>
            `${style.outlineStyle} ${style.outlineWidth} ${style.outlineColor} | ${style.boxShadow}`;
          const shows = (style: CSSStyleDeclaration) =>
            (style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) > 0) ||
            style.boxShadow !== 'none';
          const focused = getComputedStyle(element);
          const withFocus = { ring: ring(focused), shows: shows(focused) };
          // The same element without focus: the indicator must be something focus adds.
          element.blur();
          const withoutFocus = ring(getComputedStyle(element));
          element.focus();
          const label =
            element.getAttribute('aria-label') || element.textContent?.trim() || element.id;
          return {
            done: false,
            name: `${element.tagName.toLowerCase()} #${index} "${label.slice(0, 30)}"`,
            visible: withFocus.shows && withFocus.ring !== withoutFocus,
          } as const;
        }, stops);
        if (stop.done) break;
        expect(stop.visible, `focus visible on ${stop.name}`).toBe(true);
      }
      expect(stops, 'the walk reached every stop before the cap').toBeLessThan(CAP);
      expect(stops).toBeGreaterThan(0);
    });

    test('does not animate when the device asks for reduced motion', async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await open(page, screen);

      const moving = await page.evaluate(() => {
        const seconds = (value: string) =>
          Math.max(
            ...value.split(',').map((part) => parseFloat(part) * (part.includes('ms') ? 0.001 : 1)),
          );
        return [...document.querySelectorAll<HTMLElement>('*')]
          .filter((element) => {
            const style = getComputedStyle(element);
            return (
              seconds(style.transitionDuration) > 0.01 || seconds(style.animationDuration) > 0.01
            );
          })
          .map(
            (element) =>
              element.tagName.toLowerCase() + '.' + [...element.classList].slice(0, 3).join('.'),
          );
      });
      expect(moving).toEqual([]);
      expect(
        await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior),
      ).not.toBe('smooth');
    });
  });
}

test.describe('Accessibility audit — skip link (LB-032)', () => {
  test('is the first stop and takes the keyboard to the content', async ({ page, browserName }) => {
    test.skip(browserName === 'webkit', 'Safari tabs to links only with a system setting');
    await openOn(page, TODAY, './libros');

    await page.keyboard.press('Tab');
    const skip = page.getByRole('link', { name: 'Saltar al contenido' });
    await expect(skip).toBeFocused();
    await expect(skip).toBeVisible();
    await page.keyboard.press('Enter');

    await expect(page.getByRole('main')).toBeFocused();
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => !!document.activeElement?.closest('main'))).toBe(true);
  });
});
