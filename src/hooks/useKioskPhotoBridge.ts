import { useEffect } from "react";
import { getKioskBridge } from "../utils/kioskBridge";
import { useDonationStore } from "../store/donationStore";

/**
 * App-level subscription that tracks the Monitor-2 AI photo lifecycle whenever it
 * runs on the kiosk. Mounted once at the app root so progress/result/error are
 * captured no matter which page the user is on — the photo is triggered from the
 * outfit screen, then both the school (amount → payment) and NGO (certificate)
 * flows proceed while the AI generates and read the result from the store once
 * it's ready. There is no in-app camera page; the camera lives on Monitor 2.
 */
export function useKioskPhotoBridge(): void {
  const setCapturedPhotoUrl = useDonationStore((s) => s.setCapturedPhotoUrl);
  const setSharePhotoUrl = useDonationStore((s) => s.setSharePhotoUrl);
  const setPhotoStatus = useDonationStore((s) => s.setPhotoStatus);

  useEffect(() => {
    const bridge = getKioskBridge();
    if (!bridge?.on) return;

    const offProgress = bridge.on("photoProgress", (payload) => {
      const phase = (payload as { phase?: string }).phase;
      if (phase === "generating") setPhotoStatus("generating");
    });
    const offResult = bridge.on("photoResult", (payload) => {
      const { url, shareUrl } = payload as { url?: string; shareUrl?: string };
      if (url) {
        // url = image bytes (data:) → blob → donation backend storage.
        // shareUrl = public URL → mobile-certificate QR (phone view/download).
        setCapturedPhotoUrl(url);
        setSharePhotoUrl(shareUrl ?? null);
        setPhotoStatus("ready");
      }
    });
    const offError = bridge.on("photoError", () => setPhotoStatus("error"));

    return () => {
      offProgress();
      offResult();
      offError();
    };
  }, [setCapturedPhotoUrl, setSharePhotoUrl, setPhotoStatus]);
}
