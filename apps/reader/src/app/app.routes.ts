import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  {
    path: '',
    pathMatch: 'full',
    title: $localize`:@@reader.nav.today:Hoy`,
    loadComponent: () => import('./pages/placeholder.page').then((m) => m.PlaceholderPage),
  },
  {
    path: 'plan',
    title: $localize`:@@reader.nav.plan:Plan`,
    loadComponent: () => import('./pages/placeholder.page').then((m) => m.PlaceholderPage),
  },
  {
    path: 'libros',
    title: $localize`:@@reader.nav.books:Libros`,
    loadComponent: () => import('./pages/placeholder.page').then((m) => m.PlaceholderPage),
  },
  {
    path: 'acerca',
    title: $localize`:@@reader.nav.about:Acerca de`,
    loadComponent: () => import('./pages/about.page').then((m) => m.AboutPage),
  },
  {
    path: '**',
    title: $localize`:@@reader.not-found.title:Página no encontrada`,
    loadComponent: () => import('./pages/not-found.page').then((m) => m.NotFoundPage),
  },
];
