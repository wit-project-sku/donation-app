import { useLocation } from "react-router-dom";
import { useDonationStore } from "../store/donationStore";
import { useTheme } from "../theme/ThemeContext";
import { useAppNavigate } from "../hooks/useAppNavigate";
import { finishDonationFlow, getBackRoute } from "../config/navigation";
import { IconHomeCircle, IconBackCircle } from "./Icon";
import { formatKioskDate } from "../utils/format";
import "./AppHeader.css";

/** 위치 핀 — 조직 primary 색으로 동적 채색 (Figma 제공 SVG) */
function LocationPin({ color }: { color: string }) {
  return (
    <svg
      className="app-header__location-icon"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 82"
      fill="none"
      aria-hidden
    >
      <path
        d="M31.5176 81.2517C31.5176 81.2517 63.0352 52.9902 63.0352 31.7941C63.0352 14.2347 48.9243 0 31.5176 0C14.1109 0 0 14.2347 0 31.7941C0 52.9902 31.5176 81.2517 31.5176 81.2517Z"
        fill={color}
      />
      <path
        d="M41.587 30.47C41.587 36.0793 37.0794 40.6265 31.5189 40.6265C25.9584 40.6265 21.4508 36.0793 21.4508 30.47C21.4508 24.8608 25.9584 20.3136 31.5189 20.3136C37.0794 20.3136 41.587 24.8608 41.587 30.47Z"
        fill="white"
      />
    </svg>
  );
}

interface AppHeaderProps {
  title?: string;
  subtitle?: string;
  /** Force the back chevron on/off. Defaults to whether a back route exists. */
  showBack?: boolean;
  /** Explicit back target (overrides the route map). */
  backTo?: string;
  onBack?: () => void;
  /** 뒤로 버튼을 다른 화면과 동일하게 '보이기만' 하고 클릭은 막는다(예: 증서 완료 화면). */
  backStatic?: boolean;
  /** 히어로 위에 오버레이되는 화면(캠페인/상세)에서 타이틀·날짜를 흰색으로 (Figma). */
  light?: boolean;
}

/**
 * Shared kiosk top chrome (Figma 5535:18545 등):
 * 📍LOCATION · date  /  home · title · back  /  ★ subtitle.
 * 위치핀·홈·뒤로 아이콘은 Figma 실 에셋 모양을 쓰되 색은 활성 테마(theme.primary)를
 * 따라간다 — 인사동 coral, 유니세프 blue, 세이브더칠드런 red, 굿네이버스 green 등.
 * (홈: 테마색 원 + 흰 집 / 뒤로·핀: 에셋 실루엣을 테마색으로 마스크 틴트)
 */
export function AppHeader({
  title = "기부",
  subtitle,
  showBack,
  backTo,
  onBack,
  backStatic = false,
  light = false,
}: AppHeaderProps) {
  const { theme } = useTheme();
  const navigate = useAppNavigate();
  const { pathname } = useLocation();
  const resetSession = useDonationStore((state) => state.resetSession);

  const backTarget = backTo ?? getBackRoute(pathname);
  // backStatic 이면 경로에 상관없이 뒤로 버튼을 노출(하지만 비활성).
  const canBack = backStatic || (showBack ?? backTarget !== null);

  const handleHome = () => finishDonationFlow(navigate, resetSession);
  const handleBack = () => {
    if (onBack) return onBack();
    if (backTarget) navigate(backTarget);
  };

  return (
    <header className="app-header">
      <div className="app-header__meta">
        <span className="app-header__location" style={{ color: theme.primary }}>
          <LocationPin color={theme.primary} />
          {theme.name.toUpperCase()}
        </span>
        <span
          className="app-header__date"
          style={light ? { color: "#ffffff" } : undefined}
        >
          {formatKioskDate()}
        </span>
      </div>

      <div className="app-header__bar">
        <button
          type="button"
          className="app-header__home"
          onClick={handleHome}
          aria-label="처음으로"
        >
          <IconHomeCircle
            color={theme.primary}
            className="app-header__icon-img"
          />
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
            className={`app-header__back${backStatic ? " app-header__back--static" : ""}`}
            onClick={backStatic ? undefined : handleBack}
            aria-label="뒤로"
            aria-disabled={backStatic || undefined}
            tabIndex={backStatic ? -1 : undefined}
          >
            <IconBackCircle
              color={theme.primary}
              className="app-header__icon-img"
            />
          </button>
        ) : (
          <span className="app-header__spacer" aria-hidden />
        )}
      </div>

      {subtitle ? (
        <p className="app-header__subtitle">★ {subtitle}</p>
      ) : null}
    </header>
  );
}
