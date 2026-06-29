import { QRCodeSVG } from "qrcode.react";
import {
  resolveCertificatePhotoUrl,
  resolveDonationPhotoUrl,
} from "../utils/defaultDonationImage";
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
  const subtitle = `- ${campaignName.trim() || "소중한 나눔"} -`;

  const qrValue = [donorName.trim(), amount, dateLabel]
    .filter(Boolean)
    .join("|");

  return (
    <article
      className={`wall-giver-card${isNew ? " wall-giver-card--new" : ""}`}
      aria-label="기부 증서"
    >
      <header className="wall-giver-card__head">
        <h3 className="wall-giver-card__title">· 기부증서 ·</h3>
        <p className="wall-giver-card__subtitle">{subtitle}</p>
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

      <div className="wall-giver-card__sign">
        {donorName ? (
          <span className="wall-giver-card__name">{donorName}</span>
        ) : null}
        <span className="wall-giver-card__line" aria-hidden />
        <div className="wall-giver-card__sign-row">
          <img
            className="wall-giver-card__partner"
            src={unicefLogo}
            alt="unicef"
          />
          <div className="wall-giver-card__qr" aria-label="모바일 증서 QR">
            <QRCodeSVG
              value={qrValue || "donation"}
              size={48}
              bgColor="#FFFFFF"
              fgColor="#000000"
              level="M"
              marginSize={1}
            />
          </div>
        </div>
      </div>

      <footer className="wall-giver-card__foot">
        <p className="wall-giver-card__message">
          귀하의 따뜻한 마음과 의미 있는 기여에
          <br />
          깊은 감사를 전합니다
        </p>
        {dateLabel ? (
          <span className="wall-giver-card__date">{dateLabel}</span>
        ) : null}
      </footer>
    </article>
  );
}
