import { formatCurrency } from "../utils/format";
import "./WallGiverCard.css";

interface WallGiverCardProps {
  donorName: string;
  message: string;
  amount: number;
  campaignName: string;
  campaignImageUrl?: string;
  donationType?: string;
  photoUrl?: string;
  isNew?: boolean;
}

export function WallGiverCard({
  donorName,
  message,
  amount,
  campaignName,
  campaignImageUrl,
  donationType = "일시 후원",
  photoUrl,
  isNew,
}: WallGiverCardProps) {
  return (
    <article className={`wall-giver-card${isNew ? " wall-giver-card--new" : ""}`}>
      <h3 className="wall-giver-card__title">기부 증서</h3>

      <div className="wall-giver-card__body">
        <div className="wall-giver-card__photo-wrap">
          {photoUrl ? (
            <img className="wall-giver-card__photo" src={photoUrl} alt="" />
          ) : (
            <div className="wall-giver-card__photo wall-giver-card__photo--placeholder" />
          )}
        </div>

        <div className="wall-giver-card__fields">
          <div className="wall-giver-card__field">
            <span
              className={`wall-giver-card__field-value${!donorName ? " wall-giver-card__field-value--placeholder" : ""}`}
            >
              {donorName || "이름"}
            </span>
            <span className="wall-giver-card__field-line" />
          </div>
          <div className="wall-giver-card__field">
            <span
              className={`wall-giver-card__field-value${!message ? " wall-giver-card__field-value--placeholder" : ""}`}
            >
              {message || "메세지"}
            </span>
            <span className="wall-giver-card__field-line" />
          </div>
        </div>
      </div>

      <div className="wall-giver-card__campaign">
        {campaignImageUrl ? (
          <img
            className="wall-giver-card__campaign-thumb"
            src={campaignImageUrl}
            alt=""
          />
        ) : (
          <div className="wall-giver-card__campaign-thumb wall-giver-card__campaign-thumb--placeholder" />
        )}
        <div className="wall-giver-card__campaign-info">
          <span className="wall-giver-card__campaign-name">{campaignName}</span>
        </div>
        <div className="wall-giver-card__amount-wrap">
          <span className="wall-giver-card__type">{donationType}</span>
          <span className="wall-giver-card__amount">
            {formatCurrency(amount)} 원
          </span>
        </div>
      </div>
    </article>
  );
}
