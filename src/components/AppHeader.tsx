import { useLocation } from "react-router-dom";
import { MapPin } from "lucide-react";
import { useDonationStore } from "../store/donationStore";
import { useTheme } from "../theme/ThemeContext";
import { useAppNavigate } from "../hooks/useAppNavigate";
import { finishDonationFlow, getBackRoute } from "../config/navigation";
import { IconBack, IconHome } from "./Icon";
import { formatKioskDate } from "../utils/format";
import "./AppHeader.css";

interface AppHeaderProps {
  title?: string;
  subtitle?: string;
  /** Force the back chevron on/off. Defaults to whether a back route exists. */
  showBack?: boolean;
  /** Explicit back target (overrides the route map). */
  backTo?: string;
  onBack?: () => void;
  /** 히어로 위에 오버레이되는 화면(캠페인/상세)에서 타이틀을 흰색으로 (Figma). */
  light?: boolean;
}

/**
 * Shared kiosk top chrome from the Figma mockups:
 * 📍LOCATION · date  /  home · "기부" title · back  /  ★ subtitle.
 * Accent (location pin, home fill, back outline) follows the active theme
 * (Insadong coral, or NGO blue / 학교 green once a category is chosen).
 */
export function AppHeader({
  title = "기부",
  subtitle = "페이지 설명문",
  showBack,
  backTo,
  onBack,
  light = false,
}: AppHeaderProps) {
  const { theme } = useTheme();
  const navigate = useAppNavigate();
  const { pathname } = useLocation();
  const resetSession = useDonationStore((state) => state.resetSession);

  const backTarget = backTo ?? getBackRoute(pathname);
  const canBack = showBack ?? backTarget !== null;

  const handleHome = () => finishDonationFlow(navigate, resetSession);
  const handleBack = () => {
    if (onBack) return onBack();
    if (backTarget) navigate(backTarget);
  };

  return (
    <header className="app-header">
      <div className="app-header__meta">
        <span className="app-header__location" style={{ color: theme.primary }}>
          <MapPin size={48} strokeWidth={2.5} fill={theme.primary} />
          {theme.name.toUpperCase()}
        </span>
        <span className="app-header__date">{formatKioskDate()}</span>
      </div>

      <div className="app-header__bar">
        <button
          type="button"
          className="app-header__home"
          onClick={handleHome}
          style={{ backgroundColor: theme.primary }}
          aria-label="처음으로"
        >
          <IconHome size={96} color="#fff" />
        </button>
        <h1
          className="app-header__title"
          style={light ? { color: "#ffffff" } : undefined}
        >
          {title}
        </h1>
        {canBack ? (
          <button
            type="button"
            className="app-header__back"
            onClick={handleBack}
            style={{ borderColor: theme.primary, color: theme.primary }}
            aria-label="뒤로"
          >
            <IconBack size={108} />
          </button>
        ) : (
          <span className="app-header__spacer" aria-hidden />
        )}
      </div>

      <p className="app-header__subtitle">★ {subtitle}</p>
    </header>
  );
}
