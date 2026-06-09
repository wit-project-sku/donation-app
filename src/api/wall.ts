import { fetchPaymentHistoryPage } from "./paymentHistory";
import type { PaginatedData, PaymentHistoryParams, WallEntry } from "./types";

export type { WallEntry };

export async function fetchWallEntriesPage(
  params: PaymentHistoryParams = {},
): Promise<PaginatedData<WallEntry>> {
  return fetchPaymentHistoryPage({
    pageNum: params.pageNum ?? 1,
    pageSize: params.pageSize ?? 6,
    keyword: params.keyword ?? "",
  });
}
