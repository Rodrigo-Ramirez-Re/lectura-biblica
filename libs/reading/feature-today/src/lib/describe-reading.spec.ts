import { describeReading } from './describe-reading';

describe('describeReading (LB-012)', () => {
  it('names a range of chapters', () => {
    expect(describeReading('Salmos', [{ from: 4, to: 6 }])).toBe('Salmos 4–6');
  });

  it('names a single chapter', () => {
    expect(describeReading('Judas', [{ from: 1, to: 1 }])).toBe('Judas 1');
  });

  it('joins a reading that wraps into a new pass', () => {
    expect(
      describeReading('Rut', [
        { from: 4, to: 4 },
        { from: 1, to: 2 },
      ]),
    ).toBe('Rut 4 y Rut 1–2');
  });

  it('counts the times of a one-chapter book', () => {
    const once = { from: 1, to: 1 };
    expect(describeReading('Abdías', [once, once, once])).toBe('Abdías 1, 3 veces');
  });

  it('is empty when nothing is due', () => {
    expect(describeReading('Salmos', [])).toBe('');
  });
});
