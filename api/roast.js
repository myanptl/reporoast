// Vercel serverless function: turns a GitHub profile summary into a roast + hype.
// Prod: Anthropic Claude (needs ANTHROPIC_API_KEY). Local `vercel dev`: falls back to Ollama.

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-haiku-4-5";
const OLLAMA_URL = "http://127.0.0.1:11434/api/chat";
const OLLAMA_MODEL = "qwen2.5-coder:3b";

const SYSTEM = `You are the host of a developer roast battle. Given a GitHub profile summary, you write a short, funny, SAVAGE-BUT-KIND roast, then flip to a genuine hype-up. Punch at habits (no READMEs, abandoned repos, tutorial hell, one language forever), never at protected characteristics. Keep it clever, specific to the data, PG-13. Then rate how "roastable" the profile is from 0-100 and give a 1-2 word verdict.

Respond ONLY with minified JSON, no markdown, exactly this shape:
{"roast":"2-4 sentences","hype":"1-2 warm sentences","score":<0-100 integer>,"verdict":"1-2 words"}`;

function buildUserPrompt(p) {
  const langs = p.topLangs.map((l) => `${l.name}(${l.count})`).join(", ") || "none detected";
  const repos = p.topRepos
    .map((r) => `${r.name} [${r.stars}★${r.language ? ", " + r.language : ""}]${r.description ? ": " + r.description : " (no description)"}`)
    .join("; ");
  return `Roast this GitHub profile:
handle: @${p.username}
name: ${p.name}
bio: ${p.bio || "(none)"}
account age: ${p.accountAgeYears} years
followers: ${p.followers}, following: ${p.following}
public repos owned: ${p.ownedCount} (forks: ${p.forkCount})
total stars: ${p.totalStars}, total forks: ${p.totalForks}
repos with NO description: ${p.reposWithNoDescription}
days since last push: ${p.daysSincePush}
top languages: ${langs}
notable repos: ${repos || "none"}`;
}

function parseModelJson(text) {
  const cleaned = text.replace(/```json|```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("Model did not return JSON");
  const obj = JSON.parse(cleaned.slice(start, end + 1));
  return {
    roast: String(obj.roast || "").trim(),
    hype: String(obj.hype || "").trim(),
    score: Math.max(0, Math.min(100, Math.round(Number(obj.score) || 0))),
    verdict: String(obj.verdict || "Roasted").trim().slice(0, 24),
  };
}

async function callAnthropic(profile, apiKey) {
  const res = await fetch(ANTHROPIC_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 500,
      system: SYSTEM,
      messages: [{ role: "user", content: buildUserPrompt(profile) }],
    }),
  });
  if (!res.ok) throw new Error(`Anthropic ${res.status}`);
  const data = await res.json();
  return parseModelJson(data.content?.[0]?.text || "");
}

async function callOllama(profile) {
  const res = await fetch(OLLAMA_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      stream: false,
      format: "json",
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: buildUserPrompt(profile) },
      ],
    }),
  });
  if (!res.ok) throw new Error(`Ollama ${res.status}`);
  const data = await res.json();
  return parseModelJson(data.message?.content || "");
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  const profile = req.body?.profile;
  if (!profile || !profile.username) {
    res.status(400).json({ error: "Missing profile." });
    return;
  }

  try {
    const key = process.env.ANTHROPIC_API_KEY;
    const result = key ? await callAnthropic(profile, key) : await callOllama(profile);
    res.status(200).json(result);
  } catch (err) {
    res.status(502).json({ error: "The comedian lost their nerve. Try again in a sec." });
  }
}
