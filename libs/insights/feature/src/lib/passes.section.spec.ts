import type { BookPasses } from '@lectura/insights-domain';
import { provideSpanishLocale } from '@lectura/shared-util-i18n';
import { render, screen } from '@testing-library/angular';
import { PassesSection } from './passes.section';

const book = (bookName: string, complete: number, fraction: number): BookPasses => ({
  bookId: bookName.toLowerCase(),
  bookName,
  chapters: 0,
  complete,
  fraction,
  passes: complete + fraction,
});

describe('PassesSection (LB-025)', () => {
  it('says the passes in words, with the share of the next one', async () => {
    await render(PassesSection, {
      providers: [provideSpanishLocale()],
      inputs: {
        books: [
          book('Abdías', 31, 0),
          book('Rut', 1, 0),
          book('Salmos', 0, 0.4),
          book('Jeremías', 2, 0.999),
        ],
      },
    });

    const rows = screen
      .getAllByRole('listitem')
      .map((row) => row.textContent?.replace(/\s+/g, ' ').trim());
    expect(rows).toEqual([
      'Abdías 31 vueltas',
      'Rut 1 vuelta',
      'Salmos 0 vueltas y 40 % de la siguiente',
      'Jeremías 2 vueltas y 99 % de la siguiente',
    ]);
  });
});
