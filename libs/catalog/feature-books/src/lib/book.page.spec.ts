import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { provideRouter } from '@angular/router';
import { render, screen } from '@testing-library/angular';
import { BOOK_SECTIONS } from '@lectura/catalog-util-book-sections';
import { BookPage } from './book.page';

@Component({
  template: `<section aria-label="Primera">primera {{ bookId() }}</section>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class FirstSection {
  readonly bookId = input.required<string>();
}

@Component({
  template: `<section aria-label="Segunda">segunda</section>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class SecondSection {}

async function renderBook(bookId: string, withSections = false) {
  const { fixture } = await render(BookPage, {
    inputs: { bookId },
    providers: [
      provideRouter([]),
      ...(withSections
        ? [
            {
              provide: BOOK_SECTIONS,
              multi: true,
              useValue: { order: 2, load: async () => SecondSection },
            },
            {
              provide: BOOK_SECTIONS,
              multi: true,
              useValue: { order: 1, load: async () => FirstSection },
            },
          ]
        : []),
    ],
  });
  await fixture.whenStable();
}

describe('BookPage (LB-009)', () => {
  it('shows the book facts', async () => {
    await renderBook('abdias');

    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Abdías');
    expect(screen.getByText('Antiguo Testamento')).toBeTruthy();
    expect(screen.getByText('1 capítulo')).toBeTruthy();
    expect(screen.getByText('libro 31 de 66')).toBeTruthy();
  });

  it('says the book does not exist, with a way back to the list', async () => {
    await renderBook('xyz');

    expect(screen.getByRole('heading', { level: 1 }).textContent).toContain('Libro no encontrado');
    expect(screen.getByRole('link', { name: 'Ver todos los libros' }).getAttribute('href')).toBe(
      '/libros',
    );
  });

  it('renders the sections other contexts register, in their order, with the book id', async () => {
    await renderBook('salmos', true);

    const sections = screen.getAllByRole('region');
    expect(sections.map((s) => s.getAttribute('aria-label'))).toEqual(['Primera', 'Segunda']);
    expect(sections[0].textContent).toContain('primera salmos');
  });
});
