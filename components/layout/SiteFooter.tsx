'use client'
import Link from 'next/link'
import { Sparkles, Twitter, Github, Linkedin, Mail } from 'lucide-react'
import { TOOL_CATEGORIES } from '@/lib/tools-config'

const FOOTER_LINKS = {
  Product: [
    { label: 'All Tools', href: '/#tools' },
    { label: 'Pricing', href: '/pricing' },
    { label: 'API Access', href: '/api-docs' },
    { label: 'Changelog', href: '/changelog' },
    { label: 'Status', href: 'https://status.openaipdf.com' },
  ],
  Company: [
    { label: 'About Us', href: '/about' },
    { label: 'Blog', href: '/blog' },
    { label: 'Careers', href: '/careers' },
    { label: 'Press Kit', href: '/press' },
    { label: 'Contact', href: '/contact' },
  ],
  Legal: [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Cookie Policy', href: '/cookies' },
    { label: 'GDPR', href: '/gdpr' },
    { label: 'Security', href: '/security' },
  ],
}

const SOCIAL = [
  { icon: Twitter, href: 'https://twitter.com/openaipdf', label: 'Twitter' },
  { icon: Github, href: 'https://github.com/openaipdf', label: 'GitHub' },
  { icon: Linkedin, href: 'https://linkedin.com/company/openaipdf', label: 'LinkedIn' },
  { icon: Mail, href: 'mailto:hello@openaipdf.com', label: 'Email' },
]

export function SiteFooter() {
  const year = new Date().getFullYear()

  return (
    <footer className="bg-muted/30 border-t border-border mt-auto">
      {/* Main footer */}
      <div className="max-w-7xl mx-auto px-4 py-14">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10">
          {/* Brand column */}
          <div className="col-span-2 md:col-span-2">
            <Link href="/" className="flex items-center gap-2 font-bold text-lg mb-4">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-sm">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span>OpenAI<span className="text-primary">PDF</span></span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed mb-5 max-w-xs">
              Smart AI-Powered PDF Tools for everyone. Merge, convert, compress, sign, and
              chat with your documents — all free, all private.
            </p>
            {/* Social links */}
            <div className="flex items-center gap-3">
              {SOCIAL.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                >
                  <s.icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Tool categories */}
          <div>
            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-4">
              Tools
            </h4>
            <ul className="space-y-2.5">
              {TOOL_CATEGORIES.map((cat) => (
                <li key={cat.id}>
                  <Link
                    href={`/tools/${cat.id}`}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
                  >
                    <span>{cat.emoji}</span>
                    <span>{cat.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Product & Company */}
          {Object.entries(FOOTER_LINKS)
            .slice(0, 2)
            .map(([title, links]) => (
              <div key={title}>
                <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-4">
                  {title}
                </h4>
                <ul className="space-y-2.5">
                  {links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-border">
        <div className="max-w-7xl mx-auto px-4 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            © {year} <span className="font-semibold text-foreground">OpenAIPDF.com</span> — All rights reserved.
            Powered by OpenAIPDF.
          </p>
          <div className="flex items-center gap-4">
            {FOOTER_LINKS.Legal.slice(0, 3).map((l) => (
              <Link
                key={l.label}
                href={l.href}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
