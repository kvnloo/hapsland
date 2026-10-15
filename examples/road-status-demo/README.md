# Hapsland road-state review demo

**Purpose:** Demonstrate a semantic type-design defect and its repair using Hapsland's built-in `meaningless_combinations` rule.
**Status:** Runnable example; live classifier results not yet established.
**Authority:** Illustrative example, not an accepted product contract or validation of real-world road safety.
**Expected use:** Run offline TypeScript checks, then optionally compare two one-off Hapsland rule reviews.
**Lifecycle:** Keep commands aligned with the Hapsland CLI and shipped rule; review when the direct-rule-check API or TypeScript support changes.

This small, **GEV-inspired** disaster-routing example is not production GEV code. It demonstrates a design bug that TypeScript accepts: a blocked road report can carry an ETA meant only for open roads. The corrected model is a discriminated union.

## Run the offline demo

From **this fork's root**:

```sh
npm --prefix examples/road-status-demo install --ignore-scripts
npm --prefix examples/road-status-demo test
npm --prefix examples/road-status-demo run demo
```

The example has its own pinned TypeScript dependency and does not build Hapsland. Four `@ts-expect-error` assertions in `src/type-contract.ts` check that the corrected type rejects invalid combinations; two runtime tests check dispatch and reroute behavior.

## Compare real Hapsland reviews (optional)

From **the same fork root**, with an installed Hapsland CLI and your own authorized review-backend credentials:

```sh
bash examples/road-status-demo/scripts/hapsland-review.sh
```

The script reviews each type using the shipped `meaningless_combinations` rule.

| Declaration | Hypothesis | Reason |
| --- | --- | --- |
| `src/flat-road-state.ts` | Finding | `status` and conditional fields are independently settable. |
| `src/tagged-road-state.ts` | Clear | A discriminated union restricts fields to meaningful variants. |

These are **hypotheses, not observed classifier outcomes**. Each direct check sends selected source and eligible related code to the configured external classifier and may incur charges. A skipped or unavailable review does not count as clear, and exit code 0 can include a finding. Agent hooks are not required.

The fork's existing root `.hapsland.jsonc` enables this shipped rule and includes these source files. This demo does not modify that config. Hapsland reads project configuration from the canonical **Git root**, not from nested example directories.

Standalone Hapsland releases currently target macOS arm64 and Linux arm64. Live checks also require credentials. Keep credentials outside source control and chat.

**Credit:** Hapsland is by [dearlordylord](https://github.com/dearlordylord/hapsland); the road-state scenario and demo source are original teaching material.

**Scope:** Static representation safety is not proof that a road is actually safe. Real routing requires timestamped, trustworthy hazard evidence, freshness limits, and human validation.
