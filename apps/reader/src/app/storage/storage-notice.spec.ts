import { provideRouter } from '@angular/router';
import { StorageGuard } from '@lectura/shared-kernel';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { FakeStorageGuard } from '../../testing/fake-storage-guard';
import { StorageNotice } from './storage-notice';

async function renderNotice(available = true) {
  const result = await render(StorageNotice, {
    providers: [
      provideRouter([]),
      { provide: StorageGuard, useValue: new FakeStorageGuard(available) },
    ],
  });
  await result.fixture.whenStable();
  return result;
}

describe('StorageNotice (LB-010)', () => {
  afterEach(() => localStorage.clear());

  it('explains on first use where the data lives and how to protect it', async () => {
    await renderNotice();

    const notice = screen.getByRole('region', { name: 'Tus datos viven en este dispositivo' });
    expect(notice.textContent).toContain('Safari');
    expect(notice.textContent).toContain('respaldos');
  });

  it('links to the install help (LB-030)', async () => {
    await renderNotice();

    expect(screen.getByRole('link', { name: 'Cómo instalarla' }).getAttribute('href')).toBe(
      '/instalar',
    );
  });

  it('closes with "Entendido" and remembers it on this device', async () => {
    await renderNotice();

    await userEvent.setup().click(screen.getByRole('button', { name: 'Entendido' }));

    expect(screen.queryByRole('region')).toBeNull();
    expect(localStorage.getItem('lectura-biblica.data-notice')).toBe('seen');
  });

  it('does not show again once seen', async () => {
    localStorage.setItem('lectura-biblica.data-notice', 'seen');

    await renderNotice();

    expect(screen.queryByText('Tus datos viven en este dispositivo')).toBeNull();
  });

  it('warns that nothing can be saved when the browser refuses storage', async () => {
    await renderNotice(false);

    expect(screen.getByRole('alert').textContent).toContain(
      'No se puede guardar en este dispositivo',
    );
  });
});
