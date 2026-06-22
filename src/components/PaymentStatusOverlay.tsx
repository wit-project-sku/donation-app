import { useCallback, useEffect, useRef, useState } from "react";
import { useTheme } from "../theme/ThemeContext";
import { ApiError } from "../api/client";
import { IconCheck } from "./Icon";
import cardReader from "../assets/card-reader.png";
import errComm from "../assets/error-comm.png";
import errTimeout from "../assets/error-timeout.png";
import errInsufficient from "../assets/error-insufficient.png";
import { formatCurrency } from "../utils/format";
import "./PaymentStatusOverlay.css";

type ErrorKind = "comm" | "timeout" | "insufficient";
type Step = "insert" | "processing" | "success" | "error";

interface PaymentStatusOverlayProps {
  amount: number;
  inline?: boolean;
  onProcessPayment: () => Promise<void>;
  onComplete: () => void;
  onCancel: () => void | Promise<void>;
  onPaymentFailed: (error: unknown) => void;
}

const ERROR_META: Record<
  ErrorKind,
  { title: string; desc: string; img: string }
> = {
  comm: {
    title: "통신 오류가 발생했습니다",
    desc: "잠시 후 자동으로 재시도합니다",
    img: errComm,
  },
  timeout: {
    title: "시간이 초과되었습니다",
    desc: "처음부터 다시 시도해 주세요",
    img: errTimeout,
  },
  insufficient: {
    title: "잔액이 부족합니다",
    desc: "카드 잔액 또는 한도가 부족하여 결제할 수 없습니다",
    img: errInsufficient,
  },
};

function classifyError(error: unknown): ErrorKind {
  if (error instanceof ApiError) {
    const code = (error.errorCode || "").toUpperCase();
    const msg = error.message || "";
    if (
      code.includes("BALANCE") ||
      code.includes("LIMIT") ||
      msg.includes("잔액") ||
      msg.includes("한도")
    )
      return "insufficient";
    if (msg.includes("초과") || msg.includes("시간")) return "timeout";
    return "comm";
  }
  if (error instanceof DOMException && error.name === "AbortError")
    return "timeout";
  return "comm";
}

/**
 * Card payment overlay — visual states from the Figma mockups
 * (insert → processing → success, plus comm/timeout/insufficient errors) with a
 * 30s timer badge. Drop-in for CardPaymentOverlay (same props). The payment API
 * calls live in PaymentPage; this only drives the presentation.
 */
export function PaymentStatusOverlay({
  amount,
  inline = false,
  onProcessPayment,
  onComplete,
  onCancel,
  onPaymentFailed,
}: PaymentStatusOverlayProps) {
  const { theme } = useTheme();
  const [step, setStep] = useState<Step>("insert");
  const [errorKind, setErrorKind] = useState<ErrorKind>("comm");
  const [timer, setTimer] = useState(30);
  const [countdown, setCountdown] = useState(3);
  const cancelledRef = useRef(false);
  const refs = useRef({ onProcessPayment, onComplete, onCancel, onPaymentFailed });
  refs.current = { onProcessPayment, onComplete, onCancel, onPaymentFailed };

  const run = useCallback(() => {
    cancelledRef.current = false;
    setStep("insert");
    setTimer(30);
    const toProcessing = window.setTimeout(() => {
      if (!cancelledRef.current)
        setStep((current) => (current === "insert" ? "processing" : current));
    }, 1200);

    void (async () => {
      try {
        await refs.current.onProcessPayment();
        if (cancelledRef.current) return;
        window.clearTimeout(toProcessing);
        setStep("success");
      } catch (err) {
        if (cancelledRef.current) return;
        window.clearTimeout(toProcessing);
        setErrorKind(classifyError(err));
        setStep("error");
        refs.current.onPaymentFailed(err);
      }
    })();
  }, []);

  useEffect(() => {
    run();
    return () => {
      cancelledRef.current = true;
    };
  }, [run]);

  // 30s timer while waiting for the reader
  useEffect(() => {
    if (step !== "insert" && step !== "processing") return;
    const id = window.setInterval(
      () => setTimer((t) => (t <= 1 ? 0 : t - 1)),
      1000,
    );
    return () => window.clearInterval(id);
  }, [step]);

  // 3s success countdown → next step
  useEffect(() => {
    if (step !== "success") return;
    setCountdown(3);
    const id = window.setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          window.clearInterval(id);
          refs.current.onComplete();
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [step]);

  const handleCancel = () => {
    cancelledRef.current = true;
    refs.current.onCancel();
  };

  const isError = step === "error";
  const waiting = step === "insert" || step === "processing";

  const amountCard = (
    <div className="pso__amount-card">
      <p className="pso__amount-label">기부 금액</p>
      <p className="pso__amount-value">{formatCurrency(amount)}원</p>
    </div>
  );

  return (
    <div
      className={`pso${inline ? " pso--inline" : ""}`}
      role="dialog"
      aria-modal={!inline}
    >
      <div className={`pso__card${isError ? " pso__card--error" : ""}`}>
        {!isError && (
          <span className="pso__timer" style={{ backgroundColor: theme.primary }}>
            {timer}초
          </span>
        )}

        {waiting && (
          <>
            <h2 className="pso__title">
              {step === "insert" ? "카드를 넣어주세요" : "결제 진행 중..."}
            </h2>
            <p className="pso__desc">
              {step === "insert"
                ? "기기 하단에 있는 리더기에 카드를 넣어주세요"
                : "카드를 빼지 마시고 잠시만 기다려주세요"}
            </p>
            {amountCard}
            <img className="pso__reader" src={cardReader} alt="" />
            <div className="pso__bar">
              <div
                className="pso__bar-fill"
                style={{ backgroundColor: theme.primary }}
              />
            </div>
            <button type="button" className="pso__cancel" onClick={handleCancel}>
              취소
            </button>
          </>
        )}

        {step === "success" && (
          <>
            <h2 className="pso__title">결제 완료</h2>
            <p className="pso__desc">당신의 마음이 필요한 곳에 전해집니다</p>
            {amountCard}
            <div
              className="pso__check"
              style={{ backgroundColor: theme.primary }}
              aria-hidden
            >
              <IconCheck size={84} strokeWidth={3.2} color="#fff" />
            </div>
            <div
              className="pso__auto"
              style={{ backgroundColor: theme.primary }}
            >
              {countdown}초 후 다음 단계로 자동 전환됩니다
            </div>
          </>
        )}

        {isError && (
          <>
            <h2 className="pso__title pso__title--error">
              {ERROR_META[errorKind].title}
            </h2>
            <p className="pso__desc">{ERROR_META[errorKind].desc}</p>
            {amountCard}
            <img
              className="pso__error-icon"
              src={ERROR_META[errorKind].img}
              alt=""
            />
            <button type="button" className="pso__retry" onClick={run}>
              다시 시도
            </button>
          </>
        )}
      </div>
    </div>
  );
}
