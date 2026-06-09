---
name: status
description: Reports the current health and launch readiness of DataDrop.
---

# /status — DataDrop Project Status

Read:
1. `.copilot/context/overview.md` — current state section
2. `CHANGELOG.md` — recent changes
3. `.copilot/spec/` — list all specs and their statuses

Report:

```
## DataDrop Status Report — YYYY-MM-DD

### Launch Readiness: X / 10

### Core Transaction Flow
- [ ] /api/checkout implemented and tested
- [ ] /api/webhook implemented with HMAC + idempotency
- [ ] /api/status polling working
- [ ] VTU delivery working (primary)
- [ ] VTU fallback working
- [ ] WhatsApp failure notification working

### UI Completeness
- [ ] NetworkSelector
- [ ] PlanGrid
- [ ] CheckoutPanel with countdown
- [ ] StatusScreen (success/failed/expired)
- [ ] Phone pre-fill from localStorage
- [ ] OrderLookup flow
- [ ] PWA installable (manifest + sw)

### Security
- [ ] All 8 security checklist items passing
- [ ] Rate limiting live (Upstash)
- [ ] Env vars all set in Vercel

### Open Specs
List any specs in draft or approved-but-not-implemented state.

### Blocking Items Before Launch
List any items that must be resolved before first real user.

### Recent Changes
Last 3 CHANGELOG entries.
```
