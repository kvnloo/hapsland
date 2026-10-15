import test from "node:test"
import assert from "node:assert/strict"
import { execFileSync, spawnSync } from "node:child_process"
import { mkdtempSync, readFileSync, rmSync, writeFileSync, chmodSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, delimiter } from "node:path"
import { loadCases, summarizeResult, parseArguments } from "../scripts/review-matrix.mjs"

const entry = { id: "bad", ruleId: "meaningless_combinations", expectedFinding: true }
const evaluated = (probability, threshold = 0.7) => ({
  status: "evaluated",
  classifierCalls: 1,
  results: [{ ruleId: entry.ruleId, probability, threshold, finding: probability > threshold }]
})

test("manifest targets eight declared types with two expectations per rule", () => {
  const cases = loadCases()
  assert.equal(cases.length, 8)
  for (const rule of new Set(cases.map((c) => c.ruleId))) {
    assert.deepEqual(new Set(cases.filter((c) => c.ruleId === rule).map((c) => c.expectedFinding)), new Set([true, false]))
  }
})

test("evaluated finding on exit zero is a match (not a CLI failure)", () => {
  assert.deepEqual(summarizeResult(entry, evaluated(0.91), 0), {
    ...entry, status: "evaluated", matched: true, observedFinding: true, probability: 0.91, threshold: 0.7
  })
})

test("classifier disagreement is not falsely reported as a pass", () => {
  assert.equal(summarizeResult(entry, evaluated(0.01), 0).matched, false)
})

test("unavailable, skipped and malformed responses are all failures", () => {
  for (const payload of [
    { status: "skipped", classifierCalls: 0, results: [] },
    { status: "unavailable", classifierCalls: 0, results: [] },
    null,
    { status: "evaluated", classifierCalls: 0, results: evaluated(0.9).results },
    { ...evaluated(0.9), results: [] },
    { ...evaluated(0.9), results: [{ ruleId: entry.ruleId, probability: 0.9, threshold: 0.7, finding: false }] }
  ]) assert.equal(summarizeResult(entry, payload, 0).matched, false)
})

test("nonzero CLI exits fail even if JSON claims an evaluated result", () => {
  assert.equal(summarizeResult(entry, evaluated(0.91), 6).matched, false)
})

test("preview never requires a live Hapsland executable", () => {
  const out = execFileSync(process.execPath, ["scripts/review-matrix.mjs", "--case", "road-invalid"], {
    encoding: "utf8", timeout: 5000
  })
  assert.match(out, /Preview only/)
  assert.match(out, /expected FINDING \(unverified\)/)
})

test("unknown or incomplete CLI arguments are rejected", () => {
  assert.throws(() => parseArguments(["--wrong"]))
  assert.throws(() => parseArguments(["--case"]))
})

// Mock only the executable boundary: no network, credentials, classifier, or source upload.
test("live runner checks real child-process output, saves only a sanitized summary", () => {
  const scratch = mkdtempSync(join(tmpdir(), "hapsland-review-demo-"))
  try {
    const executable = join(scratch, "hapsland")
    writeFileSync(executable, `#!/usr/bin/env node
const args = process.argv.slice(2)
const source = args[args.indexOf("--path") + 1]
const ruleId = args[args.indexOf("--id") + 1]
const finding = source.includes("loose") || source.includes("flat-")
process.stdout.write(JSON.stringify({
  status: "evaluated", classifierCalls: 1,
  input: { source: "SENTINEL_DO_NOT_SAVE_OR_PRINT" },
  results: [{ ruleId, probability: finding ? 0.93 : 0.1, threshold: 0.7, finding }]
}) + "\\n")
`)
    chmodSync(executable, 0o755)
    const output = join(scratch, "summary.json")
    const child = spawnSync(process.execPath, [
      "scripts/review-matrix.mjs", "--live", "--rule", "meaningless_combinations", "--output", output
    ], {
      encoding: "utf8", timeout: 15000,
      env: { ...process.env, PATH: `${scratch}${delimiter}${process.env.PATH}` }
    })
    assert.equal(child.status, 0, child.stderr)
    const report = JSON.parse(readFileSync(output, "utf8"))
    assert.equal(report.matched, 2)
    assert.equal(report.total, 2)
    assert.equal(report.results[0].status, "evaluated")
    assert.doesNotMatch(readFileSync(output, "utf8") + child.stdout, /SENTINEL_DO_NOT_SAVE_OR_PRINT/)
  } finally {
    rmSync(scratch, { recursive: true, force: true })
  }
})

test("live runner fails on a skipped review rather than reporting clear", () => {
  const scratch = mkdtempSync(join(tmpdir(), "hapsland-review-skip-"))
  try {
    const executable = join(scratch, "hapsland")
    writeFileSync(executable, `#!/usr/bin/env node
process.stdout.write(JSON.stringify({status: "skipped", classifierCalls: 0, results: []}) + "\\n")
process.exitCode = 6
`)
    chmodSync(executable, 0o755)
    const output = join(scratch, "summary.json")
    const child = spawnSync(process.execPath, [
      "scripts/review-matrix.mjs", "--live", "--case", "road-invalid", "--output", output
    ], {
      encoding: "utf8", timeout: 15000,
      env: { ...process.env, PATH: `${scratch}${delimiter}${process.env.PATH}` }
    })
    assert.equal(child.status, 1, child.stderr)
    const report = JSON.parse(readFileSync(output, "utf8"))
    assert.equal(report.matched, 0)
    assert.equal(report.results[0].status, "skipped")
  } finally {
    rmSync(scratch, { recursive: true, force: true })
  }
})
