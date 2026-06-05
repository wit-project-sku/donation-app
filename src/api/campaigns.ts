import { apiGet } from "./client";
import type { CampaignDto, PageParams, PaginatedData } from "./types";
import type { Campaign } from "../types";

const CAMPAIGNS_PATH = "/api/donations/campaigns";

function mapCampaignDto(dto: CampaignDto): Campaign {
  return {
    id: String(dto.id),
    title: dto.name,
    description: dto.description,
    imageUrl: dto.imageUrl,
    amountOptions: dto.amountOptions ?? [],
    accumulatedAmount: dto.accumulatedAmount ?? 0,
    targetAmount: dto.targetAmount ?? 0,
    status: dto.status,
    createdAt: dto.createdAt,
  };
}

export async function fetchCampaignsPage(
  params: PageParams = {},
): Promise<PaginatedData<Campaign>> {
  const data = await apiGet<PaginatedData<CampaignDto>>(CAMPAIGNS_PATH, {
    pageNum: params.pageNum ?? 1,
    pageSize: params.pageSize ?? 20,
  });

  return {
    ...data,
    content: data.content
      .filter((c) => c.status === "ACTIVE")
      .map(mapCampaignDto),
  };
}

/** Loads all campaign pages until `last` is true */
export async function fetchCampaigns(
  pageSize = 20,
): Promise<Campaign[]> {
  const campaigns: Campaign[] = [];
  let pageNum = 1;
  let last = false;

  while (!last) {
    const page = await fetchCampaignsPage({ pageNum, pageSize });
    campaigns.push(...page.content);
    last = page.last;
    pageNum += 1;

    if (pageNum > page.totalPages && page.totalPages > 0) break;
    if (page.content.length === 0) break;
  }

  return campaigns;
}
