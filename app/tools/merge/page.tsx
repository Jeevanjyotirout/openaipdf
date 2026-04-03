'use client'
import { useState, useCallback } from 'react'
import { motion, AnimatePresence, Reorder } from 'framer-motion'
import { FilePlus2, GripVertical, Trash2, Download, Loader2, ChevronDown, ChevronUp } from 'lucide-react'
import { FileUpload, type UploadedFile } from '@/components/tools/FileUpload'
import { ToolPageWrapper } from '@/components/tools/ToolPageWrapper'
import { getToolById } from '@/lib/tools-config'
import { formatFileSize, generateId } from '@/lib/utils'
import { useToast } from '@/components/ui/use-toast'

const tool = getToolById('merge')!

export default function MergePDFPage() {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState<{ url: string; size: number } | null>(null)
  const { toast } = useToast()

  const handleFilesAdded = useCallback((newFiles: File[]) => {
    const mapped: UploadedFile[] = newFiles.map((f) => ({
      id: generateId(),
      file: f,
      name: f.name,
      size: f.size,
      status: 'queued',
      progress: 0,
    }))
    setFiles((prev) => [...prev, ...mapped])
  }, [])

  const handleRemove = useCallback((id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id))
  }, [])

  const handleMerge = async () => {
    if (files.length < 2) {
      toast({ title: 'Add at least 2 PDFs to merge', variant: 'destructive' })
      return
    }

    setProcessing(true)
    setResult(null)

    try {
      // Update all files to uploading
      setFiles((prev) => prev.map((f) => ({ ...f, status: 'uploading', progress: 0 })))

      const formData = new FormData()
      files.forEach((f) => formData.append('files', f.file))

      const res = await fetch('/api/tools/merge', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) throw new Error(await res.text())

      const data = await res.json()

      setFiles((prev) => prev.map((f) => ({ ...f, status: 'done', progress: 100 })))
      setResult({ url: data.downloadUrl, size: data.size })

      toast({ title: 'PDFs merged successfully!' })
    } catch (err: any) {
      setFiles((prev) => prev.map((f) => ({ ...f, status: 'error', error: 'Processing failed' })))
      toast({ title: 'Merge failed', description: err.message, variant: 'destructive' })
    } finally {
      setProcessing(false)
    }
  }

  const moveUp = (id: string) => {
    setFiles((prev) => {
      const idx = prev.findIndex((f) => f.id === id)
      if (idx === 0) return prev
      const next = [...prev]
      ;[next[idx - 1], next[idx]] = [next[idx], next[idx - 1]]
      return next
    })
  }

  const moveDown = (id: string) => {
    setFiles((prev) => {
      const idx = prev.findIndex((f) => f.id === id)
      if (idx === prev.length - 1) return prev
      const next = [...prev]
      ;[next[idx], next[idx + 1]] = [next[idx + 1], next[idx]]
      return next
    })
  }

  return (
    <ToolPageWrapper tool={tool}>
      <div className="space-y-6">
        <FileUpload
          accept={{ 'application/pdf': ['.pdf'] }}
          multiple
          maxFiles={20}
          onFilesAdded={handleFilesAdded}
          files={[]}
          onRemove={handleRemove}
          label="Drop PDF files here or click to select"
          sublabel="PDF • Max 100MB per file • Up to 20 files"
        />

        {/* File order list */}
        <AnimatePresence>
          {files.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">
                  Merge order ({files.length} files)
                </h3>
                <button
                  onClick={() => setFiles([])}
                  className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                >
                  Clear all
                </button>
              </div>

              <div className="space-y-2">
                {files.map((f, i) => (
                  <motion.div
                    key={f.id}
                    layout
                    className="flex items-center gap-3 px-3 py-2.5 bg-card border border-border rounded-xl"
                  >
                    <div className="text-muted-foreground font-mono text-xs w-5 text-center shrink-0">
                      {i + 1}
                    </div>

                    <GripVertical className="w-4 h-4 text-muted-foreground shrink-0 cursor-grab" />

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{f.name}</p>
                      <p className="text-xs text-muted-foreground">{formatFileSize(f.size)}</p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => moveUp(f.id)}
                        disabled={i === 0}
                        className="p-1 rounded hover:bg-accent disabled:opacity-30 transition-colors"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => moveDown(f.id)}
                        disabled={i === files.length - 1}
                        className="p-1 rounded hover:bg-accent disabled:opacity-30 transition-colors"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleRemove(f.id)}
                        className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Action */}
              <button
                onClick={handleMerge}
                disabled={files.length < 2 || processing}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-primary/20 mt-4"
              >
                {processing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Merging PDFs…
                  </>
                ) : (
                  <>
                    <FilePlus2 className="w-4 h-4" />
                    Merge {files.length} PDFs
                  </>
                )}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Result */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-4 p-4 rounded-2xl bg-green-500/10 border border-green-500/20"
            >
              <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                <FilePlus2 className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">Merge complete!</p>
                <p className="text-xs text-muted-foreground">
                  Output size: {formatFileSize(result.size)}
                </p>
              </div>
              <a
                href={result.url}
                download="merged.pdf"
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                Download
              </a>
            </motion.div>
          )}
        </AnimatePresence>

        {/* How it works */}
        <div className="rounded-2xl bg-muted/40 border border-border p-5">
          <h3 className="text-sm font-semibold mb-3">How Merge PDF works</h3>
          <ol className="space-y-2">
            {[
              'Upload 2 or more PDF files',
              'Drag to reorder or use arrows to arrange merge sequence',
              'Click "Merge PDFs" to combine them',
              'Download your merged PDF instantly',
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </ToolPageWrapper>
  )
}
