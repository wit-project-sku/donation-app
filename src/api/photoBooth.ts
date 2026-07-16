import { ApiError, buildUrl } from "./client";
import type { ApiResponse } from "./types";

const PHOTO_BOOTH_PATH = "/api/photo-booth";

type PhotoBoothData = { imageUrl?: string };

/**
 * 키오스크에서 촬영한 사진을 임시 저장하고 공개 접근 URL 을 받는다(QR 로 휴대폰 수령).
 * 서버가 1시간 후 자동 정리한다.
 *
 * 결제 완료 화면(SchoolCompletePage) QR 전용이다. 기부증서 이미지는 저장 단계에서
 * `submitDonation`(/api/donations/details) 이 따로 올리므로 이 API 를 쓰지 않는다.
 *
 * 파트명은 `images`(단일). 서버가 실제 바이트(매직넘버)로 포맷을 판별하므로
 * filename 이 blob 이거나 content-type 이 application/octet-stream 이어도 된다.
 */
export async function uploadPhotoBooth(image: Blob): Promise<string> {
  const form = new FormData();
  form.append("images", image, "photo.jpg");

  const response = await fetch(buildUrl(PHOTO_BOOTH_PATH), {
    method: "POST",
    // Content-Type 은 브라우저가 multipart boundary 와 함께 설정한다 — 직접 넣으면 안 된다.
    body: form,
  });

  const body = (await response.json()) as ApiResponse<PhotoBoothData | null>;

  if (!response.ok || !body.success) {
    throw new ApiError(
      body.message || `Request failed (${response.status})`,
      response.status,
      body.code,
    );
  }

  const imageUrl = body.data?.imageUrl?.trim();
  if (!imageUrl) {
    throw new ApiError("photo-booth 응답에 imageUrl 이 없습니다.", response.status, body.code);
  }

  // 응답은 `/photo-booth/**` 정적 경로(상대 경로)로 온다. 이 URL 은 QR 로 넘어가
  // **휴대폰**에서 열리므로, 앱 오리진이 아니라 API 호스트 기준 절대 URL 이어야 한다.
  return /^https?:\/\//i.test(imageUrl) ? imageUrl : buildUrl(imageUrl);
}
