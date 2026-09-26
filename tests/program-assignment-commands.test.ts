import { PGlite } from "@electric-sql/pglite";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";
import { readFileSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

let db: PGlite;
const TENANT = "21000000-0000-4000-8000-000000000001";
const OTHER = "21000000-0000-4000-8000-000000000002";
const ADMIN = "22000000-0000-4000-8000-000000000001";
const LEARNER = "22000000-0000-4000-8000-000000000002";
const OUTSIDER = "22000000-0000-4000-8000-000000000003";
const ADMIN_MEMBER = "23000000-0000-4000-8000-000000000001";
const LEARNER_MEMBER = "23000000-0000-4000-8000-000000000002";
let programId = "";
let programRevision = 0;
let enrollmentId = "";
let assessmentId = "";

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
    "supabase/migrations/202609240005_team_scope.sql",
    "supabase/migrations/202609260013_program_assignment_commands.sql",
    "supabase/migrations/202609260014_program_command_digest_fix.sql",
    "supabase/migrations/202609260015_program_compliance_controls.sql",
    "supabase/migrations/202609260016_assessment_engine.sql",
  ])
    await db.exec(readFileSync(file, "utf8"));
  await db.exec(`
    insert into auth.users values('${ADMIN}','admin@test.local'),('${LEARNER}','learner@test.local'),('${OUTSIDER}','outside@test.local');
    insert into industry_packs values('24000000-0000-4000-8000-000000000001','legal','Hukuk','published');
    insert into pack_versions(id,pack_id,version,published_at) values('25000000-0000-4000-8000-000000000001','24000000-0000-4000-8000-000000000001',1,now());
    insert into tenants(id,name,status,industry_pack_version_id) values('${TENANT}','Akademi','active','25000000-0000-4000-8000-000000000001'),('${OTHER}','Diğer','active','25000000-0000-4000-8000-000000000001');
    insert into memberships(id,tenant_id,user_id,status) values('${ADMIN_MEMBER}','${TENANT}','${ADMIN}','active'),('${LEARNER_MEMBER}','${TENANT}','${LEARNER}','active'),('23000000-0000-4000-8000-000000000003','${OTHER}','${OUTSIDER}','active');
    insert into roles(id,tenant_id,key,label) values('26000000-0000-4000-8000-000000000001','${TENANT}','tenant_admin','Yönetici'),('26000000-0000-4000-8000-000000000002','${TENANT}','learner','Öğrenen'),('26000000-0000-4000-8000-000000000003','${OTHER}','learner','Öğrenen');
    insert into role_assignments(tenant_id,membership_id,role_id) values('${TENANT}','${ADMIN_MEMBER}','26000000-0000-4000-8000-000000000001'),('${TENANT}','${LEARNER_MEMBER}','26000000-0000-4000-8000-000000000002'),('${OTHER}','23000000-0000-4000-8000-000000000003','26000000-0000-4000-8000-000000000003');
  `);
});

afterAll(async () => db.close());
async function asUser<T>(user: string, fn: () => Promise<T>) {
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [user]);
  await db.exec("set role authenticated");
  try {
    return await fn();
  } finally {
    await db.exec("reset role");
  }
}

describe("program, assignment and progress commands", () => {
  it("saves a mixed-content draft and publishes an immutable version", async () => {
    const definition = {
      items: [
        { id: "scorm", kind: "scorm", title: "SCORM 2004", required: true },
        { id: "exam", kind: "exam", title: "Kapanış sınavı", required: true },
        { id: "survey", kind: "survey", title: "Anket", required: false },
      ],
    };
    const draft = await asUser(ADMIN, () =>
      db.query<{ program_id: string; revision: number; version: number }>(
        "select * from save_program_draft($1,$2,$3,$4,$5,$6,$7)",
        [
          TENANT,
          null,
          "Dijital Uyum Programı",
          "Açıklama",
          "ordered",
          definition,
          0,
        ],
      ),
    );
    programId = draft.rows[0].program_id;
    programRevision = draft.rows[0].revision;
    expect(draft.rows[0].version).toBe(1);
    const published = await asUser(ADMIN, () =>
      db.query<{ revision: number; version: number }>(
        "select * from publish_program($1,$2,$3)",
        [TENANT, programId, programRevision],
      ),
    );
    programRevision = published.rows[0].revision;
    expect(published.rows[0].version).toBe(1);
    expect(
      (
        await db.query<{ state: string }>(
          "select state from program_versions where program_id=$1",
          [programId],
        )
      ).rows[0].state,
    ).toBe("published");
  });

  it("expands an everyone assignment into enrollments and is idempotent", async () => {
    const key = "27000000-0000-4000-8000-000000000001";
    const dueAt = "2030-10-31T20:59:59.000Z";
    const first = await asUser(ADMIN, () =>
      db.query<{ assignment_id: string; enrollment_count: number }>(
        "select * from assign_program($1,$2,$3,$4,$5,$6,$7,$8)",
        [TENANT, programId, "everyone", {}, true, dueAt, 80, key],
      ),
    );
    expect(first.rows[0].enrollment_count).toBe(2);
    const replay = await asUser(ADMIN, () =>
      db.query<{ assignment_id: string; enrollment_count: number }>(
        "select * from assign_program($1,$2,$3,$4,$5,$6,$7,$8)",
        [TENANT, programId, "everyone", {}, true, dueAt, 80, key],
      ),
    );
    expect(replay.rows[0].assignment_id).toBe(first.rows[0].assignment_id);
    enrollmentId = (
      await db.query<{ id: string }>(
        "select id from enrollments where assignment_id=$1 and membership_id=$2",
        [first.rows[0].assignment_id, LEARNER_MEMBER],
      )
    ).rows[0].id;

    const targeted = await asUser(ADMIN, () =>
      db.query<{ enrollment_count: number }>(
        "select * from assign_program($1,$2,$3,$4,$5,$6,$7,$8)",
        [
          TENANT,
          programId,
          "membership",
          { membership_ids: [LEARNER_MEMBER], label: "Başlangıç seviyesi" },
          true,
          "2030-11-30T20:59:59.000Z",
          80,
          "27000000-0000-4000-8000-000000000002",
        ],
      ),
    );
    expect(targeted.rows[0].enrollment_count).toBe(1);
  });

  it("records monotonic learner progress and completes the enrollment", async () => {
    const half = await asUser(LEARNER, () =>
      db.query<{ progress: number; revision: number }>(
        "select * from record_enrollment_progress($1,$2,$3,$4,$5,$6)",
        [TENANT, enrollmentId, ["scorm"], 2, null, 1],
      ),
    );
    expect(Number(half.rows[0].progress)).toBe(50);
    const done = await asUser(LEARNER, () =>
      db.query<{ state: string; progress: number; revision: number }>(
        "select * from record_enrollment_progress($1,$2,$3,$4,$5,$6)",
        [TENANT, enrollmentId, ["scorm", "exam"], 2, 88, half.rows[0].revision],
      ),
    );
    expect(done.rows[0].state).toBe("completed");
    expect(Number(done.rows[0].progress)).toBe(100);
    await asUser(LEARNER, async () => {
      await expect(
        db.query(
          "select * from record_enrollment_progress($1,$2,$3,$4,$5,$6)",
          [TENANT, enrollmentId, ["scorm"], 2, null, done.rows[0].revision],
        ),
      ).rejects.toThrow(/ENROLLMENT_PROGRESS_REGRESSION/);
    });
  });

  it("publishes an assessment and grades two attempts only on the server", async () => {
    const draft = await asUser(ADMIN, () =>
      db.query<{ assessment_id: string; revision: number }>(
        "select * from save_assessment_draft($1,$2,$3,$4,$5,$6,$7,$8,$9)",
        [
          TENANT,
          null,
          "Meslek Etiği Vaka Sınavı",
          "Her soruyu dikkatle yanıtlayın.",
          70,
          2,
          30,
          [
            { kind: "single_choice", prompt: "Çıkar çatışmasında ilk adım nedir?", options: [{ id: "check", label: "Çatışma kontrolü" }, { id: "continue", label: "İşe devam" }], correctAnswer: "check", points: 1, explanation: "Önce çatışma kontrolü yapılır." },
            { kind: "true_false", prompt: "Müvekkil verisi izinsiz paylaşılabilir.", options: [{ id: "true", label: "Doğru" }, { id: "false", label: "Yanlış" }], correctAnswer: "false", points: 1 },
          ],
          0,
        ],
      ),
    );
    assessmentId = draft.rows[0].assessment_id;
    await asUser(ADMIN, () =>
      db.query("select * from publish_assessment($1,$2,$3)", [TENANT, assessmentId, draft.rows[0].revision]),
    );

    const first = await asUser(LEARNER, () =>
      db.query<{ sitting_id: string; attempt_no: number; questions: Array<{ id: string; prompt: string }> }>(
        "select * from begin_assessment($1,$2,$3)",
        [TENANT, assessmentId, enrollmentId],
      ),
    );
    expect(first.rows[0].attempt_no).toBe(1);
    expect(first.rows[0].questions).toHaveLength(2);
    expect(JSON.stringify(first.rows[0].questions)).not.toContain("correctAnswer");
    const [q1, q2] = first.rows[0].questions;
    const failed = await asUser(LEARNER, () =>
      db.query<{ score: number; success: boolean; remaining_attempts: number }>(
        "select * from submit_assessment($1,$2,$3,$4)",
        [TENANT, first.rows[0].sitting_id, { [q1.id]: "continue", [q2.id]: "false" }, 1],
      ),
    );
    expect(Number(failed.rows[0].score)).toBe(50);
    expect(failed.rows[0]).toMatchObject({ success: false, remaining_attempts: 1 });

    const second = await asUser(LEARNER, () =>
      db.query<{ sitting_id: string; attempt_no: number; questions: Array<{ id: string }> }>(
        "select * from begin_assessment($1,$2,$3)",
        [TENANT, assessmentId, enrollmentId],
      ),
    );
    const [secondQ1, secondQ2] = second.rows[0].questions;
    const passed = await asUser(LEARNER, () =>
      db.query<{ score: number; success: boolean; remaining_attempts: number }>(
        "select * from submit_assessment($1,$2,$3,$4)",
        [TENANT, second.rows[0].sitting_id, { [secondQ1.id]: "check", [secondQ2.id]: "false" }, 1],
      ),
    );
    expect(Number(passed.rows[0].score)).toBe(100);
    expect(passed.rows[0]).toMatchObject({ success: true, remaining_attempts: 0 });
    await asUser(LEARNER, async () => {
      await expect(db.query("select * from begin_assessment($1,$2,$3)", [TENANT, assessmentId, enrollmentId])).rejects.toThrow(/ASSESSMENT_ATTEMPT_LIMIT/);
      await expect(db.query("select * from private.assessment_answer_keys")).rejects.toThrow(/permission denied/);
    });
  });

  it("creates a new rollback draft without mutating published history", async () => {
    const restored = await asUser(ADMIN, () =>
      db.query<{ revision: number; version: number; restored_from_version: number }>(
        "select * from rollback_program_version($1,$2,$3,$4,$5)",
        [TENANT, programId, 1, programRevision, "Önceki onaylı akışa dönüş"],
      ),
    );
    programRevision = restored.rows[0].revision;
    expect(restored.rows[0].restored_from_version).toBe(1);
    expect(restored.rows[0].version).toBe(2);
    const versions = await db.query<{ version: number; state: string }>(
      "select version,state from program_versions where program_id=$1 order by version",
      [programId],
    );
    expect(versions.rows).toEqual([
      { version: 1, state: "published" },
      { version: 2, state: "draft" },
    ]);
    await asUser(ADMIN, async () => {
      await expect(
        db.query("select * from rollback_program_version($1,$2,$3,$4,$5)", [
          TENANT,
          programId,
          1,
          programRevision - 1,
          "Eski revizyon denemesi",
        ]),
      ).rejects.toThrow(/REVISION_CONFLICT/);
    });
  });

  it("applies and revokes an auditable enrollment waiver", async () => {
    const adminEnrollment = (
      await db.query<{ id: string; revision: number }>(
        "select id,revision from enrollments where membership_id=$1",
        [ADMIN_MEMBER],
      )
    ).rows[0];
    const waived = await asUser(ADMIN, () =>
      db.query<{ state: string; revision: number }>(
        "select * from set_enrollment_waiver($1,$2,$3,$4,$5,$6)",
        [TENANT, adminEnrollment.id, true, adminEnrollment.revision, "İzinli dış sertifika eşdeğerliği", null],
      ),
    );
    expect(waived.rows[0].state).toBe("waived");
    const revoked = await asUser(ADMIN, () =>
      db.query<{ state: string; revision: number }>(
        "select * from set_enrollment_waiver($1,$2,$3,$4,$5,$6)",
        [TENANT, adminEnrollment.id, false, waived.rows[0].revision, "Eşdeğerlik kararı geri alındı", null],
      ),
    );
    expect(revoked.rows[0].state).toBe("assigned");
    const audit = await db.query<{ action: string }>(
      "select action from audit_events where resource_id=$1 order by occurred_at",
      [adminEnrollment.id],
    );
    expect(audit.rows.map((row) => row.action)).toEqual([
      "enrollment.waived",
      "enrollment.waiver_revoked",
    ]);
  });

  it("blocks outsiders and direct browser writes", async () => {
    await asUser(OUTSIDER, async () => {
      await expect(
        db.query("select * from save_program_draft($1,$2,$3,$4,$5,$6,$7)", [
          TENANT,
          null,
          "Yetkisiz program",
          "",
          "ordered",
          { items: [] },
          0,
        ]),
      ).rejects.toThrow(/PROGRAM_MANAGE_FORBIDDEN/);
      await expect(
        db.query(
          "select * from record_enrollment_progress($1,$2,$3,$4,$5,$6)",
          [TENANT, enrollmentId, ["x"], 1, null, 1],
        ),
      ).rejects.toThrow(/ENROLLMENT_PROGRESS_FORBIDDEN/);
      await expect(
        db.query("select * from set_enrollment_waiver($1,$2,$3,$4,$5,$6)", [
          TENANT,
          enrollmentId,
          true,
          1,
          "Yetkisiz muafiyet denemesi",
          null,
        ]),
      ).rejects.toThrow(/ENROLLMENT_WAIVER_FORBIDDEN/);
      await expect(
        db.query(
          "insert into programs(tenant_id,title,category) values($1,'x','x')",
          [TENANT],
        ),
      ).rejects.toThrow(/permission denied|column/);
    });
  });
});
