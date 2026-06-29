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
import { IconBack, IconHome } from "./Icon";
import "./SideNav.css";

/**
 * 좌측 중앙에 세로로 쌓인 홈 + 뒤로가기 네비게이션 (Figma 5262:28306 등).
 * 모든 키오스크 페이지에 공통으로 떠 있으며, 색은 활성 테마(coral/NGO/학교)를 따른다.
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
        style={{ backgroundColor: theme.primary }}
        aria-label="처음으로"
      >
        <IconHome size={54} color="#fff" />
      </button>
      {showBack && (
        <button
          type="button"
          className="side-nav__back"
          onClick={handleBack}
          style={{ borderColor: theme.primary, color: theme.primary }}
          aria-label="뒤로"
        >
          <IconBack size={54} />
        </button>
      )}
    </div>
  );
}
