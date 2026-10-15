import test from "node:test"
import assert from "node:assert/strict"
import { decideRoadUse } from "../dist/route-decision.js"

test("open road is dispatchable", () => {
  assert.equal(
    decideRoadUse({ roadId: "HIGHWAY-9", status: "open", etaMinutes: 8 }),
    "DISPATCH HIGHWAY-9: ETA 8 min"
  )
})

test("blocked road is rerouted", () => {
  assert.equal(
    decideRoadUse({ roadId: "BRIDGE-4", status: "blocked", blockedReason: "flood" }),
    "REROUTE BRIDGE-4: blocked by flood"
  )
})
