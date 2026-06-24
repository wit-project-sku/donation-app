export type DonationType = "one-time" | "regular";

/** Which donation experience the donor picked on the entry screen — drives accent theming (NGO=blue, 학교=green). */
export type DonationCategory = "none" | "ngo" | "school";

/** 백엔드(payment-be) CampaignOrganizer enum 값 — 선택 캠페인의 강조색·로고 출처. */
export type CampaignOrganizerCode =
  | "SAVE_THE_CHILDREN"
  | "UNICEF"
  | "GOOD_NEIGHBORS"
  | "SCHOOL";

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
  /** 주최단체(강조색·로고 결정). 운영자 미지정 시 undefined → 프론트 기본값. */
  organizer?: CampaignOrganizerCode;
  amountOptions: CampaignAmountOption[];
  accumulatedAmount: number;
  targetAmount: number;
  sections: CampaignSection[];
  programs: CampaignProgram[];
  status?: string;
  createdAt?: string;
}
