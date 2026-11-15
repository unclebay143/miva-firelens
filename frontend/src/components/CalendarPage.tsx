import { useMemo, useState } from "react";
import { Heatmap } from "./Heatmap";
import { buildMissingSet, yearRangeForSensor } from "../lib/calendar";
import { formatWeekRange, weekComparison } from "../lib/compare";
import type { CalendarCell, Provenance, Sensor, WeeklyRecord } from "../lib/types";

type Props = {
  weeks: WeeklyRecord[];
  provenance: Provenance;
  index: Map<string, WeeklyRecord>;
  onOpenSeason: () => void;
};

export function CalendarPage({
  weeks,
  provenance,
  index,
  onOpenSeason,
}: Props) {
  const [sensor, setSensor] = useState<Sensor>("VIIRS_SNPP");
  const years = yearRangeForSensor(weeks, sensor);
  const [yearFrom, setYearFrom] = useState(() => Math.max(years[0] ?? 2013, 2013));
  const [yearTo, setYearTo] = useState(() => years[years.length - 1] ?? 2024);
  const [selected, setSelected] = useState<CalendarCell | null>(null);

  const missing = useMemo(
    () => buildMissingSet(provenance.sensors[sensor].missing_record_weeks),
    [provenance, sensor],
  );

  const comparison = selected ? weekComparison(selected, weeks) : null;

  return (
    <div className="workspace">
      <div className="page-head">
        <div>
          <h1>Fire activity, week by week</h1>
          <p className="lede">
            Compare weekly patterns across years, without losing the seasonal
            context.
          </p>
        </div>
      </div>

      <div className="disclosure">
        VERIFIED KADUNA ARCHIVE · Counts are raw NASA FIRMS weekly detections
        from standard archives. Missing weeks are unknown exposure — not confirmed
        zero fires. Harmonization is not applied.
      </div>

      <div className="controls">
        <span className="control-chip">Kaduna</span>
        <label className="control-select" style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
          Years
          <select
            value={`${yearFrom}-${yearTo}`}
            onChange={(e) => {
              const [a, b] = e.target.value.split("-").map(Number);
              setYearFrom(a);
              setYearTo(b);
            }}
            style={{ border: 0, background: "transparent" }}
          >
            <option value={`${Math.max(years[0] ?? 2013, 2013)}-${years[years.length - 1] ?? 2024}`}>
              {Math.max(years[0] ?? 2013, 2013)}–{years[years.length - 1] ?? 2024}
            </option>
            <option value={`${years[0]}-${years[years.length - 1]}`}>
              Full span {years[0]}–{years[years.length - 1]}
            </option>
          </select>
        </label>
        <button
          type="button"
          className={`control-chip${sensor === "MODIS" ? " active" : ""}`}
          aria-pressed={sensor === "MODIS"}
          onClick={() => setSensor("MODIS")}
        >
          MODIS raw
        </button>
        <button
          type="button"
          className={`control-chip${sensor === "VIIRS_SNPP" ? " active" : ""}`}
          aria-pressed={sensor === "VIIRS_SNPP"}
          onClick={() => setSensor("VIIRS_SNPP")}
        >
          VIIRS raw
        </button>
      </div>

      <Heatmap
        sensor={sensor}
        weeks={weeks}
        provenance={provenance}
        index={index}
        missing={missing}
        yearFrom={yearFrom}
        yearTo={yearTo}
        selected={selected}
        onSelect={setSelected}
      />

      <div className="insight-row">
        <article className="season-card">
          <p className="eyebrow">Seasonal pattern · archive</p>
          <p className="body">
            Kaduna typically experiences its highest fire activity between
            December and February.
          </p>
          <p className="foot">
            Derived from historical week-detection rates · confirm against the
            selected NASA record.
          </p>
        </article>

        <article className="week-card">
          {selected ? (
            <>
              <div className="week-top">
                <h3>Selected · {formatWeekRange(selected)}</h3>
                {comparison?.label && <span className="badge">{comparison.label}</span>}
              </div>
              <p className="metric">
                {selected.count === null
                  ? "No detection records this week"
                  : `${selected.count.toLocaleString()} raw detections`}
                {comparison?.usual != null && selected.count !== null
                  ? ` · usually ${Math.round(comparison.usual).toLocaleString()}`
                  : ""}
              </p>
              <p className="compare">
                {comparison?.deltaPct != null
                  ? `${Math.abs(Math.round(comparison.deltaPct))}% ${
                      comparison.deltaPct >= 0 ? "higher" : "lower"
                    } than the same ISO week in other years.`
                  : selected.count === null
                    ? "Gap weeks stay unknown — not zero-filled."
                    : "Not enough same-week history to compare."}
              </p>
              <div className="week-actions">
                <span className="meta">
                  {selected.sensor === "MODIS" ? "MODIS" : "VIIRS"} · raw_detections
                </span>
                <button type="button" className="btn-primary" onClick={onOpenSeason}>
                  Open season briefing →
                </button>
              </div>
            </>
          ) : (
            <>
              <h3>Select a week</h3>
              <p className="compare">
                Click any square to inspect raw detections and same-week history.
              </p>
            </>
          )}
        </article>
      </div>

      <section className="journey">
        <h2>Keep exploring</h2>
        <p>
          {selected
            ? `Kaduna · ${formatWeekRange(selected)}${
                selected.count != null
                  ? ` · ${selected.count.toLocaleString()} raw detections`
                  : ""
              }`
            : "Pick a week in the calendar to continue the walkthrough."}
        </p>
        <div className="journey-actions">
          <button type="button" className="btn-primary" onClick={onOpenSeason}>
            Open season briefing →
          </button>
          <button type="button" className="btn-ghost" disabled>
            Explore selected week →
          </button>
          <button type="button" className="btn-ghost" disabled>
            View season on fire map →
          </button>
        </div>
      </section>
    </div>
  );
}
