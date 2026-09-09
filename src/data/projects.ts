export interface Project {
  name: string;
  image: string;
  url?: string;
  caseStudyUrl?: string;
  role: string;
  employer?: string;
  start: string;
  end: string;
  location: string;
  remote?: boolean;
  description: string;
  tags: [string, string];
  featuredSummary?: string;
  featuredOrder?: number;
}

// Reverse-chronological. Home and Work both render from this source of truth.
export const projects: Project[] = [
  {
    name: 'Nomod',
    image: '/images/work/nomod.webp',
    url: 'https://nomod.com',
    caseStudyUrl: '/work/nomod',
    role: 'Software Engineer',
    employer: 'Alfabolt',
    start: 'Jun 2024',
    end: 'Present',
    location: 'United Arab Emirates',
    remote: true,
    description: 'Payments platform for 40,000+ GCC merchants. Built the provider layer behind Link, Invoice, and Checkout.',
    tags: ['Payments', 'Web'],
    featuredSummary: 'Built the provider layer behind Link, Invoice, and Checkout for 40,000+ GCC merchants.',
    featuredOrder: 1,
  },
  {
    name: 'Pine',
    image: '/images/work/pine.webp',
    url: 'https://apps.apple.com/no/app/pine-the-app/id6467567252',
    role: 'Software Engineer',
    employer: 'Alfabolt',
    start: 'Nov 2023',
    end: 'Jun 2024',
    location: 'Norway',
    remote: true,
    description: 'Group-buying app from Norway. Led the mobile build and the bill-splitting flow for friends ordering together.',
    tags: ['Product', 'Mobile'],
    featuredSummary: 'Led the mobile build and the bill-splitting flow for friends ordering together.',
    featuredOrder: 2,
  },
  {
    name: 'Rayne',
    image: '/images/work/rayne.webp',
    url: 'https://wearerayne.com',
    role: 'Frontend Engineer',
    employer: 'Alfabolt',
    start: 'Aug 2023',
    end: 'Nov 2023',
    location: 'United Arab Emirates',
    remote: true,
    description: 'Marketing site and component library, migrated to Sanity CMS. Hit a 100 Lighthouse SEO score across 5+ countries.',
    tags: ['Frontend', 'CMS'],
  },
  {
    name: 'Leaf',
    image: '/images/work/leaf.webp',
    url: 'https://sharewithleaf.com',
    role: 'Software Engineer',
    employer: 'Devsinc',
    start: 'Jan 2023',
    end: 'Aug 2023',
    location: 'United States',
    remote: true,
    description: 'Private voice recorder for families. Built the recording flow with Whisper transcription and speaker tagging.',
    tags: ['AI', 'Audio'],
    featuredSummary: 'Built the recording flow with Whisper transcription and speaker tagging.',
    featuredOrder: 3,
  },
  {
    name: 'Maple',
    image: '/images/work/maple.webp',
    url: 'https://www.linkedin.com/company/maplehr',
    role: 'Software Engineer',
    employer: 'Devsinc',
    start: 'Aug 2022',
    end: 'Mar 2023',
    location: 'Pakistan',
    description: 'HR platform built in Flutter from scratch, with MVVM architecture and 85% unit test coverage. Shipped leave, expense, and inventory modules against a Rails backend.',
    tags: ['Product', 'Mobile'],
  },
];

export const featuredProjects = projects
  .filter((project) => project.featuredOrder !== undefined)
  .sort((a, b) => (a.featuredOrder ?? 0) - (b.featuredOrder ?? 0));
