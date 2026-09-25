import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type LiveAdminMetrics = {
  activeUsers: number;
  publishedCourses: number;
  publishedPrograms: number;
  enrollments: number;
  averageCompletion: number;
  complianceRate: number;
  overdueCount: number;
};

export async function getLiveAdminMetrics(tenantId: string): Promise<LiveAdminMetrics | undefined> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return undefined;
  const [members, courses, programs, enrollments, assignments] = await Promise.all([
    supabase.from("memberships").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId).eq("status", "active"),
    supabase.from("courses").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId).eq("status", "published"),
    supabase.from("programs").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId).eq("status", "published"),
    supabase.from("enrollments").select("assignment_id,state,progress").eq("tenant_id", tenantId),
    supabase.from("learning_assignments").select("id,required,due_at").eq("tenant_id", tenantId).eq("status", "active"),
  ]);
  if (members.error || courses.error || programs.error || enrollments.error || assignments.error) return undefined;
  const enrollmentRows = enrollments.data ?? [];
  const averageCompletion = enrollmentRows.length
    ? Math.round(enrollmentRows.reduce((sum, item) => sum + Number(item.progress ?? 0), 0) / enrollmentRows.length)
    : 0;
  const required = new Map((assignments.data ?? []).filter((item) => item.required).map((item) => [item.id as string, item.due_at as string | null]));
  const complianceRows = enrollmentRows.filter((item) => required.has(item.assignment_id as string));
  const compliant = complianceRows.filter((item) => item.state === "completed" || item.state === "waived").length;
  const now = Date.now();
  const overdueCount = complianceRows.filter((item) => {
    const dueAt = required.get(item.assignment_id as string);
    return Boolean(dueAt && Date.parse(dueAt) < now && item.state !== "completed" && item.state !== "waived");
  }).length;
  return {
    activeUsers: members.count ?? 0,
    publishedCourses: courses.count ?? 0,
    publishedPrograms: programs.count ?? 0,
    enrollments: enrollmentRows.length,
    averageCompletion,
    complianceRate: complianceRows.length ? Math.round((compliant / complianceRows.length) * 100) : 100,
    overdueCount,
  };
}
export type LiveAcademyUser = {
  id: string;
  name: string;
  initials: string;
  role: string;
  team: string;
  status: "Aktif" | "Davet edildi" | "Pasif";
  completion: number;
  lastSeen: string;
};

export async function getLiveAdminUsers(tenantId: string): Promise<LiveAcademyUser[] | undefined> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return undefined;
  const [memberships, assignments, roles, teams, teamMembers, enrollments] = await Promise.all([
    supabase.from("memberships").select("id,status,job_title,display_name,updated_at").eq("tenant_id", tenantId).order("created_at"),
    supabase.from("role_assignments").select("membership_id,role_id").eq("tenant_id", tenantId),
    supabase.from("roles").select("id,key,label").eq("tenant_id", tenantId),
    supabase.from("teams").select("id,name").eq("tenant_id", tenantId).eq("status", "active"),
    supabase.from("team_members").select("team_id,membership_id").eq("tenant_id", tenantId),
    supabase.from("enrollments").select("membership_id,progress,last_activity_at").eq("tenant_id", tenantId),
  ]);
  if (memberships.error || assignments.error || roles.error || teams.error || teamMembers.error || enrollments.error) return undefined;
  const roleById = new Map((roles.data ?? []).map((item) => [item.id as string, item.label as string]));
  const roleByMembership = new Map<string, string>();
  for (const item of assignments.data ?? []) {
    const label = roleById.get(item.role_id as string);
    if (label && !roleByMembership.has(item.membership_id as string)) roleByMembership.set(item.membership_id as string, label);
  }
  const teamById = new Map((teams.data ?? []).map((item) => [item.id as string, item.name as string]));
  const teamByMembership = new Map((teamMembers.data ?? []).map((item) => [item.membership_id as string, teamById.get(item.team_id as string) ?? "Atanmamış"]));
  const enrollmentByMembership = new Map<string, Array<{ progress: number; lastActivity: string | null }>>();
  for (const item of enrollments.data ?? []) {
    const membershipId = item.membership_id as string;
    const list = enrollmentByMembership.get(membershipId) ?? [];
    list.push({ progress: Number(item.progress ?? 0), lastActivity: item.last_activity_at as string | null });
    enrollmentByMembership.set(membershipId, list);
  }
  return (memberships.data ?? []).map((member) => {
    const name = (member.display_name as string | null) || (member.job_title as string | null) || "Kurum kullanıcısı";
    const learning = enrollmentByMembership.get(member.id as string) ?? [];
    const completion = learning.length ? Math.round(learning.reduce((sum, item) => sum + item.progress, 0) / learning.length) : 0;
    const activity = learning.map((item) => item.lastActivity).filter((value): value is string => Boolean(value)).sort().at(-1);
    return {
      id: member.id as string,
      name,
      initials: name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toLocaleUpperCase("tr"),
      role: roleByMembership.get(member.id as string) ?? (member.job_title as string | null) ?? "Öğrenen",
      team: teamByMembership.get(member.id as string) ?? "Atanmamış",
      status: member.status === "active" ? "Aktif" : member.status === "invited" ? "Davet edildi" : "Pasif",
      completion,
      lastSeen: activity ? new Intl.DateTimeFormat("tr-TR", { day: "2-digit", month: "short" }).format(new Date(activity)) : "Henüz etkinlik yok",
    };
  });
}