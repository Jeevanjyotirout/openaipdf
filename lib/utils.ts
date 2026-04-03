import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { v4 as uuidv4 } from 'uuid'

/** Merge Tailwind classes safely */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Generate a unique ID */
export function generateId(): string {
  return uuidv4()
}

/**
 * Format bytes to human-readable string.
 * e.g. 1536 → "1.5 KB"
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

/**
 * Format duration in milliseconds to human-readable string.
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`
}

/**
 * Clamp a number between min and max.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/**
 * Delay for `ms` milliseconds.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

/**
 * Safely parse JSON, returning null on error.
 */
export function safeParseJSON<T = unknown>(str: string): T | null {
  try {
    return JSON.parse(str) as T
  } catch {
    return null
  }
}

/**
 * Truncate a filename preserving extension.
 * e.g. "very-long-filename.pdf" with max 20 → "very-long-filenam.pdf"
 */
export function truncateFilename(name: string, maxLength = 30): string {
  const ext = name.lastIndexOf('.')
  if (ext === -1 || name.length <= maxLength) return name
  const base = name.slice(0, ext)
  const extension = name.slice(ext)
  const truncated = base.slice(0, maxLength - extension.length - 1) + '…'
  return truncated + extension
}

/**
 * Convert a File to ArrayBuffer.
 */
export async function fileToArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as ArrayBuffer)
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsArrayBuffer(file)
  })
}

/**
 * Convert a File to base64 data URL.
 */
export async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

/**
 * Download a blob as a file.
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Get MIME type from file extension.
 */
export function getMimeType(ext: string): string {
  const map: Record<string, string> = {
    pdf: 'application/pdf',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ppt: 'application/vnd.ms-powerpoint',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    html: 'text/html',
    htm: 'text/html',
    txt: 'text/plain',
  }
  return map[ext.toLowerCase()] || 'application/octet-stream'
}

/**
 * Generate a page range string from an array of page numbers.
 * e.g. [1,2,3,5,7,8,9] → "1-3,5,7-9"
 */
export function pagesToRangeString(pages: number[]): string {
  if (!pages.length) return ''
  const sorted = [...new Set(pages)].sort((a, b) => a - b)
  const ranges: string[] = []
  let start = sorted[0]
  let end = sorted[0]

  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === end + 1) {
      end = sorted[i]
    } else {
      ranges.push(start === end ? `${start}` : `${start}-${end}`)
      start = sorted[i]
      end = sorted[i]
    }
  }
  ranges.push(start === end ? `${start}` : `${start}-${end}`)
  return ranges.join(',')
}

/**
 * Parse a page range string to an array of page numbers.
 * e.g. "1-3,5,7-9" → [1,2,3,5,7,8,9]
 */
export function rangeStringToPages(range: string, maxPage: number): number[] {
  const pages: number[] = []
  const parts = range.split(',').map((s) => s.trim())

  for (const part of parts) {
    if (part.includes('-')) {
      const [a, b] = part.split('-').map(Number)
      for (let i = Math.max(1, a); i <= Math.min(maxPage, b); i++) pages.push(i)
    } else {
      const n = parseInt(part)
      if (!isNaN(n) && n >= 1 && n <= maxPage) pages.push(n)
    }
  }

  return [...new Set(pages)].sort((a, b) => a - b)
}

/**
 * Check if running on client side.
 */
export const isBrowser = typeof window !== 'undefined'
