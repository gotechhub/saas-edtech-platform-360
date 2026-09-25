import { notFound, redirect } from "next/navigation";
import { getPortalSession } from "@/lib/auth/session";
import { readSupabasePublicConfig } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

export default async function V2Entry({ params }: { params: Promise<{ industry: string; tenant: string }> }) {
  const { industry, tenant } = await params;
  if (industry !== "avukat" || tenant !== "oguzlawacademy") notFound();
  const base = `/${industry}/${tenant}`;
  if (readSupabasePublicConfig()) {
    const result = await getPortalSession(industry, tenant);
    if (result.kind === "unauthenticated") redirect(`${base}/giris?next=${encodeURIComponent(`${base}/v2`)}`);
    if (result.kind === "mfa_required") redirect(`${base}/mfa`);
    if (result.kind !== "ready") notFound();
    redirect(`${base}/v2/${result.session.role}/dashboard`);
  }
  redirect(`${base}/v2/learner/dashboard`);
}

