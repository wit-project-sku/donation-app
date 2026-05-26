import { apiPostForm } from "./client";
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
  const form = new FormData();
  form.append(
    "data",
    new Blob([JSON.stringify(payload.data)], {
      type: "application/json",
    }),
  );

  if (payload.photo) {
    form.append("photo", payload.photo, "donation-photo.jpg");
  }

  return apiPostForm<PaymentHistoryDto>(SUBMIT_PATH, form);
}
