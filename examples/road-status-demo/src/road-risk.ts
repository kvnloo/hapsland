/** The domain allows exactly three named bands in this demonstration. */
export type RoadRisk = {
  roadId: string
  riskBand: "low" | "moderate" | "high"
}
