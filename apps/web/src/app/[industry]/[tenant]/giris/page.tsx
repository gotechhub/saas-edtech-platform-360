import { notFound, redirect } from "next/navigation";
import { readSupabasePublicConfig } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { LoginForm } from "./login-form";

export default async function LoginPage({ params, searchParams }: { params: Promise<{industry:string;tenant:string}>; searchParams: Promise<{next?:string}> }) {
  const { industry, tenant } = await params;
  if (industry!=="avukat" || tenant!=="oguzlawacademy") notFound();
  const path=`/${industry}/${tenant}`;
  if (!readSupabasePublicConfig()) return <main className="auth-page"><section className="auth-card"><p className="auth-kicker">OGUZ LAW ACADEMY</p><h1>Giriş sistemi hazırlanıyor</h1><p>Hosted Supabase bağlantısı bu ortamda henüz etkin değil.</p></section></main>;
  const supabase=await createSupabaseServerClient();
  if ((await supabase!.auth.getClaims()).data?.claims?.sub) redirect(path);
  return <main className="auth-page"><section className="auth-card"><p className="auth-kicker">OGUZ LAW ACADEMY</p><h1>Öğrenme yolculuğuna devam et</h1><p>Kurum hesabınla güvenli giriş yap.</p><LoginForm portalPath={path} next={(await searchParams).next}/><small>Hesabın yoksa akademi yöneticinle iletişime geç.</small></section></main>;
}
