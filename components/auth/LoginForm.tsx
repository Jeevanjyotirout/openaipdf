'use client'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Loader2, Mail, Chrome } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState<string | null>(null)
  const { toast } = useToast()
  const router = useRouter()

  const handleGoogleSignIn = async () => {
    setLoading('google')
    try {
      await signIn('google', { callbackUrl: '/dashboard' })
    } catch {
      toast({ title: 'Sign in failed', description: 'Could not sign in with Google.', variant: 'destructive' })
      setLoading(null)
    }
  }

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setLoading('email')
    try {
      const result = await signIn('email', { email, callbackUrl: '/dashboard', redirect: false })
      if (result?.error) throw new Error(result.error)
      toast({ title: 'Magic link sent!', description: `Check ${email} for your sign-in link.` })
    } catch (err: any) {
      toast({ title: 'Failed to send link', description: err.message, variant: 'destructive' })
    } finally {
      setLoading(null)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      {/* Google OAuth */}
      <Button
        variant="outline"
        className="w-full h-11 gap-3 text-sm"
        onClick={handleGoogleSignIn}
        loading={loading === 'google'}
        disabled={!!loading}
      >
        {loading !== 'google' && (
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
        )}
        Continue with Google
      </Button>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-background px-3 text-muted-foreground">or continue with email</span>
        </div>
      </div>

      {/* Email magic link */}
      <form onSubmit={handleEmailSignIn} className="space-y-3">
        <Input
          type="email"
          label="Email address"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={!!loading}
          autoComplete="email"
        />
        <Button
          type="submit"
          className="w-full h-11 gap-2"
          loading={loading === 'email'}
          disabled={!!loading || !email.trim()}
        >
          <Mail className="w-4 h-4" />
          Send magic link
        </Button>
      </form>

      <p className="text-xs text-center text-muted-foreground px-4">
        By signing in you agree to OpenAIPDF&apos;s{' '}
        <a href="/terms" className="underline hover:text-foreground">Terms</a> and{' '}
        <a href="/privacy" className="underline hover:text-foreground">Privacy Policy</a>.
      </p>
    </motion.div>
  )
}
