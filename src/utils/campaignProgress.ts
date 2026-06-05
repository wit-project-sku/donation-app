import type { Campaign } from "../types";
import { formatCurrency } from "./format";

export function getCampaignProgressPercent(
  accumulatedAmount = 0,
  targetAmount = 0,
): number {
  if (!Number.isFinite(targetAmount) || targetAmount <= 0) return 0;
  const accumulated = Number.isFinite(accumulatedAmount) ? accumulatedAmount : 0;
  return Math.min(100, Math.round((accumulated / targetAmount) * 100));
}

export function formatCampaignProgressAmounts(campaign: Pick<Campaign, "accumulatedAmount" | "targetAmount">) {
  const accumulated = campaign.accumulatedAmount ?? 0;
  const target = campaign.targetAmount ?? 0;
  return {
    accumulated,
    target,
    label: `${formatCurrency(accumulated)}원 / ${formatCurrency(target)}원`,
    percent: getCampaignProgressPercent(accumulated, target),
  };
}
