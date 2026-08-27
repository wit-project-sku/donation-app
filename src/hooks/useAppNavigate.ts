import { useCallback } from "react";
import {
  useNavigate,
  type NavigateFunction,
  type NavigateOptions,
} from "react-router-dom";
import { useTheme } from "../theme/ThemeContext";

/** Append or replace `location` / `kiosk` on a route path (supports existing query). */
export function appendLocationSearch(
  path: string,
  location: string,
  kioskId?: string | null,
): string {
  const qIndex = path.indexOf("?");
  const pathname = qIndex === -1 ? path : path.slice(0, qIndex);
  const existingSearch = qIndex === -1 ? "" : path.slice(qIndex + 1);
  const params = new URLSearchParams(existingSearch);
  params.set("location", location);
  if (kioskId) {
    params.set("kiosk", kioskId);
  } else {
    params.delete("kiosk");
  }
  return `${pathname}?${params.toString()}`;
}

type AppNavigate = {
  (to: string, options?: NavigateOptions): void;
  (delta: number): void;
};

/**
 * Navigate while preserving `?location=` and `?kiosk=` from the entry URL.
 */
export function useAppNavigate(): AppNavigate {
  const navigate = useNavigate();
  const { location, kioskId } = useTheme();

  return useCallback(
    (to: string | number, options?: NavigateOptions) => {
      if (typeof to === "number") {
        (navigate as NavigateFunction)(to);
        return;
      }
      navigate(appendLocationSearch(to, location, kioskId), options);
    },
    [navigate, location, kioskId],
  ) as AppNavigate;
}
