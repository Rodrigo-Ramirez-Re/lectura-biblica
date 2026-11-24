import { bookCatalog } from '@lectura/catalog-domain';
import { LocalDate } from '@lectura/shared-kernel';
import type { BlockRecord } from './journal';
import { defaultPlan, validatePlan } from './reading-plan';
import { advanceBlocks, monthlyBlockEnd, projectSchedule } from './schedule';

const day = (iso: string) => {
  const parsed = LocalDate.parse(iso);
  if (!parsed.ok) throw new Error(iso);
  return parsed.value;
};

const plan = (start = '2026-12-01') => defaultPlan(day(start), bookCatalog);

let counter = 0;
const newId = () => `b${++counter}`;
beforeEach(() => (counter = 0));

describe('default plan (LB-011)', () => {
  it('reads 3 chapters a day, a month per book, fewest chapters first', () => {
    const value = plan();

    expect(value.name).toBe('Un libro al mes');
    expect(value.chaptersPerDay).toBe(3);
    expect(value.defaultBlock).toEqual({ unit: 'month', value: 1 });
    expect(value.bookOrder.slice(0, 6)).toEqual([
      'abdias',
      'filemon',
      '2juan',
      '3juan',
      'judas',
      'hageo',
    ]);
    expect(value.bookOrder.slice(-2)).toEqual(['isaias', 'salmos']);
  });

  it('is a valid plan', () => {
    expect(validatePlan(plan(), bookCatalog).ok).toBe(true);
  });

  it.each([0, -1, 2.5])('rejects a pace of %s chapters a day', (chaptersPerDay) => {
    expect(validatePlan({ ...plan(), chaptersPerDay }, bookCatalog)).toEqual({
      ok: false,
      error: 'invalid-pace',
    });
  });

  it.each([
    ['unknown books', ['abdias', 'xyz']],
    ['repeated books', ['abdias', 'abdias']],
    ['no books', []],
  ])('rejects an order with %s', (_, bookOrder) => {
    expect(validatePlan({ ...plan(), bookOrder }, bookCatalog)).toEqual({
      ok: false,
      error: 'invalid-order',
    });
  });
});

describe('monthly blocks (LB-011)', () => {
  it('end with the calendar month', () => {
    expect(monthlyBlockEnd(day('2026-12-01'), 1, 3).toString()).toBe('2026-12-31');
  });

  it('end with the month even when they start mid-month', () => {
    expect(monthlyBlockEnd(day('2026-11-24'), 1, 3).toString()).toBe('2026-11-30');
  });

  it('grow by whole months until one pass fits: Salmos takes two at 3 a day', () => {
    expect(monthlyBlockEnd(day('2032-03-01'), 150, 3).toString()).toBe('2032-04-30');
  });

  it('fit Isaías in February at 3 a day', () => {
    expect(monthlyBlockEnd(day('2027-02-01'), 66, 3).toString()).toBe('2027-02-28');
  });
});

describe('schedule (LB-011)', () => {
  it('starts with Abdías in December and Filemón in January', () => {
    const [first, second] = projectSchedule(plan(), [], bookCatalog);

    expect([first.bookId, first.start.toString(), first.end.toString()]).toEqual([
      'abdias',
      '2026-12-01',
      '2026-12-31',
    ]);
    expect([second.bookId, second.start.toString(), second.end.toString()]).toEqual([
      'filemon',
      '2027-01-01',
      '2027-01-31',
    ]);
  });

  it('runs a partial first month to its end', () => {
    const [first] = projectSchedule(plan('2026-11-24'), [], bookCatalog);

    expect([first.start.toString(), first.end.toString()]).toEqual(['2026-11-24', '2026-11-30']);
  });

  it('lasts 67 months for the 66 books of the default plan', () => {
    const blocks = projectSchedule(plan(), [], bookCatalog);
    const first = blocks[0].start;
    const last = blocks[blocks.length - 1].end;

    expect(blocks).toHaveLength(66);
    expect(first.monthsSpannedUntil(last)).toBe(67);
    expect(blocks[blocks.length - 1].bookId).toBe('salmos');
  });

  it('leaves no gap and no overlap between blocks', () => {
    const blocks = projectSchedule(plan(), [], bookCatalog);

    for (let i = 1; i < blocks.length; i++)
      expect(blocks[i - 1].end.plusDays(1).equals(blocks[i].start)).toBe(true);
  });

  it('keeps recorded blocks and projects the rest after them', () => {
    const recorded: BlockRecord[] = [
      {
        id: 'r1',
        cycle: 1,
        bookId: 'judas',
        start: '2026-12-01',
        end: '2026-12-31',
        goalPasses: null,
        status: 'done',
      },
    ];

    const blocks = projectSchedule(plan(), recorded, bookCatalog);

    expect(blocks[0]).toMatchObject({ bookId: 'judas', id: 'r1' });
    expect(blocks[1]).toMatchObject({ bookId: 'abdias', id: null });
    expect(blocks[1].start.toString()).toBe('2027-01-01');
    expect(blocks.filter((block) => block.bookId === 'judas')).toHaveLength(1);
  });
});

describe('advancing blocks (LB-011)', () => {
  it('records the first block as active once the plan has started', () => {
    expect(advanceBlocks(plan(), [], bookCatalog, day('2026-12-03'), newId)).toEqual([
      {
        id: 'b1',
        cycle: 1,
        bookId: 'abdias',
        start: '2026-12-01',
        end: '2026-12-31',
        goalPasses: null,
        status: 'active',
      },
    ]);
  });

  it('records nothing before the plan starts', () => {
    expect(advanceBlocks(plan(), [], bookCatalog, day('2026-11-30'), newId)).toEqual([]);
  });

  it('closes the finished block and starts the next one', () => {
    const [first] = advanceBlocks(plan(), [], bookCatalog, day('2026-12-03'), newId);

    const changes = advanceBlocks(plan(), [first], bookCatalog, day('2027-01-01'), newId);

    expect(changes).toEqual([
      { ...first, status: 'done' },
      expect.objectContaining({ bookId: 'filemon', start: '2027-01-01', status: 'active' }),
    ]);
  });

  it('records the blocks of months when the app was not opened, with their book and dates', () => {
    const changes = advanceBlocks(plan(), [], bookCatalog, day('2027-03-10'), newId);

    expect(changes.map((block) => [block.bookId, block.status])).toEqual([
      ['abdias', 'done'],
      ['filemon', 'done'],
      ['2juan', 'done'],
      ['3juan', 'active'],
    ]);
  });

  it('changes nothing when everything is up to date', () => {
    const recorded = advanceBlocks(plan(), [], bookCatalog, day('2026-12-03'), newId);

    expect(advanceBlocks(plan(), recorded, bookCatalog, day('2026-12-20'), newId)).toEqual([]);
  });
});
