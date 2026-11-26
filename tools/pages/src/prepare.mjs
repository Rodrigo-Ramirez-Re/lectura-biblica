// Prepares the build for GitHub Pages: `node tools/pages/src/prepare.mjs <build folder>`.
import { prepareForPages } from './prepare-site.mjs';

prepareForPages(process.argv[2]);
