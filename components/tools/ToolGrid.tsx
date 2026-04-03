'use client'
import Link from 'next/link'
import { motion } from 'framer-motion'
import type { Tool } from '@/lib/tools-config'
import { cn } from '@/lib/utils'

interface ToolGridProps {
  tools: Tool[]
  columns?: 2 | 3 | 4 | 5 | 6
}

export function ToolGrid({ tools, columns = 4 }: ToolGridProps) {
  const colClass = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
    5: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5',
    6: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6',
  }[columns]

  return (
    <div className={cn('grid gap-3', colClass)}>
      {tools.map((tool, i) => (
        <ToolCard key={tool.id} tool={tool} index={i} />
      ))}
    </div>
  )
}

function ToolCard({ tool, index }: { tool: Tool; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.04 }}
    >
      <Link href={tool.href} className="block h-full">
        <div className="tool-card shine-effect group h-full min-h-[120px]">
          {/* Color accent bar */}
          <div
            className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ background: tool.color }}
          />

          {/* Icon */}
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 duration-200"
            style={{ background: `${tool.color}18` }}
          >
            <tool.icon className="w-5 h-5" style={{ color: tool.color }} />
          </div>

          {/* Content */}
          <div className="flex flex-col gap-1 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-foreground leading-tight">
                {tool.name}
              </span>
              {tool.badge && (
                <span
                  className={cn(
                    'text-[10px] px-1.5 py-0.5 rounded-full font-semibold',
                    tool.badge === 'ai' && 'badge-ai',
                    tool.badge === 'new' && 'badge-new',
                    tool.badge === 'pro' && 'badge-pro'
                  )}
                >
                  {tool.badge.toUpperCase()}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground leading-snug line-clamp-2">
              {tool.description}
            </p>
          </div>

          {/* Popular indicator */}
          {tool.popular && (
            <div className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          )}
        </div>
      </Link>
    </motion.div>
  )
}
