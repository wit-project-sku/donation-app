import { useLocation } from "react-router-dom";
import { useDonationStore } from "../store/donationStore";
import { useTheme } from "../theme/ThemeContext";
import { useAppNavigate } from "../hooks/useAppNavigate";
import {
  ENTRY_ROUTE,
  exitDonationApp,
  finishDonationFlow,
  getBackRoute,
} from "../config/navigation";
import { IconHomeCircle, IconBackCircle } from "./Icon";
import "./SideNav.css";

/**
 * 좌측 중앙에 세로로 쌓인 홈 + 뒤로가기 네비게이션 (Figma 5535:18546).
 * 헤더와 동일하게 아이콘 색이 활성 테마(theme.primary)를 따라간다.
 */
export function SideNav() {
  const { theme } = useTheme();
  const navigate = useAppNavigate();
  const { pathname } = useLocation();
  const resetSession = useDonationStore((state) => state.resetSession);

  const isEntry = pathname === ENTRY_ROUTE;
  const backTarget = getBackRoute(pathname);
  // 진입 화면은 앱 내부 이전 단계가 없으므로 뒤로가기를 '앱 이탈'(키오스크 메뉴 복귀)로 처리.
  const showBack = isEntry || backTarget !== null;

  const handleHome = () => finishDonationFlow(navigate, resetSession);
  const handleBack = () => {
    if (isEntry) return exitDonationApp();
    if (backTarget) navigate(backTarget);
  };

  return (
    <div className="side-nav">
      <button
        type="button"
        className="side-nav__home"
        onClick={handleHome}
        aria-label="처음으로"
      >
        <IconHomeCircle color={theme.primary} className="side-nav__icon-img" />
      </button>
      {showBack && (
        <button
          type="button"
          className="side-nav__back"
          onClick={handleBack}
          aria-label="뒤로"
        >
          <IconBackCircle color={theme.primary} className="side-nav__icon-img" />
        </button>
      )}
    </div>
  );
}
