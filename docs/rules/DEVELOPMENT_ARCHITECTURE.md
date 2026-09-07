# Development Architecture

The reusable structural pattern for agent-driven projects. Its goal: make correctness
**mechanically checkable**, so implementation quality depends on iteration (which any model
can do) rather than judgment (which only strong models have).

## Layered code architecture

```
┌──────────────────────────────────────────────┐
│ app/       UI, wiring, I/O                   │  may import: adapters, core
├──────────────────────────────────────────────┤
│ adapters/  bridges core ↔ frameworks/libs    │  may import: core, external libs
├──────────────────────────────────────────────┤
│ core/      domain logic & math — PURE        │  may import: nothing external
└──────────────────────────────────────────────┘
```

Rules:
- `core/` has **zero external dependencies**, no I/O, no globals; pure functions over plain
  data. This is what makes it exhaustively testable and portable.
- Dependencies point downward only. An import from `core/` into anything external is a defect.
- External libraries are touched **only** in `adapters/`. Swapping a framework must not touch core.

## The FROZEN core policy

The hardest, most central module (usually `core/`) is written by the top-tier model, covered
by property-based + golden tests, then declared FROZEN in CLAUDE.md:
- Lower-tier agents may **call** it, never **modify** it (R8).
- Its test suite is the module's certificate; if a frozen test fails after an environment
  change, that is an immediate escalation, not a fix-it-yourself.
- Unfreezing requires a task card written by the top tier.

## Task-card system

All implementation work flows through task cards (`tasks/T-###-*.md`, template in
`templates/TASK.template.md`). A card is small (≤ ~half a day), self-contained, and carries
its own **acceptance criteria** and **verification commands**. `tasks/BACKLOG.md` is the
ordered index. Lifecycle: `backlog → in-progress (note in STATE.md) → done (checked off in
BACKLOG.md, session logged)`.

Why cards: a lower-tier model is reliable exactly when the task is local, explicit, and
verifiable. The card is the container that guarantees those three properties.

## Definition of Done (DoD)

A task is done only when ALL of these hold — paste evidence for each (R4):

1. Typecheck passes (project's `typecheck` command).
2. Full test suite passes — including new tests this task added.
3. The task card's own acceptance criteria are each demonstrably met.
4. New behavior has tests; fixed bugs have a regression test (R6).
5. No files outside the task's declared scope were modified (R7).
6. Conventions spot-check: units, naming, and layer rules match `docs/CONVENTIONS.md`.
7. Memory updated: STATE.md reflects reality; SESSION_LOG.md has this session's entry (R12).

## Test strategy (for correctness-critical code)

| Kind | What it catches | Example |
|---|---|---|
| **Property tests** | whole classes of errors via invariants | rotation preserves vector length |
| **Golden tests** | wrong formulas, via known analytic answers | 2-link FK vs closed-form |
| **Doc-example tests** | docs drifting from code | the exact snippet in CONVENTIONS.md runs |
| **Cross-checks** | independent implementations disagreeing | analytic Jacobian vs finite differences |
| **Regression tests** | fixed bugs returning | one per bug, named after it |

Property + cross-check tests are the highest-leverage: they encode judgment once and then
police every future change automatically.

## Error-message quality rule

Every thrown error must name the offending object and the likely fix
(`"Joint 'elbow': axis must be unit length (got 1.414)"`, not `"invalid axis"`).
Agents debug with error text; message quality is debugging speed.
