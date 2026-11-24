import { StorageGuard } from '@lectura/shared-kernel';
import { openLecturaDatabase } from './lectura-database';

export class BrowserStorageGuard extends StorageGuard {
  constructor(
    private readonly storage: StorageManager | undefined = globalThis.navigator?.storage,
  ) {
    super();
  }

  async isAvailable(): Promise<boolean> {
    try {
      (await openLecturaDatabase()).close();
      return true;
    } catch {
      return false;
    }
  }

  async persist(): Promise<boolean> {
    if (!this.storage?.persist) return false;
    try {
      return (await this.storage.persisted()) || (await this.storage.persist());
    } catch {
      return false;
    }
  }

  async isPersisted(): Promise<boolean> {
    try {
      return (await this.storage?.persisted?.()) ?? false;
    } catch {
      return false;
    }
  }
}
