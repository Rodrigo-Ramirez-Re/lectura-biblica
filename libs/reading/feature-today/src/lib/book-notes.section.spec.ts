import { AdvanceBlocks, Notes, StartDefaultPlan } from '@lectura/reading-application';
import { InMemoryJournal } from '@lectura/reading-domain/testing';
import { FixedClock, SequentialIds } from '@lectura/shared-kernel/testing';
import { provideSpanishLocale } from '@lectura/shared-util-i18n';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { BookNotesSection } from './book-notes.section';

async function setup(canAdd: boolean) {
  const journal = new InMemoryJournal();
  const clock = new FixedClock('2026-12-01');
  await new StartDefaultPlan(journal, journal, clock).execute('today');
  await new AdvanceBlocks(journal, journal, clock).execute();
  const notes = new Notes(journal, journal, clock, new SequentialIds());
  const result = await render(BookNotesSection, {
    inputs: { bookId: 'abdias', canAdd },
    providers: [provideSpanishLocale(), { provide: Notes, useValue: notes }],
  });
  await result.fixture.whenStable();
  const settle = async () => {
    await result.fixture.whenStable();
    await new Promise((resolve) => setTimeout(resolve));
    await result.fixture.whenStable();
  };
  return { ...result, journal, notes, settle, user: userEvent.setup() };
}

describe('BookNotesSection (LB-021)', () => {
  it('writes a note about the book being read', async () => {
    const { user, settle, journal } = await setup(true);

    await user.type(
      screen.getByLabelText('Lo que entendiste y los puntos importantes'),
      'Edom cosechará lo que sembró.',
    );
    await user.click(screen.getByRole('button', { name: 'Guardar nota' }));
    await settle();

    expect(journal.journal.notes[0]).toMatchObject({ bookId: 'abdias', date: '2026-12-01' });
    expect(screen.getByText('Edom cosechará lo que sembró.')).toBeTruthy();
    expect(screen.getByText('1 de diciembre de 2026')).toBeTruthy();
  });

  it('says when a note is empty', async () => {
    const { user, settle, journal } = await setup(true);

    await user.click(screen.getByRole('button', { name: 'Guardar nota' }));
    await settle();

    expect(screen.getByText('La nota está vacía.')).toBeTruthy();
    expect(journal.journal.notes).toEqual([]);
  });

  it('shows notes as text, keeping line breaks and never rendering HTML', async () => {
    const { notes, fixture, settle } = await setup(false);
    await notes.add('<b>Uno</b>\nDos');
    fixture.componentRef.setInput('bookId', 'rut');
    fixture.componentRef.setInput('bookId', 'abdias');
    await settle();

    const text = screen.getByText(/Uno/);
    expect(text.textContent).toBe('<b>Uno</b>\nDos');
    expect(text.querySelector('b')).toBeNull();
    expect(text.className).toContain('whitespace-pre-line');
  });

  it('edits and deletes a note, deleting only after confirming', async () => {
    const { notes, fixture, settle, user, journal } = await setup(false);
    await notes.add('Borrador');
    fixture.componentRef.setInput('bookId', 'rut');
    fixture.componentRef.setInput('bookId', 'abdias');
    await settle();

    await user.click(screen.getByRole('button', { name: 'Editar' }));
    const field = screen.getByLabelText('Editar nota');
    await user.clear(field);
    await user.type(field, 'Versión final');
    await user.click(screen.getByRole('button', { name: 'Guardar' }));
    await settle();
    expect(journal.journal.notes[0].text).toBe('Versión final');

    await user.click(screen.getByRole('button', { name: 'Borrar' }));
    await user.click(screen.getByRole('button', { name: 'Sí, borrar' }));
    await settle();
    expect(journal.journal.notes).toEqual([]);
    expect(screen.getByText('Aún no tienes notas de este libro.')).toBeTruthy();
  });

  it('does not offer to write on the book page', async () => {
    await setup(false);

    expect(screen.queryByRole('button', { name: 'Guardar nota' })).toBeNull();
  });
});
