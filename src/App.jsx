import { useEffect, useState } from "react";
import { fetchProfile, GitHubError } from "./lib/github";
import { getRoast } from "./lib/roastClient";
import { heatColor } from "./lib/heat";
import { RoastCard } from "./components/RoastCard";

const SUGGESTIONS = ["torvalds", "gaearon", "myanptl", "sindresorhus"];

/** Counts 0 → target with ease-out once active; snaps instantly for reduced motion. */
function useCountUp(target, active, duration = 1200) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!active) {
      setValue(0);
      return;
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setValue(target);
      return;
    }
    let raf;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(eased * target));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, active, duration]);
  return value;
}

export default function App() {
  const [username, setUsername] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | done | error
  const [profile, setProfile] = useState(null);
  const [roast, setRoast] = useState(null);
  const [error, setError] = useState("");
  const [heat, setHeat] = useState(0);

  async function runRoast(handle) {
    const name = (handle ?? username).trim();
    if (!name || status === "loading") return;

    setStatus("loading");
    setError("");
    setHeat(0);
    try {
      const p = await fetchProfile(name);
      const r = await getRoast(p);
      setProfile(p);
      setRoast(r);
      setStatus("done");
      requestAnimationFrame(() => requestAnimationFrame(() => setHeat(r.score)));
    } catch (err) {
      const message =
        err instanceof GitHubError ? err.message : "Something broke. Try again in a moment.";
      setError(message);
      setStatus("error");
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    runRoast();
  }

  function reset() {
    setStatus("idle");
    setProfile(null);
    setRoast(null);
    setError("");
  }

  const showForm = status === "idle" || status === "error" || status === "loading";
  const displayScore = useCountUp(roast?.score ?? 0, status === "done");

  return (
    <main className="stage wrap">
      <span className="brand"><span className="dot" /> RepoRoast</span>

      {showForm && (
        <section className="hero">
          <h1>
            Get your GitHub <span className="fire">roasted</span>.
          </h1>
          <p>An AI steps up to the mic, roasts your repos, then hypes you back up. Enter a username and take the heat.</p>

          <form className="roastform" onSubmit={handleSubmit}>
            <div className="field">
              <span className="at" aria-hidden="true">@</span>
              <label className="sr-only" htmlFor="gh">GitHub username</label>
              <input
                id="gh"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="github-username"
                autoComplete="off"
                autoCapitalize="off"
                spellCheck="false"
                disabled={status === "loading"}
              />
              <button type="submit" className="btn" disabled={status === "loading" || !username.trim()}>
                {status === "loading" ? "Roasting…" : "Roast me"}
              </button>
            </div>
          </form>

          {status !== "loading" && (
            <p className="suggest">
              or try{" "}
              {SUGGESTIONS.map((s, i) => (
                <span key={s}>
                  <button type="button" onClick={() => { setUsername(s); runRoast(s); }}>@{s}</button>
                  {i < SUGGESTIONS.length - 1 ? " · " : ""}
                </span>
              ))}
            </p>
          )}

          {error && <p className="err" role="alert">{error}</p>}
        </section>
      )}

      {status === "loading" && (
        <section className="warming" aria-live="polite">
          <div className="mic" aria-hidden="true">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="2" width="6" height="11" rx="3" />
              <path d="M5 10a7 7 0 0 0 14 0" />
              <line x1="12" y1="17" x2="12" y2="21" />
              <line x1="8" y1="21" x2="16" y2="21" />
            </svg>
          </div>
          <p>tapping the mic…</p>
        </section>
      )}

      {status === "done" && profile && roast && (
        <section className="reveal" aria-live="polite">
          <div className="who">
            <img src={profile.avatar} alt="" />
            <div>
              <div className="name">{profile.name}</div>
              <a className="handle" href={profile.url} target="_blank" rel="noopener noreferrer">
                @{profile.username}
              </a>
            </div>
          </div>

          <div className="panel roast">
            <span className="tag">The roast</span>
            <p>{roast.roast}</p>
          </div>

          <div className="panel">
            <div className="meter">
              <div className="row">
                <span className="label">Roast heat</span>
                <span
                  className={`val${roast.score >= 70 ? " val-scorching" : ""}`}
                  style={{ color: heatColor(displayScore) }}
                >
                  {displayScore}<span style={{ color: "var(--faint)", fontSize: "1rem" }}>/100</span>
                </span>
              </div>
              <div className="track">
                <div
                  className="fill"
                  style={{
                    width: `${heat}%`,
                    background: `linear-gradient(90deg, var(--gold), ${heatColor(roast.score)})`,
                  }}
                />
              </div>
              <span className="verdict">verdict: {roast.verdict}</span>
            </div>
          </div>

          <div className="panel hype">
            <span className="tag">The save</span>
            <p>{roast.hype}</p>
          </div>

          <div className="evidence">
            <span className="chip"><b>{profile.ownedCount}</b> repos</span>
            <span className="chip"><b>{profile.totalStars}</b> stars</span>
            <span className="chip"><b>{profile.followers}</b> followers</span>
            {profile.topLangs[0] && <span className="chip">mostly <b>{profile.topLangs[0].name}</b></span>}
            <span className="chip"><b>{profile.daysSincePush}</b>d since last push</span>
          </div>

          <RoastCard profile={profile} roast={roast} />

          <div className="actions">
            <button type="button" className="btn ghost" onClick={reset}>Roast someone else</button>
          </div>
        </section>
      )}

      <footer className="foot">
        Built by <a href="https://myan-portfolio.vercel.app" target="_blank" rel="noopener noreferrer">Myan Patel</a>{" "}
        · roasts are AI comedy, not code review · no login, nothing stored
      </footer>
    </main>
  );
}
