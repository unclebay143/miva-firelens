import type { ReactNode } from "react";

export type AppPage =
  | "overview"
  | "map"
  | "calendar"
  | "season"
  | "about";

const NAV: { id: AppPage; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "map", label: "Fire map" },
  { id: "calendar", label: "Fire calendar" },
  { id: "season", label: "Season cards" },
  { id: "about", label: "About the data" },
];

type Props = {
  page: AppPage;
  onNavigate: (page: AppPage) => void;
  children: ReactNode;
};

export function AppShell({ page, onNavigate, children }: Props) {
  return (
    <div className="app-shell">
      <div className="shell-card">
        <header className="topbar">
          <div className="brand-lockup">
            <img src={`${import.meta.env.BASE_URL}assets/logo.svg`} alt="" width={30} height={30} />
            <span className="wordmark">FireLens</span>
          </div>
          <nav className="top-nav" aria-label="Primary">
            {NAV.map((item) => (
              <button
                key={item.id}
                type="button"
                aria-pressed={page === item.id}
                onClick={() => onNavigate(item.id)}
              >
                {item.label}
              </button>
            ))}
          </nav>
          <div className="live-status">
            <span className="dot" aria-hidden="true" />
            Historical data · NASA FIRMS
          </div>
        </header>

        <main>{children}</main>

        <footer className="footer-bar">
          <span>Source: NASA FIRMS · MODIS C6.1 & VIIRS active-fire products</span>
          <span>Kaduna archive · Not for operational decisions</span>
        </footer>
      </div>
    </div>
  );
}
