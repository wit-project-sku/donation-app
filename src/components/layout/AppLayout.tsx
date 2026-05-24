import { Outlet } from "react-router-dom";
import "./AppLayout.css";

export function AppLayout() {
  return (
    <div className="app-layout">
      <Outlet />
    </div>
  );
}
