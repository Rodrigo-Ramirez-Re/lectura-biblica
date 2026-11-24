import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  {
    path: '',
    pathMatch: 'full',
    title: $localize`:@@reader.nav.today:Hoy`,
    loadComponent: () => import('@lectura/reading-feature-today').then((m) => m.TodayPage),
  },
  {
    path: 'plan',
    title: $localize`:@@reader.nav.plan:Plan`,
    loadComponent: () => import('@lectura/reading-feature-plan').then((m) => m.PlanPage),
  },
  {
    path: 'libros',
    loadChildren: () => import('@lectura/catalog-feature-books').then((m) => m.bookRoutes),
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
