import { NextResponse } from "next/server";
import { resolvePortalSession } from "@/lib/auth/session";
import { createSupabaseRequestClient } from "@/lib/supabase/request";

export const dynamic = "force-dynamic";
const noStore = { "Cache-Control": "private, no-store" };

async function portalContext(
  request: Request,
  source: URL | Record<string, unknown>,
) {
  const industry =
    source instanceof URL
      ? source.searchParams.get("industry")?.trim()
      : String(source.industry ?? "").trim();
  const tenant =
    source instanceof URL
      ? source.searchParams.get("tenant")?.trim()
      : String(source.tenant ?? "").trim();
  if (!industry || !tenant)
    return {
      response: NextResponse.json({ error: "INVALID_PORTAL" }, { status: 400 }),
    };
  const { supabase, accessToken } = await createSupabaseRequestClient(request);
  if (!supabase)
    return {
      response: NextResponse.json(
        { error: "AUTH_UNAVAILABLE" },
        { status: 503 },
      ),
    };
  const resolved = await resolvePortalSession(
    supabase,
    industry,
    tenant,
    accessToken,
  );
  if (resolved.kind !== "ready") {
    const status =
      resolved.kind === "unauthenticated"
        ? 401
        : resolved.kind === "mfa_required"
          ? 403
          : 404;
    return {
      response: NextResponse.json(
        { error: resolved.kind.toUpperCase() },
        { status },
      ),
    };
  }
  return { supabase, session: resolved.session };
}

function commandError(error: { message?: string; code?: string } | null) {
  const code =
    error?.message?.match(/[A-Z][A-Z0-9_]{3,}/)?.[0] ??
    "PROGRAM_COMMAND_FAILED";
  const status =
    error?.code === "42501"
      ? 403
      : error?.code === "40001"
        ? 409
        : error?.code === "P0002"
          ? 404
          : 400;
  return NextResponse.json(
    {
      error: code,
      ...(process.env.NODE_ENV === "development"
        ? { detail: error?.message, databaseCode: error?.code }
        : {}),
    },
    { status, headers: noStore },
  );
}

export async function GET(request: Request) {
  const context = await portalContext(request, new URL(request.url));
  if ("response" in context) return context.response;
  const { supabase, session } = context;
  const [programs, versions, assignments, enrollments] = await Promise.all([
    supabase
      .from("programs")
      .select(
        "id,title,description,mode,status,current_version,revision,updated_at",
      )
      .eq("tenant_id", session.tenantId)
      .order("updated_at", { ascending: false }),
    supabase
      .from("program_versions")
      .select("program_id,version,state,definition,published_at")
      .eq("tenant_id", session.tenantId)
      .order("version", { ascending: false }),
    supabase
      .from("learning_assignments")
      .select(
        "id,program_id,audience_type,audience_rule,required,due_at,created_at,revision,status",
      )
      .eq("tenant_id", session.tenantId)
      .not("program_id", "is", null)
      .order("created_at", { ascending: false }),
    supabase
      .from("enrollments")
      .select(
        "id,assignment_id,membership_id,state,progress,score,progress_detail,revision,last_activity_at",
      )
      .eq("tenant_id", session.tenantId),
  ]);
  const failed = [programs, versions, assignments, enrollments].find(
    (result) => result.error,
  );
  if (failed?.error) return commandError(failed.error);
  return NextResponse.json(
    {
      programs: programs.data ?? [],
      versions: versions.data ?? [],
      assignments: assignments.data ?? [],
      enrollments: enrollments.data ?? [],
      membershipId: session.membershipId,
    },
    { headers: noStore },
  );
}

export async function POST(request: Request) {
  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > 512_000)
    return NextResponse.json({ error: "PAYLOAD_TOO_LARGE" }, { status: 413 });
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }
  const context = await portalContext(request, body);
  if ("response" in context) return context.response;
  const { supabase, session } = context;
  const action = String(body.action ?? "");
  let result;
  if (action === "save_draft") {
    result = await supabase.rpc("save_program_draft", {
      target_tenant: session.tenantId,
      target_program: body.programId || null,
      program_title: body.title,
      program_description: body.description ?? "",
      program_mode: body.mode,
      program_definition: body.definition,
      expected_revision: body.expectedRevision ?? 0,
    });
  } else if (action === "publish") {
    result = await supabase.rpc("publish_program", {
      target_tenant: session.tenantId,
      target_program: body.programId,
      expected_revision: body.expectedRevision,
    });
  } else if (action === "assign") {
    result = await supabase.rpc("assign_program", {
      target_tenant: session.tenantId,
      target_program: body.programId,
      audience_type: body.audienceType,
      audience_rule: body.audienceRule ?? {},
      assignment_required: body.required ?? false,
      due_at: body.dueAt,
      pass_score: body.passScore,
      idempotency_key: body.idempotencyKey,
    });
  } else if (action === "progress") {
    result = await supabase.rpc("record_enrollment_progress", {
      target_tenant: session.tenantId,
      target_enrollment: body.enrollmentId,
      completed_step_ids: body.completedStepIds,
      total_steps: body.totalSteps,
      result_score: body.score ?? null,
      expected_revision: body.expectedRevision,
    });
  } else {
    return NextResponse.json(
      { error: "UNKNOWN_ACTION" },
      { status: 400, headers: noStore },
    );
  }
  if (result.error) return commandError(result.error);
  return NextResponse.json(
    { data: result.data?.[0] ?? null },
    { headers: noStore },
  );
}
