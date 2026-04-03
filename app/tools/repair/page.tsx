'use client'
import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Wrench, Download, Loader2, ShieldCheck } from 'lucide-react'
import { FileUpload, type UploadedFile } from '@/components/tools/FileUpload'
import { ToolPageWrapper } from '@/components/tools/ToolPageWrapper'
import { getToolById } from '@/lib/tools-config'
import { formatFileSize, generateId } from '@/lib/utils'
import { useToast } from '@/components/ui/use-toast'

const tool = getToolById('repair')!

export default function RepairPDFPage() {
  const [file, setFile] = useState<UploadedFile | null>(null)
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState<{ url: string; size: number; issues: string[] } | null>(null)
  const { toast } = useToast()

  const handleFileAdded = useCallback((files: File[]) => {
    const f = files[0]
    if (!f) return
    setFile({ id: generateId(), file: f, name: f.name, size: f.size, status: 'queued', progress: 0 })
    setResult(null)
  }, [])

  const handleRepair = async () => {
    if (!file) { toast({ title: 'Upload a PDF first', variant: 'destructive' }); return }
    setProcessing(true)
    setFile((f) => f ? { ...f, status: 'uploading' as const, progress: 20 } : f)
    try {
      const formData = new FormData()
      formData.append('file', file.file)
      const res = await fetch('/api/tools/repair', { method: 'POST', body: formData })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      setFile((f) => f ? { ...f, status: 'done' as const, progress: 100 } : f)
      setResult({ url: data.downloadUrl, size: data.size, issues: data.issuesFixed })
      toast({ title: 'PDF repaired successfully!' })
    } catch (err: any) {
      setFile((f) => f ? { ...f, status: 'error' as const, error: err.message } : f)
      toast({ title: 'Repair failed', description: err.message, variant: 'destructive' })
    } finally {
      setProcessing(false)
    }
  }

  return (
    <ToolPageWrapper tool={tool}>
      <div className="space-y-6">
        {!file ? (
          <FileUpload multiple={false} onFilesAdded={handleFileAdded} files={[]} onRemove={() => setFile(null)}
            label="Drop a corrupted or damaged PDF" sublabel="PDF · Max 100MB" />
        ) : (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border">
            <Wrench className="w-5 h-5 text-green-600 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{file.name}</p>
              <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
            </div>
            <button onClick={() => { setFile(null); setResult(null) }} className="text-xs text-muted-foreground hover:text-destructive transition-colors">Remove</button>
          </div>
        )}

        {file && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              {['Fix broken cross-references', 'Rebuild corrupted object table', 'Recover damaged page tree', 'Fix invalid metadata'].map((fix) => (
                <div key={fix} className="flex items-center gap-2 text-muted-foreground">
                  <ShieldCheck className="w-3.5 h-3.5 text-green-600 shrink-0" />
                  <span className="text-xs">{fix}</span>
                </div>
              ))}
            </div>
            <button onClick={handleRepair} disabled={processing}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-lg shadow-primary/20">
              {processing ? <><Loader2 className="w-4 h-4 animate-spin" /> Repairing…</> : <><Wrench className="w-4 h-4" /> Repair PDF</>}
            </button>
          </div>
        )}

        <AnimatePresence>
          {result && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
              {result.issues.length > 0 && (
                <div className="p-4 rounded-xl bg-muted/40 border border-border">
                  <p className="text-xs font-semibold mb-2">Issues fixed:</p>
                  <ul className="space-y-1">
                    {result.issues.map((issue, i) => (
                      <li key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <ShieldCheck className="w-3 h-3 text-green-600 shrink-0" /> {issue}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-green-500/10 border border-green-500/20">
                <Wrench className="w-5 h-5 text-green-600 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-semibold">PDF repaired!</p>
                  <p className="text-xs text-muted-foreground">{formatFileSize(result.size)}</p>
                </div>
                <a href={result.url} download="repaired.pdf"
                  className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition-colors">
                  <Download className="w-4 h-4" /> Download
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ToolPageWrapper>
  )
}
