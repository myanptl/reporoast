import { describe, test, expect, vi } from 'vitest'
import { fetchProfile, GitHubError } from '../src/lib/github.js'

/**
 * fetchProfile validates the username before it touches the network, which is
 * the part worth testing: it keeps malformed input from becoming a wasted
 * request against an unauthenticated (rate-limited) endpoint.
 *
 * Only the reject path is exercised, so these tests never hit api.github.com.
 * fetch is stubbed to throw so an escaped request fails loudly rather than
 * silently going out.
 */
describe('fetchProfile username validation', () => {
  const noNetwork = vi.fn(() => {
    throw new Error('fetch should not be called for an invalid username')
  })

  test.each([
    ['empty', ''],
    ['only whitespace', '   '],
    ['leading hyphen', '-myanptl'],
    ['trailing hyphen', 'myanptl-'],
    ['double hyphen', 'my--anptl'],
    ['contains a space', 'myan ptl'],
    ['illegal character', 'myan_ptl'],
    ['too long (40 chars)', 'a'.repeat(40)],
  ])('rejects %s', async (_label, username) => {
    vi.stubGlobal('fetch', noNetwork)
    await expect(fetchProfile(username)).rejects.toThrow(GitHubError)
    expect(noNetwork).not.toHaveBeenCalled()
    vi.unstubAllGlobals()
  })

  test('rejection carries a 400 so the UI can tell it apart from a 404', async () => {
    vi.stubGlobal('fetch', noNetwork)
    await expect(fetchProfile('-nope')).rejects.toMatchObject({ status: 400 })
    vi.unstubAllGlobals()
  })

  test('a leading @ is stripped rather than rejected', async () => {
    // 39 chars is the documented GitHub maximum, so this is the longest legal
    // name; it must survive validation and reach the request stage.
    const reached = vi.fn(() => Promise.reject(new Error('reached network')))
    vi.stubGlobal('fetch', reached)
    await expect(fetchProfile('@myanptl')).rejects.toThrow('reached network')
    expect(reached).toHaveBeenCalled()
    vi.unstubAllGlobals()
  })
})
