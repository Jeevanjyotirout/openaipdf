'use client'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import type { Tool } from '@/lib/tools-config'
import { cn } from '@/lib/utils'

interface ToolPageWrapperProps {
  tool: Tool
  children: React.ReactNode
}

export function ToolPageWrapper({ tool, children }: ToolPageWrapperProps) {
  return (
    <motion.div
      className="max-w-4xl mx-auto px-4 py-10"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
        <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
        <span>/</span>
        <Link href={`/tools/${tool.categoryId}`} className="hover:text-foreground transition-colors capitalize">
          {tool.categoryId.replace('-', ' ')}
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium">{tool.name}</span>
      </div>

      {/* Hero */}
      <div className="flex items-start gap-5 mb-10">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg"
          style={{ background: `linear-gradient(135deg, ${tool.color}22, ${tool.color}44)`, border: `1.5px solid ${tool.color}30` }}
        >
          <tool.icon className="w-7 h-7" style={{ color: tool.color }} />
        </div>
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-foreground">{tool.name}</h1>
            {tool.badge && (
              <span className={cn(
                'text-xs px-2 py-0.5 rounded-full font-semibold',
                tool.badge === 'ai' ? 'badge-ai' : tool.badge === 'new' ? 'badge-new' : 'badge-pro'
              )}>
                {tool.badge.toUpperCase()}
              </span>
            )}
          </div>
          <p className="text-muted-foreground">{tool.description}</p>
        </div>
      </div>

      {children}
    </motion.div>
  )
}
