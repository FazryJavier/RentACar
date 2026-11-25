/** Error shape inside the API envelope's `errors` array. */
export type ApiFieldError = {
  field: string | null;
  code: string;
  message: string;
  details?: unknown;
};

type Envelope<T> = {
  code: number;
  success: boolean;
  message: string;
  data: T;
  errors: ApiFieldError[] | null;
  meta: unknown;
};

const GENERIC_MESSAGE = "Terjadi kesalahan pada server.";
const XSRF_COOKIE = "XSRF-TOKEN";

/** A non-2xx API response (or an unreadable body), with the HTTP status and envelope details. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly errors: ApiFieldError[] = [],
    /** Seconds from `Retry-After` (429). */
    readonly retryAfter?: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/** Field → first message, for showing server validation errors on form fields. */
export function fieldErrors(error: unknown): Record<string, string> {
  if (!(error instanceof ApiError)) {
    return {};
  }

  const result: Record<string, string> = {};
  for (const item of error.errors) {
    if (item.field && !(item.field in result)) {
      result[item.field] = item.message;
    }
  }
  return result;
}

function isEnvelope(value: unknown): value is Envelope<unknown> {
  return typeof value === "object" && value !== null && "success" in value && "code" in value;
}

function retryAfterFrom(response: Response): number | undefined {
  const value = Number(response.headers.get("Retry-After"));
  return Number.isFinite(value) && value > 0 ? value : undefined;
}

async function parse<T>(response: Response): Promise<T> {
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new ApiError(response.status, GENERIC_MESSAGE, [], retryAfterFrom(response));
  }

  if (!isEnvelope(body)) {
    throw new ApiError(response.status, GENERIC_MESSAGE, [], retryAfterFrom(response));
  }

  if (!response.ok || !body.success) {
    throw new ApiError(
      response.status,
      body.message || GENERIC_MESSAGE,
      body.errors ?? [],
      retryAfterFrom(response),
    );
  }

  return body.data as T;
}

/**
 * GET `/api/v1{path}` on the same origin (Sanctum session cookie) and return the envelope's `data`.
 * Throws `ApiError` for non-2xx responses or bodies that are not an API envelope.
 */
export async function apiGet<T>(path: string, init: { signal?: AbortSignal } = {}): Promise<T> {
  const response = await fetch(`/api/v1${path}`, {
    method: "GET",
    credentials: "include",
    headers: { Accept: "application/json" },
    signal: init.signal,
  });

  return parse<T>(response);
}

function readXsrfCookie(): string | null {
  if (typeof document === "undefined") {
    return null;
  }

  const entry = document.cookie.split("; ").find((cookie) => cookie.startsWith(`${XSRF_COOKIE}=`));
  return entry ? decodeURIComponent(entry.slice(XSRF_COOKIE.length + 1)) : null;
}

/** Asks Laravel Sanctum for a fresh `XSRF-TOKEN` cookie. */
async function refreshCsrfCookie(): Promise<void> {
  await fetch("/sanctum/csrf-cookie", {
    credentials: "include",
    headers: { Accept: "application/json" },
  });
}

async function send<T>(
  method: "POST" | "PATCH" | "PUT" | "DELETE",
  path: string,
  body?: unknown,
): Promise<T> {
  const request = async (): Promise<Response> => {
    if (readXsrfCookie() === null) {
      await refreshCsrfCookie();
    }

    return fetch(`/api/v1${path}`, {
      method,
      credentials: "include",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-XSRF-TOKEN": readXsrfCookie() ?? "",
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  };

  let response = await request();

  if (response.status === 419) {
    // CSRF token expired (e.g. after the session was rotated): refresh it and retry once.
    await refreshCsrfCookie();
    response = await request();
  }

  return parse<T>(response);
}

export function apiPost<T>(path: string, body?: unknown): Promise<T> {
  return send<T>("POST", path, body);
}

export function apiPatch<T>(path: string, body?: unknown): Promise<T> {
  return send<T>("PATCH", path, body);
}

export function apiPut<T>(path: string, body?: unknown): Promise<T> {
  return send<T>("PUT", path, body);
}
