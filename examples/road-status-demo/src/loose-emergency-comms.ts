/** The callable names an outbound effect but no channel is declared. */
export type LooseEmergencyComms = {
  sendAlert(alert: string): void
}
