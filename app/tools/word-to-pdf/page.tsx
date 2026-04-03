'use client'
import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileText, Download, Loader2 } from 'lucide-react'
import { FileUpload, type UploadedFile } from '@/components/tools/FileUpload'
import { ToolPageWrapper } from '@/components/tools/ToolPageWrapper'
import { getToolById } from '@/lib/tools-config'
import { formatFileSize, generateId } from '@/lib/utils'
import { useToast } from '@/components/ui/use-toast'

const tool = getToolById('word-to-pdf')!

export default function WordToPDFPage() {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [processing, setProcessing] = useState(false)
  const [results, setResults] = useState<Array<{ name: string; url: string; size: number }>>([])
  const { toast } = useToast()

  const handleFilesAdded = useCallback((newFiles: File[]) => {
    setFiles((prev) => [
      ...prev,
      ...newFiles.map((f) => ({ id: generateId(), file: f, name: f.name, size: f.size, status: 'queued' as const, progress: 0 })),
    ])
    setResults([])
  }, [])

  const handleConvert = async () => {
    if (!files.length) { toast({ title: 'Upload at least one Word file', variant: 'destructive' }); return }
    setProcessing(true)
    setFiles((p) => p.map((f) => ({ ...f, status: 'uploading' as const, progress: 20 })))
    try {
      const out: typeof results = []
      for (const f of files) {
        const formData = new FormData()
        formData.append('file', f.file)
        formData.append('format', 'docx')
        const res = await fetch('/api/tools/convert-to-pdf', { method: 'POST', body: formData })
        if (!res.ok) throw new Error(`Failed: ${f.name}`)
        const data = await res.json()
        out.push({ name: f.name.replace(/\.(docx?|odt)$/i, '.pdf'), url: data.downloadUrl, size: data.size })
        setFiles((p) => p.map((pf) => pf.id === f.id ? { ...pf, status: 'done' as const, progress: 100 } : pf))
      }
      setResults(out)
      toast({ title: `${out.length} file(s) converted!` })
    } catch (err: any) {
      setFiles((p) => p.map((f) => ({ ...f, status: 'error' as const, error: 'Failed' })))
      toast({ title: 'Conversion failed', description: err.message, variant: 'destructive' })
    } finally { setProcessing(false) }
  }

  return (
    <ToolPageWrapper tool={tool}>
      <div className="space-y-6">
        <FileUpload
          accept={{ 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'], 'application/msword': ['.doc'], 'application/vnd.oasis.opendocument.text': ['.odt'] }}
          multiple maxFiles={10} onFilesAdded={handleFilesAdded} files={[]} onRemove={(id) => setFiles((p) => p.filter((f) => f.id !== id))}
          label="Drop Word documents (.docx, .doc)" sublabel="DOCX, DOC, ODT · Max 50MB · Up to 10 files"
        />
        {files.length > 0 && (
          <button onClick={handleConvert} disabled={processing}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-lg shadow-primary/20">
            {processing ? <><Loader2 className="w-4 h-4 animate-spin" /> Converting…</> : <><FileText className="w-4 h-4" /> Convert to PDF</>}
          </button>
        )}
        <AnimatePresence>
          {results.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
              {results.map((r, i) => (
                <div key={i} className="flex items-center gap-3 p-3.5 rounded-xl bg-card border border-border">
                  <FileText className="w-4 h-4 text-primary shrink-0" />
                  <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{r.name}</p><p className="text-xs text-muted-foreground">{formatFileSize(r.size)}</p></div>
                  <a href={r.url} download={r.name} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-colors shrink-0">
                    <Download className="w-3.5 h-3.5" /> Download
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
