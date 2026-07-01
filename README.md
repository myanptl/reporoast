# 🔥 RepoRoast

An AI steps up to the mic, roasts your GitHub, then hypes you back up. Enter a username → get a savage-but-kind roast, a 0–100 heat score, and a shareable card. No login, nothing stored.

**Live:** https://reporoast.vercel.app · Built by [Myan Patel](https://myan-portfolio.vercel.app)

## How it works

1. Fetches public GitHub data client-side (repos, stars, languages, staleness).
2. A Vercel serverless function (`/api/roast`) sends a compact profile summary to **Claude Haiku**, which returns a structured roast + hype + score.
3. The result renders as a spotlight-styled reveal + a downloadable/shareable **Roast Card**.

## Stack

React 19 + Vite · Vercel serverless function · Anthropic Claude API · `html-to-image` for the share card. No database — nothing is persisted.

## Local dev

```bash
npm install
npm run dev          # UI runs with a local mock roast (no key needed)
```

The `/api/roast` function prefers `ANTHROPIC_API_KEY`; with no key it falls back to a local **Ollama** model (`qwen2.5-coder:3b`) so you can test the real pipeline offline:

```bash
node scripts/test-roast.mjs <github-username>   # end-to-end roast via Ollama
```

## Deploy (Vercel)

1. Import the repo in Vercel (auto-detects Vite + `/api`).
2. Add env var **`ANTHROPIC_API_KEY`** (Project → Settings → Environment Variables).
3. Deploy. That's it.

## Notes

Roasts are AI comedy, not code review. The prompt punches at *habits* (missing READMEs, abandoned repos, one-language-forever), never at people.
