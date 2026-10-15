# Hapsland semantic review demo: response routing

**Purpose:** Reproduce and compare questionable TypeScript data decisions with Hapsland's shipped review rules.
**Status:** Offline examples and review harness verified locally; real classifier judgments remain unverified.
**Authority:** Illustrative, GEV-inspired teaching cases, not accepted Hapsland product requirements or disaster-response validation.
**Expected use:** Check type invariants offline; preview review selection; opt in separately to source-bearing classifier requests.
**Lifecycle:** Update cases, examples, and commands when Hapsland's direct-review CLI, shipped rules, or source support changes. Keep planned work below aligned with observed test results.

The purpose is to catch a common failure **before** an agent builds further logic around it. The seven pairs deliberately contrast permissive shapes with stronger domain models:

| Built-in rule | Invalid example | Corrected example | Domain consequence |
| --- | --- | --- | --- |
| `meaningless_combinations` | `flat-road-state.ts` | `tagged-road-state.ts` | A blocked road may incorrectly have an open-road ETA. |
| `split_correlations` | `loose-hazard-location.ts` | `hazard-location.ts` | A location may contain only one coordinate. |
| `absence_confusion` | `loose-route-alerts.ts` | `route-alerts.ts` | Absent, null, and empty route alerts may mean the same thing. |
| `bare_domain_value` | `loose-evacuation-assignment.ts` | `evacuation-assignment.ts` | Evacuee and vehicle IDs can be swapped. |
| `name_wider_than_type` | `loose-road-risk.ts` | `road-risk.ts` | A risk band can contain arbitrary text. |
| `name_claims_resource` | `loose-emergency-comms.ts` | `emergency-comms.ts` | An alert sender conceals its delivery channel. |
| `body_reaches_undeclared` | `implicit-clock.ts` | `explicit-clock.ts` | A function uses an undeclared ambient clock. |

## Runtime trust boundary

Static TypeScript types cannot validate external JSON. The additional `src/road-intake.ts` example quarantines invalid, contradictory, stale, and future-timestamp observations before they become typed road candidates. It uses an illustrative five-minute freshness bound, not an accepted operational policy; 7 deterministic tests exercise the boundary.

These examples are **not production God's Eye View code**. A corrected static type does not validate untrusted runtime JSON, prove a road safe, or verify that any classifier will identify the intended concern.

## Offline demo (no classifier required)

From the Hapsland **fork's root**:

```sh
npm --prefix examples/road-status-demo install --ignore-scripts --no-audit --no-fund
npm --prefix examples/road-status-demo test
npm --prefix examples/road-status-demo run demo
npm --prefix examples/road-status-demo run review:preview
```

TypeScript's `@ts-expect-error` checks cover invalid assignments, while `node:test` covers deterministic behavior and the review harness. The manifest validator verifies that each of seven shipped rules has one expected finding and one expected clear case, and that the selected line still targets its declared type. Offline tests use a stubbed CLI to verify output handling without sending source to a classifier.

## Real classifier check: explicit opt-in

Hapsland's `rules check` checks a supported declaration and its eligible related code; **it may send that source and configured rule questions to a paid external review backend**. An installed and compatible Hapsland executable, configured credentials, and effective review selection are required. Agent hooks are unnecessary for these one-off checks.

From the fork root, preview one pair, then opt in only when ready:

```sh
node examples/road-status-demo/scripts/review-matrix.mjs --rule meaningless_combinations
node examples/road-status-demo/scripts/review-matrix.mjs --live --rule meaningless_combinations
# To check all eight pairs, explicitly run:
node examples/road-status-demo/scripts/review-matrix.mjs --live
```

The compatibility entrypoint `bash examples/road-status-demo/scripts/hapsland-review.sh` also runs the live matrix. Narrow further using `--case road-invalid`. **Do not enable live review on confidential source without checking your file policies.** The fork's existing root `.hapsland.jsonc` enables the four shipped rules and selects the sample files. Personal exclusions still win.

Live results are compared to *hypotheses*, not ground truth. A successful CLI exit alone does **not** mean a clear review; skipped, unavailable, malformed, and unexpected outcomes all fail the comparison. The runner writes a **sanitized, source-free** summary to ignored `.test-runs/hapsland-demo-review-summary.json` at the Git root; it does not persist `--json` source-bearing responses. Raw classifier code and prompts never belong in commit messages or CI logs. No credentials should be entered in chat.

Standalone packages currently target macOS arm64 and Linux arm64. The small offline demo runs on Node.js/TypeScript on other platforms; that does **not** establish Hapsland native support.

## Next actions, in priority order

Each action requires concrete evidence; an expected classifier result is not a pass.

1. [x] Demonstrate an invalid road-state type and the corrected discriminated union.
2. [x] Add three independent A/B rule pairs for coordinates, alerts, and identities.
3. [x] Compile-time assertions reject invalid corrected states; behavior tests cover corrected cases.
4. [x] Pin eight `rules check` requests to declarations and lines in a validated manifest.
5. [x] Add source-free preview and bounded opt-in live execution.
6. [x] Distinguish evaluated findings, evaluated clears, skips, unavailable results, and disagreement.
7. [x] Exercise the executable runner with a mock classifier and test output redaction.
8. [x] Add path-scoped offline CI for the demo (verified successful on GitHub Actions).
9. [x] Cover all seven shipped Hapsland rules with matched A/B declarations.
10. [x] Validate wire-shaped road observations and quarantine stale or contradictory states.
11. [ ] Run the first two real `meaningless_combinations` checks on a supported machine with authorized credentials.
12. [ ] Run the remaining twelve checks; record sanitized probabilities, thresholds, and failures.
13. [ ] Triage classifier false positives and false negatives, then revise only cases supported by observed inputs.
14. [ ] Repeat with a second backend under a separately approved request budget; compare accuracy and cost.
15. [ ] Test an excluded dependency, expecting no forbidden read or classifier dispatch.
16. [ ] Test stale source between selection and dispatch, expecting unavailable rather than false clear.
17. [ ] Test TypeScript imported-domain closure and a missing-context skip.
18. [ ] Test ambiguity when adjacent declarations overlap the selected line.
19. [ ] Test overlapping agent edits, revision freshness, and cancellation handling.
20. [ ] Measure review latency and model-request count with sanitized, repeatable receipts.
21. [ ] Exercise feedback delivery on a supported Codex/Claude/Pi runtime; distinguish offered from model-visible advice.
22. [ ] Compare repair-after-feedback with a control edit, including follow-up clear evidence.
23. [ ] Run Hapsland root `check:fast` plus focused consumers when its pinned source toolchain is available.
24. [ ] Use measured results to propose a small downstream GEV integration only if it improves a real review loop.

**Credits:** [dearlordylord](https://github.com/dearlordylord/hapsland) created Hapsland and its shipped review rules. The GEV-inspired scenario here is a downstream teaching/evaluation fixture; no rule accuracy is claimed.
