'use client'
import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Hash, Download, Loader2 } from 'lucide-react'
import { FileUpload, type UploadedFile } from '@/components/tools/FileUpload'
import { ToolPageWrapper } from '@/components/tools/ToolPageWrapper'
import { getToolById } from '@/lib/tools-config'
import { formatFileSize, generateId } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/ui/use-toast'

const tool = getToolById('page-numbers')!

const POSITIONS = [
  { id: 'top-left', label: 'Top Left' }, { id: 'top-center', label: 'Top Center' }, { id: 'top-right', label: 'Top Right' },
  { id: 'bottom-left', label: 'Bottom Left' }, { id: 'bottom-center', label: 'Bottom Center' }, { id: 'bottom-right', label: 'Bottom Right' },
]

export default function PageNumbersPage() {
  const [file, setFile] = useState<UploadedFile | null>(null)
  const [position, setPosition] = useState('bottom-center')
  const [startNumber, setStartNumber] = useState(1)
  const [prefix, setPrefix] = useState('')
  const [suffix, setSuffix] = useState('')
  const [fontSize, setFontSize] = useState(12)
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState<{ url: string; size: number; pagesNumbered: number } | null>(null)
  const { toast } = useToast()

  const handleFileAdded = useCallback((files: File[]) => {
    const f = files[0]
    if (!f) return
    setFile({ id: generateId(), file: f, name: f.name, size: f.size, status: 'queued' as const, progress: 0 })
    setResult(null)
  }, [])

  const handleAdd = async () => {
    if (!file) { toast({ title: 'Upload a PDF first', variant: 'destructive' }); return }
    setProcessing(true)
    setFile((f) => f ? { ...f, status: 'uploading' as const, progress: 20 } : f)
    try {
      const formData = new FormData()
      formData.append('file', file.file)
      formData.append('position', position)
      formData.append('startNumber', startNumber.toString())
      formData.append('prefix', prefix)
      formData.append('suffix', suffix)
      formData.append('fontSize', fontSize.toString())
      const res = await fetch('/api/tools/page-numbers', { method: 'POST', body: formData })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      setFile((f) => f ? { ...f, status: 'done' as const, progress: 100 } : f)
      setResult({ url: data.downloadUrl, size: data.size, pagesNumbered: data.pagesNumbered })
      toast({ title: `Page numbers added to ${data.pagesNumbered} pages!` })
    } catch (err: any) {
      setFile((f) => f ? { ...f, status: 'error' as const, error: err.message } : f)
      toast({ title: 'Failed to add page numbers', variant: 'destructive' })
    } finally { setProcessing(false) }
  }

  const preview = `${prefix}${startNumber}${suffix}`

  return (
    <ToolPageWrapper tool={tool}>
      <div className="space-y-6">
        {!file ? (
          <FileUpload multiple={false} onFilesAdded={handleFileAdded} files={[]} onRemove={() => setFile(null)} label="Drop a PDF to add page numbers" />
        ) : (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border">
            <Hash className="w-5 h-5 text-primary shrink-0" />
            <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{file.name}</p><p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p></div>
            <button onClick={() => { setFile(null); setResult(null) }} className="text-xs text-muted-foreground hover:text-destructive transition-colors">Remove</button>
          </div>
        )}

        {file && (
          <div className="space-y-5">
            {/* Position grid */}
            <div>
              <label className="block text-sm font-semibold mb-3">Position</label>
              <div className="grid grid-cols-3 gap-2">
                {POSITIONS.map((p) => (
                  <button key={p.id} onClick={() => setPosition(p.id)}
                    className={cn('py-2 px-3 rounded-xl border-2 text-xs font-medium transition-all', position === p.id ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted-foreground hover:border-primary/30')}>
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Customization */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Start Number</label>
                <input type="number" min={1} value={startNumber} onChange={(e) => setStartNumber(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full h-9 px-3 rounded-xl border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Font Size (pt)</label>
                <input type="number" min={6} max={24} value={fontSize} onChange={(e) => setFontSize(parseInt(e.target.value) || 12)}
                  className="w-full h-9 px-3 rounded-xl border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Prefix (optional)</label>
                <input type="text" placeholder="e.g. Page " value={prefix} onChange={(e) => setPrefix(e.target.value)}
                  className="w-full h-9 px-3 rounded-xl border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Suffix (optional)</label>
                <input type="text" placeholder="e.g.  of 10" value={suffix} onChange={(e) => setSuffix(e.target.value)}
                  className="w-full h-9 px-3 rounded-xl border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
              </div>
            </div>

            {/* Preview */}
            <div className="p-4 rounded-xl border border-border bg-muted/30 text-center">
              <p className="text-xs text-muted-foreground mb-2">Preview</p>
              <span className="font-mono text-sm bg-background px-3 py-1.5 rounded-lg border border-border">{preview}</span>
            </div>

            <button onClick={handleAdd} disabled={processing}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-lg shadow-primary/20">
              {processing ? <><Loader2 className="w-4 h-4 animate-spin" /> Adding numbers…</> : <><Hash className="w-4 h-4" /> Add Page Numbers</>}
            </button>
          </div>
        )}

        <AnimatePresence>
          {result && (
            <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-4 p-4 rounded-2xl bg-green-500/10 border border-green-500/20">
              <Hash className="w-5 h-5 text-green-600 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold">Page numbers added to {result.pagesNumbered} pages!</p>
                <p className="text-xs text-muted-foreground">{formatFileSize(result.size)}</p>
              </div>
              <a href={result.url} download="numbered.pdf"
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition-colors shrink-0">
                <Download className="w-4 h-4" /> Download
              </a>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ToolPageWrapper>
  )
}
