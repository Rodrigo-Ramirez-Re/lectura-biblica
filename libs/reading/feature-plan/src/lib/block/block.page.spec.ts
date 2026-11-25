import { provideRouter } from '@angular/router';
import {
  AdvanceBlocks,
  EditLogs,
  GetBlockHistory,
  LogReading,
  StartDefaultPlan,
} from '@lectura/reading-application';
import { InMemoryJournal } from '@lectura/reading-domain/testing';
import { LocalDate } from '@lectura/shared-kernel';
import { FixedClock, SequentialIds } from '@lectura/shared-kernel/testing';
import { provideSpanishLocale } from '@lectura/shared-util-i18n';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { BlockPage } from './block.page';

const day = (iso: string) => {
  const parsed = LocalDate.parse(iso);
  if (!parsed.ok) throw new Error(iso);
  return parsed.value;
};

async function setup() {
  const journal = new InMemoryJournal();
  const clock = new FixedClock('2026-12-01');
  await new StartDefaultPlan(journal, journal, clock).execute('today');
  clock.set('2026-12-03');
  await new AdvanceBlocks(journal, journal, clock).execute();
  const log = new LogReading(journal, journal, clock, new SequentialIds());
  await log.execute({ chapters: 3, date: day('2026-12-01') });
  await log.execute({ chapters: 2, date: day('2026-12-02') });
  const result = await render(BlockPage, {
    inputs: { blockId: journal.journal.blocks[0].id },
    providers: [
      provideRouter([]),
      provideSpanishLocale(),
      { provide: GetBlockHistory, useValue: new GetBlockHistory(journal) },
      { provide: EditLogs, useValue: new EditLogs(journal, journal, clock) },
    ],
  });
  await result.fixture.whenStable();
  const settle = async () => {
    await result.fixture.whenStable();
    await new Promise((resolve) => setTimeout(resolve));
    await result.fixture.whenStable();
  };
  return { ...result, journal, settle, user: userEvent.setup() };
}

describe('BlockPage (LB-020)', () => {
  it('shows the book, its passes and every log, newest first', async () => {
    await setup();

    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Abdías');
    expect(screen.getByText(/5 vueltas completas/)).toBeTruthy();
    const items = screen.getAllByRole('listitem');
    expect(items[0].textContent).toContain('miércoles 2 de diciembre');
    expect(items[0].textContent).toContain('2 capítulos');
    expect(items[1].textContent).toContain('martes 1 de diciembre');
  });

  it('edits a log', async () => {
    const { user, journal, settle } = await setup();

    await user.click(screen.getByRole('button', { name: 'Editar el registro del 2026-12-02' }));
    const amount = screen.getByLabelText('Capítulos leídos');
    await user.clear(amount);
    await user.type(amount, '4');
    await user.tab();
    await user.click(screen.getByRole('button', { name: 'Guardar' }));
    await settle();

    expect(journal.journal.logs.find((l) => l.date === '2026-12-02')?.chaptersRead).toBe(4);
    expect(screen.getByText(/7 vueltas completas/)).toBeTruthy();
  });

  it('deletes a log after confirming', async () => {
    const { user, journal, settle } = await setup();

    await user.click(screen.getByRole('button', { name: 'Borrar el registro del 2026-12-01' }));
    await user.click(screen.getByRole('button', { name: 'Sí, borrar' }));
    await settle();

    expect(journal.journal.logs.map((l) => l.date)).toEqual(['2026-12-02']);
  });

  it('explains why a change is refused and keeps the log', async () => {
    const { user, journal, settle } = await setup();

    await user.click(screen.getByRole('button', { name: 'Editar el registro del 2026-12-02' }));
    const date = screen.getByLabelText('Día del registro') as HTMLInputElement;
    date.value = '2026-12-09';
    date.dispatchEvent(new Event('change'));
    await user.click(screen.getByRole('button', { name: 'Guardar' }));
    await settle();

    expect(screen.getByRole('alert').textContent).toContain('todavía no llega');
    expect(journal.journal.logs.find((l) => l.chaptersRead === 2)?.date).toBe('2026-12-02');
  });
});
