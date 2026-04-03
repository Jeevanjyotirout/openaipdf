'use client'
import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Scissors, Download, Loader2, Info, Package } from 'lucide-react'
import { FileUpload, type UploadedFile } from '@/components/tools/FileUpload'
import { ToolPageWrapper } from '@/components/tools/ToolPageWrapper'
import { getToolById } from '@/lib/tools-config'
import { formatFileSize, generateId } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/ui/use-toast'

const tool = getToolById('split')!

type SplitMode = 'every' | 'ranges'

export default function SplitPDFPage() {
  const [file, setFile] = useState<UploadedFile | null>(null)
  const [mode, setMode] = useState<SplitMode>('every')
  const [ranges, setRanges] = useState('')
  const [processing, setProcessing] = useState(false)
  const [results, setResults] = useState<Array<{ filename: string; downloadUrl: string; pages: number; size: number }>>([])
  const { toast } = useToast()

  const handleFileAdded = useCallback((files: File[]) => {
    const f = files[0]
    if (!f) return
    setFile({ id: generateId(), file: f, name: f.name, size: f.size, status: 'queued', progress: 0 })
    setResults([])
  }, [])

  const handleSplit = async () => {
    if (!file) { toast({ title: 'Upload a PDF first', variant: 'destructive' }); return }
    if (mode === 'ranges' && !ranges.trim()) { toast({ title: 'Enter page ranges (e.g. 1-3,5,7-9)', variant: 'destructive' }); return }

    setProcessing(true)
    setFile((f) => f ? { ...f, status: 'uploading', progress: 20 } : f)

    try {
      const formData = new FormData()
      formData.append('file', file.file)
      formData.append('mode', mode)
      if (mode === 'ranges') formData.append('ranges', ranges)

      const res = await fetch('/api/tools/split', { method: 'POST', body: formData })
      if (!res.ok) throw new Error(await res.text())

      const data = await res.json()
      setFile((f) => f ? { ...f, status: 'done', progress: 100 } : f)
      setResults(data.outputs)
      toast({ title: `Split into ${data.outputCount} files!` })
    } catch (err: any) {
      setFile((f) => f ? { ...f, status: 'error', error: err.message } : f)
      toast({ title: 'Split failed', description: err.message, variant: 'destructive' })
    } finally {
      setProcessing(false)
    }
  }

  return (
    <ToolPageWrapper tool={tool}>
      <div className="space-y-6">
        {!file ? (
          <FileUpload
            multiple={false}
            onFilesAdded={handleFileAdded}
            files={[]}
            onRemove={() => setFile(null)}
            label="Drop a PDF to split"
          />
        ) : (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Scissors className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{file.name}</p>
              <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
            </div>
            <button onClick={() => { setFile(null); setResults([]) }} className="text-xs text-muted-foreground hover:text-destructive transition-colors">Remove</button>
          </div>
        )}

        {/* Mode selector */}
        {file && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-3">Split Mode</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'every', label: 'Extract Every Page', desc: 'Each page becomes its own PDF' },
                  { id: 'ranges', label: 'Custom Ranges', desc: 'Define exact page ranges to extract' },
                ].map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setMode(m.id as SplitMode)}
                    className={cn(
                      'relative text-left p-4 rounded-xl border-2 transition-all',
                      mode === m.id ? 'border-primary bg-primary/5' : 'border-border bg-card hover:border-primary/40'
                    )}
                  >
                    <p className="text-sm font-semibold">{m.label}</p>
                    <p className="text-xs text-muted-foreground mt-1">{m.desc}</p>
                    {mode === m.id && <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-primary" />}
                  </button>
                ))}
              </div>
            </div>

            {mode === 'ranges' && (
              <div>
                <label className="block text-sm font-semibold mb-2">Page Ranges</label>
                <input
                  type="text"
                  value={ranges}
                  onChange={(e) => setRanges(e.target.value)}
                  placeholder="e.g. 1-3, 5, 7-9"
                  className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <p className="text-xs text-muted-foreground mt-1.5">
                  Use commas to separate ranges. Each range becomes one PDF.
                </p>
              </div>
            )}

            <button
              onClick={handleSplit}
              disabled={processing}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-lg shadow-primary/20"
            >
              {processing ? <><Loader2 className="w-4 h-4 animate-spin" /> Splitting…</> : <><Scissors className="w-4 h-4" /> Split PDF</>}
            </button>
          </div>
        )}

        {/* Results */}
        <AnimatePresence>
          {results.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
              <div className="flex items-center gap-2 p-3 rounded-xl bg-green-500/10 border border-green-500/20">
                <Package className="w-4 h-4 text-green-600" />
                <p className="text-sm font-medium text-green-700 dark:text-green-400">
                  Split into {results.length} files — click to download individually
                </p>
              </div>
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {results.map((r, i) => (
                  <div key={i} className="flex items-center gap-3 p-3.5 rounded-xl bg-card border border-border">
                    <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">{i + 1}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{r.filename}</p>
                      <p className="text-xs text-muted-foreground">{r.pages} page{r.pages > 1 ? 's' : ''} · {formatFileSize(r.size)}</p>
                    </div>
                    <a href={r.downloadUrl} download={r.filename} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-colors">
                      <Download className="w-3.5 h-3.5" /> Download
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
