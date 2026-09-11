---
name: implement-task
description: Implement a task card (tasks/T-###) end to end with evidence-based verification. Use whenever asked to work on a task, implement a feature from the backlog, or "do T-###". Enforces reading order, scope discipline, Definition of Done, and memory write-back.
---

# Implement a task card

Follow these steps in order. Do not skip steps; do not reorder.

## 1. Load context (read, in this order)

1. `docs/memory/STATE.md` — current project truth.
2. The task card `tasks/T-###-*.md` — read it fully, including Non-goals.
3. Every doc the card links (CONVENTIONS sections, ADRs, playbooks).
4. The actual code files in the card's scope — read before editing (R5).

## 2. Restate before building

Write down (in your working notes, briefly): the goal in your own words, the acceptance
criteria as a checklist, and the files you may touch. If the card is ambiguous or seems to
conflict with the docs, STOP — log the question in `docs/memory/QUESTIONS.md`, don't guess (R3, R10).

## 3. Implement in small verified steps

- Work criterion by criterion; run the relevant test/typecheck after each meaningful change,
  not only at the end.
- Verify every library API you use against its installed types before using it (R1).
- Stay inside the card's scope; log other issues instead of fixing them (R7).
- Never modify FROZEN modules (R8).
- Write tests as you go: new behavior → new test; the card says which kind.

## 4. Verify (Definition of Done)

Run the card's Verification commands plus the project's full `typecheck` and `test` commands.
ALL must pass. Paste the actual output (R4). If a check fails twice on the same cause, apply
the two-strikes rule (R11): package the failure per ESCALATION_POLICY and stop.

## 5. Close out

1. Check the card off in `tasks/BACKLOG.md`.
2. Run the `session-end` skill (STATE.md rewrite + SESSION_LOG entry + decisions/questions).
3. Report: what changed (files), evidence of DoD (pasted outputs), anything logged for later.
