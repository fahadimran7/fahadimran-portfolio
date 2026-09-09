import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import sharp from 'sharp';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// Custom OG images rendered at build time with Satori (HTML/CSS -> SVG) and
// resvg (SVG -> PNG). Editorial framed card: eyebrow + read time up top, big
// title, then a site-link badge along the bottom.
// Fonts and avatar are vendored so the build stays offline.

const asset = (f: string) => readFileSync(join(process.cwd(), 'src/assets/og', f));

const inter400 = asset('inter-400.ttf');
const inter600 = asset('inter-600.ttf');
const inter700 = asset('inter-700.ttf');
const avatar = 'data:image/png;base64,' + asset('avatar.png').toString('base64');

// Minimal hyperscript for Satori's element tree.
type El = { type: string; props: Record<string, unknown> };
const h = (type: string, props: Record<string, unknown>, ...children: unknown[]): El => ({
  type,
  props: { ...props, children: children.length <= 1 ? children[0] : children },
});

function readingTime(body: string): string {
  const words = body.trim().split(/\s+/).length;
  return `${Math.ceil(words / 200)} min read`;
}

function formatDate(str: string): string {
  return new Date(str).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

// Faint dot grid filling the empty right side so cards don't look bare.
const DOT = 'rgba(26,26,26,0.07)';

function decoration(): El {
  const dots: El[] = [];
  for (let c = 0; c < 6; c++)
    for (let r = 0; r < 7; r++)
      dots.push(h('circle', { cx: 970 + c * 40, cy: 150 + r * 40, r: 4, fill: DOT }));
  return h(
    'svg',
    { width: 1200, height: 630, viewBox: '0 0 1200 630', style: { position: 'absolute', top: 0, left: 0 } },
    ...dots,
  );
}

interface OgData {
  title: string;
  readTime: string;
  date: string;
}

function template({ title, readTime, date }: OgData): El {
  const eyebrow = `Writings · ${date}`;

  const len = title.length;
  const titleSize = len > 62 ? 50 : len > 46 ? 58 : 68;

  const clockIcon = (): El =>
    h(
      'svg',
      {
        width: 24,
        height: 24,
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: '#909090',
        strokeWidth: 2,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
      },
      h('circle', { cx: 12, cy: 12, r: 9 }),
      h('polyline', { points: '12 7 12 12 15 14' }),
    );

  return h(
    'div',
    {
      style: {
        position: 'relative',
        width: '1200px',
        height: '630px',
        display: 'flex',
        backgroundColor: '#f9f9f7',
        fontFamily: 'Inter',
      },
    },
    // faint background motif (behind content)
    decoration(),
    h(
      'div',
      {
        style: {
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '78px 84px',
          backgroundColor: 'transparent',
        },
      },
      // top row: eyebrow + read time
      h(
        'div',
        { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
        h(
          'div',
          {
            style: {
              fontSize: '23px',
              fontWeight: 600,
              letterSpacing: '2px',
              textTransform: 'uppercase',
              color: '#707070',
            },
          },
          eyebrow,
        ),
        h(
          'div',
          { style: { display: 'flex', alignItems: 'center', gap: '9px' } },
          clockIcon(),
          h('div', { style: { fontSize: '23px', fontWeight: 400, color: '#909090' } }, readTime),
        ),
      ),
      // title
      h(
        'div',
        {
          style: {
            display: 'flex',
            fontSize: `${titleSize}px`,
            fontWeight: 700,
            lineHeight: 1.1,
            letterSpacing: '-1.5px',
            color: '#1a1a1a',
            maxWidth: '980px',
          },
        },
        title,
      ),
      // bottom row: site badge
      h(
        'div',
        { style: { display: 'flex', justifyContent: 'flex-end', alignItems: 'center' } },
        // site-link badge (dark pill, avatar + domain)
        h(
          'div',
          {
            style: {
              display: 'flex',
              alignItems: 'center',
              gap: '13px',
              padding: '8px 22px 8px 8px',
              borderRadius: '999px',
              backgroundColor: '#ffffff',
              border: '1px solid rgba(26,26,26,0.10)',
            },
          },
          h('img', { src: avatar, width: 40, height: 40, style: { borderRadius: '40px' } }),
          h('div', { style: { fontSize: '24px', fontWeight: 600, color: '#1a1a1a' } }, 'fahadimran.me'),
        ),
      ),
    ),
  );
}

async function render(data: OgData): Promise<Buffer> {
  const svg = await satori(template(data) as never, {
    width: 1200,
    height: 630,
    fonts: [
      { name: 'Inter', data: inter400, weight: 400, style: 'normal' },
      { name: 'Inter', data: inter600, weight: 600, style: 'normal' },
      { name: 'Inter', data: inter700, weight: 700, style: 'normal' },
    ],
  });
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng();
  // Re-encode losslessly to shave file size (flat design compresses well).
  return await sharp(png).png({ compressionLevel: 9, effort: 10, palette: true }).toBuffer();
}

export async function getStaticPaths() {
  const posts = await getCollection('writings', ({ data }) => data.published);
  return posts.map((post) => ({
    params: { route: `${post.id}.png` },
    props: {
      data: {
        title: post.data.title,
        readTime: readingTime(post.body ?? ''),
        date: formatDate(post.data.publishedAt),
      } satisfies OgData,
    },
  }));
}

export const GET: APIRoute = async ({ props }) => {
  const png = await render((props as { data: OgData }).data);
  return new Response(new Uint8Array(png), {
    headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=31536000, immutable' },
  });
};
