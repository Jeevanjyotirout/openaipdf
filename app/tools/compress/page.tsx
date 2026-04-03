'use client'
import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Minimize2, Download, Loader2, Info } from 'lucide-react'
import { FileUpload, type UploadedFile } from '@/components/tools/FileUpload'
import { ToolPageWrapper } from '@/components/tools/ToolPageWrapper'
import { getToolById } from '@/lib/tools-config'
import { formatFileSize, generateId } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/ui/use-toast'

const tool = getToolById('compress')!

const COMPRESSION_LEVELS = [
  {
    id: 'low',
    label: 'Low Compression',
    desc: 'Best quality, slight size reduction (~20%)',
    color: 'hsl(142, 76%, 45%)',
    icon: '🟢',
  },
  {
    id: 'medium',
    label: 'Medium Compression',
    desc: 'Good quality, moderate size reduction (~50%)',
    color: 'hsl(38, 100%, 55%)',
    icon: '🟡',
  },
  {
    id: 'high',
    label: 'High Compression',
    desc: 'Reduced quality, maximum size reduction (~80%)',
    color: 'hsl(0, 84%, 60%)',
    icon: '🔴',
  },
]

export default function CompressPDFPage() {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [level, setLevel] = useState('medium')
  const [processing, setProcessing] = useState(false)
  const [results, setResults] = useState<Array<{ name: string; originalSize: number; compressedSize: number; url: string }>>([])
  const { toast } = useToast()

  const handleFilesAdded = useCallback((newFiles: File[]) => {
    const mapped: UploadedFile[] = newFiles.map((f) => ({
      id: generateId(), file: f, name: f.name, size: f.size, status: 'queued', progress: 0,
    }))
    setFiles((prev) => [...prev, ...mapped])
  }, [])

  const handleRemove = useCallback((id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id))
  }, [])

  const handleCompress = async () => {
    if (!files.length) {
      toast({ title: 'Upload at least one PDF', variant: 'destructive' })
      return
    }
    setProcessing(true)
    setResults([])

    try {
      setFiles((prev) => prev.map((f) => ({ ...f, status: 'uploading' as const, progress: 20 })))

      const allResults = []
      for (const f of files) {
        const formData = new FormData()
        formData.append('file', f.file)
        formData.append('level', level)

        const res = await fetch('/api/tools/compress', { method: 'POST', body: formData })
        if (!res.ok) throw new Error(`Failed to compress ${f.name}`)

        const data = await res.json()
        allResults.push({ name: f.name, originalSize: f.size, compressedSize: data.size, url: data.downloadUrl })

        setFiles((prev) => prev.map((pf) => pf.id === f.id ? { ...pf, status: 'done' as const, progress: 100 } : pf))
      }
      setResults(allResults)
      toast({ title: `${allResults.length} file(s) compressed!` })
    } catch (err: any) {
      setFiles((prev) => prev.map((f) => ({ ...f, status: 'error' as const, error: 'Failed' })))
      toast({ title: 'Compression failed', description: err.message, variant: 'destructive' })
    } finally {
      setProcessing(false)
    }
  }

  const totalSaved = results.reduce((acc, r) => acc + (r.originalSize - r.compressedSize), 0)
  const avgReduction = results.length
    ? Math.round((1 - results.reduce((a, r) => a + r.compressedSize / r.originalSize, 0) / results.length) * 100)
    : 0

  return (
    <ToolPageWrapper tool={tool}>
      <div className="space-y-6">
        <FileUpload
          onFilesAdded={handleFilesAdded}
          files={[]}
          onRemove={handleRemove}
          label="Drop PDFs to compress"
          sublabel="PDF • Max 100MB per file"
        />

        {/* Compression level */}
        <div>
          <label className="block text-sm font-semibold mb-3">Compression Level</label>
          <div className="grid grid-cols-3 gap-3">
            {COMPRESSION_LEVELS.map((lvl) => (
              <button
                key={lvl.id}
                onClick={() => setLevel(lvl.id)}
                className={cn(
                  'relative flex flex-col items-start gap-2 p-4 rounded-xl border-2 transition-all text-left',
                  level === lvl.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border bg-card hover:border-primary/40'
                )}
              >
                <span className="text-xl">{lvl.icon}</span>
                <span className="text-sm font-semibold">{lvl.label}</span>
                <span className="text-xs text-muted-foreground leading-snug">{lvl.desc}</span>
                {level === lvl.id && (
                  <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-primary" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Info */}
        <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/60 text-xs text-muted-foreground">
          <Info className="w-4 h-4 shrink-0 mt-0.5" />
          <span>Your files are processed securely and deleted automatically after 2 hours.</span>
        </div>

        {/* Compress button */}
        {files.length > 0 && (
          <button
            onClick={handleCompress}
            disabled={processing}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-lg shadow-primary/20"
          >
            {processing ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Compressing…</>
            ) : (
              <><Minimize2 className="w-4 h-4" /> Compress {files.length} PDF{files.length > 1 ? 's' : ''}</>
            )}
          </button>
        )}

        {/* Results */}
        <AnimatePresence>
          {results.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
            >
              {/* Summary */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-center">
                  <p className="text-2xl font-bold text-green-600">{avgReduction}%</p>
                  <p className="text-xs text-muted-foreground mt-1">Size reduction</p>
                </div>
                <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 text-center">
                  <p className="text-2xl font-bold text-primary">{formatFileSize(totalSaved)}</p>
                  <p className="text-xs text-muted-foreground mt-1">Space saved</p>
                </div>
              </div>

              {/* Per-file results */}
              {results.map((r) => (
                <div key={r.name} className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{r.name}</p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <span>{formatFileSize(r.originalSize)}</span>
                      <span>→</span>
                      <span className="text-green-600 font-medium">{formatFileSize(r.compressedSize)}</span>
                    </div>
                    <div className="progress-bar mt-2">
                      <div className="progress-fill" style={{ width: `${(r.compressedSize / r.originalSize) * 100}%` }} />
                    </div>
                  </div>
                  <a
                    href={r.url}
                    download={r.name}
                    className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download
                  </a>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ToolPageWrapper>
  )
}
