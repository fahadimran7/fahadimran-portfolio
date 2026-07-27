// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: 'https://fahadimran.me',
  // Prefetch internal links so navigation is instant. `viewport` fetches a
  // page's HTML as soon as its link is on screen (the nav is always visible),
  // so by the time a link is tapped the next page is already cached — no
  // click-to-load wait, and it works on touch where there's no hover.
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'viewport',
  },
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
