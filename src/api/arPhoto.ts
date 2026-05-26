import type { Outfit } from "./outfits";

const AR_PROCESS_ENDPOINT =
  import.meta.env.VITE_AR_PROCESS_API_URL ??
  "https://kr-ar-api.digicon.pro/api/v2/process_and_combine";

export interface ProcessArPhotoParams {
  image: Blob;
  outfit: Outfit;
  togetherWith?: string | null;
  requestId?: string | null;
}

function pickString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function findImageUrl(value: unknown): string | null {
  if (!value || typeof value !== "object") return null;

  const record = value as Record<string, unknown>;
  const direct =
    pickString(record.imageUrl) ??
    pickString(record.image_url) ??
    pickString(record.outputUrl) ??
    pickString(record.output_url) ??
    pickString(record.resultUrl) ??
    pickString(record.result_url) ??
    pickString(record.url);

  if (direct) return direct;

  return (
    findImageUrl(record.data) ??
    findImageUrl(record.result) ??
    findImageUrl(record.output)
  );
}

function inferOutfitCode(outfit: Outfit): string {
  if (outfit.outfitCode) return outfit.outfitCode;

  const fromId = outfit.id.match(/\d+(?:\.\d+)?/)?.[0];
  const fromName = outfit.name.match(/\d+(?:\.\d+)?/)?.[0];
  const fromImage = outfit.imageUrl.match(/(\d+(?:\.\d+)?)(?=[-_A-Za-z.]|$)/)?.[1];

  return fromId ?? fromName ?? fromImage ?? outfit.id;
}

function inferGender(outfit: Outfit): string | null {
  const text = `${outfit.name} ${outfit.category} ${outfit.imageUrl}`.toLowerCase();
  if (/(^|[-_\s.])m(ale)?($|[-_\s.])/.test(text) || text.includes("남")) {
    return "m";
  }
  if (/(^|[-_\s.])f(emale)?($|[-_\s.])/.test(text) || text.includes("여")) {
    return "f";
  }
  return null;
}

async function parseArResponse(response: Response): Promise<string> {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.startsWith("image/")) {
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  }

  if (contentType.includes("application/json")) {
    const json = await response.json();
    const url = findImageUrl(json);
    if (url) return url;
    throw new Error("AR response did not include an image URL");
  }

  const text = (await response.text()).trim();
  if (text) return text;
  throw new Error("AR response was empty");
}

export async function processArPhoto({
  image,
  outfit,
  togetherWith,
  requestId,
}: ProcessArPhotoParams): Promise<string> {
  const form = new FormData();
  const gender = inferGender(outfit);

  form.append("image", image, "capture.jpg");
  form.append("outfit", inferOutfitCode(outfit));
  if (togetherWith) form.append("together_with", togetherWith);
  if (gender) form.append("gender", gender);
  if (requestId) form.append("request_ids", requestId);

  const response = await fetch(AR_PROCESS_ENDPOINT, {
    method: "POST",
    body: form,
  });

  if (!response.ok) {
    throw new Error(`AR processing failed (${response.status})`);
  }

  return parseArResponse(response);
}
