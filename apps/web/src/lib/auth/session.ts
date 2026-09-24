import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { roleFromKeys, needsMfa } from "./policy";

export type PortalSession = { userId: string; email: string; tenantId: string; membershipId: string; role: ReturnType<typeof roleFromKeys>; roleKeys: string[]; aal: string | null };
export type PortalSessionResult = { kind: "ready"; session: PortalSession } | { kind: "unauthenticated" | "mfa_required" | "forbidden" };

export async function getPortalSession(industry: string, slug: string): Promise<PortalSessionResult> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { kind: "unauthenticated" };
  const { data: claimData, error: claimError } = await supabase.auth.getClaims();
  const claims = claimData?.claims;
  if (claimError || !claims?.sub) return { kind: "unauthenticated" };
  const { data: assurance, error: assuranceError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (assuranceError) return { kind: "unauthenticated" };
  if (needsMfa(assurance.currentLevel, assurance.nextLevel)) return { kind: "mfa_required" };
  const portalResult = await supabase.from("portals").select("id,tenant_id,status").eq("industry_segment", industry).eq("slug", slug).eq("status", "published").maybeSingle();
  if (portalResult.error || !portalResult.data) return { kind: "forbidden" };
  const tenantId = portalResult.data.tenant_id as string;
  const memberResult = await supabase.from("memberships").select("id,status").eq("tenant_id", tenantId).eq("user_id", claims.sub).eq("status", "active").maybeSingle();
  if (memberResult.error || !memberResult.data) return { kind: "forbidden" };
  const membershipId = memberResult.data.id as string;
  const assignmentResult = await supabase.from("role_assignments").select("role_id").eq("tenant_id", tenantId).eq("membership_id", membershipId);
  if (assignmentResult.error) return { kind: "forbidden" };
  const roleIds = (assignmentResult.data ?? []).map((x) => x.role_id as string);
  const roleResult = roleIds.length ? await supabase.from("roles").select("key").eq("tenant_id", tenantId).in("id", roleIds) : { data: [], error: null };
  if (roleResult.error) return { kind: "forbidden" };
  const roleKeys = (roleResult.data ?? []).map((x) => x.key as string);
  return { kind: "ready", session: { userId: claims.sub, email: typeof claims.email === "string" ? claims.email : "", tenantId, membershipId, role: roleFromKeys(roleKeys), roleKeys, aal: assurance.currentLevel } };
}
