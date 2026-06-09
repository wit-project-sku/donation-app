import { useEffect, useRef, useState } from "react";
import { useTheme } from "../theme/ThemeContext";
import { IconCheck } from "./Icon";
import "./CardPaymentOverlay.css";

type PaymentStep = "processing" | "success";

interface CardPaymentOverlayProps {
  amount: number;
  inline?: boolean;
  onProcessPayment: () => Promise<void>;
  onComplete: () => void;
  onCancel: () => void | Promise<void>;
  onPaymentFailed: (error: unknown) => void;
}

export function CardPaymentOverlay({
  amount,
  inline = false,
  onProcessPayment,
  onComplete,
  onCancel,
  onPaymentFailed,
}: CardPaymentOverlayProps) {
  const { theme } = useTheme();
  const [step, setStep] = useState<PaymentStep>("processing");
  const [countdown, setCountdown] = useState(3);
  const cancelledRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  const onCancelRef = useRef(onCancel);
  const onProcessPaymentRef = useRef(onProcessPayment);
  const onPaymentFailedRef = useRef(onPaymentFailed);

  onCompleteRef.current = onComplete;
  onCancelRef.current = onCancel;
  onProcessPaymentRef.current = onProcessPayment;
  onPaymentFailedRef.current = onPaymentFailed;

  useEffect(() => {
    cancelledRef.current = false;
    setStep("processing");
    setCountdown(3);

    const run = async () => {
      try {
        await onProcessPaymentRef.current();
      } catch (err) {
        if (!cancelledRef.current) onPaymentFailedRef.current(err);
        return;
      }
      if (cancelledRef.current) return;
      setStep("success");
    };

    run();

    return () => {
      cancelledRef.current = true;
    };
  }, [amount]);

  useEffect(() => {
    if (step !== "success") return;

    const timer = window.setInterval(() => {
      setCountdown((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          onCompleteRef.current();
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [step]);

  const isLoading = step === "processing";

  return (
    <div
      className={`card-overlay${inline ? " card-overlay--inline" : ""}`}
      role="dialog"
      aria-modal={!inline}
    >
      <div
        className="card-overlay__dialog"
        style={{ borderColor: theme.primary }}
      >
        {isLoading ? (
          <>
            <div className="card-overlay__spinner" aria-hidden />
            <p className="card-overlay__status">결제 승인 확인 중..</p>
            <p className="card-overlay__desc">
              카드를 투입구 끝까지 넣어주시고 결제 완료 후 카드를 빼주세요.
            </p>
            <button
              type="button"
              className="card-overlay__cancel"
              onClick={onCancelRef.current}
            >
              결제 취소
            </button>
          </>
        ) : (
          <>
            <div
              className="card-overlay__check"
              aria-hidden
              style={{ backgroundColor: theme.primary }}
            >
              <IconCheck size={72} strokeWidth={3.2} color="#fff" />
            </div>
            <p className="card-overlay__success-copy">
              감사합니다
              <br />
              당신의 마음이 필요한 곳에 전해집니다
            </p>
            <div
              className="card-overlay__countdown"
              style={{ backgroundColor: theme.primary }}
            >
              {countdown}초 후 다음 단계로 자동 전환됩니다
            </div>
          </>
        )}
      </div>
    </div>
  );
}
