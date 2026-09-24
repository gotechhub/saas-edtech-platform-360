import { notFound, redirect } from "next/navigation";
import { Academy } from "@/components/academy";
import { readSupabasePublicConfig } from "@/lib/supabase/config";
import { getPortalSession } from "@/lib/auth/session";
export const dynamic = "force-dynamic";
export default async function Portal({
  params,
}: {
  params: Promise<{ industry: string; tenant: string }>;
}) {
  const { industry, tenant } = await params;
  if (industry !== "avukat" || tenant !== "oguzlawacademy") notFound();
  const path = `/${industry}/${tenant}`;
  if (readSupabasePublicConfig()) {
    const result = await getPortalSession(industry, tenant);
    if (result.kind === "unauthenticated") redirect(`${path}/giris?next=${encodeURIComponent(path)}`);
    if (result.kind === "mfa_required") redirect(`${path}/mfa`);
    if (result.kind === "forbidden") notFound();
    if (result.kind !== "ready") notFound();
    return <Academy initialRole={result.session.role} preview={false} accountLabel={result.session.email || "Kurum hesabı"} />;
  }
  if (
    process.env.NODE_ENV === "production" &&
    process.env.RESPONGO_DEMO_ENABLED !== "true"
  )
    return (
      <main className="setup">
        <h1>Akademi kurulumu sürüyor</h1>
        <p>Bu ortam henüz kullanıma açılmadı.</p>
      </main>
    );
  return <Academy />;
}
