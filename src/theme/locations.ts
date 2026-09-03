export interface LocationTheme {
  name: string;
  background: string;
  primary: string;
  secondary: string;
  text: {
    primary: string;
    secondary: string;
    onPrimary: string;
  };
  button: {
    background: string;
    border: string;
    text: string;
  };
  card: {
    background: string;
    border: string;
  };
}

export const locationThemes: Record<string, LocationTheme> = {
  insadong: {
    name: "Insadong",
    background: "#FFFBF2",
    primary: "#FE6C50",
    secondary: "#F19482",
    text: {
      primary: "#2D3436",
      secondary: "#636E72",
      onPrimary: "#FFFFFF",
    },
    button: {
      background: "#FFFFFF",
      border: "#FE6C50",
      text: "#FE6C50",
    },
    card: {
      background: "#FFFFFF",
      border: "#FE6C50",
    },
  },
  osaek: {
    name: "Osaek",
    background: "#FFFFFF",
    primary: "#1A4D7E",
    secondary: "#2D5A96",
    text: {
      primary: "#000000",
      secondary: "#636E72",
      onPrimary: "#FFFFFF",
    },
    button: {
      background: "#FFFFFF",
      border: "#1A4D7E",
      text: "#1A4D7E",
    },
    card: {
      background: "#FFFFFF",
      border: "#1A4D7E",
    },
  },
  hwaseong: {
    name: "Hwaseong",
    background: "#FFFFFF",
    primary: "#1A4D7E",
    secondary: "#2D5A96",
    text: {
      primary: "#000000",
      secondary: "#636E72",
      onPrimary: "#FFFFFF",
    },
    button: {
      background: "#FFFFFF",
      border: "#1A4D7E",
      text: "#1A4D7E",
    },
    card: {
      background: "#FFFFFF",
      border: "#1A4D7E",
    },
  },
};

/** Slightly tinted surface for cards/buttons on white page backgrounds */
const ELEVATED_SURFACE = "#F4F7FB";

function applySurfaceElevation(theme: LocationTheme): LocationTheme {
  const isWhitePage = theme.background.toUpperCase() === "#FFFFFF";
  if (!isWhitePage) return theme;

  const elevate = (color: string) =>
    color.toUpperCase() === "#FFFFFF" ? ELEVATED_SURFACE : color;

  return {
    ...theme,
    button: {
      ...theme.button,
      background: elevate(theme.button.background),
    },
    card: {
      ...theme.card,
      background: elevate(theme.card.background),
    },
  };
}

/** Kiosk ID → location-color override. When set, wins over `?location=`. */
export const kioskThemes: Record<string, LocationTheme> = {
  "4": {
    name: "Osaek Market",
    background: "#FFFFFF",
    primary: "#1A4D7E",
    secondary: "#2D5A96",
    text: {
      primary: "#000000",
      secondary: "#636E72",
      onPrimary: "#FFFFFF",
    },
    button: {
      background: "#FFFFFF",
      border: "#1A4D7E",
      text: "#1A4D7E",
    },
    card: {
      background: "#FFFFFF",
      border: "#1A4D7E",
    },
  },
  "5": {
    name: "Hwaseong Sa",
    background: "#FFFFFF",
    primary: "#005AB4",
    secondary: "#1A7AD4",
    text: {
      primary: "#000000",
      secondary: "#636E72",
      onPrimary: "#FFFFFF",
    },
    button: {
      background: "#FFFFFF",
      border: "#005AB4",
      text: "#005AB4",
    },
    card: {
      background: "#FFFFFF",
      border: "#005AB4",
    },
  },
  "6": {
    name: "Jejudo Island",
    background: "#FFFBF2",
    primary: "#FF7F0F",
    secondary: "#FF9A40",
    text: {
      primary: "#2D3436",
      secondary: "#636E72",
      onPrimary: "#FFFFFF",
    },
    button: {
      background: "#FFFFFF",
      border: "#FF7F0F",
      text: "#FF7F0F",
    },
    card: {
      background: "#FFFFFF",
      border: "#FF7F0F",
    },
  },
};

export const getLocationTheme = (location: string): LocationTheme => {
  const theme = locationThemes[location.toLowerCase()] || locationThemes.insadong;
  return applySurfaceElevation(theme);
};

/** Prefer kiosk theme (4/5/6) when present; otherwise fall back to location. */
export const resolveBaseTheme = (
  location: string,
  kioskId: string | null,
): LocationTheme => {
  if (kioskId && kioskThemes[kioskId]) {
    return applySurfaceElevation(kioskThemes[kioskId]);
  }
  return getLocationTheme(location);
};
