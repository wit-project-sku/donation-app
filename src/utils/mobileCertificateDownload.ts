function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => {
      const fallback = new Image();
      fallback.onload = () => resolve(fallback);
      fallback.onerror = () => reject(new Error("Image load failed"));
      fallback.src = src;
    };
    img.src = src;
  });
}

export function formatMobilePhone(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 11) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return value.trim();
}

export interface MobileCertificateDownloadInput {
  photoSrc?: string | null;
  name: string;
  phone?: string;
  amountLabel: string;
  date?: string;
  message?: string;
}

async function renderCertificateBlob(
  input: MobileCertificateDownloadInput,
): Promise<Blob> {
  const width = 720;
  const height = 1080;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not supported");

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  roundRectPath(ctx, 70, 40, 580, 1000, 32);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.strokeStyle = "#ffd3e9";
  ctx.lineWidth = 28;
  ctx.stroke();

  ctx.fillStyle = "#ffd3e9";
  ctx.beginPath();
  ctx.arc(70, 40, 42, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(70, 1040, 42, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#333333";
  ctx.font = "700 34px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillText("기부증서", 360, 132);

  if (input.photoSrc) {
    try {
      const img = await loadImage(input.photoSrc);
      ctx.save();
      roundRectPath(ctx, 150, 190, 420, 640, 18);
      ctx.clip();
      ctx.drawImage(img, 150, 190, 420, 640);
      ctx.restore();
    } catch {
      roundRectPath(ctx, 150, 190, 420, 640, 18);
      ctx.fillStyle = "#e8e8e8";
      ctx.fill();
    }
  } else {
    roundRectPath(ctx, 150, 190, 420, 640, 18);
    ctx.fillStyle = "#e8e8e8";
    ctx.fill();
  }

  ctx.strokeStyle = "#ff9bc9";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(150, 870);
  ctx.lineTo(570, 870);
  ctx.stroke();

  ctx.fillStyle = "#FF7BB7";
  ctx.font = "700 46px Arial, sans-serif";
  ctx.fillText(input.amountLabel, 360, 925);

  ctx.fillStyle = "#333333";
  ctx.font = "700 30px Arial, sans-serif";
  ctx.fillText(input.name, 360, 968);

  let infoY = 1000;
  if (input.phone?.trim()) {
    ctx.fillStyle = "#666666";
    ctx.font = "500 24px Arial, sans-serif";
    ctx.fillText(formatMobilePhone(input.phone), 360, infoY);
    infoY += 28;
  }

  if (input.message?.trim()) {
    ctx.fillStyle = "#555555";
    ctx.font = "500 16px Arial, sans-serif";
    ctx.fillText(input.message, 360, infoY);
    infoY += 22;
  }

  if (input.date?.trim()) {
    ctx.fillStyle = "#999999";
    ctx.font = "500 14px Arial, sans-serif";
    ctx.fillText(input.date, 360, Math.max(infoY, 1048));
  }

  return await new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Failed to create image"));
      },
      "image/png",
      0.92,
    );
  });
}

function triggerBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function downloadMobileCertificate(
  input: MobileCertificateDownloadInput,
): Promise<void> {
  const blob = await renderCertificateBlob(input);
  const filename = "donation-certificate.png";
  const file = new File([blob], filename, { type: "image/png" });

  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: "기부증서" });
      return;
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
    }
  }

  triggerBlobDownload(blob, filename);
}
