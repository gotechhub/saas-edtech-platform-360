import type { Role } from "../demo";

export function roleFromKeys(keys: string[]): Role {
  if (keys.includes("tenant_admin")) return "admin";
  if (keys.includes("instructor")) return "instructor";
  if (keys.includes("line_manager")) return "manager";
  return "learner";
}

export function safeReturnPath(value: string | null, fallback = "/") {
  if (!value || !value.startsWith("/") || value.startsWith("//") || /[\\\r\n]/.test(value)) return fallback;
  try { const parsed = new URL(value, "https://local.invalid"); return parsed.origin === "https://local.invalid" ? parsed.pathname + parsed.search + parsed.hash : fallback; }
  catch { return fallback; }
}

export function needsMfa(currentLevel: string | null, nextLevel: string | null) {
  return nextLevel === "aal2" && currentLevel !== "aal2";
}
