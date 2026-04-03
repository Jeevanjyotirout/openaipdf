import type { Metadata } from 'next'
import Link from 'next/link'
import { Sparkles } from 'lucide-react'
import { LoginForm } from '@/components/auth/LoginForm'

export const metadata: Metadata = {
  title: 'Sign In',
  description: 'Sign in to your OpenAIPDF account to access all premium features.',
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-background flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary/5 via-background to-purple-500/5 border-r border-border flex-col items-center justify-center p-12 relative overflow-hidden">
        {/* Grid background */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />
        <div className="relative z-10 max-w-md text-center">
          <Link href="/" className="inline-flex items-center gap-2 font-bold text-2xl mb-8">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span>OpenAI<span className="text-primary">PDF</span></span>
          </Link>
          <h2 className="text-3xl font-bold mb-4 leading-tight">
            Smart AI-Powered<br />PDF Tools
          </h2>
          <p className="text-muted-foreground text-base leading-relaxed mb-8">
            Sign in to unlock unlimited processing, batch operations, priority queue, and full AI features — all on OpenAIPDF.
          </p>
          <div className="grid grid-cols-2 gap-3 text-left">
            {[
              { emoji: '🚀', text: 'Unlimited file processing' },
              { emoji: '🤖', text: 'AI Chat & Summarizer' },
              { emoji: '⚡', text: 'Priority processing queue' },
              { emoji: '🔒', text: 'End-to-end encryption' },
              { emoji: '📦', text: 'Batch operations' },
              { emoji: '🌐', text: 'API access included' },
            ].map((f) => (
              <div key={f.text} className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{f.emoji}</span>
                <span>{f.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12">
        {/* Mobile logo */}
        <Link href="/" className="lg:hidden flex items-center gap-2 font-bold text-xl mb-8">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span>OpenAI<span className="text-primary">PDF</span></span>
        </Link>

        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-foreground mb-2">Welcome back</h1>
            <p className="text-muted-foreground text-sm">
              Sign in to your OpenAIPDF account
            </p>
          </div>
          <LoginForm />
          <p className="text-center text-sm text-muted-foreground mt-6">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-primary font-semibold hover:underline">
              Sign up free
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
