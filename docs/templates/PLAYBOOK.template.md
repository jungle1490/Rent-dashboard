# Playbook: {{DOMAIN, e.g. "3D rendering bugs"}}

Symptom-indexed checklists. Playbooks encode debugging judgment: given a symptom, check the
known causes in order of likelihood BEFORE forming novel hypotheses. Extend this file whenever
a bug's root cause wasn't listed — that's how the playbook earns its keep.

## How to use

1. Find your symptom below; run its checks top to bottom (cheapest first).
2. Every check is an observation, not a guess — actually look at the value/output.
3. Nothing matches → fall back to the `debug-protocol` skill (invariant → hypotheses →
   discriminating experiment).
4. Root cause found that isn't listed → add a row (that IS part of your task, R12).

---

## Symptom: {{e.g. "screen is black"}}

| Check (cheapest first) | How to check | If it's this |
|---|---|---|
| {{likely cause 1}} | {{exact observation to make}} | {{fix or next step}} |
| {{likely cause 2}} | {{…}} | {{…}} |

## Symptom: {{…}}

| Check | How to check | If it's this |
|---|---|---|
| {{…}} | {{…}} | {{…}} |
