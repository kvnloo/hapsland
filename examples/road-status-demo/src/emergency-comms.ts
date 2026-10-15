/** The channel used by the outbound effect is a declared input. */
export type AlertChannel = { readonly channelId: string }
export type EmergencyComms = {
  sendAlert(channel: AlertChannel, alert: string): void
}
