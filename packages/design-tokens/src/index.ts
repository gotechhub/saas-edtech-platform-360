export type ExperienceVersion = "v1" | "v2";
export type ThemeMode = "system" | "light" | "dark";
export type WorkspaceRole =
  | "learner"
  | "tenant_admin"
  | "instructor"
  | "line_manager"
  | "platform_admin";

export type PortalTheme = {
  mode: ThemeMode;
  brandName: string;
  logoVariant: "navy" | "white";
  primary: string;
  accent: string;
  surface: string;
};

export type DashboardWidget = {
  id: string;
  kind: "metric" | "queue" | "chart" | "content" | "timeline" | "status";
  title: string;
  priority: number;
  state: "loading" | "loaded" | "empty" | "error" | "forbidden" | "offline" | "stale";
};

export type PortalExperienceContext = {
  tenantId: string;
  portalId: string;
  experienceVersion: ExperienceVersion;
  roles: WorkspaceRole[];
  activeRole: WorkspaceRole;
  locale: string;
  theme: PortalTheme;
  enabledModules: string[];
};

export type DashboardDefinition = {
  role: WorkspaceRole;
  widgets: DashboardWidget[];
  generatedAt: string;
  freshness: "live" | "cached" | "stale";
};

export const breakpoints = {
  compact: 360,
  mobile: 390,
  tablet: 768,
  desktop: 1280,
  wide: 1440,
  ultra: 1920,
} as const;

export const motionDurations = {
  instant: 100,
  interface: 180,
  emphasis: 420,
  achievement: 680,
} as const;

export const oguzLawTheme: PortalTheme = {
  mode: "system",
  brandName: "Oguz Law Academy",
  logoVariant: "navy",
  primary: "#173A63",
  accent: "#C6A66A",
  surface: "#FFFFFF",
};

