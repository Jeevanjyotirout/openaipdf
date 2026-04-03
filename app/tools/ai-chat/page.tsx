'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, FileText, Bot, User, Loader2, Paperclip, Sparkles, X } from 'lucide-react'
import { FileUpload, type UploadedFile } from '@/components/tools/FileUpload'
import { ToolPageWrapper } from '@/components/tools/ToolPageWrapper'
import { getToolById } from '@/lib/tools-config'
import { generateId } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/ui/use-toast'

const tool = getToolById('ai-chat')!

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

const SUGGESTED_QUESTIONS = [
  'Summarize this document',
  'What are the key findings?',
  'List all dates mentioned',
  'Who are the main parties involved?',
  'What is the main argument?',
]

export default function AIChatPage() {
  const [pdfFile, setPdfFile] = useState<UploadedFile | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleFileAdded = useCallback(async (newFiles: File[]) => {
    const f = newFiles[0]
    if (!f) return

    setUploading(true)
    const uploaded: UploadedFile = {
      id: generateId(), file: f, name: f.name, size: f.size, status: 'uploading', progress: 0,
    }
    setPdfFile(uploaded)

    try {
      const formData = new FormData()
      formData.append('file', f)

      const res = await fetch('/api/tools/ai-chat/upload', { method: 'POST', body: formData })
      if (!res.ok) throw new Error('Upload failed')

      const { sessionId: sid } = await res.json()
      setSessionId(sid)
      setPdfFile({ ...uploaded, status: 'done', progress: 100 })

      setMessages([{
        id: generateId(),
        role: 'assistant',
        content: `I've loaded **${f.name}**. I'm ready to answer questions about this document. What would you like to know?`,
        timestamp: new Date(),
      }])
    } catch (err: any) {
      setPdfFile({ ...uploaded, status: 'error', error: err.message })
      toast({ title: 'Upload failed', variant: 'destructive' })
    } finally {
      setUploading(false)
    }
  }, [toast])

  const handleSend = async () => {
    const q = input.trim()
    if (!q || !sessionId || loading) return

    const userMsg: Message = { id: generateId(), role: 'user', content: q, timestamp: new Date() }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/tools/ai-chat/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, question: q }),
      })

      if (!res.ok) throw new Error('AI request failed')

      const { answer } = await res.json()
      setMessages((prev) => [...prev, {
        id: generateId(), role: 'assistant', content: answer, timestamp: new Date(),
      }])
    } catch (err: any) {
      toast({ title: 'Failed to get answer', description: err.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <ToolPageWrapper tool={tool}>
      <div className="space-y-6">
        {!pdfFile || pdfFile.status === 'error' ? (
          <FileUpload
            accept={{ 'application/pdf': ['.pdf'] }}
            multiple={false}
            onFilesAdded={handleFileAdded}
            files={[]}
            onRemove={() => setPdfFile(null)}
            label="Upload a PDF to start chatting"
            sublabel="PDF • Max 50MB"
            disabled={uploading}
          />
        ) : (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-primary/10 border border-primary/20">
            <FileText className="w-5 h-5 text-primary shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{pdfFile.name}</p>
              {pdfFile.status === 'uploading' && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" /> Indexing document…
                </p>
              )}
              {pdfFile.status === 'done' && (
                <p className="text-xs text-green-600">Ready to chat</p>
              )}
            </div>
            <button
              onClick={() => { setPdfFile(null); setMessages([]); setSessionId(null) }}
              className="p-1 rounded-md hover:bg-primary/20 text-primary transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Chat area */}
        {messages.length > 0 && (
          <div className="flex flex-col h-[500px] rounded-2xl border border-border overflow-hidden bg-card">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn('flex gap-3', msg.role === 'user' ? 'flex-row-reverse' : 'flex-row')}
                >
                  <div className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center shrink-0',
                    msg.role === 'assistant' ? 'bg-primary/15' : 'bg-secondary'
                  )}>
                    {msg.role === 'assistant'
                      ? <Bot className="w-4 h-4 text-primary" />
                      : <User className="w-4 h-4" />
                    }
                  </div>
                  <div className={cn(
                    'max-w-[75%] rounded-2xl px-4 py-2.5 text-sm',
                    msg.role === 'assistant'
                      ? 'bg-muted text-foreground rounded-tl-sm'
                      : 'bg-primary text-white rounded-tr-sm'
                  )}>
                    {msg.content}
                  </div>
                </motion.div>
              ))}
              {loading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-primary" />
                  </div>
                  <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-muted">
                    <div className="flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          className="w-1.5 h-1.5 rounded-full bg-muted-foreground"
                          animate={{ scale: [1, 1.5, 1] }}
                          transition={{ duration: 0.8, delay: i * 0.2, repeat: Infinity }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Suggested questions */}
            {messages.length === 1 && (
              <div className="px-4 pb-3 flex gap-2 flex-wrap">
                {SUGGESTED_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    onClick={() => { setInput(q); inputRef.current?.focus() }}
                    className="text-xs px-3 py-1.5 rounded-full border border-border bg-background hover:border-primary/40 hover:bg-primary/5 transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="border-t border-border p-3">
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-background border border-border focus-within:border-primary/50 transition-colors">
                <Sparkles className="w-4 h-4 text-muted-foreground shrink-0" />
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask anything about your PDF…"
                  disabled={!sessionId || loading}
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground disabled:opacity-50"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || !sessionId || loading}
                  className="p-1.5 rounded-lg bg-primary text-white disabled:opacity-40 hover:bg-primary/90 transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ToolPageWrapper>
  )
}
