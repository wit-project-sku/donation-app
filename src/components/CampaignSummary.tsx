import type { Campaign } from "../types";
import "./CampaignSummary.css";

interface CampaignSummaryProps {
  campaign: Campaign;
  compact?: boolean;
}

export function CampaignSummary({ campaign, compact }: CampaignSummaryProps) {
  return (
    <div className={`campaign-summary ${compact ? "campaign-summary--compact" : ""}`}>
      <img
        className="campaign-summary__thumb"
        src={campaign.imageUrl}
        alt=""
        loading="lazy"
      />
      <div className="campaign-summary__info">
        <h3 className="campaign-summary__title">{campaign.title}</h3>
        <p className="campaign-summary__desc">{campaign.description}</p>
      </div>
    </div>
  );
}
