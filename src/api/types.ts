/** Standard API envelope */
export interface ApiResponse<T> {
  success: boolean;
  code: number;
  message: string;
  data: T;
}

export interface PageParams {
  pageNum?: number;
  pageSize?: number;
}

export interface PaginatedData<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  pageNum: number;
  pageSize: number;
  last: boolean;
}

export type CampaignStatus = "ACTIVE" | "INACTIVE" | string;

export interface CampaignDto {
  id: number;
  name: string;
  description: string;
  imageUrl: string;
  status: CampaignStatus;
  amountOptions: number[];
  createdAt: string;
}

export type PaymentMethodDto = "CARD" | "KAKAO" | "NAVER" | string;

export interface PaymentHistoryDto {
  id: number;
  campaignName: string;
  totalAmount: number;
  paymentMethod: PaymentMethodDto;
  donatorName: string;
  photoUrl: string | null;
  donatedAt: string;
}

/** Body for POST /api/donations/details */
export interface SubmitDonationDetailsPayload {
  merchantUid: string;
  donatorName: string;
  phoneNumber: string;
  imageUrl: string | null;
}

export interface PaymentHistoryParams extends PageParams {
  keyword?: string;
}

export interface OutfitParams extends PageParams {
  keyword?: string;
  status?: "ACTIVE" | "INACTIVE";
  type?: "NORMAL" | "PREMIUM";
}

export interface OutfitDto {
  id: number;
  categoryName: string;
  name: string;
  status: "ACTIVE" | "INACTIVE" | string;
  type: "NORMAL" | "PREMIUM" | string;
  imageUrl: string;
  kioskIds?: number[];
  outfitCode: string;
  startDate?: string;
  endDate?: string;
}
