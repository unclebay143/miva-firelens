export type StateFeature = {
  type: "Feature";
  properties: { name: string; iso?: string; focus?: boolean };
  geometry: {
    type: "Polygon" | "MultiPolygon";
    coordinates: number[][][] | number[][][][];
  };
};

export type StateCollection = {
  type: "FeatureCollection";
  features: StateFeature[];
};

type BBox = { minLon: number; minLat: number; maxLon: number; maxLat: number };

function ringBBox(ring: number[][]): BBox {
  let minLon = Infinity,
    minLat = Infinity,
    maxLon = -Infinity,
    maxLat = -Infinity;
  for (const [lon, lat] of ring) {
    minLon = Math.min(minLon, lon);
    minLat = Math.min(minLat, lat);
    maxLon = Math.max(maxLon, lon);
    maxLat = Math.max(maxLat, lat);
  }
  return { minLon, minLat, maxLon, maxLat };
}

export function featureBBox(feature: StateFeature): BBox {
  const coords = feature.geometry.coordinates;
  const rings: number[][][] =
    feature.geometry.type === "Polygon"
      ? (coords as number[][][])
      : (coords as number[][][][]).flat();
  let box = ringBBox(rings[0]);
  for (const ring of rings.slice(1)) {
    const b = ringBBox(ring);
    box = {
      minLon: Math.min(box.minLon, b.minLon),
      minLat: Math.min(box.minLat, b.minLat),
      maxLon: Math.max(box.maxLon, b.maxLon),
      maxLat: Math.max(box.maxLat, b.maxLat),
    };
  }
  return box;
}

export function collectionBBox(features: StateFeature[]): BBox {
  return features.reduce((acc, f) => {
    const b = featureBBox(f);
    return {
      minLon: Math.min(acc.minLon, b.minLon),
      minLat: Math.min(acc.minLat, b.minLat),
      maxLon: Math.max(acc.maxLon, b.maxLon),
      maxLat: Math.max(acc.maxLat, b.maxLat),
    };
  }, featureBBox(features[0]));
}

function projectSetup(bbox: BBox, width: number, height: number, pad = 16) {
  const spanLon = bbox.maxLon - bbox.minLon || 1;
  const spanLat = bbox.maxLat - bbox.minLat || 1;
  const scale = Math.min(
    (width - pad * 2) / spanLon,
    (height - pad * 2) / spanLat,
  );
  const ox = (width - spanLon * scale) / 2;
  const oy = (height - spanLat * scale) / 2;
  const toXY = (lon: number, lat: number) => ({
    x: ox + (lon - bbox.minLon) * scale,
    y: oy + (bbox.maxLat - lat) * scale,
  });
  return { toXY };
}

/** Approximate visual centroid from outer ring average (good enough for labels). */
export function featureLabelPoint(
  feature: StateFeature,
  bbox: BBox,
  width: number,
  height: number,
  pad = 16,
): { x: number; y: number } {
  const { toXY } = projectSetup(bbox, width, height, pad);
  const outer =
    feature.geometry.type === "Polygon"
      ? (feature.geometry.coordinates as number[][][])[0]
      : (feature.geometry.coordinates as number[][][][])[0][0];
  let lon = 0;
  let lat = 0;
  for (const [x, y] of outer) {
    lon += x;
    lat += y;
  }
  const n = outer.length || 1;
  return toXY(lon / n, lat / n);
}

export function projectPath(
  feature: StateFeature,
  bbox: BBox,
  width: number,
  height: number,
  pad = 16,
): string {
  const { toXY } = projectSetup(bbox, width, height, pad);

  const ringPath = (ring: number[][]) =>
    ring
      .map((pt, i) => {
        const { x, y } = toXY(pt[0], pt[1]);
        return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ") + " Z";

  if (feature.geometry.type === "Polygon") {
    return (feature.geometry.coordinates as number[][][])
      .map(ringPath)
      .join(" ");
  }
  return (feature.geometry.coordinates as number[][][][])
    .map((poly) => poly.map(ringPath).join(" "))
    .join(" ");
}
