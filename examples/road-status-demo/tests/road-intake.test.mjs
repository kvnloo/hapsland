import test from "node:test"
import assert from "node:assert/strict"
import { parseRoadObservation } from "../dist/road-intake.js"

const NOW = 1_800_000_000_000
const OPEN = { roadId: "HWY-9", status: "open", etaMinutes: 9, observedAtMs: NOW }
const BLOCKED = { roadId: "BR-4", status: "blocked", blockedReason: "flood", observedAtMs: NOW }

test("corrected open-road snapshot passes validation as candidate data", () => {
  assert.deepEqual(parseRoadObservation(OPEN, NOW), {
    kind: "accepted", road: { roadId: "HWY-9", status: "open", etaMinutes: 9 }
  })
})

test("blocked-road snapshot is preserved as blocked", () => {
  assert.deepEqual(parseRoadObservation(BLOCKED, NOW), {
    kind: "accepted", road: { roadId: "BR-4", status: "blocked", blockedReason: "flood" }
  })
})

test("road snapshot has a bounded age; exact boundary is accepted", () => {
  assert.equal(parseRoadObservation({ ...OPEN, observedAtMs: NOW - 300_000 }, NOW).kind, "accepted")
  assert.deepEqual(parseRoadObservation({ ...OPEN, observedAtMs: NOW - 300_001 }, NOW), {
    kind: "quarantined", reason: "stale"
  })
})

test("a future observation is quarantined independently of its status", () => {
  assert.deepEqual(parseRoadObservation({ ...BLOCKED, observedAtMs: NOW + 1 }, NOW), {
    kind: "quarantined", reason: "future-timestamp"
  })
})

test("contradictory, missing, and malformed observations are quarantined", () => {
  const invalid = [
    null, [], "road", {},
    { ...OPEN, status: "blocked" },
    { ...BLOCKED, etaMinutes: 9 },
    { ...OPEN, blockedReason: "flood" },
    { ...OPEN, etaMinutes: -1 },
    { ...OPEN, etaMinutes: 1.25 },
    { ...OPEN, etaMinutes: Infinity },
    { ...OPEN, etaMinutes: 1441 },
    { ...OPEN, roadId: "  " },
    { ...OPEN, roadId: "a".repeat(129) },
    { ...OPEN, observedAtMs: null },
    { ...OPEN, observedAtMs: -1 },
    { ...OPEN, status: "unknown" },
    { ...BLOCKED, blockedReason: "earthquake" },
    { ...OPEN, unrecognizedField: true },
    Object.assign(Object.create(null), { ...OPEN, notAllowed: "surprise" })
  ]
  for (const value of invalid) assert.deepEqual(parseRoadObservation(value, NOW), {
    kind: "quarantined", reason: "invalid-payload"
  })
})

test("invalid clock arguments are programmer errors, not a valid snapshot", () => {
  for (const now of [-1, NaN, Infinity, 2.4]) assert.throws(() => parseRoadObservation(OPEN, now), RangeError)
})

test("accepted road data is copied; mutating source cannot mutate the result", () => {
  const wire = { ...OPEN }
  const result = parseRoadObservation(wire, NOW)
  wire.roadId = "MUTATED"
  assert.equal(result.kind, "accepted")
  if (result.kind === "accepted") assert.equal(result.road.roadId, "HWY-9")
})
