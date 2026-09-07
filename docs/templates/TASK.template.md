# T-{{NUMBER}}: {{TITLE}}

- **Tier:** top | mid | low   ← who should run this (see rules/ESCALATION_POLICY.md)
- **Depends on:** T-{{N}} | -
- **Scope (files):** {{paths the task is allowed to touch; everything else is out of scope (R7)}}

## Context

{{Why this task exists; links to SPEC section / ADR / playbook the implementer must read.}}

## Goal

{{Observable end state, 1–3 sentences. What exists after that didn't before.}}

## Non-goals

{{Explicitly out of scope — the adjacent things a helpful agent might wrongly bundle in.}}

## Acceptance criteria

<!-- Each criterion is binary and checkable. No "works well", only "does X when Y". -->
- [ ] {{criterion 1}}
- [ ] {{criterion 2}}
- [ ] New behavior covered by tests ({{which kind: unit/property/golden/regression}})

## Verification

```bash
{{exact commands whose output proves the criteria; the implementer pastes their output}}
```

## Hints (optional)

{{Pointers a lower-tier model needs: which existing function to reuse, which convention
applies, known traps. Written by the task author, not discovered by the implementer.}}
