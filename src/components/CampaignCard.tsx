import { memo } from "react";
import type { Campaign } from "../types";
import { useTheme } from "../theme/ThemeContext";
import "./CampaignCard.css";

interface CampaignCardProps {
  campaign: Campaign;
  isSelected?: boolean;
  onSelect: () => void;
}

function CampaignCardComponent({
  campaign,
  isSelected,
  onSelect,
}: CampaignCardProps) {
  const { theme } = useTheme();

  return (
    <button
      type="button"
      className={`campaign-card ${isSelected ? "campaign-card--selected" : ""}`}
      onClick={onSelect}
      style={{
        backgroundColor: theme.card.background,
      }}
    >
      <img
        className="campaign-card__bg"
        src={campaign.imageUrl}
        alt={campaign.title}
        decoding="async"
        loading="lazy"
      />
      <div className="campaign-card__overlay" />
      <div className="campaign-card__content">
        <div className="campaign-card__left">
          <h3
            className="campaign-card__title"
            style={{ color: theme.primary }}
          >
            {campaign.title}
          </h3>
          <p
            className="campaign-card__desc"
            style={{ color: theme.secondary }}
          >
            {campaign.description}
          </p>
        </div>
      </div>
    </button>
  );
}

export const CampaignCard = memo(CampaignCardComponent);
