import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getCategoryById, TOOL_CATEGORIES } from '@/lib/tools-config'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { ToolGrid } from '@/components/tools/ToolGrid'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

interface Props {
  params: { category: string }
}

export async function generateStaticParams() {
  return TOOL_CATEGORIES.map((c) => ({ category: c.id }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const cat = getCategoryById(params.category)
  if (!cat) return { title: 'Not Found' }
  return {
    title: `${cat.label} — OpenAIPDF`,
    description: `${cat.description}. Free, fast, and AI-powered. No signup required.`,
    openGraph: {
      title: `${cat.label} | OpenAIPDF`,
      description: cat.description,
      url: `https://openaipdf.com/tools/${cat.id}`,
    },
  }
}

export default function CategoryPage({ params }: Props) {
  const cat = getCategoryById(params.category)
  if (!cat) notFound()

  const otherCategories = TOOL_CATEGORIES.filter((c) => c.id !== cat.id)

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="max-w-6xl mx-auto px-4 py-12">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
          <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-foreground font-medium">{cat.label}</span>
        </nav>

        {/* Header */}
        <div className="flex items-start gap-5 mb-10">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-lg shrink-0"
            style={{ background: `${cat.color}18`, border: `1.5px solid ${cat.color}30` }}
          >
            {cat.emoji}
          </div>
          <div>
            <h1 className="text-3xl font-bold mb-2">{cat.label}</h1>
            <p className="text-muted-foreground text-base">{cat.description}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {cat.tools.length} tools available · Processed by OpenAIPDF AI
            </p>
          </div>
        </div>

        {/* Tools grid */}
        <ToolGrid tools={cat.tools} columns={3} />

        {/* Other categories */}
        <div className="mt-16">
          <h2 className="text-lg font-bold mb-5">More OpenAIPDF Tools</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {otherCategories.map((c) => (
              <Link
                key={c.id}
                href={`/tools/${c.id}`}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border bg-card hover:border-primary/30 hover:bg-accent transition-all text-center"
              >
                <span className="text-2xl">{c.emoji}</span>
                <span className="text-xs font-semibold leading-tight">{c.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
