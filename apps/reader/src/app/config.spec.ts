import { appSettings } from './app-config';
import { donationLink, looksLikeBankNumber } from './support/donation';

describe('looksLikeBankNumber (LB-029 review)', () => {
  it.each([
    ['a CLABE', '002180700123456789'],
    ['a card with spaces', '4111 1111 1111 1111'],
    ['a card with slashes', '4111/1111/1111/1111'],
    ['a card with underscores', '4111_1111_1111_1111'],
    ['a card with commas', '4111,1111,1111,1111'],
    ['an account with dots', '0123.4567.89'],
  ])('spots %s', (_, text) => {
    expect(looksLikeBankNumber(`Deposita a ${text}, gracias`)).toBe(true);
  });

  it.each([
    ['a payment link', 'https://example.org/apoyar/lectura-biblica'],
    ['a short reference', 'ref 2026-12'],
  ])('lets %s through', (_, text) => {
    expect(looksLikeBankNumber(text)).toBe(false);
  });
});

// The repo is public and Git keeps everything forever: this guards the one file the owner edits
// to turn donations on (docs/operations/donations.md).
describe('config.json (LB-029)', () => {
  it('holds no account, CLABE or card number', () => {
    expect(looksLikeBankNumber(JSON.stringify(appSettings))).toBe(false);
  });

  it.skipIf(!appSettings.donation.enabled)(
    'has a usable https link whenever donations are turned on',
    () => {
      expect(donationLink(appSettings)).not.toBeNull();
    },
  );
});
