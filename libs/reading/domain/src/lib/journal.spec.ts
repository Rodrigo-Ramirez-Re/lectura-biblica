import { SCHEMA_VERSION, emptyJournal } from './journal';

describe('journal (LB-010)', () => {
  it('starts with no plan, no history and no backup', () => {
    expect(emptyJournal).toEqual({
      settings: { lastBackupAt: null },
      plan: null,
      blocks: [],
      logs: [],
      notes: [],
      templates: [],
    });
  });

  it('is at schema version 2', () => {
    expect(SCHEMA_VERSION).toBe(2);
  });
});
