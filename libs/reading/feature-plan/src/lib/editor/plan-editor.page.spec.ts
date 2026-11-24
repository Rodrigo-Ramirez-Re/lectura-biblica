import { Router, provideRouter } from '@angular/router';
import { GetPlan, StartDefaultPlan, UpdatePlan } from '@lectura/reading-application';
import { InMemoryJournal } from '@lectura/reading-domain/testing';
import { FixedClock } from '@lectura/shared-kernel/testing';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { PlanEditorPage } from './plan-editor.page';

async function setup() {
  const journal = new InMemoryJournal();
  await new StartDefaultPlan(journal, journal, new FixedClock('2026-12-01')).execute('today');
  const result = await render(PlanEditorPage, {
    providers: [
      provideRouter([]),
      { provide: GetPlan, useValue: new GetPlan(journal) },
      { provide: UpdatePlan, useValue: new UpdatePlan(journal, journal) },
    ],
  });
  await result.fixture.whenStable();
  const navigate = vi
    .spyOn(result.fixture.debugElement.injector.get(Router), 'navigateByUrl')
    .mockResolvedValue(true);
  return { ...result, journal, navigate, user: userEvent.setup() };
}

const setNumber = async (
  user: ReturnType<typeof userEvent.setup>,
  label: string,
  value: string,
) => {
  const input = screen.getByLabelText(label);
  await user.clear(input);
  await user.type(input, value);
  await user.tab();
};

describe('PlanEditorPage — pace (LB-015)', () => {
  it('shows the plan name and pace with save and cancel', async () => {
    await setup();

    expect(screen.getByLabelText('Nombre del plan')).toHaveProperty('value', 'Un libro al mes');
    expect(screen.getByLabelText('Capítulos al día')).toHaveProperty('value', '3');
    expect(screen.getByRole('button', { name: 'Guardar cambios' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Cancelar' }).getAttribute('href')).toBe('/plan');
  });

  it('saves a new daily pace and a rest day, then returns to Plan', async () => {
    const { user, journal, navigate } = await setup();

    await setNumber(user, 'Capítulos al día', '4');
    await user.click(screen.getByRole('checkbox', { name: 'domingo' }));
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    expect(journal.journal.plan).toMatchObject({ chaptersPerDay: 4, restDays: [0] });
    expect(navigate).toHaveBeenCalledWith('/plan');
  });

  it('sets a different pace per weekday, starting from the current one', async () => {
    const { user, journal } = await setup();

    await user.click(screen.getByRole('radio', { name: 'Distinto cada día' }));
    await setNumber(user, 'sábado', '5');
    await setNumber(user, 'domingo', '0');
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    expect(journal.journal.plan?.paceByWeekday).toEqual([0, 3, 3, 3, 3, 3, 5]);
  });

  it('refuses a week without reading days and says why', async () => {
    const { user, journal, navigate } = await setup();

    for (const day of ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'])
      await user.click(screen.getByRole('checkbox', { name: day }));
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    expect(screen.getByRole('alert').textContent).toContain('al menos un día de lectura');
    expect(journal.journal.plan?.restDays).toEqual([]);
    expect(navigate).not.toHaveBeenCalled();
  });

  it('renames the plan', async () => {
    const { user, journal } = await setup();

    await user.clear(screen.getByLabelText('Nombre del plan'));
    await user.type(screen.getByLabelText('Nombre del plan'), 'Mi plan');
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    expect(journal.journal.plan?.name).toBe('Mi plan');
  });
});
