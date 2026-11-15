import type { StateCollection } from "./geo";
import type { Comparison, PairedWeek, Provenance, WeeklyRecord } from "./types";

async function loadJson<T>(name: string, signal?: AbortSignal): Promise<T> {
  const base = import.meta.env.BASE_URL;
  const response = await fetch(`${base}data/${name}.json`, { signal });
  if (!response.ok) {
    throw new Error(`Failed to load ${name}.json (${response.status})`);
  }
  return response.json() as Promise<T>;
}

export type YearAggregate = {
  year: number;
  MODIS: number;
  VIIRS_SNPP: number;
  weeks_modis: number;
  weeks_viirs: number;
};

export type MonthAggregate = {
  month: number;
  MODIS: number;
  VIIRS_SNPP: number;
};

export type Aggregates = {
  by_year: YearAggregate[];
  by_month: MonthAggregate[];
};

export type FireLensData = {
  weeks: WeeklyRecord[];
  provenance: Provenance;
  comparison: Comparison;
  pairs: PairedWeek[];
  aggregates: Aggregates;
  states: StateCollection;
};

export async function loadFireLensData(
  signal?: AbortSignal,
): Promise<FireLensData> {
  const [weeks, provenance, comparison, pairs, aggregates, states] =
    await Promise.all([
      loadJson<WeeklyRecord[]>("weekly_fire_counts", signal),
      loadJson<Provenance>("provenance", signal),
      loadJson<Comparison>("comparison", signal),
      loadJson<PairedWeek[]>("paired_weeks", signal),
      loadJson<Aggregates>("aggregates", signal),
      loadJson<StateCollection>("nigeria_states", signal),
    ]);
  return { weeks, provenance, comparison, pairs, aggregates, states };
}
