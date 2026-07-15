// Ordered outlines for multi-part post series. `slug` is set once a part is
// written and published; parts without a slug render as "coming soon".
export interface SeriesPart {
  part: number;
  title: string;
  slug?: string;
}

export interface Series {
  name: string;
  parts: SeriesPart[];
}

export const series: Record<string, Series> = {
  'nomod-payments': {
    name: 'Nomod payments',
    parts: [
      { part: 1, title: 'Taking card payments without ever storing the card', slug: 'one-card-form-every-provider' },
      { part: 2, title: 'Making the frontend dumb on purpose', slug: 'config-driven-checkout' },
      { part: 3, title: 'Knowing when a 3DS payment finished, by polling', slug: 'charge-polling' },
      { part: 4, title: 'Dynamic currency conversion' },
    ],
  },
};
