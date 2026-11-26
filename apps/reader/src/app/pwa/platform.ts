export type Platform = 'android' | 'ios' | 'desktop';

/** Which install steps to show first. Only a hint: every platform's steps stay on the page. */
export function detectPlatform(userAgent: string, maxTouchPoints: number): Platform {
  if (/android/i.test(userAgent)) return 'android';
  if (/iphone|ipad|ipod/i.test(userAgent)) return 'ios';
  // iPadOS asks for desktop pages and says it is a Mac; only the touch screen gives it away.
  if (/macintosh/i.test(userAgent) && maxTouchPoints > 1) return 'ios';
  return 'desktop';
}
