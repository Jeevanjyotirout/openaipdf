'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PenSquare, Download, Loader2, Trash2, Upload, Check } from 'lucide-react'
import { FileUpload, type UploadedFile } from '@/components/tools/FileUpload'
import { ToolPageWrapper } from '@/components/tools/ToolPageWrapper'
import { getToolById } from '@/lib/tools-config'
import { formatFileSize, generateId } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/ui/use-toast'

const tool = getToolById('sign')!

type SignMode = 'draw' | 'type' | 'upload'

export default function SignPDFPage() {
  const [file, setFile] = useState<UploadedFile | null>(null)
  const [mode, setMode] = useState<SignMode>('draw')
  const [typedName, setTypedName] = useState('')
  const [sigFont, setSigFont] = useState('cursive')
  const [sigColor, setSigColor] = useState('#1a1a2e')
  const [brushSize, setBrushSize] = useState(3)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasSig, setHasSig] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState<{ url: string; size: number } | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const lastPos = useRef<{ x: number; y: number } | null>(null)
  const { toast } = useToast()

  const handleFileAdded = useCallback((files: File[]) => {
    const f = files[0]
    if (!f) return
    setFile({ id: generateId(), file: f, name: f.name, size: f.size, status: 'queued', progress: 0 })
    setResult(null)
  }, [])

  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHasSig(false)
  }

  const getPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect()
    if ('touches' in e) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top }
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return
    e.preventDefault()
    setIsDrawing(true)
    lastPos.current = getPos(e, canvas)
  }

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return
    const canvas = canvasRef.current
    if (!canvas) return
    e.preventDefault()
    const ctx = canvas.getContext('2d')
    if (!ctx || !lastPos.current) return

    const pos = getPos(e, canvas)
    ctx.beginPath()
    ctx.moveTo(lastPos.current.x, lastPos.current.y)
    ctx.lineTo(pos.x, pos.y)
    ctx.strokeStyle = sigColor
    ctx.lineWidth = brushSize
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.stroke()
    lastPos.current = pos
    setHasSig(true)
  }

  const stopDrawing = () => { setIsDrawing(false); lastPos.current = null }

  const handleSign = async () => {
    if (!file) { toast({ title: 'Upload a PDF first', variant: 'destructive' }); return }

    let sigData = ''
    if (mode === 'draw') {
      if (!hasSig) { toast({ title: 'Draw your signature first', variant: 'destructive' }); return }
      sigData = canvasRef.current?.toDataURL('image/png') || ''
    } else if (mode === 'type') {
      if (!typedName.trim()) { toast({ title: 'Type your name first', variant: 'destructive' }); return }
      sigData = typedName
    }

    setProcessing(true)
    setFile((f) => f ? { ...f, status: 'uploading' as const, progress: 20 } : f)

    try {
      const formData = new FormData()
      formData.append('file', file.file)
      formData.append('mode', mode)
      formData.append('signatureData', sigData)
      formData.append('color', sigColor)

      const res = await fetch('/api/tools/sign', { method: 'POST', body: formData })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()

      setFile((f) => f ? { ...f, status: 'done' as const, progress: 100 } : f)
      setResult({ url: data.downloadUrl, size: data.size })
      toast({ title: 'PDF signed successfully!' })
    } catch (err: any) {
      setFile((f) => f ? { ...f, status: 'error' as const, error: err.message } : f)
      toast({ title: 'Signing failed', description: err.message, variant: 'destructive' })
    } finally {
      setProcessing(false)
    }
  }

  return (
    <ToolPageWrapper tool={tool}>
      <div className="space-y-6">
        {!file ? (
          <FileUpload multiple={false} onFilesAdded={handleFileAdded} files={[]} onRemove={() => setFile(null)} label="Drop a PDF to sign" />
        ) : (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border">
            <PenSquare className="w-5 h-5 text-primary shrink-0" />
            <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{file.name}</p><p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p></div>
            <button onClick={() => { setFile(null); setResult(null) }} className="text-xs text-muted-foreground hover:text-destructive">Remove</button>
          </div>
        )}

        {file && (
          <div className="space-y-4">
            {/* Mode tabs */}
            <div className="flex rounded-xl border border-border overflow-hidden">
              {(['draw', 'type', 'upload'] as SignMode[]).map((m) => (
                <button key={m} onClick={() => setMode(m)}
                  className={cn('flex-1 py-2.5 text-sm font-semibold capitalize transition-colors',
                    mode === m ? 'bg-primary text-white' : 'bg-card text-muted-foreground hover:bg-accent hover:text-foreground'
                  )}>
                  {m === 'draw' ? '✏️ Draw' : m === 'type' ? '⌨️ Type' : '📁 Upload'}
                </button>
              ))}
            </div>

            {/* Draw mode */}
            {mode === 'draw' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <label className="text-xs text-muted-foreground">Color</label>
                      <input type="color" value={sigColor} onChange={(e) => setSigColor(e.target.value)} className="w-7 h-7 rounded cursor-pointer border border-border" />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <label className="text-xs text-muted-foreground">Size</label>
                      <input type="range" min="1" max="8" value={brushSize} onChange={(e) => setBrushSize(parseInt(e.target.value))} className="w-20 accent-primary" />
                    </div>
                  </div>
                  <button onClick={clearCanvas} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="w-3.5 h-3.5" /> Clear
                  </button>
                </div>
                <div className="relative rounded-xl overflow-hidden border-2 border-dashed border-border bg-white dark:bg-zinc-950" style={{ cursor: 'crosshair' }}>
                  <canvas
                    ref={canvasRef}
                    width={600}
                    height={180}
                    className="w-full touch-none"
                    style={{ display: 'block' }}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                  />
                  {!hasSig && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <p className="text-sm text-muted-foreground/50 italic">Draw your signature here</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Type mode */}
            {mode === 'type' && (
              <div className="space-y-3">
                <input type="text" value={typedName} onChange={(e) => setTypedName(e.target.value)}
                  placeholder="Type your full name"
                  className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
                {typedName && (
                  <div className="p-6 rounded-xl border border-border bg-white dark:bg-zinc-950 flex items-center justify-center">
                    <span style={{ fontFamily: sigFont, fontSize: '2rem', color: sigColor }}>{typedName}</span>
                  </div>
                )}
                <div className="flex gap-2">
                  {['cursive', 'Georgia, serif', '"Dancing Script", cursive'].map((f, i) => (
                    <button key={i} onClick={() => setSigFont(f)}
                      className={cn('flex-1 py-2 rounded-lg border text-sm transition-colors', sigFont === f ? 'border-primary bg-primary/5' : 'border-border')}
                      style={{ fontFamily: f }}>
                      {['Style 1', 'Style 2', 'Style 3'][i]}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Upload mode */}
            {mode === 'upload' && (
              <div className="p-6 rounded-xl border-2 border-dashed border-border text-center">
                <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Upload an image of your signature</p>
                <p className="text-xs text-muted-foreground mt-1">PNG with transparent background works best</p>
                <input type="file" accept="image/*" className="hidden" id="sig-upload" onChange={(e) => { if (e.target.files?.[0]) setHasSig(true) }} />
                <label htmlFor="sig-upload" className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-lg bg-accent text-sm font-medium cursor-pointer hover:bg-accent/80 transition-colors">
                  <Upload className="w-4 h-4" /> Choose Image
                </label>
              </div>
            )}

            <button onClick={handleSign} disabled={processing}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-lg shadow-primary/20">
              {processing ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing…</> : <><PenSquare className="w-4 h-4" /> Apply Signature</>}
            </button>
          </div>
        )}

        <AnimatePresence>
          {result && (
            <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-4 p-4 rounded-2xl bg-green-500/10 border border-green-500/20">
              <Check className="w-5 h-5 text-green-600 shrink-0" />
              <div className="flex-1"><p className="text-sm font-semibold">PDF signed!</p><p className="text-xs text-muted-foreground">{formatFileSize(result.size)}</p></div>
              <a href={result.url} download="signed.pdf"
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
