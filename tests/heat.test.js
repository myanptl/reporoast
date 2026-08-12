import { describe, test, expect } from 'vitest'
import { heatColor } from '../src/lib/heat.js'

/**
 * heatColor drives the whole visual payoff of a roast, and it is pure threshold
 * logic, so the thing worth pinning is the boundaries. Off-by-one here means a
 * 70 renders as "sizzle" instead of "scorch".
 */
describe('heatColor', () => {
  test.each([
    [100, '#ff5340'],
    [70, '#ff5340'], // inclusive lower bound of scorch
    [69, '#f0813a'],
    [45, '#f0813a'], // inclusive lower bound of sizzle
    [44, 'var(--gold)'],
    [0, 'var(--gold)'],
  ])('score %i maps to %s', (score, expected) => {
    expect(heatColor(score)).toBe(expected)
  })

  test('returns exactly three distinct colours across the range', () => {
    const seen = new Set(Array.from({ length: 101 }, (_, i) => heatColor(i)))
    expect(seen.size).toBe(3)
  })
})
