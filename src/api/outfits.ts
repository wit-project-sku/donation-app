import { apiGet } from "./client";
import type { OutfitDto, OutfitParams, PaginatedData } from "./types";

const OUTFITS_PATH = "/api/outfits";

export interface Outfit {
  id: string;
  name: string;
  category: string;
  imageUrl: string;
  outfitCode: string;
  status: string;
  type: string;
  /** 학교 교복일 때 소속 학교 */
  schoolId?: number | null;
  schoolName?: string | null;
}

function mapOutfitDto(dto: OutfitDto): Outfit {
  return {
    id: String(dto.id),
    name: dto.name,
    category: dto.categoryName,
    imageUrl: dto.imageUrl,
    outfitCode: dto.outfitCode,
    status: dto.status,
    type: dto.type,
    schoolId: dto.schoolId ?? null,
    schoolName: dto.schoolName ?? null,
  };
}

export async function fetchOutfitsPage(
  params: OutfitParams = {},
): Promise<PaginatedData<Outfit>> {
  const data = await apiGet<PaginatedData<OutfitDto>>(OUTFITS_PATH, {
    pageNum: params.pageNum ?? 1,
    pageSize: params.pageSize ?? 10,
    keyword: params.keyword ?? "",
    status: params.status ?? "ACTIVE",
    // NGO=PREMIUM, 학교=SCHOOL_UNIFORM. Caller passes the right type per flow.
    ...(params.type ? { type: params.type } : {}),
    // 학교 흐름: 선택한 학교의 교복만 조회 (미입력 시 전체 교복).
    ...(params.schoolId != null ? { schoolId: params.schoolId } : {}),
  });

  return {
    ...data,
    content: data.content.map(mapOutfitDto),
  };
}
