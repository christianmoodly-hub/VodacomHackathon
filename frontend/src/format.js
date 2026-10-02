export function formatRadius(meters) {
  if (!Number.isFinite(meters)) return "—";
  if (meters >= 1000) {
    const km = meters / 1000;
    const digits = km >= 10 ? 0 : 1;
    return `${km.toFixed(digits)} km`;
  }
  return `${Math.round(meters)} m`;
}

export function formatCoord(latitude, longitude) {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return "—";
  const ns = latitude >= 0 ? "N" : "S";
  const ew = longitude >= 0 ? "E" : "W";
  return `${Math.abs(latitude).toFixed(5)}° ${ns}   ${Math.abs(longitude).toFixed(5)}° ${ew}`;
}

export function formatSync(date) {
  if (!date) return "—";
  return date.toLocaleTimeString("en-ZA", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

export function padCount(value) {
  return String(Math.max(0, Number(value) || 0)).padStart(2, "0");
}
