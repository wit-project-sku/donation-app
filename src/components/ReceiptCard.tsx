import type { Campaign, DonationType } from "../types";
import "./ReceiptCard.css";

interface ReceiptCardProps {
  amount: number;
  donationType: DonationType;
  campaign: Campaign;
  note?: string;
}

export function ReceiptCard({
  amount,
  donationType,
  campaign,
}: ReceiptCardProps) {
  const typeLabel = donationType === "one-time" ? "/ 일시 후원" : "/ 정기 후원";
  const formattedAmount = amount.toLocaleString("ko-KR");
  return (
    <div className="receipt-card">
      {/* Left half — price */}
      <div className="receipt-card__left">
        <div className="receipt-card__price-box">
          <span className="receipt-card__amount">{formattedAmount}</span>
          <span className="receipt-card__won">원</span>
          <span className="receipt-card__type">{typeLabel}</span>
        </div>
      </div>

      <div className="receipt-card__divider" />

      {/* Right half — campaign info */}
      <div className="receipt-card__right">
        <div className="receipt-card__campaign-image">
          {campaign.imageUrl ? (
            <img src={campaign.imageUrl} alt={campaign.title} className="receipt-card__img" />
          ) : (
            <div className="receipt-card__img-placeholder" />
          )}
        </div>
        <div className="receipt-card__campaign-text">
          <span className="receipt-card__title">{campaign.title}</span>
          <span className="receipt-card__desc">{campaign.description}</span>
        </div>
      </div>
    </div>
  );
}
