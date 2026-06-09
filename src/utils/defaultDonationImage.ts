import defaultDonationImage from "../assets/campaign-categories.png";
import defaultCertificatePhoto from "../assets/default-certificate-photo.png";

export { defaultDonationImage, defaultCertificatePhoto };

/** Use when a donor has no photo but completed the message / info step */
export function resolveDonationPhotoUrl(
  photoUrl: string | null | undefined,
  fallback?: string | null,
): string {
  if (photoUrl?.trim()) return photoUrl;
  if (fallback?.trim()) return fallback;
  return defaultDonationImage;
}

/** Certificate photo: captured shot only, otherwise the default illustration */
export function resolveCertificatePhotoUrl(
  capturedPhotoUrl: string | null | undefined,
): string {
  if (capturedPhotoUrl?.trim()) return capturedPhotoUrl;
  return defaultCertificatePhoto;
}
