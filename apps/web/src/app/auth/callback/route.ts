import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { safeReturnPath } from "@/lib/auth/policy";
export async function GET(request:Request){const url=new URL(request.url);const code=url.searchParams.get("code");const next=safeReturnPath(url.searchParams.get("next"),"/avukat/oguzlawacademy");const supabase=await createSupabaseServerClient();if(!code||!supabase)return NextResponse.redirect(new URL("/avukat/oguzlawacademy/giris",url.origin));const {error}=await supabase.auth.exchangeCodeForSession(code);return NextResponse.redirect(new URL(error?"/avukat/oguzlawacademy/giris":next,url.origin));}
