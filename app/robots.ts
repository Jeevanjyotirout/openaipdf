import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/dashboard/', '/account/', '/settings/'],
      },
    ],
    sitemap: 'https://openaipdf.com/sitemap.xml',
    host: 'https://openaipdf.com',
  }
}
