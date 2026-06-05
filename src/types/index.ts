export type DonationType = "one-time" | "regular";

export type PaymentMethod = "card" | "kakao" | "naver" | null;

export interface Campaign {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  amountOptions: number[];
  accumulatedAmount: number;
  targetAmount: number;
  status?: string;
  createdAt?: string;
}
