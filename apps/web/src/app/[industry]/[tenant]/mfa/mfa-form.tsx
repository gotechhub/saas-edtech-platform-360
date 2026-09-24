"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function MfaForm({ returnPath }: { returnPath: string }) {
  const [factorId,setFactorId]=useState(""); const [code,setCode]=useState(""); const [error,setError]=useState(""); const [busy,setBusy]=useState(true); const router=useRouter();
  useEffect(()=>{ void (async()=>{ const supabase=createSupabaseBrowserClient(); const {data,error}=await supabase.auth.mfa.listFactors(); const factor=data ? [...data.totp,...data.phone].find(x=>x.status==="verified") : undefined; if(error||!factor) setError("Doğrulanmış MFA yöntemi bulunamadı. Akademi yöneticinizle iletişime geçin."); else setFactorId(factor.id); setBusy(false); })(); },[]);
  async function verify(e:React.FormEvent){e.preventDefault();setBusy(true);setError("");const supabase=createSupabaseBrowserClient();const challenge=await supabase.auth.mfa.challenge({factorId});if(challenge.error){setError("Doğrulama başlatılamadı.");setBusy(false);return;}const result=await supabase.auth.mfa.verify({factorId,challengeId:challenge.data.id,code});if(result.error){setError("Kod doğrulanamadı.");setBusy(false);return;}router.replace(returnPath);router.refresh();}
  return <form onSubmit={verify} className="auth-form"><label>6 haneli doğrulama kodu<input value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,"").slice(0,6))} inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" required/></label>{error&&<p className="auth-error" role="alert">{error}</p>}<button disabled={busy||!factorId||code.length!==6}>{busy?"Kontrol ediliyor…":"Doğrula"}</button></form>;
}
