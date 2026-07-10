import { resolveDonationPhotoUrl } from "../utils/defaultDonationImage";
import { formatDonationDate } from "../utils/format";
import unicefLogo from "../assets/logo-unicef.png";
import "./WallGiverCard.css";

interface WallGiverCardProps {
  donorName: string;
  amount: number;
  campaignName: string;
  campaignImageUrl?: string;
  photoUrl?: string;
  donatedAt?: string;
  isNew?: boolean;
}

/**
 * NGO 기부자의 벽 카드. 학교 기부한컷 카드(SchoolWallPage `.sw-card`)와 동일한
 * 사진 타일 스타일: 사진 + 좌상단 로고 + 하단 캠페인명, 그 아래 날짜·이름.
 */
export function WallGiverCard({
  donorName,
  campaignName,
  campaignImageUrl,
  photoUrl,
  donatedAt,
  isNew,
}: WallGiverCardProps) {
  const dateLabel = donatedAt ? formatDonationDate(donatedAt) : "";
  const imageUrl = resolveDonationPhotoUrl(photoUrl, campaignImageUrl);
  const label = campaignName.trim() || "소중한 나눔";

  return (
    <article
      className={`wall-giver-card${isNew ? " wall-giver-card--new" : ""}`}
      aria-label="기부 증서"
    >
      <span className="wall-giver-card__photo">
        <img
          className="wall-giver-card__img"
          src={imageUrl}
          alt=""
          loading="lazy"
        />
        <img className="wall-giver-card__emblem" src={unicefLogo} alt="" />
        <span className="wall-giver-card__label">{label}</span>
        {isNew ? (
          <span className="wall-giver-card__badge">방금 참여</span>
        ) : null}
      </span>

      <span className="wall-giver-card__meta">
        {dateLabel ? (
          <span className="wall-giver-card__date">{dateLabel}</span>
        ) : null}
        {donorName ? (
          <span className="wall-giver-card__name">{donorName}</span>
        ) : null}
      </span>
    </article>
  );
}
