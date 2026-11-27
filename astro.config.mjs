// @ts-check
import { defineConfig } from 'astro/config';

// On GitHub Pages the site lives at https://<user>.github.io/<repo>/,
// so SITE and BASE_PATH come from the deploy workflow. Locally both are unset.
export default defineConfig({
  site: process.env.SITE ?? 'http://localhost:4321',
  base: process.env.BASE_PATH ?? '/',
  trailingSlash: 'always',
  build: { format: 'directory' },
});
