export type Sensor = "MODIS" | "VIIRS_SNPP";

export type WeeklyRecord = {
  area: string;
  year: number;
  week: number;
  sensor: Sensor;
  count: number;
  metric: string;
  record_status: string;
  observation_coverage: string;
};

export type SensorCoverage = {
  observed_detection_date_bounds: [string, string];
  missing_record_weeks: [number, number][];
  weekly_rows: number;
  raw_detections: number;
};

export type Provenance = {
  area: string;
  quality: string;
  metric: string;
  corrected: boolean;
  total_raw_detections: number;
  weekly_rows: number;
  sensors: Record<Sensor, SensorCoverage>;
  missing_count_policy: string;
  coverage_policy: string;
  modis_version_warning: string;
  boundary: {
    source: string;
    license: string;
    url: string;
  };
  limitations: string[];
};

export type PairedWeek = {
  area: string;
  year: number;
  week: number;
  monday: string;
  month: number;
  season: string;
  modis_version_era: string;
  MODIS: number;
  VIIRS_SNPP: number;
};

export type Comparison = {
  status: string;
  overlap_date_bounds: [string, string];
  method: string;
  overall: {
    n: number;
    modis_total: number;
    viirs_snpp_total: number;
    summed_count_ratio: number;
    weekly_ratio_median: number;
  };
  by_season: Record<
    string,
    {
      n: number;
      summed_count_ratio: number;
      weekly_ratio_median: number;
    }
  >;
  warning: string;
};

export type CellStatus =
  | "detections_present"
  | "missing_within_span"
  | "outside_span";

export type CalendarCell = {
  year: number;
  week: number;
  sensor: Sensor;
  count: number | null;
  status: CellStatus;
  monday: string | null;
  sunday: string | null;
};

export type SensorView = Sensor | "BOTH";
export type ScaleMode = "linear" | "log";
