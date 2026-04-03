'use client'
import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Languages, Download, Loader2, ArrowRight, Sparkles } from 'lucide-react'
import { FileUpload, type UploadedFile } from '@/components/tools/FileUpload'
import { ToolPageWrapper } from '@/components/tools/ToolPageWrapper'
import { getToolById } from '@/lib/tools-config'
import { formatFileSize, generateId } from '@/lib/utils'
import { useToast } from '@/components/ui/use-toast'

const tool = getToolById('ai-translate')!

const LANGUAGES = [
  { code: 'en', label: '🇺🇸 English' },
  { code: 'es', label: '🇪🇸 Spanish' },
  { code: 'fr', label: '🇫🇷 French' },
  { code: 'de', label: '🇩🇪 German' },
  { code: 'it', label: '🇮🇹 Italian' },
  { code: 'pt', label: '🇧🇷 Portuguese' },
  { code: 'zh', label: '🇨🇳 Chinese (Simplified)' },
  { code: 'ja', label: '🇯🇵 Japanese' },
  { code: 'ko', label: '🇰🇷 Korean' },
  { code: 'ar', label: '🇸🇦 Arabic' },
  { code: 'ru', label: '🇷🇺 Russian' },
  { code: 'hi', label: '🇮🇳 Hindi' },
  { code: 'nl', label: '🇳🇱 Dutch' },
  { code: 'pl', label: '🇵🇱 Polish' },
  { code: 'tr', label: '🇹🇷 Turkish' },
]

export default function AITranslatePage() {
  const [file, setFile] = useState<UploadedFile | null>(null)
  const [sourceLang, setSourceLang] = useState('auto')
  const [targetLang, setTargetLang] = useState('en')
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState<{ url: string; size: number; preview: string } | null>(null)
  const { toast } = useToast()

  const handleFileAdded = useCallback((files: File[]) => {
    const f = files[0]
    if (!f) return
    setFile({ id: generateId(), file: f, name: f.name, size: f.size, status: 'queued' as const, progress: 0 })
    setResult(null)
  }, [])

  const handleTranslate = async () => {
    if (!file) { toast({ title: 'Upload a PDF first', variant: 'destructive' }); return }
    if (sourceLang !== 'auto' && sourceLang === targetLang) {
      toast({ title: 'Source and target language cannot be the same', variant: 'destructive' })
      return
    }
    setProcessing(true)
    setFile((f) => f ? { ...f, status: 'uploading' as const, progress: 20 } : f)
    try {
      const formData = new FormData()
      formData.append('file', file.file)
      formData.append('sourceLang', sourceLang)
      formData.append('targetLang', targetLang)
      const res = await fetch('/api/tools/ai-translate', { method: 'POST', body: formData })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      setFile((f) => f ? { ...f, status: 'done' as const, progress: 100 } : f)
      setResult({ url: data.downloadUrl, size: data.size, preview: data.preview })
      toast({ title: 'Translation complete!' })
    } catch (err: any) {
      setFile((f) => f ? { ...f, status: 'error' as const, error: err.message } : f)
      toast({ title: 'Translation failed', description: err.message, variant: 'destructive' })
    } finally { setProcessing(false) }
  }

  return (
    <ToolPageWrapper tool={tool}>
      <div className="space-y-6">
        {!file ? (
          <FileUpload multiple={false} onFilesAdded={handleFileAdded} files={[]} onRemove={() => setFile(null)}
            label="Drop a PDF to translate" sublabel="PDF · Max 50MB" />
        ) : (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border">
            <Languages className="w-5 h-5 text-purple-600 shrink-0" />
            <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{file.name}</p><p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p></div>
            <button onClick={() => { setFile(null); setResult(null) }} className="text-xs text-muted-foreground hover:text-destructive transition-colors">Remove</button>
          </div>
        )}

        {file && (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-muted-foreground mb-2">From</label>
                <select value={sourceLang} onChange={(e) => setSourceLang(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <option value="auto">🔍 Auto-detect</option>
                  {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
                </select>
              </div>
              <div className="flex items-center justify-center pt-6">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </div>
              <div className="flex-1">
                <label className="block text-xs font-semibold text-muted-foreground mb-2">To</label>
                <select value={targetLang} onChange={(e) => setTargetLang(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
                </select>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-muted-foreground">
              <p className="font-semibold text-foreground mb-1 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-600" /> OpenAIPDF AI Translation
              </p>
              Powered by neural machine translation. Preserves original layout, fonts, and images. Technical and legal documents may need human review.
            </div>

            <button onClick={handleTranslate} disabled={processing}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-white font-semibold disabled:opacity-50 transition-all shadow-lg"
              style={{ background: 'linear-gradient(135deg, hsl(271,91%,65%), hsl(214,100%,57%))' }}>
              {processing ? <><Loader2 className="w-4 h-4 animate-spin" /> Translating with AI…</> : <><Languages className="w-4 h-4" /> Translate PDF</>}
            </button>
          </div>
        )}

        <AnimatePresence>
          {result && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
              {result.preview && (
                <div className="p-4 rounded-xl bg-muted/40 border border-border">
                  <p className="text-xs font-semibold text-muted-foreground mb-2">Translation Preview</p>
                  <p className="text-sm leading-relaxed">{result.preview}</p>
                </div>
              )}
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-green-500/10 border border-green-500/20">
                <Languages className="w-5 h-5 text-green-600 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-semibold">Translation complete!</p>
                  <p className="text-xs text-muted-foreground">{formatFileSize(result.size)}</p>
                </div>
                <a href={result.url} download="translated.pdf"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition-colors shrink-0">
                  <Download className="w-4 h-4" /> Download
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ToolPageWrapper>
  )
}
