/** Coordinates can be independently absent, admitting half a location. */
export type LooseHazardLocation = {
  incidentId: string
  latitude?: number
  longitude?: number
}
