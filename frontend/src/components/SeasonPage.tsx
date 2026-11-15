import {
  buildOutlook,
  computeSensorInsights,
  type InsightCard,
} from "../lib/insights";
import type { Provenance, WeeklyRecord } from "../lib/types";

type Props = {
  weeks: WeeklyRecord[];
  provenance: Provenance;
};

function Tile({ card, dark }: { card: InsightCard; dark?: boolean }) {
  return (
    <article className={`insight-tile${dark ? " dark" : ""}`}>
      <div className="value">{card.metricValue}</div>
      <div className="label">{card.metricLabel}</div>
      <p className="detail">{card.headline}</p>
      <p className="detail">{card.detail}</p>
    </article>
  );
}

export function SeasonPage({ weeks, provenance }: Props) {
  const modis = computeSensorInsights(weeks, provenance, "MODIS");
  const viirs = computeSensorInsights(weeks, provenance, "VIIRS_SNPP");
  const outlook = buildOutlook(modis, viirs);

  return (
    <div className="insights-page">
      <div className="page-head">
        <div>
          <h1>Season cards</h1>
          <p className="lede">
            Plain-language detection rates from the Kaduna archive — seasonal
            context, not day-level fire forecasts.
          </p>
        </div>
      </div>

      <div className="disclosure">
        Historical week-detection rates use ISO weeks assigned to calendar months
        by their Monday date. Day-of-week odds are not available from weekly
        totals.
      </div>

      <div className="insights-grid">
        {outlook.map((card, i) => (
          <Tile key={card.id} card={card} dark={i === 0} />
        ))}
      </div>

      <h2 style={{ margin: "8px 0 0", fontSize: 18 }}>MODIS</h2>
      <div className="insights-grid">
        {modis.recommendations.map((card) => (
          <Tile key={card.id} card={card} />
        ))}
      </div>

      <div className="insight-table-wrap">
        <h3>MODIS by month</h3>
        <table className="insight-table">
          <thead>
            <tr>
              <th>Month</th>
              <th>Week detection rate</th>
              <th>Share of detections</th>
              <th>Median when present</th>
            </tr>
          </thead>
          <tbody>
            {modis.months.map((m) => (
              <tr key={m.month}>
                <td>{m.name}</td>
                <td>
                  <div className="rate-cell">
                    <span
                      className="rate-bar"
                      style={{ width: `${m.detectionWeekRate * 100}%` }}
                    />
                    <span>{Math.round(m.detectionWeekRate * 100)}%</span>
                  </div>
                </td>
                <td>{Math.round(m.detectionShare * 100)}%</td>
                <td>
                  {m.medianWhenPresent != null
                    ? Math.round(m.medianWhenPresent).toLocaleString()
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 style={{ margin: "8px 0 0", fontSize: 18 }}>VIIRS Suomi-NPP</h2>
      <div className="insights-grid">
        {viirs.recommendations.map((card) => (
          <Tile key={card.id} card={card} />
        ))}
      </div>

      <div className="insight-table-wrap">
        <h3>VIIRS by month</h3>
        <table className="insight-table">
          <thead>
            <tr>
              <th>Month</th>
              <th>Week detection rate</th>
              <th>Share of detections</th>
              <th>Median when present</th>
            </tr>
          </thead>
          <tbody>
            {viirs.months.map((m) => (
              <tr key={m.month}>
                <td>{m.name}</td>
                <td>
                  <div className="rate-cell">
                    <span
                      className="rate-bar"
                      style={{ width: `${m.detectionWeekRate * 100}%` }}
                    />
                    <span>{Math.round(m.detectionWeekRate * 100)}%</span>
                  </div>
                </td>
                <td>{Math.round(m.detectionShare * 100)}%</td>
                <td>
                  {m.medianWhenPresent != null
                    ? Math.round(m.medianWhenPresent).toLocaleString()
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
