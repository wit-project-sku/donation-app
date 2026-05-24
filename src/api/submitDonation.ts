import { apiPost } from "./client";
import type { PaymentHistoryDto, PaymentMethodDto, SubmitDonationPayload } from "./types";
import type { PaymentMethod } from "../types";

const SUBMIT_PATH = "/api/donations/payment";

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

export async function submitDonation(
  payload: SubmitDonationPayload,
): Promise<PaymentHistoryDto> {
  return apiPost<PaymentHistoryDto, SubmitDonationPayload>(
    SUBMIT_PATH,
    payload,
  );
}
