import "./PageFooter.css";

interface PageFooterProps {
  children?: React.ReactNode;
  stack?: boolean;
  onBack?: () => void;
}

export function PageFooter({ children, stack, onBack }: PageFooterProps) {
  if (!children && !onBack) return null;

  const className = [
    "page-footer",
    stack ? "page-footer--stack" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <footer className={className}>
      <div className="page-footer__actions">
        {onBack && (
          <button
            type="button"
            className="page-footer__back-btn"
            onClick={onBack}
          >
            ←
          </button>
        )}
        {children}
      </div>
    </footer>
  );
}
