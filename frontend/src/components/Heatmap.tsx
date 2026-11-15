import { ACTIVITY_BINS, activityColor, GAP_COLOR, ZERO_COLOR } from "../lib/colors";
import {
  MONTH_TICKS,
  resolveCell,
  weeksInIsoYear,
  yearRangeForSensor,
} from "../lib/calendar";
import type {
  CalendarCell,
  Provenance,
  Sensor,
  WeeklyRecord,
} from "../lib/types";

type Props = {
  sensor: Sensor;
  weeks: WeeklyRecord[];
  provenance: Provenance;
  index: Map<string, WeeklyRecord>;
  missing: Set<string>;
  yearFrom: number;
  yearTo: number;
  selected: CalendarCell | null;
  onSelect: (cell: CalendarCell) => void;
};

export function Heatmap({
  sensor,
  weeks,
  provenance,
  index,
  missing,
  yearFrom,
  yearTo,
  selected,
  onSelect,
}: Props) {
  const allYears = yearRangeForSensor(weeks, sensor);
  const years = allYears.filter((y) => y >= yearFrom && y <= yearTo);
  const coverage = provenance.sensors[sensor];
  const firstYear = allYears[0] ?? 0;
  const lastYear = allYears[allYears.length - 1] ?? 0;
  const sensorLabel =
    sensor === "MODIS" ? "MODIS (Terra + Aqua)" : "VIIRS Suomi-NPP";

  return (
    <section className="heatmap-card" aria-label={`${sensorLabel} weekly calendar`}>
      <h2>Kaduna · historical fire activity</h2>
      <p className="sub">
        Each square is one week. Rows are calendar years; intensity is raw{" "}
        {sensorLabel} detections. Gray = no detection records (unknown exposure).
      </p>

      <div className="heatmap" role="grid" aria-rowcount={years.length}>
        <div aria-hidden="true" />
        <div className="month-row" aria-hidden="true">
          {MONTH_TICKS.map((tick) => (
            <span key={tick.label} style={{ gridColumn: tick.week }}>
              {tick.label}
            </span>
          ))}
        </div>

        {years.map((year) => {
          const nWeeks = weeksInIsoYear(year);
          const rowSelected = selected?.year === year && selected?.sensor === sensor;
          return (
            <div
              className={`year-row${rowSelected ? " selected" : ""}`}
              key={year}
              role="row"
            >
              <div className="year-label">{year}</div>
              <div className="cells">
                {Array.from({ length: 53 }, (_, i) => {
                  const week = i + 1;
                  if (week > nWeeks) {
                    return (
                      <span
                        key={week}
                        className="cell"
                        data-status="outside_span"
                        aria-hidden="true"
                      />
                    );
                  }
                  const cell = resolveCell(
                    year,
                    week,
                    sensor,
                    index,
                    missing,
                    { first: firstYear, last: lastYear },
                  );
                  const isSelected =
                    selected?.year === year &&
                    selected?.week === week &&
                    selected?.sensor === sensor;
                  const label =
                    cell.count === null
                      ? `${year} W${week}: no detection records`
                      : `${year} W${week}: ${cell.count.toLocaleString()} raw detections`;
                  return (
                    <button
                      key={week}
                      type="button"
                      className="cell"
                      role="gridcell"
                      data-status={cell.status}
                      aria-label={label}
                      aria-pressed={isSelected}
                      title={label}
                      style={{ background: activityColor(cell.count) }}
                      onClick={() => onSelect(cell)}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="legend">
        <span>Less</span>
        <div className="legend-bins" aria-hidden="true">
          <span style={{ background: ZERO_COLOR }} title="0" />
          {ACTIVITY_BINS.map((b) => (
            <span key={b.label} style={{ background: b.color }} title={b.label} />
          ))}
        </div>
        <span>More</span>
        <span>
          0 · 1–49 · 50–99 · 100–199 · ≥200 detections / week
        </span>
        <span className="legend-gap" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <i style={{ width: 19, height: 19, background: GAP_COLOR, borderRadius: 3, display: "inline-block" }} />
          No detection records
        </span>
        <span>Outline = your selected week</span>
      </div>
      <p className="sub" style={{ marginTop: 8, marginBottom: 0 }}>
        Observed span {coverage.observed_detection_date_bounds[0]} →{" "}
        {coverage.observed_detection_date_bounds[1]} ·{" "}
        {coverage.raw_detections.toLocaleString()} raw detections
      </p>
    </section>
  );
}
