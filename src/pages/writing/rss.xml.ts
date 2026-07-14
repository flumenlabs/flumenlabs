import rss from '@astrojs/rss'
import { getCollection } from 'astro:content'
import type { APIContext } from 'astro'

export async function GET(context: APIContext) {
  const posts = await getCollection('writing', ({ data }) => !data.draft)
  posts.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf())

  return rss({
    title: 'Flumen Labs — Writing',
    description: 'Notes and essays from Flumen Labs.',
    site: context.site!,
    items: posts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.date,
      description: post.data.description,
      link: `/writing/${post.id}/`,
    })),
  })
}
