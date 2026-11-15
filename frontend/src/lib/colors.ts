/** Figma Fire calendar intensity bins (estimates / week). */
export const ACTIVITY_BINS = [
  { max: 49, label: "1–49", color: "#f3e7a8" },
  { max: 99, label: "50–99", color: "#efbf45" },
  { max: 199, label: "100–199", color: "#e07a2a" },
  { max: Infinity, label: "≥200", color: "#b52f16" },
] as const;

export const GAP_COLOR = "#d7ddd6";
export const ZERO_COLOR = "#eef3ea";

export function activityColor(count: number | null): string {
  if (count === null) return GAP_COLOR;
  if (count <= 0) return ZERO_COLOR;
  for (const bin of ACTIVITY_BINS) {
    if (count <= bin.max) return bin.color;
  }
  return ACTIVITY_BINS[ACTIVITY_BINS.length - 1].color;
}
