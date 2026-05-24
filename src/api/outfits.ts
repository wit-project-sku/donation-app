import { apiGet } from "./client";
import type { OutfitDto, PageParams, PaginatedData } from "./types";

const OUTFITS_PATH = "/api/donations/outfits";

export interface Outfit {
  id: string;
  name: string;
  category: string;
  imageUrl: string;
}

function mapOutfitDto(dto: OutfitDto): Outfit {
  return {
    id: String(dto.id),
    name: dto.name,
    category: dto.category,
    imageUrl: dto.imageUrl,
  };
}

export async function fetchOutfitsPage(
  params: PageParams = {},
): Promise<PaginatedData<Outfit>> {
  const data = await apiGet<PaginatedData<OutfitDto>>(OUTFITS_PATH, {
    pageNum: params.pageNum ?? 1,
    pageSize: params.pageSize ?? 50,
  });

  return {
    ...data,
    content: data.content.map(mapOutfitDto),
  };
}

export async function fetchOutfits(pageSize = 50): Promise<Outfit[]> {
  const outfits: Outfit[] = [];
  let pageNum = 1;
  let last = false;

  while (!last) {
    const page = await fetchOutfitsPage({ pageNum, pageSize });
    outfits.push(...page.content);
    last = page.last;
    pageNum += 1;

    if (pageNum > page.totalPages && page.totalPages > 0) break;
    if (page.content.length === 0) break;
  }

  return outfits;
}

export function getOutfitCategories(outfits: Outfit[]): string[] {
  return [...new Set(outfits.map((o) => o.category).filter(Boolean))];
}
