import { submitDonation } from "../api/submitDonation";
import type { SubmitDonationDetailsPayload } from "../api/types";
import type { Outfit } from "../api/outfits";
import type { Campaign, PaymentMethod } from "../types";

export type SubmitSessionSlice = {
  selectedCampaign: Campaign | null;
  amount: number;
  paymentMethod: PaymentMethod;
  donorName: string;
  donorPhone: string;
  message: string;
  capturedPhotoUrl: string | null;
  selectedOutfit: Outfit | null;
  merchantUid: string | null;
};

function isFileBackedPhoto(url: string | null): url is string {
  return Boolean(url && (url.startsWith("data:") || url.startsWith("blob:")));
}

async function photoUrlToBlob(url: string): Promise<Blob> {
  const response = await fetch(url);
  return response.blob();
}

export async function buildSubmitPayload(
  state: SubmitSessionSlice,
): Promise<SubmitDonationDetailsPayload> {
  const campaign = state.selectedCampaign;
  const paymentMethod = state.paymentMethod;

  if (!campaign || !paymentMethod || state.amount <= 0 || !state.merchantUid) {
    throw new Error("기부 저장에 필요한 정보가 없습니다.");
  }

  const photo =
    isFileBackedPhoto(state.capturedPhotoUrl)
      ? await photoUrlToBlob(state.capturedPhotoUrl)
      : null;

  return {
    data: {
      merchantUid: state.merchantUid,
      donatorName: state.donorName.trim() || "익명",
      phoneNumber: state.donorPhone.replace(/\D/g, ""),
      imageUrl: photo ? null : state.capturedPhotoUrl,
    },
    photo,
  };
}

export async function submitCurrentDonation(state: SubmitSessionSlice) {
  return submitDonation(await buildSubmitPayload(state));
}
