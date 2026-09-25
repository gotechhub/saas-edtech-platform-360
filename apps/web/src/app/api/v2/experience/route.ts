import { NextResponse } from "next/server";
import { resolvePortalSession } from "@/lib/auth/session";
import { createSupabaseRequestClient } from "@/lib/supabase/request";
import { oguzLawTheme, type PortalExperienceContext, type WorkspaceRole } from "@respongo/design-tokens";
import { roleMeta, roleNavigation, type V2Role } from "@/lib/v2-experience";

export const dynamic = "force-dynamic";

const roleByKey: Record<string, WorkspaceRole> = {
  learner: "learner",
  tenant_admin: "tenant_admin",
  instructor: "instructor",
  line_manager: "line_manager",
  platform_admin: "platform_admin",
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const industry = url.searchParams.get("industry")?.trim();
  const tenant = url.searchParams.get("tenant")?.trim();
  if (!industry || !tenant) return NextResponse.json({ error: "INVALID_PORTAL" }, { status: 400 });

  const { supabase, accessToken } = await createSupabaseRequestClient(request);
  if (!supabase) return NextResponse.json({ error: "AUTH_UNAVAILABLE" }, { status: 503 });
  const result = await resolvePortalSession(supabase, industry, tenant, accessToken);
  if (result.kind !== "ready") {
    const status = result.kind === "unauthenticated" ? 401 : result.kind === "mfa_required" ? 403 : 404;
    return NextResponse.json({ error: result.kind.toUpperCase() }, { status });
  }

  const session = result.session;
  const portalResult = await supabase
    .from("portals")
    .select("experience_version")
    .eq("id", session.portalId)
    .maybeSingle();
  const themeResult = await supabase
    .from("portal_theme_versions")
    .select("tokens")
    .eq("portal_id", session.portalId)
    .eq("state", "published")
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  const activeV2Role = session.role as V2Role;
  const roles = Array.from(new Set(session.roleKeys.map((key) => roleByKey[key]).filter(Boolean)));
  const context: PortalExperienceContext = {
    tenantId: session.tenantId,
    portalId: session.portalId,
    experienceVersion: portalResult.data?.experience_version === "v2" ? "v2" : "v1",
    roles: roles.length ? roles : [roleMeta[activeV2Role].workspace],
    activeRole: roleMeta[activeV2Role].workspace,
    locale: "tr-TR",
    theme: (themeResult.data?.tokens as PortalExperienceContext["theme"] | undefined) ?? oguzLawTheme,
    enabledModules: roleNavigation[activeV2Role].map((item) => item.id),
  };

  return NextResponse.json({
    context,
    navigation: roleNavigation[activeV2Role].map(({ id, label, description, badge }) => ({ id, label, description, badge })),
    account: { email: session.email },
  }, { headers: { "Cache-Control": "private, no-store" } });
}