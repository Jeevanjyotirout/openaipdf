'use client'
import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileImage, Download, Loader2, X, GripVertical } from 'lucide-react'
import { FileUpload, type UploadedFile } from '@/components/tools/FileUpload'
import { ToolPageWrapper } from '@/components/tools/ToolPageWrapper'
import { getToolById } from '@/lib/tools-config'
import { formatFileSize, generateId } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/ui/use-toast'

const tool = getToolById('jpg-to-pdf')!

const PAGE_SIZES = [
  { id: 'A4', label: 'A4 (210×297mm)' },
  { id: 'Letter', label: 'Letter (8.5×11in)' },
  { id: 'fit', label: 'Fit to Image' },
]

export default function JpgToPDFPage() {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [pageSize, setPageSize] = useState('A4')
  const [quality, setQuality] = useState(85)
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState<{ url: string; size: number; pageCount: number } | null>(null)
  const { toast } = useToast()

  const handleFilesAdded = useCallback((newFiles: File[]) => {
    const mapped: UploadedFile[] = newFiles.map((f) => ({
      id: generateId(), file: f, name: f.name, size: f.size, status: 'queued' as const, progress: 0,
    }))
    setFiles((prev) => [...prev, ...mapped])
    setResult(null)
  }, [])

  const handleConvert = async () => {
    if (!files.length) { toast({ title: 'Add at least one image', variant: 'destructive' }); return }
    setProcessing(true)
    setFiles((prev) => prev.map((f) => ({ ...f, status: 'uploading' as const, progress: 20 })))

    try {
      const formData = new FormData()
      files.forEach((f) => formData.append('files', f.file))
      formData.append('pageSize', pageSize)
      formData.append('quality', quality.toString())

      const res = await fetch('/api/tools/jpg-to-pdf', { method: 'POST', body: formData })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()

      setFiles((prev) => prev.map((f) => ({ ...f, status: 'done' as const, progress: 100 })))
      setResult({ url: data.downloadUrl, size: data.size, pageCount: data.pageCount })
      toast({ title: `${data.pageCount} pages converted to PDF!` })
    } catch (err: any) {
      setFiles((prev) => prev.map((f) => ({ ...f, status: 'error' as const, error: err.message })))
      toast({ title: 'Conversion failed', description: err.message, variant: 'destructive' })
    } finally {
      setProcessing(false)
    }
  }

  return (
    <ToolPageWrapper tool={tool}>
      <div className="space-y-6">
        <FileUpload
          accept={{ 'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'] }}
          multiple
          maxFiles={50}
          onFilesAdded={handleFilesAdded}
          files={[]}
          onRemove={(id) => setFiles((prev) => prev.filter((f) => f.id !== id))}
          label="Drop images here (JPG, PNG, WebP…)"
          sublabel="Images • Max 50MB each • Up to 50 files"
        />

        {files.length > 0 && (
          <div className="space-y-4">
            {/* Image list */}
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">{files.length} image{files.length > 1 ? 's' : ''} selected</p>
              <button onClick={() => setFiles([])} className="text-xs text-muted-foreground hover:text-destructive transition-colors">Clear all</button>
            </div>
            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {files.map((f, i) => (
                <div key={f.id} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border">
                  <span className="text-xs text-muted-foreground font-mono w-5">{i + 1}</span>
                  <GripVertical className="w-3.5 h-3.5 text-muted-foreground" />
                  <FileImage className="w-4 h-4 text-amber-500 shrink-0" />
                  <span className="flex-1 text-sm font-medium truncate">{f.name}</span>
                  <span className="text-xs text-muted-foreground">{formatFileSize(f.size)}</span>
                  <button onClick={() => setFiles((p) => p.filter((x) => x.id !== f.id))} className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Settings */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Page Size</label>
                <select value={pageSize} onChange={(e) => setPageSize(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  {PAGE_SIZES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Image Quality: {quality}%</label>
                <input type="range" min="40" max="100" value={quality} onChange={(e) => setQuality(parseInt(e.target.value))} className="w-full mt-2 accent-primary" />
              </div>
            </div>

            <button onClick={handleConvert} disabled={processing}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-lg shadow-primary/20">
              {processing ? <><Loader2 className="w-4 h-4 animate-spin" /> Converting…</> : <><FileImage className="w-4 h-4" /> Convert to PDF</>}
            </button>
          </div>
        )}

        <AnimatePresence>
          {result && (
            <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-4 p-4 rounded-2xl bg-green-500/10 border border-green-500/20">
              <FileImage className="w-5 h-5 text-green-600 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold">PDF created — {result.pageCount} pages!</p>
                <p className="text-xs text-muted-foreground">{formatFileSize(result.size)}</p>
              </div>
              <a href={result.url} download="images.pdf"
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition-colors shrink-0">
                <Download className="w-4 h-4" /> Download PDF
              </a>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ToolPageWrapper>
  )
}
