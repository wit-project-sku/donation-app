import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  Campaign,
  DonationCategory,
  DonationType,
  PaymentMethod,
} from "../types";
import type { Outfit } from "../api/outfits";

interface DonationState {
  selectedCampaign: Campaign | null;
  donationType: DonationType;
  /** NGO vs 학교 experience chosen on the entry screen — drives accent theme. */
  donationCategory: DonationCategory;
  amount: number;
  lastAddedPreset: number | null;
  paymentMethod: PaymentMethod;
  message: string;
  donorName: string;
  donorPhone: string;
  /** 학교 흐름 졸업연도 (기부한컷 등록 시 입력) */
  graduationYear: number | null;
  activeField: "phone" | "name" | null;
  skipPhoto: boolean;
  selectedOutfit: Outfit | null;
  /** Booth / token image URL (from Unity camera or outfit preview) */
  capturedPhotoUrl: string | null;
  /** Set after successful POST from certificate page */
  submittedRecordId: number | null;
  /** Kiosk payment id sent to /api/donations/payments */
  merchantUid: string | null;

  setSelectedCampaign: (campaign: Campaign | null) => void;
  setDonationType: (type: DonationType) => void;
  setDonationCategory: (category: DonationCategory) => void;
  addAmount: (value: number) => void;
  setAmount: (value: number) => void;
  resetAmount: () => void;
  setPaymentMethod: (method: PaymentMethod) => void;
  setMessage: (message: string) => void;
  setDonorName: (name: string) => void;
  setDonorPhone: (phone: string) => void;
  setGraduationYear: (year: number | null) => void;
  setActiveField: (field: "phone" | "name" | null) => void;
  setSkipPhoto: (skip: boolean) => void;
  setSelectedOutfit: (outfit: Outfit | null) => void;
  setCapturedPhotoUrl: (url: string | null) => void;
  setSubmittedRecordId: (id: number | null) => void;
  setMerchantUid: (uid: string | null) => void;
  resetSession: () => void;
}

const initialState = {
  selectedCampaign: null,
  donationType: "one-time" as DonationType,
  donationCategory: "none" as DonationCategory,
  amount: 0,
  lastAddedPreset: null as number | null,
  paymentMethod: null as PaymentMethod,
  message: "",
  donorName: "",
  donorPhone: "",
  graduationYear: null as number | null,
  activeField: null as "phone" | "name" | null,
  skipPhoto: false,
  selectedOutfit: null as Outfit | null,
  capturedPhotoUrl: null as string | null,
  submittedRecordId: null as number | null,
  merchantUid: null as string | null,
};

export const useDonationStore = create<DonationState>()(
  persist(
    (set) => ({
      ...initialState,

      // Selecting a campaign resets the per-donation session, but the chosen
      // donation category (NGO/학교) must survive so the accent theme stays
      // consistent through the whole flow. Only resetSession() clears it.
      setSelectedCampaign: (campaign) =>
        set((state) =>
          campaign
            ? {
                ...initialState,
                donationCategory: state.donationCategory,
                selectedCampaign: campaign,
              }
            : { ...initialState, donationCategory: state.donationCategory },
        ),
      setDonationType: (type) => set({ donationType: type }),
      setDonationCategory: (category) => set({ donationCategory: category }),
      addAmount: (value) =>
        set({
          amount: value,
          lastAddedPreset: value,
        }),
      setAmount: (value) => set({ amount: value, lastAddedPreset: value }),
      resetAmount: () => set({ amount: 0, lastAddedPreset: null }),
      setPaymentMethod: (method) => set({ paymentMethod: method }),
      setMessage: (message) => set({ message }),
      setDonorName: (name) => set({ donorName: name }),
      setDonorPhone: (phone) => set({ donorPhone: phone }),
      setGraduationYear: (year) => set({ graduationYear: year }),
      setActiveField: (field) => set({ activeField: field }),
      setSkipPhoto: (skip) => set({ skipPhoto: skip }),
      setSelectedOutfit: (outfit) => set({ selectedOutfit: outfit }),
      setCapturedPhotoUrl: (url) => set({ capturedPhotoUrl: url }),
      setSubmittedRecordId: (id) => set({ submittedRecordId: id }),
      setMerchantUid: (uid) => set({ merchantUid: uid }),
      resetSession: () => set(initialState),
    }),
    {
      name: "donation-kiosk-session",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        selectedCampaign: state.selectedCampaign,
        donationType: state.donationType,
        donationCategory: state.donationCategory,
        amount: state.amount,
        paymentMethod: state.paymentMethod,
        message: state.message,
        donorName: state.donorName,
        donorPhone: state.donorPhone,
        graduationYear: state.graduationYear,
        skipPhoto: state.skipPhoto,
        selectedOutfit: state.selectedOutfit,
        capturedPhotoUrl: state.capturedPhotoUrl,
        submittedRecordId: state.submittedRecordId,
        merchantUid: state.merchantUid,
      }),
    },
  ),
);
