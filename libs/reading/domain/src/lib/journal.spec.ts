import { SCHEMA_VERSION, emptyJournal } from './journal';

describe('journal (LB-010)', () => {
  it('starts with no plan, no history and no backup', () => {
    expect(emptyJournal).toEqual({
      settings: { lastBackupAt: null },
      plan: null,
      blocks: [],
      logs: [],
      notes: [],
    });
  });

  it('is at schema version 1', () => {
    expect(SCHEMA_VERSION).toBe(1);
  });
});
