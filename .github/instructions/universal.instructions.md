---
applyTo: "**/*.{js,jsx}"
---

# DataDrop Universal Instructions
> These rules apply to EVERY JavaScript and JSX file in this repository.
> Any AI agent editing a file must follow these rules automatically.

---

## Forbidden Patterns — Will Be Flagged Immediately

### 1. alert() is banned
```js
// ❌ NEVER
alert("something happened")

// ✅ ALWAYS
toast("something happened")  // from react-hot-toast
```

### 2. String equality on cryptographic values is banned
```js
// ❌ NEVER — timing attack vulnerability
if (hash !== signature) { ... }

// ✅ ALWAYS — constant-time comparison
const valid = crypto.timingSafeEqual(
  Buffer.from(hash, 'hex'),
  Buffer.from(signature, 'hex')
);
```

### 3. Math.random() for references/IDs is banned
```js
// ❌ NEVER
const ref = "TX" + Date.now() + Math.random()

// ✅ ALWAYS
const ref = crypto.randomUUID()
```

### 4. Polling without cleanup is banned
```js
// ❌ NEVER — keeps running after component unmounts
setInterval(() => pollStatus(), 5000)

// ✅ ALWAYS — cleaned up on unmount
useEffect(() => {
  const interval = setInterval(pollStatus, 5000);
  return () => clearInterval(interval);
}, [reference]);
```

### 5. Supabase client at module level is banned
```js
// ❌ NEVER — fails on Vercel cold starts
const supabase = createClient(...)  // top of file

// ✅ ALWAYS — inside handler
export async function POST(req) {
  const supabase = createClient(process.env.SUPABASE_URL, ...)
}
```

### 6. wholesale_cost from client body is banned
```js
// ❌ NEVER — price manipulation attack
const { wholesale_cost } = await req.json()

// ✅ ALWAYS — server derives from plan catalogue
const { data_plan_id } = await req.json()
const plan = PLANS[data_plan_id]
const wholesale_cost = plan.wholesale_price
```

### 7. Secrets in client components are banned
```js
// ❌ NEVER — exposed in browser bundle
process.env.SUPABASE_SERVICE_ROLE_KEY  // in a component file
process.env.WHATSAPP_TOKEN             // in a component file
process.env.VTU_API_KEY               // in a component file

// ✅ These env vars only appear in src/app/api/ and src/lib/ files
```

---

## Required Patterns

### Design tokens come from Tailwind config
```jsx
// Use Tailwind classes — never hardcode hex
<div className="bg-zinc-900 text-white">
<button className="bg-emerald-500 h-12 rounded-xl font-bold">
```

### User feedback uses toast
```js
import toast from 'react-hot-toast';
toast.success("Data is on the way! 🎉");
toast.error("Transfer failed. Your money will be refunded.");
```

### Plan data comes from lib/plans.js
```js
// Server-side (API routes)
import { PLANS, PLANS_BY_NETWORK } from '@/lib/plans';
const plan = PLANS[data_plan_id];

// Client-side (components) — fetch from API or import PLANS_BY_NETWORK only
import { PLANS_BY_NETWORK } from '@/lib/plans';
```
