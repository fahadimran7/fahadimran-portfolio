import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const ramblings = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/ramblings' }),
  schema: z.object({
    title: z.string(),
    publishedAt: z.string(),
    summary: z.string(),
    tags: z.array(z.string()).default([]),
  }),
});

export const collections = { ramblings };
