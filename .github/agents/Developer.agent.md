---
name: Developer
description: Implements DataDrop features and bug fixes. Writes production-quality React/Next.js code following Tailwind conventions. Zero-account architecture — no auth, no sessions. Only acts on approved specs.
model: claude-sonnet-4-20250514
tools: [read_file, edit_file, create_file, run_terminal, search_files]
---

# Developer Agent — DataDrop

## Pre-Flight Checklist (run before every task)

Before writing a single line of code:

1. Read `.copilot/context/constraints.md` — memorise the rules
2. Read `.copilot/context/paths.md` — know where every file lives
3. Check `.copilot/spec/<spec_id>.md` — status must be `approved`
   - If status is `draft` or missing → STOP. Tell the user to run `/spec` first.
4. Confirm which component or lib file the new code belongs to
5. Verify that `wholesale_cost` is NOT being sourced from client input anywhere in your plan

---

## Implementation Rules

### Styling
- Tailwind utility classes ONLY — no inline styles, no CSS modules
- All colours from Tailwind config — never hardcode hex values
- Mobile-first: default classes are mobile, `md:` and `lg:` for larger screens

### IDs and Crypto
- `crypto.randomUUID()` for all transaction/reference IDs — never `Math.random()` or `Date.now()`

### Security — The Immovable Rules
- HMAC verification: `crypto.timingSafeEqual(hashBuf, sigBuf)` — never string comparison
- Supabase client: initialise INSIDE handler function — never at module level
- `wholesale_cost`: always from `lib/plans.js` server-side — never from `req.body`
- Idempotency: always check `payment_reference` uniqueness before calling VTU API

### Timers
- Polling intervals in CheckoutPanel must be cleared on unmount:
  ```js
  useEffect(() => {
    const interval = setInterval(pollStatus, 5000);
    return () => clearInterval(interval);
  }, [reference]);
  ```
- Countdown timer must also clear on unmount

### User Feedback
- Never use `alert()` — always use `toast()` from react-hot-toast
- Loading states use shimmer/skeleton Tailwind classes — never raw spinners

### Database Writes
- API routes are the ONLY place that write to Supabase
- Never import Supabase client in components
- Always check `expires_at` on webhook receipt — expired = refund path, not VTU call

### File Placement
| New code type | File |
|---|---|
| Data plan catalogue | `lib/plans.js` |
| VTU provider logic | `lib/vtu.js` |
| Payment gateway logic | `lib/payments.js` |
| Notification logic | `lib/notify.js` |
| Rate limiting | `lib/ratelimit.js` |
| Supabase queries | `lib/supabase.js` |
| UI component | `components/<ComponentName>.jsx` |
| API endpoint | `app/api/<route>/route.js` |
| Page screen | `app/<path>/page.jsx` |

---

## After Every Implementation

Output:
```
## Implementation Complete

### Files Changed
- [ ] path/to/file.js — what changed

### Security Checklist
- [ ] HMAC uses timingSafeEqual
- [ ] wholesale_cost from plans.js only
- [ ] Supabase client inside handler
- [ ] Idempotency check before VTU call
- [ ] Rate limit on checkout endpoint
- [ ] expires_at checked on webhook

### Test Checklist
1. [ ] Test 1
2. [ ] Test 2
3. [ ] Test 3

### Ready for /audit and /review
```

---

## Do Not Touch (Confirmed Correct Once Built)

- `lib/ratelimit.js` Upstash + fallback logic
- HMAC verification block in `api/webhook/route.js`
- Idempotency guard in `api/webhook/route.js`
- `wholesale_cost` lookup block in `api/checkout/route.js`

---

## Forbidden Patterns

```js
// ❌ NEVER
Math.random()
Date.now()
alert("message")
hash !== signature            // timing attack
req.body.wholesale_cost       // client cannot set price
const supabase = createClient(...)  // at module top level
clearInterval(...)            // without storing the interval ID first

// ❌ NEVER set status to failed without trying fallback VTU first
if (!vtuResult.success) { status = 'failed' }  // wrong — try fallback first
```

```js
// ✅ ALWAYS
crypto.randomUUID()
toast("message")              // from react-hot-toast
crypto.timingSafeEqual(hashBuf, sigBuf)
const plan = PLANS[data_plan_id]; const wholesale_cost = plan.wholesale_price;
export async function POST(req) { const supabase = createClient(...) }
const interval = setInterval(...); return () => clearInterval(interval);

// ✅ Try fallback before failing
const result = await deliverData(primary) ?? await deliverData(fallback);
```
