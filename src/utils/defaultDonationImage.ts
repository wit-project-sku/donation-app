import defaultDonationImage from "../assets/campaign-categories.png";

export { defaultDonationImage };

/** Use when a donor has no photo but completed the message / info step */
export function resolveDonationPhotoUrl(
  photoUrl: string | null | undefined,
  fallback?: string | null,
): string {
  if (photoUrl?.trim()) return photoUrl;
  if (fallback?.trim()) return fallback;
  return defaultDonationImage;
}
