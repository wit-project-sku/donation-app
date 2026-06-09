import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Download } from "lucide-react";
import { getLocationTheme } from "../theme/locations";
import { resolveCertificatePhotoUrl } from "../utils/defaultDonationImage";
import { formatCurrency } from "../utils/format";
import {
  downloadMobileCertificate,
  formatMobilePhone,
} from "../utils/mobileCertificateDownload";
import "./MobileCertificatePage.css";

function getParam(params: URLSearchParams, key: string, fallback = "") {
  return params.get(key)?.trim() || fallback;
}

function formatDisplayDate(value: string) {
  const isoMatch = value.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (isoMatch) {
    return `${isoMatch[1]}년 ${Number(isoMatch[2])}월 ${Number(isoMatch[3])}일`;
  }
  return value;
}

export function MobileCertificatePage() {
  const [params] = useSearchParams();
  const theme = getLocationTheme(params.get("location") || "insadong");
  const name = getParam(params, "n") || getParam(params, "name", "후원자");
  const phone = getParam(params, "ph") || getParam(params, "phone");
  const message = getParam(params, "message");
  const rawDate = getParam(params, "d") || getParam(params, "date");
  const photo = getParam(params, "p") || getParam(params, "photo");
  const amount = Number(getParam(params, "a") || getParam(params, "amount", "0"));
  const amountLabel = `${formatCurrency(amount)}원`;
  const photoSrc = resolveCertificatePhotoUrl(photo || null);
  const date = useMemo(
    () => (rawDate ? formatDisplayDate(rawDate) : ""),
    [rawDate],
  );
  const phoneLabel = useMemo(
    () => (phone ? formatMobilePhone(phone) : ""),
    [phone],
  );

  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const root = document.getElementById("root");
    const previous = {
      htmlOverflow: html.style.overflow,
      bodyOverflow: body.style.overflow,
      rootOverflow: root?.style.overflow ?? "",
    };

    html.style.overflow = "auto";
    body.style.overflow = "auto";
    if (root) root.style.overflow = "auto";

    return () => {
      html.style.overflow = previous.htmlOverflow;
      body.style.overflow = previous.bodyOverflow;
      if (root) root.style.overflow = previous.rootOverflow;
    };
  }, []);

  const downloadImage = async () => {
    if (downloading) return;
    setDownloading(true);
    setDownloadError(null);

    try {
      await downloadMobileCertificate({
        photoSrc,
        name,
        phone,
        amountLabel,
        date,
        message,
      });
    } catch {
      setDownloadError("저장에 실패했습니다. 다시 시도해 주세요.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <main
      className="mobile-cert"
      style={{ backgroundColor: theme.background }}
    >
      <div className="mobile-cert__scroll">
        <article className="mobile-cert__card" aria-label="기부 증서">
          <h1 className="mobile-cert__title">기부증서</h1>

          <div className="mobile-cert__photo-wrap">
            {photoSrc ? (
              <img
                className="mobile-cert__photo"
                src={photoSrc}
                alt=""
                crossOrigin="anonymous"
              />
            ) : (
              <div className="mobile-cert__photo mobile-cert__photo--empty" />
            )}
          </div>

          <div className="mobile-cert__info">
            <strong className="mobile-cert__amount">{amountLabel}</strong>
            {name ? <span className="mobile-cert__name">{name}</span> : null}
            {phoneLabel ? (
              <span className="mobile-cert__phone">{phoneLabel}</span>
            ) : null}
            {message ? <p className="mobile-cert__message">{message}</p> : null}
            {date ? <span className="mobile-cert__date">{date}</span> : null}
          </div>
        </article>

        {downloadError ? (
          <p className="mobile-cert__error" role="alert">
            {downloadError}
          </p>
        ) : null}

        <button
          type="button"
          className="mobile-cert__download"
          onClick={downloadImage}
          disabled={downloading}
        >
          <Download size={20} strokeWidth={2.5} aria-hidden />
          {downloading ? "저장 중..." : "사진 저장하기"}
        </button>
      </div>
    </main>
  );
}
