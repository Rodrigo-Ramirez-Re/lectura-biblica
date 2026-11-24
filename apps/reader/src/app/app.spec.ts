import { provideRouter } from '@angular/router';
import { render, screen } from '@testing-library/angular';
import { App } from './app';

describe('App (LB-006)', () => {
  it('shows the app name and the four main screens in the navigation', async () => {
    await render(App, { providers: [provideRouter([])] });

    expect(screen.getByText('Lectura bíblica')).toBeTruthy();
    for (const name of ['Hoy', 'Plan', 'Libros', 'Acerca de'])
      expect(screen.getByRole('link', { name })).toBeTruthy();
  });
});
