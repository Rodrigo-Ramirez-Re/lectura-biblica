import {
  AdvanceBlocks,
  GetSchedule,
  GetToday,
  LogReading,
  StartDefaultPlan,
  UndoReading,
} from '@lectura/reading-application';
import { InMemoryJournal } from '@lectura/reading-domain/testing';
import { FixedClock, SequentialIds } from '@lectura/shared-kernel/testing';
import { provideSpanishLocale } from '@lectura/shared-util-i18n';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { TodayPage } from './today.page';

async function setup(today = '2026-11-24', options: { started?: boolean } = {}) {
  const journal = new InMemoryJournal();
  const clock = new FixedClock(today);
  const ids = new SequentialIds();
  const startPlan = new StartDefaultPlan(journal, journal, clock, ids);
  if (options.started) await startPlan.execute('today');
  const result = await render(TodayPage, {
    providers: [
      provideSpanishLocale(),
      { provide: AdvanceBlocks, useValue: new AdvanceBlocks(journal, journal, clock, ids) },
      { provide: GetSchedule, useValue: new GetSchedule(journal, clock) },
      { provide: GetToday, useValue: new GetToday(journal, clock) },
      { provide: StartDefaultPlan, useValue: startPlan },
      { provide: LogReading, useValue: new LogReading(journal, journal, clock, ids) },
      { provide: UndoReading, useValue: new UndoReading(journal) },
    ],
  });
  await result.fixture.whenStable();
  return { ...result, journal, user: userEvent.setup() };
}

const settle = async (fixture: { whenStable: () => Promise<unknown> }) => {
  await fixture.whenStable();
  await new Promise((resolve) => setTimeout(resolve));
  await fixture.whenStable();
};

describe('TodayPage — first run (LB-011)', () => {
  it('welcomes a new reader with the default plan', async () => {
    await setup();

    const welcome = screen.getByRole('region', { name: 'Empieza con «Un libro al mes»' });
    expect(welcome.textContent).toContain('3 capítulos al día');
    expect(welcome.textContent).toContain('del más corto al más largo');
  });

  it('offers to start today or on the 1st of next month', async () => {
    await setup('2026-11-24');

    expect(screen.getByRole('radio', { name: /Hoy, martes 24 de noviembre/ })).toHaveProperty(
      'checked',
      true,
    );
    expect(screen.getByRole('radio', { name: /El 1 de diciembre/ })).toBeTruthy();
  });

  it('starts today and shows the book of the block', async () => {
    const { user, fixture, journal } = await setup('2026-11-24');

    await user.click(screen.getByRole('button', { name: 'Empezar' }));
    await settle(fixture);

    expect(journal.journal.plan?.startDate).toBe('2026-11-24');
    expect(screen.getByRole('heading', { level: 2, name: 'Abdías' })).toBeTruthy();
    expect(screen.getByText(/Del 24 de noviembre al 30 de noviembre de 2026/)).toBeTruthy();
  });

  it('starts next month and says when the plan begins', async () => {
    const { user, fixture } = await setup('2026-11-24');

    await user.click(screen.getByRole('radio', { name: /El 1 de diciembre/ }));
    await user.click(screen.getByRole('button', { name: 'Empezar' }));
    await settle(fixture);

    expect(screen.getByText(/Tu plan empieza el 1 de diciembre con Abdías/)).toBeTruthy();
  });
});

describe('TodayPage — reading (LB-012)', () => {
  it('shows what is due today', async () => {
    await setup('2026-12-01', { started: true });

    const reading = screen.getByRole('region', { name: 'Lectura de hoy' });
    expect(reading.textContent).toContain('Abdías 1, 3 veces');
  });

  it('logs the day with one tap and offers to undo it', async () => {
    const { user, fixture, journal } = await setup('2026-12-01', { started: true });

    await user.click(screen.getByRole('button', { name: 'Ya leí' }));
    await settle(fixture);

    expect(journal.journal.logs).toEqual([
      expect.objectContaining({ date: '2026-12-01', chaptersRead: 3 }),
    ]);
    expect(screen.getByText('Listo por hoy')).toBeTruthy();
    expect(screen.getByText('Leíste 3 capítulos hoy.')).toBeTruthy();
    expect(screen.getByRole('status').textContent).toContain('Registrado: Abdías · 3 capítulos');
  });

  it('undoes the last log', async () => {
    const { user, fixture, journal } = await setup('2026-12-01', { started: true });
    await user.click(screen.getByRole('button', { name: 'Ya leí' }));
    await settle(fixture);

    await user.click(screen.getByRole('button', { name: 'Deshacer' }));
    await settle(fixture);

    expect(journal.journal.logs).toEqual([]);
    expect(screen.getByRole('button', { name: 'Ya leí' })).toBeTruthy();
  });

  it('logs another amount for another day of the block', async () => {
    const { user, fixture, journal } = await setup('2026-12-03', { started: false });
    await new StartDefaultPlan(
      journal,
      journal,
      new FixedClock('2026-12-01'),
      new SequentialIds(),
    ).execute('today');
    await fixture.componentInstance['load']();
    await settle(fixture);

    await user.click(screen.getByText('Otra cantidad u otro día'));
    const date = screen.getByLabelText('Día') as HTMLInputElement;
    await user.clear(date);
    await user.type(date, '2026-12-02');
    date.dispatchEvent(new Event('change'));
    const amount = screen.getByLabelText('Capítulos') as HTMLInputElement;
    await user.clear(amount);
    await user.type(amount, '5');
    await user.tab();
    await user.click(screen.getByRole('button', { name: 'Registrar' }));
    await settle(fixture);

    expect(journal.journal.logs).toEqual([
      expect.objectContaining({ date: '2026-12-02', chaptersRead: 5 }),
    ]);
  });

  it('shows the progress of the current pass and how many fit', async () => {
    await setup('2026-12-01', { started: true });

    const progress = screen.getByRole('region', { name: 'Tu avance en Abdías' });
    expect(progress.textContent).toContain('Aún no completas una vuelta');
    expect(screen.getByRole('progressbar', { name: 'Vuelta actual' })).toBeTruthy();
    expect(progress.textContent).toContain('caben 93 vueltas');
  });
});
