import { useEffect, useRef, useState } from "react";
import { IconCheck } from "./Icon";
import { formatWon } from "../utils/format";
import "./EasyPayOverlay.css";

type Step = "processing" | "success";

interface EasyPayOverlayProps {
  amount: number;
  provider: "kakao" | "naver";
  onProcessPayment: () => Promise<void>;
  onComplete: () => void;
  onCancel: () => void | Promise<void>;
  onPaymentFailed: (error: unknown) => void;
}

export function EasyPayOverlay({
  amount,
  provider,
  onProcessPayment,
  onComplete,
  onCancel,
  onPaymentFailed,
}: EasyPayOverlayProps) {
  const [step, setStep] = useState<Step>("processing");
  const onCompleteRef = useRef(onComplete);
  const onCancelRef = useRef(onCancel);
  const onProcessPaymentRef = useRef(onProcessPayment);
  const onPaymentFailedRef = useRef(onPaymentFailed);
  onCompleteRef.current = onComplete;
  onCancelRef.current = onCancel;
  onProcessPaymentRef.current = onProcessPayment;
  onPaymentFailedRef.current = onPaymentFailed;

  const label = provider === "kakao" ? "카카오 페이" : "네이버 페이";

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setStep("processing");
      try {
        await onProcessPaymentRef.current();
      } catch (err) {
        if (!cancelled) onPaymentFailedRef.current(err);
        return;
      }
      if (cancelled) return;
      setStep("success");
      onCompleteRef.current();
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [amount]);

  return (
    <div className="easy-pay-overlay" role="dialog" aria-modal>
      {step === "processing" ? (
        <>
          <div className="easy-pay-overlay__spinner" />
          <h2 className="easy-pay-overlay__title">결제 승인 확인 중...</h2>
          <p className="easy-pay-overlay__subtitle">
            {label} QR 스캔 후 완료될 때까지 화면을 유지해 주세요
          </p>
        </>
      ) : (
        <>
          <div className="easy-pay-overlay__check">
            <IconCheck size={56} strokeWidth={2.5} />
          </div>
          <h2 className="easy-pay-overlay__title">결제가 완료되었습니다</h2>
          <p className="easy-pay-overlay__amount">{formatWon(amount)}</p>
        </>
      )}
    </div>
  );
}
