# DevForge AI — Website, Licensing & Payments Design

> **Date:** 2026-02-22
> **Author:** Jason Roell
> **Status:** Approved

---

## 1. Architecture Overview

Three components, cleanly separated:

| Component | Stack | Purpose |
|-----------|-------|---------|
| **Marketing Website** | Next.js 14 + Tailwind CSS on Vercel | Landing page, download links, Stripe Checkout redirect |
| **License API** | Next.js API Routes (same Vercel project) | 5 endpoints for trial activation, validation, Stripe webhook, status check |
| **Electron App Mods** | TypeScript in existing DevForge AI codebase | Trial gate UI, license validation client, machine fingerprinting |

### Data Flow

```
User downloads app → App generates machine fingerprint
→ POST /api/license/activate (creates trial row in DB)
→ App periodically calls POST /api/license/validate
→ Server returns HMAC-signed { status, expiresAt }
→ App verifies HMAC signature before trusting response
→ Trial expires → App shows upgrade gate
→ User clicks "Upgrade" → Stripe Checkout session
→ Stripe webhook → POST /api/stripe/webhook → marks license as "licensed"
→ App validates again → full access restored
```

---

## 2. License Flow & Anti-Tamper Security

### 2.1 Trial Lifecycle

| Phase | Duration | Behavior |
|-------|----------|----------|
| Fresh install | Day 0 | App generates machine fingerprint, calls `/api/license/activate` |
| Active trial | Days 1–7 | Periodic validation (every app launch + every 4 hours). Subtle trial banner. |
| Grace period | Day 7 | Full-screen upgrade gate blocks app usage. "Upgrade for $9.99" CTA. |
| Licensed | Forever | No banners, no gates, full access. Auto-updates via GitHub Releases. |

### 2.2 Machine Fingerprint

```
fingerprint = SHA-256( hostname + platform + arch + username + firstMACAddress )
```

- Deterministic — same machine always produces same fingerprint
- Generated via Node.js `os` and `crypto` modules in main process
- Sent with every API call to identify the machine
- Prevents creating multiple trial accounts from same machine

### 2.3 HMAC-Signed API Responses

Every license validation response is signed server-side:

```json
{
  "status": "trial",
  "expiresAt": "2026-03-01T00:00:00Z",
  "machineId": "abc123...",
  "timestamp": 1740268800000,
  "signature": "hmac-sha256-of-above-fields"
}
```

- **Server** signs with `HMAC_SECRET` env var (never shipped in app)
- **App** verifies signature using a **public verification approach**: the app stores the HMAC key encrypted via Electron's `safeStorage` after first successful validation
- Prevents intercepting and modifying API responses with a proxy

### 2.4 Attack Vector Defenses

| Attack | Defense |
|--------|---------|
| **Edit local files** to change trial dates | Trial dates only stored server-side. Local cache is HMAC-signed; tampering invalidates signature. |
| **Roll back system clock** | Server compares `Date.now()` with server time. >24h drift = reject. Timestamp included in signed payload. |
| **Block network requests** to prevent expiry check | App requires at least one successful validation per 48 hours. After 48h offline, app enters "validation required" state and shows upgrade gate. |
| **Intercept API response** with proxy/MITM | HMAC signature verification. Modified payload = invalid signature = treated as expired. |
| **Binary patching** to skip license check | Obfuscation via electron-vite minification. License check woven into app startup flow (not a single `if` statement). Multiple redundant checks. |
| **Create multiple accounts** | Machine fingerprint uniqueness. One trial per fingerprint. Server rejects duplicate activations. |

### 2.5 Offline Grace Period

- App caches last valid signed response in electron-store
- On launch without network, app validates cached response:
  - Signature valid + not expired + within 48h of last server check → allow
  - Otherwise → show "Connect to internet to verify license" message
- This balances security with usability (laptops on planes, etc.)

---

## 3. Marketing Website & Conversion Strategy

### 3.1 Sales Psychology Principles Applied

| Principle | Implementation |
|-----------|---------------|
| **Reciprocity** | Full-featured 7-day trial, no credit card required. User feels value before being asked to pay. |
| **Loss Aversion** | In-app countdown banner shows remaining trial days. "Don't lose access to your 30+ tools." |
| **Price Anchoring** | Compare $9.99 one-time vs. typical $10-20/month SaaS subscriptions. "Pay once, own forever." |
| **Social Proof** | Download counter, testimonial quotes (phase 2), GitHub stars badge. |
| **Urgency** | Trial countdown creates natural urgency without artificial pressure. |
| **Value Stacking** | Landing page lists all 30+ tools with icons. Each tool = perceived value increase. |

### 3.2 Landing Page Structure

```
┌─────────────────────────────────────────────┐
│  NAV: Logo | Features | Pricing | Download  │
├─────────────────────────────────────────────┤
│  HERO SECTION                                │
│  "Your AI-Supercharged Developer Toolbox"    │
│  Subtitle: 30+ tools. One app. $9.99 forever│
│  [Download Free Trial]  [See All Tools →]    │
│  "No credit card required • 7-day free trial"│
├─────────────────────────────────────────────┤
│  SOCIAL PROOF BAR                            │
│  ⬇ 1,234 downloads | ⭐ GitHub Stars | 🛠30+│
├─────────────────────────────────────────────┤
│  TOOL SHOWCASE (scrolling grid)              │
│  Icon + Name + 1-line desc for each tool     │
│  Organized by category tabs                  │
├─────────────────────────────────────────────┤
│  PRICE ANCHOR SECTION                        │
│  "Stop paying monthly."                      │
│  ❌ $10-20/mo for each tool separately       │
│  ✅ $9.99 once for all 30+ tools forever     │
│  [Get DevForge AI — $9.99]                   │
├─────────────────────────────────────────────┤
│  FEATURE HIGHLIGHTS                          │
│  3 cards: AI-Powered | Privacy-First | Fast  │
├─────────────────────────────────────────────┤
│  FAQ SECTION                                 │
│  Collapsible Q&A addressing common concerns  │
├─────────────────────────────────────────────┤
│  FINAL CTA                                   │
│  "Ready to supercharge your workflow?"       │
│  [Download Free Trial]                       │
├─────────────────────────────────────────────┤
│  FOOTER: Links | GitHub | © 2026             │
└─────────────────────────────────────────────┘
```

### 3.3 In-App Trial Banner Evolution

The trial notification banner escalates urgency as expiration approaches:

| Days Left | Style | Message |
|-----------|-------|---------|
| 7–5 | Subtle gray, small text | "Trial: 6 days remaining" |
| 4–3 | Blue accent, slightly larger | "Trial: 3 days left — Upgrade for $9.99" |
| 2–1 | Amber warning, prominent | "⚠️ Trial expires tomorrow — Don't lose access!" |
| 0 | Full-screen gate, blurred app behind | Upgrade gate with usage stats + $9.99 CTA |

### 3.4 Upgrade Gate (Day 0)

When trial expires, a full-screen overlay appears:

```
┌─────────────────────────────────────────────┐
│         🔒 Your Trial Has Ended             │
│                                              │
│  In 7 days, you used DevForge AI:           │
│  • JSON Formatter: 47 times                 │
│  • AI Chat: 23 conversations                │
│  • Base64 Encoder: 15 times                 │
│  • 12 other tools                           │
│                                              │
│  Keep all 30+ tools forever for just $9.99  │
│  (That's less than one month of most tools) │
│                                              │
│  [Upgrade Now — $9.99 Lifetime]             │
│                                              │
│  "One payment. Lifetime updates. No tricks."│
└─────────────────────────────────────────────┘
```

- **Personalized usage stats** show the user exactly what they'd lose (Loss Aversion)
- **Price comparison** reinforces the value ($9.99 < monthly subscriptions)
- Clicking "Upgrade Now" opens Stripe Checkout in default browser

---

## 4. Database & API Design

### 4.1 Database: Vercel Postgres (Neon)

Single table design — simple, fast, sufficient:

```sql
CREATE TABLE licenses (
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

-- status enum: 'trial' | 'expired' | 'licensed'
-- Index for fast lookups
CREATE INDEX idx_licenses_machine_id ON licenses(machine_id);
CREATE INDEX idx_licenses_stripe_session ON licenses(stripe_session);
```

### 4.2 API Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/license/activate` | Create trial for new machine. Body: `{ machineId }`. Returns signed license payload. |
| `POST` | `/api/license/validate` | Check license status. Body: `{ machineId }`. Returns signed license payload with current status. |
| `GET`  | `/api/license/status/:machineId` | Quick status check (used by upgrade page). Returns `{ status }`. |
| `POST` | `/api/stripe/checkout` | Create Stripe Checkout session. Body: `{ machineId }`. Returns `{ url }` to redirect user. |
| `POST` | `/api/stripe/webhook` | Stripe webhook handler. Verifies signature, updates license to "licensed". |

### 4.3 Signed Response Format

```typescript
interface LicenseResponse {
  status: 'trial' | 'expired' | 'licensed'
  machineId: string
  expiresAt: string | null    // ISO timestamp, null if licensed
  timestamp: number           // server Date.now()
  signature: string           // HMAC-SHA256 of above fields
}

// Server-side signing:
const payload = `${status}:${machineId}:${expiresAt}:${timestamp}`
const signature = crypto.createHmac('sha256', HMAC_SECRET).update(payload).digest('hex')
```

### 4.4 Stripe Integration Flow

```
1. User clicks "Upgrade" in app
2. App opens: https://devforge.ai/api/stripe/checkout?machineId=abc123
3. Server creates Stripe Checkout Session:
   - mode: 'payment' (one-time)
   - amount: $9.99
   - success_url: https://devforge.ai/success?session_id={CHECKOUT_SESSION_ID}
   - cancel_url: https://devforge.ai/pricing
   - metadata: { machineId: 'abc123' }
4. Server returns { url: 'https://checkout.stripe.com/...' }
5. App opens URL in default browser
6. User pays via Stripe Checkout (handles all PCI compliance)
7. Stripe sends webhook to POST /api/stripe/webhook
8. Webhook handler:
   a. Verifies Stripe signature
   b. Extracts machineId from session metadata
   c. Updates license: status='licensed', licensed_at=NOW()
9. Next time app validates → server returns status='licensed' → gate removed
```

### 4.5 Environment Variables (Vercel)

```
DATABASE_URL=postgres://...         # Vercel Postgres connection string
HMAC_SECRET=random-64-char-hex      # For signing license responses
STRIPE_SECRET_KEY=sk_live_...       # Stripe API key
STRIPE_WEBHOOK_SECRET=whsec_...     # Stripe webhook signing secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...  # Client-side Stripe key
```

---

## 5. Implementation Scope Summary

### Website (Next.js on Vercel)
- Landing page with conversion-optimized layout
- `/pricing` page with Stripe Checkout integration
- `/success` thank-you page post-purchase
- 5 API routes (license CRUD + Stripe)
- Vercel Postgres database setup

### Electron App Modifications
- Machine fingerprint generation (`src/main/ipc/license.ts`)
- License validation client with HMAC verification
- Trial banner component (4 escalation states)
- Upgrade gate component (full-screen overlay)
- Usage tracking for personalized gate stats
- IPC handlers for license operations
- Preload bridge extensions

### Infrastructure
- Vercel project deployment
- Stripe account configuration (product, price, webhook)
- Domain setup (devforge.ai or similar)
- Environment variable configuration
