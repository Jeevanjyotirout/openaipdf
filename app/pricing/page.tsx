import type { Metadata } from 'next'
import { Check, Sparkles, Zap } from 'lucide-react'
import Link from 'next/link'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { SiteFooter } from '@/components/layout/SiteFooter'

export const metadata: Metadata = {
  title: 'Pricing',
  description: 'Simple, transparent pricing for OpenAIPDF. Free forever with generous limits. Upgrade for unlimited access.',
}

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Perfect for occasional use',
    cta: 'Get started free',
    ctaHref: '/signup',
    ctaVariant: 'outline',
    popular: false,
    features: [
      '20 files per day',
      'Max 25MB per file',
      'All core PDF tools',
      'File deletion after 2 hours',
      'Standard processing speed',
      'Basic compression only',
      'Community support',
    ],
    missing: [
      'AI Chat & Summarizer',
      'Batch processing',
      'API access',
      'Priority queue',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$9',
    period: '/month',
    yearlyPrice: '$79/year',
    description: 'For professionals and teams',
    cta: 'Start 7-day free trial',
    ctaHref: '/signup?plan=pro',
    ctaVariant: 'primary',
    popular: true,
    features: [
      'Unlimited files per day',
      'Max 200MB per file',
      'All 40+ PDF tools',
      'AI Chat with PDF',
      'AI Summarizer & Translator',
      'Batch processing (up to 100 files)',
      'Priority processing queue',
      'File storage for 7 days',
      'API access (10k calls/month)',
      'No watermarks',
      'Email & chat support',
    ],
    missing: [],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    description: 'For large organizations',
    cta: 'Contact sales',
    ctaHref: 'mailto:sales@openaipdf.com',
    ctaVariant: 'outline',
    popular: false,
    features: [
      'Everything in Pro',
      'Unlimited API calls',
      'Custom integrations',
      'SSO & SAML',
      'Dedicated worker cluster',
      'SLA guarantee',
      'Custom file retention',
      'Audit logs',
      'Dedicated account manager',
      'On-premise option',
    ],
    missing: [],
  },
]

const FAQ = [
  { q: "Is OpenAIPDF really free?", a: "Yes! Our free tier includes 20 files/day and all core tools — no credit card required." },
  { q: "How is my data handled?", a: "Free users' files are auto-deleted after 2 hours. Pro users' files are kept for 7 days. We never read your content. All processing is encrypted." },
  { q: "Can I cancel anytime?", a: "Absolutely. Cancel anytime from your dashboard with no penalties. Your Pro access continues until the end of the billing period." },
  { q: "What payment methods do you accept?", a: "We accept all major credit cards, PayPal, and Apple/Google Pay via Stripe." },
  { q: "Is there an API?", a: "Yes! Pro and Enterprise plans include API access. Check our API docs for integration guides." },
  { q: "Do you offer refunds?", a: "We offer a full refund within 7 days of any charge if you're not satisfied." },
]

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="max-w-6xl mx-auto px-4 py-16">

        {/* Header */}
        <div className="text-center mb-14">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-5">
            <Sparkles className="w-3.5 h-3.5" />
            Simple, transparent pricing
          </span>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Start free.<br />
            <span className="gradient-text">Scale when ready.</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            OpenAIPDF is free forever for individuals. Upgrade to unlock unlimited processing, AI tools, and API access.
          </p>
        </div>

        {/* Plans */}
        <div className="grid md:grid-cols-3 gap-6 mb-20">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-2xl border p-7 flex flex-col ${
                plan.popular
                  ? 'border-primary bg-primary/5 shadow-xl shadow-primary/10'
                  : 'border-border bg-card'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-4 py-1 rounded-full bg-primary text-white text-xs font-bold shadow-md">
                  <Zap className="w-3 h-3" />
                  Most Popular
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-lg font-bold mb-1">{plan.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">{plan.description}</p>
                <div className="flex items-end gap-1">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground text-sm mb-1">{plan.period}</span>
                </div>
                {plan.yearlyPrice && (
                  <p className="text-xs text-green-600 mt-1">Save 26% · {plan.yearlyPrice}</p>
                )}
              </div>

              <Link
                href={plan.ctaHref}
                className={`block text-center text-sm font-semibold px-5 py-3 rounded-xl mb-7 transition-colors ${
                  plan.ctaVariant === 'primary'
                    ? 'bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20'
                    : 'border border-border bg-background hover:bg-accent'
                }`}
              >
                {plan.cta}
              </Link>

              <div className="space-y-2.5 flex-1">
                {plan.features.map((f) => (
                  <div key={f} className="flex items-start gap-2.5 text-sm">
                    <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </div>
                ))}
                {plan.missing.map((f) => (
                  <div key={f} className="flex items-start gap-2.5 text-sm opacity-40">
                    <span className="w-4 h-4 shrink-0 mt-0.5 flex items-center justify-center text-muted-foreground">—</span>
                    <span>{f}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {FAQ.map((item) => (
              <div key={item.q} className="rounded-xl border border-border bg-card p-5">
                <h3 className="text-sm font-semibold mb-2">{item.q}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-muted-foreground mt-8">
            Still have questions?{' '}
            <a href="mailto:hello@openaipdf.com" className="text-primary hover:underline">
              Contact OpenAIPDF support
            </a>
          </p>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
