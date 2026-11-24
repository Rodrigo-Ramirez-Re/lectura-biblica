import { provideRouter } from '@angular/router';
import { provideServiceWorker } from '@angular/service-worker';
import { render, screen } from '@testing-library/angular';
import { StorageGuard } from '@lectura/shared-kernel';
import { FakeStorageGuard } from '../testing/fake-storage-guard';
import { App } from './app';

describe('App (LB-006)', () => {
  it('shows the app name and the four main screens in the navigation', async () => {
    await render(App, {
      providers: [
        provideRouter([]),
        provideServiceWorker('ngsw-worker.js', { enabled: false }),
        { provide: StorageGuard, useValue: new FakeStorageGuard() },
      ],
    });

    expect(screen.getByText('Lectura bíblica')).toBeTruthy();
    for (const name of ['Hoy', 'Plan', 'Libros', 'Acerca de'])
      expect(screen.getByRole('link', { name })).toBeTruthy();
  });
});
