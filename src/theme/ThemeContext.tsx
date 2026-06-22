import { createContext, useContext, useMemo } from "react";
import type { LocationTheme } from "./locations";
import { getLocationTheme } from "./locations";
import { applyCategoryTheme } from "./categories";
import { useDonationStore } from "../store/donationStore";
import type { DonationCategory } from "../types";

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

  // Effective theme = location theme with the donation-category accent applied.
  const theme = useMemo(
    () => applyCategoryTheme(baseTheme, category),
    [baseTheme, category],
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
