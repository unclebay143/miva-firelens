import { useMemo, useState } from "react";
import type { Aggregates } from "../lib/data";
import {
  collectionBBox,
  featureLabelPoint,
  projectPath,
  type StateCollection,
} from "../lib/geo";
import { MONTH_NAMES } from "../lib/insights";
import type { AppPage } from "./AppShell";
import type { Provenance, Sensor } from "../lib/types";

type Props = {
  states: StateCollection;
  provenance: Provenance;
  aggregates: Aggregates;
  onNavigate: (page: AppPage) => void;
};

const WIDTH = 720;
const HEIGHT = 520;

/** Nearby state names to label lightly (demo context around Kaduna). */
const NEIGHBOR_LABELS = new Set([
  "Niger",
  "Kano",
  "Katsina",
  "Plateau",
  "Nasarawa",
  "Abuja Federal Capital Territory",
]);

export function MapPage({ states, provenance, aggregates, onNavigate }: Props) {
  const [sensor, setSensor] = useState<Sensor | "BOTH">("BOTH");
  const bbox = useMemo(() => collectionBBox(states.features), [states]);
  const kaduna = states.features.find((f) => f.properties.focus);
  const kadunaLabel = useMemo(
    () => (kaduna ? featureLabelPoint(kaduna, bbox, WIDTH, HEIGHT) : null),
    [kaduna, bbox],
  );
  const coverage =
    sensor === "BOTH" ? null : provenance.sensors[sensor];

  const monthMax = Math.max(
    ...aggregates.by_month.map((m) =>
      sensor === "MODIS"
        ? m.MODIS
        : sensor === "VIIRS_SNPP"
          ? m.VIIRS_SNPP
          : m.MODIS + m.VIIRS_SNPP,
    ),
    1,
  );

  const totalForSensor =
    sensor === "MODIS"
      ? provenance.sensors.MODIS.raw_detections
      : sensor === "VIIRS_SNPP"
        ? provenance.sensors.VIIRS_SNPP.raw_detections
        : provenance.total_raw_detections;

  return (
    <div className="workspace map-page">
      <div className="page-head">
        <div>
          <h1>Historical fire map</h1>
          <p className="lede">
            Demo focus: <strong>Kaduna State</strong> — the only polygon wired to
            the verified weekly handoff. Other states are shown for geographic
            context only.
          </p>
        </div>
      </div>

      <div className="disclosure">
        DEMO STATE · Kaduna (NG-KD). Boundary: {provenance.boundary.source} (
        {provenance.boundary.license}). Activity values are Kaduna weekly
        aggregates rolled to calendar month — not pixel footprints or national
        totals.
      </div>

      <div className="controls">
        <label className="control-select" style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
          State
          <select value="Kaduna" disabled aria-label="Demo state">
            <option value="Kaduna">Kaduna</option>
          </select>
        </label>
        <button
          type="button"
          className={`control-chip${sensor === "BOTH" ? " active" : ""}`}
          aria-pressed={sensor === "BOTH"}
          onClick={() => setSensor("BOTH")}
        >
          Both sensors
        </button>
        <button
          type="button"
          className={`control-chip${sensor === "MODIS" ? " active" : ""}`}
          aria-pressed={sensor === "MODIS"}
          onClick={() => setSensor("MODIS")}
        >
          MODIS
        </button>
        <button
          type="button"
          className={`control-chip${sensor === "VIIRS_SNPP" ? " active" : ""}`}
          aria-pressed={sensor === "VIIRS_SNPP"}
          onClick={() => setSensor("VIIRS_SNPP")}
        >
          VIIRS
        </button>
      </div>

      <div className="map-layout">
        <section className="map-stage panel-card">
          <div className="map-frame">
            <svg
              viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
              role="img"
              aria-label="Nigeria map with Kaduna highlighted as the demo state"
              className="nigeria-map"
            >
              {states.features.map((f) => {
                const focus = Boolean(f.properties.focus);
                return (
                  <path
                    key={f.properties.name}
                    d={projectPath(f, bbox, WIDTH, HEIGHT)}
                    className={focus ? "state focus" : "state"}
                  >
                    <title>
                      {focus
                        ? `Kaduna (demo) · ${totalForSensor.toLocaleString()} raw detections`
                        : `${f.properties.name} · context only`}
                    </title>
                  </path>
                );
              })}

              {states.features.map((f) => {
                if (!NEIGHBOR_LABELS.has(f.properties.name) || f.properties.focus) {
                  return null;
                }
                const pt = featureLabelPoint(f, bbox, WIDTH, HEIGHT);
                const short =
                  f.properties.name === "Abuja Federal Capital Territory"
                    ? "FCT"
                    : f.properties.name.toUpperCase();
                return (
                  <text
                    key={`label-${f.properties.name}`}
                    x={pt.x}
                    y={pt.y}
                    className="state-label neighbor"
                    textAnchor="middle"
                    dominantBaseline="middle"
                  >
                    {short}
                  </text>
                );
              })}

              {kadunaLabel && (
                <>
                  <text
                    x={kadunaLabel.x}
                    y={kadunaLabel.y - 10}
                    className="state-label focus"
                    textAnchor="middle"
                    dominantBaseline="middle"
                  >
                    KADUNA
                  </text>
                  <foreignObject
                    x={Math.min(WIDTH - 220, Math.max(8, kadunaLabel.x - 100))}
                    y={Math.min(HEIGHT - 64, kadunaLabel.y + 18)}
                    width={200}
                    height={56}
                  >
                    <div className="map-tooltip">
                      <strong>Kaduna</strong>
                      <span>
                        {totalForSensor.toLocaleString()} detections · demo
                      </span>
                    </div>
                  </foreignObject>
                </>
              )}
            </svg>
          </div>
          <div className="map-legend">
            <span>
              <i className="swatch focus" /> Kaduna (demo focus)
            </span>
            <span>
              <i className="swatch other" /> Other states (context only)
            </span>
          </div>
        </section>

        <aside className="state-panel panel-card">
          <p className="eyebrow">Selected state · demo</p>
          <h2>Kaduna</h2>
          <p className="muted" style={{ marginTop: 0 }}>
            North-west Nigeria · only state with verified weekly detections in
            this build
          </p>
          <div className="kpi-mini">
            <div>
              <strong>{totalForSensor.toLocaleString()}</strong>
              <span>raw detections</span>
            </div>
            <div>
              <strong>{provenance.weekly_rows.toLocaleString()}</strong>
              <span>positive weeks</span>
            </div>
          </div>
          {coverage ? (
            <p className="muted">
              {coverage.observed_detection_date_bounds[0]} →{" "}
              {coverage.observed_detection_date_bounds[1]}
            </p>
          ) : (
            <p className="muted">
              MODIS {provenance.sensors.MODIS.observed_detection_date_bounds[0]} →{" "}
              {provenance.sensors.MODIS.observed_detection_date_bounds[1]}
              <br />
              VIIRS{" "}
              {provenance.sensors.VIIRS_SNPP.observed_detection_date_bounds[0]} →{" "}
              {provenance.sensors.VIIRS_SNPP.observed_detection_date_bounds[1]}
            </p>
          )}
          <p className="muted">
            {kaduna
              ? `${kaduna.properties.name} · ${kaduna.properties.iso ?? "NG-KD"}`
              : "Kaduna boundary loaded from geoBoundaries / GRID3"}
          </p>
          <button
            type="button"
            className="btn-primary"
            onClick={() => onNavigate("calendar")}
          >
            Choose a week in calendar →
          </button>
          <button
            type="button"
            className="btn-ghost"
            onClick={() => onNavigate("season")}
          >
            Read this season’s briefing →
          </button>
        </aside>
      </div>

      <section className="panel-card">
        <div className="panel-card-head">
          <div>
            <h2>Historical monthly activity</h2>
            <p>
              Monthly raw detections · <strong>Kaduna</strong> · verified archive
            </p>
          </div>
        </div>
        <div className="month-bars">
          {aggregates.by_month.map((m) => {
            const value =
              sensor === "MODIS"
                ? m.MODIS
                : sensor === "VIIRS_SNPP"
                  ? m.VIIRS_SNPP
                  : m.MODIS + m.VIIRS_SNPP;
            const pct = (value / monthMax) * 100;
            return (
              <div className="month-bar" key={m.month}>
                <span className="month-label">
                  {MONTH_NAMES[m.month - 1].slice(0, 3)}
                </span>
                <div className="month-track">
                  <div className="month-fill" style={{ height: `${pct}%` }} />
                </div>
                <span className="month-value">{value.toLocaleString()}</span>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
