---
name: session-end
description: Write back project memory before finishing a working session - rewrite STATE.md to current truth, append SESSION_LOG entry, file decisions and open questions. Use at the end of any session that changed code, docs, or understanding; also when the user says "wrap up" or "handoff".
---

# Session end — memory write-back

An unrecorded session is work the next agent redoes. This takes 5 minutes; do all four steps.

## 1. Rewrite `docs/memory/STATE.md`

It is a SNAPSHOT (≤ 60 lines), not a diary. Rewrite it so a fresh agent reading only this
file knows: what currently works (verified how), what is in progress (which task card, where
it stands), what is next (ordered), and any active warnings ("X is flaky", "don't touch Y
until T-012"). Delete every stale line.

## 2. Append to `docs/memory/SESSION_LOG.md` (newest first)

```markdown
## <date> · <model/agent> · <task id or topic>
- Did: files touched + what changed, one line each
- Learned: durable facts with evidence labels ([VERIFIED test output], [INFERRED], …)
- Blocked: what stopped you, or "-"
- Next: the single most useful next action
```

## 3. File the durable items

- Decisions made this session → `docs/memory/DECISIONS.md` (dated, one line of why;
  architecture-level ones get a full ADR file and an index line here).
- Open unknowns / escalations → `docs/memory/QUESTIONS.md` in the ESCALATION_POLICY format.
- Root causes found → the matching `docs/playbooks/` table.

## 4. Self-check before finishing

- Would a fresh agent, reading STATE.md alone, start correctly? If not, fix STATE.md.
- Any claim written without evidence label or pointer? Label it or verify it (R2).
- Any file changed outside the task's scope? Mention it explicitly in the log (R7).
- STATE.md > 60 lines or SESSION_LOG > ~300 → compress/rotate per MEMORY_ARCHITECTURE.
