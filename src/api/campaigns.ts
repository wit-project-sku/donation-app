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
    organization: dto.organization
      ? {
          id: dto.organization.id,
          type: dto.organization.type,
          name: dto.organization.name,
        }
      : undefined,
    amountOptions: (dto.amountOptions ?? []).map((option) => ({
      label: option.label,
      amount: option.amount,
    })),
    accumulatedAmount: dto.accumulatedAmount ?? 0,
    targetAmount: dto.targetAmount ?? 0,
    sections: (dto.sections ?? []).map((section) => ({
      title: section.title,
      titleRuns: section.titleRuns?.map((run) => ({
        text: run.text,
        bold: run.bold,
        color: run.color,
      })),
      desc: section.desc,
      img: section.img,
    })),
    programs: (dto.programs ?? []).map((program) => ({
      title: program.title,
      desc: program.desc,
    })),
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
      .filter((campaign) => campaign.status === "ACTIVE")
      .map(mapCampaignDto),
  };
}
