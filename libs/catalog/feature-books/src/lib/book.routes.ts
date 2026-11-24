import type { ResolveFn, Routes } from '@angular/router';
import { bookCatalog } from '@lectura/catalog-domain';

const bookTitle: ResolveFn<string> = (route) =>
  bookCatalog.find(route.paramMap.get('bookId') ?? '')?.name ??
  $localize`:@@catalog.book.not-found:Libro no encontrado`;

/** Lazy routes for `/libros`; the app needs `withComponentInputBinding()` for `bookId`. */
export const bookRoutes: Routes = [
  {
    path: '',
    title: $localize`:@@catalog.books.title:Libros`,
    loadComponent: () => import('./books.page').then((m) => m.BooksPage),
  },
  {
    path: ':bookId',
    title: bookTitle,
    loadComponent: () => import('./book.page').then((m) => m.BookPage),
  },
];
