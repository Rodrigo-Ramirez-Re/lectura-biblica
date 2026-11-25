import { InMemoryJournal } from '@lectura/reading-domain/testing';
import { FixedClock, SequentialIds } from '@lectura/shared-kernel/testing';
import { Notes } from './notes.use-cases';
import { AdvanceBlocks, StartDefaultPlan } from './plan.use-cases';

async function setup() {
  const journal = new InMemoryJournal();
  const clock = new FixedClock('2026-12-01');
  await new StartDefaultPlan(journal, journal, clock).execute('today');
  await new AdvanceBlocks(journal, journal, clock).execute();
  return { journal, clock, notes: new Notes(journal, journal, clock, new SequentialIds()) };
}

describe('Notes (LB-021)', () => {
  it('adds a note to the book being read today', async () => {
    const { notes, journal } = await setup();

    await notes.add('  Edom cosechará lo que sembró.  ');

    expect(journal.journal.notes).toEqual([
      {
        id: 'id-1',
        blockId: journal.journal.blocks[0].id,
        bookId: 'abdias',
        date: '2026-12-01',
        text: 'Edom cosechará lo que sembró.',
      },
    ]);
  });

  it('lists the notes of a book, newest first', async () => {
    const { notes, clock } = await setup();
    await notes.add('Primera');
    clock.set('2026-12-02');
    await notes.add('Segunda');

    expect((await notes.forBook('abdias')).map((n) => n.text)).toEqual(['Segunda', 'Primera']);
    expect(await notes.forBook('rut')).toEqual([]);
  });

  it('edits and removes a note', async () => {
    const { notes, journal } = await setup();
    await notes.add('Borrador');

    await notes.edit('id-1', 'Versión final');
    expect(journal.journal.notes[0].text).toBe('Versión final');

    await notes.remove('id-1');
    expect(journal.journal.notes).toEqual([]);
  });

  it('refuses an empty note', async () => {
    const { notes } = await setup();

    expect(await notes.add('   ')).toEqual({ ok: false, error: 'empty-note' });
  });
});
