'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { TOOL_CATEGORIES } from '@/lib/tools-config'
import { cn } from '@/lib/utils'
import { ChevronRight, Home } from 'lucide-react'

interface SidebarProps {
  collapsed?: boolean
}

export function Sidebar({ collapsed }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside
      className={cn(
        'flex flex-col h-full bg-background border-r border-border transition-all duration-200',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="h-[60px] flex items-center px-4 border-b border-border shrink-0">
        {!collapsed && (
          <Link href="/" className="flex items-center gap-2 font-bold text-lg">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center shrink-0">
              <span className="text-white text-xs font-black">P</span>
            </div>
            <span>PDF<span className="text-primary">Pro</span></span>
          </Link>
        )}
        {collapsed && (
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center mx-auto">
            <span className="text-white text-xs font-black">P</span>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5">
        <Link
          href="/"
          className={cn(
            'sidebar-nav-item',
            pathname === '/' && 'active'
          )}
        >
          <Home className="w-4 h-4 shrink-0" />
          {!collapsed && <span>Home</span>}
        </Link>

        {!collapsed && (
          <div className="pt-3 pb-1 px-3">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Tools
            </span>
          </div>
        )}

        {TOOL_CATEGORIES.map((category) => {
          const isActive = pathname.startsWith(`/tools/${category.id}`)

          return (
            <div key={category.id}>
              <Link
                href={`/tools/${category.id}`}
                className={cn('sidebar-nav-item', isActive && 'active')}
              >
                <span className="text-base leading-none shrink-0">{category.emoji}</span>
                {!collapsed && (
                  <>
                    <span className="flex-1">{category.label}</span>
                    {isActive && <ChevronRight className="w-3.5 h-3.5 opacity-60" />}
                  </>
                )}
              </Link>

              {/* Sub-tools when category is active */}
              {isActive && !collapsed && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="ml-4 mt-0.5 space-y-0.5"
                >
                  {category.tools.map((tool) => {
                    const toolActive = pathname === tool.href
                    return (
                      <Link
                        key={tool.id}
                        href={tool.href}
                        className={cn(
                          'flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                          toolActive
                            ? 'bg-primary/10 text-primary'
                            : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                        )}
                      >
                        <tool.icon className="w-3.5 h-3.5 shrink-0" />
                        <span>{tool.name}</span>
                        {tool.badge && (
                          <span className={`ml-auto text-[10px] px-1 py-0.5 rounded-full ${
                            tool.badge === 'ai' ? 'badge-ai' : 'badge-new'
                          }`}>
                            {tool.badge.toUpperCase()}
                          </span>
                        )}
                      </Link>
                    )
                  })}
                </motion.div>
              )}
            </div>
          )
        })}
      </nav>

      {/* Upgrade CTA */}
      {!collapsed && (
        <div className="p-4 border-t border-border">
          <div className="rounded-xl bg-gradient-to-br from-primary/10 to-purple-500/10 border border-primary/20 p-4">
            <p className="text-xs font-semibold text-foreground mb-1">Upgrade to Pro</p>
            <p className="text-xs text-muted-foreground mb-3">
              Unlimited files, batch processing, priority queue
            </p>
            <Link
              href="/pricing"
              className="block text-center text-xs font-semibold px-3 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors"
            >
              Get Pro — $9/mo
            </Link>
          </div>
        </div>
      )}
    </aside>
  )
}
