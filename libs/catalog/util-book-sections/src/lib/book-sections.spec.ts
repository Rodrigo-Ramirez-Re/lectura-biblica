import { loadBookSections, type BookSection } from './book-sections';

class First {}
class Second {}

describe('book sections (LB-009, LB-012)', () => {
  it('loads every section in its order', async () => {
    const sections: BookSection[] = [
      { order: 20, load: async () => Second },
      { order: 10, load: async () => First },
    ];

    expect(await loadBookSections(sections)).toEqual([First, Second]);
  });

  it('loads nothing when no context registered a section', async () => {
    expect(await loadBookSections([])).toEqual([]);
  });
});
