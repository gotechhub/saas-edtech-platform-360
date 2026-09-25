import { PGlite } from "@electric-sql/pglite";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";
import { readFileSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

let db: PGlite;
const TENANT = "c1000000-0000-4000-8000-000000000001";
const PORTAL = "c2000000-0000-4000-8000-000000000001";
const OTHER_TENANT = "c1000000-0000-4000-8000-000000000002";
const ADMIN = "a1000000-0000-4000-8000-000000000001";
const INSTRUCTOR = "a1000000-0000-4000-8000-000000000002";
const LEARNER = "a1000000-0000-4000-8000-000000000003";
const OUTSIDER = "a1000000-0000-4000-8000-000000000004";
const ADMIN_MEMBER = "b1000000-0000-4000-8000-000000000001";
const INSTRUCTOR_MEMBER = "b1000000-0000-4000-8000-000000000002";
const LEARNER_MEMBER = "b1000000-0000-4000-8000-000000000003";
const OUTSIDER_MEMBER = "b1000000-0000-4000-8000-000000000004";

beforeAll(async () => {
  db = new PGlite({ extensions: { pgcrypto } });
  await db.exec([
    "create role anon",
    "create role authenticated",
    "create schema auth",
    "create table auth.users(id uuid primary key,email text)",
    "create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$",
    "grant usage on schema auth to authenticated",
    "grant execute on function auth.uid() to authenticated"
  ].join(";") + ";");

  for (const file of [
    "supabase/migrations/202609210001_tenant_foundation.sql",
    "supabase/migrations/202609210002_learning_domain.sql",
    "supabase/migrations/202609240003_learning_runtime.sql",
    "supabase/migrations/202609240004_identity_commands.sql"
  ]) await db.exec(readFileSync(file, "utf8"));

  await db.exec([
    "insert into auth.users values('" + ADMIN + "','admin@academy.test'),('" + INSTRUCTOR + "','instructor@academy.test'),('" + LEARNER + "','learner@academy.test'),('" + OUTSIDER + "','outside@academy.test')",
    "insert into industry_packs values('d1000000-0000-4000-8000-000000000001','legal','Hukuk','published')",
    "insert into pack_versions(id,pack_id,version,published_at) values('d2000000-0000-4000-8000-000000000001','d1000000-0000-4000-8000-000000000001',1,now())",
    "insert into tenants(id,name,status,industry_pack_version_id) values('" + TENANT + "','Oguz Law Academy','active','d2000000-0000-4000-8000-000000000001'),('" + OTHER_TENANT + "','Other Academy','active','d2000000-0000-4000-8000-000000000001')",
    "insert into portals(id,tenant_id,industry_segment,slug,primary_host,status) values('" + PORTAL + "','" + TENANT + "','avukat','oguzlawacademy','lms.respongo.com','published'),('c2000000-0000-4000-8000-000000000002','" + OTHER_TENANT + "','avukat','other','lms.respongo.com','published')",
    "insert into memberships(id,tenant_id,user_id,status) values('" + ADMIN_MEMBER + "','" + TENANT + "','" + ADMIN + "','active'),('" + INSTRUCTOR_MEMBER + "','" + TENANT + "','" + INSTRUCTOR + "','active'),('" + LEARNER_MEMBER + "','" + TENANT + "','" + LEARNER + "','active'),('" + OUTSIDER_MEMBER + "','" + OTHER_TENANT + "','" + OUTSIDER + "','active')",
    "insert into roles(id,tenant_id,key,label) values('e1000000-0000-4000-8000-000000000001','" + TENANT + "','tenant_admin','Yönetici'),('e1000000-0000-4000-8000-000000000002','" + TENANT + "','instructor','Eğitmen'),('e1000000-0000-4000-8000-000000000003','" + TENANT + "','learner','Öğrenen'),('e1000000-0000-4000-8000-000000000004','" + OTHER_TENANT + "','learner','Öğrenen')",
    "insert into role_assignments(tenant_id,membership_id,role_id) values('" + TENANT + "','" + ADMIN_MEMBER + "','e1000000-0000-4000-8000-000000000001'),('" + TENANT + "','" + INSTRUCTOR_MEMBER + "','e1000000-0000-4000-8000-000000000002'),('" + TENANT + "','" + LEARNER_MEMBER + "','e1000000-0000-4000-8000-000000000003'),('" + OTHER_TENANT + "','" + OUTSIDER_MEMBER + "','e1000000-0000-4000-8000-000000000004')"
  ].join(";") + ";");

  await db.exec(readFileSync("supabase/migrations/202609250012_experience_v2_foundation.sql", "utf8"));
});

afterAll(async () => db.close());

async function asUser<T>(user: string, fn: () => Promise<T>) {
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [user]);
  await db.exec("set role authenticated");
  try { return await fn(); } finally { await db.exec("reset role"); }
}

describe("UXV2 experience foundation", () => {
  it("publishes a versioned theme and enforces tenant read isolation", async () => {
    const own = await asUser(LEARNER, () => db.query<{ name: string }>("select name from portal_theme_versions"));
    expect(own.rows.map((row) => row.name)).toEqual(["Oguz Law Academy · Experience V2"]);
    const outside = await asUser(OUTSIDER, () => db.query("select id from portal_theme_versions"));
    expect(outside.rows).toHaveLength(0);
  });

  it("changes experience only for tenant admin with optimistic revision", async () => {
    const changed = await asUser(ADMIN, () => db.query<{ experience_version: string; revision: number }>(
      "select * from set_portal_experience($1,$2,$3,$4)",
      [TENANT, "v2", 1, "Oguz Law pilot grubunu V2 deneyimine alma"]
    ));
    expect(changed.rows[0]).toMatchObject({ experience_version: "v2", revision: 2 });
    await asUser(ADMIN, async () => {
      await expect(db.query("select * from set_portal_experience($1,$2,$3,$4)", [TENANT, "v1", 1, "Eski revision"])).rejects.toThrow(/STALE_REVISION/);
    });
    await asUser(LEARNER, async () => {
      await expect(db.query("select * from set_portal_experience($1,$2,$3,$4)", [TENANT, "v1", 2, "Yetkisiz değişim"])).rejects.toThrow(/PORTAL_EXPERIENCE_FORBIDDEN/);
    });
  });

  it("creates an opaque 60-second ticket without leaking it to audit", async () => {
    const created = await asUser(ADMIN, () => db.query<{ id: string; ticket: string; expires_at: string }>(
      "select * from create_mobile_editor_session($1,$2,$3)",
      [TENANT, "goauthoring", "/avukat/oguzlawacademy/v2/admin/content"]
    ));
    const session = created.rows[0];
    expect(session.ticket).toMatch(/^[0-9a-f-]{36}$/);
    const stored = await db.query<{ ticket_hash: string; seconds: number }>(
      "select ticket_hash,extract(epoch from (expires_at-created_at))::int as seconds from private.mobile_editor_sessions where id=$1",
      [session.id]
    );
    expect(stored.rows[0].ticket_hash).not.toContain(session.ticket);
    expect(stored.rows[0].seconds).toBeLessThanOrEqual(60);
    const audit = await db.query<{ resource_id: string }>("select resource_id from audit_events where action='mobile.editor_session_created' order by id desc limit 1");
    expect(audit.rows[0].resource_id).toBe(session.id);
    expect(audit.rows[0].resource_id).not.toBe(session.ticket);
  });

  it("allows admin and instructor tickets, blocks learner, and consumes once", async () => {
    const instructorSession = await asUser(INSTRUCTOR, () => db.query<{ ticket: string }>(
      "select * from create_mobile_editor_session($1,$2,$3)",
      [TENANT, "report", "/avukat/oguzlawacademy/v2/instructor/reports"]
    ));
    const ticket = instructorSession.rows[0].ticket;
    const consumed = await asUser(INSTRUCTOR, () => db.query<{ tenant_id: string; editor: string }>(
      "select * from consume_mobile_editor_session($1)",
      [ticket]
    ));
    expect(consumed.rows[0]).toMatchObject({ tenant_id: TENANT, editor: "report" });
    await asUser(INSTRUCTOR, async () => {
      await expect(db.query("select * from consume_mobile_editor_session($1)", [ticket])).rejects.toThrow(/EDITOR_SESSION_INVALID_OR_EXPIRED/);
    });
    await asUser(LEARNER, async () => {
      await expect(db.query("select * from create_mobile_editor_session($1,$2,$3)", [TENANT, "goauthoring", "/safe"])).rejects.toThrow(/EDITOR_SESSION_FORBIDDEN/);
    });
  });

  it("rejects unsafe return paths and scopes experience preferences to the member", async () => {
    await asUser(ADMIN, async () => {
      await expect(db.query("select * from create_mobile_editor_session($1,$2,$3)", [TENANT, "certificate", "https://evil.example"])).rejects.toThrow(/EDITOR_SESSION_INVALID/);
    });
    await asUser(LEARNER, async () => {
      await db.query("insert into member_experience_preferences(tenant_id,membership_id,theme_mode,reduce_motion) values($1,$2,'dark',true)", [TENANT, LEARNER_MEMBER]);
      await expect(db.query("insert into member_experience_preferences(tenant_id,membership_id) values($1,$2)", [TENANT, ADMIN_MEMBER])).rejects.toThrow(/row-level security|permission denied/);
    });
  });
});
