import {
  AdvanceBlocks,
  GetBookProgress,
  LogReading,
  StartDefaultPlan,
} from '@lectura/reading-application';
import { InMemoryJournal } from '@lectura/reading-domain/testing';
import { FixedClock, SequentialIds } from '@lectura/shared-kernel/testing';
import { provideSpanishLocale } from '@lectura/shared-util-i18n';
import { render, screen } from '@testing-library/angular';
import { BookProgressSection } from './book-progress.section';

async function renderFor(bookId: string, chapters: number[]) {
  const journal = new InMemoryJournal();
  const clock = new FixedClock('2026-12-01');
  const ids = new SequentialIds();
  await new StartDefaultPlan(journal, journal, clock, ids).execute('today');
  await new AdvanceBlocks(journal, journal, clock, ids).execute();
  for (const amount of chapters)
    await new LogReading(journal, journal, clock, ids).execute({ chapters: amount });

  const result = await render(BookProgressSection, {
    inputs: { bookId },
    providers: [
      provideSpanishLocale(),
      { provide: GetBookProgress, useValue: new GetBookProgress(journal) },
    ],
  });
  await result.fixture.whenStable();
  return screen.getByRole('region', { name: 'Tu lectura' });
}

describe('BookProgressSection (LB-012)', () => {
  it('shows the passes of the book and the blocks where it was read', async () => {
    const section = await renderFor('abdias', [3, 2]);

    expect(section.textContent).toContain('5 vueltas completas');
    expect(section.textContent).toContain('1 dic 2026');
    expect(section.textContent).toContain('5 capítulos');
  });

  it('says when the book has not been read yet', async () => {
    const section = await renderFor('salmos', []);

    expect(section.textContent).toContain('Aún no has leído este libro.');
  });
});
