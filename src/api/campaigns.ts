import { apiGet } from "./client";
import type { CampaignDto, CampaignListParams, PaginatedData } from "./types";
import type { Campaign } from "../types";

const CAMPAIGNS_PATH = "/api/donations/campaigns";

function mapCampaignDto(dto: CampaignDto): Campaign {
  const effectPrograms = (dto.effects ?? []).map((effect) => ({
    title: effect,
    desc: "",
  }));
  const programDtos = dto.programs ?? [];
  const programs =
    programDtos.length > 0
      ? programDtos.map((program) => ({
          title: program.title,
          desc: program.desc,
        }))
      : effectPrograms;

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
      label: option.label ?? `${option.amount.toLocaleString()}원`,
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
    programs,
    status: dto.status,
    createdAt: dto.createdAt,
    bannerTitle: dto.bannerTitle ?? null,
    bannerSubtitle: dto.bannerSubtitle ?? null,
  };
}

export async function fetchCampaignsPage(
  params: CampaignListParams = {},
): Promise<PaginatedData<Campaign>> {
  // organizationId 미전송 시 전체 단체의 캠페인을 보여준다(특정 단체만 보려면 명시).
  const data = await apiGet<PaginatedData<CampaignDto>>(CAMPAIGNS_PATH, {
    pageNum: params.pageNum ?? 1,
    pageSize: params.pageSize ?? 20,
    type: params.type ?? "NGO",
    ...(params.organizationId != null
      ? { organizationId: params.organizationId }
      : {}),
    includeInactive: params.includeInactive ?? false,
  });

  return {
    ...data,
    content: data.content
      .filter((campaign) => campaign.status === "ACTIVE")
      .map(mapCampaignDto),
  };
}

export async function fetchCampaignById(
  id: string | number,
): Promise<Campaign> {
  const data = await apiGet<CampaignDto>(`${CAMPAIGNS_PATH}/${id}`);
  return mapCampaignDto(data);
}
