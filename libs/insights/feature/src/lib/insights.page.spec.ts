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
    const section = screen.getByRole('region', { name: '¿Voy al día?' });
    await user.click(within(section).getByText('Ver como tabla'));
    const rows = within(within(section).getByRole('table')).getAllByRole('row');
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

describe('InsightsPage — consistency (LB-024)', () => {
  const run = (from: number, to: number) =>
    Object.fromEntries(
      Array.from({ length: to - from + 1 }, (_, i) => [
        `2026-12-${String(from + i).padStart(2, '0')}`,
        3,
      ]),
    );

  it('shows the current and the best streak', async () => {
    await setup({ today: '2026-12-11', logs: { ...run(1, 8), ...run(10, 11) } });

    expect(screen.getByTestId('streak-current').textContent?.trim()).toBe('2 días');
    expect(screen.getByTestId('streak-best').textContent?.trim()).toBe('8 días');
    expect(
      screen
        .getByText(/de 11 días con lectura/)
        .textContent?.replace(/\s+/g, ' ')
        .trim(),
    ).toBe('10 de 11 días con lectura este mes.');
  });

  it('shows the month as a calendar and tells a day on tap', async () => {
    const user = userEvent.setup();
    await setup({ today: '2026-12-03', logs: { '2026-12-01': 5 } });

    const calendar = screen.getByRole('group', { name: 'Días de lectura de diciembre de 2026' });
    await user.click(within(calendar).getByRole('button', { name: '1 de diciembre: 5 capítulos' }));
    expect(
      within(calendar).getByText('1 de diciembre: 5 capítulos', { selector: 'p' }),
    ).toBeTruthy();
    expect(within(calendar).getByRole('button', { name: '2 de diciembre: Sin leer' })).toBeTruthy();
    expect(
      within(calendar).getByRole('button', { name: '3 de diciembre: Hoy, falta leer' }),
    ).toBeTruthy();
  });

  it('says the streaks start with the first day read', async () => {
    await setup({ today: '2026-12-03' });

    const section = screen.getByRole('region', { name: '¿Qué tan constante soy?' });
    expect(section.textContent).toContain('Tus rachas empiezan con tu primer día de lectura.');
  });
});

describe('InsightsPage — passes per book (LB-025)', () => {
  it('shows a bar per book read, with its passes in words', async () => {
    await setup({ today: '2026-12-03', logs: { '2026-12-01': 31, '2026-12-02': 1 } });

    const list = screen.getByRole('list', { name: 'Vueltas por libro, en el orden de tu plan' });
    expect(
      within(list)
        .getAllByRole('listitem')
        .map((row) => row.textContent?.replace(/\s+/g, ' ').trim()),
    ).toEqual(['Abdías 32 vueltas']);
  });

  it('says when nothing is read yet', async () => {
    await setup({ today: '2026-12-03' });

    const section = screen.getByRole('region', { name: '¿Cuántas veces he leído cada libro?' });
    expect(section.textContent).toContain('Cada libro aparecerá aquí');
  });
});

describe('InsightsPage — cycle and habits (LB-026, LB-027)', () => {
  it('shows every section', async () => {
    await setup({ today: '2026-12-03', logs: { '2026-12-01': 3 } });

    for (const name of [
      '¿Voy al día?',
      '¿Qué tan constante soy?',
      '¿Cuántas veces he leído cada libro?',
      '¿Cuánto llevo del ciclo?',
      '¿Cómo leo?',
    ])
      expect(screen.getByRole('region', { name })).toBeTruthy();
    expect(screen.getByText(/Con una semana de lectura verás/)).toBeTruthy();
  });
});
