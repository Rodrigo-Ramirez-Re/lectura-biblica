import { AdvanceBlocks, GetSchedule, StartDefaultPlan } from '@lectura/reading-application';
import { InMemoryJournal } from '@lectura/reading-domain/testing';
import { FixedClock, SequentialIds } from '@lectura/shared-kernel/testing';
import { provideSpanishLocale } from '@lectura/shared-util-i18n';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { TodayPage } from './today.page';

async function setup(today = '2026-11-24', journal = new InMemoryJournal()) {
  const clock = new FixedClock(today);
  const ids = new SequentialIds();
  const result = await render(TodayPage, {
    providers: [
      provideSpanishLocale(),
      { provide: AdvanceBlocks, useValue: new AdvanceBlocks(journal, journal, clock, ids) },
      { provide: GetSchedule, useValue: new GetSchedule(journal, clock) },
      { provide: StartDefaultPlan, useValue: new StartDefaultPlan(journal, journal, clock, ids) },
    ],
  });
  await result.fixture.whenStable();
  return { ...result, journal, user: userEvent.setup() };
}

describe('TodayPage (LB-011)', () => {
  it('welcomes a new reader with the default plan', async () => {
    await setup();

    const welcome = screen.getByRole('region', { name: 'Empieza con «Un libro al mes»' });
    expect(welcome.textContent).toContain('3 capítulos al día');
    expect(welcome.textContent).toContain('un solo libro');
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
    await fixture.whenStable();

    expect(journal.journal.plan?.startDate).toBe('2026-11-24');
    expect(screen.getByRole('heading', { level: 2, name: 'Abdías' })).toBeTruthy();
    expect(screen.getByText(/Del 24 de noviembre al 30 de noviembre de 2026/)).toBeTruthy();
  });

  it('starts next month and says when the plan begins', async () => {
    const { user, fixture, journal } = await setup('2026-11-24');

    await user.click(screen.getByRole('radio', { name: /El 1 de diciembre/ }));
    await user.click(screen.getByRole('button', { name: 'Empezar' }));
    await fixture.whenStable();

    expect(journal.journal.plan?.startDate).toBe('2026-12-01');
    expect(screen.getByText(/Tu plan empieza el 1 de diciembre con Abdías/)).toBeTruthy();
  });
});
