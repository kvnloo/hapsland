import test from "node:test"
import assert from "node:assert/strict"
import { elapsedSinceObserved as implicitClock } from "../dist/implicit-clock.js"
import { elapsedSinceObserved as explicitClock } from "../dist/explicit-clock.js"

test("an implicit clock changes output without a signature change", () => {
  const original = Date.now
  try {
    Date.now = () => 1000
    const before = implicitClock(100)
    Date.now = () => 3000
    const after = implicitClock(100)
    assert.equal(before, 900)
    assert.equal(after, 2900)
  } finally {
    Date.now = original
  }
})

test("an explicit clock makes identical input reproducible", () => {
  assert.equal(explicitClock(100, 1000), 900)
  assert.equal(explicitClock(100, 1000), 900)
  assert.equal(explicitClock(100, 3000), 2900)
})
