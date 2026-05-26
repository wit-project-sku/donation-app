import { ApiError, buildUrl } from "./client";
import type {
  DonationDetailsResponse,
  PaymentMethodDto,
  SubmitDonationDetailsPayload,
} from "./types";
import type { PaymentMethod } from "../types";

const SUBMIT_PATH = "/api/donations/details";

type SubmitEnvelope = {
  success?: boolean;
  code?: number;
  message?: string;
  data?: DonationDetailsResponse | null;
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

function fallbackRecord(payload: SubmitDonationDetailsPayload): DonationDetailsResponse {
  return {
    campaignName: "",
    imageUrl: payload.imageUrl,
    amount: 0,
    donatorName: payload.donatorName,
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
  photoBlob?: Blob | null,
): Promise<DonationDetailsResponse> {
  const form = new FormData();

  // "data" part — JSON object; sent as application/json so Spring @RequestPart can deserialize it
  form.append(
    "data",
    new Blob([JSON.stringify(payload)], { type: "application/json" }),
  );

  // "photo" part — raw binary image; only added when we have an actual blob
  if (photoBlob) {
    form.append("photo", photoBlob, "photo.jpg");
  }

  const response = await fetch(buildUrl(SUBMIT_PATH), {
    method: "POST",
    // Do NOT set Content-Type — browser sets it automatically with the multipart boundary
    body: form,
  });

  const body = (await response.json()) as SubmitEnvelope;

  if (response.ok && body.success !== false) {
    if (body.data && typeof body.data === "object") return body.data;
    return fallbackRecord(payload);
  }

  if (isAlreadySavedMessage(body.message)) {
    return fallbackRecord(payload);
  }

  throw new ApiError(
    body.message || `Request failed (${response.status})`,
    response.status,
    body.code,
    body.errorCode,
  );
}
