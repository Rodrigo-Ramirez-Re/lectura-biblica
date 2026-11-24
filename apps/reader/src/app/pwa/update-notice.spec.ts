import { SwUpdate, type VersionEvent } from '@angular/service-worker';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { Subject } from 'rxjs';
import { RELOAD_PAGE, UpdateNotice } from './update-notice';

function setup() {
  const versionUpdates = new Subject<VersionEvent>();
  const unrecoverable = new Subject<{ type: 'UNRECOVERABLE_STATE'; reason: string }>();
  const activateUpdate = vi.fn().mockResolvedValue(true);
  const reload = vi.fn();
  const rendering = render(UpdateNotice, {
    providers: [
      { provide: SwUpdate, useValue: { versionUpdates, unrecoverable, activateUpdate } },
      { provide: RELOAD_PAGE, useValue: reload },
    ],
  });
  return { rendering, versionUpdates, unrecoverable, activateUpdate, reload };
}

const versionReady: VersionEvent = {
  type: 'VERSION_READY',
  currentVersion: { hash: 'a' },
  latestVersion: { hash: 'b' },
};

describe('UpdateNotice (LB-007)', () => {
  it('shows nothing while there is no new version', async () => {
    const { rendering } = setup();
    await rendering;

    expect(screen.queryByText('Hay una versión nueva.')).toBeNull();
  });

  it('announces a new version without reloading by itself', async () => {
    const { rendering, versionUpdates, reload, activateUpdate } = setup();
    const { fixture } = await rendering;

    versionUpdates.next(versionReady);
    await fixture.whenStable();

    expect(screen.getByRole('status').textContent).toContain('Hay una versión nueva.');
    expect(activateUpdate).not.toHaveBeenCalled();
    expect(reload).not.toHaveBeenCalled();
  });

  it('activates the new version and reloads when the person presses Recargar', async () => {
    const { rendering, versionUpdates, reload, activateUpdate } = setup();
    const { fixture } = await rendering;
    versionUpdates.next(versionReady);
    await fixture.whenStable();

    await userEvent.setup().click(screen.getByRole('button', { name: 'Recargar' }));

    expect(activateUpdate).toHaveBeenCalled();
    expect(reload).toHaveBeenCalled();
  });

  it('ignores version events other than a ready version', async () => {
    const { rendering, versionUpdates } = setup();
    const { fixture } = await rendering;

    versionUpdates.next({ type: 'VERSION_DETECTED', version: { hash: 'b' } });
    await fixture.whenStable();

    expect(screen.queryByRole('button', { name: 'Recargar' })).toBeNull();
  });

  it('asks to reload when the app can no longer run from its cache', async () => {
    const { rendering, unrecoverable, reload, activateUpdate } = setup();
    const { fixture } = await rendering;

    unrecoverable.next({ type: 'UNRECOVERABLE_STATE', reason: 'hash mismatch' });
    await fixture.whenStable();
    await userEvent.setup().click(screen.getByRole('button', { name: 'Recargar' }));

    expect(screen.getByText(/necesita recargarse/)).toBeTruthy();
    expect(activateUpdate).not.toHaveBeenCalled();
    expect(reload).toHaveBeenCalled();
  });
});
