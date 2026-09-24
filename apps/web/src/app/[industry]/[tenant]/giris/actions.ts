"use server";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { safeReturnPath } from "@/lib/auth/policy";

export type LoginState = { error?: string } | undefined;
export async function login(_state: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const fallback = String(formData.get("portalPath") ?? "/");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 8) return { error: "E-posta veya parola geçersiz." };
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: "Kimlik sistemi bu ortamda yapılandırılmadı." };
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: "E-posta veya parola doğrulanamadı." };
  redirect(safeReturnPath(String(formData.get("next") ?? ""), safeReturnPath(fallback)));
}
