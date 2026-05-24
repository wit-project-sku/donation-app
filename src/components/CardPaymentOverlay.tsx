import { useEffect, useRef, useState } from "react";
import { IconCheck, IconCreditCard } from "./Icon";
import { formatWon } from "../utils/format";
import "./CardPaymentOverlay.css";

type PaymentStep = "insert" | "processing" | "success";

interface CardPaymentOverlayProps {
  amount: number;
  onProcessPayment: () => Promise<void>;
  onComplete: () => void;
  onCancel: () => void;
  onPaymentFailed: (error: unknown) => void;
}

const STEP_LABELS: Record<PaymentStep, string> = {
  insert: "카드 투입",
  processing: "결제 처리",
  success: "결제 완료",
};

const MESSAGES: Record<PaymentStep, { title: string; subtitle: string }> = {
  insert: {
    title: "카드를 투입구 끝까지 넣어주세요",
    subtitle: "IC 칩이 위를 향하도록 넣어주세요",
  },
  processing: {
    title: "결제 승인 확인 중...",
    subtitle: "잠시만 기다려 주세요. 카드를 빼지 마세요",
  },
  success: {
    title: "결제가 완료되었습니다",
    subtitle: "카드를 제거해 주세요",
  },
};

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
      await delay(2800);
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
      await delay(2400);
      if (cancelledRef.current) return;

      onCompleteRef.current();
    };

    run();

    return () => {
      cancelledRef.current = true;
    };
  }, [amount]);

  const { title, subtitle } = MESSAGES[step];
  const steps: PaymentStep[] = ["insert", "processing", "success"];
  const stepIndex = steps.indexOf(step);

  return (
    <div className="card-payment-overlay" role="dialog" aria-modal aria-labelledby="card-payment-title">
      <p className="card-payment-overlay__amount">{formatWon(amount)}</p>

      <ul className="card-payment-overlay__steps" aria-hidden>
        {steps.map((s, i) => (
          <li
            key={s}
            className={`card-payment-overlay__step ${
              i < stepIndex
                ? "card-payment-overlay__step--done"
                : i === stepIndex
                  ? "card-payment-overlay__step--active"
                  : ""
            }`}
          >
            <span className="card-payment-overlay__step-dot" />
            <span>{STEP_LABELS[s]}</span>
          </li>
        ))}
      </ul>

      <div className="card-payment-overlay__visual">
        {step === "insert" && (
          <div className="card-terminal">
            <div className="card-terminal__slot">
              <div className="card-terminal__slot-inner" />
              <div className="card-terminal__card" />
            </div>
            <div className="card-terminal__arrow">▼</div>
          </div>
        )}

        {step === "processing" && (
          <div className="card-payment-spinner">
            <div className="card-payment-spinner__ring" />
            <div className="card-payment-spinner__ring card-payment-spinner__ring--delay" />
            <div className="card-payment-spinner__icon">
              <IconCreditCard size={48} strokeWidth={1.5} />
            </div>
          </div>
        )}

        {step === "success" && (
          <div className="card-payment-success-icon" aria-hidden>
            <IconCheck size={72} strokeWidth={2.5} aria-hidden />
          </div>
        )}
      </div>

      <h2 id="card-payment-title" className="card-payment-overlay__title">
        {title}
      </h2>
      <p className="card-payment-overlay__subtitle">{subtitle}</p>

      {step !== "success" && (
        <button
          type="button"
          className="card-payment-overlay__cancel"
          onClick={onCancel}
        >
          결제 취소
        </button>
      )}
    </div>
  );
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
