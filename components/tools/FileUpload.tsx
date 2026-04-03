'use client'
import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, File, X, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'
import { cn, formatFileSize } from '@/lib/utils'

export interface UploadedFile {
  id: string
  file: File
  name: string
  size: number
  status: 'queued' | 'uploading' | 'processing' | 'done' | 'error'
  progress: number
  error?: string
  downloadUrl?: string
  previewUrl?: string
}

interface FileUploadProps {
  accept?: Record<string, string[]>
  multiple?: boolean
  maxFiles?: number
  maxSize?: number // bytes
  onFilesAdded: (files: File[]) => void
  files: UploadedFile[]
  onRemove: (id: string) => void
  className?: string
  label?: string
  sublabel?: string
  disabled?: boolean
}

export function FileUpload({
  accept = { 'application/pdf': ['.pdf'] },
  multiple = true,
  maxFiles = 20,
  maxSize = 100 * 1024 * 1024, // 100MB
  onFilesAdded,
  files,
  onRemove,
  className,
  label = 'Drop PDFs here or click to select',
  sublabel,
  disabled = false,
}: FileUploadProps) {
  const [dragError, setDragError] = useState<string | null>(null)

  const onDrop = useCallback(
    (accepted: File[], rejected: any[]) => {
      setDragError(null)
      if (rejected.length > 0) {
        const err = rejected[0]?.errors?.[0]
        if (err?.code === 'file-too-large') {
          setDragError(`File too large. Max size: ${formatFileSize(maxSize)}`)
        } else if (err?.code === 'file-invalid-type') {
          setDragError('Invalid file type')
        } else {
          setDragError(err?.message || 'File rejected')
        }
        return
      }
      if (accepted.length) onFilesAdded(accepted)
    },
    [maxSize, onFilesAdded]
  )

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept,
    multiple,
    maxFiles,
    maxSize,
    disabled,
  })

  const acceptedExtensions = Object.values(accept)
    .flat()
    .join(', ')
    .toUpperCase()
    .replace(/\./g, '')

  return (
    <div className={cn('space-y-3', className)}>
      {/* Drop zone */}
      <div
        {...getRootProps()}
        className={cn(
          'upload-zone',
          isDragActive && !isDragReject && 'drag-over',
          isDragReject && 'border-destructive bg-destructive/5',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <input {...getInputProps()} />

        <motion.div
          className="flex flex-col items-center gap-3 text-center pointer-events-none"
          animate={{ scale: isDragActive ? 1.03 : 1 }}
          transition={{ duration: 0.2 }}
        >
          <div
            className={cn(
              'w-16 h-16 rounded-2xl flex items-center justify-center transition-colors',
              isDragActive && !isDragReject
                ? 'bg-primary/15'
                : isDragReject
                ? 'bg-destructive/15'
                : 'bg-muted'
            )}
          >
            <Upload
              className={cn(
                'w-7 h-7 transition-colors',
                isDragActive && !isDragReject
                  ? 'text-primary'
                  : isDragReject
                  ? 'text-destructive'
                  : 'text-muted-foreground'
              )}
            />
          </div>

          <div>
            <p className="text-sm font-semibold text-foreground">
              {isDragActive ? (isDragReject ? 'File not accepted' : 'Drop files here') : label}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {sublabel || `${acceptedExtensions} • Max ${formatFileSize(maxSize)}`}
              {multiple && maxFiles && ` • Up to ${maxFiles} files`}
            </p>
          </div>
        </motion.div>
      </div>

      {/* Error */}
      <AnimatePresence>
        {dragError && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            {dragError}
          </motion.div>
        )}
      </AnimatePresence>

      {/* File list */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-2"
          >
            {files.map((f) => (
              <motion.div
                key={f.id}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-card border border-border"
              >
                {/* Icon */}
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <File className="w-4 h-4 text-primary" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{f.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-muted-foreground">{formatFileSize(f.size)}</span>
                    {f.status === 'uploading' && (
                      <>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs text-primary">Uploading {f.progress}%</span>
                      </>
                    )}
                    {f.status === 'processing' && (
                      <>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs text-amber-600">Processing…</span>
                      </>
                    )}
                    {f.status === 'error' && (
                      <>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs text-destructive">{f.error || 'Error'}</span>
                      </>
                    )}
                  </div>
                  {(f.status === 'uploading' || f.status === 'processing') && (
                    <div className="progress-bar mt-1.5">
                      <motion.div
                        className="progress-fill"
                        style={{ width: `${f.status === 'processing' ? 70 : f.progress}%` }}
                        animate={{ width: `${f.status === 'processing' ? 90 : f.progress}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                  )}
                </div>

                {/* Status / actions */}
                <div className="shrink-0 flex items-center gap-1">
                  {f.status === 'uploading' && (
                    <Loader2 className="w-4 h-4 text-primary animate-spin" />
                  )}
                  {f.status === 'processing' && (
                    <Loader2 className="w-4 h-4 text-amber-600 animate-spin" />
                  )}
                  {f.status === 'done' && (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  )}
                  {f.status === 'error' && (
                    <AlertCircle className="w-4 h-4 text-destructive" />
                  )}
                  {(f.status === 'queued' || f.status === 'error') && (
                    <button
                      onClick={() => onRemove(f.id)}
                      className="p-1 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
