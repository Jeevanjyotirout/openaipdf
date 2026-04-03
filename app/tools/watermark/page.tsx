'use client'
import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Droplets, Download, Loader2 } from 'lucide-react'
import { FileUpload, type UploadedFile } from '@/components/tools/FileUpload'
import { ToolPageWrapper } from '@/components/tools/ToolPageWrapper'
import { getToolById } from '@/lib/tools-config'
import { formatFileSize, generateId } from '@/lib/utils'
import { useToast } from '@/components/ui/use-toast'

const tool = getToolById('watermark')!

export default function WatermarkPage() {
  const [file, setFile] = useState<UploadedFile | null>(null)
  const [text, setText] = useState('CONFIDENTIAL')
  const [opacity, setOpacity] = useState(0.3)
  const [angle, setAngle] = useState(45)
  const [fontSize, setFontSize] = useState(60)
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState<{ url: string; size: number } | null>(null)
  const { toast } = useToast()

  const handleFileAdded = useCallback((files: File[]) => {
    const f = files[0]
    if (!f) return
    setFile({ id: generateId(), file: f, name: f.name, size: f.size, status: 'queued', progress: 0 })
    setResult(null)
  }, [])

  const handleWatermark = async () => {
    if (!file) { toast({ title: 'Upload a PDF first', variant: 'destructive' }); return }
    if (!text.trim()) { toast({ title: 'Enter watermark text', variant: 'destructive' }); return }
    setProcessing(true)
    setFile((f) => f ? { ...f, status: 'uploading' as const, progress: 20 } : f)
    try {
      const formData = new FormData()
      formData.append('file', file.file)
      formData.append('type', 'text')
      formData.append('text', text)
      formData.append('opacity', opacity.toString())
      formData.append('angle', angle.toString())
      formData.append('fontSize', fontSize.toString())
      const res = await fetch('/api/tools/watermark', { method: 'POST', body: formData })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      setFile((f) => f ? { ...f, status: 'done' as const, progress: 100 } : f)
      setResult({ url: data.downloadUrl, size: data.size })
      toast({ title: 'Watermark applied!' })
    } catch (err: any) {
      setFile((f) => f ? { ...f, status: 'error' as const, error: err.message } : f)
      toast({ title: 'Watermark failed', variant: 'destructive' })
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
            <Droplets className="w-5 h-5 text-primary shrink-0" />
            <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{file.name}</p><p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p></div>
            <button onClick={() => { setFile(null); setResult(null) }} className="text-xs text-muted-foreground hover:text-destructive">Remove</button>
          </div>
        )}

        {file && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold mb-2">Watermark Text</label>
              <input type="text" value={text} onChange={(e) => setText(e.target.value)} placeholder="e.g. CONFIDENTIAL, DRAFT"
                className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
            </div>

            {/* Live preview */}
            <div className="relative h-32 rounded-xl border-2 border-dashed border-border bg-muted/30 overflow-hidden flex items-center justify-center">
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
                <span className="font-bold text-foreground whitespace-nowrap" style={{ fontSize: `${Math.min(fontSize / 3, 28)}px`, opacity, transform: `rotate(-${angle}deg)`, color: 'rgba(100,100,100,1)' }}>
                  {text || 'Preview'}
                </span>
              </div>
              <p className="text-xs text-muted-foreground relative z-10 bg-background/80 px-2 py-1 rounded">Preview</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-2 text-muted-foreground">Opacity: {Math.round(opacity * 100)}%</label>
                <input type="range" min="5" max="80" value={Math.round(opacity * 100)} onChange={(e) => setOpacity(parseInt(e.target.value) / 100)} className="w-full accent-primary" />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-2 text-muted-foreground">Angle: {angle}°</label>
                <input type="range" min="0" max="90" value={angle} onChange={(e) => setAngle(parseInt(e.target.value))} className="w-full accent-primary" />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-2 text-muted-foreground">Font Size: {fontSize}pt</label>
                <input type="range" min="20" max="150" value={fontSize} onChange={(e) => setFontSize(parseInt(e.target.value))} className="w-full accent-primary" />
              </div>
            </div>

            <button onClick={handleWatermark} disabled={processing}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-lg shadow-primary/20">
              {processing ? <><Loader2 className="w-4 h-4 animate-spin" /> Applying…</> : <><Droplets className="w-4 h-4" /> Add Watermark</>}
            </button>
          </div>
        )}

        <AnimatePresence>
          {result && (
            <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-4 p-4 rounded-2xl bg-green-500/10 border border-green-500/20">
              <Droplets className="w-5 h-5 text-green-600 shrink-0" />
              <div className="flex-1"><p className="text-sm font-semibold">Watermark applied!</p><p className="text-xs text-muted-foreground">{formatFileSize(result.size)}</p></div>
              <a href={result.url} download="watermarked.pdf"
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
