'use client'
import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock, Download, Loader2, Eye, EyeOff, ShieldCheck } from 'lucide-react'
import { FileUpload, type UploadedFile } from '@/components/tools/FileUpload'
import { ToolPageWrapper } from '@/components/tools/ToolPageWrapper'
import { getToolById } from '@/lib/tools-config'
import { formatFileSize, generateId } from '@/lib/utils'
import { useToast } from '@/components/ui/use-toast'

const tool = getToolById('protect')!

export default function ProtectPDFPage() {
  const [file, setFile] = useState<UploadedFile | null>(null)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState<{ url: string; size: number } | null>(null)
  const { toast } = useToast()

  const handleFileAdded = useCallback((files: File[]) => {
    const f = files[0]
    if (!f) return
    setFile({ id: generateId(), file: f, name: f.name, size: f.size, status: 'queued', progress: 0 })
    setResult(null)
  }, [])

  const handleProtect = async () => {
    if (!file) { toast({ title: 'Upload a PDF first', variant: 'destructive' }); return }
    if (password.length < 4) { toast({ title: 'Password must be at least 4 characters', variant: 'destructive' }); return }
    if (password !== confirmPassword) { toast({ title: 'Passwords do not match', variant: 'destructive' }); return }

    setProcessing(true)
    setFile((f) => f ? { ...f, status: 'uploading' as const, progress: 20 } : f)
    try {
      const formData = new FormData()
      formData.append('file', file.file)
      formData.append('userPassword', password)
      const res = await fetch('/api/tools/protect', { method: 'POST', body: formData })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      setFile((f) => f ? { ...f, status: 'done' as const, progress: 100 } : f)
      setResult({ url: data.downloadUrl, size: data.size })
      toast({ title: 'PDF protected with password!' })
    } catch (err: any) {
      setFile((f) => f ? { ...f, status: 'error' as const, error: err.message } : f)
      toast({ title: 'Protection failed', variant: 'destructive' })
    } finally {
      setProcessing(false)
    }
  }

  const strength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : 3
  const strengthLabels = ['', 'Weak', 'Good', 'Strong']
  const strengthColors = ['', 'bg-red-500', 'bg-amber-500', 'bg-green-500']

  return (
    <ToolPageWrapper tool={tool}>
      <div className="space-y-6">
        {!file ? (
          <FileUpload multiple={false} onFilesAdded={handleFileAdded} files={[]} onRemove={() => setFile(null)} label="Drop a PDF to password-protect" />
        ) : (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border">
            <Lock className="w-5 h-5 text-primary shrink-0" />
            <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{file.name}</p><p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p></div>
            <button onClick={() => { setFile(null); setResult(null) }} className="text-xs text-muted-foreground hover:text-destructive">Remove</button>
          </div>
        )}

        {file && (
          <div className="space-y-4 p-5 rounded-2xl border border-border bg-card">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-primary" />
              Set Password
            </h3>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter a strong password"
                  className="w-full h-10 px-3 pr-10 rounded-xl border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <button onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {password.length > 0 && (
                <div className="flex items-center gap-2 mt-1.5">
                  <div className="flex gap-1 flex-1">
                    {[1, 2, 3].map((l) => (
                      <div key={l} className={`h-1 flex-1 rounded-full transition-colors ${strength >= l ? strengthColors[strength] : 'bg-border'}`} />
                    ))}
                  </div>
                  <span className={`text-xs font-medium ${strength === 1 ? 'text-red-500' : strength === 2 ? 'text-amber-600' : 'text-green-600'}`}>{strengthLabels[strength]}</span>
                </div>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Confirm Password</label>
              <input
                type={showPw ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat your password"
                className={`w-full h-10 px-3 rounded-xl border bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${confirmPassword && password !== confirmPassword ? 'border-destructive focus-visible:ring-destructive' : 'border-input'}`}
              />
              {confirmPassword && password !== confirmPassword && <p className="text-xs text-destructive">Passwords do not match</p>}
            </div>

            <button
              onClick={handleProtect}
              disabled={processing || password.length < 4 || password !== confirmPassword}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-lg shadow-primary/20"
            >
              {processing ? <><Loader2 className="w-4 h-4 animate-spin" /> Encrypting…</> : <><Lock className="w-4 h-4" /> Protect PDF</>}
            </button>
          </div>
        )}

        <AnimatePresence>
          {result && (
            <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-4 p-4 rounded-2xl bg-green-500/10 border border-green-500/20">
              <ShieldCheck className="w-5 h-5 text-green-600 shrink-0" />
              <div className="flex-1"><p className="text-sm font-semibold">PDF protected!</p><p className="text-xs text-muted-foreground">Store your password safely — it cannot be recovered.</p></div>
              <a href={result.url} download="protected.pdf"
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition-colors shrink-0">
                <Download className="w-4 h-4" /> Download
              </a>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="rounded-2xl bg-muted/40 border border-border p-5">
          <p className="text-xs font-semibold mb-2">⚠️ Important</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            OpenAIPDF encrypts your PDF with AES-256. We never store your password.
            If you forget the password, the file cannot be recovered — even by OpenAIPDF.
          </p>
        </div>
      </div>
    </ToolPageWrapper>
  )
}
