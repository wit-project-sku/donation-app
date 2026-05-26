import { apiPost } from "./client";
import type {
  PaymentHistoryDto,
  PaymentMethodDto,
  SubmitDonationDetailsPayload,
} from "./types";
import type { PaymentMethod } from "../types";

const SUBMIT_PATH = "/api/donations/details";

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
  payload: SubmitDonationDetailsPayload,
): Promise<PaymentHistoryDto> {
  return apiPost<PaymentHistoryDto, SubmitDonationDetailsPayload>(
    SUBMIT_PATH,
    payload,
  );
}
