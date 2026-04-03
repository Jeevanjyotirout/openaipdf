'use client'
import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Sparkles, FileText, Clock, TrendingUp, Star, ArrowRight,
  FilePlus2, Minimize2, Scissors, Eye, RotateCw, Lock, Brain, MessageSquare
} from 'lucide-react'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { formatFileSize } from '@/lib/utils'

interface DashboardClientProps {
  user: { name?: string | null; email?: string | null; image?: string | null }
}

const QUICK_TOOLS = [
  { id: 'merge', name: 'Merge PDF', icon: FilePlus2, href: '/tools/merge', color: 'hsl(214,100%,57%)' },
  { id: 'compress', name: 'Compress', icon: Minimize2, href: '/tools/compress', color: 'hsl(142,76%,45%)' },
  { id: 'split', name: 'Split PDF', icon: Scissors, href: '/tools/split', color: 'hsl(214,100%,57%)' },
  { id: 'ocr', name: 'OCR PDF', icon: Eye, href: '/tools/ocr', color: 'hsl(142,76%,45%)' },
  { id: 'rotate', name: 'Rotate', icon: RotateCw, href: '/tools/rotate', color: 'hsl(199,95%,47%)' },
  { id: 'protect', name: 'Protect', icon: Lock, href: '/tools/protect', color: 'hsl(0,84%,60%)' },
  { id: 'ai-summarize', name: 'AI Summary', icon: Brain, href: '/tools/ai-summarize', color: 'hsl(271,91%,65%)' },
  { id: 'ai-chat', name: 'AI Chat', icon: MessageSquare, href: '/tools/ai-chat', color: 'hsl(271,91%,65%)' },
]

const MOCK_RECENT = [
  { id: '1', name: 'Q4-Report-2024.pdf', tool: 'Compress PDF', size: 4200000, compressedSize: 980000, date: '2 hours ago', status: 'done' },
  { id: '2', name: 'Contract-Draft.pdf', tool: 'Sign PDF', size: 1100000, date: '5 hours ago', status: 'done' },
  { id: '3', name: 'Presentation.pptx', tool: 'Word to PDF', size: 8500000, date: 'Yesterday', status: 'done' },
  { id: '4', name: 'Invoice-Bundle.pdf', tool: 'Merge PDF', size: 3200000, date: 'Yesterday', status: 'done' },
]

const STATS = [
  { label: 'Files Processed', value: '142', icon: FileText, color: 'text-primary' },
  { label: 'Space Saved', value: '1.2 GB', icon: TrendingUp, color: 'text-green-600' },
  { label: 'Tools Used', value: '8', icon: Star, color: 'text-amber-600' },
  { label: 'This Month', value: '38', icon: Clock, color: 'text-purple-600' },
]

export function DashboardClient({ user }: DashboardClientProps) {
  const firstName = user.name?.split(' ')[0] || 'there'

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-10">

        {/* Greeting */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold">
              Welcome back, {firstName} 👋
            </h1>
          </div>
          <p className="text-muted-foreground text-sm">
            OpenAIPDF Workspace — Your AI-powered PDF command center.
          </p>
        </motion.div>

        {/* Stats row */}
        <motion.div
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {STATS.map((stat, i) => (
            <div key={stat.label} className="tool-card flex-row items-center gap-4 p-5">
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          ))}
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Quick tools */}
          <div className="lg:col-span-2 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-lg">Quick Tools</h2>
              <Link href="/#tools" className="text-sm text-primary hover:underline flex items-center gap-1">
                All tools <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {QUICK_TOOLS.map((tool, i) => (
                <motion.div
                  key={tool.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.15 + i * 0.04 }}
                >
                  <Link href={tool.href}>
                    <div className="tool-card shine-effect items-center text-center gap-3 py-5">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto"
                        style={{ background: `${tool.color}18` }}
                      >
                        <tool.icon className="w-5 h-5" style={{ color: tool.color }} />
                      </div>
                      <p className="text-xs font-semibold">{tool.name}</p>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>

            {/* Recent files */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-lg">Recent Activity</h2>
                <button className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  View all
                </button>
              </div>
              <div className="space-y-2">
                {MOCK_RECENT.map((file, i) => (
                  <motion.div
                    key={file.id}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.05 }}
                    className="flex items-center gap-3 p-3.5 rounded-xl bg-card border border-border hover:border-primary/20 transition-colors"
                  >
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{file.tool} • {file.date}</p>
                    </div>
                    <div className="text-xs text-muted-foreground shrink-0">
                      {formatFileSize(file.size)}
                    </div>
                    <div className="w-2 h-2 rounded-full bg-green-500 shrink-0" title="Completed" />
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Right sidebar */}
          <div className="space-y-5">
            {/* Plan card */}
            <motion.div
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-2xl border border-border bg-card p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold">Free Plan</span>
                <span className="text-xs badge-new px-2 py-0.5 rounded-full">Active</span>
              </div>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Daily files used</span>
                  <span className="font-medium text-foreground">14 / 20</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: '70%' }} />
                </div>
              </div>
              <Link
                href="/pricing"
                className="block w-full text-center text-sm font-semibold px-4 py-2.5 rounded-xl bg-primary text-white hover:bg-primary/90 transition-colors"
              >
                <span className="flex items-center justify-center gap-2">
                  <Sparkles className="w-3.5 h-3.5" />
                  Upgrade to Pro
                </span>
              </Link>
              <p className="text-xs text-center text-muted-foreground mt-2">
                Unlimited files · AI tools · Priority queue
              </p>
            </motion.div>

            {/* AI features callout */}
            <motion.div
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25 }}
              className="rounded-2xl border border-purple-500/20 bg-purple-500/5 p-5"
            >
              <div className="flex items-center gap-2 mb-2">
                <Brain className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-semibold">AI Features</span>
                <span className="badge-ai text-[10px] px-1.5 py-0.5 rounded-full">NEW</span>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Chat with your PDFs, get instant summaries, and translate to 50+ languages using OpenAIPDF AI.
              </p>
              <Link href="/tools/ai-chat" className="text-xs font-semibold text-purple-600 hover:underline flex items-center gap-1">
                Try AI Chat <ArrowRight className="w-3 h-3" />
              </Link>
            </motion.div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
