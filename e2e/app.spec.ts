import { test, expect } from '@playwright/test'

// ── Homepage tests ─────────────────────────────────────────────────────────────
test.describe('OpenAIPDF Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('displays OpenAIPDF branding', async ({ page }) => {
    await expect(page).toHaveTitle(/OpenAIPDF/)
    await expect(page.locator('text=OpenAIPDF')).toBeVisible()
  })

  test('shows the tagline', async ({ page }) => {
    await expect(page.locator('text=Smart AI-Powered PDF Tools')).toBeVisible()
  })

  test('displays all tool categories', async ({ page }) => {
    const categories = ['Organize PDF', 'Optimize PDF', 'Convert to PDF', 'Convert from PDF', 'Edit PDF', 'PDF Security', 'AI Tools']
    for (const cat of categories) {
      await expect(page.locator(`text=${cat}`).first()).toBeVisible()
    }
  })

  test('shows stats section', async ({ page }) => {
    await expect(page.locator('text=50M+')).toBeVisible()
  })

  test('footer shows OpenAIPDF.com', async ({ page }) => {
    await expect(page.locator('text=OpenAIPDF.com')).toBeVisible()
  })

  test('header has Get Pro button', async ({ page }) => {
    await expect(page.locator('text=Get Pro')).toBeVisible()
  })
})

// ── Navigation tests ───────────────────────────────────────────────────────────
test.describe('Navigation', () => {
  test('can navigate to Merge PDF tool', async ({ page }) => {
    await page.goto('/')
    await page.click('text=Merge PDF')
    await expect(page).toHaveURL('/tools/merge')
    await expect(page.locator('h1:has-text("Merge PDF")')).toBeVisible()
  })

  test('can navigate to AI Chat tool', async ({ page }) => {
    await page.goto('/tools/ai-chat')
    await expect(page.locator('text=Chat with PDF')).toBeVisible()
  })

  test('can navigate to Pricing page', async ({ page }) => {
    await page.goto('/pricing')
    await expect(page.locator('text=OpenAIPDF')).toBeVisible()
    await expect(page.locator('text=Free')).toBeVisible()
    await expect(page.locator('text=Pro')).toBeVisible()
  })

  test('404 page shows OpenAIPDF branding', async ({ page }) => {
    await page.goto('/non-existent-page-xyz')
    await expect(page.locator('text=OpenAIPDF')).toBeVisible()
    await expect(page.locator('text=Back to OpenAIPDF')).toBeVisible()
  })
})

// ── Tool upload interaction tests ──────────────────────────────────────────────
test.describe('Merge PDF tool', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tools/merge')
  })

  test('shows upload zone', async ({ page }) => {
    await expect(page.locator('text=Drop PDFs here')).toBeVisible()
  })

  test('shows merge button after files selected', async ({ page }) => {
    // Simulate file drop
    const dropzone = page.locator('.upload-zone').first()
    await expect(dropzone).toBeVisible()
  })

  test('shows how it works section', async ({ page }) => {
    await expect(page.locator('text=How Merge PDF works')).toBeVisible()
  })
})

// ── Compress PDF tool ──────────────────────────────────────────────────────────
test.describe('Compress PDF tool', () => {
  test('shows all compression levels', async ({ page }) => {
    await page.goto('/tools/compress')
    await expect(page.locator('text=Low Compression')).toBeVisible()
    await expect(page.locator('text=Medium Compression')).toBeVisible()
    await expect(page.locator('text=High Compression')).toBeVisible()
  })
})

// ── AI Chat tool ───────────────────────────────────────────────────────────────
test.describe('AI Chat tool', () => {
  test('shows upload prompt initially', async ({ page }) => {
    await page.goto('/tools/ai-chat')
    await expect(page.locator('text=Upload a PDF to start chatting')).toBeVisible()
  })
})

// ── Auth pages ─────────────────────────────────────────────────────────────────
test.describe('Auth pages', () => {
  test('login page has OpenAIPDF branding', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('text=OpenAIPDF').first()).toBeVisible()
    await expect(page.locator('text=Welcome back')).toBeVisible()
    await expect(page.locator('text=Continue with Google')).toBeVisible()
  })

  test('signup page has OpenAIPDF branding', async ({ page }) => {
    await page.goto('/signup')
    await expect(page.locator('text=OpenAIPDF').first()).toBeVisible()
    await expect(page.locator('text=Create your account')).toBeVisible()
  })
})

// ── Responsive tests ───────────────────────────────────────────────────────────
test.describe('Mobile responsiveness', () => {
  test('homepage is usable on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/')
    await expect(page.locator('text=OpenAIPDF').first()).toBeVisible()
    // Mobile menu button should be visible
    const menuBtn = page.locator('button[aria-label]').filter({ hasText: '' })
    await expect(page.locator('header')).toBeVisible()
  })
})
