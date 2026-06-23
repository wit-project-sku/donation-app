import { createContext, useContext, useMemo } from "react";
import { useLocation } from "react-router-dom";
import type { LocationTheme } from "./locations";
import { getLocationTheme } from "./locations";
import { applyCategoryTheme } from "./categories";
import { useDonationStore } from "../store/donationStore";
import type { DonationCategory } from "../types";

/**
 * Figma 규칙: 진입(/)·캠페인 선택(/campaigns) 화면은 인사동 위치색(coral)을 쓰고,
 * 그 이후 내부 화면부터 카테고리 강조색(NGO 파랑 / 학교 초록)을 적용한다.
 * NGO/학교 구분은 이 두 화면에선 색이 아니라 검색·제목·콘텐츠로 한다.
 */
const LOCATION_COLOR_ROUTES = new Set(["/", "/campaigns"]);

interface ThemeContextType {
  theme: LocationTheme;
  location: string;
  category: DonationCategory;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

interface ThemeProviderProps {
  location: string;
  children: React.ReactNode;
}

export function ThemeProvider({ location, children }: ThemeProviderProps) {
  const baseTheme = useMemo(() => getLocationTheme(location), [location]);
  const category = useDonationStore((state) => state.donationCategory);
  const { pathname } = useLocation();

  // 색상에만 적용할 카테고리: 진입/캠페인 화면은 위치색(coral) 유지를 위해 none 으로 억제.
  // (콘텐츠 분기용 category 는 스토어 값 그대로 노출한다.)
  const colorCategory: DonationCategory = LOCATION_COLOR_ROUTES.has(pathname)
    ? "none"
    : category;

  const theme = useMemo(
    () => applyCategoryTheme(baseTheme, colorCategory),
    [baseTheme, colorCategory],
  );

  const value = useMemo(
    () => ({ theme, location, category }),
    [theme, location, category],
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
