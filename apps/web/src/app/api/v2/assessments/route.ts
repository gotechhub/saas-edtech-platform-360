import { NextResponse } from "next/server";
import { resolvePortalSession } from "@/lib/auth/session";
import { createSupabaseRequestClient } from "@/lib/supabase/request";

export const dynamic = "force-dynamic";
const noStore = { "Cache-Control": "private, no-store" };

async function context(request: Request, source: URL | Record<string, unknown>) {
  const industry = source instanceof URL ? source.searchParams.get("industry")?.trim() : String(source.industry ?? "").trim();
  const tenant = source instanceof URL ? source.searchParams.get("tenant")?.trim() : String(source.tenant ?? "").trim();
  if (!industry || !tenant) return { response: NextResponse.json({ error: "INVALID_PORTAL" }, { status: 400 }) };
  const { supabase, accessToken } = await createSupabaseRequestClient(request);
  if (!supabase) return { response: NextResponse.json({ error: "AUTH_UNAVAILABLE" }, { status: 503 }) };
  const resolved = await resolvePortalSession(supabase, industry, tenant, accessToken);
  if (resolved.kind !== "ready") {
    const status = resolved.kind === "unauthenticated" ? 401 : resolved.kind === "mfa_required" ? 403 : 404;
    return { response: NextResponse.json({ error: resolved.kind.toUpperCase() }, { status }) };
  }
  return { supabase, session: resolved.session };
}

function commandError(error: { message?: string; code?: string } | null) {
  const code = error?.message?.match(/[A-Z][A-Z0-9_]{3,}/)?.[0] ?? "ASSESSMENT_COMMAND_FAILED";
  const status = error?.code === "42501" ? 403 : error?.code === "40001" ? 409 : error?.code === "P0002" ? 404 : 400;
  return NextResponse.json({ error: code, ...(process.env.NODE_ENV === "development" ? { detail: error?.message, databaseCode: error?.code } : {}) }, { status, headers: noStore });
}

export async function GET(request: Request) {
  const resolved = await context(request, new URL(request.url));
  if ("response" in resolved) return resolved.response;
  const { supabase, session } = resolved;
  const [assessments, versions, questions, sittings] = await Promise.all([
    supabase.from("assessments").select("id,title,status,current_version,pass_score,max_attempts,time_limit_minutes,revision,updated_at").eq("tenant_id", session.tenantId).order("updated_at", { ascending: false }),
    supabase.from("assessment_versions").select("id,assessment_id,version,state,instructions,published_at").eq("tenant_id", session.tenantId).order("version", { ascending: false }),
    supabase.from("assessment_questions").select("id,assessment_version_id,position,kind,prompt,options,points").eq("tenant_id", session.tenantId).order("position"),
    supabase.from("assessment_sittings").select("id,assessment_id,enrollment_id,membership_id,attempt_no,state,started_at,expires_at,submitted_at,score,success,revision").eq("tenant_id", session.tenantId).order("started_at", { ascending: false }),
  ]);
  const failed = [assessments, versions, questions, sittings].find((item) => item.error);
  if (failed?.error) return commandError(failed.error);
  return NextResponse.json({ assessments: assessments.data ?? [], versions: versions.data ?? [], questions: questions.data ?? [], sittings: sittings.data ?? [], membershipId: session.membershipId }, { headers: noStore });
}

export async function POST(request: Request) {
  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > 512_000) return NextResponse.json({ error: "PAYLOAD_TOO_LARGE" }, { status: 413 });
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 }); }
  const resolved = await context(request, body);
  if ("response" in resolved) return resolved.response;
  const { supabase, session } = resolved;
  const action = String(body.action ?? "");
  let result;
  if (action === "save_draft") {
    result = await supabase.rpc("save_assessment_draft", {
      target_tenant: session.tenantId,target_assessment: body.assessmentId || null,assessment_title: body.title,instructions: body.instructions ?? "",
      required_pass_score: body.passScore,allowed_attempts: body.maxAttempts,limit_minutes: body.timeLimitMinutes,questions: body.questions,expected_revision: body.expectedRevision ?? 0,
    });
  } else if (action === "publish") {
    result = await supabase.rpc("publish_assessment", { target_tenant: session.tenantId,target_assessment: body.assessmentId,expected_revision: body.expectedRevision });
  } else if (action === "begin") {
    result = await supabase.rpc("begin_assessment", { target_tenant: session.tenantId,target_assessment: body.assessmentId,target_enrollment: body.enrollmentId });
  } else if (action === "submit") {
    result = await supabase.rpc("submit_assessment", { target_tenant: session.tenantId,target_sitting: body.sittingId,answers: body.answers,expected_revision: body.expectedRevision });
  } else return NextResponse.json({ error: "UNKNOWN_ACTION" }, { status: 400, headers: noStore });
  if (result.error) return commandError(result.error);
  return NextResponse.json({ data: result.data?.[0] ?? null }, { headers: noStore });
}
