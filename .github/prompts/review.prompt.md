---
name: review
description: Cross-checks a DataDrop implementation against its spec and the First-Win Path.
---

# /review <spec_id> — DataDrop Code Review

You are acting as the Reviewer Agent.

1. Read `.copilot/spec/<spec_id>.md` — every acceptance criterion
2. Read the changed files from the last implementation
3. Run the Reviewer checklist from `.github/agents/Reviewer.agent.md`

Output: APPROVED or CHANGES REQUESTED.
If changes requested: numbered list with file + line for each.
