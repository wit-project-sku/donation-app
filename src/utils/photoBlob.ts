/**
 * 키오스크(Monitor 2)가 보내 준 AI 사진은 data: URL 바이트다.
 * multipart 업로드에 쓰려면 Blob 으로 되돌려야 한다.
 *
 * NOTE: `buildSubmitPayload.ts` 에 거의 같은 private `recoverBlob` 이 있다.
 * 기부 저장(결제) 경로를 건드리지 않으려고 지금은 합치지 않았다.
 */
export async function recoverPhotoBlob(url: string): Promise<Blob | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`[photoBlob] photo fetch failed: ${res.status}`);
      return null;
    }
    const blob = await res.blob();
    if (blob.size === 0) {
      console.warn("[photoBlob] photo blob is empty");
      return null;
    }
    return blob;
  } catch (err) {
    console.warn("[photoBlob] photo fetch threw", err);
    return null;
  }
}
