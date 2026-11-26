import { provideRouter } from '@angular/router';
import {
  AdvanceBlocks,
  CheckBackupReminder,
  PostponeBackupReminder,
  Notes,
  ControlCurrentBlock,
  GetSchedule,
  GetToday,
  LogReading,
  SetBlockGoal,
  StartDefaultPlan,
  UndoReading,
} from '@lectura/reading-application';
import { InMemoryJournal } from '@lectura/reading-domain/testing';
import { FixedClock, SequentialIds } from '@lectura/shared-kernel/testing';
import { provideSpanishLocale } from '@lectura/shared-util-i18n';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { TodayPage } from './today.page';

/** `started` starts the plan today; `daysLogged` starts it on 1 December and logs that many days. */
async function setup(
  today = '2026-11-24',
  options: { started?: boolean; daysLogged?: number; lastBackupAt?: string } = {},
) {
  const journal = new InMemoryJournal();
  const clock = new FixedClock(options.daysLogged ? '2026-12-01' : today);
  const ids = new SequentialIds();
  const startPlan = new StartDefaultPlan(journal, journal, clock);
  if (options.started || options.daysLogged) await startPlan.execute('today');
  clock.set(today);
  const logReading = new LogReading(journal, journal, clock, ids);
  for (let d = 0; d < (options.daysLogged ?? 0); d++)
    await logReading.execute({ chapters: 3, date: clock.today().plusDays(-d) });
  if (options.lastBackupAt)
    await journal.saveSettings({ ...journal.journal.settings, lastBackupAt: options.lastBackupAt });
  const result = await render(TodayPage, {
    providers: [
      provideRouter([]),
      provideSpanishLocale(),
      { provide: CheckBackupReminder, useValue: new CheckBackupReminder(journal, clock) },
      {
        provide: PostponeBackupReminder,
        useValue: new PostponeBackupReminder(journal, journal, clock),
      },
      { provide: AdvanceBlocks, useValue: new AdvanceBlocks(journal, journal, clock) },
      { provide: GetSchedule, useValue: new GetSchedule(journal, clock) },
      { provide: GetToday, useValue: new GetToday(journal, clock) },
      { provide: StartDefaultPlan, useValue: startPlan },
      { provide: LogReading, useValue: new LogReading(journal, journal, clock, ids) },
      { provide: UndoReading, useValue: new UndoReading(journal) },
      { provide: Notes, useValue: new Notes(journal, journal, clock, ids) },
      { provide: SetBlockGoal, useValue: new SetBlockGoal(journal, journal, clock) },
      {
        provide: ControlCurrentBlock,
        useValue: new ControlCurrentBlock(journal, journal, clock),
      },
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
    await new StartDefaultPlan(journal, journal, new FixedClock('2026-12-01')).execute('today');
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

describe('TodayPage — backup reminder (LB-013)', () => {
  it('does not remind before 7 days of reading', async () => {
    await setup('2026-12-06', { daysLogged: 6 });

    expect(screen.queryByRole('region', { name: 'Haz un respaldo' })).toBeNull();
  });

  it('reminds after 7 days of reading without a backup, saying there was none', async () => {
    await setup('2026-12-07', { daysLogged: 7 });

    const reminder = screen.getByRole('region', { name: 'Haz un respaldo' });
    expect(reminder.textContent).toContain('Exporta un respaldo');
    expect(reminder.textContent).toContain('Aún no has hecho ningún respaldo.');
  });

  it('says the date of the last backup (LB-031)', async () => {
    await setup('2026-12-07', {
      daysLogged: 7,
      lastBackupAt: new Date(2026, 9, 3, 12).toISOString(),
    });

    expect(screen.getByRole('region', { name: 'Haz un respaldo' }).textContent).toContain(
      'Tu último respaldo fue el 3 de octubre de 2026.',
    );
  });

  it('keeps the reminder when "Ahora no" cannot be saved (LB-031 review)', async () => {
    const { user, journal, fixture } = await setup('2026-12-07', { daysLogged: 7 });
    vi.spyOn(journal, 'saveSettings').mockRejectedValueOnce(new Error('quota'));

    await user.click(screen.getByRole('button', { name: 'Ahora no' }));
    await fixture.whenStable();

    expect(screen.getByRole('region', { name: 'Haz un respaldo' })).toBeTruthy();
  });

  it('postpones it for 7 days with "Ahora no" (LB-031)', async () => {
    const { user, journal } = await setup('2026-12-07', { daysLogged: 7 });

    await user.click(screen.getByRole('button', { name: 'Ahora no' }));

    expect(screen.queryByRole('region', { name: 'Haz un respaldo' })).toBeNull();
    expect(journal.journal.settings.backupReminderPostponedUntil).toBe('2026-12-14');
  });
});

describe('TodayPage — feedback (LB-012 review)', () => {
  it('explains why a log was not saved', async () => {
    const { user, fixture, journal } = await setup('2026-12-03', { daysLogged: 1 });

    await user.click(screen.getByText('Otra cantidad u otro día'));
    const date = screen.getByLabelText('Día') as HTMLInputElement;
    date.value = '2026-11-20';
    date.dispatchEvent(new Event('change'));
    await user.click(screen.getByRole('button', { name: 'Registrar' }));
    await settle(fixture);

    expect(screen.getByText(/Elige un día del libro actual/)).toBeTruthy();
    expect(journal.journal.logs).toHaveLength(1);
  });

  it('says the journey is finished when every cycle is read (LB-019)', async () => {
    const { fixture, journal } = await setup('2026-12-03', { started: true });
    journal.journal = {
      ...journal.journal,
      plan: journal.journal.plan && {
        ...journal.journal.plan,
        bookOrder: ['abdias'],
        cyclesTarget: 1,
      },
      blocks: [
        {
          id: '1:abdias:2026-11-01',
          cycle: 1,
          bookId: 'abdias',
          start: '2026-11-01',
          end: '2026-11-30',
          goalPasses: null,
          status: 'done',
        },
      ],
    };
    await fixture.componentInstance['busy'](() => Promise.resolve());
    await settle(fixture);

    expect(screen.getByText(/Terminaste tu recorrido de lectura/)).toBeTruthy();
  });

  it('keeps the buttons usable and shows an error when saving fails', async () => {
    const { user, fixture, journal } = await setup('2026-12-01', { started: true });
    journal.addLog = () => Promise.reject(new Error('QuotaExceededError'));

    await user.click(screen.getByRole('button', { name: 'Ya leí' }));
    await settle(fixture);

    expect(screen.getByRole('alert').textContent).toContain('No se pudieron leer o guardar');
    expect(screen.getByRole('button', { name: 'Ya leí' })).toHaveProperty('disabled', false);
  });
});

describe('TodayPage — goal (LB-016)', () => {
  it('sets a goal of passes and shows it, then says when it is met', async () => {
    const { user, fixture, journal } = await setup('2026-12-01', { started: true });

    await user.click(screen.getByText('Meta de vueltas'));
    const goal = screen.getByLabelText('Vueltas en este bloque');
    await user.clear(goal);
    await user.type(goal, '5');
    await user.tab();
    await user.click(screen.getByRole('button', { name: 'Guardar meta' }));
    await settle(fixture);

    expect(journal.journal.blocks[0].goalPasses).toBe(5);
    expect(screen.getByText(/Meta: 5 vueltas · llevas 0/)).toBeTruthy();

    await user.click(screen.getByText('Otra cantidad u otro día'));
    const amount = screen.getByLabelText('Capítulos');
    await user.clear(amount);
    await user.type(amount, '5');
    await user.tab();
    await user.click(screen.getByRole('button', { name: 'Registrar' }));
    await settle(fixture);

    expect(screen.getByText(/Cumpliste tu meta de 5 vueltas/)).toBeTruthy();
  });
});

describe('TodayPage — current book (LB-018)', () => {
  it('switches to another book', async () => {
    const { user, fixture } = await setup('2026-12-10', { started: true });

    await user.click(screen.getByText('Cambiar este libro'));
    await user.selectOptions(screen.getByLabelText('Otro libro'), 'rut');
    await user.click(screen.getByRole('button', { name: 'Empezar este libro' }));
    await settle(fixture);

    expect(screen.getByRole('heading', { level: 2, name: 'Rut' })).toBeTruthy();
  });

  it('skips the book and the next one starts', async () => {
    const { user, fixture } = await setup('2026-12-10', { started: true });

    await user.click(screen.getByText('Cambiar este libro'));
    await user.click(screen.getByRole('button', { name: 'Saltar este libro' }));
    await settle(fixture);

    expect(screen.getByRole('heading', { level: 2, name: 'Abdías' })).toBeTruthy();
  });

  it('pauses and resumes the plan', async () => {
    const { user, fixture } = await setup('2026-12-10', { started: true });

    await user.click(screen.getByText('Cambiar este libro'));
    await user.click(screen.getByRole('button', { name: 'Pausar el plan' }));
    await settle(fixture);

    expect(screen.getByRole('region', { name: 'Plan en pausa' }).textContent).toContain(
      'desde el 10 de diciembre',
    );

    await user.click(screen.getByRole('button', { name: 'Reanudar' }));
    await settle(fixture);

    expect(screen.getByRole('region', { name: 'Lectura de hoy' })).toBeTruthy();
  });

  it('moves on after meeting the goal', async () => {
    const { user, fixture, journal } = await setup('2026-12-10', { started: true });
    journal.journal = {
      ...journal.journal,
      blocks: journal.journal.blocks.map((block) => ({ ...block, goalPasses: 1 })),
    };
    await user.click(screen.getByRole('button', { name: 'Ya leí' }));
    await settle(fixture);

    await user.click(screen.getByRole('button', { name: 'Pasar al siguiente libro' }));
    await settle(fixture);

    expect(journal.journal.blocks[0]).toMatchObject({ bookId: 'abdias', status: 'done' });
  });
});
