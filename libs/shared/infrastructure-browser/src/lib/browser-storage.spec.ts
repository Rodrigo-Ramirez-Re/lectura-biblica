import { IDBFactory } from 'fake-indexeddb';
import 'fake-indexeddb/auto';
import { BrowserStorageGuard } from './browser-storage-guard';
import { DATABASE_NAME, STORES, openLecturaDatabase } from './lectura-database';

beforeEach(() => {
  globalThis.indexedDB = new IDBFactory();
});

describe('app database (LB-010)', () => {
  it('is named lectura-biblica, independent of the URL path', async () => {
    const db = await openLecturaDatabase();

    expect(db.name).toBe(DATABASE_NAME);
    expect(DATABASE_NAME).toBe('lectura-biblica');
    db.close();
  });

  it('creates one store per collection of the data model', async () => {
    const db = await openLecturaDatabase();

    expect([...db.objectStoreNames].sort()).toEqual([...STORES].sort());
    expect([...db.transaction('logs').store.indexNames].sort()).toEqual([
      'blockId',
      'bookId',
      'date',
    ]);
    db.close();
  });
});

function storageManager(persisted: boolean, grants: boolean) {
  return {
    persisted: vi.fn().mockResolvedValue(persisted),
    persist: vi.fn().mockResolvedValue(grants),
  } as unknown as StorageManager;
}

describe('BrowserStorageGuard (LB-010)', () => {
  it('asks the browser to keep the data and reports its answer', async () => {
    const storage = storageManager(false, true);

    expect(await new BrowserStorageGuard(storage).persist()).toBe(true);
    expect(storage.persist).toHaveBeenCalled();
  });

  it('does not ask again once the data is already persistent', async () => {
    const storage = storageManager(true, true);

    expect(await new BrowserStorageGuard(storage).persist()).toBe(true);
    expect(storage.persist).not.toHaveBeenCalled();
  });

  it('reports a refusal or a browser without the API as not persistent', async () => {
    expect(await new BrowserStorageGuard(storageManager(false, false)).persist()).toBe(false);
    expect(await new BrowserStorageGuard(undefined).persist()).toBe(false);
    expect(await new BrowserStorageGuard(undefined).isPersisted()).toBe(false);
  });

  it('reports storage as available when the database opens', async () => {
    expect(await new BrowserStorageGuard(undefined).isAvailable()).toBe(true);
  });

  it('reports storage as unavailable when the browser refuses databases', async () => {
    globalThis.indexedDB = {
      open: () => {
        throw new DOMException('blocked', 'SecurityError');
      },
    } as unknown as IDBFactory;

    expect(await new BrowserStorageGuard(undefined).isAvailable()).toBe(false);
  });
});
