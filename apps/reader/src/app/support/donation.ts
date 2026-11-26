import type { AppSettings } from '../app-config';

export interface DonationLink {
  /** The owner's own text; null leaves it to the translated default. */
  readonly label: string | null;
  readonly url: string;
}

/**
 * The donation link to show, or null when it is off or its url is not a plain https link: no other
 * scheme and no user name or password in it.
 */
export function donationLink({ donation }: AppSettings): DonationLink | null {
  if (!donation.enabled) return null;
  const url = donation.url.trim();
  // `new URL` rather than `URL.canParse`, which Safari only has from version 17.
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (parsed.protocol !== 'https:' || parsed.username || parsed.password) return null;
  return { label: donation.label.trim() || null, url };
}

/**
 * Whether the text holds a run of 10+ digits once the separators between them are removed: an
 * account, CLABE (18) or card number (13–19), however it is written.
 */
export function looksLikeBankNumber(text: string): boolean {
  return /\d{10,}/.test(text.replace(/(?<=\d)[^\p{L}\d]+(?=\d)/gu, ''));
}
