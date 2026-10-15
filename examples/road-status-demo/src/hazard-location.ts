/** Coordinates travel together, or the lack of a location is named. */
export type HazardLocation =
  | { incidentId: string; kind: "unknown" }
  | { incidentId: string; kind: "located"; position: { latitude: number; longitude: number } }
