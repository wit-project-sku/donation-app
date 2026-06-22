export type DonationType = "one-time" | "regular";

/** Which donation experience the donor picked on the entry screen — drives accent theming (NGO=blue, 학교=green). */
export type DonationCategory = "none" | "ngo" | "school";

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
  amountOptions: CampaignAmountOption[];
  accumulatedAmount: number;
  targetAmount: number;
  sections: CampaignSection[];
  programs: CampaignProgram[];
  status?: string;
  createdAt?: string;
}
