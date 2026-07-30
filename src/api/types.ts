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
  /** 홈 하단 배너 문구 (큰 글씨/작은 글씨). 미설정 시 null. */
  bannerTitle?: string | null;
  bannerSubtitle?: string | null;
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

/** `data` part for POST /api/donations/details (multipart; `photo` sent separately) */
export interface SubmitDonationDetailsPayload {
  merchantUid: string;
  donatorName: string;
  /** 학교 흐름 졸업연도. NGO 흐름은 없으므로 null. */
  graduationYear: number | null;
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

/** 의상 타입: NGO=PREMIUM, 학교=SCHOOL_UNIFORM */
export type OutfitType = "NORMAL" | "PREMIUM" | "SCHOOL_UNIFORM";

export interface OutfitParams extends PageParams {
  keyword?: string;
  status?: "ACTIVE" | "INACTIVE";
  /** 타입 필터 (미입력 시 전체) */
  type?: OutfitType;
  /** 소속 학교 필터 — 학교 교복(SCHOOL_UNIFORM)일 때 해당 학교 교복만 조회 */
  schoolId?: number;
}

export interface OutfitDto {
  id: number;
  categoryName: string;
  name: string;
  status: "ACTIVE" | "INACTIVE" | string;
  type: OutfitType | string;
  imageUrl: string;
  kioskIds?: number[];
  outfitCode: string;
  /** 학교 교복(SCHOOL_UNIFORM)일 때 소속 학교 */
  schoolId?: number | null;
  schoolName?: string | null;
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

/** GET /api/donations/schools — sort
 *  NAME(이름순, 기본) | DONATION(전국 누적 기부액순)
 *  | DONATION_REGION(지역 기준 누적 기부액순 — region 과 함께 쓰면 그 지역 내 순위순) */
export type SchoolSort = "NAME" | "DONATION" | "DONATION_REGION";

export interface SchoolDto {
  id: number;
  name: string;
  description: string;
  /**
   * 학교 로고(엠블럼). 기부증서 등에서 학교를 표시할 때 쓴다.
   * 백엔드가 안 내려주는 학교가 있을 수 있어 optional — 없으면 기본 엠블럼으로 폴백한다.
   */
  logoImageUrl?: string;
  /**
   * 학교 대표 이미지. 아직 화면에 쓰지 않는다(요청에 따라 보류).
   * 과거의 imageUrl 을 대체한 것으로 보인다 — 실 응답에 imageUrl 은 더 이상 없다.
   */
  thumbnailUrl?: string;
  /**
   * @deprecated 실 응답(api-stage-v3)에 더 이상 없다 → 항상 undefined.
   * 학교 상세 히어로 이미지가 로컬 기본 이미지로만 나오는 원인. 대체 필드는 thumbnailUrl.
   */
  imageUrl?: string;
  address: string;
  region: SchoolRegionCode;
  regionLabel: string;
  initial: string;
  active: boolean;
  /** 누적 기부액 (기부액 컬럼) */
  accumulatedAmount: number;
  /** 기부 참여자 수 (참여자 컬럼) */
  participantCount?: number;
  /** 학생 수 (수혜자 컬럼) */
  studentCount?: number;
  /** 하루 전 대비 순위 변동 (양수=상승 ▲, 음수=하락 ▼, 0=변동 없음). DONATION 정렬에서만 의미. */
  rankChange?: number;
  /** 전국 순위 (활성 학교 기준). DONATION/DONATION_REGION 정렬 응답에 포함. */
  nationwideRank?: number;
  /** 지역 내 순위 (활성 학교 기준). DONATION_REGION 정렬 + region 지정 시 의미. */
  regionRank?: number;
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
