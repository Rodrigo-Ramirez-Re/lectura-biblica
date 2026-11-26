# pages

GitHub Pages support for the reader (LB-008): `prepare.mjs` copies `index.html` to `404.html` so deep links boot the app, and `serve.mjs` serves the build the way Pages does — under `/lectura-biblica/`, with the 404 fallback and gzip for text (LB-033) — for e2e and local checks. Not a library.

`serve.mjs [port] [--deep-links-200]`: the flag answers app routes (paths without an extension) with status 200 instead of 404, only for Lighthouse, which refuses to measure a 404 page. Missing files still answer 404.

`npx nx run reader:serve-pages` · `npx nx test pages`
