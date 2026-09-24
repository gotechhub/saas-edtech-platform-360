import { PGlite } from "@electric-sql/pglite";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";
import { readFileSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

let db: PGlite;
const TENANT_A = "10000000-0000-0000-0000-000000000001";
const TENANT_B = "10000000-0000-0000-0000-000000000002";
const USER_A = "20000000-0000-0000-0000-000000000001";
const USER_B = "20000000-0000-0000-0000-000000000002";
const ENROLLMENT_A = "72000000-0000-0000-0000-000000000001";

beforeAll(async () => {
  db = new PGlite({ extensions: { pgcrypto } });
  await db.exec(
    `create role anon;create role authenticated;create schema auth;
     create table auth.users(id uuid primary key);
     create function auth.uid() returns uuid language sql stable as
      $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
     grant usage on schema auth to authenticated;
     grant execute on function auth.uid() to authenticated;`,
  );
  for (const migration of [
    "supabase/migrations/202609210001_tenant_foundation.sql",
    "supabase/migrations/202609210002_learning_domain.sql",
    "supabase/migrations/202609240003_learning_runtime.sql",
  ]) await db.exec(readFileSync(migration, "utf8"));
  await db.exec(`
    insert into auth.users values('${USER_A}'),('${USER_B}');
    insert into industry_packs values('30000000-0000-0000-0000-000000000001','legal','Hukuk','published');
    insert into pack_versions(id,pack_id,version,published_at) values('40000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001',1,now());
    insert into tenants(id,name,status,industry_pack_version_id) values
      ('${TENANT_A}','Akademi A','active','40000000-0000-0000-0000-000000000001'),
      ('${TENANT_B}','Akademi B','active','40000000-0000-0000-0000-000000000001');
    insert into memberships(id,tenant_id,user_id,status) values
      ('50000000-0000-0000-0000-000000000001','${TENANT_A}','${USER_A}','active'),
      ('50000000-0000-0000-0000-000000000002','${TENANT_B}','${USER_B}','active');
    insert into courses(id,tenant_id,title,category,source_type,status) values
      ('70000000-0000-0000-0000-000000000001','${TENANT_A}','A Eğitimi','Uyum','native','published'),
      ('70000000-0000-0000-0000-000000000002','${TENANT_B}','B Eğitimi','Uyum','native','published');
    insert into learning_assignments(id,tenant_id,course_id,title,audience_type,status) values
      ('71000000-0000-0000-0000-000000000001','${TENANT_A}','70000000-0000-0000-0000-000000000001','A Ataması','membership','active'),
      ('71000000-0000-0000-0000-000000000002','${TENANT_B}','70000000-0000-0000-0000-000000000002','B Ataması','membership','active');
    insert into enrollments(id,tenant_id,assignment_id,membership_id) values
      ('${ENROLLMENT_A}','${TENANT_A}','71000000-0000-0000-0000-000000000001','50000000-0000-0000-0000-000000000001'),
      ('72000000-0000-0000-0000-000000000002','${TENANT_B}','71000000-0000-0000-0000-000000000002','50000000-0000-0000-0000-000000000002');
  `);
});

afterAll(async () => db.close());

async function asUser<T>(user: string, fn: () => Promise<T>) {
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [user]);
  await db.exec("set role authenticated");
  try { return await fn(); } finally { await db.exec("reset role"); }
}

async function start(user = USER_A) {
  return asUser(user, async () => (
    await db.query<{ session_id: string; session_token: string; attempt_id: string }>(
      "select * from begin_learning_session($1)", [ENROLLMENT_A],
    )
  ).rows[0]);
}

const event = (id: string, sequence: number, type: string, payload: object) => ({
  event_id: id,
  sequence,
  type,
  occurred_at: new Date().toISOString(),
  payload,
});

describe("tenant-bound learning runtime", () => {
  it("opens one short-lived session and creates the first attempt", async () => {
    const session = await start();
    expect(session.session_token).toMatch(/^[0-9a-f-]{36}$/);
    await asUser(USER_A, async () => {
      expect((await db.query("select * from attempts")).rows).toHaveLength(1);
      const enrollment = (await db.query<{ state: string; attempt_count: number }>(
        "select state,attempt_count from enrollments where id=$1", [ENROLLMENT_A],
      )).rows[0];
      expect(enrollment).toMatchObject({ state: "in_progress", attempt_count: 1 });
      await expect(db.query(
        "insert into learning_events(tenant_id,event_id,session_id,attempt_id,event_type,sequence,occurred_at,payload,payload_hash) values($1,gen_random_uuid(),$2,$3,'content.started',1,now(),'{}','x')",
        [TENANT_A, session.session_id, session.attempt_id],
      )).rejects.toThrow(/permission denied/);
    });
  });

  it("persists ordered events, interaction details and a submitted attempt", async () => {
    const session = await start();
    const batch = [
      event("81000000-0000-0000-0000-000000000001", 1, "content.started", { object_key: "lesson-1" }),
      event("81000000-0000-0000-0000-000000000002", 2, "block.viewed", { block_id: "82000000-0000-0000-0000-000000000001", visible_seconds: 12 }),
      event("81000000-0000-0000-0000-000000000003", 3, "interaction.submitted", { block_id: "82000000-0000-0000-0000-000000000002", response: "b", elapsed_seconds: 9 }),
      event("81000000-0000-0000-0000-000000000004", 4, "content.completed", { object_key: "lesson-1" }),
    ];
    await asUser(USER_A, async () => {
      const ack = (await db.query<{ ack: { persisted_sequence: number; accepted_event_ids: string[] } }>(
        "select ingest_learning_events($1,$2::jsonb) as ack", [session.session_token, JSON.stringify(batch)],
      )).rows[0].ack;
      expect(ack.persisted_sequence).toBe(4);
      expect(ack.accepted_event_ids).toHaveLength(4);
      expect((await db.query("select * from learning_events")).rows).toHaveLength(4);
      expect((await db.query("select * from interaction_records")).rows).toHaveLength(1);
      expect((await db.query<{ measured_seconds: number }>("select measured_seconds from progress_snapshots")).rows[0].measured_seconds).toBe(12);
      expect((await db.query<{ state: string }>("select state from attempts where id=$1", [session.attempt_id])).rows[0].state).toBe("submitted");
    });
  });

  it("ACKs an identical retry without duplicating immutable events", async () => {
    const session = await start();
    const batch = [event("81000000-0000-0000-0000-000000000011", 1, "content.started", { object_key: "retry" })];
    await asUser(USER_A, async () => {
      for (let i = 0; i < 2; i++) {
        const ack = (await db.query<{ ack: { persisted_sequence: number } }>(
          "select ingest_learning_events($1,$2::jsonb) as ack", [session.session_token, JSON.stringify(batch)],
        )).rows[0].ack;
        expect(ack.persisted_sequence).toBe(1);
      }
      expect((await db.query("select * from learning_events where event_id='81000000-0000-0000-0000-000000000011'")).rows).toHaveLength(1);
    });
  });

  it("rejects reused IDs with changed bodies and out-of-order sequences", async () => {
    const session = await start();
    const first = event("81000000-0000-0000-0000-000000000021", 1, "content.started", { object_key: "original" });
    await asUser(USER_A, async () => {
      await db.query("select ingest_learning_events($1,$2::jsonb)", [session.session_token, JSON.stringify([first])]);
      await expect(db.query("select ingest_learning_events($1,$2::jsonb)", [
        session.session_token,
        JSON.stringify([{ ...first, payload: { object_key: "changed" } }]),
      ])).rejects.toThrow(/LEARNING_EVENT_CONFLICT/);
      await expect(db.query("select ingest_learning_events($1,$2::jsonb)", [
        session.session_token,
        JSON.stringify([event("81000000-0000-0000-0000-000000000022", 3, "content.started", { object_key: "gap" })]),
      ])).rejects.toThrow(/LEARNING_EVENT_SEQUENCE/);
    });
  });

  it("does not let another tenant use a leaked session token", async () => {
    const session = await start();
    await asUser(USER_B, async () => {
      await expect(db.query("select ingest_learning_events($1,$2::jsonb)", [
        session.session_token,
        JSON.stringify([event("81000000-0000-0000-0000-000000000031", 1, "content.started", { object_key: "stolen" })]),
      ])).rejects.toThrow(/LEARNING_SESSION_INVALID/);
      expect((await db.query("select * from learning_events")).rows).toHaveLength(0);
    });
  });

  it("revokes the previous write lease when a learner resumes", async () => {
    const oldSession = await start();
    const resumed = await start();
    expect(resumed.attempt_id).toBe(oldSession.attempt_id);
    expect(resumed.session_token).not.toBe(oldSession.session_token);
    await asUser(USER_A, async () => {
      const payload = JSON.stringify([event("81000000-0000-0000-0000-000000000041", 1, "content.started", { object_key: "resume" })]);
      await expect(db.query("select ingest_learning_events($1,$2::jsonb)", [oldSession.session_token, payload])).rejects.toThrow(/LEARNING_SESSION_INVALID/);
      await expect(db.query("select ingest_learning_events($1,$2::jsonb)", [resumed.session_token, payload])).resolves.toBeDefined();
    });
  });
});
