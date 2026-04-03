'use client'
import { useState } from 'react'
import { Sidebar } from '@/components/layout/Sidebar'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function ToolsLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <SiteHeader />
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className={cn('hidden lg:block shrink-0 transition-all duration-200', collapsed ? 'w-16' : 'w-64')}>
          <Sidebar collapsed={collapsed} />
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex absolute top-[76px] left-0 z-30 items-center justify-center w-5 h-8 bg-background border border-border rounded-r-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
          style={{ left: collapsed ? '52px' : '248px' }}
          aria-label="Toggle sidebar"
        >
          {collapsed ? <PanelLeftOpen className="w-3 h-3" /> : <PanelLeftClose className="w-3 h-3" />}
        </button>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto bg-background">
          {children}
        </main>
      </div>
    </div>
  )
}
