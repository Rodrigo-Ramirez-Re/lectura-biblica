import { StorageGuard } from '@lectura/shared-kernel';

export class FakeStorageGuard extends StorageGuard {
  constructor(
    private readonly available = true,
    private persisted = false,
  ) {
    super();
  }

  isAvailable = async () => this.available;
  isPersisted = async () => this.persisted;
  persist = async () => {
    this.persisted = true;
    return true;
  };
}
