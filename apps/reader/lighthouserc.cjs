// Lighthouse CI for the reader app (LB-033): `npx nx run reader:lighthouse`.
// The production build is served like GitHub Pages, except that deep links answer 200: Lighthouse
// refuses to measure a 404 page, and Pages serves the very same document for them.
const port = 4211;
const base = `http://localhost:${port}/lectura-biblica/`;
const category = (minScore) => ['error', { minScore, aggregationMethod: 'median-run' }];

module.exports = {
  ci: {
    collect: {
      startServerCommand: `node tools/pages/src/serve.mjs ${port} --deep-links-200`,
      startServerReadyPattern: 'Serving',
      url: [base, `${base}avance`, `${base}libros`, `${base}acerca`],
      numberOfRuns: 3,
      settings: { chromeFlags: '--no-sandbox --headless=new' },
    },
    assert: {
      assertions: {
        'categories:performance': category(0.9),
        'categories:accessibility': category(1),
        'categories:best-practices': category(0.95),
        'categories:seo': category(0.9),
      },
    },
    // Reports stay on disk and in the CI artifact; nothing goes to a public server (spec §5).
    upload: { target: 'filesystem', outputDir: 'dist/lighthouse' },
  },
};
