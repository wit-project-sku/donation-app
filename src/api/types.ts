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

export interface CampaignListParams extends PageParams {
  type?: DonationTypeDto;
  organizationId?: number;
  includeInactive?: boolean;
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

/** 기부 종류 (payment-be DonationType) */
export type DonationTypeDto = "NGO" | "SCHOOL";

/** 주최 단체 (payment-be DonationOrganization) */
export interface CampaignOrganizationDto {
  id: number;
  type: DonationTypeDto;
  name: string;
}

export interface CampaignAmountOptionDto {
  label?: string;
  amount: number;
}

export interface CampaignTitleRunDto {
  text: string;
  bold?: boolean;
  color?: string;
}

export interface CampaignSectionDto {
  title: string;
  titleRuns?: CampaignTitleRunDto[];
  desc: string;
  img: string;
}

export interface CampaignProgramDto {
  title: string;
  desc: string;
}

export interface CampaignDto {
  id: number;
  name: string;
  description: string;
  imageUrl: string;
  status: CampaignStatus;
  organization?: CampaignOrganizationDto | null;
  targetAmount: number;
  accumulatedAmount: number;
  amountOptions: CampaignAmountOptionDto[];
  /** NGO detail/list uses this instead of programs */
  effects?: string[];
  sections?: CampaignSectionDto[];
  programs?: CampaignProgramDto[];
  createdAt: string;
}

export type PaymentMethodDto = "CARD" | "KAKAO" | "NAVER" | string;

/** 기부 대상 유형 (payment/history targetType) */
export type TargetTypeDto = "CAMPAIGN" | "SCHOOL";

/** GET /api/donations/payment/history — item in `data.content` */
export interface PaymentHistoryDto {
  id: number;
  /** 대상(학교·캠페인) 이름 */
  targetName: string;
  /** 대상 유형 (CAMPAIGN | SCHOOL) */
  targetType: TargetTypeDto | string;
  totalAmount: number;
  paymentMethod: PaymentMethodDto;
  donatorName: string;
  photoUrl?: string | null;
  donatedAt: string;
}

/** Body for POST /api/donations/details */
export interface SubmitDonationDetailsPayload {
  merchantUid: string;
  donatorName: string;
  phoneNumber: string;
  imageUrl: string | null;
}

/** Response data from POST /api/donations/details */
export interface DonationDetailsResponse {
  campaignName: string;
  imageUrl: string | null;
  amount: number;
  donatorName: string;
}

export interface PaymentHistoryParams extends PageParams {
  /** 대상 유형 필터 (CAMPAIGN | SCHOOL). 미전송 시 전체 */
  targetType?: TargetTypeDto;
  /** 기부자 이름 검색 (대소문자 무시) */
  donatorName?: string;
  /** 대상(학교/캠페인) 이름 검색 (대소문자 무시) */
  targetName?: string;
}

export interface WallEntry {
  id: string;
  donorName: string;
  amount: number;
  /** 대상(학교/캠페인) 이름 */
  campaignName: string;
  targetType: TargetTypeDto | string;
  paymentMethod: string;
  donatedAt: string;
  timeAgo: string;
  photoUrl?: string;
  isNew?: boolean;
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

/** GET /api/donations/schools — region(시·도) codes */
export type SchoolRegionCode =
  | "SEOUL"
  | "BUSAN"
  | "DAEGU"
  | "INCHEON"
  | "GWANGJU"
  | "DAEJEON"
  | "ULSAN"
  | "SEJONG"
  | "GYEONGGI"
  | "GANGWON"
  | "CHUNGBUK"
  | "CHUNGNAM"
  | "JEONBUK"
  | "JEONNAM"
  | "GYEONGBUK"
  | "GYEONGNAM"
  | "JEJU";

/** GET /api/donations/schools — sort */
export type SchoolSort = "NAME" | "DONATION";

export interface SchoolDto {
  id: number;
  name: string;
  description: string;
  imageUrl: string;
  address: string;
  region: SchoolRegionCode;
  regionLabel: string;
  initial: string;
  active: boolean;
  accumulatedAmount: number;
  createdAt: string;
}

export interface SchoolListParams extends PageParams {
  /** 지역(시·도) 코드 */
  region?: SchoolRegionCode;
  /** 초성 필터(ㄱ~ㅎ, 기타) */
  initial?: string;
  /** 검색어(학교명) */
  keyword?: string;
  /** 정렬: NAME(기본) | DONATION(누적 기부액순) */
  sort?: SchoolSort;
  /** 비활성 학교 포함 여부. 기본 false(키오스크=활성만), 관리자는 true */
  includeInactive?: boolean;
}
