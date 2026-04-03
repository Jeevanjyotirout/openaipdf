'use client'
import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GitCompare, Loader2, AlertCircle, CheckCircle2, FileText } from 'lucide-react'
import { FileUpload, type UploadedFile } from '@/components/tools/FileUpload'
import { ToolPageWrapper } from '@/components/tools/ToolPageWrapper'
import { getToolById } from '@/lib/tools-config'
import { formatFileSize, generateId } from '@/lib/utils'
import { useToast } from '@/components/ui/use-toast'

const tool = getToolById('compare')!

interface Difference {
  page: number
  type: 'added' | 'removed' | 'modified'
  description: string
}

export default function ComparePDFPage() {
  const [fileA, setFileA] = useState<UploadedFile | null>(null)
  const [fileB, setFileB] = useState<UploadedFile | null>(null)
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState<{
    identical: boolean
    differences: Difference[]
    pagesA: number
    pagesB: number
  } | null>(null)
  const { toast } = useToast()

  const handleFileA = useCallback((files: File[]) => {
    const f = files[0]
    if (!f) return
    setFileA({ id: generateId(), file: f, name: f.name, size: f.size, status: 'queued', progress: 0 })
    setResult(null)
  }, [])

  const handleFileB = useCallback((files: File[]) => {
    const f = files[0]
    if (!f) return
    setFileB({ id: generateId(), file: f, name: f.name, size: f.size, status: 'queued', progress: 0 })
    setResult(null)
  }, [])

  const handleCompare = async () => {
    if (!fileA || !fileB) {
      toast({ title: 'Upload both PDFs to compare', variant: 'destructive' })
      return
    }
    setProcessing(true)
    try {
      const formData = new FormData()
      formData.append('fileA', fileA.file)
      formData.append('fileB', fileB.file)
      const res = await fetch('/api/tools/compare', { method: 'POST', body: formData })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      setResult(data)
      toast({ title: data.identical ? 'Files are identical!' : `Found ${data.differences.length} difference(s)` })
    } catch (err: any) {
      toast({ title: 'Comparison failed', description: err.message, variant: 'destructive' })
    } finally {
      setProcessing(false)
    }
  }

  const diffTypeColor = { added: 'text-green-600', removed: 'text-red-600', modified: 'text-amber-600' }
  const diffTypeBg = { added: 'bg-green-500/10 border-green-500/20', removed: 'bg-red-500/10 border-red-500/20', modified: 'bg-amber-500/10 border-amber-500/20' }

  return (
    <ToolPageWrapper tool={tool}>
      <div className="space-y-6">
        {/* Two upload zones */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">A</span>
              Original PDF
            </label>
            {!fileA ? (
              <FileUpload multiple={false} onFilesAdded={handleFileA} files={[]} onRemove={() => setFileA(null)} label="Upload PDF A" sublabel="Original version" />
            ) : (
              <div className="flex items-center gap-3 p-3.5 rounded-xl bg-card border border-border">
                <FileText className="w-4 h-4 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{fileA.name}</p>
                  <p className="text-xs text-muted-foreground">{formatFileSize(fileA.size)}</p>
                </div>
                <button onClick={() => { setFileA(null); setResult(null) }} className="text-xs text-muted-foreground hover:text-destructive">✕</button>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-purple-500/10 text-purple-600 text-xs flex items-center justify-center font-bold">B</span>
              Modified PDF
            </label>
            {!fileB ? (
              <FileUpload multiple={false} onFilesAdded={handleFileB} files={[]} onRemove={() => setFileB(null)} label="Upload PDF B" sublabel="Modified version" />
            ) : (
              <div className="flex items-center gap-3 p-3.5 rounded-xl bg-card border border-border">
                <FileText className="w-4 h-4 text-purple-600 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{fileB.name}</p>
                  <p className="text-xs text-muted-foreground">{formatFileSize(fileB.size)}</p>
                </div>
                <button onClick={() => { setFileB(null); setResult(null) }} className="text-xs text-muted-foreground hover:text-destructive">✕</button>
              </div>
            )}
          </div>
        </div>

        {fileA && fileB && (
          <button
            onClick={handleCompare}
            disabled={processing}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-lg shadow-primary/20"
          >
            {processing
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Comparing PDFs…</>
              : <><GitCompare className="w-4 h-4" /> Compare PDFs</>}
          </button>
        )}

        <AnimatePresence>
          {result && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              {/* Summary */}
              <div className={`flex items-center gap-3 p-4 rounded-2xl border ${result.identical ? 'bg-green-500/10 border-green-500/20' : 'bg-amber-500/10 border-amber-500/20'}`}>
                {result.identical
                  ? <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                  : <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />}
                <div className="flex-1">
                  <p className="text-sm font-semibold">
                    {result.identical ? 'Files are identical' : `${result.differences.length} difference${result.differences.length !== 1 ? 's' : ''} found`}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    PDF A: {result.pagesA} page{result.pagesA !== 1 ? 's' : ''} · PDF B: {result.pagesB} page{result.pagesB !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              {/* Differences list */}
              {result.differences.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-semibold">Changes Detected</p>
                  {result.differences.map((diff, i) => (
                    <div key={i} className={`flex items-start gap-3 p-3.5 rounded-xl border ${diffTypeBg[diff.type]}`}>
                      <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded-full bg-white/60 dark:bg-black/30 ${diffTypeColor[diff.type]} shrink-0 mt-0.5`}>
                        {diff.type}
                      </span>
                      <div>
                        <p className="text-xs font-semibold text-foreground">Page {diff.page}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{diff.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ToolPageWrapper>
  )
}
