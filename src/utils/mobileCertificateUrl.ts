const QR_PHOTO_URL_MAX_LENGTH = 120;

/**
 * 모바일 기부증서 페이지로 연결되는 URL 을 만든다. QR 코드에 담아 휴대폰으로
 * 스캔하면 합성 사진·기부 정보를 볼 수 있다. (data:/blob: 사진은 QR 에 담지 않음)
 */
export function buildMobileCertificateUrl(params: {
  amount: number;
  date: string;
  name: string;
  phone?: string;
  photoUrl?: string | null;
}): string {
  const publicAppUrl = import.meta.env.VITE_PUBLIC_APP_URL?.replace(/\/$/, "");
  const basePath =
    publicAppUrl ?? `${window.location.origin}${window.location.pathname}`;
  const search = new URLSearchParams({
    a: String(params.amount),
    d: params.date,
    n: params.name,
  });

  const phoneDigits = params.phone?.replace(/\D/g, "") ?? "";
  if (phoneDigits) search.set("ph", phoneDigits);

  const photoUrl = params.photoUrl?.trim();
  if (
    photoUrl &&
    !photoUrl.startsWith("data:") &&
    !photoUrl.startsWith("blob:") &&
    photoUrl.length <= QR_PHOTO_URL_MAX_LENGTH
  ) {
    search.set("p", photoUrl);
  }

  return `${basePath}#/mobile-certificate?${search.toString()}`;
}
