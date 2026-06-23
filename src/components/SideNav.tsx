import { useLocation } from "react-router-dom";
import { useDonationStore } from "../store/donationStore";
import { useTheme } from "../theme/ThemeContext";
import { useAppNavigate } from "../hooks/useAppNavigate";
import { finishDonationFlow, getBackRoute } from "../config/navigation";
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

  const backTarget = getBackRoute(pathname);

  const handleHome = () => finishDonationFlow(navigate, resetSession);
  const handleBack = () => {
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
      {backTarget && (
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
