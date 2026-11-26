import { provideRouter } from '@angular/router';
import { render, screen } from '@testing-library/angular';
import { NotFoundPage } from './not-found.page';

describe('NotFoundPage (LB-006)', () => {
  it('says the address does not exist and leads back to Hoy', async () => {
    await render(NotFoundPage, { providers: [provideRouter([])] });

    expect(screen.getByRole('heading', { level: 1, name: 'Página no encontrada' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Ir a Hoy' }).getAttribute('href')).toBe('/');
  });
});
