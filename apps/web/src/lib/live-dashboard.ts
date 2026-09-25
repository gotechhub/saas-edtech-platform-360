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