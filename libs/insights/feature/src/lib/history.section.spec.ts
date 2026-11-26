import { provideRouter } from '@angular/router';
import { ExportHistory } from '@lectura/insights-application';
import type { HistoryMonth } from '@lectura/insights-domain';
import { InMemoryJournal } from '@lectura/reading-domain/testing';
import { FixedClock, InMemoryFileSaver } from '@lectura/shared-kernel/testing';
import { provideSpanishLocale } from '@lectura/shared-util-i18n';
import { render, screen } from '@testing-library/angular';
import { HistorySection } from './history.section';

const months: HistoryMonth[] = [
  {
    year: 2027,
    month: 1,
    chapters: 31,
    books: [
      {
        bookId: 'abdias',
        bookName: 'Abdías',
        chapters: 6,
        passes: 6,
        goal: { kind: 'met', goal: 5, passes: 6 },
        notes: 2,
      },
      {
        bookId: 'rut',
        bookName: 'Rut',
        chapters: 4,
        passes: 1,
        goal: { kind: 'in-progress', goal: 3, passes: 1 },
        notes: 1,
      },
      {
        bookId: 'salmos',
        bookName: 'Salmos',
        chapters: 21,
        passes: 0.14,
        goal: { kind: 'missed', goal: 1, passes: 0.14 },
        notes: 0,
      },
    ],
  },
];

describe('HistorySection (LB-028)', () => {
  it('says the passes, the goal of a block ending that month and the notes', async () => {
    await render(HistorySection, {
      providers: [
        provideRouter([]),
        provideSpanishLocale(),
        {
          provide: ExportHistory,
          useValue: new ExportHistory(
            new InMemoryJournal(),
            new FixedClock('2027-01-10'),
            new InMemoryFileSaver(),
          ),
        },
      ],
      inputs: { months },
    });

    const items = screen.getAllByRole('listitem').map((item) => item.textContent?.trim());
    expect(items).toEqual([
      'Abdías · 6 vueltas · meta de 5 vueltas: cumplida · 2 notas',
      'Rut · 1 vuelta · meta de 3 vueltas: en curso · 1 nota',
      'Salmos · 0.1 vueltas · meta de 1 vuelta: no cumplida',
    ]);
    expect(screen.getByRole('rowheader', { name: 'Enero de 2027' })).toBeTruthy();
  });
});
