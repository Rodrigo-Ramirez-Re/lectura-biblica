import { err, ok, type Result } from './result';

describe('Result', () => {
  it('carries the value of a success', () => {
    const result: Result<number, string> = ok(3);

    expect(result.ok && result.value).toBe(3);
  });

  it('carries the error of a failure', () => {
    const result: Result<number, string> = err('invalid');

    expect(!result.ok && result.error).toBe('invalid');
  });
});
