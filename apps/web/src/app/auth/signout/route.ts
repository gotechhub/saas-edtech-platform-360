import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
export async function POST(request:Request){const url=new URL(request.url);const origin=request.headers.get("origin");if(origin&&origin!==url.origin)return new NextResponse(null,{status:403});const supabase=await createSupabaseServerClient();if(supabase)await supabase.auth.signOut({scope:"local"});return NextResponse.redirect(new URL("/avukat/oguzlawacademy/giris",url.origin),303);}
