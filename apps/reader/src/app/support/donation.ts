import type { AppSettings } from '../app-config';

export interface DonationLink {
  /** The owner's own text; null leaves it to the translated default. */
  readonly label: string | null;
  readonly url: string;
}

/** The donation link to show, or null when it is off or its url is not a plain https link. */
export function donationLink({ donation }: AppSettings): DonationLink | null {
  if (!donation.enabled) return null;
  const url = donation.url.trim();
  if (!URL.canParse(url) || new URL(url).protocol !== 'https:') return null;
  return { label: donation.label.trim() || null, url };
}
