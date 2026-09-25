"use client";
import { useActionState } from "react";
import { login, type LoginState } from "./actions";

export function LoginForm({ portalPath, next }: { portalPath: string; next?: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, undefined);
  return <form action={action} className="auth-form">
    <input type="hidden" name="portalPath" value={portalPath}/><input type="hidden" name="next" value={next ?? ""}/>
    <label>E-posta<input name="email" type="email" autoComplete="email" required maxLength={254}/></label>
    <label>Parola<input name="password" type="password" autoComplete="current-password" required minLength={6}/></label>
    {state?.error && <p className="auth-error" role="alert">{state.error}</p>}
    <button type="submit" disabled={pending}>{pending ? "Giriş yapılıyor…" : "Giriş yap"}</button>
  </form>;
}
