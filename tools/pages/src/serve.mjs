// Serves the production build like GitHub Pages: `node tools/pages/src/serve.mjs [port]`.
import { join } from 'node:path';
import { createPagesServer } from './pages-server.mjs';
import { BASE_HREF } from './site.mjs';

const port = Number(process.argv[2] ?? 4210);
const root = join(import.meta.dirname, '../../../dist/apps/reader/browser');

createPagesServer({ root, base: BASE_HREF }).listen(port, () => {
  console.log(`Serving ${root} at http://localhost:${port}${BASE_HREF}`);
});
