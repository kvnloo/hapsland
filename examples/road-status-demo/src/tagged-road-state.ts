export type RoadState =
  | {
      roadId: string
      status: "open"
      etaMinutes: number
      blockedReason?: never
    }
  | {
      roadId: string
      status: "blocked"
      blockedReason: "flood" | "fire" | "debris"
      etaMinutes?: never
    }
