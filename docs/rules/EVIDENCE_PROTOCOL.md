# Evidence Protocol

Concrete recipes for grounding every claim in actual data. This is how you comply with R1–R4.
The pattern is always the same: **turn "I think X" into a cheap experiment that shows X.**

## Recipes by claim type

### "This library API exists / has this signature"
Do NOT trust memory — APIs change between versions. Check, in order:
1. The installed types: `node_modules/<pkg>/**/*.d.ts` (grep for the symbol), or the
   package's own docs/README inside `node_modules/<pkg>/`.
2. If ambiguous, write a 5-line scratch script that imports and calls it, run it.
Cite what you found: package version (from `package.json` / lockfile) + file path.

### "This code behaves like X"
1. Read the actual source, cite `file:line`.
2. If behavior depends on runtime state, write a minimal repro (≤ 20 lines) in the scratch
   directory and run it. Paste the output.

### "The bug is caused by X"
A cause is proven only by a discriminating experiment: change one thing, predict the outcome
before running, run it, compare. If you didn't predict it beforehand, it's a post-hoc story.
(Full procedure: the `debug-protocol` skill.)

### "The tests pass" / "it builds"
Run the exact commands listed in CLAUDE.md and paste the tail of the output. A partial run
must be reported as partial ("unit tests pass; e2e not run").

### Numbers and math
Never do arithmetic beyond 2 significant figures in your head — compute it (script or REPL)
and paste the result. For floating-point comparisons, use the project's epsilon constants;
never compare floats with `===` and never invent a tolerance inline.

### External docs / web sources
Quote the exact sentences you rely on (with URL), then state your conclusion. If you can only
find secondary sources, label the claim `[INFERRED]`, not `[VERIFIED]`.

## Before-answering checklist

Before submitting any report or marking a task done, scan your own text for these red flags:
- A file path, symbol, or option name you never opened → open it or delete the claim.
- The words "should", "probably", "typically" in front of a factual claim → verify or label.
- An error message in your own words → replace with the pasted original.
- A test/build status without a command run this session → run it.

## Cost rule of thumb

Verification is almost always cheaper than a wrong guess: a grep is ~seconds; a wrong API
guess costs a failed edit, a failed run, and a confused debugging session. When in doubt, look.
