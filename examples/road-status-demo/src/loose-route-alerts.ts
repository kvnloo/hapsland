/** Both missing, null, and [] can mean there are no route alerts. */
export type LooseRouteAlerts = {
  routeId: string
  alerts?: string[] | null
}
