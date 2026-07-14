import { defineCollection, z } from 'astro:content'
import { glob } from 'astro/loaders'

const projects = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/content/projects' }),
  schema: z.object({
    name: z.string(),
    href: z.string().url(),
    description: z.string(),
    status: z.enum(['live', 'in_development', 'coming_soon']),
    order: z.number().int().nonnegative(),
  }),
})

const writing = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/writing' }),
  schema: z.object({
    title: z.string(),
    date: z.date(),
    description: z.string().optional(),
    draft: z.boolean().default(false),
  }),
})

export const collections = { projects, writing }
