import { detectPlatform } from './platform';

const ANDROID =
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Mobile Safari/537.36';
const IPHONE =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1';
const MAC =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Safari/605.1.15';
const WINDOWS =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36 Edg/131.0';

describe('detectPlatform (LB-030)', () => {
  it.each([
    ['an Android phone', ANDROID, 5, 'android'],
    ['an iPhone', IPHONE, 5, 'ios'],
    ['an iPad, which says it is a Mac but has touch', MAC, 5, 'ios'],
    ['a Mac', MAC, 0, 'desktop'],
    ['a Windows computer', WINDOWS, 0, 'desktop'],
    ['a Windows computer with a touch screen', WINDOWS, 10, 'desktop'],
  ] as const)('recognises %s', (_, userAgent, touchPoints, platform) => {
    expect(detectPlatform(userAgent, touchPoints)).toBe(platform);
  });
});
