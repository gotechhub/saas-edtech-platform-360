import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
let db: PGlite;
const A = "10000000-0000-0000-0000-000000000001",
  B = "10000000-0000-0000-0000-000000000002";
const U = "20000000-0000-0000-0000-000000000001",
  V = "20000000-0000-0000-0000-000000000002";
beforeAll(async () => {
  db = new PGlite();
  await db.exec(
    `create role anon;create role authenticated;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth to authenticated;grant execute on function auth.uid() to authenticated;`,
  );
  await db.exec(
    readFileSync(
      "supabase/migrations/202609210001_tenant_foundation.sql",
      "utf8",
    ),
  );
  await db.exec(
    readFileSync(
      "supabase/migrations/202609210002_learning_domain.sql",
      "utf8",
    ),
  );
  await db.exec(
    `insert into auth.users values('${U}'),('${V}');insert into industry_packs values('30000000-0000-0000-0000-000000000001','legal','Hukuk','published');insert into pack_versions(id,pack_id,version,published_at) values('40000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001',1,now());insert into tenants(id,name,status,industry_pack_version_id) values('${A}','Akademi A','active','40000000-0000-0000-0000-000000000001'),('${B}','Akademi B','active','40000000-0000-0000-0000-000000000001');insert into memberships(id,tenant_id,user_id,status) values('50000000-0000-0000-0000-000000000001','${A}','${U}','active'),('50000000-0000-0000-0000-000000000002','${B}','${V}','active');insert into roles(id,tenant_id,key,label) values('60000000-0000-0000-0000-000000000001','${B}','tenant_admin','Yönetici');`,
  );
});
afterAll(async () => {
  await db.close();
});
async function asUser<T>(user: string, fn: () => Promise<T>) {
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [user]);
  await db.exec("set role authenticated");
  try {
    return await fn();
  } finally {
    await db.exec("reset role");
  }
}
describe("RLS tenant foundation in real PostgreSQL WASM", () => {
  it("denies expired demo tenants and expired role assignments", async () => {
    await db.query(
      "update tenants set status='demo',demo_expires_at=now()-interval '1 day' where id=$1",
      [A],
    );
    await asUser(U, async () =>
      expect((await db.query("select * from tenants")).rows).toEqual([]),
    );
    await db.query(
      "update tenants set status='active',demo_expires_at=null where id=$1",
      [A],
    );
    await db.exec(
      `insert into role_assignments(tenant_id,membership_id,role_id,valid_until) values('${B}','50000000-0000-0000-0000-000000000002','60000000-0000-0000-0000-000000000001',now()-interval '1 day')`,
    );
    await asUser(V, async () =>
      expect(
        (
          await db.query<{ allowed: boolean }>(
            "select private.has_role($1,'tenant_admin') as allowed",
            [B],
          )
        ).rows[0].allowed,
      ).toBe(false),
    );
  });
  it("dead-letters exhausted jobs instead of letting them run forever", async () => {
    const job = (
      await db.query<{ id: string }>(
        "insert into private.jobs(tenant_id,kind,dedupe_key,state,attempts,max_attempts,lease_until) values($1,'test','exhausted','running',5,5,now()-interval '1 second') returning id",
        [A],
      )
    ).rows[0];
    await db.query("select * from private.claim_job()");
    expect(
      (
        await db.query<{ state: string }>(
          "select state from private.jobs where id=$1",
          [job.id],
        )
      ).rows[0].state,
    ).toBe("failed");
    await db.query("delete from private.jobs where id=$1", [job.id]);
  });
  it("exposes only the active tenant and own membership", async () => {
    await asUser(U, async () => {
      expect(
        (await db.query<{ id: string }>("select id from tenants")).rows.map(
          (x) => x.id,
        ),
      ).toEqual([A]);
      expect((await db.query("select * from memberships")).rows).toHaveLength(
        1,
      );
      expect((await db.query("select * from roles")).rows).toHaveLength(0);
    });
  });
  it("denies direct ID access to another tenant", async () => {
    await asUser(U, async () => {
      expect(
        (await db.query("select * from tenants where id=$1", [B])).rows,
      ).toEqual([]);
    });
  });
  it("keeps the learning catalog and learner queue tenant-bound", async () => {
    await db.exec(
      `insert into courses(id,tenant_id,title,category,source_type,status) values
       ('70000000-0000-0000-0000-000000000001','${A}','A Yayındaki Eğitim','Uyum','native','published'),
       ('70000000-0000-0000-0000-000000000002','${A}','A Taslak Eğitim','Uyum','native','draft'),
       ('70000000-0000-0000-0000-000000000003','${B}','B Yayındaki Eğitim','Uyum','native','published');
       insert into learning_assignments(id,tenant_id,course_id,title,audience_type,status) values
       ('71000000-0000-0000-0000-000000000001','${A}','70000000-0000-0000-0000-000000000001','A Ataması','membership','active');
       insert into enrollments(tenant_id,assignment_id,membership_id) values
       ('${A}','71000000-0000-0000-0000-000000000001','50000000-0000-0000-0000-000000000001');`,
    );
    await asUser(U, async () => {
      expect(
        (
          await db.query<{ title: string }>(
            "select title from courses order by title",
          )
        ).rows.map((row) => row.title),
      ).toEqual(["A Yayındaki Eğitim"]);
      expect((await db.query("select * from enrollments")).rows).toHaveLength(
        1,
      );
      expect(
        (await db.query("select * from learning_assignments")).rows,
      ).toHaveLength(1);
      await expect(
        db.query("update enrollments set progress=100"),
      ).rejects.toThrow(/permission denied/);
    });
  });
  it("denies self promotion even if a role is forged in the request", async () => {
    await asUser(U, async () => {
      await expect(
        db.query(
          "insert into roles(tenant_id,key,label) values($1,'tenant_admin','Owner')",
          [A],
        ),
      ).rejects.toThrow(/permission denied/);
      await expect(
        db.query("update memberships set status='active' where tenant_id=$1", [
          B,
        ]),
      ).rejects.toThrow(/permission denied/);
    });
  });
  it("enforces tenant-bound foreign keys even for privileged provisioning", async () => {
    await expect(
      db.exec(
        `insert into role_assignments(tenant_id,membership_id,role_id) values('${A}','50000000-0000-0000-0000-000000000001','60000000-0000-0000-0000-000000000001')`,
      ),
    ).rejects.toThrow(/foreign key/);
  });
  it("revokes access as soon as membership is suspended", async () => {
    await db.query(
      "update memberships set status='suspended' where user_id=$1",
      [U],
    );
    await asUser(U, async () =>
      expect((await db.query("select * from tenants")).rows).toEqual([]),
    );
    await db.query("update memberships set status='active' where user_id=$1", [
      U,
    ]);
  });
  it("revokes all access when the tenant is suspended", async () => {
    await db.query("update tenants set status='suspended' where id=$1", [A]);
    await asUser(U, async () =>
      expect((await db.query("select * from memberships")).rows).toEqual([]),
    );
    await db.query("update tenants set status='active' where id=$1", [A]);
  });
  it("denies anonymous data access", async () => {
    await db.exec("set role anon");
    try {
      await expect(db.query("select * from tenants")).rejects.toThrow(
        /permission denied/,
      );
    } finally {
      await db.exec("reset role");
    }
  });
  it("does not expose worker claims to authenticated clients", async () => {
    await asUser(U, async () => {
      await expect(
        db.query("select * from private.claim_job()"),
      ).rejects.toThrow(/permission denied/);
    });
  });
  it("deduplicates jobs and rejects stale worker completion after retry", async () => {
    await db.query(
      "insert into private.jobs(tenant_id,kind,dedupe_key) values($1,'demo','completion-1') on conflict do nothing",
      [A],
    );
    await db.query(
      "insert into private.jobs(tenant_id,kind,dedupe_key) values($1,'demo','completion-1') on conflict do nothing",
      [A],
    );
    expect((await db.query("select * from private.jobs")).rows).toHaveLength(1);
    const first = (
      await db.query<{ id: string; lease_token: string }>(
        "select * from private.claim_job()",
      )
    ).rows[0];
    expect(
      (await db.query("select * from private.claim_job()")).rows,
    ).toHaveLength(0);
    await db.query(
      "update private.jobs set lease_until=now()-interval '1 second' where id=$1",
      [first.id],
    );
    const retry = (
      await db.query<{ id: string; lease_token: string; attempts: number }>(
        "select * from private.claim_job()",
      )
    ).rows[0];
    expect(retry.attempts).toBe(2);
    expect(
      (
        await db.query<{ ok: boolean }>(
          "select private.complete_job($1,$2) as ok",
          [first.id, first.lease_token],
        )
      ).rows[0].ok,
    ).toBe(false);
    expect(
      (
        await db.query<{ ok: boolean }>(
          "select private.complete_job($1,$2) as ok",
          [retry.id, retry.lease_token],
        )
      ).rows[0].ok,
    ).toBe(true);
    expect(
      (
        await db.query<{ ok: boolean }>(
          "select private.complete_job($1,$2) as ok",
          [retry.id, retry.lease_token],
        )
      ).rows[0].ok,
    ).toBe(false);
  });
});
