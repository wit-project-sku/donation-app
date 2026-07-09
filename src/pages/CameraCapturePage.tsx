import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAppNavigate } from "../hooks/useAppNavigate";
import { useQueryClient } from "@tanstack/react-query";
import { processArPhoto } from "../api/arPhoto";
import { IconCamera, IconCheck, IconReset } from "../components/Icon";
import { AppHeader } from "../components/AppHeader";
import { AppFooter } from "../components/AppFooter";
import { PageBody } from "../components/layout/PageBody";
import photoGuide from "../assets/photo-guide.png";
import { useDonationStore } from "../store/donationStore";
import { useTheme } from "../theme/ThemeContext";
import { submitCurrentDonation } from "../utils/buildSubmitPayload";
import { getKioskBridge } from "../utils/kioskBridge";
import "./CameraCapturePage.css";

const DEFAULT_BORDER = "#D0D0D0";

type CameraStatus =
  | "idle"
  | "requesting"
  | "streaming"
  | "captured"
  | "uploading"
  | "done"
  | "error";

const PHYSICAL_FACECAM_LABELS = ["facecam", "elgato facecam", "facecam pro"];
const VIRTUAL_CAMERA_LABELS = ["virtual", "obs", "elgato virtual camera"];

function isVirtualCamera(device: MediaDeviceInfo) {
  const label = device.label.toLowerCase();
  return VIRTUAL_CAMERA_LABELS.some((token) => label.includes(token));
}

function isPhysicalFacecam(device: MediaDeviceInfo) {
  const label = device.label.toLowerCase();
  return (
    !isVirtualCamera(device) &&
    PHYSICAL_FACECAM_LABELS.some((token) => label.includes(token))
  );
}

function isLikelyLaptopCamera(device: MediaDeviceInfo) {
  const label = device.label.toLowerCase();
  return (
    label.includes("integrated") ||
    label.includes("built-in") ||
    label.includes("facetime") ||
    label.includes("laptop")
  );
}

function findPreferredCamera(devices: MediaDeviceInfo[]) {
  return (
    devices.find(isPhysicalFacecam) ??
    devices.find((device) => !isVirtualCamera(device) && !isLikelyLaptopCamera(device)) ??
    devices.find((device) => !isVirtualCamera(device))
  );
}

async function requestCameraStream(deviceId?: string) {
  return navigator.mediaDevices.getUserMedia({
    video: deviceId
      ? {
          deviceId: { exact: deviceId },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        }
      : true,
    audio: false,
  });
}

function getCameraErrorMessage(error: unknown): string {
  if (!(error instanceof DOMException)) {
    return "카메라 접근에 실패했습니다.";
  }

  if (error.name === "NotAllowedError" || error.name === "SecurityError") {
    return "카메라 권한을 허용해 주세요.";
  }

  if (error.name === "NotFoundError" || error.name === "OverconstrainedError") {
    return "USB 카메라 연결 상태를 확인해 주세요.";
  }

  if (error.name === "NotReadableError" || error.name === "AbortError") {
    return "카메라가 다른 프로그램에서 사용 중일 수 있습니다.";
  }

  return "WebView 또는 카메라 상태를 확인해 주세요.";
}

export function CameraCapturePage() {
  const navigate = useAppNavigate();
  const { theme, category } = useTheme();
  const isSchool = category === "school";
  const [searchParams] = useSearchParams();
  const { selectedOutfit, merchantUid, setCapturedPhotoUrl, setSubmittedRecordId } = useDonationStore();
  const isGreetingMode = searchParams.get("mode") === "greeting";
  const queryClient = useQueryClient();

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [status, setStatus] = useState<CameraStatus>("idle");
  const [capturedDataUrl, setCapturedDataUrl] = useState<string | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [resultImageUrl, setResultImageUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [, setCameraDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraDeviceId, setSelectedCameraDeviceId] = useState<string | null>(null);
  const [, setActiveCameraLabel] = useState("");

  // When embedded in the kiosk, the camera + AI run on the kiosk's Monitor 2 via
  // the bridge instead of the in-webview getUserMedia pipeline below.
  const kioskBridge = getKioskBridge();
  const isEmbedded = kioskBridge != null;
  const [countdown, setCountdown] = useState<number | null>(null);

  const support = useMemo(
    () => ({
      mediaDevices: Boolean(navigator.mediaDevices),
      getUserMedia: Boolean(navigator.mediaDevices?.getUserMedia),
      secureContext: window.isSecureContext,
    }),
    [],
  );

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setActiveCameraLabel("");
  }, []);

  const refreshDevices = useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) {
      setCameraDevices([]);
      return [] as MediaDeviceInfo[];
    }

    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter((device) => device.kind === "videoinput");
      console.info("[Camera] enumerateDevices", videoDevices.map((device) => ({
        label: device.label,
        deviceId: device.deviceId,
        groupId: device.groupId,
        virtual: isVirtualCamera(device),
        physicalFacecam: isPhysicalFacecam(device),
      })));
      setCameraDevices(videoDevices);
      return videoDevices;
    } catch {
      setCameraDevices([]);
      return [] as MediaDeviceInfo[];
    }
  }, []);

  useEffect(() => {
    if (isEmbedded) return;
    // Enumerate cameras on mount (external-system sync, not derived state).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refreshDevices();
    return () => stopStream();
  }, [refreshDevices, stopStream, isEmbedded]);

  // Kick off / retake a Monitor-2 capture on the kiosk.
  const startKioskCapture = useCallback(() => {
    if (!kioskBridge?.takePhoto) return;
    setStatus("requesting");
    setErrorMsg("");
    setResultImageUrl(null);
    setCountdown(null);
    kioskBridge.takePhoto({
      mode: isGreetingMode ? "together" : "solo",
      clothingKey: selectedOutfit?.outfitCode ?? "",
    });
  }, [kioskBridge, isGreetingMode, selectedOutfit]);

  // Bridge event subscription: kiosk countdown/generating progress + final result.
  useEffect(() => {
    if (!kioskBridge?.on) return;
    const offProgress = kioskBridge.on("photoProgress", (payload) => {
      const p = payload as { phase?: string; countdown?: number | null };
      if (p.phase === "generating") {
        setStatus("uploading");
        setCountdown(null);
        // School flow: don't wait for AI here — proceed to amount/payment while it
        // generates; the result lands at the certificate via the app-level bridge.
        if (isSchool) navigate("/school-amount");
      } else if (p.phase === "countdown") {
        setStatus("requesting");
        setCountdown(p.countdown ?? null);
      }
    });
    const offResult = kioskBridge.on("photoResult", (payload) => {
      const url = (payload as { url?: string }).url;
      if (!url) return;
      setResultImageUrl(url);
      setCapturedPhotoUrl(url);
      setStatus("done");
    });
    const offError = kioskBridge.on("photoError", (payload) => {
      const message = (payload as { message?: string }).message;
      setErrorMsg(message || "AI 이미지 생성에 실패했습니다. 다시 시도해 주세요.");
      setStatus("error");
    });
    return () => {
      offProgress();
      offResult();
      offError();
    };
  }, [kioskBridge, setCapturedPhotoUrl, isSchool, navigate]);

  const startCamera = useCallback(async () => {
    if (!support.mediaDevices || !support.getUserMedia) {
      setStatus("error");
      setErrorMsg("현재 WebView에서는 직접 카메라 접근을 지원하지 않습니다.");
      return;
    }

    if (!support.secureContext) {
      setStatus("error");
      setErrorMsg("카메라는 HTTPS 또는 localhost 환경에서만 사용할 수 있습니다.");
      return;
    }

    setStatus("requesting");
    setErrorMsg("");
    setCapturedDataUrl(null);
    setCapturedBlob(null);
    setResultImageUrl(null);

    try {
      stopStream();

      const devicesBeforePermission = await refreshDevices();
      const selectedDevice = selectedCameraDeviceId
        ? devicesBeforePermission.find((device) => device.deviceId === selectedCameraDeviceId)
        : null;
      const preferredDevice = selectedDevice ?? findPreferredCamera(devicesBeforePermission);

      console.info("[Camera] selected before permission", {
        selectedDevice: selectedDevice?.label,
        preferredDevice: preferredDevice?.label,
        preferredDeviceId: preferredDevice?.deviceId,
      });

      let stream = await requestCameraStream(preferredDevice?.deviceId);
      let devicesAfterPermission = await refreshDevices();
      let activeDeviceId = stream.getVideoTracks()[0]?.getSettings().deviceId;

      const selectedAfterPermission = selectedCameraDeviceId
        ? devicesAfterPermission.find((device) => device.deviceId === selectedCameraDeviceId)
        : null;
      const physicalFacecam = devicesAfterPermission.find(isPhysicalFacecam);
      const bestDevice =
        selectedAfterPermission ?? physicalFacecam ?? findPreferredCamera(devicesAfterPermission);

      const onlyVirtualDetected =
        devicesAfterPermission.length > 0 &&
        devicesAfterPermission.every(isVirtualCamera);

      if (onlyVirtualDetected) {
        console.warn(
          "[Camera] Physical Facecam device not detected. Please open Elgato Camera Hub or reconnect the USB camera.",
        );
      }

      if (bestDevice?.deviceId && bestDevice.deviceId !== activeDeviceId) {
        stream.getTracks().forEach((track) => track.stop());
        console.info("[Camera] switching device", {
          from: activeDeviceId,
          to: bestDevice.label,
          deviceId: bestDevice.deviceId,
        });
        stream = await requestCameraStream(bestDevice.deviceId);
        activeDeviceId = stream.getVideoTracks()[0]?.getSettings().deviceId;
        devicesAfterPermission = await refreshDevices();
      }

      streamRef.current = stream;

      const activeDevice = devicesAfterPermission.find(
        (device) => device.deviceId === activeDeviceId,
      );
      if (activeDevice) {
        setActiveCameraLabel(activeDevice.label);
        setSelectedCameraDeviceId(activeDevice.deviceId);
      } else if (bestDevice) {
        setSelectedCameraDeviceId(bestDevice.deviceId);
      }

      console.info("[Camera] active device", {
        label: activeDevice?.label,
        deviceId: activeDeviceId,
        physicalFacecam: activeDevice ? isPhysicalFacecam(activeDevice) : false,
        virtual: activeDevice ? isVirtualCamera(activeDevice) : false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setStatus("streaming");
    } catch (error) {
      console.error("[Camera] getUserMedia error", error);
      setStatus("error");
      setErrorMsg(`${getCameraErrorMessage(error)} USB 카메라 접근 환경을 확인해 주세요.`);
      await refreshDevices();
    }
  }, [
    refreshDevices,
    selectedCameraDeviceId,
    stopStream,
    support.getUserMedia,
    support.mediaDevices,
    support.secureContext,
  ]);

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const width = video.videoWidth || 1920;
    const height = video.videoHeight || 1080;
    canvas.width = width;
    canvas.height = height;
    canvas.getContext("2d")?.drawImage(video, 0, 0, width, height);

    setCapturedDataUrl(canvas.toDataURL("image/jpeg", 0.96));
    canvas.toBlob(
      (blob) => {
        setCapturedBlob(blob);
        setStatus("captured");
        stopStream();
      },
      "image/jpeg",
      0.96,
    );
  };

  const retake = async () => {
    setCapturedDataUrl(null);
    setCapturedBlob(null);
    setResultImageUrl(null);
    await startCamera();
  };

  const usePhoto = async () => {
    if (!capturedBlob || !capturedDataUrl) return;

    setStatus("uploading");
    setErrorMsg("");

    try {
      if (selectedOutfit) {
        const isTogether = searchParams.get("mode") === "greeting";
        const processedUrl = await processArPhoto({
          image: capturedBlob,
          outfit: selectedOutfit,
          mode: isTogether ? "together" : "solo",
          togetherWith: isTogether ? "2" : null,
          requestId: merchantUid,
        });
        setResultImageUrl(processedUrl);
        setCapturedPhotoUrl(processedUrl);
      } else {
        setResultImageUrl(capturedDataUrl);
        setCapturedPhotoUrl(capturedDataUrl);
      }
      stopStream();
      setStatus("done");
    } catch (error) {
      setErrorMsg(
        error instanceof Error
          ? error.message
          : "업로드 또는 AI 이미지 생성에 실패했습니다.",
      );
      setStatus("captured");
    }
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const confirm = async () => {
    stopStream();
    // 학교 흐름: 촬영 후 기부금 선택 → 결제 순서. 여기선 아직 제출하지 않는다.
    if (isSchool) {
      navigate("/school-amount");
      return;
    }
    setIsSubmitting(true);
    try {
      const state = useDonationStore.getState();
      const record = await submitCurrentDonation(state);
      setSubmittedRecordId(-1);
      // Replace blob: URL with the permanent S3 URL so the certificate QR is correct
      if (record.imageUrl) {
        setCapturedPhotoUrl(record.imageUrl);
      }
      queryClient.invalidateQueries({ queryKey: ["wallEntries"] });
    } catch {
      // Submission failed — certificate page will retry when user taps "다음"
    }
    navigate("/certificate");
  };

  const cameraPageStyle = {
    backgroundColor: theme.background,
    ["--camera-primary" as string]: theme.primary,
    ["--camera-on-primary" as string]: theme.text.onPrimary,
    ["--camera-text-primary" as string]: theme.text.primary,
    ["--camera-text-secondary" as string]: theme.text.secondary,
    ["--camera-card-bg" as string]: theme.card.background,
    ["--camera-page-bg" as string]: theme.background,
  };

  // Embedded (kiosk) flow: camera + AI run on Monitor 2; this screen only guides
  // the user, shows generation progress, then the returned AI result.
  if (isEmbedded) {
    const primaryStyle = {
      backgroundColor: theme.primary,
      borderColor: theme.primary,
      color: theme.text.onPrimary,
    };
    return (
      <PageBody className="camera-page" scroll={false} style={cameraPageStyle}>
        <AppHeader
          onBack={() => {
            kioskBridge?.cancelPhoto?.();
            navigate("/outfit");
          }}
        />
        <div className="camera-page__surface">
          {status === "done" && resultImageUrl && (
            <img className="camera-page__preview" src={resultImageUrl} alt="촬영 결과" />
          )}

          {(status === "idle" || status === "requesting") && (
            <div
              className="camera-page__center-state"
              style={{ backgroundColor: theme.background, color: theme.text.primary }}
            >
              <img className="camera-page__guide-img" src={photoGuide} alt="" />
              <h1
                className="camera-page__center-title"
                style={{ color: theme.primary }}
              >
                {status === "requesting"
                  ? countdown != null
                    ? `${countdown}`
                    : "곧 촬영이 시작됩니다"
                  : "촬영을 시작해 주세요"}
              </h1>
              <p className="camera-page__center-desc">
                <span className="camera-page__center-star" aria-hidden>
                  ★
                </span>
                <span>
                  옆 화면의 카메라를 바라봐 주세요. 준비되면 아래 버튼을 눌러주세요.
                </span>
              </p>
            </div>
          )}

          {status === "uploading" && (
            <div className="camera-page__processing">
              <div className="camera-page__spinner" aria-hidden />
              <h1>AI 이미지 생성 중입니다</h1>
            </div>
          )}

          {status === "error" && (
            <div
              className="camera-page__center-state camera-page__center-state--error"
              style={{ backgroundColor: theme.background, color: theme.text.primary }}
            >
              <div className="camera-page__center-icon" aria-hidden>
                <IconCamera size={96} strokeWidth={2} />
              </div>
              <h1 style={{ color: theme.text.primary }}>촬영에 실패했습니다</h1>
              <p>{errorMsg}</p>
            </div>
          )}

          {status === "done" && (
            <div
              className="camera-page__result-badge"
              style={{
                backgroundColor: theme.primary,
                borderColor: theme.primary,
                color: theme.text.onPrimary,
              }}
            >
              <IconCheck size={40} strokeWidth={2.5} aria-hidden />
              <span>완료되었습니다</span>
            </div>
          )}

          <div className="camera-page__controls">
            {(status === "idle" || status === "error") && (
              <button
                type="button"
                className="camera-page__control camera-page__control--primary"
                onClick={startKioskCapture}
                style={primaryStyle}
              >
                <IconCamera size={72} strokeWidth={2.2} aria-hidden />
                촬영 시작
              </button>
            )}

            {status === "done" && (
              <>
                <button
                  type="button"
                  className="camera-page__control camera-page__control--secondary"
                  onClick={startKioskCapture}
                  disabled={isSubmitting}
                  style={{
                    backgroundColor: theme.card.background,
                    borderColor: DEFAULT_BORDER,
                    color: theme.text.primary,
                  }}
                >
                  <IconReset size={64} strokeWidth={2.2} aria-hidden />
                  다시 촬영
                </button>
                <button
                  type="button"
                  className="camera-page__control camera-page__control--primary"
                  onClick={confirm}
                  disabled={isSubmitting}
                  style={primaryStyle}
                >
                  <IconCheck size={64} strokeWidth={2.5} aria-hidden />
                  {isSubmitting ? "저장 중..." : "다음으로"}
                </button>
              </>
            )}
          </div>
        </div>
        <AppFooter />
      </PageBody>
    );
  }

  const previewSrc = resultImageUrl ?? capturedDataUrl;
  const isLive = status === "streaming" || status === "requesting";

  return (
    <PageBody
      className="camera-page"
      scroll={false}
      style={{
        backgroundColor: theme.background,
        ["--camera-primary" as string]: theme.primary,
        ["--camera-on-primary" as string]: theme.text.onPrimary,
        ["--camera-text-primary" as string]: theme.text.primary,
        ["--camera-text-secondary" as string]: theme.text.secondary,
        ["--camera-card-bg" as string]: theme.card.background,
        ["--camera-page-bg" as string]: theme.background,
      }}
    >
      <AppHeader
        onBack={() => {
          stopStream();
          navigate("/outfit");
        }}
      />
      <div className="camera-page__surface">
        <video
          ref={videoRef}
          className={`camera-page__video${isLive ? " camera-page__video--active" : ""}`}
          playsInline
          muted
          aria-label="카메라 미리보기"
        />

        <canvas ref={canvasRef} className="camera-page__canvas" />

        {(status === "captured" || status === "uploading" || status === "done") && previewSrc && (
          <img className="camera-page__preview" src={previewSrc} alt="촬영 결과" />
        )}

        {status === "streaming" && (
          <div className="camera-page__guide-bubble" role="status">
            <span className="camera-page__guide-arrow" aria-hidden>
              <svg viewBox="0 0 100 100" width="158" height="176">
                <path
                  d="M2 50 L46 14 L46 36 L98 36 L98 64 L46 64 L46 86 Z"
                  fill="#FFD400"
                />
              </svg>
            </span>
            <p className="camera-page__guide-bubble-text">
              “왼쪽 화면을 먼저보시고
              <br />
              화면사이 카메라를 봐주세요.”
            </p>
          </div>
        )}

        {(status === "idle" || status === "requesting") && (
          <div
            className="camera-page__center-state"
            style={{ backgroundColor: theme.background, color: theme.text.primary }}
          >
            <img className="camera-page__guide-img" src={photoGuide} alt="" />
            <h1
              className="camera-page__center-title"
              style={{ color: theme.primary }}
            >
              {status === "requesting"
                ? "카메라를 연결하는 중입니다"
                : "카메라를 시작해 주세요"}
            </h1>
            <p className="camera-page__center-desc">
              <span className="camera-page__center-star" aria-hidden>
                ★
              </span>
              <span>
                {isGreetingMode
                  ? "인사 모드로 촬영합니다. 준비되면 아래 버튼을 눌러주세요."
                  : "준비되면 아래 버튼을 눌러 촬영을 시작해주세요."}
              </span>
            </p>
          </div>
        )}

        {status === "error" && (
          <div
            className="camera-page__center-state camera-page__center-state--error"
            style={{ backgroundColor: theme.background, color: theme.text.primary }}
          >
            <div className="camera-page__center-icon" aria-hidden>
              <IconCamera size={96} strokeWidth={2} />
            </div>
            <h1 style={{ color: theme.text.primary }}>카메라 연결 실패</h1>
            <p>{errorMsg}</p>
          </div>
        )}

        {status === "uploading" && (
          <div className="camera-page__processing">
            <div className="camera-page__spinner" aria-hidden />
            <h1>AI 이미지 생성 중입니다</h1>
          </div>
        )}

        {status === "done" && (
          <div
            className="camera-page__result-badge"
            style={{
              backgroundColor: theme.primary,
              borderColor: theme.primary,
              color: theme.text.onPrimary,
            }}
          >
            <IconCheck size={40} strokeWidth={2.5} aria-hidden />
            <span>완료되었습니다</span>
          </div>
        )}

        {status === "captured" && errorMsg && (
          <p className="camera-page__inline-error">{errorMsg}</p>
        )}

        <div className="camera-page__controls">
          {(status === "idle" || status === "error") && (
            <>
              <button
                type="button"
                className="camera-page__control camera-page__control--secondary"
                onClick={refreshDevices}
                style={{
                  backgroundColor: theme.card.background,
                  borderColor: DEFAULT_BORDER,
                  color: theme.text.primary,
                }}
              >
                카메라 다시 찾기
              </button>
              <button
                type="button"
                className="camera-page__control camera-page__control--primary"
                onClick={startCamera}
                style={{
                  backgroundColor: theme.primary,
                  borderColor: theme.primary,
                  color: theme.text.onPrimary,
                }}
              >
                <IconCamera size={72} strokeWidth={2.2} aria-hidden />
                카메라 시작
              </button>
            </>
          )}

          {status === "streaming" && (
            <>
              <button
                type="button"
                className="camera-page__control camera-page__control--secondary"
                onClick={startCamera}
                style={{
                  backgroundColor: theme.card.background,
                  borderColor: DEFAULT_BORDER,
                  color: theme.text.primary,
                }}
              >
                카메라 새로고침
              </button>
              <button
                type="button"
                className="camera-page__control camera-page__control--primary"
                onClick={capturePhoto}
                style={{
                  backgroundColor: theme.primary,
                  borderColor: theme.primary,
                  color: theme.text.onPrimary,
                }}
              >
                <IconCamera size={72} strokeWidth={2.2} aria-hidden />
                사진 촬영
              </button>
            </>
          )}

          {status === "captured" && (
            <>
              <button
                type="button"
                className="camera-page__control camera-page__control--secondary"
                onClick={retake}
                style={{
                  backgroundColor: theme.card.background,
                  borderColor: DEFAULT_BORDER,
                  color: theme.text.primary,
                }}
              >
                <IconReset size={64} strokeWidth={2.2} aria-hidden />
                다시 촬영
              </button>
              <button
                type="button"
                className="camera-page__control camera-page__control--primary"
                onClick={usePhoto}
                disabled={!capturedBlob}
                style={{
                  backgroundColor: theme.primary,
                  borderColor: theme.primary,
                  color: theme.text.onPrimary,
                }}
              >
                <IconCheck size={64} strokeWidth={2.5} aria-hidden />
                이 사진 사용
              </button>
            </>
          )}

          {status === "done" && (
            <>
              <button
                type="button"
                className="camera-page__control camera-page__control--secondary"
                onClick={retake}
                disabled={isSubmitting}
                style={{
                  backgroundColor: theme.card.background,
                  borderColor: DEFAULT_BORDER,
                  color: theme.text.primary,
                }}
              >
                <IconReset size={64} strokeWidth={2.2} aria-hidden />
                다시 촬영
              </button>
              <button
                type="button"
                className="camera-page__control camera-page__control--primary"
                onClick={confirm}
                disabled={isSubmitting}
                style={{
                  backgroundColor: theme.primary,
                  borderColor: theme.primary,
                  color: theme.text.onPrimary,
                }}
              >
                <IconCheck size={64} strokeWidth={2.5} aria-hidden />
                {isSubmitting ? "저장 중..." : "다음으로"}
              </button>
            </>
          )}
        </div>
      </div>

      <AppFooter />
    </PageBody>
  );
}
