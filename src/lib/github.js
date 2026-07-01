// Fetch public GitHub data client-side (api.github.com supports CORS for public reads).
// No token needed for the MVP; unauthenticated reads are rate-limited but fine for casual use.

const API = "https://api.github.com";

export class GitHubError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "GitHubError";
    this.status = status;
  }
}

async function get(path) {
  const res = await fetch(`${API}${path}`, {
    headers: { Accept: "application/vnd.github+json" },
  });
  if (res.status === 404) throw new GitHubError("No GitHub user with that name.", 404);
  if (res.status === 403) throw new GitHubError("GitHub rate limit hit — give it a minute.", 403);
  if (!res.ok) throw new GitHubError("GitHub is being difficult right now.", res.status);
  return res.json();
}

/**
 * Returns a compact, roast-ready summary of a public GitHub profile.
 * @param {string} username
 */
export async function fetchProfile(username) {
  const clean = username.trim().replace(/^@/, "");
  if (!/^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i.test(clean)) {
    throw new GitHubError("That doesn't look like a GitHub username.", 400);
  }

  const user = await get(`/users/${clean}`);
  const repos = await get(`/users/${clean}/repos?per_page=100&sort=pushed`);

  const owned = repos.filter((r) => !r.fork);
  const langs = {};
  let stars = 0;
  let forks = 0;
  let hasDescription = 0;
  for (const r of owned) {
    stars += r.stargazers_count;
    forks += r.forks_count;
    if (r.language) langs[r.language] = (langs[r.language] || 0) + 1;
    if (r.description) hasDescription += 1;
  }

  const topLangs = Object.entries(langs)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));

  const topRepos = [...owned]
    .sort((a, b) => b.stargazers_count - a.stargazers_count)
    .slice(0, 6)
    .map((r) => ({
      name: r.name,
      stars: r.stargazers_count,
      language: r.language,
      description: r.description,
      pushedAt: r.pushed_at,
    }));

  const lastPush = owned[0]?.pushed_at ?? user.updated_at;
  const daysSincePush = Math.max(
    0,
    Math.round((Date.now() - new Date(lastPush).getTime()) / 86_400_000),
  );

  return {
    username: user.login,
    name: user.name || user.login,
    avatar: user.avatar_url,
    bio: user.bio,
    url: user.html_url,
    createdAt: user.created_at,
    accountAgeYears: Math.floor((Date.now() - new Date(user.created_at).getTime()) / 31_536_000_000),
    followers: user.followers,
    following: user.following,
    publicRepos: user.public_repos,
    ownedCount: owned.length,
    forkCount: repos.length - owned.length,
    totalStars: stars,
    totalForks: forks,
    reposWithNoDescription: owned.length - hasDescription,
    topLangs,
    topRepos,
    daysSincePush,
  };
}
