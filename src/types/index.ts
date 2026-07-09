export type DonationType = "one-time" | "regular";

/** Which donation experience the donor picked on the entry screen — drives accent theming (NGO=blue, 학교=green). */
export type DonationCategory = "none" | "ngo" | "school";

/** 기부 종류 (payment-be DonationType). */
export type DonationTypeCode = "NGO" | "SCHOOL";

/** 주최 단체 (payment-be DonationOrganization) — 선택 캠페인의 강조색·로고는 name 으로 로컬 매핑. */
export interface CampaignOrganization {
  id: number;
  type: DonationTypeCode;
  name: string;
}

export type PaymentMethod = "card" | "kakao" | "naver" | null;

export interface CampaignAmountOption {
  label: string;
  amount: number;
}

export interface CampaignTitleRun {
  text: string;
  bold?: boolean;
  color?: string;
}

export interface CampaignSection {
  title: string;
  titleRuns?: CampaignTitleRun[];
  desc: string;
  img: string;
}

export interface CampaignProgram {
  title: string;
  desc: string;
}

export interface Campaign {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  /** 주최 단체(강조색·로고 결정). 운영자 미지정 시 undefined → 프론트 기본값. */
  organization?: CampaignOrganization;
  amountOptions: CampaignAmountOption[];
  accumulatedAmount: number;
  targetAmount: number;
  sections: CampaignSection[];
  programs: CampaignProgram[];
  status?: string;
  createdAt?: string;
  /** 홈 하단 배너 문구: bannerTitle=큰 글씨, bannerSubtitle=작은 글씨 */
  bannerTitle?: string | null;
  bannerSubtitle?: string | null;
}
