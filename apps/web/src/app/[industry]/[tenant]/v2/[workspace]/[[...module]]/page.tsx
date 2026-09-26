import { notFound, redirect } from "next/navigation";
import { ExperienceShell } from "@/components/v2/experience-shell";
import { ExperienceState, isExperienceViewState } from "@/components/v2/experience-state";
import { V2Dashboard } from "@/components/v2/dashboards";
import { ModuleWorkspace } from "@/components/v2/module-workspace";
import { getPortalSession } from "@/lib/auth/session";
import { getLiveAdminMetrics, getLiveAdminUsers } from "@/lib/live-dashboard";
import { readSupabasePublicConfig } from "@/lib/supabase/config";
import { defaultModule, isV2Role, roleNavigation, type V2Role } from "@/lib/v2-experience";

export const dynamic = "force-dynamic";

type WorkspacePageProps = {
  params: Promise<{ industry: string; tenant: string; workspace: string; module?: string[] }>;
  searchParams: Promise<{ state?: string }>;
};

export default async function V2Workspace({ params, searchParams }: WorkspacePageProps) {
  const { industry, tenant, workspace, module: moduleSegments } = await params;
  const query = await searchParams;
  if (industry !== "avukat" || tenant !== "oguzlawacademy" || !isV2Role(workspace)) notFound();
  const role = workspace as V2Role;
  const moduleId = moduleSegments?.[0] || defaultModule(role);
  const allowedModule = moduleId === "profile" || roleNavigation[role].some((item) => item.id === moduleId);
  if (!allowedModule || (moduleSegments?.length ?? 0) > 1) notFound();

  const portalBase = `/${industry}/${tenant}`;
  let accountLabel = "Demo profil";
  let preview = true;
  let previewRoles: V2Role[] = ["learner", "admin", "instructor", "manager", "platform"];
  let tenantId: string | undefined;
  let canReadAdminData = false;
  const publicConfig = readSupabasePublicConfig();

  if (publicConfig) {
    const result = await getPortalSession(industry, tenant);
    if (result.kind === "unauthenticated") redirect(`${portalBase}/giris?next=${encodeURIComponent(`${portalBase}/v2/${role}/${moduleId}`)}`);
    if (result.kind === "mfa_required") redirect(`${portalBase}/mfa`);
    if (result.kind !== "ready") notFound();
    accountLabel = result.session.email || "Kurum hesabı";
    tenantId = result.session.tenantId;
    canReadAdminData = result.session.roleKeys.includes("tenant_admin");
    if (canReadAdminData) {
      previewRoles = ["learner", "admin", "instructor", "manager", "platform"];
      preview = role !== result.session.role || role === "platform";
    } else {
      previewRoles = [result.session.role];
      preview = false;
      if (role !== result.session.role) redirect(`${portalBase}/v2/${result.session.role}/dashboard`);
    }
  } else if (process.env.NODE_ENV === "production" && process.env.RESPONGO_DEMO_ENABLED !== "true") {
    notFound();
  }

  const [metrics, users] = tenantId && canReadAdminData
    ? await Promise.all([getLiveAdminMetrics(tenantId), getLiveAdminUsers(tenantId)])
    : [undefined, undefined];
  const basePath = `${portalBase}/v2/${role}`;
  const moduleLabel = moduleId === "profile"
    ? "Profil ve tercihler"
    : roleNavigation[role].find((item) => item.id === moduleId)?.label ?? "Çalışma alanı";
  const requestedState = isExperienceViewState(query.state) ? query.state : "loaded";
  const viewState = canReadAdminData || !publicConfig ? requestedState : "loaded";
  const currentHref = `${basePath}/${moduleId}`;

  return (
    <ExperienceShell role={role} moduleId={moduleId} industry={industry} tenant={tenant} accountLabel={accountLabel} previewRoles={previewRoles} preview={preview}>
      <ExperienceState state={viewState} moduleLabel={moduleLabel} retryHref={currentHref} dashboardHref={`${basePath}/dashboard`}>
        {moduleId === "dashboard"
          ? <V2Dashboard role={role} basePath={basePath} accountLabel={accountLabel} metrics={metrics} users={users} />
          : <ModuleWorkspace role={role} moduleId={moduleId} basePath={basePath} users={users} />}
      </ExperienceState>
    </ExperienceShell>
  );
}
