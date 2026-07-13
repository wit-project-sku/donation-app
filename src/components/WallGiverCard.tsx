import { resolveDonationPhotoUrl } from "../utils/defaultDonationImage";
import { formatDonationDate } from "../utils/format";
import unicefLogo from "../assets/logo-unicef.png";
import heartDefault from "../assets/donated.png";
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
  const hasPhoto = Boolean(photoUrl?.trim());
  // No donor photo → show the default heart illustration (contained, not cropped).
  const imageUrl = hasPhoto
    ? resolveDonationPhotoUrl(photoUrl, campaignImageUrl)
    : heartDefault;
  const label = campaignName.trim() || "소중한 나눔";

  return (
    <article
      className={`wall-giver-card${isNew ? " wall-giver-card--new" : ""}`}
      aria-label="기부 증서"
    >
      <span
        className={`wall-giver-card__photo${hasPhoto ? "" : " wall-giver-card__photo--placeholder"}`}
      >
        <img
          className={`wall-giver-card__img${hasPhoto ? "" : " wall-giver-card__img--placeholder"}`}
          src={imageUrl}
          alt=""
          loading="lazy"
        />
        {/* 하단 오버레이 — 증서 페이지와 동일하게 주최단체 로고를 하단 바에
            가운데·contain 으로 노출 (좌상단 원형 뱃지 대신). */}
        <span className="wall-giver-card__overlay">
          <img className="wall-giver-card__emblem" src={unicefLogo} alt={label} />
        </span>
        {isNew ? (
          <span className="wall-giver-card__badge">방금 참여</span>
        ) : null}
      </span>

      <span className="wall-giver-card__meta">
        <span className="wall-giver-card__line" aria-hidden />
        {dateLabel ? (
          <span className="wall-giver-card__date">{dateLabel}</span>
        ) : null}
        {donorName ? (
          <span className="wall-giver-card__name">{donorName}</span>
        ) : null}
        <span className="wall-giver-card__line" aria-hidden />
      </span>
    </article>
  );
}
