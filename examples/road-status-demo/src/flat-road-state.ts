export type RoadState = {
  roadId: string
  status: "open" | "blocked"
  etaMinutes?: number
  blockedReason?: "flood" | "fire" | "debris"
}
