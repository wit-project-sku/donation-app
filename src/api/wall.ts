import { fetchPaymentHistory } from "./paymentHistory";
import type { PaymentHistoryParams } from "./types";

export interface WallEntry {
  id: string;
  donorName: string;
  message: string;
  amount: number;
  campaignName: string;
  paymentMethod: string;
  timeAgo: string;
  photoUrl?: string;
  isNew?: boolean;
}

export async function fetchWallEntries(
  params: PaymentHistoryParams = {},
): Promise<WallEntry[]> {
  return fetchPaymentHistory({
    pageNum: 1,
    pageSize: params.pageSize ?? 50,
    keyword: params.keyword ?? "",
  });
}

/** Split entries into vertical columns for horizontal swiper */
export function buildWallColumns(
  entries: WallEntry[],
  columnCount = 4,
): WallEntry[][] {
  const columns: WallEntry[][] = Array.from({ length: columnCount }, () => []);
  entries.forEach((entry, index) => {
    columns[index % columnCount].push(entry);
  });
  return columns.filter((col) => col.length > 0);
}
