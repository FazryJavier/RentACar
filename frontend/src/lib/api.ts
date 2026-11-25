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

/** A non-2xx API response (or an unreadable body), with the HTTP status and envelope details. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly errors: ApiFieldError[] = [],
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function isEnvelope(value: unknown): value is Envelope<unknown> {
  return typeof value === "object" && value !== null && "success" in value && "code" in value;
}

/**
 * GET `/api/v1{path}` on the same origin (Sanctum cookies) and return the envelope's `data`.
 * Throws `ApiError` for non-2xx responses or bodies that are not an API envelope.
 */
export async function apiGet<T>(path: string, init: { signal?: AbortSignal } = {}): Promise<T> {
  const response = await fetch(`/api/v1${path}`, {
    method: "GET",
    credentials: "same-origin",
    headers: { Accept: "application/json" },
    signal: init.signal,
  });

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new ApiError(response.status, GENERIC_MESSAGE);
  }

  if (!isEnvelope(body)) {
    throw new ApiError(response.status, GENERIC_MESSAGE);
  }

  if (!response.ok || !body.success) {
    throw new ApiError(response.status, body.message || GENERIC_MESSAGE, body.errors ?? []);
  }

  return body.data as T;
}
