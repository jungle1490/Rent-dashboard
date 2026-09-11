---
name: debug-protocol
description: Disciplined debugging procedure - reproduce, state the violated invariant, rank hypotheses, run the cheapest discriminating experiment, fix, add a regression test. Use whenever investigating a bug, test failure, wrong output, crash, or unexpected behavior.
---

# Debug protocol

The failure mode this prevents: pattern-matching to a plausible cause and "fixing" it without
evidence, which burns attempts and often adds noise to the diff. Follow the steps; each is
cheap; none is optional.

## 1. Reproduce first (R6)

Get the failure to happen on demand, as small as possible — ideally a failing test, else a
minimal script in the scratch directory. Paste the actual failure output. If you cannot
reproduce it, you may NOT change code; gather more information instead.

## 2. Check the playbook

Open `docs/playbooks/` for the matching symptom and run its checks top to bottom. Playbook
hit → apply, then continue at step 5. Miss → continue at step 3 (and remember to add the row
at step 6).

## 3. State the violated invariant

Write one sentence: "X should hold here, but instead Y." If you cannot name the invariant,
you do not understand the failure yet — read more code / add observation points until you can.

## 4. Hypotheses → cheapest discriminating experiment

- List ~3 hypotheses ranked by likelihood. For each: an observation that would DISTINGUISH
  it from the others (not merely be consistent with it).
- Run the cheapest experiment first. **Predict the outcome in writing before running.**
  Wrong prediction = hypothesis eliminated; that is progress, record it.
- Locate before you fix: bisect the pipeline (log/inspect the midpoint value, then halve
  toward the bad side) rather than reading everything.

## 5. Fix minimally, prove it

The fix should be as narrow as the proven cause. Turn the reproduction from step 1 into a
permanent regression test, named after the bug. Run the FULL suite, not just the new test —
paste output (R4).

## 6. Close the loop (R12)

- Root cause wasn't in the playbook → add a symptom/check row.
- Session log entry: symptom → root cause → fix → test name, with evidence labels.
- Two failed fix attempts at any point → stop, escalate per ESCALATION_POLICY (R11).
