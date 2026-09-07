# Memory Architecture

Agents have no memory between sessions; the project's memory lives in files. The design
principle: **memory is truth written down with evidence, not a chat transcript.** A new agent
must be able to reach full working context by reading four small files.

## The four files (`docs/memory/`)

| File | Nature | Content |
|---|---|---|
| `STATE.md` | **rewritten** each session | Current truth: what works, what's in progress, what's next. Hard cap ~60 lines — it's a snapshot, not a history. |
| `SESSION_LOG.md` | append-only | One entry per session: did / learned / blocked-on / next. Newest first. |
| `DECISIONS.md` | append-only | Dated decision log: what was decided, why, evidence. Big decisions get a full ADR; this file indexes them and holds small ones. |
| `QUESTIONS.md` | worked queue | Open questions & escalations (format in `ESCALATION_POLICY.md`). Strong-model sessions drain it; answered items move to DECISIONS.md. |

## Session-start protocol (reading order)

1. `CLAUDE.md` (loaded automatically) → 2. `docs/memory/STATE.md` → 3. your task card →
4. the CONVENTIONS/ADR sections the card points to. Read SESSION_LOG.md further back only
if STATE.md leaves you confused — if so, that's a defect in STATE.md; fix it (R12).

## Session-end protocol (write-back)

1. Rewrite `STATE.md` to current truth (delete stale lines — it must stay a snapshot).
2. Append a `SESSION_LOG.md` entry:
   ```markdown
   ## 2026-07-03 · <agent/model> · T-004
   - Did: <what changed, files touched>
   - Learned: <facts worth keeping, with evidence pointers>  [VERIFIED/INFERRED labels]
   - Blocked: <or "-">
   - Next: <the single most useful next action>
   ```
3. New decisions → DECISIONS.md (dated, with why). New unknowns → QUESTIONS.md.
4. Nothing goes into memory unlabeled: facts carry `[VERIFIED file:line]`-style pointers
   so a later agent can re-check them instead of trusting them blindly.

## Hygiene rules

- STATE.md over 60 lines → compress it now; it has stopped being a snapshot.
- SESSION_LOG.md over ~300 lines → move the oldest half to `SESSION_LOG.archive.md`.
- A memory fact contradicted by reality → delete/correct it immediately and note the
  correction in the session log (stale memory is worse than no memory).
- Do not duplicate what git history or the code already records; memory holds intent,
  rationale, and state — not diffs.

## Relationship to the user-level memory

Claude Code also keeps user-level memory (`~/.claude/.../memory/`) across all projects.
Project facts belong HERE, in the repo, where any agent/tier/tool can read them; user-level
memory should hold only cross-project facts (preferences, ongoing goals).
