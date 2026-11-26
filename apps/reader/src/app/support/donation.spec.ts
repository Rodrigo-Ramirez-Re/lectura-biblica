import type { AppSettings } from '../app-config';
import { donationLink } from './donation';

const settings = (donation: AppSettings['donation']): AppSettings => ({
  appName: 'Lectura bíblica',
  shortName: 'Lectura',
  donation,
});

describe('donationLink (LB-029)', () => {
  it('is null while donations are turned off', () => {
    expect(
      donationLink(settings({ enabled: false, label: 'Donar', url: 'https://example.org/donar' })),
    ).toBeNull();
  });

  it('is null without a url', () => {
    expect(donationLink(settings({ enabled: true, label: 'Donar', url: '  ' }))).toBeNull();
  });

  it('gives the configured label and url', () => {
    expect(
      donationLink(
        settings({ enabled: true, label: ' Invítame un café ', url: 'https://example.org/d' }),
      ),
    ).toEqual({ label: 'Invítame un café', url: 'https://example.org/d' });
  });

  it('leaves the label to the default when it is empty', () => {
    expect(
      donationLink(settings({ enabled: true, label: '', url: 'https://example.org/d' }))?.label,
    ).toBeNull();
  });

  it.each(['http://example.org/d', 'javascript:alert(1)', '/donar', 'example.org', 'ftp://x.org'])(
    'only accepts https links, never %s',
    (url) => {
      expect(donationLink(settings({ enabled: true, label: 'Donar', url }))).toBeNull();
    },
  );
});

describe('donationLink (LB-029 review)', () => {
  it('works where URL.canParse does not exist, as in Safari 16', () => {
    const canParse = URL.canParse;
    Reflect.deleteProperty(URL, 'canParse');
    try {
      expect(
        donationLink(settings({ enabled: true, label: '', url: 'https://example.org/d' })),
      ).toEqual({ label: null, url: 'https://example.org/d' });
      expect(
        donationLink(settings({ enabled: true, label: '', url: 'no es un enlace' })),
      ).toBeNull();
    } finally {
      URL.canParse = canParse;
    }
  });

  it('rejects a link carrying a user name or password', () => {
    expect(
      donationLink(settings({ enabled: true, label: '', url: 'https://yo:clave@example.org/d' })),
    ).toBeNull();
  });
});
