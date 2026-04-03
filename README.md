# OpenAIPDF — Smart AI-Powered PDF Tools

> The complete, production-ready PDF SaaS platform.  
> **openaipdf.com** · Merge · Split · Compress · OCR · Convert · Sign · AI Chat

![OpenAIPDF](https://openaipdf.com/og-image.png)

---

## ✨ Features

### 📂 Organize PDF
- **Merge PDF** — Combine multiple PDFs with drag-and-drop ordering
- **Split PDF** — Extract every page or custom page ranges
- **Remove Pages** — Delete specific pages from any PDF
- **Extract Pages** — Pull page ranges into a new document
- **Organize PDF** — Visual page reordering with thumbnails
- **Scan to PDF** — Convert scanned images to searchable PDFs

### ⚡ Optimize PDF
- **Compress PDF** — Low / Medium / High compression levels
- **Repair PDF** — Fix corrupted cross-references and object tables
- **OCR PDF** — Make scanned PDFs searchable (10+ languages)

### 🔄 Convert to PDF
- **JPG → PDF** — Batch image to PDF with A4/Letter/fit page sizes
- **Word → PDF** — DOCX/DOC/ODT via LibreOffice
- **PowerPoint → PDF** — PPTX/PPT conversion
- **Excel → PDF** — XLSX/XLS conversion
- **HTML → PDF** — Web page to PDF

### 🔁 Convert from PDF
- **PDF → JPG** — High-res page export via Ghostscript
- **PDF → Word** — Accurate layout or flowing text mode
- **PDF → PowerPoint** — Editable slide extraction
- **PDF → Excel** — Table extraction to XLSX
- **PDF → PDF/A** — Archival format conversion

### ✏️ Edit PDF
- **Rotate PDF** — 90°/180°/270° with page selection
- **Add Page Numbers** — Custom position, prefix, suffix, font size
- **Add Watermark** — Text watermarks with opacity, angle, size controls
- **Crop PDF** — Trim margins with visual selector
- **PDF Editor** — Text and image annotations

### 🔐 PDF Security
- **Unlock PDF** — Remove usage restrictions
- **Protect PDF** — AES-256 password encryption
- **Sign PDF** — Draw, type, or upload signatures
- **Redact PDF** — Permanent text removal with black bars
- **Compare PDFs** — Side-by-side structural diff

### 🤖 AI Features (OpenAIPDF AI)
- **AI Summarizer** — Brief / Detailed / Bullet-point summaries
- **AI Translator** — 15+ target languages via neural MT
- **Chat with PDF** — Ask questions, get cited answers
- **Smart Tagging** — Auto-categorize and tag documents

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| **Animations** | Framer Motion |
| **State** | Zustand |
| **Auth** | NextAuth.js (Google + Email magic link) |
| **Database** | PostgreSQL + Prisma ORM |
| **Queue** | BullMQ + Redis |
| **Storage** | AWS S3 (or Cloudflare R2) |
| **PDF Processing** | pdf-lib, pdfjs-dist, Ghostscript, LibreOffice, Tesseract OCR |
| **AI** | OpenAI GPT-4o-mini |
| **Deployment** | Vercel (frontend) + Docker (workers) + EC2/Railway |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL 16+
- Redis 7+
- Docker (for workers)

### 1. Clone and install

```bash
git clone https://github.com/your-org/openaipdf.git
cd openaipdf
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
# Edit .env.local with your credentials
```

Required variables:
- `DATABASE_URL` — PostgreSQL connection string
- `REDIS_URL` — Redis connection string  
- `NEXTAUTH_SECRET` — Random 32-char secret
- `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY` + `AWS_S3_BUCKET`
- `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET`
- `OPENAI_API_KEY`

### 3. Database setup

```bash
npm run db:migrate   # Run migrations
npm run db:generate  # Generate Prisma client
```

### 4. Run development server

```bash
npm run dev          # Next.js app on :3000
npm run worker:dev   # PDF worker process
```

### 5. Full Docker stack

```bash
docker-compose up -d
```

---

## 📁 Project Structure

```
openaipdf/
├── app/
│   ├── api/
│   │   ├── auth/               NextAuth handler
│   │   ├── health/             Health check endpoint
│   │   ├── jobs/[id]/          Job status polling
│   │   ├── tools/              All tool API routes
│   │   │   ├── merge/
│   │   │   ├── split/
│   │   │   ├── compress/
│   │   │   ├── ocr/
│   │   │   ├── rotate/
│   │   │   ├── watermark/
│   │   │   ├── protect/
│   │   │   ├── unlock/
│   │   │   ├── sign/
│   │   │   ├── redact/
│   │   │   ├── compare/
│   │   │   ├── repair/
│   │   │   ├── jpg-to-pdf/
│   │   │   ├── pdf-to-jpg/
│   │   │   ├── pdf-to-word/
│   │   │   ├── convert-to-pdf/
│   │   │   ├── ai-summarize/
│   │   │   ├── ai-translate/
│   │   │   └── ai-chat/
│   │   └── upload/presign/     S3 presigned upload URLs
│   ├── tools/                  All tool pages
│   ├── dashboard/              User workspace
│   ├── login/ signup/          Auth pages
│   ├── pricing/                Pricing page
│   ├── about/                  About page
│   ├── layout.tsx              Root layout (SEO, metadata)
│   ├── page.tsx                Homepage
│   ├── sitemap.ts              Dynamic sitemap
│   └── robots.ts               robots.txt
├── components/
│   ├── auth/                   Login/Signup forms
│   ├── dashboard/              Dashboard UI
│   ├── layout/                 Header, Footer, Sidebar
│   ├── tools/                  FileUpload, ToolGrid, ToolPageWrapper
│   └── ui/                     Button, Input, Badge, Toast
├── lib/
│   ├── auth.ts                 NextAuth config
│   ├── db.ts                   Prisma singleton
│   ├── rate-limit.ts           Redis rate limiter
│   ├── store.ts                Zustand global state
│   ├── tools-config.ts         All 40+ tool definitions
│   └── utils.ts                Utility functions
├── services/
│   ├── s3/                     AWS S3 upload/download/presign
│   └── redis/                  BullMQ queue service
├── workers/
│   └── index.js                BullMQ worker process
├── prisma/
│   └── schema.prisma           Full DB schema
├── docker/
│   ├── Dockerfile.app          Next.js production image
│   ├── Dockerfile.worker       Worker container
│   ├── nginx.conf              Reverse proxy config
│   └── init.sql                DB initialization
├── scripts/
│   └── cleanup-s3.js           Expired file cleanup cron
├── __tests__/
│   └── core.test.ts            Unit tests
├── e2e/
│   └── app.spec.ts             Playwright E2E tests
├── docker-compose.yml          Full stack compose
├── .env.example                Environment template
├── middleware.ts               Auth + security headers
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

---

## 🔧 API Reference

All endpoints return `{ success: true, processor: "OpenAIPDF", message: "Processed successfully by OpenAIPDF", ...data }`.

### POST /api/tools/merge
Body: `FormData { files: File[] }` → `{ downloadUrl, size, pageCount }`

### POST /api/tools/split
Body: `FormData { file, mode: 'every'|'ranges', ranges? }` → `{ outputs[] }`

### POST /api/tools/compress
Body: `FormData { file, level: 'low'|'medium'|'high' }` → `{ downloadUrl, size, reductionPercent }`

### POST /api/tools/ocr
Body: `FormData { file, language }` → `{ downloadUrl | jobId }`

### POST /api/tools/ai-summarize
Body: `FormData { file, style, language }` → `{ summary, wordCount }`

### POST /api/tools/ai-translate
Body: `FormData { file, sourceLang, targetLang }` → `{ downloadUrl, preview }`

### POST /api/tools/ai-chat/upload
Body: `FormData { file }` → `{ sessionId }`

### POST /api/tools/ai-chat/ask
Body: `JSON { sessionId, question }` → `{ answer }`

### GET /api/jobs/[id]?queue=pdf:ocr
→ `{ status, progress, result }`

---

## 🧪 Testing

```bash
npm test              # Unit tests (Jest)
npm run test:e2e      # E2E tests (Playwright)
```

---

## 🚢 Deployment

### Frontend (Vercel)
```bash
vercel --prod
```

### Workers (Docker)
```bash
docker build -f docker/Dockerfile.worker -t openaipdf-worker .
docker run -d --env-file .env openaipdf-worker
```

### Full stack
```bash
docker-compose up -d --scale worker=3
```

---

## 📊 Architecture

```
Browser → Nginx → Next.js (Vercel/EC2)
                       ↓
              API Routes (/api/tools/*)
                  ↓           ↓
            Sync ops      Async ops
          (pdf-lib)     → BullMQ → Redis
                              ↓
                        Worker Pods (Docker)
                              ↓
                       S3 (input/output)
                              ↓
                    Signed URL → Browser Download
```

---

## 🔐 Security

- Rate limiting on all API endpoints (Redis sliding window)
- Files auto-deleted after 2 hours (S3 lifecycle + cleanup cron)
- AES-256 server-side S3 encryption
- NextAuth JWT sessions with CSRF protection
- HTTPS enforced via Nginx + HSTS headers
- Input validation on all routes
- No user content used for AI training

---

## 📜 License

MIT © OpenAIPDF.com

---

<p align="center">Built with ❤️ by the OpenAIPDF team</p>
<p align="center"><a href="https://openaipdf.com">openaipdf.com</a> · <a href="mailto:hello@openaipdf.com">hello@openaipdf.com</a></p>
