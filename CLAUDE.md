# RepoRoast — Claude Code Config

AI that roasts a GitHub profile and generates a shareable card. Fun/viral project.
Live: reporoast-alpha.vercel.app

## Stack
- React 18 + Vite (JS, ESM — `"type": "module"`)
- `html-to-image` for the shareable roast card
- Serverless API: `api/roast.js` (Vercel function — GitHub data + LLM roast)
- Lint: **oxlint** (zero-config, fast)

## Layout
- `src/` — React app (roast UI + card)
- `api/roast.js` — serverless roast endpoint
- `scripts/` — build/util scripts
- `public/`, `dist/` — static + build output

## Commands
```bash
npm run dev      # vite dev server
npm run build    # vite build → dist/
npm run lint     # oxlint
npm run preview  # preview production build
```

## Conventions
- Immutable state updates; small focused components (see global coding-style rules).
- Keep the roast tone edgy but never cruel, discriminatory, or harmful — humor, not harassment.
- Never commit secrets. The LLM/API key belongs in Vercel env vars, not the client bundle.
- Validate the GitHub username input before hitting the API.

## Deploy
Vercel (CLI: `vercel --prod`). Push source with `git add -A && git commit -m "..." && git push origin main`.

## Tooling available
- MCP `context7` (global) — pull live React/Vite docs before writing code.
- Project agent `roast-reviewer` — review roast quality/safety + card rendering.
- Global agents: `react-reviewer`, `security-reviewer` (run before deploy).
