import { PGlite } from "@electric-sql/pglite";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";
import { readFileSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

let db: PGlite;
const A = "10000000-0000-0000-0000-000000000001";
const B = "10000000-0000-0000-0000-000000000002";
const ADMIN = "20000000-0000-0000-0000-000000000001";
const INVITEE = "20000000-0000-0000-0000-000000000002";
const ADMIN_MEMBERSHIP = "50000000-0000-0000-0000-000000000001";
const REQUEST = "90000000-0000-0000-0000-000000000001";
let invitationToken = "";
let inviteeMembership = "";

beforeAll(async () => {
  db = new PGlite({ extensions: { pgcrypto } });
  await db.exec(`create role anon;create role authenticated;create schema auth;
    create table auth.users(id uuid primary key,email text);
    create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
    grant usage on schema auth to authenticated;grant execute on function auth.uid() to authenticated;`);
  for (const file of [
    "supabase/migrations/202609210001_tenant_foundation.sql",
    "supabase/migrations/202609210002_learning_domain.sql",
    "supabase/migrations/202609240003_learning_runtime.sql",
    "supabase/migrations/202609240004_identity_commands.sql",
  ]) await db.exec(readFileSync(file, "utf8"));
  await db.exec(`
    insert into auth.users values('${ADMIN}','admin@academy.test'),('${INVITEE}','learner@academy.test');
    insert into industry_packs values('30000000-0000-0000-0000-000000000001','legal','Hukuk','published');
    insert into pack_versions(id,pack_id,version,published_at) values('40000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001',1,now());
    insert into tenants(id,name,status,industry_pack_version_id) values
      ('${A}','Akademi A','active','40000000-0000-0000-0000-000000000001'),
      ('${B}','Akademi B','active','40000000-0000-0000-0000-000000000001');
    insert into memberships(id,tenant_id,user_id,status) values('${ADMIN_MEMBERSHIP}','${A}','${ADMIN}','active');
    insert into roles(id,tenant_id,key,label) values
      ('60000000-0000-0000-0000-000000000001','${A}','tenant_admin','Yönetici'),
      ('60000000-0000-0000-0000-000000000002','${A}','learner','Öğrenen'),
      ('60000000-0000-0000-0000-000000000003','${A}','instructor','Eğitmen');
    insert into role_assignments(tenant_id,membership_id,role_id) values('${A}','${ADMIN_MEMBERSHIP}','60000000-0000-0000-0000-000000000001');
  `);
});

afterAll(async () => db.close());

async function asUser<T>(user: string, fn: () => Promise<T>) {
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [user]);
  await db.exec("set role authenticated");
  try { return await fn(); } finally { await db.exec("reset role"); }
}

describe("identity and organization commands", () => {
  it("creates an idempotent invitation and rejects a changed replay", async () => {
    const first = await asUser(ADMIN, async () => (
      await db.query<{ invitation_id: string }>("select * from invite_member($1,$2,$3,$4)", [A, " Learner@Academy.Test ", ["learner"], REQUEST])
    ).rows[0]);
    const replay = await asUser(ADMIN, async () => (
      await db.query<{ invitation_id: string }>("select * from invite_member($1,$2,$3,$4)", [A, "learner@academy.test", ["learner"], REQUEST])
    ).rows[0]);
    expect(replay.invitation_id).toBe(first.invitation_id);
    await asUser(ADMIN, async () => {
      await expect(db.query("select * from invite_member($1,$2,$3,$4)", [A, "other@academy.test", ["learner"], REQUEST])).rejects.toThrow(/IDEMPOTENCY_CONFLICT/);
    });
    const job = (await db.query<{ payload: { token: string } }>("select payload from private.jobs where kind='member_invitation'")).rows[0];
    invitationToken = job.payload.token;
    expect(invitationToken).toMatch(/^[0-9a-f-]{36}$/);
    expect((await db.query<{ token_hash: string }>("select token_hash from invitations")).rows[0].token_hash).not.toContain(invitationToken);
  });

  it("denies invitation management to a user outside the tenant", async () => {
    await asUser(INVITEE, async () => {
      await expect(db.query("select * from invite_member($1,$2,$3,$4)", [A, "x@academy.test", ["learner"], "90000000-0000-0000-0000-000000000002"])).rejects.toThrow(/MEMBER_MANAGE_FORBIDDEN/);
    });
  });

  it("accepts the invitation only for the authenticated matching email", async () => {
    await db.query("update auth.users set email='wrong@academy.test' where id=$1", [INVITEE]);
    await asUser(INVITEE, async () => {
      await expect(db.query("select * from accept_member_invitation($1)", [invitationToken])).rejects.toThrow(/INVITATION_INVALID/);
    });
    await db.query("update auth.users set email='learner@academy.test' where id=$1", [INVITEE]);
    const accepted = await asUser(INVITEE, async () => (
      await db.query<{ membership_id: string; membership_status: string }>("select * from accept_member_invitation($1)", [invitationToken])
    ).rows[0]);
    inviteeMembership = accepted.membership_id;
    expect(accepted.membership_status).toBe("active");
    await asUser(INVITEE, async () => {
      expect((await db.query<{ key: string }>("select r.key from roles r join role_assignments ra on ra.role_id=r.id where ra.membership_id=$1", [inviteeMembership])).rows.map(x => x.key)).toEqual(["learner"]);
    });
  });

  it("uses optimistic revision and blocks self role changes", async () => {
    await asUser(ADMIN, async () => {
      await expect(db.query("select * from replace_member_roles($1,$2,$3,$4,$5)", [A, ADMIN_MEMBERSHIP, ["learner"], 1, "Kendi rolünü değiştirme"])).rejects.toThrow(/SELF_ROLE_CHANGE_FORBIDDEN/);
      await expect(db.query("select * from replace_member_roles($1,$2,$3,$4,$5)", [A, inviteeMembership, ["instructor"], 99, "Rol değişikliği"])).rejects.toThrow(/REVISION_CONFLICT/);
      const changed = (await db.query<{ revision: number }>("select * from replace_member_roles($1,$2,$3,$4,$5)", [A, inviteeMembership, ["instructor"], 1, "Eğitmen görevi"])).rows[0];
      expect(changed.revision).toBe(2);
    });
  });

  it("suspends a member, revokes learning leases and records a redacted audit trail", async () => {
    await db.exec(`
      insert into courses(id,tenant_id,title,category,source_type,status) values('70000000-0000-0000-0000-000000000001','${A}','Kimlik Test Eğitimi','Uyum','native','published');
      insert into learning_assignments(id,tenant_id,course_id,title,audience_type,status) values('71000000-0000-0000-0000-000000000001','${A}','70000000-0000-0000-0000-000000000001','Test Ataması','membership','active');
      insert into enrollments(id,tenant_id,assignment_id,membership_id) values('72000000-0000-0000-0000-000000000001','${A}','71000000-0000-0000-0000-000000000001','${inviteeMembership}');
    `);
    const session = await asUser(INVITEE, async () => (
      await db.query<{ session_id: string }>("select * from begin_learning_session('72000000-0000-0000-0000-000000000001')")
    ).rows[0]);
    await asUser(ADMIN, async () => {
      const changed = (await db.query<{ membership_status: string; revision: number }>("select * from set_member_status($1,$2,$3,$4,$5)", [A, inviteeMembership, "suspended", 2, "Ekipten ayrılma süreci"])).rows[0];
      expect(changed).toMatchObject({ membership_status: "suspended", revision: 3 });
      const actions = (await db.query<{ action: string }>("select action from audit_events order by id")).rows.map(x => x.action);
      expect(actions).toEqual(["member.invited", "member.activated", "member.roles_replaced", "member.status_changed"]);
      expect(JSON.stringify((await db.query("select redacted_diff from audit_events")).rows)).not.toContain("learner@academy.test");
    });
    expect((await db.query<{ revoked_at: string | null }>("select revoked_at from learning_sessions where id=$1", [session.session_id])).rows[0].revoked_at).not.toBeNull();
  });

  it("blocks self suspension and all direct browser writes", async () => {
    await asUser(ADMIN, async () => {
      await expect(db.query("select * from set_member_status($1,$2,$3,$4,$5)", [A, ADMIN_MEMBERSHIP, "suspended", 1, "Kendi hesabı"])).rejects.toThrow(/SELF_STATUS_CHANGE_FORBIDDEN/);
      await expect(db.query("update memberships set status='suspended' where id=$1", [ADMIN_MEMBERSHIP])).rejects.toThrow(/permission denied/);
      await expect(db.query("insert into audit_events(tenant_id,acting_role,action,resource_kind) values($1,'fake','fake','fake')", [A])).rejects.toThrow(/permission denied/);
    });
  });
});
