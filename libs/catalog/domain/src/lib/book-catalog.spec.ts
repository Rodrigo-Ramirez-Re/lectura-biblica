import { bookCatalog } from './book-catalog';
import { orderTemplates } from './order-templates';

const chapters = (list: readonly { chapters: number }[]) =>
  list.reduce((total, book) => total + book.chapters, 0);

describe('book catalog (LB-009)', () => {
  it('has the 66 books of the Protestant canon', () => {
    expect(bookCatalog.size).toBe(66);
  });

  it('has 39 Old Testament books with 929 chapters', () => {
    const old = bookCatalog.inTestament('old');
    expect(old).toHaveLength(39);
    expect(chapters(old)).toBe(929);
  });

  it('has 27 New Testament books with 260 chapters', () => {
    const nt = bookCatalog.inTestament('new');
    expect(nt).toHaveLength(27);
    expect(chapters(nt)).toBe(260);
  });

  it('has 1,189 chapters in total', () => {
    expect(chapters(bookCatalog.all())).toBe(1189);
  });

  it('gives every book a unique lowercase ASCII id', () => {
    const ids = bookCatalog.all().map((book) => book.id);
    expect(new Set(ids).size).toBe(66);
    for (const id of ids) expect(id).toMatch(/^[0-9a-z]+$/);
  });

  it('numbers the books 1 to 66 in canonical order', () => {
    expect(bookCatalog.all().map((book) => book.position)).toEqual(
      Array.from({ length: 66 }, (_, i) => i + 1),
    );
    expect(bookCatalog.all()[0].name).toBe('Génesis');
    expect(bookCatalog.all()[65].name).toBe('Apocalipsis');
  });

  it.each([
    ['abdias', 'Abdías', 1, 'old', 31],
    ['salmos', 'Salmos', 150, 'old', 19],
    ['cantares', 'Cantares', 8, 'old', 22],
    ['filemon', 'Filemón', 1, 'new', 57],
    ['3juan', '3 Juan', 1, 'new', 64],
  ])('describes %s with its Reina-Valera name', (id, name, count, testament, position) => {
    expect(bookCatalog.find(id)).toEqual({ id, name, chapters: count, testament, position });
  });

  it('finds nothing for an unknown id', () => {
    expect(bookCatalog.find('xyz')).toBeUndefined();
  });

  it('searches names ignoring accents and case', () => {
    expect(bookCatalog.search('jua').map((book) => book.name)).toEqual([
      'Juan',
      '1 Juan',
      '2 Juan',
      '3 Juan',
    ]);
    expect(bookCatalog.search('GENESIS').map((book) => book.name)).toEqual(['Génesis']);
  });

  it('returns every book for an empty search', () => {
    expect(bookCatalog.search('  ')).toHaveLength(66);
  });
});

describe('order templates (LB-009)', () => {
  it('keeps the canonical order', () => {
    const order = orderTemplates.canonical(bookCatalog);
    expect(order.slice(0, 2)).toEqual(['genesis', 'exodo']);
    expect(order).toHaveLength(66);
  });

  it('orders by chapters, fewest first, ties in canonical order', () => {
    const order = orderTemplates['by-chapters'](bookCatalog);
    expect(order.slice(0, 6)).toEqual(['abdias', 'filemon', '2juan', '3juan', 'judas', 'hageo']);
    expect(order.slice(-2)).toEqual(['isaias', 'salmos']);
    expect(new Set(order).size).toBe(66);
  });
});

describe('new testament first (LB-017)', () => {
  it('reads the New Testament first, then the Old, each in canonical order', () => {
    const order = orderTemplates['new-testament-first'](bookCatalog);
    expect(order.slice(0, 2)).toEqual(['mateo', 'marcos']);
    expect(order[26]).toBe('apocalipsis');
    expect(order[27]).toBe('genesis');
    expect(new Set(order).size).toBe(66);
  });
});
