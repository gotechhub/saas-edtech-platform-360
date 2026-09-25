import { motionDurations, oguzLawTheme } from "@respongo/design-tokens";

export const nativeTheme = {
  colors: {
    background: "#F4F5F7",
    surface: "#FFFFFF",
    primary: oguzLawTheme.primary,
    accent: oguzLawTheme.accent,
    text: "#14233A",
    textSoft: "#5E6D7E",
    border: "#DFE4E9",
    success: "#167257",
    warning: "#A85C16",
    danger: "#B43A45",
  },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 },
  radius: { control: 10, card: 17, feature: 26 },
  motion: motionDurations,
} as const;

