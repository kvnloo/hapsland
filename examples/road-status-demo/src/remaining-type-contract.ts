import type { LooseRoadRisk } from "./loose-road-risk.js"
import type { RoadRisk } from "./road-risk.js"
import type { LooseEmergencyComms } from "./loose-emergency-comms.js"
import type { EmergencyComms } from "./emergency-comms.js"

export const invalidRiskAllowed: LooseRoadRisk = { roadId: "R-1", riskBand: "magenta" }
// @ts-expect-error Only low/moderate/high bands are valid in the corrected domain.
export const invalidRiskRejected: RoadRisk = { roadId: "R-1", riskBand: "magenta" }
export const validRisk: RoadRisk = { roadId: "R-1", riskBand: "high" }

export const looseMessenger: LooseEmergencyComms = { sendAlert: () => undefined }
export const explicitMessenger: EmergencyComms = { sendAlert: (_channel, _alert) => undefined }
// @ts-expect-error An explicit resource must be passed to send an alert.
explicitMessenger.sendAlert("FLOOD")
