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
  /** 학교 흐름 졸업연도 (NGO 흐름은 null) */
  graduationYear: number | null;
  capturedPhotoUrl: string | null;
  selectedOutfit: Outfit | null;
  merchantUid: string | null;
};

export function buildSubmitPayload(
  state: SubmitSessionSlice,
): SubmitDonationDetailsPayload {
  const campaign = state.selectedCampaign;
  const paymentMethod = state.paymentMethod;

  if (!campaign || !paymentMethod || state.amount <= 0 || !state.merchantUid) {
    throw new Error("기부 저장에 필요한 정보가 없습니다.");
  }

  // The image is delivered separately as the `photo` multipart part (see
  // submitCurrentDonation); the `data` part carries only these fields.
  // graduationYear: 학교 흐름은 값, NGO 흐름은 null.
  return {
    merchantUid: state.merchantUid,
    donatorName: state.donorName.trim() || "익명",
    graduationYear: state.graduationYear,
  };
}

async function recoverBlob(url: string): Promise<Blob | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`[submitDonation] photo fetch failed: ${res.status} ${url}`);
      return null;
    }
    const blob = await res.blob();
    if (blob.size === 0) {
      console.warn(`[submitDonation] photo blob is empty: ${url}`);
      return null;
    }
    return blob;
  } catch (err) {
    console.warn(`[submitDonation] photo fetch threw for ${url}`, err);
    return null;
  }
}

export async function submitCurrentDonation(state: SubmitSessionSlice) {
  const payload = buildSubmitPayload(state);

  // The AI photo is delivered from the kiosk (Monitor 2) as image bytes in a
  // data: URL. Recover it into a Blob and send it as the binary `photo`
  // multipart part; the backend sniffs the real bytes, converts to WebP and
  // stores it in its own storage. No public/shared URL is involved.
  let photoBlob: Blob | null = null;
  if (state.capturedPhotoUrl) {
    photoBlob = await recoverBlob(state.capturedPhotoUrl);
  }

  return submitDonation(payload, photoBlob);
}
