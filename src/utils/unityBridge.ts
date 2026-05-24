import { useDonationStore } from "../store/donationStore";

declare global {
  interface Window {
    /** Unity WebView: pass booth / token image URL after capture */
    setDonationPhotoUrl?: (url: string) => void;
  }
}

export function registerUnityBridge() {
  window.setDonationPhotoUrl = (url: string) => {
    useDonationStore.getState().setCapturedPhotoUrl(url);
  };
}
