import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageBody } from "../components/layout/PageBody";
import { useDonationStore } from "../store/donationStore";
import "./CameraCapturePage.css";

type CameraStatus =
  | "idle"
  | "requesting"
  | "streaming"
  | "captured"
  | "uploading"
  | "done"
  | "error";

const UPLOAD_ENDPOINT = "/api/kiosk/photo";

export function CameraCapturePage() {
  const navigate = useNavigate();
  const { setCapturedPhotoUrl } = useDonationStore();

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [status, setStatus] = useState<CameraStatus>("idle");
  const [capturedDataUrl, setCapturedDataUrl] = useState<string | null>(null);
  const [resultImageUrl, setResultImageUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");

  // Debug info
  const [debugInfo, setDebugInfo] = useState<{
    hasMediaDevices: boolean;
    hasGetUserMedia: boolean;
    isSecureContext: boolean;
    devices: string[];
  } | null>(null);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => {
    // Collect debug info on mount
    const collect = async () => {
      const hasMediaDevices = !!navigator.mediaDevices;
      const hasGetUserMedia = !!(
        navigator.mediaDevices?.getUserMedia
      );
      const isSecureContext = window.isSecureContext;
      let devices: string[] = [];
      try {
        const all = await navigator.mediaDevices.enumerateDevices();
        devices = all
          .filter((d) => d.kind === "videoinput")
          .map((d) => d.label || `Camera (${d.deviceId.slice(0, 8)})`);
      } catch {
        devices = ["(enumerate failed)"];
      }
      setDebugInfo({ hasMediaDevices, hasGetUserMedia, isSecureContext, devices });
    };
    collect();
    return () => stopStream();
  }, [stopStream]);

  const startCamera = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus("error");
      setErrorMsg(
        "This WebView does not support direct camera access.\nPlease use Unity native camera bridge."
      );
      return;
    }
    setStatus("requesting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setStatus("streaming");
    } catch (err: unknown) {
      setStatus("error");
      const name = (err as { name?: string }).name ?? "";
      if (name === "NotAllowedError" || name === "PermissionDeniedError") {
        setErrorMsg("카메라 접근 권한이 거부되었습니다.\nCamera access was denied.");
      } else if (name === "NotFoundError" || name === "DevicesNotFoundError") {
        setErrorMsg("카메라를 찾을 수 없습니다.\nNo camera device found.");
      } else if (name === "NotReadableError" || name === "TrackStartError") {
        setErrorMsg("카메라가 이미 사용 중입니다.\nCamera is already in use.");
      } else {
        setErrorMsg(`카메라 오류: ${name || String(err)}`);
      }
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    setCapturedDataUrl(dataUrl);
    stopStream();
    setStatus("captured");
  };

  const retake = async () => {
    setCapturedDataUrl(null);
    setResultImageUrl(null);
    await startCamera();
  };

  const uploadPhoto = async () => {
    if (!capturedDataUrl) return;
    setStatus("uploading");
    try {
      const res = await fetch(capturedDataUrl);
      const blob = await res.blob();
      const form = new FormData();
      form.append("image", blob, "capture.jpg");

      const response = await fetch(UPLOAD_ENDPOINT, {
        method: "POST",
        body: form,
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const json = await response.json();
      const url: string = json.imageUrl ?? capturedDataUrl;

      setResultImageUrl(url);
      setCapturedPhotoUrl(url);
      setStatus("done");
    } catch {
      // Fallback: use captured image directly without upload
      setCapturedPhotoUrl(capturedDataUrl);
      setResultImageUrl(capturedDataUrl);
      setStatus("done");
    }
  };

  const confirm = () => {
    navigate("/certificate");
  };

  const statusLabel: Record<CameraStatus, string> = {
    idle: "",
    requesting: "카메라 시작 중...",
    streaming: "촬영 준비 완료",
    captured: "사진 촬영됨",
    uploading: "AI 이미지 생성 중...",
    done: "완료",
    error: "카메라 오류",
  };

  return (
    <PageBody className="camera-page" scroll={false}>
      {/* ── Header ── */}
      <div className="camera-page__header">
        <span className="camera-page__step-badge">📷</span>
        <div>
          <h2 className="camera-page__title">사진 촬영</h2>
          {status !== "idle" && status !== "error" && (
            <p className="camera-page__status-label">{statusLabel[status]}</p>
          )}
        </div>
      </div>

      {/* ── Main area ── */}
      <div className="camera-page__main">
        {/* Video preview */}
        <video
          ref={videoRef}
          className={`camera-page__video${status === "streaming" ? " camera-page__video--active" : ""}`}
          playsInline
          muted
          aria-label="Camera preview"
        />

        {/* Hidden canvas for capture */}
        <canvas ref={canvasRef} className="camera-page__canvas" />

        {/* Captured / result image */}
        {(status === "captured" || status === "uploading" || status === "done") &&
          (resultImageUrl ?? capturedDataUrl) && (
            <img
              className="camera-page__preview"
              src={resultImageUrl ?? capturedDataUrl ?? ""}
              alt="Captured"
            />
          )}

        {/* Idle — nothing streaming yet */}
        {status === "idle" && (
          <div className="camera-page__placeholder">
            <span className="camera-page__placeholder-icon">📷</span>
            <p className="camera-page__placeholder-text">카메라가 꺼져 있습니다</p>
          </div>
        )}

        {/* Error state */}
        {status === "error" && (
          <div className="camera-page__error-box">
            <p className="camera-page__error-text">{errorMsg}</p>
          </div>
        )}

        {/* Upload spinner overlay */}
        {status === "uploading" && (
          <div className="camera-page__spinner-overlay">
            <div className="camera-page__spinner" />
            <p className="camera-page__uploading-text">AI 이미지 생성 중...</p>
          </div>
        )}
      </div>

      {/* ── Action buttons ── */}
      <div className="camera-page__actions">
        {(status === "idle" || status === "error") && (
          <button
            type="button"
            className="camera-page__btn camera-page__btn--primary"
            onClick={startCamera}
          >
            카메라 시작
          </button>
        )}

        {status === "streaming" && (
          <button
            type="button"
            className="camera-page__btn camera-page__btn--capture"
            onClick={capturePhoto}
          >
            촬영하기
          </button>
        )}

        {status === "captured" && (
          <>
            <button
              type="button"
              className="camera-page__btn camera-page__btn--outline"
              onClick={retake}
            >
              다시 찍기
            </button>
            <button
              type="button"
              className="camera-page__btn camera-page__btn--primary"
              onClick={uploadPhoto}
            >
              이 사진 사용
            </button>
          </>
        )}

        {status === "done" && (
          <>
            <button
              type="button"
              className="camera-page__btn camera-page__btn--outline"
              onClick={retake}
            >
              다시 찍기
            </button>
            <button
              type="button"
              className="camera-page__btn camera-page__btn--primary"
              onClick={confirm}
            >
              계속
            </button>
          </>
        )}

        {/* Back / skip */}
        {(status === "idle" || status === "error" || status === "streaming") && (
          <button
            type="button"
            className="camera-page__btn camera-page__btn--skip"
            onClick={() => { stopStream(); navigate("/certificate"); }}
          >
            건너뛰기
          </button>
        )}
      </div>

      {/* ── Debug panel ── */}
      {debugInfo && (
        <details className="camera-page__debug">
          <summary className="camera-page__debug-summary">Debug Info</summary>
          <ul className="camera-page__debug-list">
            <li>mediaDevices: {debugInfo.hasMediaDevices ? "✅" : "❌"}</li>
            <li>getUserMedia: {debugInfo.hasGetUserMedia ? "✅" : "❌"}</li>
            <li>secureContext: {debugInfo.isSecureContext ? "✅" : "❌"}</li>
            <li>
              cameras:
              {debugInfo.devices.length === 0
                ? " (none found)"
                : debugInfo.devices.map((d, i) => (
                    <span key={i} className="camera-page__debug-device">{d}</span>
                  ))}
            </li>
          </ul>
        </details>
      )}
    </PageBody>
  );
}
