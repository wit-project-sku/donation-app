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

/** 증서 완료/발급 화면 — 뒤로 버튼은 노출하되 클릭 불가(다른 화면과 동일한 외형). */
const STATIC_BACK_ROUTES = new Set([
  "/certificate",
  "/school-certificate",
  "/certificate-prompt",
]);

/** 교복 사주기 흐름 — 좌측 홈/뒤로 고정 초록 (Figma 5951:75859). */
const SCHOOL_NAV_ACCENT = "#08B741";

function isSchoolNavRoute(
  pathname: string,
  category: string | null | undefined,
): boolean {
  if (pathname === "/school" || pathname.startsWith("/school-")) return true;
  // /outfit 은 NGO·학교 공용 — 학교 카테고리일 때만 초록
  return pathname === "/outfit" && category === "school";
}

/**
 * 좌측 중앙에 세로로 쌓인 홈 + 뒤로가기 네비게이션 (Figma 5535:18546).
 * 기본은 활성 테마(theme.primary). 교복 사주기 흐름은 #08B741 고정.
 */
export function SideNav() {
  const { theme, category } = useTheme();
  const navigate = useAppNavigate();
  const { pathname } = useLocation();
  const resetSession = useDonationStore((state) => state.resetSession);

  const isEntry = pathname === ENTRY_ROUTE;
  const backTarget = getBackRoute(pathname);
  // 증서 완료 화면: 뒤로 버튼을 다른 화면처럼 '보이기만' 하고 클릭은 막는다.
  const backStatic = STATIC_BACK_ROUTES.has(pathname);
  // 진입 화면은 앱 내부 이전 단계가 없으므로 뒤로가기를 '앱 이탈'(키오스크 메뉴 복귀)로 처리.
  const showBack = backStatic || isEntry || backTarget !== null;
  const iconColor = isSchoolNavRoute(pathname, category)
    ? SCHOOL_NAV_ACCENT
    : theme.primary;

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
        <IconHomeCircle color={iconColor} className="side-nav__icon-img" />
      </button>
      {showBack && (
        <button
          type="button"
          className={`side-nav__back${backStatic ? " side-nav__back--static" : ""}`}
          onClick={backStatic ? undefined : handleBack}
          aria-label="뒤로"
          aria-disabled={backStatic || undefined}
          tabIndex={backStatic ? -1 : undefined}
        >
          <IconBackCircle color={iconColor} className="side-nav__icon-img" />
        </button>
      )}
    </div>
  );
}
