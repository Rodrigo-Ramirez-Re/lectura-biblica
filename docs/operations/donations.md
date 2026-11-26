# Donations

The app is free and no feature depends on paying ([[product/spec#6. Donations (phase 4)|spec §6]]). An optional link in "Acerca de" lets whoever wants to support it do so through an external payment service. It is off until the owner turns it on (LB-029).

## Turn it on

1. Choose a payment service and create the account outside the repo. First check that it works in your country, what fees it charges, and that it gives you a public **https** link to a payment page.
2. In `apps/reader/src/config.json`, set:

   ```json
   "donation": { "enabled": true, "label": "Invítame un café", "url": "https://…" }
   ```

   `label` is optional: when it is empty, the link reads "Hacer una donación".

3. Open a PR to `development` as usual. When it reaches `main` it is published.

To turn it off, set `enabled` back to `false`. Nothing is shown with `enabled: false`, without a URL, or with a URL that is not `https://`.

## Never

- Account numbers, CLABE, card numbers or any bank details in the code, the repo or the page: the repo is public and Git keeps everything forever. A unit test (`apps/reader/src/app/config.spec.ts`) fails on any run of 10 or more digits in the config.
- Pop-ups, banners or reminders asking for support. The section lives only in "Acerca de".

## Taxes

Donations may count as income. Check with an accountant before turning the link on.
