import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { BOOK_SECTIONS } from '@lectura/catalog-util-book-sections';
import { BookPage } from './book.page';
import { bookRoutes } from './book.routes';
import { BooksPage } from './books.page';

@Component({ template: '' })
class Shell {}

async function navigate(url: string) {
  TestBed.configureTestingModule({
    providers: [
      provideRouter(
        [
          { path: 'libros', children: bookRoutes },
          { path: '', component: Shell },
        ],
        withComponentInputBinding(),
      ),
      { provide: BOOK_SECTIONS, useValue: [] },
    ],
  });
  const harness = await RouterTestingHarness.create();
  const component = await harness.navigateByUrl(url);
  return { component, title: TestBed.inject(Title).getTitle() };
}

describe('book routes (LB-009)', () => {
  it('opens the book list titled "Libros"', async () => {
    const { component, title } = await navigate('/libros');

    expect(component).toBeInstanceOf(BooksPage);
    expect(title).toBe('Libros');
  });

  it("titles a book page with the book's name", async () => {
    const { component, title } = await navigate('/libros/abdias');

    expect(component).toBeInstanceOf(BookPage);
    expect(title).toBe('Abdías');
  });

  it('titles an unknown book as not found', async () => {
    const { title } = await navigate('/libros/xyz');

    expect(title).toBe('Libro no encontrado');
  });
});
