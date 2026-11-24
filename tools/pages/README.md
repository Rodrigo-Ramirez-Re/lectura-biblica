# pages

GitHub Pages support for the reader (LB-008): `prepare.mjs` copies `index.html` to `404.html` so deep links boot the app, and `serve.mjs` serves the build the way Pages does — under `/lectura-biblica/`, with the 404 fallback — for e2e and local checks. Not a library.

`npx nx run reader:serve-pages` · `npx nx test pages`
