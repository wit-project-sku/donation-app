import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Download } from "lucide-react";
import { formatCurrency } from "../utils/format";
import "./MobileCertificatePage.css";

function getParam(params: URLSearchParams, key: string, fallback = "") {
  return params.get(key)?.trim() || fallback;
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function MobileCertificatePage() {
  const [params] = useSearchParams();
  const name = getParam(params, "n") || getParam(params, "name", "후원자");
  const message = getParam(params, "message");
  const date = getParam(params, "d") || getParam(params, "date");
  const photo = getParam(params, "p") || getParam(params, "photo");
  const amount = Number(getParam(params, "a") || getParam(params, "amount", "0"));
  const amountLabel = `${formatCurrency(amount)}원`;

  const svgSource = useMemo(() => {
    const imageNode = photo
      ? `<image href="${escapeXml(photo)}" x="150" y="190" width="420" height="640" preserveAspectRatio="xMidYMin slice" clip-path="url(#photoClip)" />`
      : `<rect x="150" y="190" width="420" height="640" rx="18" fill="#e8e8e8" />`;

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="720" height="1080" viewBox="0 0 720 1080">
  <defs>
    <clipPath id="photoClip"><rect x="150" y="190" width="420" height="640" rx="18"/></clipPath>
  </defs>
  <rect width="720" height="1080" fill="#ffffff"/>
  <rect x="70" y="40" width="580" height="1000" rx="32" fill="#ffffff" stroke="#ffd3e9" stroke-width="28"/>
  <circle cx="70" cy="40" r="42" fill="#ffd3e9"/>
  <circle cx="70" cy="1040" r="42" fill="#ffd3e9"/>
  <text x="360" y="132" text-anchor="middle" font-family="Arial, sans-serif" font-size="34" font-weight="700" fill="#333333">기부증서</text>
  ${imageNode}
  <line x1="150" y1="870" x2="570" y2="870" stroke="#ff9bc9" stroke-width="2"/>
  <text x="360" y="925" text-anchor="middle" font-family="Arial, sans-serif" font-size="46" font-weight="700" fill="#FF7BB7">${escapeXml(amountLabel)}</text>
  <text x="360" y="975" text-anchor="middle" font-family="Arial, sans-serif" font-size="30" font-weight="700" fill="#333333">${escapeXml(name)}</text>
  <line x1="150" y1="1000" x2="570" y2="1000" stroke="#ff9bc9" stroke-width="2"/>
  <text x="360" y="1032" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" fill="#555555">${escapeXml(message)}</text>
  <text x="360" y="1058" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" fill="#999999">${escapeXml(date)}</text>
</svg>`;
  }, [amountLabel, date, message, name, photo]);

  const [downloading, setDownloading] = useState(false);

  const downloadImage = async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      if (photo) {
        // fetch the S3 image as a blob so the browser saves it as a file
        const res = await fetch(photo);
        const blob = await res.blob();
        const ext = blob.type.includes("png") ? "png" : "jpg";
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `donation.${ext}`;
        link.click();
        URL.revokeObjectURL(url);
      } else {
        // no photo — fall back to downloading the SVG certificate
        const blob = new Blob([svgSource], { type: "image/svg+xml;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "donation-certificate.svg";
        link.click();
        URL.revokeObjectURL(url);
      }
    } catch {
      // CORS blocked — open in new tab so the user can long-press → save
      if (photo) window.open(photo, "_blank");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <main className="mobile-cert">
      <article className="mobile-cert__card" aria-label="기부 증서">
        <h1 className="mobile-cert__title">기부증서</h1>

        <div className="mobile-cert__photo-wrap">
          {photo ? (
            <img className="mobile-cert__photo" src={photo} alt="" />
          ) : (
            <div className="mobile-cert__photo mobile-cert__photo--empty" />
          )}
        </div>

        <div className="mobile-cert__info">
          <strong className="mobile-cert__amount">{amountLabel}</strong>
          {name ? <span className="mobile-cert__name">{name}</span> : null}
          {message ? <p className="mobile-cert__message">{message}</p> : null}
          {date ? <span className="mobile-cert__date">{date}</span> : null}
        </div>
      </article>

      <button
        type="button"
        className="mobile-cert__download"
        onClick={downloadImage}
        disabled={downloading}
      >
        <Download size={20} strokeWidth={2.5} aria-hidden />
        {downloading ? "저장 중..." : "사진 저장하기"}
      </button>
    </main>
  );
}
