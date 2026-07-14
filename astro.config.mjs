// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: 'https://fahadimran.me',
  markdown: {
    // Shiki dual-theme highlighting. defaultColor:false emits both light/dark
    // token colours as CSS variables so we can switch them with the site's own
    // [data-theme] toggle (see .astro-code rules) and keep our block background.
    shikiConfig: {
      themes: { light: 'github-light', dark: 'github-dark' },
      defaultColor: false,
      wrap: false,
    },
  },
});
