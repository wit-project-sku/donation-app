import "./PageBody.css";

interface PageBodyProps {
  children: React.ReactNode;
  className?: string;
  scroll?: boolean;
}

export function PageBody({
  children,
  className = "",
  scroll = true,
}: PageBodyProps) {
  return (
    <div
      className={`page-body ${scroll ? "page-body--scroll" : ""} ${className}`.trim()}
    >
      {children}
    </div>
  );
}
