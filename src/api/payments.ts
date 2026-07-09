import { ApiError } from "./client";
import { toPaymentMethodDto } from "./submitDonation";
import type { DonationTypeDto, PaymentMethodDto } from "./types";
import type { PaymentMethod } from "../types";

/** Kiosk payment agent can block until the user finishes on the terminal */
const PAYMENT_TIMEOUT_MS = 180_000;

const PAYMENTS_PATH = "/api/donations/payments";
const CANCEL_PENDING_PATH = "/api/donations/payments/cancel-pending";

export interface ProcessPaymentRequest {
  merchantUid: string;
  campaignId: number;
  totalAmount: number;
  paymentMethod: PaymentMethodDto;
  /** 기부 대상 유형 — NGO=캠페인, SCHOOL=학교(같은 campaignId 필드에 학교 id) */
  type: DonationTypeDto;
}

export interface ProcessPaymentResponse {
  message: string;
}

export interface CancelPendingPaymentRequest {
  merchantUid: string;
}

export interface CancelPendingPaymentResponse {
  message: string;
}

interface PaymentApiEnvelope<T> {
  success?: boolean;
  code?: number;
  message?: string;
  data?: T;
  errorCode?: string;
}

function resolvePaymentApiUrl(path: string): string {
  const configured = (import.meta.env.VITE_PAYMENT_API_BASE_URL ?? "").trim();
  if (configured) {
    return `${configured.replace(/\/$/, "")}${path}`;
  }
  // Dev / same-origin kiosk: route through Vite proxy or local payment agent
  return path;
}

function isPaymentConnectionError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return (
    error.name === "AbortError" ||
    message.includes("failed to fetch") ||
    message.includes("networkerror") ||
    message.includes("load failed") ||
    message.includes("network request failed")
  );
}

function toPaymentApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;

  if (error instanceof DOMException && error.name === "AbortError") {
    return new ApiError(
      "결제 시간이 초과되었습니다. 카드 결제를 다시 시도해 주세요.",
    );
  }

  if (isPaymentConnectionError(error)) {
    return new ApiError(
      "결제 단말기에 연결할 수 없습니다. 결제 프로그램이 실행 중인지 확인해 주세요.",
    );
  }

  if (error instanceof Error && error.message.trim()) {
    return new ApiError(error.message);
  }

  return new ApiError("결제 처리 중 오류가 발생했습니다");
}

async function parsePaymentEnvelope<T>(
  response: Response,
): Promise<PaymentApiEnvelope<T>> {
  const text = await response.text();

  if (!text.trim()) {
    return {
      success: response.ok,
      code: response.status,
      message: response.ok ? "OK" : `Payment failed (${response.status})`,
    };
  }

  try {
    return JSON.parse(text) as PaymentApiEnvelope<T>;
  } catch {
    return {
      success: response.ok,
      code: response.status,
      message: text,
    };
  }
}

async function paymentFetch<T>(
  path: string,
  payload: unknown,
  timeoutMs = PAYMENT_TIMEOUT_MS,
): Promise<T> {
  const url = resolvePaymentApiUrl(path);
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    const body = await parsePaymentEnvelope<T>(response);
    const succeeded = response.ok && body.success !== false;

    if (!succeeded) {
      throw new ApiError(
        body.message || `Payment failed (${response.status})`,
        response.status,
        body.code,
        body.errorCode,
      );
    }

    return (body.data ?? { message: body.message ?? "OK" }) as T;
  } catch (error) {
    throw toPaymentApiError(error);
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export function createMerchantUid(): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, "");
  const suffix = String(now.getTime()).slice(-8);
  return `DONATION_${date}_${suffix}`;
}

export async function processPayment(
  payload: ProcessPaymentRequest,
): Promise<ProcessPaymentResponse> {
  return paymentFetch<ProcessPaymentResponse>(PAYMENTS_PATH, payload);
}

export async function cancelPendingPayment(
  payload: CancelPendingPaymentRequest,
): Promise<CancelPendingPaymentResponse> {
  return paymentFetch<CancelPendingPaymentResponse>(
    CANCEL_PENDING_PATH,
    payload,
    30_000,
  );
}

export function buildPaymentRequest(
  merchantUid: string,
  campaignId: string | number,
  totalAmount: number,
  method: PaymentMethod,
  type: DonationTypeDto,
): ProcessPaymentRequest {
  return {
    merchantUid,
    campaignId: Number(campaignId),
    totalAmount,
    paymentMethod: toPaymentMethodDto(method),
    type,
  };
}
