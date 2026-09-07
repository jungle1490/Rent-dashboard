# {{PROJECT_NAME}}

{{ONE_PARAGRAPH: what this software is, for whom.}}

## Session start — read in this order

1. `docs/memory/STATE.md` — where the project actually is right now
2. Your task card in `tasks/` (pick from `tasks/BACKLOG.md` if unassigned)
3. `docs/CONVENTIONS.md` sections relevant to your task
4. The ADR covering your area (`docs/adr/`)

## Commands

```bash
{{TYPECHECK_COMMAND}}     # typecheck — must pass before "done"
{{TEST_COMMAND}}          # full test suite — must pass before "done"
{{DEV_COMMAND}}           # run the app locally
```

## Architecture (details: docs/adr/)

```
{{LAYER_DIAGRAM: core / adapters / app, with import rules}}
```

- `{{CORE_PATH}}` is **FROZEN** — call it, never modify it (rule R8). Its tests are its
  certificate. Changes require an approved task card.
- External libraries only in `{{ADAPTERS_PATH}}`. `{{CORE_PATH}}` imports nothing external.

## Conventions you will otherwise get wrong

Source of truth: `docs/CONVENTIONS.md`. The most-violated ones:

{{TOP_CONVENTIONS_TABLE: the 5–10 conventions agents most often break in this domain,
e.g. units, coordinate systems, ID formats, naming, error handling}}

## Rules

This project runs on the agent framework (`{{FRAMEWORK_PATH}}`):

- **Evidence over memory** — never claim what you haven't looked at; label VERIFIED /
  INFERRED / ASSUMPTION. Full rules: `rules/AGENT_RULES.md` (R1–R12), recipes:
  `rules/EVIDENCE_PROTOCOL.md`.
- **Done = Definition of Done** in `rules/DEVELOPMENT_ARCHITECTURE.md` — typecheck + tests +
  acceptance criteria + memory updated, with pasted evidence.
- **Two strikes then escalate** — after 2 failed attempts, package the problem per
  `rules/ESCALATION_POLICY.md` into `docs/memory/QUESTIONS.md` and stop.
- **Session end** — update `docs/memory/` per the `session-end` skill before finishing.

## Current focus

{{ONE_LINE: current milestone; keep in sync with STATE.md}}
