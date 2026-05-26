import { ApiError, buildUrl } from "./client";
import type {
  PaymentHistoryDto,
  PaymentMethodDto,
  SubmitDonationDetailsPayload,
} from "./types";
import type { PaymentMethod } from "../types";

const SUBMIT_PATH = "/api/donations/details";

type SubmitEnvelope = {
  success?: boolean;
  code?: number;
  message?: string;
  data?: PaymentHistoryDto | boolean | null;
  errorCode?: string;
};

export function toPaymentMethodDto(method: PaymentMethod): PaymentMethodDto {
  switch (method) {
    case "card":
      return "CARD";
    case "kakao":
      return "KAKAO";
    case "naver":
      return "NAVER";
    default:
      return "CARD";
  }
}

function fallbackRecord(payload: SubmitDonationDetailsPayload): PaymentHistoryDto {
  return {
    id: Date.now(),
    campaignName: "기부",
    totalAmount: 0,
    paymentMethod: "CARD",
    donatorName: payload.donatorName,
    photoUrl: payload.imageUrl,
    donatedAt: new Date().toISOString(),
  };
}

function isAlreadySavedMessage(message?: string) {
  if (!message) return false;
  const normalized = message.toLowerCase();
  return (
    normalized.includes("already") ||
    normalized.includes("duplicate") ||
    normalized.includes("이미") ||
    normalized.includes("중복")
  );
}

export async function submitDonation(
  payload: SubmitDonationDetailsPayload,
): Promise<PaymentHistoryDto> {
  const response = await fetch(buildUrl(SUBMIT_PATH), {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const body = (await response.json()) as SubmitEnvelope | boolean;

  if (response.ok && body === true) {
    return fallbackRecord(payload);
  }

  if (typeof body === "object" && body) {
    if (response.ok && body.success !== false) {
      if (body.data && typeof body.data === "object") return body.data;
      return fallbackRecord(payload);
    }

    if (response.ok && isAlreadySavedMessage(body.message)) {
      return fallbackRecord(payload);
    }

    throw new ApiError(
      body.message || `Request failed (${response.status})`,
      response.status,
      body.code,
      body.errorCode,
    );
  }

  if (response.ok) return fallbackRecord(payload);

  throw new ApiError(`Request failed (${response.status})`, response.status);
}
