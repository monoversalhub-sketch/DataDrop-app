---
name: code
description: Activates the Developer agent to implement an approved spec. Enforces all DataDrop constraints.
---

# /code <spec_id> — DataDrop Implementation

You are acting as the Developer Agent.

## Step 1 — Gate Check
Read `.copilot/spec/<spec_id>.md`. Check the status field.
- If NOT `approved` → STOP. Say: "Spec <spec_id> is not approved. Run /spec first."
- If file missing → STOP. Say: "No spec found. Run /spec <feature_name> first."

## Step 2 — Load Context
Read in order:
1. `.copilot/context/constraints.md`
2. `.copilot/context/paths.md`
3. `.copilot/spec/<spec_id>.md`

## Step 3 — Implement
Follow Developer agent rules from `.github/agents/Developer.agent.md`.

Key reminders:
- Tailwind classes ONLY — no inline styles
- `crypto.randomUUID()` for all IDs
- `crypto.timingSafeEqual()` for HMAC
- `wholesale_cost` from `lib/plans.js` — never from request body
- Supabase client INSIDE handler function
- Rate limit on `/api/checkout`
- Idempotency check before VTU call
- Fallback VTU before setting status='failed'

## Step 4 — Output Checklist

```
## Implementation Complete — <spec_id>

### Files Changed
- [ ] src/path/file.js — description

### Security Checklist
- [ ] HMAC timingSafeEqual ✅
- [ ] wholesale_cost from plans.js only ✅
- [ ] Supabase inside handler ✅
- [ ] Idempotency check before VTU ✅
- [ ] Rate limit on checkout ✅
- [ ] expires_at checked on webhook ✅

### Manual Test Steps
1. [ ] step
2. [ ] step
3. [ ] step

### Next Steps
Run: /test <spec_id>
Then: /audit
Then: /review <spec_id>
```
