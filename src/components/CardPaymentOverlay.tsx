import { useEffect, useRef, useState } from "react";
import { IconCheck } from "./Icon";
import "./CardPaymentOverlay.css";

type PaymentStep = "insert" | "processing" | "success";

interface CardPaymentOverlayProps {
  amount: number;
  onProcessPayment: () => Promise<void>;
  onComplete: () => void;
  onCancel: () => void | Promise<void>;
  onPaymentFailed: (error: unknown) => void;
}

export function CardPaymentOverlay({
  amount,
  onProcessPayment,
  onComplete,
  onCancel,
  onPaymentFailed,
}: CardPaymentOverlayProps) {
  const [step, setStep] = useState<PaymentStep>("insert");
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

    const run = async () => {
      setStep("insert");
      await delay(1800);
      if (cancelledRef.current) return;

      setStep("processing");
      try {
        await onProcessPaymentRef.current();
      } catch (err) {
        if (!cancelledRef.current) onPaymentFailedRef.current(err);
        return;
      }
      if (cancelledRef.current) return;

      setStep("success");
      await delay(2800);
      if (cancelledRef.current) return;

      onCompleteRef.current();
    };

    run();

    return () => {
      cancelledRef.current = true;
    };
  }, [amount]);

  const isLoading = step === "insert" || step === "processing";

  return (
    <div className="card-overlay" role="dialog" aria-modal>
      <div className="card-overlay__dialog">
        {isLoading ? (
          <>
            <p className="card-overlay__desc">
              카드를 투입구 끝까지 넣어주시고
              <br />
              결제 완료 후 카드를 빼주세요.
            </p>
            <div className="card-overlay__spinner" aria-hidden />
            <p className="card-overlay__status">결제 승인 확인 중..</p>
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
            <div className="card-overlay__check" aria-hidden>
              <IconCheck size={72} strokeWidth={3.2} />
            </div>
            <p className="card-overlay__success-copy">
              감사합니다
              <br />
              당신의 마음이 필요한 곳에 전해집니다
            </p>
            <div className="card-overlay__countdown">
              3초 후 다음 단계로 자동 전환됩니다
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
