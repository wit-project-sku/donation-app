import { createContext, useContext, useMemo } from "react";
import type { LocationTheme } from "./locations";
import { getLocationTheme } from "./locations";

interface ThemeContextType {
  theme: LocationTheme;
  location: string;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

interface ThemeProviderProps {
  location: string;
  children: React.ReactNode;
}

export function ThemeProvider({ location, children }: ThemeProviderProps) {
  const theme = useMemo(() => getLocationTheme(location), [location]);

  const value = useMemo(() => ({ theme, location }), [theme, location]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
