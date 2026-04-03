'use client'
import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileDown, Download, Loader2, Info } from 'lucide-react'
import { FileUpload, type UploadedFile } from '@/components/tools/FileUpload'
import { ToolPageWrapper } from '@/components/tools/ToolPageWrapper'
import { getToolById } from '@/lib/tools-config'
import { formatFileSize, generateId } from '@/lib/utils'
import { useToast } from '@/components/ui/use-toast'

const tool = getToolById('pdf-to-word')!

export default function PDFToWordPage() {
  const [file, setFile] = useState<UploadedFile | null>(null)
  const [mode, setMode] = useState<'accurate' | 'flowing'>('accurate')
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState<{ url: string; size: number } | null>(null)
  const { toast } = useToast()

  const handleFileAdded = useCallback((files: File[]) => {
    const f = files[0]
    if (!f) return
    setFile({ id: generateId(), file: f, name: f.name, size: f.size, status: 'queued', progress: 0 })
    setResult(null)
  }, [])

  const handleConvert = async () => {
    if (!file) { toast({ title: 'Upload a PDF first', variant: 'destructive' }); return }
    setProcessing(true)
    setFile((f) => f ? { ...f, status: 'uploading' as const, progress: 20 } : f)
    try {
      const formData = new FormData()
      formData.append('file', file.file)
      formData.append('outputFormat', 'docx')
      formData.append('mode', mode)
      const res = await fetch('/api/tools/pdf-to-word', { method: 'POST', body: formData })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      setFile((f) => f ? { ...f, status: 'done' as const, progress: 100 } : f)
      setResult({ url: data.downloadUrl, size: data.size })
      toast({ title: 'PDF converted to Word document!' })
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
          <FileUpload multiple={false} onFilesAdded={handleFileAdded} files={[]} onRemove={() => setFile(null)} label="Drop a PDF to convert to Word" sublabel="PDF · Max 100MB" />
        ) : (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border">
            <FileDown className="w-5 h-5 text-primary shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{file.name}</p>
              <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
            </div>
            <button onClick={() => { setFile(null); setResult(null) }} className="text-xs text-muted-foreground hover:text-destructive transition-colors">Remove</button>
          </div>
        )}

        {file && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold mb-3">Conversion Mode</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'accurate', label: 'Accurate Layout', desc: 'Preserves original formatting, tables, and images' },
                  { id: 'flowing', label: 'Flowing Text', desc: 'Clean text extraction, easier to edit' },
                ].map((m) => (
                  <button key={m.id} onClick={() => setMode(m.id as any)}
                    className={`relative p-4 rounded-xl border-2 text-left transition-all ${mode === m.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'}`}>
                    <p className="text-sm font-semibold">{m.label}</p>
                    <p className="text-xs text-muted-foreground mt-1">{m.desc}</p>
                    {mode === m.id && <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-primary" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-start gap-2 p-3 rounded-xl bg-muted/60 text-xs text-muted-foreground">
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
              <span>Best results with text-based PDFs. Scanned PDFs may require OCR first for accurate conversion.</span>
            </div>

            <button onClick={handleConvert} disabled={processing}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-lg shadow-primary/20">
              {processing ? <><Loader2 className="w-4 h-4 animate-spin" /> Converting…</> : <><FileDown className="w-4 h-4" /> Convert to Word (.docx)</>}
            </button>
          </div>
        )}

        <AnimatePresence>
          {result && (
            <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-4 p-4 rounded-2xl bg-green-500/10 border border-green-500/20">
              <FileDown className="w-5 h-5 text-green-600 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold">Word document ready!</p>
                <p className="text-xs text-muted-foreground">{formatFileSize(result.size)} — open in Microsoft Word or Google Docs</p>
              </div>
              <a href={result.url} download="converted.docx"
                className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition-colors">
                <Download className="w-4 h-4" /> Download .docx
              </a>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ToolPageWrapper>
  )
}
