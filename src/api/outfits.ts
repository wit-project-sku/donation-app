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
    type: params.type ?? "PREMIUM",
  });

  return {
    ...data,
    content: data.content.map(mapOutfitDto),
  };
}
