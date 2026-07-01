import { useRef, useState } from "react";
import { toPng } from "html-to-image";
import "./roast-card.css";

/**
 * The shareable artifact: a compact roast card the user can download or share.
 * @param {{ profile: object, roast: object }} props
 */
export function RoastCard({ profile, roast }) {
  const cardRef = useRef(null);
  const [busy, setBusy] = useState(false);

  async function download() {
    if (!cardRef.current) return;
    setBusy(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: "#17121f",
      });
      const link = document.createElement("a");
      link.download = `reporoast-${profile.username}.png`;
      link.href = dataUrl;
      link.click();
    } finally {
      setBusy(false);
    }
  }

  const shareText = `I got my GitHub roasted 🔥 @${profile.username} scored ${roast.score}/100 — "${roast.verdict}". Roast yours:`;
  const shareUrl = "https://reporoast.vercel.app";

  async function share() {
    if (navigator.share) {
      try {
        await navigator.share({ title: "RepoRoast", text: shareText, url: shareUrl });
        return;
      } catch {
        /* user dismissed — fall through to X intent */
      }
    }
    const intent = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(intent, "_blank", "noopener,noreferrer");
  }

  return (
    <>
      <div className="card" ref={cardRef}>
        <div className="card-top">
          <img src={profile.avatar} alt="" crossOrigin="anonymous" />
          <div>
            <div className="card-name">{profile.name}</div>
            <div className="card-handle mono">@{profile.username}</div>
          </div>
          <div className="card-brand mono">
            <span className="flame">🔥</span> RepoRoast
          </div>
        </div>

        <p className="card-roast">“{roast.roast}”</p>

        <div className="card-foot">
          <div className="card-score">
            <span className="mono card-score-label">HEAT</span>
            <span className="card-score-val">{roast.score}</span>
          </div>
          <div className="card-verdict mono">{roast.verdict}</div>
        </div>
      </div>

      <div className="actions">
        <button type="button" className="btn" onClick={share}>
          Share the heat
        </button>
        <button type="button" className="btn ghost" onClick={download} disabled={busy}>
          {busy ? "Rendering…" : "Download card"}
        </button>
      </div>
    </>
  );
}
