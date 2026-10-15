import type { RoadState } from "./tagged-road-state.js"

export function decideRoadUse(road: RoadState): string {
  if (road.status === "open") {
    return `DISPATCH ${road.roadId}: ETA ${road.etaMinutes} min`
  }
  return `REROUTE ${road.roadId}: blocked by ${road.blockedReason}`
}
