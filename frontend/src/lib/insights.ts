import { isoWeekBounds } from "./calendar";
import type { Provenance, Sensor, WeeklyRecord } from "./types";

export const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

export type MonthStats = {
  month: number;
  name: string;
  weeksInArchive: number;
  weeksWithDetections: number;
  /** Share of archive weeks in this month that have ≥1 detection record. */
  detectionWeekRate: number;
  detections: number;
  /** Share of this sensor's total detections falling in this month. */
  detectionShare: number;
  medianWhenPresent: number | null;
};

export type SensorInsights = {
  sensor: Sensor;
  months: MonthStats[];
  peakRateMonth: MonthStats;
  troughRateMonth: MonthStats;
  peakShareMonth: MonthStats;
  drySeasonShare: number;
  recommendations: InsightCard[];
};

export type InsightCard = {
  id: string;
  headline: string;
  detail: string;
  tone: "high" | "mid" | "low" | "info";
  metricLabel: string;
  metricValue: string;
};

function median(values: number[]): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

function monthFromIso(year: number, week: number): number | null {
  const bounds = isoWeekBounds(year, week);
  if (!bounds) return null;
  return Number(bounds.monday.slice(5, 7));
}

export function computeSensorInsights(
  weeks: WeeklyRecord[],
  provenance: Provenance,
  sensor: Sensor,
): SensorInsights {
  const rows = weeks.filter((r) => r.sensor === sensor);
  const present = new Set(rows.map((r) => `${r.year}-${r.week}`));
  const missing = provenance.sensors[sensor].missing_record_weeks.map(
    ([y, w]) => `${y}-${w}`,
  );
  const archiveWeeks = new Set([...present, ...missing]);

  const totals = Array.from({ length: 12 }, () => ({
    weeksInArchive: 0,
    weeksWithDetections: 0,
    detections: 0,
    countsWhenPresent: [] as number[],
  }));

  for (const key of archiveWeeks) {
    const [ys, ws] = key.split("-");
    const year = Number(ys);
    const week = Number(ws);
    const month = monthFromIso(year, week);
    if (!month) continue;
    const bucket = totals[month - 1];
    bucket.weeksInArchive += 1;
    if (present.has(key)) bucket.weeksWithDetections += 1;
  }

  for (const row of rows) {
    const month = monthFromIso(row.year, row.week);
    if (!month) continue;
    const bucket = totals[month - 1];
    bucket.detections += row.count;
    bucket.countsWhenPresent.push(row.count);
  }

  const totalDetections = totals.reduce((s, t) => s + t.detections, 0);
  const months: MonthStats[] = totals.map((t, i) => ({
    month: i + 1,
    name: MONTH_NAMES[i],
    weeksInArchive: t.weeksInArchive,
    weeksWithDetections: t.weeksWithDetections,
    detectionWeekRate:
      t.weeksInArchive > 0 ? t.weeksWithDetections / t.weeksInArchive : 0,
    detections: t.detections,
    detectionShare: totalDetections > 0 ? t.detections / totalDetections : 0,
    medianWhenPresent: median(t.countsWhenPresent),
  }));

  const withData = months.filter((m) => m.weeksInArchive > 0);
  const peakRateMonth = withData.reduce((a, b) =>
    b.detectionWeekRate > a.detectionWeekRate ? b : a,
  );
  const troughRateMonth = withData.reduce((a, b) =>
    b.detectionWeekRate < a.detectionWeekRate ? b : a,
  );
  const peakShareMonth = withData.reduce((a, b) =>
    b.detectionShare > a.detectionShare ? b : a,
  );

  const drySeasonShare = [12, 1, 2]
    .map((m) => months[m - 1].detectionShare)
    .reduce((a, b) => a + b, 0);

  const label = sensor === "MODIS" ? "MODIS" : "VIIRS";
  const nov = months[10];
  const jul = months[6];

  const recommendations: InsightCard[] = [
    {
      id: `${sensor}-nov`,
      headline: `${pct(nov.detectionWeekRate)} of November weeks historically show detections (${label})`,
      detail: `${nov.weeksWithDetections} of ${nov.weeksInArchive} archive weeks whose Monday falls in November include ≥1 thermal detection. This is a historical week-detection rate — not a forecast of wildfire occurrence.`,
      tone: nov.detectionWeekRate >= 0.7 ? "high" : nov.detectionWeekRate >= 0.35 ? "mid" : "low",
      metricLabel: "Nov week detection rate",
      metricValue: pct(nov.detectionWeekRate),
    },
    {
      id: `${sensor}-dry`,
      headline: `${pct(drySeasonShare)} of ${label} detections fall in Dec–Feb`,
      detail: `Kaduna’s dry-season stripe dominates the archive. ${peakShareMonth.name} alone holds ${pct(peakShareMonth.detectionShare)} of ${label} raw detections.`,
      tone: "high",
      metricLabel: "Dry-season share",
      metricValue: pct(drySeasonShare),
    },
    {
      id: `${sensor}-wet`,
      headline: `${pct(jul.detectionWeekRate)} of July weeks show detections (${label})`,
      detail: `Wet-season weeks are sparse in the record (${jul.weeksWithDetections}/${jul.weeksInArchive}). Low rates mean few detection weeks — not proof that fires never occur.`,
      tone: "low",
      metricLabel: "July week detection rate",
      metricValue: pct(jul.detectionWeekRate),
    },
    {
      id: `${sensor}-intensity`,
      headline:
        peakShareMonth.medianWhenPresent != null
          ? `When ${peakShareMonth.name} weeks fire, median ${label} count is ${Math.round(peakShareMonth.medianWhenPresent).toLocaleString()}`
          : `Peak detection share is ${peakShareMonth.name}`,
      detail: `Intensity among weeks that already have detections. Counts are repeated thermal detections, not unique incidents.`,
      tone: "mid",
      metricLabel: `${peakShareMonth.name} median (active weeks)`,
      metricValue:
        peakShareMonth.medianWhenPresent != null
          ? Math.round(peakShareMonth.medianWhenPresent).toLocaleString()
          : "—",
    },
  ];

  return {
    sensor,
    months,
    peakRateMonth,
    troughRateMonth,
    peakShareMonth,
    drySeasonShare,
    recommendations,
  };
}

function pct(rate: number): string {
  return `${Math.round(rate * 100)}%`;
}

export function buildOutlook(
  modis: SensorInsights,
  viirs: SensorInsights,
): InsightCard[] {
  const now = new Date();
  const month = now.getUTCMonth(); // 0-based
  const mModis = modis.months[month];
  const mViirs = viirs.months[month];
  const name = MONTH_NAMES[month];

  return [
    {
      id: "outlook-current-month",
      headline: `This month (${name}): ${pct(mModis.detectionWeekRate)} MODIS / ${pct(mViirs.detectionWeekRate)} VIIRS historical week-detection rates`,
      detail: `Based on archive weeks whose Monday falls in ${name}. Use as seasonal context for Kaduna planning — not an operational fire probability for any specific day.`,
      tone:
        Math.max(mModis.detectionWeekRate, mViirs.detectionWeekRate) >= 0.7
          ? "high"
          : Math.max(mModis.detectionWeekRate, mViirs.detectionWeekRate) >= 0.35
            ? "mid"
            : "low",
      metricLabel: `${name} context`,
      metricValue: `${pct(mModis.detectionWeekRate)} / ${pct(mViirs.detectionWeekRate)}`,
    },
    {
      id: "no-weekday",
      headline: "Day-of-week odds (e.g. Sunday) are not available",
      detail:
        "The handoff is ISO-week totals only. We cannot estimate Sunday vs Monday fire chance without daily acquisition timestamps in the UI dataset.",
      tone: "info",
      metricLabel: "Temporal grain",
      metricValue: "ISO week",
    },
  ];
}
