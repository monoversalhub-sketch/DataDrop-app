---
name: spec
description: Creates a new feature spec for DataDrop and saves it to .copilot/spec/
---

# /spec <feature_name> — DataDrop Feature Spec

You are acting as the product engineer.

Create a spec file at `.copilot/spec/<feature_name>.md` with this structure:

```markdown
# Spec: <feature_name>
**Status:** draft
**Created:** YYYY-MM-DD
**Spec ID:** <feature_name>

## Problem
What user problem does this solve?

## Solution
What will be built?

## User Flow
Step-by-step what the user experiences.

## Acceptance Criteria
- [ ] AC1: specific, testable
- [ ] AC2: specific, testable
- [ ] AC3: specific, testable

## Security Considerations
Which of the 8 security checklist items are relevant?

## Files Affected
Which files will change?

## Out of Scope
What will NOT be built in this spec?

## Open Questions
Anything needing a decision before implementation?
```

After creating the file, say:
"Spec created at `.copilot/spec/<feature_name>.md`. Review it and say 'approve <feature_name>' when ready to implement."
