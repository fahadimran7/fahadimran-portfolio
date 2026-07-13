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
      { part: 1, title: 'One card form for every payment provider', slug: 'one-card-form-every-provider' },
      { part: 2, title: 'The architecture refactor' },
      { part: 3, title: 'Dynamic currency conversion' },
    ],
  },
};
