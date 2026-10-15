import type { RoadState as FlatRoadState } from "./flat-road-state.js"
import type { RoadState as TaggedRoadState } from "./tagged-road-state.js"
import { decideRoadUse } from "./route-decision.js"

// TypeScript allows this contradictory state in the flat model.
const contradictory: FlatRoadState = {
  roadId: "BRIDGE-4",
  status: "blocked",
  etaMinutes: 6
}

const open: TaggedRoadState = {
  roadId: "HIGHWAY-9",
  status: "open",
  etaMinutes: 8
}
const blocked: TaggedRoadState = {
  roadId: "BRIDGE-4",
  status: "blocked",
  blockedReason: "flood"
}

console.log("FLAT MODEL ACCEPTS:", JSON.stringify(contradictory))
console.log("TAGGED MODEL:", decideRoadUse(open))
console.log("TAGGED MODEL:", decideRoadUse(blocked))
