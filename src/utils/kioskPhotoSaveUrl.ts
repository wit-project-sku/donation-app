/**
 * 키오스크 사진 저장 페이지. 결과 이미지의 공개 URL 을 붙여 QR 로 만든다.
 * kiosk-app 의 AI 한복 촬영 흐름(PhotoWorkflow.tsx 의 SAVE_BASE)과 반드시 같은
 * 주소를 써야 한다 — 두 흐름 모두 같은 이미지 호스트(photo.witteria.com)에
 * 올라간 사진을 이 페이지로 내려받는다.
 */
const KIOSK_PHOTO_SAVE_BASE = "https://withphoto.vercel.app/?imageUrl=";

/**
 * 결제 완료 화면 QR 용 — 키오스크 저장 페이지 링크를 만든다.
 *
 * 이 시점엔 아직 기부증서를 저장하지 않았고(이름도 안 받았다) 사용자가 원하는 건
 * "AI 사진 받기" 뿐이므로, 모바일 증서가 아니라 키오스크 저장 페이지로 보낸다.
 * 증서(이름·금액·날짜)가 필요한 단계는 이후 /school-certificate 가 담당한다.
 *
 * data:/blob: 은 휴대폰이 열 수 없으므로 공개 http(s) URL 만 허용한다.
 * 링크가 없으면 null → 호출부에서 QR 자체를 막는다(사진 없는 페이지를 열지 않게).
 */
export function buildKioskPhotoSaveUrl(photoUrl?: string | null): string | null {
  const url = photoUrl?.trim();
  if (!url) return null;
  if (!/^https?:\/\//i.test(url)) return null;
  return `${KIOSK_PHOTO_SAVE_BASE}${encodeURIComponent(url)}`;
}
