import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

/**
 * Fixed name, never derived from the URL: every project site of the account shares the
 * github.io origin, and a repository rename must not lose the data (ADR 0002).
 */
export const DATABASE_NAME = 'lectura-biblica';
const VERSION = 2;

export interface LecturaSchema extends DBSchema {
  settings: { key: string; value: unknown };
  plan: { key: string; value: unknown };
  blocks: { key: string; value: { id: string; cycle: number }; indexes: { cycle: number } };
  logs: {
    key: string;
    value: { id: string; date: string; blockId: string; bookId: string };
    indexes: { date: string; blockId: string; bookId: string };
  };
  notes: { key: string; value: { id: string } };
  templates: { key: string; value: { id: string } };
}

export type LecturaDatabase = IDBPDatabase<LecturaSchema>;

export const STORES = ['settings', 'plan', 'blocks', 'logs', 'notes', 'templates'] as const;

/** Opens the app database, creating its stores on first use. */
export function openLecturaDatabase(): Promise<LecturaDatabase> {
  return openDB<LecturaSchema>(DATABASE_NAME, VERSION, {
    // Each step runs once, from the version the device has: a v1 database keeps its data.
    upgrade(db, oldVersion) {
      if (oldVersion < 1) {
        db.createObjectStore('settings');
        db.createObjectStore('plan');
        db.createObjectStore('blocks', { keyPath: 'id' }).createIndex('cycle', 'cycle');
        const logs = db.createObjectStore('logs', { keyPath: 'id' });
        logs.createIndex('date', 'date');
        logs.createIndex('blockId', 'blockId');
        logs.createIndex('bookId', 'bookId');
        db.createObjectStore('notes', { keyPath: 'id' });
      }
      if (oldVersion < 2) db.createObjectStore('templates', { keyPath: 'id' });
    },
  });
}
