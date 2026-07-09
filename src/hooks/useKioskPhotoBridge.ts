import { useEffect } from "react";
import { getKioskBridge } from "../utils/kioskBridge";
import { useDonationStore } from "../store/donationStore";

/**
 * App-level subscription that captures the AI photo result whenever it arrives
 * from the kiosk. Mounted once at the app root so the result is stored even after
 * the user navigates past the camera page — the school flow proceeds to
 * amount/payment while the AI generates, and the certificate page reads the
 * captured photo from the store once it's ready.
 */
export function useKioskPhotoBridge(): void {
  const setCapturedPhotoUrl = useDonationStore((s) => s.setCapturedPhotoUrl);

  useEffect(() => {
    const bridge = getKioskBridge();
    if (!bridge) return;
    return bridge.on("photoResult", (payload) => {
      const url = (payload as { url?: string }).url;
      if (url) setCapturedPhotoUrl(url);
    });
  }, [setCapturedPhotoUrl]);
}
