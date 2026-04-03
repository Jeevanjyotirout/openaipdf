import type { Metadata, Viewport } from 'next'
import { ThemeProvider } from '@/components/layout/ThemeProvider'
import { Toaster } from '@/components/ui/toaster'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'OpenAIPDF | All-in-One Smart PDF Tools',
    template: '%s | OpenAIPDF',
  },
  description:
    'Smart AI-powered PDF tools for merging, converting, editing, and managing documents. Free, fast, and privacy-first.',
  keywords: ['OpenAIPDF', 'AI PDF tools', 'merge PDF', 'split PDF', 'compress PDF', 'PDF converter', 'OCR PDF', 'AI PDF chat'],
  authors: [{ name: 'OpenAIPDF Team', url: 'https://openaipdf.com' }],
  creator: 'OpenAIPDF',
  publisher: 'OpenAIPDF',
  metadataBase: new URL('https://openaipdf.com'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://openaipdf.com',
    title: 'OpenAIPDF — Smart AI-Powered PDF Tools',
    description: 'Smart AI-powered PDF tools for merging, converting, editing, and managing documents. Free, fast, and privacy-first.',
    siteName: 'OpenAIPDF',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'OpenAIPDF — Smart AI-Powered PDF Tools',
    description: 'Smart AI-powered PDF tools for merging, converting, editing, and managing documents.',
    site: '@openaipdf',
  },
  robots: { index: true, follow: true },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f1117' },
  ],
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
