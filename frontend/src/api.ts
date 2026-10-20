import type { PlanResponse, Place, TripInput } from "./types";

export class ApiError extends Error {}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  let resp: Response;
  try {
    resp = await fetch(url, init);
  } catch (err) {
    if ((err as Error).name === "AbortError") throw err;
    throw new ApiError("Could not reach the server. Check your connection and try again.");
  }
  const body = await resp.json().catch(() => null);
  if (!resp.ok) throw new ApiError(describeError(body) ?? `Request failed (${resp.status})`);
  return body as T;
}

function describeError(body: unknown): string | undefined {
  if (!body || typeof body !== "object") return undefined;
  const obj = body as Record<string, unknown>;
  if (typeof obj.detail === "string") return obj.detail;
  const first = Object.entries(obj)[0];
  if (!first) return undefined;
  const [field, msg] = first;
  return `${field}: ${Array.isArray(msg) ? msg.join(" ") : JSON.stringify(msg)}`;
}

export const planTrip = (input: TripInput, signal?: AbortSignal) =>
  request<PlanResponse>("/api/plan/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
    signal,
  });

export const searchPlaces = (q: string, signal?: AbortSignal) =>
  request<Place[]>(`/api/geocode/?q=${encodeURIComponent(q)}`, { signal });
