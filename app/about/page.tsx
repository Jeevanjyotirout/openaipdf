import type { Metadata } from 'next'
import Link from 'next/link'
import { Sparkles, Users, Globe, Zap, Shield, Heart, ArrowRight } from 'lucide-react'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { SiteFooter } from '@/components/layout/SiteFooter'

export const metadata: Metadata = {
  title: 'About Us',
  description: 'Learn about OpenAIPDF — the team behind the world\'s most advanced AI-powered PDF tools platform.',
}

const VALUES = [
  { icon: Zap, title: 'Speed First', desc: 'Every tool is optimised for maximum processing speed. We respect your time.' },
  { icon: Shield, title: 'Privacy by Design', desc: 'Files deleted after 2 hours. We never read, train on, or share your documents.' },
  { icon: Globe, title: 'Accessible Worldwide', desc: 'Free tools for everyone, in every country, in every language.' },
  { icon: Heart, title: 'Built with Care', desc: 'Every detail is crafted with real users in mind, from upload to download.' },
]

const STATS = [
  { value: '50M+', label: 'Documents processed' },
  { value: '180+', label: 'Countries reached' },
  { value: '40+', label: 'PDF tools' },
  { value: '99.9%', label: 'Uptime' },
]

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main>
        {/* Hero */}
        <section className="py-20 px-4 text-center border-b border-border relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
          <div className="relative max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-6">
              <Sparkles className="w-3.5 h-3.5" /> About OpenAIPDF
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Making PDFs effortless<br />
              <span className="gradient-text">for everyone</span>
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              OpenAIPDF was built on a simple belief: powerful document tools should be free, fast,
              and accessible to everyone — not locked behind expensive software or complicated workflows.
            </p>
          </div>
        </section>

        {/* Stats */}
        <section className="py-14 px-4 border-b border-border">
          <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {STATS.map((s) => (
              <div key={s.label}>
                <p className="text-4xl font-black text-foreground">{s.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Mission */}
        <section className="py-16 px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold mb-5">Our Mission</h2>
            <div className="prose prose-neutral dark:prose-invert max-w-none text-muted-foreground leading-relaxed space-y-4">
              <p>
                OpenAIPDF started with a frustration shared by millions: why are PDF tools so complicated, 
                expensive, or filled with dark patterns? We set out to build the PDF platform we always 
                wanted — one that respects users' time, privacy, and intelligence.
              </p>
              <p>
                Today, OpenAIPDF serves millions of users worldwide with over 40 tools covering every 
                PDF need — from merging and splitting to AI-powered chat, summarization, and translation. 
                All free. All fast. All private.
              </p>
              <p>
                We believe that AI should make tools smarter, not creepier. That's why every AI feature 
                on OpenAIPDF is designed to help you work faster without compromising your data. Your 
                documents are never used for training. Period.
              </p>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="py-16 px-4 bg-muted/30 border-y border-border">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl font-bold mb-10 text-center">What we stand for</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {VALUES.map((v) => (
                <div key={v.title} className="tool-card">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <v.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-semibold">{v.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{v.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 px-4 text-center">
          <div className="max-w-xl mx-auto">
            <h2 className="text-2xl font-bold mb-4">Ready to get started?</h2>
            <p className="text-muted-foreground mb-8">Join 5 million users who trust OpenAIPDF every day.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/#tools" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20">
                Explore Tools <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/pricing" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-border bg-card font-semibold hover:bg-accent transition-colors">
                View Pricing
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}
