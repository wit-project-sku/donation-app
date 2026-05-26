import type { ApiResponse } from "./types";

const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");

export class ApiError extends Error {
  readonly status?: number;
  readonly code?: number;
  readonly errorCode?: string;

  constructor(
    message: string,
    status?: number,
    code?: number,
    errorCode?: string,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.errorCode = errorCode;
  }
}

export function buildUrl(
  path: string,
  params?: Record<string, string | number | undefined>,
): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = API_BASE
    ? new URL(`${API_BASE}${normalizedPath}`)
    : new URL(normalizedPath, window.location.origin);

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== "") {
        url.searchParams.set(key, String(value));
      }
    }
  }

  return url.toString();
}

export async function apiGet<T>(
  path: string,
  params?: Record<string, string | number | undefined>,
): Promise<T> {
  const url = buildUrl(path, params);
  const response = await fetch(url, {
    method: "GET",
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new ApiError(
      `Request failed (${response.status})`,
      response.status,
    );
  }

  const body = (await response.json()) as ApiResponse<T>;

  if (!body.success) {
    throw new ApiError(
      body.message || "Request was not successful",
      response.status,
      body.code,
    );
  }

  return body.data;
}

export async function apiPost<T, B = unknown>(
  path: string,
  body: B,
): Promise<T> {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = API_BASE
    ? new URL(`${API_BASE}${normalizedPath}`)
    : new URL(normalizedPath, window.location.origin);

  const response = await fetch(url.toString(), {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const envelope = (await response.json()) as ApiResponse<T> & {
    errorCode?: string;
  };

  if (!response.ok || !envelope.success) {
    throw new ApiError(
      envelope.message || `Request failed (${response.status})`,
      response.status,
      envelope.code,
      envelope.errorCode,
    );
  }

  return envelope.data;
}

export async function apiPostForm<T>(
  path: string,
  form: FormData,
): Promise<T> {
  const response = await fetch(buildUrl(path), {
    method: "POST",
    headers: { Accept: "application/json" },
    body: form,
  });

  const envelope = (await response.json()) as ApiResponse<T> & {
    errorCode?: string;
  };

  if (!response.ok || !envelope.success) {
    throw new ApiError(
      envelope.message || `Request failed (${response.status})`,
      response.status,
      envelope.code,
      envelope.errorCode,
    );
  }

  return envelope.data;
}
