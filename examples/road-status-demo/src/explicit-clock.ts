/** Caller supplies the snapshot clock, making calculations reproducible. */
export function elapsedSinceObserved(observedAtMs: number, nowMs: number): number {
  return nowMs - observedAtMs
}
