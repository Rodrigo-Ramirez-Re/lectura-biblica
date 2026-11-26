import { DOCUMENT, DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { detectPlatform, type Platform } from './platform';

/** Chrome's and Edge's offer to install; not in TypeScript's DOM types. */
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  readonly userChoice: Promise<{ readonly outcome: 'accepted' | 'dismissed' }>;
}

/**
 * Keeps the browser's install offer so "Instalar ahora" can open it later (LB-030). The browser
 * fires `beforeinstallprompt` once, early, so the app creates this service at start-up. Its default
 * is not prevented: the browser's own install hint still shows.
 */
@Injectable({ providedIn: 'root' })
export class InstallPrompt {
  private readonly window = inject(DOCUMENT).defaultView;
  private readonly offer = signal<BeforeInstallPromptEvent | null>(null);

  readonly platform: Platform = detectPlatform(
    this.window?.navigator.userAgent ?? '',
    this.window?.navigator.maxTouchPoints ?? 0,
  );
  readonly installed = signal(this.runsInstalled());
  readonly canInstall = computed(() => this.offer() !== null && !this.installed());

  constructor() {
    const keepOffer = (event: Event) => this.offer.set(event as BeforeInstallPromptEvent);
    const markInstalled = () => {
      this.offer.set(null);
      this.installed.set(true);
    };
    this.window?.addEventListener('beforeinstallprompt', keepOffer);
    this.window?.addEventListener('appinstalled', markInstalled);
    inject(DestroyRef).onDestroy(() => {
      this.window?.removeEventListener('beforeinstallprompt', keepOffer);
      this.window?.removeEventListener('appinstalled', markInstalled);
    });
  }

  /** Opens the browser's install dialog; true when the person accepted. */
  async install(): Promise<boolean> {
    const offer = this.offer();
    if (!offer) return false;
    // An offer can be shown only once; the browser fires a new one if the person says no.
    this.offer.set(null);
    try {
      await offer.prompt();
    } catch {
      // The browser may refuse to show it; the steps on the page still work.
      return false;
    }
    const { outcome } = await offer.userChoice;
    if (outcome === 'accepted') this.installed.set(true);
    return outcome === 'accepted';
  }

  private runsInstalled(): boolean {
    const navigator = this.window?.navigator as (Navigator & { standalone?: boolean }) | undefined;
    return (
      this.window?.matchMedia?.('(display-mode: standalone)').matches === true ||
      navigator?.standalone === true
    );
  }
}
