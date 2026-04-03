import {
  FilePlus2, Scissors, Trash2, FileOutput, LayoutGrid, ScanLine,
  Minimize2, Wrench, Eye, FileImage, FileText, Presentation, Sheet,
  Globe, Image, FileDown, FileSpreadsheet, Award,
  RotateCw, Hash, Droplets, Crop, PenLine, Lock, Unlock, PenSquare,
  EyeOff, GitCompare, Brain, Languages, MessageSquare, Tag
} from 'lucide-react'

export interface Tool {
  id: string
  name: string
  description: string
  icon: any
  href: string
  categoryId: string
  color: string
  badge?: 'new' | 'ai' | 'pro'
  popular?: boolean
}

export interface ToolCategory {
  id: string
  label: string
  emoji: string
  color: string
  description: string
  tools: Tool[]
}

export const TOOL_CATEGORIES: ToolCategory[] = [
  {
    id: 'organize',
    label: 'Organize PDF',
    emoji: '📂',
    color: 'hsl(214, 100%, 57%)',
    description: 'Manage and reorganize your PDF pages',
    tools: [
      {
        id: 'merge',
        name: 'Merge PDF',
        description: 'Combine multiple PDFs into one document',
        icon: FilePlus2,
        href: '/tools/merge',
        categoryId: 'organize',
        color: 'hsl(214, 100%, 57%)',
        popular: true,
      },
      {
        id: 'split',
        name: 'Split PDF',
        description: 'Separate a PDF into individual pages or sections',
        icon: Scissors,
        href: '/tools/split',
        categoryId: 'organize',
        color: 'hsl(214, 100%, 57%)',
        popular: true,
      },
      {
        id: 'remove-pages',
        name: 'Remove Pages',
        description: 'Delete specific pages from a PDF',
        icon: Trash2,
        href: '/tools/remove-pages',
        categoryId: 'organize',
        color: 'hsl(214, 100%, 57%)',
      },
      {
        id: 'extract-pages',
        name: 'Extract Pages',
        description: 'Pull specific pages into a new PDF',
        icon: FileOutput,
        href: '/tools/extract-pages',
        categoryId: 'organize',
        color: 'hsl(214, 100%, 57%)',
      },
      {
        id: 'organize',
        name: 'Organize PDF',
        description: 'Drag & drop to reorder, rotate, or remove pages',
        icon: LayoutGrid,
        href: '/tools/organize',
        categoryId: 'organize',
        color: 'hsl(214, 100%, 57%)',
        badge: 'new',
      },
      {
        id: 'scan-to-pdf',
        name: 'Scan to PDF',
        description: 'Convert scanned images to searchable PDF',
        icon: ScanLine,
        href: '/tools/scan-to-pdf',
        categoryId: 'organize',
        color: 'hsl(214, 100%, 57%)',
      },
    ],
  },
  {
    id: 'optimize',
    label: 'Optimize PDF',
    emoji: '⚡',
    color: 'hsl(142, 76%, 45%)',
    description: 'Reduce size and improve PDF quality',
    tools: [
      {
        id: 'compress',
        name: 'Compress PDF',
        description: 'Reduce PDF file size while maintaining quality',
        icon: Minimize2,
        href: '/tools/compress',
        categoryId: 'optimize',
        color: 'hsl(142, 76%, 45%)',
        popular: true,
      },
      {
        id: 'repair',
        name: 'Repair PDF',
        description: 'Fix corrupted or damaged PDF files',
        icon: Wrench,
        href: '/tools/repair',
        categoryId: 'optimize',
        color: 'hsl(142, 76%, 45%)',
      },
      {
        id: 'ocr',
        name: 'OCR PDF',
        description: 'Make scanned PDFs searchable and editable',
        icon: Eye,
        href: '/tools/ocr',
        categoryId: 'optimize',
        color: 'hsl(142, 76%, 45%)',
        badge: 'new',
        popular: true,
      },
    ],
  },
  {
    id: 'convert-to',
    label: 'Convert to PDF',
    emoji: '🔄',
    color: 'hsl(271, 91%, 65%)',
    description: 'Convert other formats to PDF',
    tools: [
      {
        id: 'jpg-to-pdf',
        name: 'JPG to PDF',
        description: 'Convert JPG, PNG, or image files to PDF',
        icon: FileImage,
        href: '/tools/jpg-to-pdf',
        categoryId: 'convert-to',
        color: 'hsl(271, 91%, 65%)',
        popular: true,
      },
      {
        id: 'word-to-pdf',
        name: 'Word to PDF',
        description: 'Convert DOCX Word documents to PDF',
        icon: FileText,
        href: '/tools/word-to-pdf',
        categoryId: 'convert-to',
        color: 'hsl(271, 91%, 65%)',
        popular: true,
      },
      {
        id: 'powerpoint-to-pdf',
        name: 'PowerPoint to PDF',
        description: 'Convert PPTX presentations to PDF',
        icon: Presentation,
        href: '/tools/powerpoint-to-pdf',
        categoryId: 'convert-to',
        color: 'hsl(271, 91%, 65%)',
      },
      {
        id: 'excel-to-pdf',
        name: 'Excel to PDF',
        description: 'Convert XLSX spreadsheets to PDF',
        icon: Sheet,
        href: '/tools/excel-to-pdf',
        categoryId: 'convert-to',
        color: 'hsl(271, 91%, 65%)',
      },
      {
        id: 'html-to-pdf',
        name: 'HTML to PDF',
        description: 'Convert web pages or HTML files to PDF',
        icon: Globe,
        href: '/tools/html-to-pdf',
        categoryId: 'convert-to',
        color: 'hsl(271, 91%, 65%)',
      },
    ],
  },
  {
    id: 'convert-from',
    label: 'Convert from PDF',
    emoji: '🔁',
    color: 'hsl(38, 100%, 55%)',
    description: 'Export PDF to other formats',
    tools: [
      {
        id: 'pdf-to-jpg',
        name: 'PDF to JPG',
        description: 'Export each PDF page as a high-quality JPG',
        icon: Image,
        href: '/tools/pdf-to-jpg',
        categoryId: 'convert-from',
        color: 'hsl(38, 100%, 55%)',
        popular: true,
      },
      {
        id: 'pdf-to-word',
        name: 'PDF to Word',
        description: 'Convert PDF to editable DOCX format',
        icon: FileDown,
        href: '/tools/pdf-to-word',
        categoryId: 'convert-from',
        color: 'hsl(38, 100%, 55%)',
        popular: true,
      },
      {
        id: 'pdf-to-powerpoint',
        name: 'PDF to PowerPoint',
        description: 'Convert PDF slides to editable PPTX',
        icon: Presentation,
        href: '/tools/pdf-to-powerpoint',
        categoryId: 'convert-from',
        color: 'hsl(38, 100%, 55%)',
      },
      {
        id: 'pdf-to-excel',
        name: 'PDF to Excel',
        description: 'Extract PDF tables into XLSX spreadsheets',
        icon: FileSpreadsheet,
        href: '/tools/pdf-to-excel',
        categoryId: 'convert-from',
        color: 'hsl(38, 100%, 55%)',
      },
      {
        id: 'pdf-to-pdfa',
        name: 'PDF to PDF/A',
        description: 'Convert to archival-compliant PDF/A format',
        icon: Award,
        href: '/tools/pdf-to-pdfa',
        categoryId: 'convert-from',
        color: 'hsl(38, 100%, 55%)',
      },
    ],
  },
  {
    id: 'edit',
    label: 'Edit PDF',
    emoji: '✏️',
    color: 'hsl(199, 95%, 47%)',
    description: 'Modify and annotate PDFs',
    tools: [
      {
        id: 'rotate',
        name: 'Rotate PDF',
        description: 'Rotate pages to correct orientation',
        icon: RotateCw,
        href: '/tools/rotate',
        categoryId: 'edit',
        color: 'hsl(199, 95%, 47%)',
      },
      {
        id: 'page-numbers',
        name: 'Add Page Numbers',
        description: 'Insert page numbers with custom styles',
        icon: Hash,
        href: '/tools/page-numbers',
        categoryId: 'edit',
        color: 'hsl(199, 95%, 47%)',
      },
      {
        id: 'watermark',
        name: 'Add Watermark',
        description: 'Stamp text or image watermarks on pages',
        icon: Droplets,
        href: '/tools/watermark',
        categoryId: 'edit',
        color: 'hsl(199, 95%, 47%)',
      },
      {
        id: 'crop',
        name: 'Crop PDF',
        description: 'Trim margins and crop PDF pages',
        icon: Crop,
        href: '/tools/crop',
        categoryId: 'edit',
        color: 'hsl(199, 95%, 47%)',
      },
      {
        id: 'edit-pdf',
        name: 'PDF Editor',
        description: 'Add text, shapes, and annotations',
        icon: PenLine,
        href: '/tools/edit-pdf',
        categoryId: 'edit',
        color: 'hsl(199, 95%, 47%)',
        badge: 'new',
      },
    ],
  },
  {
    id: 'security',
    label: 'PDF Security',
    emoji: '🔐',
    color: 'hsl(0, 84%, 60%)',
    description: 'Protect and sign your PDFs',
    tools: [
      {
        id: 'unlock',
        name: 'Unlock PDF',
        description: 'Remove password protection from PDFs',
        icon: Unlock,
        href: '/tools/unlock',
        categoryId: 'security',
        color: 'hsl(0, 84%, 60%)',
        popular: true,
      },
      {
        id: 'protect',
        name: 'Protect PDF',
        description: 'Add password encryption to secure PDFs',
        icon: Lock,
        href: '/tools/protect',
        categoryId: 'security',
        color: 'hsl(0, 84%, 60%)',
        popular: true,
      },
      {
        id: 'sign',
        name: 'Sign PDF',
        description: 'Draw or upload your digital signature',
        icon: PenSquare,
        href: '/tools/sign',
        categoryId: 'security',
        color: 'hsl(0, 84%, 60%)',
        popular: true,
      },
      {
        id: 'redact',
        name: 'Redact PDF',
        description: 'Permanently remove sensitive information',
        icon: EyeOff,
        href: '/tools/redact',
        categoryId: 'security',
        color: 'hsl(0, 84%, 60%)',
      },
      {
        id: 'compare',
        name: 'Compare PDFs',
        description: 'Side-by-side comparison of two PDFs',
        icon: GitCompare,
        href: '/tools/compare',
        categoryId: 'security',
        color: 'hsl(0, 84%, 60%)',
        badge: 'new',
      },
    ],
  },
  {
    id: 'ai',
    label: 'AI Tools',
    emoji: '🤖',
    color: 'hsl(271, 91%, 65%)',
    description: 'AI-powered document intelligence',
    tools: [
      {
        id: 'ai-summarize',
        name: 'AI Summarizer',
        description: 'Get instant AI-generated summaries of any PDF',
        icon: Brain,
        href: '/tools/ai-summarize',
        categoryId: 'ai',
        color: 'hsl(271, 91%, 65%)',
        badge: 'ai',
        popular: true,
      },
      {
        id: 'ai-translate',
        name: 'AI Translator',
        description: 'Translate PDF content to 50+ languages',
        icon: Languages,
        href: '/tools/ai-translate',
        categoryId: 'ai',
        color: 'hsl(271, 91%, 65%)',
        badge: 'ai',
      },
      {
        id: 'ai-chat',
        name: 'Chat with PDF',
        description: 'Ask questions and get answers from your PDF',
        icon: MessageSquare,
        href: '/tools/ai-chat',
        categoryId: 'ai',
        color: 'hsl(271, 91%, 65%)',
        badge: 'ai',
        popular: true,
      },
      {
        id: 'ai-tag',
        name: 'Smart Tagging',
        description: 'Auto-tag and categorize documents with AI',
        icon: Tag,
        href: '/tools/ai-tag',
        categoryId: 'ai',
        color: 'hsl(271, 91%, 65%)',
        badge: 'ai',
      },
    ],
  },
]

export const ALL_TOOLS: Tool[] = TOOL_CATEGORIES.flatMap((c) => c.tools)

export function getToolById(id: string): Tool | undefined {
  return ALL_TOOLS.find((t) => t.id === id)
}

export function getCategoryById(id: string): ToolCategory | undefined {
  return TOOL_CATEGORIES.find((c) => c.id === id)
}
