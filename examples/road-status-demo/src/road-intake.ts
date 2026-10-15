import type { RoadState } from "./tagged-road-state.js"

/** A bounded teaching fixture, not a production trust or road-safety decision. */
export type RoadIntake =
  | { kind: "accepted"; road: RoadState }
  | { kind: "quarantined"; reason: "invalid-payload" | "stale" | "future-timestamp" }

const MAX_AGE_MS = 5 * 60 * 1000
const VALID_KEYS = new Set(["roadId", "status", "etaMinutes", "blockedReason", "observedAtMs"])
const hasOwn = (record: Record<string, unknown>, key: string): boolean =>
  Object.prototype.hasOwnProperty.call(record, key)

function isRecord(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false
  const prototype: unknown = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}

function isBlockedReason(value: unknown): value is "flood" | "fire" | "debris" {
  return value === "flood" || value === "fire" || value === "debris"
}

/**
 * Converts untrusted JSON-shaped data to the corrected domain type.
 * Validation checks structure and age, not truthfulness or external hazard evidence.
 */
export function parseRoadObservation(value: unknown, nowMs: number): RoadIntake {
  if (!Number.isSafeInteger(nowMs) || nowMs < 0) throw new RangeError("nowMs must be a nonnegative integer")
  if (
    !isRecord(value) ||
    Object.keys(value).some((key) => !VALID_KEYS.has(key)) ||
    !hasOwn(value, "roadId") || !hasOwn(value, "status") || !hasOwn(value, "observedAtMs")
  ) return { kind: "quarantined", reason: "invalid-payload" }

  const roadId = typeof value.roadId === "string" ? value.roadId.trim() : ""
  if (roadId.length === 0 || roadId.length > 128 || !Number.isSafeInteger(value.observedAtMs))
    return { kind: "quarantined", reason: "invalid-payload" }
  const observedAtMs = value.observedAtMs as number
  if (observedAtMs < 0) return { kind: "quarantined", reason: "invalid-payload" }
  if (observedAtMs > nowMs) return { kind: "quarantined", reason: "future-timestamp" }
  if (nowMs - observedAtMs > MAX_AGE_MS) return { kind: "quarantined", reason: "stale" }

  if (value.status === "open") {
    if (
      hasOwn(value, "blockedReason") ||
      !hasOwn(value, "etaMinutes") ||
      !Number.isSafeInteger(value.etaMinutes) ||
      typeof value.etaMinutes !== "number" ||
      value.etaMinutes < 0 || value.etaMinutes > 1440
    ) return { kind: "quarantined", reason: "invalid-payload" }
    return { kind: "accepted", road: { roadId, status: "open", etaMinutes: value.etaMinutes } }
  }
  if (
    value.status === "blocked" && !hasOwn(value, "etaMinutes") &&
    hasOwn(value, "blockedReason") && isBlockedReason(value.blockedReason)
  ) {
    return { kind: "accepted", road: { roadId, status: "blocked", blockedReason: value.blockedReason } }
  }
  return { kind: "quarantined", reason: "invalid-payload" }
}
