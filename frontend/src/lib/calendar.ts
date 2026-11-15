import type { CalendarCell, Sensor, WeeklyRecord } from "./types";

export function weekKey(year: number, week: number, sensor: Sensor): string {
  return `${year}-${week}-${sensor}`;
}

export function isoWeekBounds(
  year: number,
  week: number,
): { monday: string; sunday: string } | null {
  try {
    // Date.fromisocalendar equivalent via UTC Thursday trick
    const simple = new Date(Date.UTC(year, 0, 4));
    const day = simple.getUTCDay() || 7;
    simple.setUTCDate(simple.getUTCDate() - day + 1 + (week - 1) * 7);
    const sun = new Date(simple);
    sun.setUTCDate(simple.getUTCDate() + 6);
    return {
      monday: simple.toISOString().slice(0, 10),
      sunday: sun.toISOString().slice(0, 10),
    };
  } catch {
    return null;
  }
}

export function buildIndex(rows: WeeklyRecord[]): Map<string, WeeklyRecord> {
  const map = new Map<string, WeeklyRecord>();
  for (const row of rows) {
    map.set(weekKey(row.year, row.week, row.sensor), row);
  }
  return map;
}

export function buildMissingSet(
  missing: [number, number][],
): Set<string> {
  const set = new Set<string>();
  for (const [y, w] of missing) set.add(`${y}-${w}`);
  return set;
}

export function yearRangeForSensor(
  rows: WeeklyRecord[],
  sensor: Sensor,
): number[] {
  const years = new Set<number>();
  for (const row of rows) {
    if (row.sensor === sensor) years.add(row.year);
  }
  return [...years].sort((a, b) => a - b);
}

export function weeksInIsoYear(year: number): number {
  // ISO years have 53 weeks when Jan 1 is Thursday, or leap year Wed
  const dec28 = new Date(Date.UTC(year, 11, 28));
  const day = dec28.getUTCDay() || 7;
  const thursday = new Date(dec28);
  thursday.setUTCDate(dec28.getUTCDate() + 4 - day);
  // week number of Dec 28
  const yearStart = new Date(Date.UTC(thursday.getUTCFullYear(), 0, 4));
  const ysDay = yearStart.getUTCDay() || 7;
  yearStart.setUTCDate(yearStart.getUTCDate() - ysDay + 1);
  const diff = (thursday.getTime() - yearStart.getTime()) / 86400000;
  return Math.floor(diff / 7) + 1 >= 53 ? 53 : 52;
}

export function resolveCell(
  year: number,
  week: number,
  sensor: Sensor,
  index: Map<string, WeeklyRecord>,
  missing: Set<string>,
  yearBounds: { first: number; last: number },
): CalendarCell {
  const row = index.get(weekKey(year, week, sensor));
  const bounds = isoWeekBounds(year, week);
  if (row) {
    return {
      year,
      week,
      sensor,
      count: row.count,
      status: "detections_present",
      monday: bounds?.monday ?? null,
      sunday: bounds?.sunday ?? null,
    };
  }
  const inSpan = year >= yearBounds.first && year <= yearBounds.last;
  const listedMissing = missing.has(`${year}-${week}`);
  return {
    year,
    week,
    sensor,
    count: null,
    status:
      listedMissing || inSpan ? "missing_within_span" : "outside_span",
    monday: bounds?.monday ?? null,
    sunday: bounds?.sunday ?? null,
  };
}

export function maxCount(
  rows: WeeklyRecord[],
  sensor: Sensor | "BOTH",
): number {
  let max = 0;
  for (const row of rows) {
    if (sensor !== "BOTH" && row.sensor !== sensor) continue;
    if (row.count > max) max = row.count;
  }
  return max;
}

/** Approximate month tick positions for ISO weeks (mid-month anchors). */
export const MONTH_TICKS: { label: string; week: number }[] = [
  { label: "Jan", week: 1 },
  { label: "Feb", week: 5 },
  { label: "Mar", week: 9 },
  { label: "Apr", week: 14 },
  { label: "May", week: 18 },
  { label: "Jun", week: 22 },
  { label: "Jul", week: 27 },
  { label: "Aug", week: 31 },
  { label: "Sep", week: 35 },
  { label: "Oct", week: 40 },
  { label: "Nov", week: 44 },
  { label: "Dec", week: 49 },
];
