# Agent Rules

Numbered so reviews can cite them ("this violates R3"). These are hard rules, not suggestions.
They exist for one reason: **every claim you make must be grounded in evidence you actually
looked at, not in what you remember or expect.**

## Evidence & anti-hallucination

- **R1 — Never state what you haven't seen.** Before claiming a file, function, API, option,
  or behavior exists, look at it (read the file, grep the types, run the command). Training-data
  memory is a hypothesis, not a source. See `EVIDENCE_PROTOCOL.md` for concrete recipes.
- **R2 — Label your claims.** In reports and memory files, distinguish:
  `[VERIFIED]` (you ran/read it — cite file:line or paste the command + output),
  `[INFERRED]` (derived from verified facts — state the premises),
  `[ASSUMPTION]` (unverified — must also be logged in `docs/memory/QUESTIONS.md`).
- **R3 — "Unknown" is a valid answer.** If you cannot verify something, say "I could not
  verify X" and log it in QUESTIONS.md. Never fill the gap with a plausible guess.
- **R4 — Paste real output.** When reporting results, quote the actual command output or error
  text. Never paraphrase an error message, never report a test as passing without running it.
  "If you didn't run it, it doesn't work."

## Code changes

- **R5 — Read before write.** Before editing any file: read the current task card, the relevant
  section of `docs/CONVENTIONS.md`, and the ADR covering that area. Before using a library API:
  verify its signature (R1).
- **R6 — Reproduce before fix.** Never fix a bug you have not reproduced. Prefer writing a
  failing test first; the fix must turn it green, and the test stays as a regression guard.
- **R7 — Scope discipline.** Implement exactly the task card. If you notice other problems,
  log them in `docs/memory/SESSION_LOG.md` (or propose a new task card) — do not fix drive-by.
- **R8 — Frozen zones.** Code marked FROZEN in CLAUDE.md may not be modified without an
  explicitly approved task card. If a frozen module seems wrong, stop and escalate — a frozen
  module with full tests is more likely right than your reading of it.
- **R9 — Done means the checklist passed.** "Done" is defined by the Definition of Done in
  `DEVELOPMENT_ARCHITECTURE.md`, not by "the code looks right".

## Judgment boundaries

- **R10 — Docs are law until proven wrong.** If reality seems to contradict SPEC/CONVENTIONS/ADRs,
  do not silently improvise. Verify the contradiction (R1), then stop and escalate with evidence.
- **R11 — Two-strikes escalation.** After two failed attempts at the same problem, stop.
  Package your attempts per `ESCALATION_POLICY.md` and hand off. A third blind attempt wastes
  budget and often makes the diff worse.
- **R12 — Leave a trail.** End every working session by updating the memory files per
  `../memory/MEMORY_ARCHITECTURE.md` (STATE.md rewritten to current truth, SESSION_LOG.md
  appended). An unrecorded session is work the next agent will redo.
