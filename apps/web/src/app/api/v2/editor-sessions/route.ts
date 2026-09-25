import { NextResponse } from "next/server";
import { resolvePortalSession } from "@/lib/auth/session";
import { createSupabaseRequestClient } from "@/lib/supabase/request";

export const dynamic = "force-dynamic";

const editorKeys = new Map([["goauthoring", "goauthoring"], ["certificate-designer", "certificate"], ["report-builder", "report"]]);

export async function POST(request: Request) {
  const { supabase, accessToken } = await createSupabaseRequestClient(request);
  if (!supabase) return NextResponse.json({ error: "AUTH_UNAVAILABLE" }, { status: 503 });

  const body = await request.json().catch(() => null) as null | {
    industry?: string;
    tenant?: string;
    editorKey?: string;
    returnPath?: string;
  };
  if (!body?.industry || !body.tenant || !body.editorKey || !editorKeys.has(body.editorKey)) {
    return NextResponse.json({ error: "INVALID_REQUEST" }, { status: 400 });
  }
  if (body.returnPath && (!body.returnPath.startsWith("/") || body.returnPath.startsWith("//"))) {
    return NextResponse.json({ error: "INVALID_RETURN_PATH" }, { status: 400 });
  }

  const result = await resolvePortalSession(supabase, body.industry, body.tenant, accessToken);
  if (result.kind !== "ready") return NextResponse.json({ error: result.kind.toUpperCase() }, { status: 403 });

  const { data, error } = await supabase.rpc("create_mobile_editor_session", {
    target_tenant: result.session.tenantId,
    editor_name: editorKeys.get(body.editorKey),
    return_to: body.returnPath ?? "/avukat/oguzlawacademy/v2/admin/dashboard",
  });
  if (error || !data?.[0]) return NextResponse.json({ error: "EDITOR_SESSION_UNAVAILABLE" }, { status: 503 });

  return NextResponse.json({
    sessionId: data[0].id,
    launchTicket: data[0].ticket,
    expiresAt: data[0].expires_at,
  }, { status: 201, headers: { "Cache-Control": "no-store" } });
}