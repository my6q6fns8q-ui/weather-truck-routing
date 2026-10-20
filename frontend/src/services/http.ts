export type ApiErrorCode = "network" | "server";

export class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly status?: number;
  readonly detail?: string;

  constructor(
    code: ApiErrorCode,
    options: { status?: number; detail?: string } = {},
  ) {
    super(
      options.detail ??
        (options.status ? `Request failed (${options.status})` : code),
    );
    this.name = "ApiError";
    this.code = code;
    this.status = options.status;
    this.detail = options.detail;
  }
}

export const isAbort = (error: unknown) =>
  error instanceof Error && error.name === "AbortError";

const API_BASE = "/api";

export interface RequestOptions {
  method?: "GET" | "POST";
  body?: unknown;
  query?: Record<string, string | number | undefined>;
  signal?: AbortSignal;
}

export async function request<T>(
  path: string,
  { method = "GET", body, query, signal }: RequestOptions = {},
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(API_BASE + path + searchParams(query), {
      method,
      signal,
      headers:
        body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (error) {
    if (isAbort(error)) throw error;
    throw new ApiError("network");
  }

  const payload = await response.json().catch(() => null);
  if (!response.ok)
    throw new ApiError("server", {
      status: response.status,
      detail: describeError(payload),
    });
  return payload as T;
}

function searchParams(query: RequestOptions["query"]): string {
  if (!query) return "";
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) params.set(key, String(value));
  }
  const serialized = params.toString();
  return serialized ? `?${serialized}` : "";
}

function describeError(payload: unknown): string | undefined {
  if (!payload || typeof payload !== "object") return undefined;
  const body = payload as Record<string, unknown>;
  if (typeof body.detail === "string") return body.detail;

  const first = Object.entries(body)[0];
  if (!first) return undefined;
  const [field, message] = first;
  return `${field}: ${Array.isArray(message) ? message.join(" ") : JSON.stringify(message)}`;
}
