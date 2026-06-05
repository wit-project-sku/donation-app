import { resolveDonationPhotoUrl } from "../utils/defaultDonationImage";
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
  const imageUrl = resolveDonationPhotoUrl(photoUrl, campaignImageUrl);

  return (
    <article
      className={`wall-giver-card${isNew ? " wall-giver-card--new" : ""}`}
      aria-label="기부 증서"
    >
      <div className="wall-giver-card__notches" aria-hidden>
        <span className="wall-giver-card__notch wall-giver-card__notch--tl" />
        <span className="wall-giver-card__notch wall-giver-card__notch--tr" />
        <span className="wall-giver-card__notch wall-giver-card__notch--bl" />
        <span className="wall-giver-card__notch wall-giver-card__notch--br" />
      </div>

      <div className="wall-giver-card__card-header">
        <h3 className="wall-giver-card__title">기부증서</h3>
        {isNew ? (
          <span className="wall-giver-card__badge">방금 참여</span>
        ) : null}
      </div>

      <div className="wall-giver-card__photo-wrap">
        <img className="wall-giver-card__photo" src={imageUrl} alt="" loading="lazy" />
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
