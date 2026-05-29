import { formatCurrency } from "../utils/format";
import "./WallGiverCard.css";

interface WallGiverCardProps {
  donorName: string;
  amount: number;
  campaignName: string;
  campaignImageUrl?: string;
  donationType?: string;
  photoUrl?: string;
  timeAgo?: string;
  isNew?: boolean;
}

export function WallGiverCard({
  donorName,
  amount,
  campaignImageUrl,
  photoUrl,
  timeAgo,
  isNew,
}: WallGiverCardProps) {
  const imageUrl = photoUrl ?? campaignImageUrl;

  return (
    <article className={`wall-giver-card${isNew ? " wall-giver-card--new" : ""}`}>
      <h3 className="wall-giver-card__title">기부증서</h3>

      <div className="wall-giver-card__photo-wrap">
        {imageUrl ? (
          <img className="wall-giver-card__photo" src={imageUrl} alt="" />
        ) : (
          <div className="wall-giver-card__photo wall-giver-card__photo--placeholder" />
        )}
      </div>

      <div className="wall-giver-card__info">
        <span className="wall-giver-card__amount">
          {formatCurrency(amount)}원
        </span>
        {donorName ? (
          <span className="wall-giver-card__name">{donorName}</span>
        ) : null}
        {timeAgo ? (
          <span className="wall-giver-card__date">{timeAgo}</span>
        ) : null}
      </div>
    </article>
  );
}
