import { IDBFactory } from 'fake-indexeddb';
import 'fake-indexeddb/auto';
import { planSettings, type Journal } from '@lectura/reading-domain';
import { openDB } from 'idb';
import { StorageGuard } from '@lectura/shared-kernel';
import { IndexedDbJournal } from './indexed-db-journal';

class FakeStorageGuard extends StorageGuard {
  persistCalls = 0;
  isAvailable = async () => true;
  isPersisted = async () => this.persistCalls > 0;
  persist = async () => {
    this.persistCalls++;
    return true;
  };
}

const plan = {
  name: 'Un libro al mes',
  startDate: '2026-12-01',
  chaptersPerDay: 3,
  restDays: [],
  bookOrder: ['abdias', 'filemon'],
  excluded: [],
  defaultBlock: { unit: 'month' as const, value: 1 },
  cyclesTarget: null,
  paceByWeekday: null,
  pausedSince: null,
};
const block = {
  id: 'b1',
  cycle: 1,
  bookId: 'abdias',
  start: '2026-12-01',
  end: '2026-12-31',
  goalPasses: null,
  status: 'active' as const,
};
const log = {
  id: 'l1',
  date: '2026-12-03',
  blockId: 'b1',
  bookId: 'abdias',
  startChapter: 1,
  chaptersRead: 3,
};

beforeEach(() => {
  globalThis.indexedDB = new IDBFactory();
});

describe('IndexedDbJournal (LB-010)', () => {
  it('starts empty', async () => {
    expect(await new IndexedDbJournal(new FakeStorageGuard()).load()).toEqual({
      settings: { lastBackupAt: null },
      plan: null,
      blocks: [],
      logs: [],
      notes: [],
      templates: [],
    });
  });

  it('keeps what was saved across instances, as after closing and reopening the app', async () => {
    const writer = new IndexedDbJournal(new FakeStorageGuard());
    await writer.savePlan(plan);
    await writer.saveBlocks([block]);
    await writer.addLog(log);
    await writer.saveSettings({ lastBackupAt: '2026-12-05T10:00:00.000Z' });

    const journal = await new IndexedDbJournal(new FakeStorageGuard()).load();

    expect(journal.plan).toEqual(plan);
    expect(journal.blocks).toEqual([block]);
    expect(journal.logs).toEqual([log]);
    expect(journal.settings.lastBackupAt).toBe('2026-12-05T10:00:00.000Z');
  });

  it('updates a block saved again with the same id', async () => {
    const journal = new IndexedDbJournal(new FakeStorageGuard());
    await journal.saveBlocks([block]);

    await journal.saveBlocks([{ ...block, status: 'done' }]);

    expect((await journal.load()).blocks).toEqual([{ ...block, status: 'done' }]);
  });

  it('removes a log', async () => {
    const journal = new IndexedDbJournal(new FakeStorageGuard());
    await journal.addLog(log);

    await journal.removeLog('l1');

    expect((await journal.load()).logs).toEqual([]);
  });

  it('replaces everything at once', async () => {
    const journal = new IndexedDbJournal(new FakeStorageGuard());
    await journal.savePlan(plan);
    await journal.addLog(log);
    const replacement: Journal = {
      settings: { lastBackupAt: null },
      plan: { ...plan, chaptersPerDay: 5 },
      blocks: [block],
      logs: [{ ...log, id: 'l2' }],
      notes: [],
      templates: [{ id: 't1', name: 'Mío', settings: planSettings(plan) }],
    };

    await journal.replaceAll(replacement);

    expect(await journal.load()).toEqual(replacement);
  });

  it('asks for persistent storage once, on the first write', async () => {
    const storage = new FakeStorageGuard();
    const journal = new IndexedDbJournal(storage);
    await journal.load();
    expect(storage.persistCalls).toBe(0);

    await journal.savePlan(plan);
    await journal.addLog(log);

    expect(storage.persistCalls).toBe(1);
  });

  it('saves without waiting for the browser to answer the persistence request', async () => {
    const storage = new FakeStorageGuard();
    storage.persist = () => new Promise<boolean>(() => undefined);
    const journal = new IndexedDbJournal(storage);

    await journal.savePlan(plan);

    expect((await journal.load()).plan).toEqual(plan);
  });
});

describe('database upgrade to v2 (LB-014)', () => {
  it('keeps the data of a v1 database and fills the new fields', async () => {
    const v1 = await openDB('lectura-biblica', 1, {
      upgrade(db) {
        db.createObjectStore('settings');
        db.createObjectStore('plan');
        db.createObjectStore('blocks', { keyPath: 'id' }).createIndex('cycle', 'cycle');
        const logs = db.createObjectStore('logs', { keyPath: 'id' });
        logs.createIndex('date', 'date');
        logs.createIndex('blockId', 'blockId');
        logs.createIndex('bookId', 'bookId');
        db.createObjectStore('notes', { keyPath: 'id' });
      },
    });
    const { paceByWeekday, pausedSince, ...v1Plan } = plan;
    await v1.put('plan', v1Plan, 'current');
    await v1.put('blocks', block);
    await v1.put('logs', log);
    v1.close();

    const journal = await new IndexedDbJournal(new FakeStorageGuard()).load();

    expect(journal.plan).toEqual(plan);
    expect(journal.blocks).toEqual([block]);
    expect(journal.logs).toEqual([log]);
    expect(journal.templates).toEqual([]);
  });
});
