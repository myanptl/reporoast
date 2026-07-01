// Local end-to-end sanity check: fetch a real GitHub profile and roast it via Ollama.
// Usage: node scripts/test-roast.mjs <github-username>
// Proves the profile → prompt → LLM → JSON pipeline works without any cloud key.

const username = process.argv[2] || "myanptl";
const OLLAMA = "http://127.0.0.1:11434/api/chat";
const MODEL = "qwen2.5-coder:3b";

const SYSTEM = `You are the host of a developer roast battle. Given a GitHub profile summary, write a short, funny, savage-but-kind roast, then flip to a genuine hype-up. Punch at habits (no READMEs, abandoned repos, one language forever), never at protected characteristics. PG-13. Then rate roastability 0-100 and give a 1-2 word verdict. Respond ONLY with minified JSON: {"roast":"...","hype":"...","score":<int>,"verdict":"..."}`;

async function gh(path) {
  const r = await fetch(`https://api.github.com${path}`, {
    headers: { Accept: "application/vnd.github+json" },
  });
  if (!r.ok) throw new Error(`GitHub ${r.status} for ${path}`);
  return r.json();
}

const user = await gh(`/users/${username}`);
const repos = await gh(`/users/${username}/repos?per_page=100&sort=pushed`);
const owned = repos.filter((r) => !r.fork);
const noDesc = owned.filter((r) => !r.description).length;
const stars = owned.reduce((s, r) => s + r.stargazers_count, 0);
const langs = {};
for (const r of owned) if (r.language) langs[r.language] = (langs[r.language] || 0) + 1;
const topLangs = Object.entries(langs).sort((a, b) => b[1] - a[1]).slice(0, 5);
const days = Math.round((Date.now() - new Date(owned[0]?.pushed_at || user.updated_at)) / 86400000);

const prompt = `Roast this GitHub profile:
handle: @${user.login}
name: ${user.name || user.login}
bio: ${user.bio || "(none)"}
public repos owned: ${owned.length}
total stars: ${stars}
repos with NO description: ${noDesc}
days since last push: ${days}
top languages: ${topLangs.map(([n, c]) => `${n}(${c})`).join(", ") || "none"}`;

console.log(`\n→ Roasting @${username} (${owned.length} repos, ${stars}★, ${noDesc} undocumented)\n`);

const res = await fetch(OLLAMA, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    model: MODEL,
    stream: false,
    format: "json",
    messages: [
      { role: "system", content: SYSTEM },
      { role: "user", content: prompt },
    ],
  }),
});
const data = await res.json();
const parsed = JSON.parse(data.message.content);
console.log("🔥 ROAST:", parsed.roast);
console.log("💜 HYPE :", parsed.hype);
console.log("📊 SCORE:", parsed.score, "—", parsed.verdict);
console.log("\n✓ Pipeline works end-to-end (profile → LLM → structured roast).\n");
