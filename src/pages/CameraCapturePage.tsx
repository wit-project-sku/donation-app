import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { processArPhoto } from "../api/arPhoto";
import { IconCamera, IconCheck, IconReset } from "../components/Icon";
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

function cameraLabel(device: MediaDeviceInfo, index: number) {
  return device.label || `Camera ${index + 1}`;
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
    return "Camera access failed. 카메라 접근에 실패했습니다.";
  }

  if (error.name === "NotAllowedError" || error.name === "SecurityError") {
    return "Permission denied. 카메라 권한을 허용해 주세요.";
  }

  if (error.name === "NotFoundError" || error.name === "OverconstrainedError") {
    return "No camera found. USB 카메라 연결 상태를 확인해 주세요.";
  }

  if (error.name === "NotReadableError" || error.name === "AbortError") {
    return "Camera may already be in use. Elgato Camera Hub 또는 다른 프로그램의 카메라 사용을 확인해 주세요.";
  }

  return "Camera access failed. WebView 또는 카메라 상태를 확인해 주세요.";
}

export function CameraCapturePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { selectedOutfit, merchantUid, setCapturedPhotoUrl } = useDonationStore();

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [status, setStatus] = useState<CameraStatus>("idle");
  const [capturedDataUrl, setCapturedDataUrl] = useState<string | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [resultImageUrl, setResultImageUrl] = useState<string | null>(null);
  const [resultToken, setResultToken] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [cameraDevices, setCameraDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraDeviceId, setSelectedCameraDeviceId] = useState<string | null>(null);
  const [activeCameraLabel, setActiveCameraLabel] = useState("");
  const [cameraWarning, setCameraWarning] = useState("");

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
    refreshDevices();
    return () => stopStream();
  }, [refreshDevices, stopStream]);

  const startCamera = useCallback(async () => {
    if (!support.mediaDevices || !support.getUserMedia) {
      setStatus("error");
      setErrorMsg(
        "This WebView does not support direct camera access. Please use Unity native camera bridge.",
      );
      return;
    }

    if (!support.secureContext) {
      setStatus("error");
      setErrorMsg("Camera requires HTTPS or localhost. 보안 연결에서 다시 실행해 주세요.");
      return;
    }

    setStatus("requesting");
    setErrorMsg("");
    setCapturedDataUrl(null);
    setCapturedBlob(null);
    setResultImageUrl(null);
    setResultToken(null);
    setCameraWarning("");

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
        setCameraWarning(
          "Physical Facecam device not detected. Please open Elgato Camera Hub or reconnect the USB camera.",
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
      setErrorMsg(
        `${getCameraErrorMessage(error)} This WebView environment may not fully support direct USB camera access.`,
      );
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
    setResultToken(null);
    await startCamera();
  };

  const usePhoto = async () => {
    if (!capturedBlob || !capturedDataUrl) return;

    setStatus("uploading");
    setErrorMsg("");
    setResultToken(null);

    try {
      const shouldUseAi =
        searchParams.get("ai") === "true" ||
        searchParams.get("mode") === "greeting";

      if (shouldUseAi && selectedOutfit) {
        const processedUrl = await processArPhoto({
          image: capturedBlob,
          outfit: selectedOutfit,
          togetherWith: searchParams.get("mode") === "greeting" ? "2" : null,
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
          : "Upload failed. 업로드 또는 AI 이미지 생성에 실패했습니다.",
      );
      setStatus("captured");
    }
  };

  const confirm = () => {
    stopStream();
    navigate("/certificate");
  };

  const previewSrc = resultImageUrl ?? capturedDataUrl;
  const isLive = status === "streaming" || status === "requesting";
  const isUsingVirtualCamera = activeCameraLabel.toLowerCase().includes("virtual camera");
  const selectedDevice = cameraDevices.find(
    (device) => device.deviceId === selectedCameraDeviceId,
  );

  return (
    <PageBody className="camera-page" scroll={false}>
      <div className="camera-page__surface">
        <video
          ref={videoRef}
          className={`camera-page__video${isLive ? " camera-page__video--active" : ""}`}
          playsInline
          muted
          aria-label="Camera preview"
        />

        <canvas ref={canvasRef} className="camera-page__canvas" />

        {(status === "captured" || status === "uploading" || status === "done") && previewSrc && (
          <img className="camera-page__preview" src={previewSrc} alt="Captured result" />
        )}

        {(status === "idle" || status === "requesting") && (
          <div className="camera-page__center-state">
            <IconCamera size={136} strokeWidth={1.8} aria-hidden />
            <h1>
              {status === "requesting"
                ? "Camera is starting..."
                : "카메라를 시작해 주세요"}
            </h1>
            <p>
              {status === "requesting"
                ? "Elgato USB camera is being selected."
                : "Start Camera 버튼을 눌러 Elgato / USB 카메라를 연결합니다."}
            </p>
          </div>
        )}

        {status === "error" && (
          <div className="camera-page__center-state camera-page__center-state--error">
            <IconCamera size={126} strokeWidth={1.8} aria-hidden />
            <h1>Camera access failed</h1>
            <p>{errorMsg}</p>
          </div>
        )}

        {status === "uploading" && (
          <div className="camera-page__processing">
            <div className="camera-page__spinner" aria-hidden />
            <h1>Generating AI image...</h1>
            <p>업로드 및 이미지 생성 중입니다.</p>
          </div>
        )}

        {status === "done" && (
          <div className="camera-page__result-badge">
            <IconCheck size={38} aria-hidden />
            <span>Completed</span>
            {resultToken && <small>Token: {resultToken}</small>}
          </div>
        )}

        {isUsingVirtualCamera && status === "streaming" && (
          <div className="camera-page__camera-warning">
            Elgato Virtual Camera is active. Run Elgato Camera Hub, or select the physical Facecam device below.
          </div>
        )}

        {cameraWarning && (
          <div className="camera-page__camera-warning">
            {cameraWarning}
          </div>
        )}

        <div className="camera-page__topbar">
          <span className="camera-page__pill">
            <IconCamera size={34} aria-hidden />
            Camera Capture
          </span>
        </div>

        <div className="camera-page__debug">
          <strong>Debug</strong>
          <span>mediaDevices: {support.mediaDevices ? "yes" : "no"}</span>
          <span>getUserMedia: {support.getUserMedia ? "yes" : "no"}</span>
          <span>secureContext: {support.secureContext ? "yes" : "no"}</span>
          <span>selected: {selectedDevice ? cameraLabel(selectedDevice, 0) : "auto"}</span>
          <span>active: {activeCameraLabel || "none"}</span>
          <div className="camera-page__device-list">
            {cameraDevices.length ? (
              cameraDevices.map((device, index) => (
                <div
                  key={device.deviceId || index}
                  className={`camera-page__device${
                    device.deviceId === selectedCameraDeviceId ||
                    device.label === activeCameraLabel
                      ? " camera-page__device--active"
                      : ""
                  }`}
                >
                  <strong>{cameraLabel(device, index)}</strong>
                  <small>{isVirtualCamera(device) ? "virtual" : "physical"}</small>
                  <small>{device.deviceId}</small>
                  {(device.deviceId === selectedCameraDeviceId ||
                    device.label === activeCameraLabel) && <em>selected</em>}
                </div>
              ))
            ) : (
              <span>cameras: none / labels hidden</span>
            )}
          </div>
        </div>

        <div className="camera-page__controls">
          {(status === "idle" || status === "error") && (
            <>
              <button
                type="button"
                className="camera-page__control camera-page__control--secondary"
                onClick={refreshDevices}
              >
                Retry Devices
              </button>
              <button
                type="button"
                className="camera-page__control camera-page__control--primary"
                onClick={startCamera}
              >
                <IconCamera size={44} aria-hidden />
                Start Camera
              </button>
            </>
          )}

          {status === "streaming" && (
            <>
              <button
                type="button"
                className="camera-page__control camera-page__control--secondary"
                onClick={startCamera}
              >
                Reload Camera
              </button>
              <button
                type="button"
                className="camera-page__control camera-page__control--primary"
                onClick={capturePhoto}
              >
                <IconCamera size={44} aria-hidden />
                Capture Photo
              </button>
            </>
          )}

          {status === "captured" && (
            <>
              {errorMsg && <p className="camera-page__inline-error">{errorMsg}</p>}
              <button
                type="button"
                className="camera-page__control camera-page__control--secondary"
                onClick={retake}
              >
                <IconReset size={42} aria-hidden />
                Retake
              </button>
              <button
                type="button"
                className="camera-page__control camera-page__control--primary"
                onClick={usePhoto}
                disabled={!capturedBlob}
              >
                <IconCheck size={42} aria-hidden />
                Use This Photo
              </button>
            </>
          )}

          {status === "done" && (
            <>
              <button
                type="button"
                className="camera-page__control camera-page__control--secondary"
                onClick={retake}
              >
                <IconReset size={42} aria-hidden />
                Retake
              </button>
              <button
                type="button"
                className="camera-page__control camera-page__control--primary"
                onClick={confirm}
              >
                <IconCheck size={42} aria-hidden />
                Continue
              </button>
            </>
          )}
        </div>
      </div>
    </PageBody>
  );
}
