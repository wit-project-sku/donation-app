import { submitDonation, toPaymentMethodDto } from "../api/submitDonation";
import type { SubmitDonationPayload } from "../api/types";
import type { Outfit } from "../api/outfits";
import type { Campaign, PaymentMethod } from "../types";

export type SubmitSessionSlice = {
  selectedCampaign: Campaign | null;
  amount: number;
  paymentMethod: PaymentMethod;
  donorName: string;
  message: string;
  capturedPhotoUrl: string | null;
  selectedOutfit: Outfit | null;
};

export function buildSubmitPayload(state: SubmitSessionSlice): SubmitDonationPayload {
  const campaign = state.selectedCampaign;
  const paymentMethod = state.paymentMethod;

  if (!campaign || !paymentMethod || state.amount <= 0) {
    throw new Error("Missing campaign, payment method, or amount");
  }

  const photoUrl =
    state.capturedPhotoUrl ?? state.selectedOutfit?.imageUrl ?? null;

  return {
    campaignId: Number(campaign.id),
    campaignName: campaign.title,
    totalAmount: state.amount,
    paymentMethod: toPaymentMethodDto(paymentMethod),
    donatorName: state.donorName.trim() || "Anonymous",
    message: state.message.trim() || undefined,
    photoUrl,
    outfitId: state.selectedOutfit
      ? Number(state.selectedOutfit.id)
      : undefined,
  };
}

export async function submitCurrentDonation(state: SubmitSessionSlice) {
  return submitDonation(buildSubmitPayload(state));
}
