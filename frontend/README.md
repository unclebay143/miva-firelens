# FireLens frontend

Vite + React calendar UI for the verified Kaduna weekly detection handoff.
Run from this folder:

```bash
npm install
npm run dev
```

Static JSON lives in `public/data` (copied into the build as `/data/*.json`).
All counts derive from the verified real Kaduna standard archives. No raw NASA
downloads, NRT records, corrected counts or fitted model are included here.

## Presentation

The primary view is a NASA FIRMS–inspired **ISO-week heatmap** (year × week)
with separate MODIS and VIIRS layers, a thermal color ramp, gray gaps for
unknown exposure, log/linear scale, and a week inspector. Seasonal paired-week
ratios appear below the fold as descriptive context only.

## Files

- `public/data/weekly_fire_counts.json`: 1,337 positive weekly sensor records,
  totaling 571,781 raw thermal detections (MODIS 128,288; VIIRS_SNPP 443,493).
- `public/data/provenance.json`: observed date bounds, explicit absent-record
  week lists, source hashes, boundary attribution and limitations.
- `public/data/comparison.json`: descriptive ratios/quantiles, month/season/era
  summaries, overlap bounds and warnings. `overall.n` is 410 paired weeks.
- `public/data/paired_weeks.json`: those 410 raw positive paired observations
  for scatter plots; use their ISO year/week to connect to the calendar.

These compact files are small enough for normal Git and direct browser fetch.
See `ASSETS.md` for measured byte sizes and hashes.

## Weekly schema and actual example

```json
{"area":"Kaduna State","year":2000,"week":44,"sensor":"MODIS","count":1,"metric":"raw_detections","record_status":"detections_present","observation_coverage":"unknown"}
```

`year`, `week` and `count` are integers. Year/week use **ISO week numbering**,
Monday start; year can differ from the acquisition calendar year. Sensor is
`MODIS` (Terra+Aqua) or `VIIRS_SNPP`. Key is `(area,year,week,sensor,metric)`.
Every exported count is positive. No confirmed observation-coverage status or
confirmed zero-detection week can be established from these downloads.

## JavaScript / React loading

```js
const base = import.meta.env.BASE_URL; // Vite; use your deployment base otherwise
async function load(name) {
  const response = await fetch(`${base}data/${name}.json`);
  if (!response.ok) throw new Error(`Data load failed: ${response.status}`);
  return response.json();
}
const [weeks, provenance, comparison, pairs] = await Promise.all([
  load('weekly_fire_counts'), load('provenance'),
  load('comparison'), load('paired_weeks')
]);
const index = new Map(weeks.map(r => [`${r.year}-${r.week}-${r.sensor}`, r]));
function calendarCell(year, week, sensor) {
  const row = index.get(`${year}-${week}-${sensor}`);
  return row ?? {
    year, week, sensor, count: null,
    record_status: 'no_detection_records_or_outside_available_span',
    observation_coverage: 'unknown'
  };
}
```

In React, run the loader in `useEffect` with loading/error state and cancellation
on unmount. Do not fetch with filesystem paths or open JSON via `file://`.
The deployment base is required when hosting below a repository subpath.

## Calendar and comparison behavior

Build separate weekly layers or panels for each sensor. Use an ISO-week-aware
date utility; do not generate daily observations from weekly totals. For an
absent key, check `provenance.sensors[sensor].missing_record_weeks` (arrays of
`[isoYear,isoWeek]`): listed keys mean no supplied detection records within the
observed span, with exposure unknown. Other absent keys are outside that
documented grid. Both have `count:null`; neither is zero fires. Use gray/missing
styling and an explanatory tooltip, not the lowest fire-count color. Never
use `count || 0`, interpolate across gaps, or label detections as incidents.

Observed regional date bounds are 2000-11-01–2026-08-31 for MODIS and
2012-01-20–2026-07-31 for S-NPP. Bounds do not establish complete observations.
First/last ISO weeks are calendar-truncated; label them using these exact dates.

Scatter `pairs[].MODIS` against `pairs[].VIIRS_SNPP`, retaining month/season and
version-era labels. `comparison.overall.summed_count_ratio` is a ratio of paired
sums, whereas `weekly_ratio_median` is the median weekly ratio. Their meanings
differ. Display paired n, conditional selection and log axes if used.

The raw calendar preserves native sensor histories; the scatter is restricted
to positive pairs in full weeks within the common date bounds. The field
`excluded_observed_week_keys.partial_edge_weeks` also includes keys outside
the overlap; do not present it as a count of partially observed overlap weeks.

## Scientific limits and credits

Harmonization is **not validated**. Counts reflect repeated thermal detections
and may include non-vegetation sources. Different resolutions, observation
timing, cloud and unknown exposure make counts non-interchangeable. MODIS
`6.03`/`61.03` lineage is unresolved; show the version-label transition in 2023
without asserting a physical trend break. Positive paired weeks are selected,
and low-count seasons have sparse/unstable ratios. No canonical combined
25-year corrected series should be shown.

Credit NASA FIRMS and geoBoundaries / GRID3 Nigeria state boundaries, CC BY 4.0:
https://www.geoboundaries.org/. Preserve the attribution in the UI.
See `docs/HARMONIZATION_READINESS.md` and `docs/HISTORICAL_DATA_REPORT.md`.

## Rebuild and validate (PowerShell, repository root)

```powershell
.\.venv\Scripts\python.exe scripts/export_frontend.py
.\.venv\Scripts\python.exe -m pytest -q --basetemp=.pytest-work/frontend-check
```

Rebuilding requires local verified files under `data/processed`; they are
intentionally gitignored. A teammate cloning GitHub can consume committed
frontend JSON immediately and run tests without downloading original NASA CSVs.
