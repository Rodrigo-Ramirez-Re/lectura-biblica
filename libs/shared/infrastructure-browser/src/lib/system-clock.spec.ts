import { BrowserFileSaver, RandomIdGenerator, SystemClock } from './system-clock';

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

describe('device clock and file saver (LB-034)', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('gives the current instant', () => {
    vi.useFakeTimers({ now: new Date('2026-12-03T18:15:00.000Z') });

    expect(new SystemClock().now().toISOString()).toBe('2026-12-03T18:15:00.000Z');
  });

  it('downloads a file through a temporary link and releases it', () => {
    const link = { href: '', download: '', click: vi.fn() };
    vi.stubGlobal('document', { createElement: vi.fn(() => link) });
    const createObjectURL = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:respaldo');
    const revokeObjectURL = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);

    new BrowserFileSaver().save('respaldo.json', '{}', 'application/json');

    const [blob] = createObjectURL.mock.calls[0] as [Blob];
    expect(blob.type).toBe('application/json');
    expect(link).toMatchObject({ href: 'blob:respaldo', download: 'respaldo.json' });
    expect(link.click).toHaveBeenCalledOnce();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:respaldo');
  });
});
