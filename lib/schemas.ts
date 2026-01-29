import { z } from 'zod';

export const blogPostSchema = z.object({
  slug: z.string(),
  title: z.string(),
  excerpt: z.string(),
  content: z.string(),
  category: z.enum(['forex', 'psychology', 'risk', 'analysis', 'education']),
  categoryLabel: z.string(),
  featuredImage: z.string().url(),
  author: z.string(),
  publishDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Invalid date format",
  }),
  readingTime: z.number(),
  featured: z.boolean().optional(),
});
