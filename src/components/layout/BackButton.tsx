import { useLocation } from "react-router-dom";
import { getBackRoute } from "../../config/navigation";
import { useAppNavigate } from "../../hooks/useAppNavigate";
import "./BackButton.css";

interface BackButtonProps {
  /** Override automatic back target for this route */
  to?: string;
  className?: string;
}

export function BackButton({ to, className = "" }: BackButtonProps) {
  const navigate = useAppNavigate();
  const { pathname } = useLocation();

  const handleBack = () => {
    const target = to ?? getBackRoute(pathname);
    if (target) {
      navigate(target);
      return;
    }
    navigate(-1);
  };

  return (
    <button
      type="button"
      className={`back-button ${className}`.trim()}
      onClick={handleBack}
      aria-label="뒤로 가기"
    >
      뒤로
    </button>
  );
}
