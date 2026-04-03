'use client'
import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { EyeOff, Download, Loader2, Plus, Trash2, AlertTriangle } from 'lucide-react'
import { FileUpload, type UploadedFile } from '@/components/tools/FileUpload'
import { ToolPageWrapper } from '@/components/tools/ToolPageWrapper'
import { getToolById } from '@/lib/tools-config'
import { formatFileSize, generateId } from '@/lib/utils'
import { useToast } from '@/components/ui/use-toast'

const tool = getToolById('redact')!

export default function RedactPDFPage() {
  const [file, setFile] = useState<UploadedFile | null>(null)
  const [terms, setTerms] = useState<string[]>([''])
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState<{ url: string; size: number; redacted: number } | null>(null)
  const { toast } = useToast()

  const handleFileAdded = useCallback((files: File[]) => {
    const f = files[0]
    if (!f) return
    setFile({ id: generateId(), file: f, name: f.name, size: f.size, status: 'queued', progress: 0 })
    setResult(null)
  }, [])

  const addTerm = () => setTerms((p) => [...p, ''])
  const removeTerm = (i: number) => setTerms((p) => p.filter((_, idx) => idx !== i))
  const updateTerm = (i: number, val: string) => setTerms((p) => p.map((t, idx) => idx === i ? val : t))

  const handleRedact = async () => {
    if (!file) { toast({ title: 'Upload a PDF first', variant: 'destructive' }); return }
    const validTerms = terms.map((t) => t.trim()).filter(Boolean)
    if (!validTerms.length) { toast({ title: 'Add at least one term to redact', variant: 'destructive' }); return }

    setProcessing(true)
    setFile((f) => f ? { ...f, status: 'uploading' as const, progress: 20 } : f)
    try {
      const formData = new FormData()
      formData.append('file', file.file)
      validTerms.forEach((t) => formData.append('terms', t))
      const res = await fetch('/api/tools/redact', { method: 'POST', body: formData })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      setFile((f) => f ? { ...f, status: 'done' as const, progress: 100 } : f)
      setResult({ url: data.downloadUrl, size: data.size, redacted: data.redactedCount })
      toast({ title: `${data.redactedCount} instance(s) permanently redacted!` })
    } catch (err: any) {
      setFile((f) => f ? { ...f, status: 'error' as const, error: err.message } : f)
      toast({ title: 'Redaction failed', variant: 'destructive' })
    } finally {
      setProcessing(false)
    }
  }

  return (
    <ToolPageWrapper tool={tool}>
      <div className="space-y-6">
        <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground leading-relaxed">
            <strong className="text-foreground">Permanent operation:</strong> Redaction cannot be undone.
            OpenAIPDF permanently removes text, replacing it with black rectangles. Keep a backup of the original.
          </p>
        </div>

        {!file ? (
          <FileUpload multiple={false} onFilesAdded={handleFileAdded} files={[]} onRemove={() => setFile(null)} label="Drop a PDF to redact sensitive information" />
        ) : (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border">
            <EyeOff className="w-5 h-5 text-red-600 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{file.name}</p>
              <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
            </div>
            <button onClick={() => { setFile(null); setResult(null) }} className="text-xs text-muted-foreground hover:text-destructive transition-colors">Remove</button>
          </div>
        )}

        {file && (
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-semibold">Terms to Redact</label>
                <button onClick={addTerm} className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline">
                  <Plus className="w-3.5 h-3.5" /> Add term
                </button>
              </div>
              <div className="space-y-2">
                {terms.map((term, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={term}
                      onChange={(e) => updateTerm(i, e.target.value)}
                      placeholder={`e.g. ${['John Doe', 'SSN: 123-45', 'confidential@email.com', 'Account #'][i % 4]}`}
                      className="flex-1 h-9 px-3 rounded-xl border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                    {terms.length > 1 && (
                      <button onClick={() => removeTerm(i)} className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors shrink-0">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Each term will be found (case-insensitive) and replaced with a solid black bar throughout the document.
              </p>
            </div>

            <button
              onClick={handleRedact}
              disabled={processing}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 disabled:opacity-50 transition-colors shadow-lg shadow-red-600/20"
            >
              {processing
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Redacting permanently…</>
                : <><EyeOff className="w-4 h-4" /> Permanently Redact</>}
            </button>
          </div>
        )}

        <AnimatePresence>
          {result && (
            <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-4 p-4 rounded-2xl bg-green-500/10 border border-green-500/20">
              <EyeOff className="w-5 h-5 text-green-600 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold">{result.redacted} instance(s) permanently redacted</p>
                <p className="text-xs text-muted-foreground">{formatFileSize(result.size)} — information cannot be recovered</p>
              </div>
              <a href={result.url} download="redacted.pdf"
                className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition-colors">
                <Download className="w-4 h-4" /> Download
              </a>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ToolPageWrapper>
  )
}
