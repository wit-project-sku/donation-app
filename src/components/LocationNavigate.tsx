import { Navigate } from "react-router-dom";
import { appendLocationSearch } from "../hooks/useAppNavigate";
import { useTheme } from "../theme/ThemeContext";

interface LocationNavigateProps {
  to: string;
  replace?: boolean;
}

export function LocationNavigate({ to, replace }: LocationNavigateProps) {
  const { location, kioskId } = useTheme();
  return (
    <Navigate
      to={appendLocationSearch(to, location, kioskId)}
      replace={replace}
    />
  );
}
