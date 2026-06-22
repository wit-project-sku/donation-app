import type { DonationCategory } from "../types";
import type { LocationTheme } from "./locations";

/**
 * Accent palette per donation experience. Approximated from the Figma mockups
 * (NGO = blue, 학교 = green); tune the hex values here in one place.
 */
const CATEGORY_ACCENTS: Record<
  Exclude<DonationCategory, "none">,
  { primary: string; secondary: string }
> = {
  ngo: { primary: "#00A3E0", secondary: "#2EB6EC" },
  school: { primary: "#3DB44A", secondary: "#5FC56B" },
};

/**
 * Override a location theme's accent color with the chosen donation category.
 * `"none"` (entry / pre-selection) keeps the location color (e.g. Insadong coral).
 */
export function applyCategoryTheme(
  base: LocationTheme,
  category: DonationCategory,
): LocationTheme {
  if (category === "none") return base;
  const accent = CATEGORY_ACCENTS[category];
  return {
    ...base,
    primary: accent.primary,
    secondary: accent.secondary,
    button: { ...base.button, border: accent.primary, text: accent.primary },
    card: { ...base.card, border: accent.primary },
  };
}
