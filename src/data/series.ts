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
      { part: 1, title: "How we charge cards we're not allowed to keep", slug: 'one-card-form-every-provider' },
      { part: 2, title: 'Making the frontend dumb on purpose', slug: 'config-driven-checkout' },
      { part: 3, title: 'The polling utility' },
      { part: 4, title: 'Dynamic currency conversion' },
    ],
  },
};
