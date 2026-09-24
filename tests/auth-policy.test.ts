import { describe,expect,it } from "vitest";
import { needsMfa,roleFromKeys,safeReturnPath } from "../apps/web/src/lib/auth/policy.ts";
import { readSupabasePublicConfig } from "../apps/web/src/lib/supabase/config.ts";

describe("hosted auth policy",()=>{
 it("keeps hosted auth disabled when both public settings are absent",()=>expect(readSupabasePublicConfig({})).toBeNull());
 it("requires a complete HTTPS public configuration",()=>{
  expect(()=>readSupabasePublicConfig({NEXT_PUBLIC_SUPABASE_URL:"https://example.supabase.co"})).toThrow(/INCOMPLETE/);
  expect(()=>readSupabasePublicConfig({NEXT_PUBLIC_SUPABASE_URL:"http://example.supabase.co",NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:"sb_publishable_12345678"})).toThrow(/URL_INVALID/);
  expect(readSupabasePublicConfig({NEXT_PUBLIC_SUPABASE_URL:"https://example.supabase.co/path",NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:"sb_publishable_12345678"})).toEqual({url:"https://example.supabase.co",publishableKey:"sb_publishable_12345678"});
 });
 it("allows HTTP only for a local Supabase project",()=>expect(readSupabasePublicConfig({NEXT_PUBLIC_SUPABASE_URL:"http://127.0.0.1:54321",NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:"sb_publishable_12345678"})?.url).toBe("http://127.0.0.1:54321"));
 it("maps database roles with least-privilege precedence",()=>{
  expect(roleFromKeys([])).toBe("learner");expect(roleFromKeys(["line_manager"])).toBe("manager");expect(roleFromKeys(["instructor","line_manager"])).toBe("instructor");expect(roleFromKeys(["learner","tenant_admin"])).toBe("admin");
 });
 it("accepts only same-origin relative return paths",()=>{
  expect(safeReturnPath("/avukat/oguzlawacademy?x=1")).toBe("/avukat/oguzlawacademy?x=1");
  for(const value of ["https://evil.test","//evil.test","/ok\\evil","/ok\r\nSet-Cookie:x"])expect(safeReturnPath(value,"/safe")).toBe("/safe");
 });
 it("requires a challenge only when the session can move to AAL2",()=>{
  expect(needsMfa("aal1","aal2")).toBe(true);expect(needsMfa("aal2","aal2")).toBe(false);expect(needsMfa("aal1","aal1")).toBe(false);
 });
});
