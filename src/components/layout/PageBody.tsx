import type { CSSProperties } from "react";
import "./PageBody.css";

interface PageBodyProps {
  children: React.ReactNode;
  className?: string;
  scroll?: boolean;
  style?: CSSProperties;
}

export function PageBody({
  children,
  className = "",
  scroll = true,
  style,
}: PageBodyProps) {
  return (
    <div
      className={`page-body ${scroll ? "page-body--scroll" : ""} ${className}`.trim()}
      style={style}
    >
      {children}
    </div>
  );
}
