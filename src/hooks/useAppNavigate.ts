import { useCallback } from "react";
import {
  useNavigate,
  type NavigateFunction,
  type NavigateOptions,
} from "react-router-dom";
import { useTheme } from "../theme/ThemeContext";

/** Append or replace `location` on a route path (supports existing query params). */
export function appendLocationSearch(path: string, location: string): string {
  const qIndex = path.indexOf("?");
  const pathname = qIndex === -1 ? path : path.slice(0, qIndex);
  const existingSearch = qIndex === -1 ? "" : path.slice(qIndex + 1);
  const params = new URLSearchParams(existingSearch);
  params.set("location", location);
  return `${pathname}?${params.toString()}`;
}

type AppNavigate = {
  (to: string, options?: NavigateOptions): void;
  (delta: number): void;
};

/**
 * Navigate while preserving the kiosk `?location=` search param from the entry URL.
 */
export function useAppNavigate(): AppNavigate {
  const navigate = useNavigate();
  const { location } = useTheme();

  return useCallback(
    (to: string | number, options?: NavigateOptions) => {
      if (typeof to === "number") {
        (navigate as NavigateFunction)(to);
        return;
      }
      navigate(appendLocationSearch(to, location), options);
    },
    [navigate, location],
  ) as AppNavigate;
}
