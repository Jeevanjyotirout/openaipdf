'use client'
import Link from 'next/link'
import { useTheme } from 'next-themes'
import { useState } from 'react'
import { Sun, Moon, Menu, X, ChevronDown, Sparkles } from 'lucide-react'
import { TOOL_CATEGORIES } from '@/lib/tools-config'
import { motion, AnimatePresence } from 'framer-motion'

export function SiteHeader() {
  const { theme, setTheme } = useTheme()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [megaMenu, setMegaMenu] = useState<string | null>(null)

  return (
    <header className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-xl border-b border-border">
      <div className="max-w-7xl mx-auto px-4 h-[60px] flex items-center justify-between gap-4">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-lg shrink-0">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-sm">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="tracking-tight">
            OpenAI<span className="text-primary">PDF</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {TOOL_CATEGORIES.slice(0, 5).map((cat) => (
            <div
              key={cat.id}
              className="relative"
              onMouseEnter={() => setMegaMenu(cat.id)}
              onMouseLeave={() => setMegaMenu(null)}
            >
              <button className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                <span>{cat.emoji}</span>
                <span>{cat.label}</span>
                <ChevronDown className="w-3 h-3" />
              </button>

              <AnimatePresence>
                {megaMenu === cat.id && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full left-0 mt-1 w-56 bg-popover border border-border rounded-xl shadow-xl overflow-hidden p-1.5"
                  >
                    {cat.tools.map((tool) => (
                      <Link
                        key={tool.id}
                        href={tool.href}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm hover:bg-accent transition-colors"
                      >
                        <tool.icon className="w-4 h-4 shrink-0" style={{ color: tool.color }} />
                        <span>{tool.name}</span>
                        {tool.badge && (
                          <span className={`ml-auto text-xs px-1.5 py-0.5 rounded-full ${
                            tool.badge === 'ai' ? 'badge-ai' :
                            tool.badge === 'new' ? 'badge-new' : 'badge-pro'
                          }`}>
                            {tool.badge.toUpperCase()}
                          </span>
                        )}
                      </Link>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <Link
            href="/login"
            className="hidden md:inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="hidden md:inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Get Pro
          </Link>
          <button
            className="md:hidden p-2 rounded-lg hover:bg-accent transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden border-t border-border bg-background md:hidden"
          >
            <div className="p-4 space-y-1">
              {TOOL_CATEGORIES.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/tools/${cat.id}`}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-accent"
                  onClick={() => setMobileOpen(false)}
                >
                  <span>{cat.emoji}</span>
                  <span>{cat.label}</span>
                </Link>
              ))}
              <div className="pt-3 border-t border-border mt-3 flex flex-col gap-2">
                <Link href="/login" className="px-4 py-2 text-sm font-medium text-center rounded-lg border border-border">
                  Sign in
                </Link>
                <Link href="/signup" className="px-4 py-2 text-sm font-semibold text-center rounded-lg bg-primary text-white">
                  Get Pro — OpenAIPDF
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
