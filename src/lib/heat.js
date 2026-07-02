/** Score → display color: gold simmer, orange sizzle, red scorch. */
export function heatColor(score) {
  if (score >= 70) return "#ff5340";
  if (score >= 45) return "#f0813a";
  return "var(--gold)";
}
