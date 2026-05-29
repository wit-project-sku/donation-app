import { useState } from "react";
import defaultDonationImage from "../assets/hero.png";
import type { Campaign, DonationType } from "../types";
import "./ReceiptCard.css";

interface ReceiptCardProps {
  amount: number;
  donationType: DonationType;
  campaign: Campaign;
  note?: string;
}

export function ReceiptCard({ amount, campaign }: ReceiptCardProps) {
  const formattedAmount = amount.toLocaleString("ko-KR");
  const [imageSrc, setImageSrc] = useState(
    campaign.imageUrl || defaultDonationImage,
  );

  return (
    <div className="receipt-card">
      <div className="receipt-card__amount-row">
        <span className="receipt-card__amount">{formattedAmount}</span>
        <span className="receipt-card__won">원</span>
      </div>

      <div className="receipt-card__divider" />

      <div className="receipt-card__campaign">
        <div className="receipt-card__image-wrap">
          <img
            className="receipt-card__image"
            src={imageSrc}
            alt={campaign.title}
            onError={() => setImageSrc(defaultDonationImage)}
          />
        </div>
        <div className="receipt-card__campaign-text">
          <span className="receipt-card__title">{campaign.title}</span>
          <span className="receipt-card__desc">{campaign.description}</span>
        </div>
      </div>
    </div>
  );
}
