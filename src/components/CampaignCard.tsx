import type { Campaign } from "../types";
import "./CampaignCard.css";

interface CampaignCardProps {
  campaign: Campaign;
  isSelected?: boolean;
  onSelect: () => void;
}

export function CampaignCard({
  campaign,
  isSelected,
  onSelect,
}: CampaignCardProps) {
  return (
    <button
      type="button"
      className={`campaign-card ${isSelected ? "campaign-card--selected" : ""}`}
      onClick={onSelect}
    >
      <div
        className="campaign-card__bg"
        style={{ backgroundImage: `url(${campaign.imageUrl})` }}
      />
      <div className="campaign-card__overlay" />
      <div className="campaign-card__content">
        <div className="campaign-card__left">
          <h3 className="campaign-card__title">{campaign.title}</h3>
          <p className="campaign-card__desc">{campaign.description}</p>
        </div>
      </div>
    </button>
  );
}
