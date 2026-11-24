// Per-file tools on purpose: Nx targets lint whole projects, the hook must touch only staged files.
// The flag makes ESLint use each project's own config, as `nx lint` does.
const eslint = 'eslint --fix --no-warn-ignored --flag v10_config_lookup_from_file';

export default {
  '*.{ts,mts,cts,js,mjs,cjs,html,css}': [eslint, 'prettier --write'],
  '*.{json,md,mdx,yml,yaml}': 'prettier --write',
};
