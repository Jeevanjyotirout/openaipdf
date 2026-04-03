import { MetadataRoute } from 'next'
import { TOOL_CATEGORIES } from '@/lib/tools-config'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://openaipdf.com'
  const now = new Date()

  const staticPages: MetadataRoute.Sitemap = [
    { url: base, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/pricing`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/login`, lastModified: now, changeFrequency: 'yearly', priority: 0.5 },
    { url: `${base}/signup`, lastModified: now, changeFrequency: 'yearly', priority: 0.5 },
  ]

  const categoryPages: MetadataRoute.Sitemap = TOOL_CATEGORIES.map((cat) => ({
    url: `${base}/tools/${cat.id}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }))

  const toolPages: MetadataRoute.Sitemap = TOOL_CATEGORIES.flatMap((cat) =>
    cat.tools.map((tool) => ({
      url: `${base}${tool.href}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: tool.popular ? 0.9 : 0.7,
    }))
  )

  return [...staticPages, ...categoryPages, ...toolPages]
}
