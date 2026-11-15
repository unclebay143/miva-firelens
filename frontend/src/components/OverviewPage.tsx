import { computeSensorInsights } from "../lib/insights";
import type { Aggregates } from "../lib/data";
import type { AppPage } from "./AppShell";
import type { Comparison, Provenance, WeeklyRecord } from "../lib/types";

type Props = {
  weeks: WeeklyRecord[];
  provenance: Provenance;
  comparison: Comparison;
  aggregates: Aggregates;
  onNavigate: (page: AppPage) => void;
};

export function OverviewPage({
  weeks,
  provenance,
  comparison,
  aggregates,
  onNavigate,
}: Props) {
  const modis = provenance.sensors.MODIS;
  const viirs = provenance.sensors.VIIRS_SNPP;
  const insights = computeSensorInsights(weeks, provenance, "VIIRS_SNPP");
  const maxYear = Math.max(
    ...aggregates.by_year.map((y) => y.MODIS + y.VIIRS_SNPP),
    1,
  );
  const recent = aggregates.by_year.slice(-12);
  const latest = aggregates.by_year[aggregates.by_year.length - 1];

  return (
    <div className="workspace overview">
      <div className="page-head">
        <div>
          <h1>Fire season overview, Kaduna</h1>
          <p className="lede">
            {provenance.weekly_rows.toLocaleString()} positive sensor-weeks ·{" "}
            {provenance.total_raw_detections.toLocaleString()} raw NASA FIRMS
            detections · MODIS {modis.observed_detection_date_bounds[0].slice(0, 4)}–
            {modis.observed_detection_date_bounds[1].slice(0, 4)} · VIIRS{" "}
            {viirs.observed_detection_date_bounds[0].slice(0, 4)}–
            {viirs.observed_detection_date_bounds[1].slice(0, 4)}.
          </p>
        </div>
        <button type="button" className="btn-ghost" onClick={() => onNavigate("calendar")}>
          Open historical calendar →
        </button>
      </div>

      <div className="disclosure">
        VERIFIED KADUNA ARCHIVE · Standard-quality FIRMS products only. Counts are
        raw thermal detections, not unique fires. Harmonization is not applied.
      </div>

      <div className="kpi-grid">
        <article className="kpi-card">
          <p className="kpi-label">Total raw detections</p>
          <p className="kpi-value">{provenance.total_raw_detections.toLocaleString()}</p>
          <p className="kpi-sub">Kaduna State · both sensors</p>
        </article>
        <article className="kpi-card">
          <p className="kpi-label">MODIS sample</p>
          <p className="kpi-value">{modis.raw_detections.toLocaleString()}</p>
          <p className="kpi-sub">
            Terra + Aqua · {modis.weekly_rows} weeks ·{" "}
            {modis.observed_detection_date_bounds[0]} →{" "}
            {modis.observed_detection_date_bounds[1]}
          </p>
        </article>
        <article className="kpi-card">
          <p className="kpi-label">VIIRS S-NPP sample</p>
          <p className="kpi-value">{viirs.raw_detections.toLocaleString()}</p>
          <p className="kpi-sub">
            Suomi-NPP · {viirs.weekly_rows} weeks ·{" "}
            {viirs.observed_detection_date_bounds[0]} →{" "}
            {viirs.observed_detection_date_bounds[1]}
          </p>
        </article>
        <article className="kpi-card">
          <p className="kpi-label">Paired positive weeks</p>
          <p className="kpi-value">{comparison.overall.n}</p>
          <p className="kpi-sub">
            Median VIIRS/MODIS ratio{" "}
            {comparison.overall.weekly_ratio_median.toFixed(1)} · descriptive only
          </p>
        </article>
      </div>

      <div className="overview-mid">
        <article className="panel-card">
          <div className="panel-card-head">
            <div>
              <h2>Detections by year, Kaduna</h2>
              <p>
                Raw MODIS and VIIRS weekly totals summed by ISO year — not
                harmonized.
              </p>
            </div>
          </div>
          <div className="year-chart" role="img" aria-label="Detections by year">
            {recent.map((row) => {
              const total = row.MODIS + row.VIIRS_SNPP;
              const h = Math.max(4, (total / maxYear) * 140);
              const modisH = total ? (row.MODIS / total) * h : 0;
              return (
                <div className="year-col" key={row.year} title={`${row.year}: ${total.toLocaleString()}`}>
                  <div className="year-stack" style={{ height: h }}>
                    <span style={{ height: h - modisH }} className="bar-viirs" />
                    <span style={{ height: modisH }} className="bar-modis" />
                  </div>
                  <span className="year-tick">{String(row.year).slice(2)}</span>
                </div>
              );
            })}
          </div>
          <div className="chart-legend">
            <span><i className="swatch modis" /> MODIS</span>
            <span><i className="swatch viirs" /> VIIRS</span>
            {latest && (
              <span>
                Latest ISO year {latest.year}:{" "}
                {(latest.MODIS + latest.VIIRS_SNPP).toLocaleString()} detections
              </span>
            )}
          </div>
        </article>

        <article className="panel-card">
          <div className="panel-card-head">
            <div>
              <h2>Signals to watch</h2>
              <p>Seasonal structure from the verified archive.</p>
            </div>
          </div>
          <ul className="signal-list">
            <li>
              <strong>Dry season share</strong>
              <span>
                {Math.round(insights.drySeasonShare * 100)}% of VIIRS detections
                fall in Dec–Feb
              </span>
            </li>
            <li>
              <strong>Peak month</strong>
              <span>
                {insights.peakShareMonth.name} holds{" "}
                {Math.round(insights.peakShareMonth.detectionShare * 100)}% of
                VIIRS detections
              </span>
            </li>
            <li>
              <strong>November week rate</strong>
              <span>
                {Math.round(insights.months[10].detectionWeekRate * 100)}% of
                November weeks show VIIRS detections
              </span>
            </li>
            <li>
              <strong>MODIS version note</strong>
              <span>{provenance.modis_version_warning}</span>
            </li>
          </ul>
          <button type="button" className="btn-primary" onClick={() => onNavigate("season")}>
            Read season briefing →
          </button>
        </article>
      </div>

      <div className="overview-mid">
        <article className="panel-card dark">
          <p className="eyebrow">Seasonal pattern</p>
          <h2>Highest activity between December and February</h2>
          <p>
            Wet-season weeks are sparse in the record. Use the calendar for
            week-level evidence; do not treat gaps as confirmed zero fires.
          </p>
        </article>
        <article className="panel-card">
          <div className="panel-card-head">
            <div>
              <h2>Where to explore next</h2>
              <p>Kaduna is the only state in this handoff polygon filter.</p>
            </div>
          </div>
          <div className="cta-stack">
            <button type="button" className="btn-primary" onClick={() => onNavigate("map")}>
              Explore Kaduna fire map →
            </button>
            <button type="button" className="btn-ghost" onClick={() => onNavigate("calendar")}>
              Open historical calendar →
            </button>
            <button type="button" className="btn-ghost" onClick={() => onNavigate("about")}>
              About the data →
            </button>
          </div>
        </article>
      </div>
    </div>
  );
}
