import { useState } from "react";
import type { AppPage } from "./AppShell";
import type { Comparison, Provenance } from "../lib/types";

type Props = {
  provenance: Provenance;
  comparison: Comparison;
  onNavigate: (page: AppPage) => void;
};

type AboutTab = "guide" | "harmonization" | "limitations";

export function AboutPage({ provenance, comparison, onNavigate }: Props) {
  const [tab, setTab] = useState<AboutTab>("guide");
  const modis = provenance.sensors.MODIS;
  const viirs = provenance.sensors.VIIRS_SNPP;

  return (
    <div className="workspace about-page">
      <div className="page-head">
        <div>
          <h1>Understand the data behind FireLens</h1>
          <p className="lede">
            NASA satellite observations, explained simply and transparently.
          </p>
        </div>
      </div>

      <div className="disclosure">
        TRANSPARENCY · This build serves the verified Kaduna weekly handoff (
        {provenance.total_raw_detections.toLocaleString()} raw detections). No
        fitted harmonization correction is applied.
      </div>

      <div className="controls">
        {(
          [
            ["guide", "Dataset guide"],
            ["harmonization", "Harmonization"],
            ["limitations", "Limitations"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={`control-chip${tab === id ? " active" : ""}`}
            aria-pressed={tab === id}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "guide" && (
        <>
          <div className="about-grid">
            <article className="panel-card">
              <p className="eyebrow">01 / MODIS</p>
              <h2>The long view</h2>
              <p className="strong">Terra + Aqua</p>
              <p className="muted">
                Active-fire record in this archive: {modis.observed_detection_date_bounds[0]} →{" "}
                {modis.observed_detection_date_bounds[1]}
              </p>
              <p className="strong">~1 km resolution · Collection lineage mixed</p>
              <p className="muted">
                {modis.raw_detections.toLocaleString()} Kaduna detections ·{" "}
                {modis.weekly_rows} positive weeks. Smaller or obscured fires may
                not be detected.
              </p>
            </article>
            <article className="panel-card">
              <p className="eyebrow">02 / VIIRS</p>
              <h2>A finer view</h2>
              <p className="strong">Suomi-NPP (this handoff)</p>
              <p className="muted">
                Archive span: {viirs.observed_detection_date_bounds[0]} →{" "}
                {viirs.observed_detection_date_bounds[1]}
              </p>
              <p className="strong">~375 m resolution</p>
              <p className="muted">
                {viirs.raw_detections.toLocaleString()} Kaduna detections ·{" "}
                {viirs.weekly_rows} positive weeks. Higher spatial resolution can
                reveal smaller thermal anomalies than MODIS.
              </p>
            </article>
            <article className="panel-card">
              <p className="eyebrow">03 / NASA FIRMS</p>
              <h2>The source of observations</h2>
              <p className="strong">Fire Information for Resource Management</p>
              <p className="muted">Primary source of active-fire detections</p>
              <p className="strong">Location · observation date · confidence</p>
              <p className="muted">
                Metric in UI: {provenance.metric}. Quality: {provenance.quality}.
              </p>
            </article>
          </div>

          <article className="panel-card">
            <h2>From different instruments to a common measurement scale</h2>
            <p className="muted">
              Conceptual workflow only. A production harmonized record requires
              validated calibration — status here:{" "}
              <strong>{comparison.status}</strong>.
            </p>
            <div className="method-steps">
              <div className="method-step">
                <span>01</span>
                <strong>Align observations</strong>
                <p>Match geography, dates, coverage and quality filters.</p>
              </div>
              <div className="method-step">
                <span>02</span>
                <strong>Learn the overlap</strong>
                <p>
                  Shared record from 2012 ({comparison.overall.n} paired weeks in
                  this handoff).
                </p>
              </div>
              <div className="method-step">
                <span>03</span>
                <strong>Calibrate the scale</strong>
                <p>Not fitted here. Descriptive ratios only.</p>
              </div>
              <div className="method-step dark">
                <span>04</span>
                <strong>Report estimates</strong>
                <p>UI keeps raw sensor calendars separate.</p>
              </div>
            </div>
          </article>

          <div className="about-split">
            <article className="panel-card">
              <h2>What the numbers do — and don’t — mean</h2>
              <ul className="about-points">
                <li>
                  <strong>A detection is not a unique fire.</strong>
                  <span>Repeat overpasses can observe the same event.</span>
                </li>
                <li>
                  <strong>Raw counts are not directly comparable.</strong>
                  <span>Pixel size, coverage and sensitivity differ by sensor.</span>
                </li>
                <li>
                  <strong>Missing weeks are not zero fires.</strong>
                  <span>{provenance.missing_count_policy}</span>
                </li>
              </ul>
            </article>
            <article className="panel-card provenance">
              <h2>Provenance you can trace</h2>
              <p className="strong">
                NASA FIRMS · MODIS · VIIRS S-NPP · {provenance.area}
              </p>
              <p>
                <a href="https://firms.modaps.eosdis.nasa.gov/" target="_blank" rel="noreferrer">
                  firms.modaps.eosdis.nasa.gov
                </a>
              </p>
              <p className="muted">
                Boundary: {provenance.boundary.source} ({provenance.boundary.license})
              </p>
              <p>
                <a href={provenance.boundary.url} target="_blank" rel="noreferrer">
                  {provenance.boundary.url}
                </a>
              </p>
              <p className="muted">{provenance.modis_version_warning}</p>
            </article>
          </div>
        </>
      )}

      {tab === "harmonization" && (
        <article className="panel-card">
          <h2>Harmonization readiness</h2>
          <p>
            Status: <strong>{comparison.status}</strong>. Method: {comparison.method}
          </p>
          <p className="muted">
            Overlap bounds: {comparison.overlap_date_bounds[0]} →{" "}
            {comparison.overlap_date_bounds[1]}. Paired n={comparison.overall.n}.
            Summed count ratio (VIIRS/MODIS){" "}
            {comparison.overall.summed_count_ratio.toFixed(2)}; median weekly ratio{" "}
            {comparison.overall.weekly_ratio_median.toFixed(2)}.
          </p>
          <div className="callout-soft">{comparison.warning}</div>
          <p className="muted">
            corrected={String(provenance.corrected)}. No canonical combined 25-year
            corrected series is shown in this UI.
          </p>
        </article>
      )}

      {tab === "limitations" && (
        <article className="panel-card">
          <h2>Limitations</h2>
          <ul className="about-points">
            {provenance.limitations.map((item) => (
              <li key={item}>
                <strong>{item}</strong>
              </li>
            ))}
            <li>
              <strong>{provenance.coverage_policy}</strong>
            </li>
            <li>
              <strong>{provenance.missing_count_policy}</strong>
            </li>
          </ul>
        </article>
      )}

      <section className="journey">
        <h2>Move from the explanation to the evidence</h2>
        <p>
          Dataset guide explains the products; calendar and season cards show the
          verified Kaduna weekly record.
        </p>
        <div className="journey-actions">
          <button type="button" className="btn-primary" onClick={() => setTab("harmonization")}>
            Review harmonization status →
          </button>
          <button type="button" className="btn-ghost" onClick={() => onNavigate("overview")}>
            ← Return to overview
          </button>
          <button type="button" className="btn-ghost" onClick={() => onNavigate("calendar")}>
            Open Kaduna calendar →
          </button>
        </div>
      </section>
    </div>
  );
}
