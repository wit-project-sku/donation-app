import type { DonationType } from "../types";
import "./DonationTypeToggle.css";

interface DonationTypeToggleProps {
  value: DonationType;
  onChange: (type: DonationType) => void;
}

export function DonationTypeToggle({ value, onChange }: DonationTypeToggleProps) {
  return (
    <div className="donation-toggle" role="group" aria-label="후원 유형">
      <button
        type="button"
        className={`donation-toggle__btn ${value === "one-time" ? "donation-toggle__btn--active" : ""}`}
        onClick={() => onChange("one-time")}
      >
        일시 후원
      </button>
      <button
        type="button"
        className={`donation-toggle__btn ${value === "regular" ? "donation-toggle__btn--active" : ""}`}
        onClick={() => onChange("regular")}
      >
        정기 후원
      </button>
    </div>
  );
}
