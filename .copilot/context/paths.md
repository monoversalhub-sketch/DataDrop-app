# DataDrop — Codebase Map
> Run /discovery to regenerate this after any major refactor.

---

## Root Structure

```
datadrop/
├── .copilot/
│   ├── context/
│   │   ├── overview.md          ← What DataDrop is and who it's for
│   │   ├── constraints.md       ← Engineering laws (read first)
│   │   └── paths.md             ← This file
│   ├── spec/                    ← Approved specs (.md per feature)
│   └── artifact/                ← Worklogs, audit outputs
├── .github/
│   ├── agents/                  ← Agent definitions
│   ├── instructions/            ← Copilot file-level instructions
│   └── prompts/                 ← Slash command prompts
├── public/
│   ├── manifest.json            ← PWA manifest
│   ├── sw.js                    ← Service worker (offline shell)
│   └── icons/                   ← PWA icons (192, 512)
├── src/
│   ├── app/
│   │   ├── layout.jsx           ← Root layout, metadata, PWA links
│   │   ├── page.jsx             ← Home screen (network + plan selector)
│   │   ├── globals.css          ← Tailwind base only
│   │   └── api/
│   │       ├── checkout/
│   │       │   └── route.js     ← POST: create VA + transaction row
│   │       ├── webhook/
│   │       │   └── route.js     ← POST: payment gateway callback
│   │       ├── status/
│   │       │   └── [reference]/
│   │       │       └── route.js ← GET: transaction status polling
│   │       └── lookup/
│   │           └── route.js     ← GET: find orders by phone number
│   ├── components/
│   │   ├── NetworkSelector.jsx  ← MTN/Airtel/Glo/9mobile tab switcher
│   │   ├── PlanGrid.jsx         ← Data plan cards for selected network
│   │   ├── CheckoutPanel.jsx    ← VA display + countdown + polling engine
│   │   ├── StatusScreen.jsx     ← Success / pending / failed screens
│   │   ├── OrderLookup.jsx      ← "Check previous order" by phone
│   │   ├── PhoneInput.jsx       ← Phone field + localStorage pre-fill
│   │   ├── CountdownTimer.jsx   ← Visual countdown bar + time display
│   │   └── ToastProvider.jsx    ← react-hot-toast setup
│   └── lib/
│       ├── supabase.js          ← Supabase server client (service role only)
│       ├── plans.js             ← PLAN CATALOGUE — all networks, prices, IDs
│       ├── vtu.js               ← VTU aggregator abstraction (primary + fallback)
│       ├── payments.js          ← Payment gateway abstraction (Monnify/Flutterwave)
│       ├── notify.js            ← WhatsApp failure notification sender
│       └── ratelimit.js         ← Upstash Redis + in-memory fallback
└── supabase-schema.sql          ← Full DDL for database setup
```

---

## API Routes

### POST /api/checkout
**Purpose:** User initiates payment — creates virtual bank account
**Accepts:** `{ phone_number, alternative_contact, network, data_plan_id }`
**Security:** Rate-limited (3/IP/10min via Upstash)
**Returns:** `{ virtual_account_num, virtual_bank_name, payment_reference, expires_at, amount }`
**DB write:** INSERT into transactions (status: 'pending')

### POST /api/webhook
**Purpose:** Payment gateway fires this when bank transfer lands
**Security:** HMAC signature verification (timingSafeEqual) FIRST
**Logic:** Idempotency check → status='processing' → VTU API call → status='success'|'failed'
**Returns:** 200 OK always (to prevent gateway retries on our errors)

### GET /api/status/[reference]
**Purpose:** Client polls every 5s to check transaction status
**Accepts:** `payment_reference` as URL param
**Returns:** `{ status, data_plan_name, network, phone_number }` — NO PII like alternative_contact
**Rate limit:** 20/IP/minute (polling endpoint)

### GET /api/lookup
**Purpose:** User checks their previous order by phone number
**Accepts:** `?phone=0801234567`
**Returns:** Last 3 transactions for that phone (status + plan name only — no amounts)

---

## Key Library Files

### src/lib/plans.js
The single source of truth for all data plans.
Structure:
```js
export const PLANS = {
  "mtn_1gb_30d": {
    network: "MTN",
    name: "1GB — 30 Days",
    data_size: "1GB",
    validity: "30 days",
    retail_price: 350,
    wholesale_price: 270,
    vtu_plan_code: "MTN_SME_1GB",   // code used in VTU API call
    featured: true
  },
  // ...
}

export const PLANS_BY_NETWORK = {
  MTN: [...],
  Airtel: [...],
  Glo: [...],
  "9mobile": [...]
}
```

### src/lib/vtu.js
Abstraction over VTU providers.
```js
export async function deliverData({ network, phone, plan_code }) {
  // Try primary → if fails → try fallback → return result
}
```
Returns: `{ success: true, reference: "..." }` or `{ success: false, error: "..." }`

### src/lib/payments.js
Abstraction over payment gateways.
```js
export async function createVirtualAccount({ amount, reference, expires_minutes }) {
  // Calls Monnify or Flutterwave depending on PAYMENT_GATEWAY env
}

export function verifyWebhookSignature(payload, signature) {
  // Uses crypto.timingSafeEqual — returns boolean
}
```

### src/lib/ratelimit.js
Upstash Redis rate limiter with in-memory Map fallback.
```js
export async function checkRateLimit(ip, { max, window_seconds }) {
  // Returns { allowed: true } or { allowed: false, retryAfter: N }
}
```

---

## Component Responsibilities

### NetworkSelector.jsx
- Renders 4 network buttons with brand colours
- Controls which network is "active"
- MTN=yellow, Airtel=red, Glo=green, 9mobile=teal
- Passes selected network up to parent

### PlanGrid.jsx
- Reads from PLANS_BY_NETWORK for selected network
- Renders plan cards: size, validity, price
- Featured plans highlighted
- Tapping a plan calls onPlanSelect(plan)

### CheckoutPanel.jsx
- Receives virtual account details from /api/checkout response
- Displays bank name, account number, exact amount
- Runs CountdownTimer
- Runs polling engine (setInterval → /api/status every 5s)
- On success/failure → renders StatusScreen

### PhoneInput.jsx
- On mount: reads localStorage "datadrop_last_phone" and pre-fills
- On change: writes to localStorage debounced
- Validates Nigerian phone format (07X, 08X, 09X — 11 digits)

### CountdownTimer.jsx
- Receives `expires_at` ISO string
- Counts down in real-time
- Shows progress bar that drains from full to empty
- At 0: shows "Window expired — start a new order"

---

## Data Flow for Core Transaction

```
PhoneInput (component)
  + NetworkSelector (component)
  + PlanGrid (component)
         ↓ user fills form
page.jsx handleCheckout()
         ↓ POST /api/checkout
checkout/route.js
  → lib/payments.js createVirtualAccount()
  → lib/supabase.js INSERT transaction (pending)
  → return { account, reference, expires_at }
         ↓
CheckoutPanel (component) shown
  → CountdownTimer starts
  → polling setInterval starts (every 5s → /api/status/[ref])
         ↓ user transfers in banking app
webhook/route.js (fired by payment gateway)
  → lib/payments.js verifyWebhookSignature()
  → lib/supabase.js find transaction by payment_reference
  → check idempotency (if success already → return 200)
  → UPDATE status = 'processing'
  → lib/vtu.js deliverData() [primary]
    if fail → lib/vtu.js deliverData() [fallback]
  → UPDATE status = 'success' | 'failed'
  → if failed → lib/notify.js sendWhatsApp(alternative_contact, message)
         ↓
status polling detects status change
  → CheckoutPanel renders StatusScreen (success/failed)
```
