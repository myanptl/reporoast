// Calls the /api/roast serverless function. In local dev (no function running),
// it falls back to a deterministic mock so the UI is fully testable without keys.

export async function getRoast(profile) {
  try {
    const res = await fetch("/api/roast", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profile }),
    });
    if (res.ok) return await res.json();
    // Non-OK from a real function: surface a friendly error.
    if (res.status !== 404) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || "The comedian choked. Try again.");
    }
    // 404 => function not deployed (local vite dev). Fall through to mock.
  } catch (err) {
    if (err instanceof TypeError) {
      // network/function unavailable in dev — use mock
    } else {
      throw err;
    }
  }
  return mockRoast(profile);
}

// Local-only fallback so `npm run dev` works with no backend.
function mockRoast(p) {
  const lang = p.topLangs[0]?.name || "whitespace";
  const score = Math.min(98, 30 + p.reposWithNoDescription * 5 + Math.min(40, p.daysSincePush));
  return {
    roast:
      `${p.ownedCount} public repos and ${p.reposWithNoDescription} of them have no description — ` +
      `bold of you to assume anyone can read your mind in ${lang}. ` +
      `Last push was ${p.daysSincePush} days ago; the commits are giving "New Year's resolution."`,
    hype:
      `Real talk: shipping ${p.ownedCount} public repos is ${p.ownedCount} more than most people ever will. ` +
      `${p.totalStars} stars means someone out there is rooting for you. Keep building loud.`,
    score,
    verdict: score > 70 ? "Extra crispy" : score > 45 ? "Medium-well" : "Lightly toasted",
    _mock: true,
  };
}
