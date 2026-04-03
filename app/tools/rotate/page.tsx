'use client'
import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RotateCw, Download, Loader2 } from 'lucide-react'
import { FileUpload, type UploadedFile } from '@/components/tools/FileUpload'
import { ToolPageWrapper } from '@/components/tools/ToolPageWrapper'
import { getToolById } from '@/lib/tools-config'
import { formatFileSize, generateId } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/ui/use-toast'

const tool = getToolById('rotate')!
const ANGLES = [
  { value: '90',  label: '90° Right', icon: '↻' },
  { value: '180', label: '180° Flip',  icon: '⇅' },
  { value: '270', label: '90° Left',   icon: '↺' },
]

export default function RotatePDFPage() {
  const [file, setFile] = useState<UploadedFile | null>(null)
  const [angle, setAngle] = useState('90')
  const [pages, setPages] = useState('all')
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState<{ url: string; size: number } | null>(null)
  const { toast } = useToast()

  const handleFileAdded = useCallback((files: File[]) => {
    const f = files[0]
    if (!f) return
    setFile({ id: generateId(), file: f, name: f.name, size: f.size, status: 'queued', progress: 0 })
    setResult(null)
  }, [])

  const handleRotate = async () => {
    if (!file) { toast({ title: 'Upload a PDF first', variant: 'destructive' }); return }
    setProcessing(true)
    setFile((f) => f ? { ...f, status: 'uploading' as const, progress: 20 } : f)
    try {
      const formData = new FormData()
      formData.append('file', file.file)
      formData.append('angle', angle)
      formData.append('pages', pages)
      const res = await fetch('/api/tools/rotate', { method: 'POST', body: formData })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      setFile((f) => f ? { ...f, status: 'done' as const, progress: 100 } : f)
      setResult({ url: data.downloadUrl, size: data.size })
      toast({ title: `${data.pagesRotated} page(s) rotated!` })
    } catch (err: any) {
      setFile((f) => f ? { ...f, status: 'error' as const, error: err.message } : f)
      toast({ title: 'Rotation failed', variant: 'destructive' })
    } finally {
      setProcessing(false)
    }
  }

  return (
    <ToolPageWrapper tool={tool}>
      <div className="space-y-6">
        {!file ? (
          <FileUpload multiple={false} onFilesAdded={handleFileAdded} files={[]} onRemove={() => setFile(null)} />
        ) : (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <RotateCw className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{file.name}</p>
              <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
            </div>
            <button onClick={() => { setFile(null); setResult(null) }} className="text-xs text-muted-foreground hover:text-destructive">Remove</button>
          </div>
        )}

        {file && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold mb-3">Rotation Angle</label>
              <div className="grid grid-cols-3 gap-3">
                {ANGLES.map((a) => (
                  <button key={a.value} onClick={() => setAngle(a.value)}
                    className={cn('p-4 rounded-xl border-2 transition-all text-center', angle === a.value ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40')}>
                    <span className="text-2xl block mb-1">{a.icon}</span>
                    <span className="text-xs font-semibold">{a.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Which Pages</label>
              <select value={pages} onChange={(e) => setPages(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <option value="all">All pages</option>
                <option value="1">First page only</option>
              </select>
              <p className="text-xs text-muted-foreground mt-1.5">For custom pages enter comma-separated numbers (e.g. 1,3,5)</p>
              <input type="text" placeholder="Custom pages: 1,3,5-8"
                className="w-full h-10 px-3 mt-2 rounded-xl border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onChange={(e) => setPages(e.target.value || 'all')} />
            </div>
            <button onClick={handleRotate} disabled={processing}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-lg shadow-primary/20">
              {processing ? <><Loader2 className="w-4 h-4 animate-spin" /> Rotating…</> : <><RotateCw className="w-4 h-4" /> Rotate PDF</>}
            </button>
          </div>
        )}

        <AnimatePresence>
          {result && (
            <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-4 p-4 rounded-2xl bg-green-500/10 border border-green-500/20">
              <RotateCw className="w-5 h-5 text-green-600 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold">Rotation complete!</p>
                <p className="text-xs text-muted-foreground">Size: {formatFileSize(result.size)}</p>
              </div>
              <a href={result.url} download="rotated.pdf"
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition-colors">
                <Download className="w-4 h-4" /> Download
              </a>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ToolPageWrapper>
  )
}
