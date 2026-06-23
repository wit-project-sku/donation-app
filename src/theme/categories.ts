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
  ngo: { primary: "#009FE3", secondary: "#33B4EC" },
  school: { primary: "#30B95C", secondary: "#5ECA80" },
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
