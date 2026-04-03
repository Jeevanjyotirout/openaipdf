'use client'
import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, Download, Loader2 } from 'lucide-react'
import { FileUpload, type UploadedFile } from '@/components/tools/FileUpload'
import { ToolPageWrapper } from '@/components/tools/ToolPageWrapper'
import { getToolById } from '@/lib/tools-config'
import { formatFileSize, generateId } from '@/lib/utils'
import { useToast } from '@/components/ui/use-toast'

const tool = getToolById('ocr')!

const LANGUAGES = [
  { code: 'eng', label: '🇺🇸 English' }, { code: 'deu', label: '🇩🇪 German' }, { code: 'fra', label: '🇫🇷 French' },
  { code: 'spa', label: '🇪🇸 Spanish' }, { code: 'por', label: '🇧🇷 Portuguese' }, { code: 'ita', label: '🇮🇹 Italian' },
  { code: 'chi_sim', label: '🇨🇳 Chinese (Simplified)' }, { code: 'jpn', label: '🇯🇵 Japanese' },
  { code: 'ara', label: '🇸🇦 Arabic' }, { code: 'rus', label: '🇷🇺 Russian' },
]

export default function OCRPage() {
  const [file, setFile] = useState<UploadedFile | null>(null)
  const [language, setLanguage] = useState('eng')
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState<{ url?: string; size: number; jobId?: string } | null>(null)
  const [isAsync, setIsAsync] = useState(false)
  const { toast } = useToast()

  const handleFileAdded = useCallback((files: File[]) => {
    const f = files[0]
    if (!f) return
    setFile({ id: generateId(), file: f, name: f.name, size: f.size, status: 'queued' as const, progress: 0 })
    setResult(null)
    setIsAsync(false)
  }, [])

  const handleOCR = async () => {
    if (!file) { toast({ title: 'Upload a PDF first', variant: 'destructive' }); return }
    setProcessing(true)
    setFile((f) => f ? { ...f, status: 'uploading' as const, progress: 20 } : f)
    try {
      const formData = new FormData()
      formData.append('file', file.file)
      formData.append('language', language)
      const res = await fetch('/api/tools/ocr', { method: 'POST', body: formData })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      setFile((f) => f ? { ...f, status: 'done' as const, progress: 100 } : f)
      if (data.mode === 'async') {
        setIsAsync(true)
        setResult({ jobId: data.jobId, size: 0 })
        toast({ title: 'OCR job queued', description: 'Large files are processed in the background.' })
      } else {
        setResult({ url: data.downloadUrl, size: data.size })
        toast({ title: 'OCR complete! Your PDF is now searchable.' })
      }
    } catch (err: any) {
      setFile((f) => f ? { ...f, status: 'error' as const, error: err.message } : f)
      toast({ title: 'OCR failed', description: err.message, variant: 'destructive' })
    } finally {
      setProcessing(false)
    }
  }

  return (
    <ToolPageWrapper tool={tool}>
      <div className="space-y-6">
        {!file ? (
          <FileUpload multiple={false} onFilesAdded={handleFileAdded} files={[]} onRemove={() => setFile(null)}
            label="Drop a scanned PDF to make it searchable" sublabel="PDF · Max 100MB" />
        ) : (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border">
            <Eye className="w-5 h-5 text-green-600 shrink-0" />
            <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{file.name}</p><p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p></div>
            <button onClick={() => { setFile(null); setResult(null) }} className="text-xs text-muted-foreground hover:text-destructive">Remove</button>
          </div>
        )}

        {file && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2">Document Language</label>
              <select value={language} onChange={(e) => setLanguage(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
              </select>
              <p className="text-xs text-muted-foreground mt-1.5">Select the primary language of text in your scanned document</p>
            </div>

            <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-sm">
              <p className="font-semibold text-green-700 dark:text-green-400 mb-1">What OCR does:</p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Makes scanned text selectable and copyable</li>
                <li>• Enables full-text search in the document</li>
                <li>• Preserves original layout and formatting</li>
                <li>• Powers AI Chat and Summarizer features</li>
              </ul>
            </div>

            <button onClick={handleOCR} disabled={processing}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-lg shadow-primary/20">
              {processing ? <><Loader2 className="w-4 h-4 animate-spin" /> Running OCR…</> : <><Eye className="w-4 h-4" /> Run OCR</>}
            </button>
          </div>
        )}

        <AnimatePresence>
          {result && !isAsync && result.url && (
            <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-4 p-4 rounded-2xl bg-green-500/10 border border-green-500/20">
              <Eye className="w-5 h-5 text-green-600 shrink-0" />
              <div className="flex-1"><p className="text-sm font-semibold">OCR complete! Searchable PDF ready.</p><p className="text-xs text-muted-foreground">{formatFileSize(result.size)}</p></div>
              <a href={result.url} download="ocr-searchable.pdf"
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition-colors shrink-0">
                <Download className="w-4 h-4" /> Download
              </a>
            </motion.div>
          )}
          {result && isAsync && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
              <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">Processing in background…</p>
              <p className="text-xs text-muted-foreground mt-1">Job ID: {result.jobId} · Refresh this page or check your email when complete.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ToolPageWrapper>
  )
}
