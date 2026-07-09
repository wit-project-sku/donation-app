import { createContext, useContext, useMemo } from "react";
import { useLocation } from "react-router-dom";
import type { LocationTheme } from "./locations";
import { getLocationTheme } from "./locations";
import {
  resolveOrganizer,
  applyOrganizerTheme,
  type Organizer,
} from "./organizers";
import { useDonationStore } from "../store/donationStore";
import type { DonationCategory } from "../types";

/**
 * Figma 규칙: 진입(/)·캠페인 선택(/campaigns) 화면은 인사동 위치색(coral)을 쓰고,
 * 캠페인을 고른 뒤 내부 화면부터는 "선택한 캠페인의 주최단체" 강조색을 적용한다.
 * (NGO: 세이브더칠드런 빨강 / 유니세프 파랑 / 굿네이버스 연녹 · 학교: 초록)
 * NGO/학교 구분은 진입·목록 화면에선 색이 아니라 검색·제목·콘텐츠로 한다.
 */
const LOCATION_COLOR_ROUTES = new Set(["/", "/school", "/campaigns"]);

interface ThemeContextType {
  theme: LocationTheme;
  location: string;
  category: DonationCategory;
  /** 선택한 캠페인의 주최단체(강조색·로고의 출처). 미선택 시 기본값. */
  organizer: Organizer;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

interface ThemeProviderProps {
  location: string;
  children: React.ReactNode;
}

export function ThemeProvider({ location, children }: ThemeProviderProps) {
  const baseTheme = useMemo(() => getLocationTheme(location), [location]);
  const category = useDonationStore((state) => state.donationCategory);
  const selectedCampaign = useDonationStore((state) => state.selectedCampaign);
  const { pathname } = useLocation();

  // 선택한 캠페인의 주최단체(색·로고). 페이지들은 organizer.logo / organizer.label 로 단체를 표시.
  const organizer = useMemo(
    () => resolveOrganizer(selectedCampaign, category),
    [selectedCampaign, category],
  );

  // 진입/캠페인목록 화면은 위치색(coral) 유지, 그 외 내부 화면은 주최단체 강조색 적용.
  const useLocationColor = LOCATION_COLOR_ROUTES.has(pathname);

  const theme = useMemo(
    () =>
      useLocationColor ? baseTheme : applyOrganizerTheme(baseTheme, organizer),
    [baseTheme, organizer, useLocationColor],
  );

  const value = useMemo(
    () => ({ theme, location, category, organizer }),
    [theme, location, category, organizer],
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
