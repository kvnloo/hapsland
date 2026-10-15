import type { HazardLocation } from "./hazard-location.js"
import type { RouteAlerts } from "./route-alerts.js"
import type { EvacuationAssignment } from "./evacuation-assignment.js"

export function describeHazardLocation(location: HazardLocation): string {
  if (location.kind === "unknown") return `LOCATION UNVERIFIED ${location.incidentId}`
  return `LOCATION ${location.incidentId}: ${location.position.latitude}, ${location.position.longitude}`
}

export function routeAlertCount(route: RouteAlerts): number {
  return route.alerts.length
}

export function describeAssignment(assignment: EvacuationAssignment): string {
  return `ASSIGN ${assignment.evacueeId} -> ${assignment.vehicleId}`
}
