import { useEffect, useMemo, useState } from "react";
import { AboutPage } from "./components/AboutPage";
import { AppShell, type AppPage } from "./components/AppShell";
import { CalendarPage } from "./components/CalendarPage";
import { MapPage } from "./components/MapPage";
import { OverviewPage } from "./components/OverviewPage";
import { SeasonPage } from "./components/SeasonPage";
import { buildIndex } from "./lib/calendar";
import { loadFireLensData, type FireLensData } from "./lib/data";

export default function App() {
  const [data, setData] = useState<FireLensData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<AppPage>("overview");

  useEffect(() => {
    const controller = new AbortController();
    loadFireLensData(controller.signal)
      .then(setData)
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Failed to load data");
      });
    return () => controller.abort();
  }, []);

  const index = useMemo(
    () => (data ? buildIndex(data.weeks) : new Map()),
    [data],
  );

  if (error) {
    return (
      <div className="app-shell">
        <div className="status-banner error">{error}</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="app-shell">
        <div className="status-banner">Loading Kaduna weekly detections…</div>
      </div>
    );
  }

  return (
    <AppShell page={page} onNavigate={setPage}>
      {page === "overview" && (
        <OverviewPage
          weeks={data.weeks}
          provenance={data.provenance}
          comparison={data.comparison}
          aggregates={data.aggregates}
          onNavigate={setPage}
        />
      )}
      {page === "map" && (
        <MapPage
          states={data.states}
          provenance={data.provenance}
          aggregates={data.aggregates}
          onNavigate={setPage}
        />
      )}
      {page === "calendar" && (
        <CalendarPage
          weeks={data.weeks}
          provenance={data.provenance}
          index={index}
          onOpenSeason={() => setPage("season")}
        />
      )}
      {page === "season" && (
        <SeasonPage weeks={data.weeks} provenance={data.provenance} />
      )}
      {page === "about" && (
        <AboutPage
          provenance={data.provenance}
          comparison={data.comparison}
          onNavigate={setPage}
        />
      )}
    </AppShell>
  );
}
