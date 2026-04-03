'use client'
import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Brain, Loader2, Copy, Check, Sparkles } from 'lucide-react'
import { FileUpload, type UploadedFile } from '@/components/tools/FileUpload'
import { ToolPageWrapper } from '@/components/tools/ToolPageWrapper'
import { getToolById } from '@/lib/tools-config'
import { formatFileSize, generateId } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/ui/use-toast'

const tool = getToolById('ai-summarize')!

const STYLES = [
  { id: 'brief', label: 'Brief', desc: '2–3 sentence overview', icon: '⚡' },
  { id: 'detailed', label: 'Detailed', desc: 'Full analysis with sections', icon: '📋' },
  { id: 'bullets', label: 'Bullet Points', desc: 'Key points list format', icon: '•' },
]

const LANGUAGES = ['English', 'Spanish', 'French', 'German', 'Portuguese', 'Italian', 'Chinese', 'Japanese', 'Arabic', 'Russian']

export default function AISummarizePage() {
  const [file, setFile] = useState<UploadedFile | null>(null)
  const [style, setStyle] = useState('detailed')
  const [language, setLanguage] = useState('English')
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState<{ summary: string; wordCount: number; processingTime: string } | null>(null)
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  const handleFileAdded = useCallback((files: File[]) => {
    const f = files[0]
    if (!f) return
    setFile({ id: generateId(), file: f, name: f.name, size: f.size, status: 'queued', progress: 0 })
    setResult(null)
  }, [])

  const handleSummarize = async () => {
    if (!file) { toast({ title: 'Upload a PDF first', variant: 'destructive' }); return }
    setProcessing(true)
    setFile((f) => f ? { ...f, status: 'uploading' as const, progress: 20 } : f)

    try {
      const formData = new FormData()
      formData.append('file', file.file)
      formData.append('style', style)
      formData.append('language', language)

      const res = await fetch('/api/tools/ai-summarize', { method: 'POST', body: formData })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()

      setFile((f) => f ? { ...f, status: 'done' as const, progress: 100 } : f)
      setResult({ summary: data.summary, wordCount: data.wordCount, processingTime: data.processingTime })
      toast({ title: 'Summary generated!' })
    } catch (err: any) {
      setFile((f) => f ? { ...f, status: 'error' as const, error: err.message } : f)
      toast({ title: 'Summarization failed', description: err.message, variant: 'destructive' })
    } finally {
      setProcessing(false)
    }
  }

  const handleCopy = async () => {
    if (!result?.summary) return
    await navigator.clipboard.writeText(result.summary)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast({ title: 'Summary copied!' })
  }

  return (
    <ToolPageWrapper tool={tool}>
      <div className="space-y-6">
        {!file ? (
          <FileUpload multiple={false} onFilesAdded={handleFileAdded} files={[]} onRemove={() => setFile(null)}
            label="Drop a PDF to summarize with AI" sublabel="PDF · Max 50MB" />
        ) : (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border">
            <Brain className="w-5 h-5 text-purple-600 shrink-0" />
            <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{file.name}</p><p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p></div>
            <button onClick={() => { setFile(null); setResult(null) }} className="text-xs text-muted-foreground hover:text-destructive">Remove</button>
          </div>
        )}

        {file && (
          <div className="space-y-5">
            {/* Style selector */}
            <div>
              <label className="block text-sm font-semibold mb-3">Summary Style</label>
              <div className="grid grid-cols-3 gap-3">
                {STYLES.map((s) => (
                  <button key={s.id} onClick={() => setStyle(s.id)}
                    className={cn('p-3.5 rounded-xl border-2 text-left transition-all', style === s.id ? 'border-purple-500 bg-purple-500/5' : 'border-border hover:border-purple-500/40')}>
                    <span className="text-xl block mb-1">{s.icon}</span>
                    <p className="text-xs font-semibold">{s.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{s.desc}</p>
                    {style === s.id && <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-purple-500" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Language */}
            <div>
              <label className="block text-sm font-semibold mb-2">Output Language</label>
              <select value={language} onChange={(e) => setLanguage(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                {LANGUAGES.map((l) => <option key={l}>{l}</option>)}
              </select>
            </div>

            <button onClick={handleSummarize} disabled={processing}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-white disabled:opacity-50 transition-colors shadow-lg"
              style={{ background: processing ? undefined : 'linear-gradient(135deg, hsl(271,91%,65%), hsl(214,100%,57%))' }}>
              {processing ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing with OpenAIPDF AI…</>
              ) : (
                <><Sparkles className="w-4 h-4" /> Generate AI Summary</>
              )}
            </button>
          </div>
        )}

        <AnimatePresence>
          {result && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Brain className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-semibold">AI Summary</span>
                  <span className="badge-ai text-[10px] px-1.5 py-0.5 rounded-full">OpenAIPDF AI</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">~{result.wordCount} words · {result.processingTime}</span>
                  <button onClick={handleCopy}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-accent text-xs font-medium transition-colors">
                    {copied ? <><Check className="w-3.5 h-3.5 text-green-600" /> Copied!</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
                  </button>
                </div>
              </div>
              <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-500/5 to-blue-500/5 border border-purple-500/20">
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{result.summary}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ToolPageWrapper>
  )
}
