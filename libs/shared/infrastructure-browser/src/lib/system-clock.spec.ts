import { RandomIdGenerator, SystemClock } from './system-clock';

describe('device clock and ids (LB-011)', () => {
  it('gives today as the device calendar day', () => {
    vi.useFakeTimers({ now: new Date(2026, 11, 3, 23, 30) });

    expect(new SystemClock().today().toString()).toBe('2026-12-03');

    vi.useRealTimers();
  });

  it('generates distinct ids', () => {
    const ids = new RandomIdGenerator();
    expect(ids.next()).not.toBe(ids.next());
  });
});
