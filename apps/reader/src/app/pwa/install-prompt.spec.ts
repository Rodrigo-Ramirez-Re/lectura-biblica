import { TestBed } from '@angular/core/testing';
import { InstallPrompt } from './install-prompt';

function offerToInstall(outcome: 'accepted' | 'dismissed') {
  const prompt = vi.fn(async () => undefined);
  const event = Object.assign(new Event('beforeinstallprompt'), {
    prompt,
    userChoice: Promise.resolve({ outcome }),
  });
  window.dispatchEvent(event);
  return prompt;
}

describe('InstallPrompt (LB-030)', () => {
  let service: InstallPrompt;

  beforeEach(() => {
    service = TestBed.inject(InstallPrompt);
  });

  it('cannot install until the browser offers it', () => {
    expect(service.canInstall()).toBe(false);
    expect(service.installed()).toBe(false);
  });

  it('keeps the browser offer and opens its dialog on install', async () => {
    const prompt = offerToInstall('accepted');
    expect(service.canInstall()).toBe(true);

    await expect(service.install()).resolves.toBe(true);

    expect(prompt).toHaveBeenCalledOnce();
    expect(service.installed()).toBe(true);
    expect(service.canInstall()).toBe(false);
  });

  it('can be offered again after the person says no', async () => {
    offerToInstall('dismissed');

    await expect(service.install()).resolves.toBe(false);

    expect(service.installed()).toBe(false);
    expect(service.canInstall()).toBe(false);
  });

  it('answers no when the browser refuses to open its dialog', async () => {
    offerToInstall('accepted').mockRejectedValueOnce(new DOMException('', 'NotAllowedError'));

    await expect(service.install()).resolves.toBe(false);

    expect(service.installed()).toBe(false);
  });

  it('knows when the app was installed from the browser menu', () => {
    offerToInstall('accepted');

    window.dispatchEvent(new Event('appinstalled'));

    expect(service.installed()).toBe(true);
    expect(service.canInstall()).toBe(false);
  });
});
