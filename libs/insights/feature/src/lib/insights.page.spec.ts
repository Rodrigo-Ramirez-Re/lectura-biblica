import { provideRouter } from '@angular/router';
import { GetInsights } from '@lectura/insights-application';
import { AdvanceBlocks, StartDefaultPlan } from '@lectura/reading-application';
import { InMemoryJournal } from '@lectura/reading-domain/testing';
import { FixedClock } from '@lectura/shared-kernel/testing';
import { provideSpanishLocale } from '@lectura/shared-util-i18n';
import { render, screen, within } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { InsightsPage } from './insights.page';

/** Starts the default plan on 1 December 2026, logs `chapters` per day, and opens Avance on `today`. */
async function setup(options: { plan?: boolean; today?: string; logs?: Record<string, number> }) {
  const journal = new InMemoryJournal();
  const clock = new FixedClock('2026-12-01');
  if (options.plan !== false) {
    await new StartDefaultPlan(journal, journal, clock).execute('today');
    const block = journal.journal.blocks[0];
    if (!block) throw new Error('block');
    let id = 0;
    for (const [date, chaptersRead] of Object.entries(options.logs ?? {}))
      await journal.addLog({
        id: `l${++id}`,
        date,
        blockId: block.id,
        bookId: block.bookId,
        startChapter: 1,
        chaptersRead,
      });
  }
  clock.set(options.today ?? '2026-12-10');
  const result = await render(InsightsPage, {
    providers: [
      provideRouter([]),
      provideSpanishLocale(),
      { provide: AdvanceBlocks, useValue: new AdvanceBlocks(journal, journal, clock) },
      { provide: GetInsights, useValue: new GetInsights(journal, clock) },
    ],
  });
  await result.fixture.whenStable();
  return result;
}

const days = (count: number, chapters: number) =>
  Object.fromEntries(
    Array.from({ length: count }, (_, i) => [
      `2026-12-${String(i + 1).padStart(2, '0')}`,
      chapters,
    ]),
  );

describe('InsightsPage (LB-023)', () => {
  it('explains that insights start with the plan', async () => {
    await setup({ plan: false });

    expect(screen.getByText(/Tu avance aparecerá aquí/)).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Empezar en Hoy' }).getAttribute('href')).toBe('/');
  });

  it('says how far ahead, in chapters and days', async () => {
    await setup({ logs: { ...days(9, 3), '2026-12-10': 9 } });

    const section = screen.getByRole('region', { name: '¿Voy al día?' });
    expect(
      within(section).getByTestId('on-pace-verdict').textContent?.replace(/\s+/g, ' ').trim(),
    ).toBe('Vas 6 capítulos adelantado (2 días)');
    expect(section.textContent).toContain('Llevas 36 de 30 capítulos');
  });

  it('says how far behind', async () => {
    await setup({ logs: days(8, 3) });

    expect(screen.getByTestId('on-pace-verdict').textContent?.replace(/\s+/g, ' ').trim()).toBe(
      'Vas 6 capítulos atrasado (2 días)',
    );
  });

  it('says when on pace, without days', async () => {
    await setup({ logs: days(10, 3) });

    expect(screen.getByTestId('on-pace-verdict').textContent?.trim()).toBe('Vas al día');
  });

  it('uses the singular for one chapter and one day', async () => {
    await setup({ today: '2026-12-01', logs: { '2026-12-01': 4 } });

    expect(screen.getByTestId('on-pace-verdict').textContent?.replace(/\s+/g, ' ').trim()).toBe(
      'Vas 1 capítulo adelantado',
    );
  });

  it('draws the month and offers it as a table', async () => {
    const user = userEvent.setup();
    await setup({ today: '2026-12-03', logs: { '2026-12-02': 5 } });

    expect(
      screen.getByRole('img', {
        name: 'Capítulos acumulados de diciembre de 2026, leídos y según el plan, día por día',
      }),
    ).toBeTruthy();
    await user.click(screen.getByText('Ver como tabla'));
    const rows = within(screen.getByRole('table')).getAllByRole('row');
    const cells = (row: HTMLElement) =>
      [...row.querySelectorAll('th, td')].map((cell) => cell.textContent?.trim()).join('|');
    expect(rows.map(cells)).toEqual([
      'Día|Leídos|Según el plan',
      '1 de diciembre|0|3',
      '2 de diciembre|5|6',
      '3 de diciembre|5|9',
    ]);
  });
});
