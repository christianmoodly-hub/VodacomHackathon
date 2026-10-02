/**
 * SHE-SHIELD Response API.
 *
 * On a phone, localhost is the phone itself, so the app stays offline unless
 * EXPO_PUBLIC_API_BASE_URL points at the computer running the API.
 * A direct call returns a JSON object. API Gateway can also return
 * `{ statusCode, body }` where `body` is a JSON string. Both shapes are read here.
 */

export const API_BASE_URL = (process.env.EXPO_PUBLIC_API_BASE_URL || "").replace(/\/$/, "");

function unwrap(payload) {
  if (
    payload &&
    typeof payload === "object" &&
    typeof payload.body === "string" &&
    Object.prototype.hasOwnProperty.call(payload, "statusCode")
  ) {
    return { statusCode: payload.statusCode, data: JSON.parse(payload.body) };
  }
  return { statusCode: null, data: payload };
}

export async function api(path, options = {}) {
  if (!API_BASE_URL) {
    throw new Error("Cannot reach the review API");
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4000);
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    });
  } catch (error) {
    const offline = new Error("Cannot reach the review API");
    offline.cause = error;
    throw offline;
  } finally {
    clearTimeout(timer);
  }

  const text = await response.text();
  let payload = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = null;
    }
  }
  let parsed;
  try {
    parsed = unwrap(payload);
  } catch {
    throw new Error("Malformed API response");
  }
  const status = parsed.statusCode ?? response.status;
  if (!response.ok || status >= 400) {
    const message = (parsed.data && parsed.data.error) || `Request failed (${status || response.status})`;
    const error = new Error(message);
    error.status = status || response.status;
    throw error;
  }
  if (!parsed.data || typeof parsed.data !== "object") {
    throw new Error("Empty response from the review API");
  }
  return parsed.data;
}

export function postBrief(body) {
  return api("/brief", { method: "POST", body: JSON.stringify(body) });
}

export function postDecision(body) {
  return api("/decision", { method: "POST", body: JSON.stringify(body) });
}

export function getAudit() {
  return api("/audit");
}
