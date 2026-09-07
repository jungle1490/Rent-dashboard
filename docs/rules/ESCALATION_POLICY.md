# Escalation Policy

Model capability is a budgeted resource. Spend the top tier on judgment, the lower tiers on
well-specified execution, and make every escalation carry maximum information.

## Tier assignment

| Work | Tier |
|---|---|
| Architecture, SPEC, CONVENTIONS, ADRs | **Top** (write once, with rationale) |
| Frozen core modules + their test suites | **Top** (then freeze) |
| Task decomposition into cards | **Top** or mid |
| Implementing a task card against existing tests/types | Mid / low |
| Boilerplate, refactors with green tests, doc formatting | Low |
| Milestone review, architecture health-check | **Top** (batched, at milestones) |
| Novel math, cross-module bugs, anything not covered by docs | **Top** |

Each task card carries a `tier:` field suggesting who should run it.

## The two-strikes rule (R11)

1. Attempt the problem. If it fails, form a new hypothesis and attempt once more.
2. If the second attempt fails, **stop**. Do not thrash. Revert stray changes, then escalate.

## How to package an escalation

The strong model's time is wasted if it must rediscover context. Write an entry in
`docs/memory/QUESTIONS.md` containing:

```markdown
## Q-### <one-line problem statement>
- **Goal:** what the task card required
- **Symptom:** exact error/output, pasted (R4)
- **Repro:** the minimal command or test that shows it
- **Attempts:** what you tried (1, 2) and what each ruled OUT
- **Hypotheses remaining:** your best guesses, ranked
- **Files involved:** paths (+ line numbers if known)
```

Ruled-out attempts are valuable evidence — a good escalation makes the strong model's first
minute productive.

## Batching

Non-blocking questions accumulate in QUESTIONS.md and are answered in batches during a
strong-model session (milestone review), instead of burning one strong call per small question.
Blocking questions (work cannot proceed) escalate immediately.

## Strong-model sessions

When the top-tier model runs, it should, in order:
1. Answer/resolve everything in QUESTIONS.md (writing decisions into DECISIONS.md or ADRs).
2. Review recent SESSION_LOG.md entries for drift from conventions/architecture.
3. Do the top-tier work queued for it (new ADRs, core modules, task decomposition).
4. Leave the docs/tests in a state where lower tiers can run unattended again.
