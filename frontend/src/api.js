/**
 * Talks to the SHE-SHIELD API.
 *
 * Local mock returns the JSON object directly. API Gateway returns
 * `{ statusCode, body }` where `body` is a JSON string. Both shapes are unwrapped here.
 */

const BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:4000").replace(
  /\/$/,
  "",
);

function unwrap(payload) {
  if (
    payload &&
    typeof payload === "object" &&
    typeof payload.body === "string" &&
    Object.prototype.hasOwnProperty.call(payload, "statusCode")
  ) {
    try {
      return { statusCode: payload.statusCode, data: JSON.parse(payload.body) };
    } catch {
      return { statusCode: payload.statusCode, data: { error: "Malformed API response" } };
    }
  }
  return { statusCode: null, data: payload };
}

export async function api(path, options = {}) {
  const { signal, ...rest } = options;
  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      ...rest,
      signal,
      headers: {
        "Content-Type": "application/json",
        ...(rest.headers || {}),
      },
    });
  } catch (error) {
    if (error?.name === "AbortError") throw error;
    const offline = new Error("Cannot reach the dispatch API");
    offline.cause = error;
    throw offline;
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

  const { statusCode, data } = unwrap(payload);
  const status = statusCode ?? response.status;
  if (!response.ok || status >= 400) {
    const message =
      (data && typeof data.error === "string" && data.error) ||
      `Request failed (${status || response.status})`;
    const error = new Error(message);
    error.status = status || response.status;
    throw error;
  }

  if (!data || typeof data !== "object") {
    throw new Error("Empty response from the dispatch API");
  }
  return data;
}

export function getHotspots(signal) {
  return api("/hotspots", { signal });
}

export function createCase(body) {
  return api("/cases", { method: "POST", body: JSON.stringify(body) });
}

export function correlateCases() {
  return api("/correlate", { method: "POST" });
}
