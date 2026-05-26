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

/** Multipart data part for POST /api/donations/details */
export interface SubmitDonationDetailsData {
  merchantUid: string;
  donatorName: string;
  phoneNumber: string;
  imageUrl: string | null;
}

export interface SubmitDonationDetailsPayload {
  data: SubmitDonationDetailsData;
  photo?: Blob | null;
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
