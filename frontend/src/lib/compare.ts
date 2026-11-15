import type { CalendarCell, Sensor, WeeklyRecord } from "./types";

/** Same ISO-week median across other years with detections for this sensor. */
export function sameWeekMedian(
  weeks: WeeklyRecord[],
  sensor: Sensor,
  week: number,
  excludeYear: number,
): number | null {
  const values = weeks
    .filter(
      (r) =>
        r.sensor === sensor && r.week === week && r.year !== excludeYear,
    )
    .map((r) => r.count)
    .sort((a, b) => a - b);
  if (!values.length) return null;
  const mid = Math.floor(values.length / 2);
  return values.length % 2
    ? values[mid]
    : (values[mid - 1] + values[mid]) / 2;
}

export function weekComparison(
  cell: CalendarCell,
  weeks: WeeklyRecord[],
): {
  usual: number | null;
  deltaPct: number | null;
  label: string | null;
} {
  if (cell.count === null) {
    return { usual: null, deltaPct: null, label: null };
  }
  const usual = sameWeekMedian(weeks, cell.sensor, cell.week, cell.year);
  if (usual === null || usual === 0) {
    return { usual, deltaPct: null, label: null };
  }
  const deltaPct = ((cell.count - usual) / usual) * 100;
  const label =
    deltaPct >= 20
      ? "More activity than usual"
      : deltaPct <= -20
        ? "Less activity than usual"
        : "Near typical for this week";
  return { usual, deltaPct, label };
}

export function formatWeekRange(cell: CalendarCell): string {
  if (!cell.monday || !cell.sunday) return `ISO week ${cell.week}, ${cell.year}`;
  const fmt = (iso: string) => {
    const d = new Date(`${iso}T00:00:00Z`);
    return d.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    });
  };
  return `${fmt(cell.monday)} – ${fmt(cell.sunday)}`;
}
