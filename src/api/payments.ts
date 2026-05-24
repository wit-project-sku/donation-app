import { ApiError } from "./client";
import { toPaymentMethodDto } from "./submitDonation";
import type { PaymentMethodDto } from "./types";
import type { PaymentMethod } from "../types";

/** Kiosk payment terminal API (separate origin from donation CMS API) */
const PAYMENT_API_BASE = (
  import.meta.env.VITE_PAYMENT_API_BASE_URL ?? "http://127.0.0.1:8080"
).replace(/\/$/, "");

const PAYMENTS_PATH = "/api/donations/payments";

export interface ProcessPaymentRequest {
  merchantUid: string;
  campaignId: number;
  totalAmount: number;
  paymentMethod: PaymentMethodDto;
}

export interface ProcessPaymentResponse {
  message: string;
}

interface PaymentApiEnvelope<T> {
  success: boolean;
  code: number;
  message: string;
  data?: T;
  errorCode?: string;
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
  const url = `${PAYMENT_API_BASE}${PAYMENTS_PATH}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const body = (await response.json()) as PaymentApiEnvelope<ProcessPaymentResponse>;

  if (!response.ok || !body.success) {
    throw new ApiError(
      body.message || `Payment failed (${response.status})`,
      response.status,
      body.code,
      body.errorCode,
    );
  }

  return body.data ?? { message: body.message };
}

export function buildPaymentRequest(
  merchantUid: string,
  campaignId: string | number,
  totalAmount: number,
  method: PaymentMethod,
): ProcessPaymentRequest {
  return {
    merchantUid,
    campaignId: Number(campaignId),
    totalAmount,
    paymentMethod: toPaymentMethodDto(method),
  };
}
