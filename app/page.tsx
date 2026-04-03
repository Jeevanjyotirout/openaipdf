'use client'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight, Zap, Shield, Clock, Star, ChevronRight, Sparkles } from 'lucide-react'
import { ToolGrid } from '@/components/tools/ToolGrid'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { TOOL_CATEGORIES } from '@/lib/tools-config'

const STATS = [
  { value: '50M+', label: 'PDFs processed' },
  { value: '180+', label: 'Countries served' },
  { value: '40+', label: 'AI-powered tools' },
  { value: '99.9%', label: 'Uptime SLA' },
]

const FEATURES = [
  {
    icon: Sparkles,
    title: 'AI-Powered Processing',
    desc: 'OpenAIPDF uses advanced AI to summarize, translate, chat with, and intelligently process your documents.',
  },
  {
    icon: Shield,
    title: 'Privacy First',
    desc: 'Files auto-deleted after 2 hours. End-to-end encryption. OpenAIPDF never reads your documents.',
  },
  {
    icon: Zap,
    title: 'Lightning Fast',
    desc: 'Distributed worker infrastructure ensures every PDF operation completes in seconds, not minutes.',
  },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden pt-16 pb-20">
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
        <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />

        <div className="relative max-w-5xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              Smart AI-Powered PDF Tools — Free Forever
            </span>
          </motion.div>

          <motion.h1
            className="text-5xl md:text-7xl font-bold tracking-tight leading-tight mb-4"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <span className="gradient-text">OpenAIPDF</span>
          </motion.h1>

          <motion.p
            className="text-xl md:text-2xl font-medium text-foreground/70 mb-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
          >
            Smart AI-Powered PDF Tools
          </motion.p>

          <motion.p
            className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto mb-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Merge, split, compress, convert, OCR, sign, and chat with PDFs using AI —
            all in one place. No installation. No account required.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Link
              href="#tools"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25"
            >
              Explore All Tools <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/tools/ai-chat"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-border bg-card text-foreground font-semibold hover:bg-accent transition-colors"
            >
              <Sparkles className="w-4 h-4 text-primary" />
              Chat with PDF (AI)
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 pt-10 border-t border-border"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            {STATS.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-bold text-foreground">{stat.value}</div>
                <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* All Tools */}
      <section id="tools" className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="mb-10 text-center"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold mb-3">All PDF Tools</h2>
            <p className="text-muted-foreground">
              40+ AI-powered tools organized by category. Click any tool to get started instantly.
            </p>
          </motion.div>

          {TOOL_CATEGORIES.map((category, ci) => (
            <motion.div
              key={category.id}
              className="mb-12"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: ci * 0.05 }}
            >
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-lg"
                    style={{ background: category.color }}
                  >
                    {category.emoji}
                  </div>
                  <h3 className="text-lg font-bold">{category.label}</h3>
                  <span className="text-sm text-muted-foreground">
                    ({category.tools.length} tools)
                  </span>
                </div>
                <Link
                  href={`/tools/${category.id}`}
                  className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
                >
                  View all <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              <ToolGrid tools={category.tools} />
            </motion.div>
          ))}
        </div>
      </section>

      {/* Why OpenAIPDF */}
      <section className="py-20 px-4 bg-muted/40">
        <div className="max-w-5xl mx-auto">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold mb-3">Why OpenAIPDF?</h2>
            <p className="text-muted-foreground">
              The smartest, fastest, and most private PDF platform on the web.
            </p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-6">
            {FEATURES.map((feature, i) => (
              <motion.div
                key={feature.title}
                className="tool-card shine-effect"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <feature.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold text-base">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}
