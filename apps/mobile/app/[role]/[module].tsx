import { Redirect, useLocalSearchParams } from "expo-router";
import { MobileShell } from "@/components/mobile-shell";
import { RoleDashboard } from "@/components/role-dashboard";
import { ModuleScreen } from "@/components/module-screen";
import { isMobileRole, navigation } from "@/data/navigation";

export default function WorkspaceRoute() {
  const params = useLocalSearchParams<{ role: string; module: string }>();
  if (!isMobileRole(params.role)) return <Redirect href="/learner/dashboard" />;
  const moduleId = navigation[params.role].some((item) => item.id === params.module) ? params.module : "dashboard";
  return (
    <MobileShell role={params.role} moduleId={moduleId}>
      {moduleId === "dashboard" ? <RoleDashboard role={params.role} /> : <ModuleScreen role={params.role} moduleId={moduleId} />}
    </MobileShell>
  );
}