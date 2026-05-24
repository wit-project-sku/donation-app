import { apiGet } from "./client";
import type {
  PaginatedData,
  PaymentHistoryDto,
  PaymentHistoryParams,
  PaymentMethodDto,
} from "./types";
import type { WallEntry } from "./wall";

const PAYMENT_HISTORY_PATH = "/api/donations/payment/history";

function formatTimeAgo(isoDate: string): string {
  const then = new Date(isoDate).getTime();
  const now = Date.now();
  const diffMs = Math.max(0, now - then);
  const minutes = Math.floor(diffMs / 60_000);
  const hours = Math.floor(diffMs / 3_600_000);
  const days = Math.floor(diffMs / 86_400_000);
  const weeks = Math.floor(days / 7);

  if (minutes < 1) return "NOW";
  if (minutes < 60) return `${minutes}M AGO`;
  if (hours < 24) return `${hours}H AGO`;
  if (days < 7) return `${days}D AGO`;
  if (weeks < 5) return `${weeks}W AGO`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}MO AGO`;
  return `${Math.floor(days / 365)}Y AGO`;
}

function formatPaymentMethod(method: PaymentMethodDto): string {
  switch (method) {
    case "CARD":
      return "카드";
    case "KAKAO":
      return "카카오 페이";
    case "NAVER":
      return "네이버 페이";
    default:
      return method;
  }
}

function mapPaymentToWallEntry(item: PaymentHistoryDto): WallEntry {
  return {
    id: String(item.id),
    donorName: item.donatorName || "Anonymous",
    message: item.message?.trim() ?? "",
    amount: item.totalAmount,
    campaignName: item.campaignName,
    paymentMethod: formatPaymentMethod(item.paymentMethod),
    timeAgo: formatTimeAgo(item.donatedAt),
    photoUrl: item.photoUrl ?? undefined,
    isNew: formatTimeAgo(item.donatedAt) === "NOW",
  };
}

export async function fetchPaymentHistoryPage(
  params: PaymentHistoryParams = {},
): Promise<PaginatedData<WallEntry>> {
  const data = await apiGet<PaginatedData<PaymentHistoryDto>>(
    PAYMENT_HISTORY_PATH,
    {
      pageNum: params.pageNum ?? 1,
      pageSize: params.pageSize ?? 30,
      keyword: params.keyword ?? "",
    },
  );

  return {
    ...data,
    content: data.content.map(mapPaymentToWallEntry),
  };
}

export async function fetchPaymentHistory(
  params: PaymentHistoryParams = {},
): Promise<WallEntry[]> {
  const entries: WallEntry[] = [];
  let pageNum = params.pageNum ?? 1;
  const pageSize = params.pageSize ?? 30;
  let last = false;

  while (!last) {
    const page = await fetchPaymentHistoryPage({
      ...params,
      pageNum,
      pageSize,
    });
    entries.push(...page.content);
    last = page.last;
    pageNum += 1;

    if (pageNum > page.totalPages && page.totalPages > 0) break;
    if (page.content.length === 0) break;
  }

  return entries;
}
