import test from "node:test"
import assert from "node:assert/strict"
import { describeHazardLocation, routeAlertCount, describeAssignment } from "../dist/semantic-decisions.js"

test("unknown location stays explicitly unverified", () => {
  assert.equal(describeHazardLocation({ incidentId: "INC-3", kind: "unknown" }), "LOCATION UNVERIFIED INC-3")
})

test("known location presents the correlated pair", () => {
  assert.equal(
    describeHazardLocation({
      incidentId: "INC-3",
      kind: "located",
      position: { latitude: 40.1, longitude: -87.6 }
    }),
    "LOCATION INC-3: 40.1, -87.6"
  )
})

test("empty alerts are explicit", () => {
  assert.equal(routeAlertCount({ routeId: "RT-3", alerts: [] }), 0)
  assert.equal(routeAlertCount({ routeId: "RT-3", alerts: ["FLOOD"] }), 1)
})

test("assignment displays separately branded identities", () => {
  // At runtime these are strings; branding is a compile-time constraint, not validation.
  assert.equal(
    describeAssignment({ evacueeId: "EVAC-1", vehicleId: "VEH-7" }),
    "ASSIGN EVAC-1 -> VEH-7"
  )
})
