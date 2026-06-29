import type { CSSProperties } from "react";
import "./PlaceholderAsset.css";

interface PlaceholderAssetProps {
  /** What the real asset will be — shown as the box label (e.g. "unicef 로고"). */
  label: string;
  width?: number | string;
  height?: number | string;
  radius?: number | string;
  className?: string;
  style?: CSSProperties;
}

/**
 * Dashed placeholder box for assets not yet provided (hero photos, partner
 * logos, illustrations, banners). Keeps layout boxes correctly sized so the
 * reskin reads against the mockups until real assets are dropped in.
 */
export function PlaceholderAsset({
  label,
  width = "100%",
  height = 240,
  radius = 24,
  className = "",
  style,
}: PlaceholderAssetProps) {
  return (
    <div
      className={`placeholder-asset ${className}`.trim()}
      style={{ width, height, borderRadius: radius, ...style }}
      role="img"
      aria-label={`${label} (자리표시)`}
    >
      <span className="placeholder-asset__label">{label}</span>
    </div>
  );
}
