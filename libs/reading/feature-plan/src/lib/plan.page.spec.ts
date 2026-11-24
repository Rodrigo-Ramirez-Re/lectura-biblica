import { provideRouter } from '@angular/router';
import { AdvanceBlocks, GetSchedule, StartDefaultPlan } from '@lectura/reading-application';
import { InMemoryJournal } from '@lectura/reading-domain/testing';
import { FixedClock, SequentialIds } from '@lectura/shared-kernel/testing';
import { provideSpanishLocale } from '@lectura/shared-util-i18n';
import { render, screen, within } from '@testing-library/angular';
import { PlanPage } from './plan.page';

async function setup(withPlan: boolean) {
  const journal = new InMemoryJournal();
  const clock = new FixedClock('2026-12-01');
  const ids = new SequentialIds();
  if (withPlan) {
    await new StartDefaultPlan(journal, journal, clock, ids).execute('today');
    clock.set('2027-01-15');
    await new AdvanceBlocks(journal, journal, clock, ids).execute();
  }
  const result = await render(PlanPage, {
    providers: [
      provideRouter([]),
      provideSpanishLocale(),
      { provide: AdvanceBlocks, useValue: new AdvanceBlocks(journal, journal, clock, ids) },
      { provide: GetSchedule, useValue: new GetSchedule(journal, clock) },
    ],
  });
  await result.fixture.whenStable();
  return result;
}

describe('PlanPage (LB-011)', () => {
  it('summarises the plan and the length of the cycle', async () => {
    await setup(true);

    const summary = screen.getByRole('region', { name: 'Un libro al mes' });
    expect(summary.textContent).toContain('3 capítulos al día');
    expect(summary.textContent).toContain('66 libros en 67 meses');
    expect(summary.textContent).toContain('del 1 de diciembre de 2026');
  });

  it('lists every block with its dates and marks past, current and upcoming', async () => {
    await setup(true);

    const items = within(screen.getByRole('region', { name: 'Libro por libro' })).getAllByRole(
      'listitem',
    );
    expect(items).toHaveLength(66);
    expect(items[0].textContent).toContain('Abdías');
    expect(items[0].textContent).toContain('Terminado');
    expect(items[1].textContent).toContain('Filemón');
    expect(items[1].getAttribute('aria-current')).toBe('step');
    expect(items[2].textContent).toContain('Próximo');
    expect(items[65].textContent).toContain('Salmos');
  });

  it('sends a reader without a plan to Hoy', async () => {
    await setup(false);

    expect(screen.getByText('Todavía no tienes un plan de lectura.')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Empezar en Hoy' }).getAttribute('href')).toBe('/');
  });
});
