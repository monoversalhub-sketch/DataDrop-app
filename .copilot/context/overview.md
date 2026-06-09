# DataDrop — Project Overview
> Read this file before acting on any task in this repository.

---

## What DataDrop Is

DataDrop is a zero-friction, accountless VTU (Virtual Top-Up) data vending PWA
built for the Nigerian mobile data market.

DataDrop is **not**:
- A wallet app
- A fintech platform requiring KYC
- A subscription service
- A user account system

DataDrop **is**:
> The fastest way for any Nigerian to buy cheap mobile data — no account, no login, no friction.

---

## The Core Problem

> "Why do I need to create an account just to buy ₦500 airtime?"

A Nigerian data buyer today faces:
- Retail telco prices (₦431–₦500/GB) with no negotiation
- VTU platforms that demand sign-ups, wallet top-ups, and verification
- WhatsApp resellers who go offline or vanish with money
- Confusing apps with too many features and too little trust
- No status tracking — you pay and pray

DataDrop solves this with a 3-tap flow:
**Enter number → Select plan → Transfer → Data arrives.**

---

## The Three Things DataDrop Sells

**1. Speed**
No account. No sign-up. No form except a phone number.
Open the app, pick your plan, get your bank account, transfer, done.
Target: under 90 seconds from open to data delivered.

**2. Price**
DataDrop sources SME data at wholesale rates and passes meaningful savings
to users. The average Nigerian pays ₦431–₦500/GB on retail telco networks.
DataDrop targets ₦270–₦350/GB, a 20–35% saving.

**3. Trust**
Every transaction creates a verifiable audit trail:
- Bank transfer confirmation on your statement
- Real-time status polling shows exactly where your data is
- WhatsApp recovery fallback on failure — no silent losses
- "Check my order" flow for users who close the browser mid-payment

---

## Transaction Flow (The Core Architecture)

```
User enters phone + selects plan
         ↓
/api/checkout generates dynamic virtual bank account (20min window)
         ↓
User transfers exact amount via mobile banking
         ↓
Payment gateway fires webhook to /api/webhook
         ↓
Webhook verifies HMAC signature → finds transaction → checks idempotency
         ↓
Fires VTU aggregator API → delivers data bundle to phone number
         ↓
Status polling detects success → UI shows green checkmark
         ↓
If failure → status = 'failed' → WhatsApp notification sent to alternative_contact
```

---

## Target Users

**Primary:** Any Nigerian with a smartphone who buys data regularly.
- Students (heavy data users, price-sensitive)
- Small business owners (need reliable data for WhatsApp business)
- Remote workers (consistent data buyers)
- Data resellers (can use DataDrop as a backup source)

**Device profile:** Android (Samsung A-series, Tecno, Infinix), Nigerian 4G/3G,
Chrome browser or PWA installed to homescreen.

---

## Revenue Model

- **Margin:** Buy SME data at ~₦270/GB, sell at ~₦350/GB = ~₦80/GB margin
- **Volume:** High-frequency, low-friction purchases drive volume
- **Upsell:** Popular plan bundles featured prominently (higher margin plans)
- **No subscription:** Every transaction is standalone, no recurring commitment

---

## Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Framework | Next.js 14 (App Router) | PWA support, serverless API routes |
| UI | Inline styles + Tailwind utility | Mobile-first, fast render |
| Database | Supabase (PostgreSQL + RLS) | Free tier, real-time capable |
| Payments | Monnify or Flutterwave (dynamic VA) | Nigerian bank transfer support |
| VTU | CheapDataHub or VTU.ng API | SME data wholesale rates |
| Hosting | Vercel (Hobby tier) | Auto-deploy, edge functions |
| Rate limiting | Upstash Redis | Distributed abuse protection |

---

## Current State (v1)

- **Version:** 1 (greenfield)
- **Status:** Specification phase
- **Goal:** Ship MVP in < 2 weeks with core transaction flow working
- **Blocking items before launch:**
  1. Payment gateway sandbox credentials configured
  2. VTU aggregator API account + test credits
  3. Supabase project created with schema applied
  4. Webhook URL registered with payment gateway
  5. Rate limiting (Upstash) configured
  6. WhatsApp Cloud API or Twilio for failure notifications

---

## The First-Win Path (Never Break This)

1. User opens DataDrop PWA → sees network selector immediately (not a blank screen)
2. Taps network (MTN / Airtel / Glo / 9mobile)
3. Selects data plan from list
4. Enters phone number (pre-filled if returning user)
5. Taps "Pay Now" → virtual bank account appears with countdown timer
6. User transfers in mobile banking app
7. Status polling detects success → **green checkmark + "Data is on its way!"**
8. Data arrives on phone within 60 seconds

**Any step that fails = BLOCKED. Fix before shipping.**
