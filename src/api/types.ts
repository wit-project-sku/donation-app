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
  message?: string | null;
  donatedAt: string;
}

/** Body for POST /api/donations/payment — saved before Wall of Givers */
export interface SubmitDonationPayload {
  campaignId: number;
  campaignName: string;
  totalAmount: number;
  paymentMethod: PaymentMethodDto;
  donatorName: string;
  message?: string;
  photoUrl?: string | null;
  outfitId?: number;
}

export interface PaymentHistoryParams extends PageParams {
  keyword?: string;
}

export interface OutfitDto {
  id: number;
  name: string;
  category: string;
  imageUrl: string;
}
