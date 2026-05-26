import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
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
  const name = getParam(params, "name", "후원자");
  const message = getParam(
    params,
    "message",
    "귀하의 따뜻한 마음과 의미 있는 기여에 깊은 감사를 전합니다.",
  );
  const date = getParam(params, "date");
  const photo = getParam(params, "photo");
  const amount = Number(getParam(params, "amount", "0"));
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
  <text x="360" y="805" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" font-weight="700" fill="#00a4e4">unicef</text>
  <line x1="150" y1="870" x2="570" y2="870" stroke="#ff9bc9" stroke-width="2"/>
  <text x="360" y="925" text-anchor="middle" font-family="Arial, sans-serif" font-size="46" font-weight="700" fill="#FF7BB7">${escapeXml(amountLabel)}</text>
  <text x="360" y="975" text-anchor="middle" font-family="Arial, sans-serif" font-size="30" font-weight="700" fill="#333333">${escapeXml(name)}</text>
  <line x1="150" y1="1000" x2="570" y2="1000" stroke="#ff9bc9" stroke-width="2"/>
  <text x="360" y="1032" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" fill="#555555">${escapeXml(message)}</text>
  <text x="360" y="1058" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" fill="#999999">${escapeXml(date)}</text>
</svg>`;
  }, [amountLabel, date, message, name, photo]);

  const downloadCertificate = () => {
    const blob = new Blob([svgSource], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "donation-certificate.svg";
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
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
          <span className="mobile-cert__brand">unicef</span>
        </div>

        <div className="mobile-cert__info">
          <strong className="mobile-cert__amount">{amountLabel}</strong>
          <span className="mobile-cert__name">{name}</span>
          <p className="mobile-cert__message">{message}</p>
          <span className="mobile-cert__date">{date}</span>
        </div>
      </article>

      <button
        type="button"
        className="mobile-cert__download"
        onClick={downloadCertificate}
      >
        증서 다운로드
      </button>
    </main>
  );
}
