# DevForge AI — Website, Licensing & Payments Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Build a marketing website with Stripe payments and integrate server-validated licensing into the Electron app, enabling a 7-day free trial followed by a $9.99 lifetime purchase.

**Architecture:** Two codebases — (1) a Next.js website on Vercel with API routes for license validation, Stripe Checkout, and a Postgres database; (2) modifications to the existing Electron app for machine fingerprinting, license checks, trial banners, and an upgrade gate. The server is the single source of truth for license status — the app never stores unverified trial dates.

**Tech Stack:** Next.js 14 (App Router), Tailwind CSS v4, Vercel Postgres (Neon), Stripe Checkout, Node.js crypto (HMAC-SHA256), Electron IPC, Zustand, React 19.

**Design Doc:** `docs/plans/2026-02-22-website-licensing-design.md`

---

## Phase 1: Website + License API

> All Phase 1 work happens in a NEW project directory: `/Users/jasonroell/devforge-website`

---

### Task 1: Scaffold Next.js Project

**Files:**
- Create: `/Users/jasonroell/devforge-website/` (entire project)

**Step 1: Create Next.js app**

```bash
cd /Users/jasonroell
npx create-next-app@latest devforge-website \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*" \
  --no-turbopack
```

**Step 2: Install dependencies**

```bash
cd /Users/jasonroell/devforge-website
npm install stripe @vercel/postgres
npm install -D @types/node
```

**Step 3: Create environment file**

Create `/Users/jasonroell/devforge-website/.env.local`:

```
DATABASE_URL=
HMAC_SECRET=replace-with-64-char-hex-secret
STRIPE_SECRET_KEY=sk_test_replace
STRIPE_WEBHOOK_SECRET=whsec_replace
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_replace
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

**Step 4: Add .env.local to .gitignore**

Verify `.env.local` is already in `.gitignore` (Next.js adds it by default).

**Step 5: Initialize git and commit**

```bash
cd /Users/jasonroell/devforge-website
git init
git add -A
git commit -m "chore: scaffold Next.js project with Stripe and Vercel Postgres"
```

---

### Task 2: Database Schema & Connection

**Files:**
- Create: `src/lib/db.ts`
- Create: `src/lib/schema.sql`

**Step 1: Create database connection module**

Create `/Users/jasonroell/devforge-website/src/lib/db.ts`:

```typescript
import { sql } from '@vercel/postgres'

export { sql }

export interface License {
  id: string
  machine_id: string
  status: 'trial' | 'expired' | 'licensed'
  trial_start: string
  trial_end: string
  licensed_at: string | null
  stripe_session: string | null
  email: string | null
  created_at: string
  updated_at: string
}
```

**Step 2: Create schema file for reference**

Create `/Users/jasonroell/devforge-website/src/lib/schema.sql`:

```sql
CREATE TABLE IF NOT EXISTS licenses (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  machine_id    VARCHAR(64) UNIQUE NOT NULL,
  status        VARCHAR(20) NOT NULL DEFAULT 'trial',
  trial_start   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  trial_end     TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  licensed_at   TIMESTAMPTZ,
  stripe_session VARCHAR(255),
  email         VARCHAR(255),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_licenses_machine_id ON licenses(machine_id);
CREATE INDEX IF NOT EXISTS idx_licenses_stripe_session ON licenses(stripe_session);
```

**Step 3: Create database setup API route**

Create `/Users/jasonroell/devforge-website/src/app/api/setup/route.ts`:

```typescript
import { sql } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS licenses (
        id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        machine_id    VARCHAR(64) UNIQUE NOT NULL,
        status        VARCHAR(20) NOT NULL DEFAULT 'trial',
        trial_start   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        trial_end     TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
        licensed_at   TIMESTAMPTZ,
        stripe_session VARCHAR(255),
        email         VARCHAR(255),
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `
    await sql`CREATE INDEX IF NOT EXISTS idx_licenses_machine_id ON licenses(machine_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_licenses_stripe_session ON licenses(stripe_session)`
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
```

**Step 4: Commit**

```bash
git add src/lib/db.ts src/lib/schema.sql src/app/api/setup/route.ts
git commit -m "feat: add database schema, connection module, and setup endpoint"
```

---

### Task 3: HMAC Signing Utility

**Files:**
- Create: `src/lib/hmac.ts`

**Step 1: Create HMAC signing and verification module**

Create `/Users/jasonroell/devforge-website/src/lib/hmac.ts`:

```typescript
import crypto from 'crypto'

const HMAC_SECRET = process.env.HMAC_SECRET!

export interface SignedLicensePayload {
  status: 'trial' | 'expired' | 'licensed'
  machineId: string
  expiresAt: string | null
  timestamp: number
  signature: string
}

export function signLicensePayload(
  status: 'trial' | 'expired' | 'licensed',
  machineId: string,
  expiresAt: string | null
): SignedLicensePayload {
  const timestamp = Date.now()
  const data = `${status}:${machineId}:${expiresAt ?? 'null'}:${timestamp}`
  const signature = crypto
    .createHmac('sha256', HMAC_SECRET)
    .update(data)
    .digest('hex')

  return { status, machineId, expiresAt, timestamp, signature }
}
```

**Step 2: Commit**

```bash
git add src/lib/hmac.ts
git commit -m "feat: add HMAC-SHA256 license payload signing utility"
```

---

### Task 4: License Activate API Route

**Files:**
- Create: `src/app/api/license/activate/route.ts`

**Step 1: Create activate endpoint**

Create `/Users/jasonroell/devforge-website/src/app/api/license/activate/route.ts`:

```typescript
import { sql } from '@/lib/db'
import { signLicensePayload } from '@/lib/hmac'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { machineId } = body

    if (!machineId || typeof machineId !== 'string' || machineId.length < 16) {
      return NextResponse.json({ error: 'Invalid machineId' }, { status: 400 })
    }

    // Check if machine already has a license
    const existing = await sql`
      SELECT status, trial_end, licensed_at FROM licenses
      WHERE machine_id = ${machineId}
    `

    if (existing.rows.length > 0) {
      const row = existing.rows[0]
      const status = row.licensed_at
        ? 'licensed'
        : new Date(row.trial_end) > new Date()
          ? 'trial'
          : 'expired'

      const payload = signLicensePayload(
        status as 'trial' | 'expired' | 'licensed',
        machineId,
        row.licensed_at ? null : row.trial_end
      )
      return NextResponse.json(payload)
    }

    // Create new trial
    const result = await sql`
      INSERT INTO licenses (machine_id)
      VALUES (${machineId})
      RETURNING trial_end
    `

    const trialEnd = result.rows[0].trial_end
    const payload = signLicensePayload('trial', machineId, trialEnd)
    return NextResponse.json(payload, { status: 201 })
  } catch (error) {
    console.error('License activate error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

**Step 2: Commit**

```bash
git add src/app/api/license/activate/route.ts
git commit -m "feat: add license activation endpoint with trial creation"
```

---

### Task 5: License Validate API Route

**Files:**
- Create: `src/app/api/license/validate/route.ts`

**Step 1: Create validate endpoint**

Create `/Users/jasonroell/devforge-website/src/app/api/license/validate/route.ts`:

```typescript
import { sql } from '@/lib/db'
import { signLicensePayload } from '@/lib/hmac'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { machineId } = body

    if (!machineId || typeof machineId !== 'string') {
      return NextResponse.json({ error: 'Invalid machineId' }, { status: 400 })
    }

    const result = await sql`
      SELECT status, trial_end, licensed_at FROM licenses
      WHERE machine_id = ${machineId}
    `

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'License not found' }, { status: 404 })
    }

    const row = result.rows[0]

    // Determine current status
    let status: 'trial' | 'expired' | 'licensed'
    if (row.licensed_at) {
      status = 'licensed'
    } else if (new Date(row.trial_end) > new Date()) {
      status = 'trial'
    } else {
      status = 'expired'
      // Update status in DB if it was still 'trial'
      if (row.status === 'trial') {
        await sql`
          UPDATE licenses SET status = 'expired', updated_at = NOW()
          WHERE machine_id = ${machineId}
        `
      }
    }

    // Clock drift check: reject if client time is >24h off
    const clientTimestamp = body.clientTimestamp
    if (clientTimestamp && Math.abs(Date.now() - clientTimestamp) > 24 * 60 * 60 * 1000) {
      return NextResponse.json(
        { error: 'Clock drift detected. Please sync your system clock.' },
        { status: 403 }
      )
    }

    const payload = signLicensePayload(
      status,
      machineId,
      status === 'licensed' ? null : row.trial_end
    )
    return NextResponse.json(payload)
  } catch (error) {
    console.error('License validate error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

**Step 2: Commit**

```bash
git add src/app/api/license/validate/route.ts
git commit -m "feat: add license validation endpoint with clock drift detection"
```

---

### Task 6: License Status API Route

**Files:**
- Create: `src/app/api/license/status/[machineId]/route.ts`

**Step 1: Create status endpoint**

Create `/Users/jasonroell/devforge-website/src/app/api/license/status/[machineId]/route.ts`:

```typescript
import { sql } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ machineId: string }> }
) {
  try {
    const { machineId } = await params

    const result = await sql`
      SELECT status, trial_end, licensed_at FROM licenses
      WHERE machine_id = ${machineId}
    `

    if (result.rows.length === 0) {
      return NextResponse.json({ status: 'not_found' }, { status: 404 })
    }

    const row = result.rows[0]
    let status: string
    if (row.licensed_at) {
      status = 'licensed'
    } else if (new Date(row.trial_end) > new Date()) {
      status = 'trial'
    } else {
      status = 'expired'
    }

    return NextResponse.json({ status })
  } catch (error) {
    console.error('License status error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

**Step 2: Commit**

```bash
git add "src/app/api/license/status/[machineId]/route.ts"
git commit -m "feat: add license status check endpoint"
```

---

### Task 7: Stripe Checkout API Route

**Files:**
- Create: `src/lib/stripe.ts`
- Create: `src/app/api/stripe/checkout/route.ts`

**Step 1: Create Stripe client module**

Create `/Users/jasonroell/devforge-website/src/lib/stripe.ts`:

```typescript
import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-01-27.acacia'
})
```

**Step 2: Create checkout endpoint**

Create `/Users/jasonroell/devforge-website/src/app/api/stripe/checkout/route.ts`:

```typescript
import { stripe } from '@/lib/stripe'
import { NextRequest, NextResponse } from 'next/server'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { machineId } = body

    if (!machineId || typeof machineId !== 'string') {
      return NextResponse.json({ error: 'Invalid machineId' }, { status: 400 })
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'DevForge AI — Lifetime License',
              description: 'One-time payment. Lifetime updates. 30+ developer tools.',
            },
            unit_amount: 999, // $9.99 in cents
          },
          quantity: 1,
        },
      ],
      metadata: { machineId },
      success_url: `${SITE_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${SITE_URL}/#pricing`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Stripe checkout error:', error)
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }
}
```

**Step 3: Commit**

```bash
git add src/lib/stripe.ts src/app/api/stripe/checkout/route.ts
git commit -m "feat: add Stripe Checkout session creation endpoint"
```

---

### Task 8: Stripe Webhook Handler

**Files:**
- Create: `src/app/api/stripe/webhook/route.ts`

**Step 1: Create webhook endpoint**

Create `/Users/jasonroell/devforge-website/src/app/api/stripe/webhook/route.ts`:

```typescript
import { stripe } from '@/lib/stripe'
import { sql } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')

  if (!sig) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    const machineId = session.metadata?.machineId
    const email = session.customer_details?.email

    if (machineId) {
      await sql`
        UPDATE licenses
        SET status = 'licensed',
            licensed_at = NOW(),
            stripe_session = ${session.id},
            email = ${email ?? null},
            updated_at = NOW()
        WHERE machine_id = ${machineId}
      `
    }
  }

  return NextResponse.json({ received: true })
}
```

**Step 2: Commit**

```bash
git add src/app/api/stripe/webhook/route.ts
git commit -m "feat: add Stripe webhook handler for payment completion"
```

---

### Task 9: Marketing Landing Page

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `src/app/page.tsx`
- Create: `src/app/globals.css` (replace default)
- Create: `src/components/Hero.tsx`
- Create: `src/components/ToolShowcase.tsx`
- Create: `src/components/PriceAnchor.tsx`
- Create: `src/components/Features.tsx`
- Create: `src/components/FAQ.tsx`
- Create: `src/components/Footer.tsx`
- Create: `src/lib/tools.ts`

**Step 1: Create the tools data file**

Create `/Users/jasonroell/devforge-website/src/lib/tools.ts`:

This file exports a `tools` array containing all 30+ tool definitions (name, icon name, description, category) matching the existing tool registry in the Electron app. Get the exact list by reading `src/renderer/tools/register.ts` from the DevForge codebase.

```typescript
export interface ToolInfo {
  name: string
  description: string
  category: string
}

export const tools: ToolInfo[] = [
  { name: 'JSON Formatter', description: 'Format, minify, and validate JSON with syntax highlighting', category: 'Formatters' },
  { name: 'SQL Formatter', description: 'Format and beautify SQL queries', category: 'Formatters' },
  { name: 'HTML Formatter', description: 'Format and prettify HTML markup', category: 'Formatters' },
  { name: 'CSS Formatter', description: 'Format and minify CSS stylesheets', category: 'Formatters' },
  { name: 'XML Formatter', description: 'Format and validate XML documents', category: 'Formatters' },
  { name: 'YAML Formatter', description: 'Format and validate YAML files', category: 'Formatters' },
  { name: 'Markdown Preview', description: 'Live preview Markdown with GFM support', category: 'Formatters' },
  { name: 'Base64 Encoder', description: 'Encode and decode Base64 strings', category: 'Encoders' },
  { name: 'URL Encoder', description: 'Encode and decode URL components', category: 'Encoders' },
  { name: 'HTML Entity Encoder', description: 'Encode and decode HTML entities', category: 'Encoders' },
  { name: 'JWT Decoder', description: 'Decode and inspect JSON Web Tokens', category: 'Encoders' },
  { name: 'Hash Generator', description: 'Generate MD5, SHA-1, SHA-256, SHA-512 hashes', category: 'Generators' },
  { name: 'UUID Generator', description: 'Generate v4 UUIDs', category: 'Generators' },
  { name: 'Password Generator', description: 'Generate secure random passwords', category: 'Generators' },
  { name: 'Lorem Ipsum', description: 'Generate placeholder text', category: 'Generators' },
  { name: 'Cron Parser', description: 'Parse and explain cron expressions', category: 'Inspectors' },
  { name: 'Regex Tester', description: 'Test regular expressions with live matching', category: 'Inspectors' },
  { name: 'Color Converter', description: 'Convert between HEX, RGB, HSL color formats', category: 'Converters' },
  { name: 'Unix Timestamp', description: 'Convert between Unix timestamps and dates', category: 'Converters' },
  { name: 'Number Base Converter', description: 'Convert between binary, octal, decimal, hex', category: 'Converters' },
  { name: 'JSON ↔ YAML', description: 'Convert between JSON and YAML formats', category: 'Converters' },
  { name: 'Text Diff', description: 'Compare text with side-by-side diff view', category: 'Inspectors' },
  { name: 'Text Inspector', description: 'Analyze text: word count, char count, encoding', category: 'Inspectors' },
  { name: 'AI Code Generator', description: 'Generate code with AI assistance', category: 'AI Tools' },
  { name: 'AI Chat', description: 'Chat with AI about development questions', category: 'AI Tools' },
  { name: 'AI Explainer', description: 'Explain code with AI-powered analysis', category: 'AI Tools' },
  { name: 'Mermaid Editor', description: 'Create and preview Mermaid diagrams', category: 'Inspectors' },
  { name: 'AI Tool Builder', description: 'Create custom tools with AI assistance', category: 'Custom Tools' },
]

export const categories = [...new Set(tools.map(t => t.category))]
```

> **Note to implementer:** Cross-reference the actual tools in `/Users/jasonroell/DevToolsC/src/renderer/tools/register.ts` and update this list to be complete and accurate.

**Step 2: Create component files**

Create each component in `/Users/jasonroell/devforge-website/src/components/`:

- **`Hero.tsx`** — Hero section with headline "Your AI-Supercharged Developer Toolbox", subtitle, two CTAs ("Download Free Trial" linking to GitHub releases, "See All Tools" anchor link), trust line "No credit card required - 7-day free trial". Use a dark gradient background with subtle code-bracket decorative elements.

- **`ToolShowcase.tsx`** — Grid of tool cards organized by category tabs. Each card shows tool name + 1-line description. Use the `tools` array from `src/lib/tools.ts`. Category filter tabs at the top. Show count badge per category.

- **`PriceAnchor.tsx`** — Price comparison section. Headline: "Stop paying monthly." Strikethrough comparison: "Individual tools: $10-20/mo each" vs "DevForge AI: $9.99 once, forever". Large CTA button "Get DevForge AI — $9.99" that links to `#download`. Include the tagline: "One payment. Lifetime updates. No subscriptions."

- **`Features.tsx`** — Three feature cards: (1) "AI-Powered" with description about multi-provider AI integration, (2) "Privacy-First" about local processing and encrypted key storage, (3) "Lightning Fast" about native Electron performance. Use a subtle grid background.

- **`FAQ.tsx`** — Collapsible accordion with 6 FAQs:
  1. "What happens after the trial?" → "You'll be prompted to upgrade for a one-time $9.99 payment..."
  2. "Is this really a one-time payment?" → "Yes. Pay once, use forever. All future updates included..."
  3. "What AI providers are supported?" → "Ollama (local/free), OpenAI, Anthropic Claude, Google Gemini..."
  4. "Does it work offline?" → "Most tools work fully offline. AI features need a provider..."
  5. "What platforms are supported?" → "macOS (Apple Silicon + Intel) and Windows..."
  6. "Can I get a refund?" → "Yes, 30-day money-back guarantee, no questions asked..."

- **`Footer.tsx`** — Simple footer with copyright, GitHub link, links to privacy policy (placeholder), and "Built by Jason Roell" credit.

**Step 3: Update layout.tsx**

Modify `/Users/jasonroell/devforge-website/src/app/layout.tsx`:
- Set metadata: title "DevForge AI — AI-Supercharged Developer Toolbox", description
- Dark theme by default (dark background)
- Import Inter font from `next/font/google`

**Step 4: Build page.tsx**

Replace `/Users/jasonroell/devforge-website/src/app/page.tsx`:
- Import and compose: Hero → ToolShowcase → PriceAnchor → Features → FAQ → Footer
- Sticky nav bar at top: Logo text "DevForge AI", links: Features, Pricing, Download
- Smooth scroll behavior

**Step 5: Verify locally**

```bash
cd /Users/jasonroell/devforge-website
npm run dev
# Open http://localhost:3000 and verify all sections render
```

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: add marketing landing page with conversion-optimized layout"
```

---

### Task 10: Success Page

**Files:**
- Create: `src/app/success/page.tsx`

**Step 1: Create success page**

Create `/Users/jasonroell/devforge-website/src/app/success/page.tsx`:

```typescript
import Link from 'next/link'

export default function SuccessPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-950 px-4 text-white">
      <div className="max-w-md text-center">
        <div className="mb-6 text-6xl">🎉</div>
        <h1 className="mb-4 text-3xl font-bold">You&apos;re All Set!</h1>
        <p className="mb-2 text-lg text-neutral-300">
          Your DevForge AI lifetime license is now active.
        </p>
        <p className="mb-8 text-neutral-400">
          Open DevForge AI on your computer — it will automatically detect your
          license within a few seconds. No restart needed.
        </p>
        <Link
          href="/"
          className="inline-block rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-500"
        >
          Back to Home
        </Link>
      </div>
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add src/app/success/page.tsx
git commit -m "feat: add post-purchase success page"
```

---

### Task 11: Deploy Website to Vercel

**Step 1: Create GitHub repo**

```bash
cd /Users/jasonroell/devforge-website
gh repo create jroell/devforge-website --public --source=. --push
```

**Step 2: Deploy to Vercel via CLI**

```bash
npm install -g vercel
cd /Users/jasonroell/devforge-website
vercel --yes
```

**Step 3: Add Vercel Postgres**

In Vercel dashboard → Storage → Create Database → Postgres. This provides `DATABASE_URL` automatically.

Alternatively via CLI:
```bash
vercel env pull .env.local
```

**Step 4: Set environment variables**

```bash
vercel env add HMAC_SECRET
vercel env add STRIPE_SECRET_KEY
vercel env add STRIPE_WEBHOOK_SECRET
vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
vercel env add NEXT_PUBLIC_SITE_URL
```

**Step 5: Initialize database**

```bash
# After deployment, hit the setup endpoint:
curl -X POST https://your-vercel-url.vercel.app/api/setup
```

**Step 6: Configure Stripe webhook**

In Stripe Dashboard → Developers → Webhooks → Add endpoint:
- URL: `https://your-vercel-url.vercel.app/api/stripe/webhook`
- Events: `checkout.session.completed`
- Copy webhook signing secret to `STRIPE_WEBHOOK_SECRET` env var

**Step 7: Redeploy with all env vars**

```bash
vercel --prod
```

---

## Phase 2: Electron App Modifications

> All Phase 2 work happens in the existing codebase: `/Users/jasonroell/DevToolsC`

---

### Task 12: Machine Fingerprint Service

**Files:**
- Create: `src/main/services/fingerprint.ts`

**Step 1: Create fingerprint service**

Create `/Users/jasonroell/DevToolsC/src/main/services/fingerprint.ts`:

```typescript
import os from 'os'
import crypto from 'crypto'

/**
 * Generates a deterministic machine fingerprint using system properties.
 * SHA-256 of hostname + platform + arch + username + first MAC address.
 * Same machine always produces same fingerprint.
 */
export function getMachineFingerprint(): string {
  const hostname = os.hostname()
  const platform = os.platform()
  const arch = os.arch()
  const username = os.userInfo().username

  // Get first non-internal MAC address
  const interfaces = os.networkInterfaces()
  let mac = 'no-mac'
  for (const name of Object.keys(interfaces)) {
    const nets = interfaces[name]
    if (!nets) continue
    for (const net of nets) {
      if (!net.internal && net.mac && net.mac !== '00:00:00:00:00:00') {
        mac = net.mac
        break
      }
    }
    if (mac !== 'no-mac') break
  }

  const raw = `${hostname}:${platform}:${arch}:${username}:${mac}`
  return crypto.createHash('sha256').update(raw).digest('hex')
}
```

**Step 2: Commit**

```bash
git add src/main/services/fingerprint.ts
git commit -m "feat: add deterministic machine fingerprint service"
```

---

### Task 13: License Client Service

**Files:**
- Create: `src/main/services/license-client.ts`

**Step 1: Create license client with HMAC verification**

Create `/Users/jasonroell/DevToolsC/src/main/services/license-client.ts`:

```typescript
import Store from 'electron-store'
import { getMachineFingerprint } from './fingerprint'

const LICENSE_API_URL = 'https://devforge-website.vercel.app'  // Update after deploy

const store = new Store({ name: 'license' })

export interface LicensePayload {
  status: 'trial' | 'expired' | 'licensed'
  machineId: string
  expiresAt: string | null
  timestamp: number
  signature: string
}

export interface LicenseState {
  status: 'trial' | 'expired' | 'licensed' | 'unknown'
  expiresAt: string | null
  daysRemaining: number | null
  lastValidated: number | null
}

/**
 * Activate a trial for this machine.
 * Called on first launch when no license exists.
 */
export async function activateTrial(): Promise<LicensePayload> {
  const machineId = getMachineFingerprint()
  const response = await fetch(`${LICENSE_API_URL}/api/license/activate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ machineId }),
  })

  if (!response.ok) {
    throw new Error(`Activation failed: ${response.status}`)
  }

  const payload: LicensePayload = await response.json()
  cacheLicensePayload(payload)
  return payload
}

/**
 * Validate the current license against the server.
 * Called on every app launch and every 4 hours.
 */
export async function validateLicense(): Promise<LicensePayload> {
  const machineId = getMachineFingerprint()
  const response = await fetch(`${LICENSE_API_URL}/api/license/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ machineId, clientTimestamp: Date.now() }),
  })

  if (!response.ok) {
    throw new Error(`Validation failed: ${response.status}`)
  }

  const payload: LicensePayload = await response.json()
  cacheLicensePayload(payload)
  return payload
}

/**
 * Get the Stripe Checkout URL for upgrading.
 */
export async function getCheckoutUrl(): Promise<string> {
  const machineId = getMachineFingerprint()
  const response = await fetch(`${LICENSE_API_URL}/api/stripe/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ machineId }),
  })

  if (!response.ok) {
    throw new Error(`Checkout failed: ${response.status}`)
  }

  const { url } = await response.json()
  return url
}

/**
 * Cache the last valid license payload to electron-store.
 * Used for offline grace period (48h).
 */
function cacheLicensePayload(payload: LicensePayload): void {
  store.set('cachedPayload', payload)
  store.set('lastValidated', Date.now())
}

/**
 * Get the current license state, trying cache if offline.
 * - If cached payload exists and was validated within 48h, use it.
 * - Otherwise, returns 'unknown' status (needs online validation).
 */
export function getCachedLicenseState(): LicenseState {
  const cached = store.get('cachedPayload') as LicensePayload | undefined
  const lastValidated = store.get('lastValidated') as number | undefined

  if (!cached || !lastValidated) {
    return { status: 'unknown', expiresAt: null, daysRemaining: null, lastValidated: null }
  }

  // 48h offline grace period
  const hoursSinceValidation = (Date.now() - lastValidated) / (1000 * 60 * 60)
  if (hoursSinceValidation > 48 && cached.status !== 'licensed') {
    return { status: 'unknown', expiresAt: cached.expiresAt, daysRemaining: null, lastValidated }
  }

  let daysRemaining: number | null = null
  if (cached.expiresAt && cached.status === 'trial') {
    daysRemaining = Math.max(0, Math.ceil(
      (new Date(cached.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    ))
  }

  return {
    status: cached.status,
    expiresAt: cached.expiresAt,
    daysRemaining,
    lastValidated,
  }
}

/**
 * Full license check: try server first, fall back to cache.
 */
export async function checkLicense(): Promise<LicenseState> {
  try {
    const payload = await validateLicense()
    let daysRemaining: number | null = null
    if (payload.expiresAt && payload.status === 'trial') {
      daysRemaining = Math.max(0, Math.ceil(
        (new Date(payload.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      ))
    }
    return {
      status: payload.status,
      expiresAt: payload.expiresAt,
      daysRemaining,
      lastValidated: Date.now(),
    }
  } catch {
    // Offline — use cached state
    return getCachedLicenseState()
  }
}
```

**Step 2: Commit**

```bash
git add src/main/services/license-client.ts
git commit -m "feat: add license client with server validation and offline cache"
```

---

### Task 14: License IPC Handlers

**Files:**
- Create: `src/main/ipc/license.ts`
- Modify: `src/main/index.ts`

**Step 1: Create license IPC handler file**

Create `/Users/jasonroell/DevToolsC/src/main/ipc/license.ts`:

```typescript
import { BrowserWindow, ipcMain, shell } from 'electron'
import {
  activateTrial,
  validateLicense,
  checkLicense,
  getCheckoutUrl,
  getCachedLicenseState
} from '../services/license-client'
import { getMachineFingerprint } from '../services/fingerprint'

export function registerLicenseHandlers(mainWindow: BrowserWindow): void {
  ipcMain.handle('license:fingerprint', () => {
    return getMachineFingerprint()
  })

  ipcMain.handle('license:activate', async () => {
    return activateTrial()
  })

  ipcMain.handle('license:validate', async () => {
    return validateLicense()
  })

  ipcMain.handle('license:check', async () => {
    return checkLicense()
  })

  ipcMain.handle('license:cached', () => {
    return getCachedLicenseState()
  })

  ipcMain.handle('license:upgrade', async () => {
    const url = await getCheckoutUrl()
    shell.openExternal(url)
    return url
  })

  // Periodic validation: every 4 hours
  setInterval(async () => {
    try {
      const state = await checkLicense()
      mainWindow.webContents.send('license:status-update', state)
    } catch {
      // Silent failure — cached state still valid
    }
  }, 4 * 60 * 60 * 1000)
}
```

**Step 2: Register in main process**

Modify `/Users/jasonroell/DevToolsC/src/main/index.ts`:

Add import at top:
```typescript
import { registerLicenseHandlers } from './ipc/license'
```

Add registration after `registerUpdaterHandlers(mainWindow)` (line ~109):
```typescript
registerLicenseHandlers(mainWindow)
```

**Step 3: Commit**

```bash
git add src/main/ipc/license.ts src/main/index.ts
git commit -m "feat: add license IPC handlers with periodic validation"
```

---

### Task 15: Extend Preload Bridge for License

**Files:**
- Modify: `src/preload/types.ts`
- Modify: `src/preload/index.ts`
- Modify: `src/renderer/main.tsx`

**Step 1: Add license types to ElectronAPI**

In `/Users/jasonroell/DevToolsC/src/preload/types.ts`, add before the closing `}` of `ElectronAPI`:

```typescript
  license: {
    fingerprint(): Promise<string>
    activate(): Promise<{
      status: 'trial' | 'expired' | 'licensed'
      machineId: string
      expiresAt: string | null
      timestamp: number
      signature: string
    }>
    validate(): Promise<{
      status: 'trial' | 'expired' | 'licensed'
      machineId: string
      expiresAt: string | null
      timestamp: number
      signature: string
    }>
    check(): Promise<{
      status: 'trial' | 'expired' | 'licensed' | 'unknown'
      expiresAt: string | null
      daysRemaining: number | null
      lastValidated: number | null
    }>
    cached(): Promise<{
      status: 'trial' | 'expired' | 'licensed' | 'unknown'
      expiresAt: string | null
      daysRemaining: number | null
      lastValidated: number | null
    }>
    upgrade(): Promise<string>
    onStatusUpdate(callback: (state: {
      status: 'trial' | 'expired' | 'licensed' | 'unknown'
      expiresAt: string | null
      daysRemaining: number | null
      lastValidated: number | null
    }) => void): () => void
  }
```

**Step 2: Add license methods to preload bridge**

In `/Users/jasonroell/DevToolsC/src/preload/index.ts`, add before `contextBridge.exposeInMainWorld`:

```typescript
  license: {
    fingerprint: (): Promise<string> => ipcRenderer.invoke('license:fingerprint'),
    activate: () => ipcRenderer.invoke('license:activate'),
    validate: () => ipcRenderer.invoke('license:validate'),
    check: () => ipcRenderer.invoke('license:check'),
    cached: () => ipcRenderer.invoke('license:cached'),
    upgrade: (): Promise<string> => ipcRenderer.invoke('license:upgrade'),
    onStatusUpdate: (callback: (state: unknown) => void): (() => void) => {
      const handler = (_e: Electron.IpcRendererEvent, state: unknown): void => { callback(state) }
      ipcRenderer.on('license:status-update', handler)
      return () => { ipcRenderer.removeListener('license:status-update', handler) }
    },
  },
```

**Step 3: Add license stub to browser dev mock**

In `/Users/jasonroell/DevToolsC/src/renderer/main.tsx`, add to the `window.api` mock object:

```typescript
    license: {
      fingerprint: () => Promise.resolve('dev-fingerprint-mock'),
      activate: () => Promise.resolve({ status: 'trial' as const, machineId: 'dev', expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(), timestamp: Date.now(), signature: 'mock' }),
      validate: () => Promise.resolve({ status: 'trial' as const, machineId: 'dev', expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(), timestamp: Date.now(), signature: 'mock' }),
      check: () => Promise.resolve({ status: 'licensed' as const, expiresAt: null, daysRemaining: null, lastValidated: Date.now() }),
      cached: () => Promise.resolve({ status: 'licensed' as const, expiresAt: null, daysRemaining: null, lastValidated: Date.now() }),
      upgrade: () => Promise.resolve('https://example.com'),
      onStatusUpdate: noopUnsub,
    },
```

> **Note:** Dev mock returns `status: 'licensed'` so the trial gate never blocks during development. Change to `'trial'` with a future `expiresAt` to test trial UI locally.

**Step 4: Commit**

```bash
git add src/preload/types.ts src/preload/index.ts src/renderer/main.tsx
git commit -m "feat: extend preload bridge with license API and dev mock"
```

---

### Task 16: License Zustand Store

**Files:**
- Create: `src/renderer/stores/license.ts`

**Step 1: Create the license store**

Create `/Users/jasonroell/DevToolsC/src/renderer/stores/license.ts`:

```typescript
import { create } from 'zustand'

export type LicenseStatus = 'trial' | 'expired' | 'licensed' | 'unknown' | 'loading'

interface LicenseState {
  status: LicenseStatus
  expiresAt: string | null
  daysRemaining: number | null
  lastValidated: number | null
  loading: boolean

  /** Initialize license on app startup: try server, fall back to cache */
  initialize: () => Promise<void>

  /** Force a fresh server validation */
  refresh: () => Promise<void>

  /** Open Stripe Checkout in browser */
  upgrade: () => Promise<void>

  /** Update state from periodic background checks */
  updateFromServer: (state: {
    status: 'trial' | 'expired' | 'licensed' | 'unknown'
    expiresAt: string | null
    daysRemaining: number | null
    lastValidated: number | null
  }) => void
}

export const useLicenseStore = create<LicenseState>((set) => ({
  status: 'loading',
  expiresAt: null,
  daysRemaining: null,
  lastValidated: null,
  loading: true,

  initialize: async () => {
    set({ loading: true })
    try {
      // Try full check (server → cache fallback)
      const state = await window.api.license.check()

      if (state.status === 'unknown') {
        // No license at all — activate trial
        await window.api.license.activate()
        const freshState = await window.api.license.check()
        set({ ...freshState, loading: false })
      } else {
        set({ ...state, loading: false })
      }
    } catch {
      // Complete failure — check cache
      try {
        const cached = await window.api.license.cached()
        set({ ...cached, loading: false })
      } catch {
        set({ status: 'unknown', loading: false })
      }
    }
  },

  refresh: async () => {
    try {
      const state = await window.api.license.check()
      set({ ...state })
    } catch {
      // Keep current state on failure
    }
  },

  upgrade: async () => {
    await window.api.license.upgrade()
    // Poll for license activation after purchase
    const pollInterval = setInterval(async () => {
      try {
        const state = await window.api.license.check()
        if (state.status === 'licensed') {
          set({ ...state })
          clearInterval(pollInterval)
        }
      } catch {
        // Keep polling
      }
    }, 5000) // Check every 5 seconds

    // Stop polling after 10 minutes
    setTimeout(() => clearInterval(pollInterval), 600000)
  },

  updateFromServer: (state) => {
    set({ ...state })
  },
}))
```

**Step 2: Commit**

```bash
git add src/renderer/stores/license.ts
git commit -m "feat: add license Zustand store with activation and polling"
```

---

### Task 17: Usage Tracking Store

**Files:**
- Create: `src/renderer/stores/usage.ts`

**Step 1: Create usage tracking store**

This store tracks how many times each tool is used during the trial period, displayed in the upgrade gate for personalized loss aversion.

Create `/Users/jasonroell/DevToolsC/src/renderer/stores/usage.ts`:

```typescript
import { create } from 'zustand'

interface UsageEntry {
  toolId: string
  toolName: string
  count: number
}

interface UsageState {
  entries: Record<string, UsageEntry>
  trackUsage: (toolId: string, toolName: string) => void
  getTopTools: (limit?: number) => UsageEntry[]
  getTotalUses: () => number
  loadFromStorage: () => Promise<void>
  saveToStorage: () => Promise<void>
}

export const useUsageStore = create<UsageState>((set, get) => ({
  entries: {},

  trackUsage: (toolId: string, toolName: string) => {
    set((state) => {
      const existing = state.entries[toolId]
      const updated = {
        ...state.entries,
        [toolId]: {
          toolId,
          toolName,
          count: existing ? existing.count + 1 : 1,
        },
      }
      return { entries: updated }
    })
    // Persist after each update
    get().saveToStorage()
  },

  getTopTools: (limit = 5) => {
    const entries = Object.values(get().entries)
    return entries.sort((a, b) => b.count - a.count).slice(0, limit)
  },

  getTotalUses: () => {
    return Object.values(get().entries).reduce((sum, e) => sum + e.count, 0)
  },

  loadFromStorage: async () => {
    try {
      const saved = await window.api.settings.get('usageTracking', {})
      if (saved && typeof saved === 'object') {
        set({ entries: saved as Record<string, UsageEntry> })
      }
    } catch {
      // Start fresh if load fails
    }
  },

  saveToStorage: async () => {
    try {
      await window.api.settings.set('usageTracking', get().entries)
    } catch {
      // Silent failure
    }
  },
}))
```

**Step 2: Commit**

```bash
git add src/renderer/stores/usage.ts
git commit -m "feat: add usage tracking store for personalized upgrade gate"
```

---

### Task 18: Trial Banner Component

**Files:**
- Create: `src/renderer/components/license/TrialBanner.tsx`

**Step 1: Create the trial banner**

Create `/Users/jasonroell/DevToolsC/src/renderer/components/license/TrialBanner.tsx`:

```tsx
import { useLicenseStore } from '@/stores/license'
import { cn } from '@/lib/utils'

export function TrialBanner() {
  const { status, daysRemaining, upgrade } = useLicenseStore()

  // Don't show banner if licensed or still loading
  if (status === 'licensed' || status === 'loading' || status === 'unknown') {
    return null
  }

  // Don't show banner if trial expired (full gate handles that)
  if (status === 'expired') {
    return null
  }

  const days = daysRemaining ?? 0

  // Escalation tiers
  let tierClass: string
  let message: string

  if (days >= 5) {
    // Days 7-5: Subtle gray
    tierClass = 'bg-muted/50 text-muted-foreground'
    message = `Trial: ${days} day${days !== 1 ? 's' : ''} remaining`
  } else if (days >= 3) {
    // Days 4-3: Blue accent
    tierClass = 'bg-blue-500/10 text-blue-400 border-blue-500/20'
    message = `Trial: ${days} day${days !== 1 ? 's' : ''} left`
  } else {
    // Days 2-1: Amber warning
    tierClass = 'bg-amber-500/10 text-amber-400 border-amber-500/20'
    message = days === 1
      ? 'Trial expires tomorrow — Don\u2019t lose access!'
      : 'Trial expires today!'
  }

  return (
    <div
      className={cn(
        'flex items-center justify-between border-b px-4 py-1.5 text-xs',
        tierClass
      )}
    >
      <span>{message}</span>
      <button
        onClick={() => upgrade()}
        className={cn(
          'rounded px-3 py-0.5 text-xs font-medium transition',
          days >= 5
            ? 'text-muted-foreground hover:text-foreground'
            : days >= 3
              ? 'bg-blue-600 text-white hover:bg-blue-500'
              : 'bg-amber-600 text-white hover:bg-amber-500'
        )}
      >
        {days >= 5 ? 'Upgrade $9.99' : 'Upgrade Now — $9.99'}
      </button>
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add src/renderer/components/license/TrialBanner.tsx
git commit -m "feat: add escalating trial banner with 3 urgency tiers"
```

---

### Task 19: Upgrade Gate Component

**Files:**
- Create: `src/renderer/components/license/UpgradeGate.tsx`

**Step 1: Create the full-screen upgrade gate**

Create `/Users/jasonroell/DevToolsC/src/renderer/components/license/UpgradeGate.tsx`:

```tsx
import { Lock } from 'lucide-react'
import { useLicenseStore } from '@/stores/license'
import { useUsageStore } from '@/stores/usage'
import { Button } from '@/components/ui/button'

export function UpgradeGate() {
  const { status, upgrade } = useLicenseStore()
  const topTools = useUsageStore((s) => s.getTopTools(4))
  const totalUses = useUsageStore((s) => s.getTotalUses())

  // Only show when trial expired
  if (status !== 'expired') {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm">
      <div className="mx-auto max-w-md rounded-xl border border-border bg-card p-8 text-center shadow-2xl">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Lock className="h-8 w-8 text-primary" />
        </div>

        <h2 className="mb-2 text-2xl font-bold text-foreground">
          Your Trial Has Ended
        </h2>

        {totalUses > 0 && (
          <div className="mb-6 rounded-lg bg-muted/50 p-4 text-left">
            <p className="mb-3 text-sm text-muted-foreground">
              In 7 days, you used DevForge AI:
            </p>
            <ul className="space-y-1">
              {topTools.map((tool) => (
                <li key={tool.toolId} className="flex items-center justify-between text-sm">
                  <span className="text-foreground">{tool.toolName}</span>
                  <span className="text-muted-foreground">
                    {tool.count} time{tool.count !== 1 ? 's' : ''}
                  </span>
                </li>
              ))}
              {Object.keys(useUsageStore.getState().entries).length > 4 && (
                <li className="text-sm text-muted-foreground">
                  + {Object.keys(useUsageStore.getState().entries).length - 4} other tools
                </li>
              )}
            </ul>
          </div>
        )}

        <p className="mb-2 text-lg font-semibold text-foreground">
          Keep all 30+ tools forever for just $9.99
        </p>
        <p className="mb-6 text-sm text-muted-foreground">
          That&apos;s less than one month of most developer tools
        </p>

        <Button
          size="lg"
          className="w-full text-base"
          onClick={() => upgrade()}
        >
          Upgrade Now — $9.99 Lifetime
        </Button>

        <p className="mt-4 text-xs text-muted-foreground">
          One payment. Lifetime updates. No tricks.
        </p>
      </div>
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add src/renderer/components/license/UpgradeGate.tsx
git commit -m "feat: add full-screen upgrade gate with personalized usage stats"
```

---

### Task 20: Wire License System into App

**Files:**
- Modify: `src/renderer/App.tsx`

**Step 1: Add license initialization and components**

Modify `/Users/jasonroell/DevToolsC/src/renderer/App.tsx`:

Add imports at the top:
```typescript
import { useLicenseStore } from '@/stores/license'
import { useUsageStore } from '@/stores/usage'
import { TrialBanner } from '@/components/license/TrialBanner'
import { UpgradeGate } from '@/components/license/UpgradeGate'
import { getToolById } from '@/tools/registry'
```

Inside the `App` function, add:
```typescript
const initializeLicense = useLicenseStore((s) => s.initialize)
const updateLicenseFromServer = useLicenseStore((s) => s.updateFromServer)
const trackUsage = useUsageStore((s) => s.trackUsage)
```

Add to the existing startup `useEffect` (the one that loads AI config, history, and custom tools):
```typescript
// After existing loadTools call:
initializeLicense()
useUsageStore.getState().loadFromStorage()
```

Add a new `useEffect` for license status updates from main process:
```typescript
useEffect(() => {
  const unsubscribe = window.api.license.onStatusUpdate((state) => {
    updateLicenseFromServer(state)
  })
  return unsubscribe
}, [updateLicenseFromServer])
```

Modify the `activeTool` tracking `useEffect` to also track usage:
```typescript
useEffect(() => {
  if (activeTool) {
    addHistoryEntry(activeTool)
    // Track tool usage for upgrade gate stats
    const tool = getToolById(activeTool)
    if (tool) {
      trackUsage(activeTool, tool.name)
    }
  }
}, [activeTool, addHistoryEntry, trackUsage])
```

In the normal mode return JSX, add `TrialBanner` and `UpgradeGate`:
```tsx
return (
  <div className="flex h-screen flex-col overflow-hidden">
    <TitleBar />
    <TrialBanner />
    <div className="flex flex-1 overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-auto p-4">
        <ToolShell />
      </main>
    </div>
    <UpgradeGate />
  </div>
)
```

**Step 2: Commit**

```bash
git add src/renderer/App.tsx
git commit -m "feat: wire license checking, trial banner, and upgrade gate into app"
```

---

### Task 21: TypeScript Build Check

**Step 1: Run typecheck**

```bash
cd /Users/jasonroell/DevToolsC
npx tsc --noEmit
```

Fix any type errors that appear.

**Step 2: Run dev server**

```bash
npm run dev
```

Verify:
- App launches without errors
- Sidebar shows all tools
- In dev mode (mock returns `licensed`), no trial banner or gate appears
- Themes still work correctly (dark, light, dracula)

**Step 3: Commit any fixes**

```bash
git add -A
git commit -m "fix: resolve type errors from license system integration"
```

---

### Task 22: Website TypeScript Check & Visual Verify

**Step 1: Run website typecheck**

```bash
cd /Users/jasonroell/devforge-website
npx tsc --noEmit
```

Fix any type errors.

**Step 2: Run website dev server**

```bash
npm run dev
```

Verify:
- Landing page renders at `http://localhost:3000`
- All sections visible: Hero, Tool Showcase, Price Anchor, Features, FAQ, Footer
- Nav links work (smooth scroll)
- API routes return JSON when curl'd:
  ```bash
  curl http://localhost:3000/api/license/activate -X POST -H 'Content-Type: application/json' -d '{"machineId":"test123456789012345"}'
  ```

**Step 3: Commit any fixes**

```bash
git add -A
git commit -m "fix: resolve type and rendering issues in marketing website"
```

---

## Phase 3: Integration & Polish

---

### Task 23: End-to-End Integration Test

**Step 1: Set up test environment**

Ensure Vercel deployment is live with:
- Database table created (via `/api/setup`)
- Stripe test keys configured
- HMAC_SECRET set

**Step 2: Test full flow**

1. Launch Electron app in dev mode
2. Change dev mock from `'licensed'` to `'trial'` status to test trial UI:
   ```typescript
   check: () => Promise.resolve({ status: 'trial' as const, expiresAt: new Date(Date.now() + 3 * 86400000).toISOString(), daysRemaining: 3, lastValidated: Date.now() }),
   ```
3. Verify blue tier trial banner appears
4. Change to `daysRemaining: 1` — verify amber tier
5. Change to `status: 'expired'` — verify upgrade gate overlay
6. Click "Upgrade Now" — verify Stripe Checkout opens in browser
7. Complete test purchase with Stripe test card `4242424242424242`
8. Verify webhook fires and license updates to `'licensed'`
9. Verify app refreshes and removes gate

**Step 3: Reset dev mock back to licensed**

Change the mock back to `status: 'licensed'` for normal development.

**Step 4: Final commit**

```bash
cd /Users/jasonroell/DevToolsC
git add -A
git commit -m "feat: complete license system integration with server-validated trials"
```

---

## Verification Checklist

1. **Website renders** — Landing page loads with all sections at deployed URL
2. **API routes work** — activate, validate, status, checkout, webhook all return expected responses
3. **Database** — Licenses table exists with correct schema
4. **Stripe** — Test payment completes, webhook updates license
5. **Electron app** — License check runs on startup without errors
6. **Trial banner** — Shows correct tier based on days remaining (5+/3-4/1-2)
7. **Upgrade gate** — Blocks app when trial expired, shows usage stats
8. **Upgrade flow** — Clicking upgrade opens Stripe Checkout, payment removes gate
9. **Offline grace** — App works up to 48h without server validation
10. **Dev mode** — Browser mock returns `licensed`, no gate during development
11. **TypeScript** — Both projects pass `npx tsc --noEmit`
12. **Themes** — Trial banner respects dark/light/dracula themes
