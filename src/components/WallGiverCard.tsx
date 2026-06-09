import { CertificateFrameBorder } from "./CertificateFrameBorder";
import { IconHeart } from "./Icon";
import {
  resolveCertificatePhotoUrl,
  resolveDonationPhotoUrl,
} from "../utils/defaultDonationImage";
import { formatCurrency, formatDonationDate } from "../utils/format";
import "./WallGiverCard.css";

const WALL_GRATITUDE_MESSAGE =
  "귀하의 따뜻한 마음과 의미 있는 기여에\n깊은 감사를 전합니다";

interface WallGiverCardProps {
  donorName: string;
  amount: number;
  campaignName: string;
  campaignImageUrl?: string;
  photoUrl?: string;
  donatedAt?: string;
  isNew?: boolean;
}

export function WallGiverCard({
  donorName,
  amount,
  campaignName,
  campaignImageUrl,
  photoUrl,
  donatedAt,
  isNew,
}: WallGiverCardProps) {
  const dateLabel = donatedAt ? formatDonationDate(donatedAt) : "";
  const hasPhoto = Boolean(photoUrl?.trim());
  const imageUrl = hasPhoto
    ? resolveDonationPhotoUrl(photoUrl, campaignImageUrl)
    : resolveCertificatePhotoUrl(null);
  const subtitle = `· ${campaignName.trim() || "소중한 나눔"} ·`;

  return (
    <article
      className={`wall-giver-card${isNew ? " wall-giver-card--new" : ""}`}
      aria-label="기부 증서"
    >
      <div className="wall-giver-card__body">
        <header className="wall-giver-card__header">
          <div className="wall-giver-card__title-wrap">
            <h3 className="wall-giver-card__title">기부증서</h3>
            <p className="wall-giver-card__subtitle">{subtitle}</p>
          </div>
          {isNew ? (
            <span className="wall-giver-card__badge">방금 참여</span>
          ) : null}
        </header>

        <div className="wall-giver-card__photo-wrap">
          <img
            className={`wall-giver-card__photo${hasPhoto ? "" : " wall-giver-card__photo--default"}`}
            src={imageUrl}
            alt=""
            loading="lazy"
          />
        </div>

        <footer className="wall-giver-card__info">
          <div className="wall-giver-card__amount-row">
            <IconHeart className="wall-giver-card__heart" aria-hidden />
            <span className="wall-giver-card__amount">
              {formatCurrency(amount)}원
            </span>
          </div>

          {donorName ? (
            <span className="wall-giver-card__name">{donorName}</span>
          ) : null}

          <p className="wall-giver-card__message">{WALL_GRATITUDE_MESSAGE}</p>

          {dateLabel ? (
            <span className="wall-giver-card__date">{dateLabel}</span>
          ) : null}
        </footer>
      </div>

      <CertificateFrameBorder className="wall-giver-card__frame-border" />
    </article>
  );
}
