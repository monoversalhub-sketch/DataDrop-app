---
applyTo: "src/app/api/**/*.js"
---

# DataDrop API Route Instructions
> Rules specific to all Next.js API route handlers.

---

## Every API Route Must Follow This Structure

```js
import { createClient } from '@supabase/supabase-js';

export async function POST(request) {
  // 1. Init Supabase INSIDE handler (never at module level)
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // 2. Parse and validate input
  const body = await request.json();
  // Validate required fields before any DB or API calls

  // 3. Business logic

  // 4. Return response
  return Response.json({ ... }, { status: 200 });
}
```

---

## Route-Specific Rules

### /api/checkout
- Rate limit FIRST — before any other processing
- Validate `data_plan_id` against `PLANS` object — reject unknown IDs
- Derive `wholesale_cost` from `PLANS` — NEVER from request body
- Set `expires_at` = now + `VA_EXPIRY_MINUTES` minutes
- Return 400 on validation failures, 429 on rate limit, 200 on success

### /api/webhook
- Verify HMAC signature FIRST — before reading any payload data
- Use `crypto.timingSafeEqual` — never string comparison
- Return 200 immediately after HMAC check fails (don't reveal why it failed)
- Check transaction status — if already 'success', return 200 immediately
- Check `expires_at` — if expired, set 'expired' and notify
- Update to 'processing' BEFORE calling VTU API
- Try primary VTU → if fails → try fallback VTU → only then 'failed'
- Return 200 always (gateway retries on non-200)

### /api/status/[reference]
- Return minimum data: `{ status, data_plan_name, network }` only
- NEVER return `phone_number`, `alternative_contact`, `cost_amount`
- Return 404 if reference not found — not 500
- This endpoint is the most-called — keep it fast (single indexed lookup)

### /api/lookup
- Accept phone number as query param
- Return last 3 transactions for that phone: `{ id, status, data_plan_name, network, created_at }` only
- NEVER return amounts or alternative_contact in response
- Validate phone format before querying

---

## Error Response Format

```js
// Always return structured errors
return Response.json(
  { error: "Plain English description of what went wrong" },
  { status: 400 }
);

// Not:
return Response.json({ message: "Error", code: "INVALID_PLAN_ID_ERR" })
```
