// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: 'https://fahadimran.me',
  redirects: {
    '/ramblings': '/writings',
    '/ramblings/[slug]': '/writings/[slug]',
  },
  build: {
    // Inline the site CSS into each page's HTML instead of a separate
    // <link rel="stylesheet">. The stylesheet is small (~12KB) and was a
    // render-blocking request: on a throttled connection the browser had to
    // discover the link, make a round-trip, and download it before it could
    // paint anything — a big slice of the homepage's LCP render delay. Inlined,
    // the styles arrive with the HTML and first paint no longer waits on a hop.
    inlineStylesheets: 'always',
  },
  // Prefetch internal links so navigation is instant. `viewport` fetches a
  // page's HTML as soon as its link is on screen (the nav is always visible),
  // so by the time a link is tapped the next page is already cached — no
  // click-to-load wait, and it works on touch where there's no hover.
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'viewport',
  },
  markdown: {
    shikiConfig: {
      theme: 'github-light',
      wrap: false,
    },
  },
});
