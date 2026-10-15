import type { RoadState as FlatRoadState } from "./flat-road-state.js"
import type { RoadState as TaggedRoadState } from "./tagged-road-state.js"

// Counterexample intentionally compiles with the flat model.
export const contradictionAllowed: FlatRoadState = {
  roadId: "BRIDGE-4",
  status: "blocked",
  etaMinutes: 6
}

// These compile-time assertions fail if the tagged model stops preventing them.
// @ts-expect-error A blocked road cannot carry an open-road ETA.
export const blockedWithEta: TaggedRoadState = {
  roadId: "BRIDGE-4",
  status: "blocked",
  blockedReason: "flood",
  etaMinutes: 6
}

export const openWithBlockReason: TaggedRoadState = {
  roadId: "HIGHWAY-9",
  status: "open",
  etaMinutes: 8,
  // @ts-expect-error An open road cannot carry a blocked reason.
  blockedReason: "fire"
}

// @ts-expect-error Open roads require an ETA.
export const openWithoutEta: TaggedRoadState = {
  roadId: "HIGHWAY-9",
  status: "open"
}

// @ts-expect-error Blocked roads require a reason.
export const blockedWithoutReason: TaggedRoadState = {
  roadId: "BRIDGE-4",
  status: "blocked"
}
