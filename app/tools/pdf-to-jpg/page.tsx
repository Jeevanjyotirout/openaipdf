'use client'
import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Image, Download, Loader2, Package } from 'lucide-react'
import { FileUpload, type UploadedFile } from '@/components/tools/FileUpload'
import { ToolPageWrapper } from '@/components/tools/ToolPageWrapper'
import { getToolById } from '@/lib/tools-config'
import { formatFileSize, generateId } from '@/lib/utils'
import { useToast } from '@/components/ui/use-toast'

const tool = getToolById('pdf-to-jpg')!

export default function PDFToJpgPage() {
  const [file, setFile] = useState<UploadedFile | null>(null)
  const [dpi, setDpi] = useState(150)
  const [quality, setQuality] = useState(90)
  const [processing, setProcessing] = useState(false)
  const [results, setResults] = useState<Array<{ filename: string; downloadUrl: string; size: number; page: number }>>([])
  const { toast } = useToast()

  const handleFileAdded = useCallback((files: File[]) => {
    const f = files[0]
    if (!f) return
    setFile({ id: generateId(), file: f, name: f.name, size: f.size, status: 'queued' as const, progress: 0 })
    setResults([])
  }, [])

  const handleConvert = async () => {
    if (!file) { toast({ title: 'Upload a PDF first', variant: 'destructive' }); return }
    setProcessing(true)
    setFile((f) => f ? { ...f, status: 'uploading' as const, progress: 20 } : f)
    try {
      const formData = new FormData()
      formData.append('file', file.file)
      formData.append('dpi', dpi.toString())
      formData.append('quality', quality.toString())
      const res = await fetch('/api/tools/pdf-to-jpg', { method: 'POST', body: formData })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      if (!data.success) throw new Error(data.error)
      setFile((f) => f ? { ...f, status: 'done' as const, progress: 100 } : f)
      setResults(data.outputs)
      toast({ title: `${data.pageCount} pages exported as JPG!` })
    } catch (err: any) {
      setFile((f) => f ? { ...f, status: 'error' as const, error: err.message } : f)
      toast({ title: 'Conversion failed', description: err.message, variant: 'destructive' })
    } finally {
      setProcessing(false)
    }
  }

  return (
    <ToolPageWrapper tool={tool}>
      <div className="space-y-6">
        {!file ? (
          <FileUpload multiple={false} onFilesAdded={handleFileAdded} files={[]} onRemove={() => setFile(null)} label="Drop a PDF to convert to images" />
        ) : (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border">
            <Image className="w-5 h-5 text-amber-500 shrink-0" />
            <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{file.name}</p><p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p></div>
            <button onClick={() => { setFile(null); setResults([]) }} className="text-xs text-muted-foreground hover:text-destructive">Remove</button>
          </div>
        )}

        {file && (
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Resolution: {dpi} DPI</label>
                <input type="range" min="72" max="300" step="24" value={dpi} onChange={(e) => setDpi(parseInt(e.target.value))} className="w-full accent-primary" />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>72 (Web)</span><span>150 (Standard)</span><span>300 (Print)</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Quality: {quality}%</label>
                <input type="range" min="40" max="100" value={quality} onChange={(e) => setQuality(parseInt(e.target.value))} className="w-full accent-primary" />
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 text-xs text-amber-700 dark:text-amber-400">
              ⚠️ Higher DPI and quality means larger file sizes. 150 DPI is recommended for most uses.
            </div>
            <button onClick={handleConvert} disabled={processing}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-lg shadow-primary/20">
              {processing ? <><Loader2 className="w-4 h-4 animate-spin" /> Converting pages…</> : <><Image className="w-4 h-4" /> Convert to JPG</>}
            </button>
          </div>
        )}

        <AnimatePresence>
          {results.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
              <div className="flex items-center gap-2 p-3 rounded-xl bg-green-500/10 border border-green-500/20">
                <Package className="w-4 h-4 text-green-600" />
                <p className="text-sm font-medium text-green-700 dark:text-green-400">{results.length} JPG images ready</p>
              </div>
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {results.map((r) => (
                  <div key={r.page} className="flex items-center gap-3 p-3.5 rounded-xl bg-card border border-border">
                    <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center text-xs font-bold text-amber-600">{r.page}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">Page {r.page}</p>
                      <p className="text-xs text-muted-foreground">{formatFileSize(r.size)}</p>
                    </div>
                    <a href={r.downloadUrl} download={r.filename}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-colors">
                      <Download className="w-3.5 h-3.5" /> Save
                    </a>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ToolPageWrapper>
  )
}
