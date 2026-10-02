/**
 * Geodesic circles for hotspot radii.
 *
 * MapLibre circle layers are pixel radii, which change with zoom and would
 * misstate a radius given in meters. These polygons are built on the ellipsoid
 * so a 2400 m zone stays 2400 m on the ground.
 */

const EARTH_RADIUS_M = 6371008.8;

function destination(latitude, longitude, distanceM, bearingDeg) {
  const delta = distanceM / EARTH_RADIUS_M;
  const theta = (bearingDeg * Math.PI) / 180;
  const lat1 = (latitude * Math.PI) / 180;
  const lon1 = (longitude * Math.PI) / 180;
  const sinLat1 = Math.sin(lat1);
  const cosLat1 = Math.cos(lat1);
  const sinDelta = Math.sin(delta);
  const cosDelta = Math.cos(delta);

  const sinLat2 = sinLat1 * cosDelta + cosLat1 * sinDelta * Math.cos(theta);
  const lat2 = Math.asin(sinLat2);
  const y = Math.sin(theta) * sinDelta * cosLat1;
  const x = cosDelta - sinLat1 * sinLat2;
  const lon2 = lon1 + Math.atan2(y, x);

  const lng = (((lon2 * 180) / Math.PI + 540) % 360) - 180;
  const lat = (lat2 * 180) / Math.PI;
  return [lng, lat];
}

export function circlePolygon(latitude, longitude, radiusM, steps = 72) {
  const ring = [];
  for (let i = 0; i < steps; i += 1) {
    ring.push(destination(latitude, longitude, radiusM, (i / steps) * 360));
  }
  ring.reverse();
  ring.push(ring[0]);
  return {
    type: "Feature",
    properties: {},
    geometry: {
      type: "Polygon",
      coordinates: [ring],
    },
  };
}

export function isDrawableHotspot(hotspot) {
  if (!hotspot || typeof hotspot !== "object") return false;
  const latitude = Number(hotspot.latitude);
  const longitude = Number(hotspot.longitude);
  const radius = Number(hotspot.radius);
  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    Number.isFinite(radius) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180 &&
    radius > 0
  );
}

export function normalizeHotspot(raw) {
  if (!isDrawableHotspot(raw)) return null;
  const latitude = Number(raw.latitude);
  const longitude = Number(raw.longitude);
  return {
    hotspot_id: String(raw.hotspot_id ?? `${latitude.toFixed(5)},${longitude.toFixed(5)}`),
    radius: Number(raw.radius),
    risk_level: raw.risk_level === "HIGH" ? "HIGH" : "MODERATE",
    active_case_count: Number(raw.active_case_count) || 0,
    latitude,
    longitude,
  };
}

export function hotspotCollections(hotspots) {
  const high = [];
  const moderate = [];
  const centers = [];

  for (const hotspot of hotspots) {
    const polygon = circlePolygon(hotspot.latitude, hotspot.longitude, hotspot.radius);
    const properties = {
      hotspot_id: hotspot.hotspot_id,
      risk: hotspot.risk_level,
      count: hotspot.active_case_count,
      radius: hotspot.radius,
    };
    polygon.properties = properties;
    (hotspot.risk_level === "HIGH" ? high : moderate).push(polygon);
    centers.push({
      type: "Feature",
      properties,
      geometry: {
        type: "Point",
        coordinates: [hotspot.longitude, hotspot.latitude],
      },
    });
  }

  return {
    high: { type: "FeatureCollection", features: high },
    moderate: { type: "FeatureCollection", features: moderate },
    centers: { type: "FeatureCollection", features: centers },
  };
}

/** Zoom so the zone diameter occupies roughly a third of the map width. */
export function zoomForRadius(radiusMeters, latitude, viewportWidth) {
  const width = Math.max(viewportWidth || 900, 320);
  const targetDiameterPx = Math.max(160, width * 0.32);
  const metersPerPixel = (radiusMeters * 2) / targetDiameterPx;
  const latCos = Math.cos((latitude * Math.PI) / 180) || 0.2;
  const zoom = Math.log2((156543.03392 * latCos) / metersPerPixel);
  return Math.max(10, Math.min(15.5, zoom));
}
