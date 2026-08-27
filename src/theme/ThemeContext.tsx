import { createContext, useContext, useMemo } from "react";
import { useLocation } from "react-router-dom";
import type { LocationTheme } from "./locations";
import { resolveBaseTheme } from "./locations";
import {
  ORGANIZERS,
  resolveOrganizer,
  applyOrganizerTheme,
  type Organizer,
} from "./organizers";
import { useDonationStore } from "../store/donationStore";
import type { DonationCategory } from "../types";

/**
 * Figma 규칙: 진입(/)·캠페인 선택(/campaigns) 화면은 위치/키오스크 색을 쓰고,
 * 캠페인을 고른 뒤 내부 화면부터는 "선택한 캠페인의 주최단체" 강조색을 적용한다.
 * (NGO: 세이브더칠드런 빨강 / 유니세프 파랑 / 굿네이버스 연녹 · 학교: 초록)
 * NGO/학교 구분은 진입·목록 화면에선 색이 아니라 검색·제목·콘텐츠로 한다.
 *
 * `?kiosk=4|5|6` 이 있으면 location 테마를 덮어쓴다.
 */
const LOCATION_COLOR_ROUTES = new Set(["/", "/school", "/campaigns"]);

/**
 * 학교 기부 흐름의 라우트는 스토어 상태와 무관하게 항상 학교(초록) 테마를 쓴다.
 * 스토어의 donationCategory/selectedCampaign 는 직접 진입·세션 초기화(resetSession)·
 * 첫 페인트 시점에 비어 있을 수 있고, 그때 resolveOrganizer 기본 폴백이 NGO(유니세프 파랑)를
 * 돌려주면서 학교 화면이 파랗게 보였다. 라우트 자체가 흐름을 알고 있으므로 라우트를 기준으로 고정한다.
 */
function isSchoolRoute(pathname: string): boolean {
  return pathname === "/school" || pathname.startsWith("/school-");
}

interface ThemeContextType {
  theme: LocationTheme;
  location: string;
  /** Entry URL `?kiosk=` id when present (preserved across navigation). */
  kioskId: string | null;
  category: DonationCategory;
  /** 선택한 캠페인의 주최단체(강조색·로고의 출처). 미선택 시 기본값. */
  organizer: Organizer;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

interface ThemeProviderProps {
  location: string;
  kioskId?: string | null;
  children: React.ReactNode;
}

export function ThemeProvider({
  location,
  kioskId = null,
  children,
}: ThemeProviderProps) {
  const baseTheme = useMemo(
    () => resolveBaseTheme(location, kioskId),
    [location, kioskId],
  );
  const category = useDonationStore((state) => state.donationCategory);
  const selectedCampaign = useDonationStore((state) => state.selectedCampaign);
  const { pathname } = useLocation();

  // 선택한 캠페인의 주최단체(색·로고). 페이지들은 organizer.logo / organizer.label 로 단체를 표시.
  const organizer = useMemo(
    () =>
      isSchoolRoute(pathname)
        ? ORGANIZERS.school
        : resolveOrganizer(selectedCampaign, category),
    [selectedCampaign, category, pathname],
  );

  // 진입/캠페인목록 화면은 위치·키오스크색 유지, 그 외 내부 화면은 주최단체 강조색 적용.
  const useLocationColor = LOCATION_COLOR_ROUTES.has(pathname);

  const theme = useMemo(
    () =>
      useLocationColor ? baseTheme : applyOrganizerTheme(baseTheme, organizer),
    [baseTheme, organizer, useLocationColor],
  );

  const value = useMemo(
    () => ({ theme, location, kioskId, category, organizer }),
    [theme, location, kioskId, category, organizer],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
