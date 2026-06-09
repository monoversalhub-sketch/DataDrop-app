# DataDrop Changelog

## v1.0.0 — Initial Build

### Implemented
- Core transaction flow: checkout → virtual account → webhook → VTU delivery
- Accountless architecture — no user accounts, no sessions, no wallet
- PWA support — manifest.json + service worker for Add to Home Screen
- Status polling every 5 seconds via /api/status/[reference]
- Phone number localStorage pre-fill for returning users
- WhatsApp failure notification via notify.js
- Fallback VTU provider (tries primary → fallback → then fails)
- Virtual account expiry enforcement (expires_at checked on webhook)
- Rate limiting on /api/checkout (3 requests per IP per 10 minutes)
- Idempotency guard in webhook (double webhook = single VTU call)
- Order lookup by phone number (/api/lookup)
- Monnify + Flutterwave payment gateway support
- CheapDataHub + VTU.ng + Subbase provider integration

### Security
- HMAC-SHA512 (Monnify) and HMAC-SHA256 (Flutterwave) webhook verification
- crypto.timingSafeEqual() for signature comparison
- Rate limiting with Upstash Redis + in-memory fallback
- Supabase service role key only (no public anon access)
- No secrets in client-side code
- Wholesale cost derived server-side, never from request

### Architecture
- Next.js 14 with App Router
- Tailwind CSS (utility-first, no inline styles)
- Supabase (database + auth bypass via service role)
- 4 networks: MTN, Airtel, Glo, 9mobile
- 15+ data plans with retail/wholesale pricing
- Dynamic virtual bank account generation per transaction
- Dual-provider VTU with automatic fallback

### Components
- NetworkSelector — 4-button network picker
- PlanGrid — 2-column plan card grid with filtering
- PhoneInput — masked input with localStorage persistence
- CountdownTimer — 20-minute expiry countdown with progress bar
- CheckoutPanel — bank transfer instructions + polling
- StatusScreen — success/failed/expired full-screen states
- OrderLookup — phone-based transaction history (last 3)
- ToastProvider — react-hot-toast notifications
- ServiceWorkerRegistrar — PWA offline support

### Environment
- 15 required env vars (see .env.local.example)
- Support for local development (in-memory rate limit fallback)
- Production-ready with Upstash Redis, Supabase, external APIs
