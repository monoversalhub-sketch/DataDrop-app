# DataDrop — Engineering Constraints
> These are laws, not guidelines. Every agent reads this before acting.
> If a constraint conflicts with a user request, the constraint wins.
> To change a constraint, create a spec and get it approved first.

---

## Stack (Non-Negotiable)

| Layer | Choice | Reason |
|---|---|---|
| Framework | Next.js 14 App Router | Serverless API routes, PWA, stable |
| Language | JavaScript (no TypeScript) | Faster iteration on solo builds |
| Styling | Tailwind CSS utility classes | Mobile-first, no CSS files to manage |
| Database | Supabase (PostgreSQL + RLS) | Free tier, managed, real-time |
| Auth | None (accountless app) | Core product principle |
| Payments | Monnify OR Flutterwave (dynamic VA) | Nigerian bank transfer support |
| VTU | CheapDataHub OR VTU.ng (primary) + one fallback | SME data wholesale |
| Rate limiting | Upstash Redis + in-memory fallback | Distributed across Vercel instances |
| Notifications | WhatsApp Cloud API (Meta) OR Twilio | Failure recovery messages |
| Deployment | Vercel (Hobby tier) | Auto-deploy from GitHub |
| Package manager | npm | Not yarn, not pnpm |

---

## Frontend Rules

### Styling
- **Tailwind utility classes ONLY** for all UI
- No custom CSS files, no CSS modules, no styled-components
- No third-party UI libraries (no MUI, Chakra, shadcn, Radix, etc.)
- All colours from the Tailwind config — no hardcoded hex values
- Dark theme primary: `bg-zinc-900` / `bg-zinc-800`
- Accent colour: `emerald-500` for success / `red-500` for error / `amber-500` for pending

### Typography
- Minimum font size: **text-xs (12px)** everywhere
- No tiny grey text on dark backgrounds — maintain contrast ratio ≥ 4.5:1

### Touch Targets
- Every button: minimum `h-12` (48px) height, minimum `w-11` (44px) width
- Never stack interactive elements closer than 8px

### Identifiers
- All IDs generated with `crypto.randomUUID()` — **never** `Math.random()` or `Date.now()`

### User Feedback
- **No `alert()` anywhere** — use toast notifications (react-hot-toast)
- Loading states use skeleton shimmer — never a plain spinner
- Success states: green UI + clear confirmation message
- Error states: red UI + plain-English message + retry option

---

## Architecture Rules

### File Structure
```
src/
  app/
    page.jsx                    ← Home screen (network select + plan picker)
    layout.jsx                  ← Root layout + PWA metadata
    manifest.json               ← PWA manifest
    api/
      checkout/route.js         ← Generates virtual account, creates transaction row
      webhook/route.js          ← Payment gateway webhook handler
      status/[reference]/route.js ← Polling endpoint for transaction status
      lookup/route.js           ← "Check my order" by phone number
  components/
    NetworkSelector.jsx         ← MTN / Airtel / Glo / 9mobile tabs
    PlanGrid.jsx                ← Data plan cards by network
    CheckoutPanel.jsx           ← Virtual account display + countdown + polling
    StatusScreen.jsx            ← Success / pending / failed state screens
    OrderLookup.jsx             ← "Check my previous order" flow
    PhoneInput.jsx              ← Phone field with localStorage pre-fill
    CountdownTimer.jsx          ← Visual countdown for VA expiry
    ToastProvider.jsx           ← react-hot-toast wrapper
  lib/
    supabase.js                 ← Supabase client (server-side only)
    plans.js                    ← Data plan catalogue (prices, IDs, network)
    vtu.js                      ← VTU aggregator API abstraction layer
    payments.js                 ← Payment gateway API abstraction layer
    notify.js                   ← WhatsApp/Twilio notification helper
    ratelimit.js                ← Upstash Redis + in-memory fallback
```

### The Golden File Rules
1. **API routes are server-only** — no Supabase client, no secrets in `components/`
2. `lib/supabase.js` is the only file that imports from `@supabase/ssr`
3. `lib/plans.js` is the single source of truth for all plan data — never hardcode plan details in components
4. `lib/vtu.js` and `lib/payments.js` are abstraction layers — swap providers by editing one file
5. `wholesale_cost` for any plan MUST come from `lib/plans.js` server-side — never from client input

### The Wholesale Cost Rule (CRITICAL — Revenue Protection)
`wholesale_cost` is NEVER accepted from the client.
It is ALWAYS derived server-side from `lib/plans.js` using `data_plan_id` as the key.

```js
// ❌ NEVER
const { wholesale_cost } = req.body  // client cannot set this

// ✅ ALWAYS
const plan = PLANS[data_plan_id]     // server-side lookup
const wholesale_cost = plan.wholesale_price
```

---

## Database Rules

### Supabase
- `lib/supabase.js` is the ONLY file that imports the Supabase client
- All DB access is server-side (API routes only) — no client-side Supabase calls
- `transactions` table has idempotency constraint: UNIQUE on `payment_reference`
- Webhook MUST check idempotency before firing VTU API (prevent double delivery)
- No user accounts, no auth tables, no sessions

### RLS Policy
Since there are no user accounts, RLS is simplified:
- `transactions` table: server role only (service key) — no public reads
- No row-level filtering needed (no per-user data isolation)

### Schema Reference
```sql
CREATE TYPE transaction_status_enum AS ENUM ('pending', 'processing', 'success', 'failed', 'expired');

CREATE TABLE public.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone_number TEXT NOT NULL,
    alternative_contact TEXT,
    network TEXT NOT NULL,
    data_plan_id TEXT NOT NULL,
    data_plan_name TEXT NOT NULL,
    cost_amount NUMERIC(10, 2) NOT NULL,
    wholesale_cost NUMERIC(10, 2) NOT NULL,
    payment_reference TEXT UNIQUE NOT NULL,
    virtual_account_num TEXT,
    virtual_bank_name TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
    status transaction_status_enum DEFAULT 'pending' NOT NULL,
    aggregator_reference TEXT,
    error_log TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL
);

CREATE INDEX idx_transactions_payment_ref ON public.transactions(payment_reference);
CREATE INDEX idx_transactions_phone ON public.transactions(phone_number);
CREATE INDEX idx_transactions_status ON public.transactions(status);
```

---

## Security Rules (Non-Negotiable)

| Rule | Correct | Wrong |
|---|---|---|
| HMAC comparison | `crypto.timingSafeEqual(hashBuf, sigBuf)` | `hash !== signature` |
| ID generation | `crypto.randomUUID()` | `Math.random()` |
| Supabase init | Inside handler function | At module level (Vercel cold start fails) |
| wholesale_cost | Server-side from plans.js | From client request body |
| Rate limiting | Upstash Redis (distributed) | In-memory Map only |
| Idempotency | Check `payment_reference` UNIQUE before VTU call | Process every webhook immediately |

### The Eight-Item DataDrop Security Checklist
1. `timingSafeEqual` used in webhook HMAC — not string equality
2. `wholesale_cost` never sourced from client body
3. `expires_at` checked on late webhook arrivals — expired payments go to refund path
4. Rate limit on `/api/checkout` — max 3 requests per IP per 10 minutes
5. No `alert()` anywhere in `.jsx` files
6. Supabase client initialised INSIDE handler, not at module level
7. `payment_reference` UNIQUE checked before VTU API call (idempotency)
8. Fallback VTU provider attempted before setting status to `failed`

---

## What Is Permanently Out of Scope (v1)

- **User accounts / login** — accountless is the product
- **In-app wallet** — users transfer directly to virtual account
- **Airtime top-up** — data only for v1
- **Electricity / cable TV** — future versions
- **Admin dashboard** — manual Supabase table view is enough for v1
- **Referral system** — future feature
- **TypeScript** — JavaScript only

---

## Environment Variables

```
NEXT_PUBLIC_APP_URL                  ← e.g. https://datadrop.ng
SUPABASE_URL                         ← from Supabase project settings
SUPABASE_SERVICE_ROLE_KEY            ← server-only, never NEXT_PUBLIC_
PAYMENT_GATEWAY                      ← "monnify" or "flutterwave"
MONNIFY_API_KEY                      ← Monnify API key
MONNIFY_SECRET_KEY                   ← Monnify secret (HMAC verification)
MONNIFY_CONTRACT_CODE                ← Monnify contract code
FLUTTERWAVE_SECRET_KEY               ← Flutterwave secret key
FLUTTERWAVE_HASH                     ← Flutterwave webhook hash
VTU_PROVIDER                         ← "cheapdatahub" or "vtu_ng"
VTU_API_KEY                          ← Primary VTU provider API key
VTU_FALLBACK_PROVIDER                ← "vtube" or "subbase"
VTU_FALLBACK_API_KEY                 ← Fallback VTU provider API key
WHATSAPP_TOKEN                       ← WhatsApp Cloud API bearer token
WHATSAPP_PHONE_ID                    ← WhatsApp sender phone number ID
UPSTASH_REDIS_REST_URL               ← Upstash Redis URL
UPSTASH_REDIS_REST_TOKEN             ← Upstash Redis token
VA_EXPIRY_MINUTES                    ← Virtual account window (default: 20)
```

---

## UX Rules

- **The phone number field pre-fills from localStorage** — returning users tap twice, not type
- **Countdown timer is always visible** during payment window — user must feel urgency
- **Status polling fires every 5 seconds** once checkout panel is shown
- **"Check my order" link** always visible on home screen — users who closed the app can recover
- **Failure messages** must include next steps — never dead ends
- **Empty plan list** shows a "Plans loading..." skeleton — never a blank screen
- Network colours: MTN = yellow, Airtel = red, Glo = green, 9mobile = teal
