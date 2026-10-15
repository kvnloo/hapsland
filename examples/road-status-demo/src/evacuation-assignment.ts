/** Distinct identity types prevent swapping evacuee and vehicle references. */
export type EvacueeId = string & { readonly __brand: "EvacueeId" }
export type VehicleId = string & { readonly __brand: "VehicleId" }

export type EvacuationAssignment = {
  evacueeId: EvacueeId
  vehicleId: VehicleId
}
