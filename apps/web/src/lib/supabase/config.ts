export type SupabasePublicConfig = { url: string; publishableKey: string };

export function readSupabasePublicConfig(env: NodeJS.ProcessEnv = process.env): SupabasePublicConfig | null {
  const url = env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const publishableKey = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  if (!url && !publishableKey) return null;
  if (!url || !publishableKey) throw new Error("SUPABASE_CONFIG_INCOMPLETE");
  const parsed = new URL(url);
  const local = parsed.hostname === "127.0.0.1" || parsed.hostname === "localhost";
  if ((!local && parsed.protocol !== "https:") || (local && !["http:", "https:"].includes(parsed.protocol)))
    throw new Error("SUPABASE_URL_INVALID");
  if (!/^sb_publishable_[A-Za-z0-9_-]{8,}$/.test(publishableKey) && !/^eyJ[A-Za-z0-9._-]+$/.test(publishableKey))
    throw new Error("SUPABASE_PUBLISHABLE_KEY_INVALID");
  return { url: parsed.origin, publishableKey };
}
