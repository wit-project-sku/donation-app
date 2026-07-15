/**
 * QR 에 담을 사진 URL 최대 길이.
 * 결제 완료 화면에서 (증서 저장 없이) 이 QR 만으로 사진을 받아 가므로, 링크가
 * 빠지면 스캔해도 사진이 없는 증서가 열린다. 120 은 실제 호스트 URL 이 조금만
 * 길어져도 걸리는 값이라 300 으로 넓혔다. (QR 총 길이 ~400자 → version 13 수준,
 * 키오스크 QR 크기에서 충분히 스캔된다.)
 */
const QR_PHOTO_URL_MAX_LENGTH = 300;

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

  // 사진 링크는 키오스크가 보내 준 공개 URL(shareUrl)만 담는다.
  // data:/blob: 은 휴대폰이 열 수 없으므로 제외한다.
  const photoUrl = params.photoUrl?.trim();
  if (photoUrl && !photoUrl.startsWith("data:") && !photoUrl.startsWith("blob:")) {
    if (photoUrl.length <= QR_PHOTO_URL_MAX_LENGTH) {
      search.set("p", photoUrl);
    } else {
      // 조용히 빠지면 "스캔했는데 사진이 없다" 로만 보여 원인 추적이 어렵다.
      console.warn(
        `[mobileCertificateUrl] 사진 링크가 너무 길어 QR 에서 제외됨 (${photoUrl.length} > ${QR_PHOTO_URL_MAX_LENGTH})`,
        photoUrl,
      );
    }
  }

  return `${basePath}#/mobile-certificate?${search.toString()}`;
}
