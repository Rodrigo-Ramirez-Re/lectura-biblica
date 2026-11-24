/** What the device lets the app keep (ADR 0003). */
export abstract class StorageGuard {
  /** False when the browser refuses local databases (some private modes). */
  abstract isAvailable(): Promise<boolean>;
  /** Asks the browser not to evict the app's data; resolves to whether it agreed. */
  abstract persist(): Promise<boolean>;
  abstract isPersisted(): Promise<boolean>;
}
