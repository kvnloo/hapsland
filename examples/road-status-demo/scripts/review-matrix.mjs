import { spawnSync, execFileSync } from "node:child_process"
import { readFileSync, mkdirSync, writeFileSync } from "node:fs"
import { dirname, join, relative, resolve, sep } from "node:path"
import { fileURLToPath } from "node:url"

const demoRoot = fileURLToPath(new URL("..", import.meta.url))
const supportedRules = new Set([
  "meaningless_combinations",
  "split_correlations",
  "absence_confusion",
  "bare_domain_value"
])

export function loadCases(root = demoRoot) {
  const document = JSON.parse(readFileSync(join(root, "review-cases.json"), "utf8"))
  if (document.version !== 1 || !Array.isArray(document.cases)) throw new Error("Invalid review case manifest")

  const caseIds = new Set()
  const pairs = new Map()
  for (const entry of document.cases) {
    if (typeof entry.id !== "string" || !/^[a-z0-9-]+$/.test(entry.id) || caseIds.has(entry.id))
      throw new Error("Duplicate or invalid review case ID")
    caseIds.add(entry.id)
    if (!supportedRules.has(entry.ruleId)) throw new Error(`Unsupported rule for ${entry.id}`)
    if (typeof entry.path !== "string" || !/^src\/[a-z0-9-]+\.ts$/.test(entry.path))
      throw new Error(`Invalid source path for ${entry.id}`)
    if (!Number.isSafeInteger(entry.line) || entry.line < 1) throw new Error(`Invalid line for ${entry.id}`)
    if (typeof entry.declaration !== "string" || !/^[A-Za-z][A-Za-z0-9]*$/.test(entry.declaration))
      throw new Error(`Invalid declaration for ${entry.id}`)
    if (typeof entry.expectedFinding !== "boolean") throw new Error(`Invalid expected finding for ${entry.id}`)

    const lines = readFileSync(join(root, entry.path), "utf8").split(/\r?\n/)
    const declaration = lines[entry.line - 1]?.match(/^export (?:type|interface) ([A-Za-z][A-Za-z0-9]*)\b/)
    if (declaration?.[1] !== entry.declaration)
      throw new Error(`${entry.id}: line does not target the declared type ${entry.declaration}`)
    const pair = pairs.get(entry.ruleId) ?? new Set()
    pair.add(entry.expectedFinding)
    pairs.set(entry.ruleId, pair)
  }
  for (const ruleId of supportedRules) {
    const pair = pairs.get(ruleId)
    if (!pair?.has(true) || !pair.has(false)) throw new Error(`Rule ${ruleId} needs positive and negative cases`)
  }
  return document.cases
}

/** Fail closed: exit 0 only means a request evaluated, not that a rule found no problem. */
export function summarizeResult(entry, payload, exitCode) {
  const base = {
    id: entry.id,
    ruleId: entry.ruleId,
    expectedFinding: entry.expectedFinding
  }
  if (payload === null || typeof payload !== "object") return { ...base, status: "invalid-response", matched: false }
  if (payload.status !== "evaluated") {
    const status = payload.status === "skipped" || payload.status === "unavailable"
      ? payload.status
      : "invalid-response"
    return { ...base, status, matched: false }
  }
  if (exitCode !== 0 || !Number.isInteger(payload.classifierCalls) || payload.classifierCalls < 1)
    return { ...base, status: "invalid-response", matched: false }
  const results = Array.isArray(payload.results) ? payload.results : []
  const matchedRule = results.filter((result) => result.ruleId === entry.ruleId)
  if (
    results.length !== 1 || matchedRule.length !== 1 ||
    typeof matchedRule[0].finding !== "boolean" ||
    typeof matchedRule[0].probability !== "number" ||
    !Number.isFinite(matchedRule[0].probability) ||
    matchedRule[0].probability < 0 || matchedRule[0].probability > 1 ||
    typeof matchedRule[0].threshold !== "number" ||
    !Number.isFinite(matchedRule[0].threshold) ||
    matchedRule[0].threshold < 0 || matchedRule[0].threshold > 1 ||
    matchedRule[0].finding !== (matchedRule[0].probability > matchedRule[0].threshold)
  ) return { ...base, status: "invalid-response", matched: false }
  const { finding, probability, threshold } = matchedRule[0]
  return {
    ...base,
    status: "evaluated",
    matched: finding === entry.expectedFinding,
    observedFinding: finding,
    probability,
    threshold
  }
}

const rootDir = () => execFileSync("git", ["rev-parse", "--show-toplevel"], {
  cwd: demoRoot, encoding: "utf8", timeout: 5000
}).trim()

export function parseArguments(args) {
  const selected = { live: false, caseId: undefined, ruleId: undefined, output: undefined }
  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if (arg === "--live") selected.live = true
    else if ((arg === "--case" || arg === "--rule" || arg === "--output") && args[i + 1]) {
      if (arg === "--case") selected.caseId = args[++i]
      else if (arg === "--rule") selected.ruleId = args[++i]
      else selected.output = resolve(args[++i])
    } else throw new Error(`Unknown or incomplete argument: ${arg}`)
  }
  return selected
}

export function run(args = process.argv.slice(2)) {
  const options = parseArguments(args)
  const root = rootDir()
  const demoRelative = relative(root, demoRoot).split(sep).join("/")
  if (demoRelative.startsWith("..") || resolve(root, demoRelative) !== resolve(demoRoot))
    throw new Error("Demo must be inside a Git working tree")
  const entries = loadCases().filter((entry) =>
    (options.caseId === undefined || entry.id === options.caseId) &&
    (options.ruleId === undefined || entry.ruleId === options.ruleId)
  )
  if (entries.length === 0) throw new Error("No review cases match the selection")
  if (!options.live) {
    for (const entry of entries)
      console.log(`${entry.id}: ${entry.ruleId}; expected ${entry.expectedFinding ? "FINDING" : "clear"} (unverified)`)
    console.log("Preview only. Add --live to send selected fixture code to the configured classifier.")
    return 0
  }

  console.error("Live review: selected demo source and rule questions will be sent to your configured classifier.")
  const summary = []
  for (const entry of entries) {
    const path = [demoRelative, entry.path].filter(Boolean).join("/")
    const response = spawnSync("hapsland", [
      "rules", "check", "--path", path, "--line", String(entry.line),
      "--id", entry.ruleId, "--json"
    ], {
      cwd: root,
      encoding: "utf8",
      timeout: 90000,
      maxBuffer: 2 * 1024 * 1024
    })
    let payload = null
    try { payload = JSON.parse(response.stdout) } catch { /* Unavailable/malformed is never clear. */ }
    const item = summarizeResult(entry, payload, response.status)
    summary.push(item)
    console.log(`${entry.id}: ${item.status}${item.status === "evaluated" ? `; finding=${item.observedFinding}` : ""}; ${item.matched ? "MATCH" : "NOT VERIFIED"}`)
  }
  const report = {
    version: 1,
    date: new Date().toISOString(),
    note: "No source-bearing review inputs or outputs retained; outcomes are classifier observations, not correctness proofs.",
    total: summary.length,
    matched: summary.filter((result) => result.matched).length,
    results: summary
  }
  const output = options.output ?? join(root, ".test-runs", "hapsland-demo-review-summary.json")
  mkdirSync(dirname(output), { recursive: true })
  writeFileSync(output, JSON.stringify(report, null, 2) + "\n", { mode: 0o600 })
  console.log(`Sanitized summary: ${relative(root, output)}`)
  return report.matched === report.total ? 0 : 1
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { process.exitCode = run() } catch (error) {
    console.error(`Review demo setup error: ${error.message}`)
    process.exitCode = 2
  }
}
