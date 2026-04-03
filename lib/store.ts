import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ProcessingJob {
  id: string
  tool: string
  toolName: string
  status: 'queued' | 'processing' | 'done' | 'error'
  progress: number
  inputFileName?: string
  outputUrl?: string
  error?: string
  createdAt: number
}

export interface RecentTool {
  id: string
  name: string
  href: string
  usedAt: number
}

// ── App Store ─────────────────────────────────────────────────────────────────

interface AppState {
  // Active jobs
  jobs: ProcessingJob[]
  addJob: (job: ProcessingJob) => void
  updateJob: (id: string, updates: Partial<ProcessingJob>) => void
  removeJob: (id: string) => void
  clearJobs: () => void

  // Recent tools (persisted)
  recentTools: RecentTool[]
  trackToolUsage: (tool: { id: string; name: string; href: string }) => void

  // UI preferences (persisted)
  sidebarCollapsed: boolean
  setSidebarCollapsed: (collapsed: boolean) => void
  uploadQuality: 'low' | 'medium' | 'high'
  setUploadQuality: (q: 'low' | 'medium' | 'high') => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Jobs (non-persisted, session only)
      jobs: [],
      addJob: (job) => set((s) => ({ jobs: [job, ...s.jobs].slice(0, 20) })),
      updateJob: (id, updates) =>
        set((s) => ({
          jobs: s.jobs.map((j) => (j.id === id ? { ...j, ...updates } : j)),
        })),
      removeJob: (id) => set((s) => ({ jobs: s.jobs.filter((j) => j.id !== id) })),
      clearJobs: () => set({ jobs: [] }),

      // Recent tools
      recentTools: [],
      trackToolUsage: (tool) => {
        const existing = get().recentTools.filter((t) => t.id !== tool.id)
        const updated: RecentTool[] = [
          { ...tool, usedAt: Date.now() },
          ...existing,
        ].slice(0, 8)
        set({ recentTools: updated })
      },

      // UI preferences
      sidebarCollapsed: false,
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      uploadQuality: 'medium',
      setUploadQuality: (q) => set({ uploadQuality: q }),
    }),
    {
      name: 'openaipdf-store',
      storage: createJSONStorage(() => localStorage),
      // Only persist preferences, not jobs
      partialize: (state) => ({
        recentTools: state.recentTools,
        sidebarCollapsed: state.sidebarCollapsed,
        uploadQuality: state.uploadQuality,
      }),
    }
  )
)

// ── Job polling hook helper ───────────────────────────────────────────────────

/**
 * Polls a job status endpoint until completion or error.
 * Usage: pollJobStatus('job-123', 'pdf:merge', updateJob)
 */
export async function pollJobStatus(
  jobId: string,
  queueName: string,
  onUpdate: (updates: Partial<ProcessingJob>) => void,
  intervalMs = 2000,
  maxAttempts = 90 // 3 minutes max
): Promise<void> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await new Promise((r) => setTimeout(r, intervalMs))

    try {
      const res = await fetch(`/api/jobs/${jobId}?queue=${encodeURIComponent(queueName)}`)
      if (!res.ok) continue

      const data = await res.json()
      onUpdate({
        status: data.status,
        progress: data.progress,
        outputUrl: data.result?.downloadUrl,
        error: data.error,
      })

      if (data.status === 'done' || data.status === 'error') return
    } catch {
      // Network error — keep polling
    }
  }

  onUpdate({ status: 'error', error: 'Processing timed out' })
}
