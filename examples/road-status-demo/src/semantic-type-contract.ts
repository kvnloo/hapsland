import type { LooseHazardLocation } from "./loose-hazard-location.js"
import type { HazardLocation } from "./hazard-location.js"
import type { LooseRouteAlerts } from "./loose-route-alerts.js"
import type { RouteAlerts } from "./route-alerts.js"
import type { LooseEvacuationAssignment } from "./loose-evacuation-assignment.js"
import type { EvacuationAssignment, EvacueeId, VehicleId } from "./evacuation-assignment.js"

// These examples intentionally compile with the loose models.
export const halfPosition: LooseHazardLocation = { incidentId: "INC-3", latitude: 40.1 }
export const ambiguousAlerts: LooseRouteAlerts = { routeId: "RT-3", alerts: null }
export const swappedLooseIds: LooseEvacuationAssignment = { evacueeId: "VEH-7", vehicleId: "EVAC-1" }

// The corrected position model cannot represent half a point.
export const completePosition: HazardLocation = {
  incidentId: "INC-3",
  kind: "located",
  position: { latitude: 40.1, longitude: -87.6 }
}
export const unknownPosition: HazardLocation = { incidentId: "INC-3", kind: "unknown" }
export const incompletePosition: HazardLocation = {
  incidentId: "INC-3",
  kind: "located",
  // @ts-expect-error A known position always has two coordinates.
  position: { latitude: 40.1 }
}
export const bogusUnknownPosition: HazardLocation = {
  incidentId: "INC-3",
  kind: "unknown",
  // @ts-expect-error An unknown location must not carry arbitrary coordinates.
  position: { latitude: 40.1, longitude: -87.6 }
}

export const noAlerts: RouteAlerts = { routeId: "RT-3", alerts: [] }
// @ts-expect-error A route must explicitly provide its alerts, even if empty.
export const missingAlerts: RouteAlerts = { routeId: "RT-3" }
export const nullAlerts: RouteAlerts = {
  routeId: "RT-3",
  // @ts-expect-error Null is not an alternative empty collection.
  alerts: null
}

// Branded ID values must first be validated/created at a trust boundary.
declare const evacuee: EvacueeId
declare const vehicle: VehicleId
export const assigned: EvacuationAssignment = { evacueeId: evacuee, vehicleId: vehicle }
export const crossedAssignment: EvacuationAssignment = {
  // @ts-expect-error A vehicle identity cannot replace an evacuee identity.
  evacueeId: vehicle,
  // @ts-expect-error An evacuee identity cannot replace a vehicle identity.
  vehicleId: evacuee
}
