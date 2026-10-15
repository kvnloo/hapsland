/** Hidden ambient clock makes behavior depend on state absent from the signature. */
export function elapsedSinceObserved(observedAtMs: number): number {
  return Date.now() - observedAtMs
}
