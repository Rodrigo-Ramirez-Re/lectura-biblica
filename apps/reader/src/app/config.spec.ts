import { appSettings } from './app-config';
import { donationLink } from './support/donation';

// The repo is public and Git keeps everything forever: this guards the one file the owner edits
// to turn donations on (docs/operations/donations.md).
describe('config.json (LB-029)', () => {
  it('holds no account, CLABE or card number', () => {
    const digits = JSON.stringify(appSettings).replace(/[\s.-]/g, '');

    expect(digits).not.toMatch(/\d{10,}/);
  });

  it('has a usable https link whenever donations are turned on', () => {
    if (appSettings.donation.enabled) expect(donationLink(appSettings)).not.toBeNull();
  });
});
