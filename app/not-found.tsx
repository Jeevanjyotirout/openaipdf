import Link from 'next/link'
import { Sparkles, ArrowLeft, Search } from 'lucide-react'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { TOOL_CATEGORIES } from '@/lib/tools-config'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader />
      <main className="flex-1 flex items-center justify-center px-4 py-20">
        <div className="max-w-2xl w-full text-center">
          {/* 404 visual */}
          <div className="relative inline-flex items-center justify-center mb-8">
            <div className="text-[120px] md:text-[160px] font-black text-muted/20 leading-none select-none">
              404
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-20 h-20 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Search className="w-9 h-9 text-primary" />
              </div>
            </div>
          </div>

          <h1 className="text-2xl md:text-3xl font-bold mb-3">Page not found</h1>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto leading-relaxed">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
            Head back to OpenAIPDF and find the tool you need.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-12">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to OpenAIPDF
            </Link>
            <Link
              href="/#tools"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-border bg-card font-semibold hover:bg-accent transition-colors"
            >
              <Sparkles className="w-4 h-4 text-primary" />
              Browse All Tools
            </Link>
          </div>

          {/* Popular tools */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              Popular OpenAIPDF Tools
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {TOOL_CATEGORIES.flatMap((c) => c.tools)
                .filter((t) => t.popular)
                .slice(0, 8)
                .map((tool) => (
                  <Link
                    key={tool.id}
                    href={tool.href}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-card text-sm hover:border-primary/40 hover:bg-accent transition-colors"
                  >
                    <tool.icon className="w-3.5 h-3.5" style={{ color: tool.color }} />
                    {tool.name}
                  </Link>
                ))}
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
