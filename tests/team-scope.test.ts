import { PGlite } from "@electric-sql/pglite";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";
import { readFileSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

let db: PGlite;
const A="10000000-0000-0000-0000-000000000001", B="10000000-0000-0000-0000-000000000002";
const ADMIN="20000000-0000-0000-0000-000000000001", MANAGER="20000000-0000-0000-0000-000000000002";
const LEARNER="20000000-0000-0000-0000-000000000003", OTHER="20000000-0000-0000-0000-000000000004", FOREIGN="20000000-0000-0000-0000-000000000005";
const ADMIN_M="50000000-0000-0000-0000-000000000001", MANAGER_M="50000000-0000-0000-0000-000000000002";
const LEARNER_M="50000000-0000-0000-0000-000000000003", OTHER_M="50000000-0000-0000-0000-000000000004", FOREIGN_M="50000000-0000-0000-0000-000000000005";
let teamId="";

beforeAll(async()=>{
 db=new PGlite({extensions:{pgcrypto}});
 await db.exec(`create role anon;create role authenticated;create schema auth;create table auth.users(id uuid primary key,email text);
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 grant usage on schema auth to authenticated;grant execute on function auth.uid() to authenticated;`);
 for(const file of ["202609210001_tenant_foundation.sql","202609210002_learning_domain.sql","202609240003_learning_runtime.sql","202609240004_identity_commands.sql","202609240005_team_scope.sql"])
  await db.exec(readFileSync(`supabase/migrations/${file}`,"utf8"));
 await db.exec(`
 insert into auth.users values('${ADMIN}','a@test.dev'),('${MANAGER}','m@test.dev'),('${LEARNER}','l@test.dev'),('${OTHER}','o@test.dev'),('${FOREIGN}','f@test.dev');
 insert into industry_packs values('30000000-0000-0000-0000-000000000001','legal','Hukuk','published');
 insert into pack_versions(id,pack_id,version,published_at) values('40000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001',1,now());
 insert into tenants(id,name,status,industry_pack_version_id) values('${A}','A','active','40000000-0000-0000-0000-000000000001'),('${B}','B','active','40000000-0000-0000-0000-000000000001');
 insert into memberships(id,tenant_id,user_id,status) values('${ADMIN_M}','${A}','${ADMIN}','active'),('${MANAGER_M}','${A}','${MANAGER}','active'),('${LEARNER_M}','${A}','${LEARNER}','active'),('${OTHER_M}','${A}','${OTHER}','active'),('${FOREIGN_M}','${B}','${FOREIGN}','active');
 insert into roles(id,tenant_id,key,label) values('60000000-0000-0000-0000-000000000001','${A}','tenant_admin','Admin'),('60000000-0000-0000-0000-000000000002','${A}','line_manager','Yönetici'),('60000000-0000-0000-0000-000000000003','${A}','learner','Öğrenen');
 insert into role_assignments(tenant_id,membership_id,role_id) values('${A}','${ADMIN_M}','60000000-0000-0000-0000-000000000001'),('${A}','${MANAGER_M}','60000000-0000-0000-0000-000000000002');
 insert into courses(id,tenant_id,title,category,source_type,status) values('70000000-0000-0000-0000-000000000001','${A}','Eğitim','Uyum','native','published');
 insert into learning_assignments(id,tenant_id,course_id,title,audience_type,status) values('71000000-0000-0000-0000-000000000001','${A}','70000000-0000-0000-0000-000000000001','Atama','membership','active');
 insert into enrollments(id,tenant_id,assignment_id,membership_id) values('72000000-0000-0000-0000-000000000001','${A}','71000000-0000-0000-0000-000000000001','${LEARNER_M}'),('72000000-0000-0000-0000-000000000002','${A}','71000000-0000-0000-0000-000000000001','${OTHER_M}');`);
});
afterAll(async()=>db.close());
async function asUser<T>(user:string,fn:()=>Promise<T>){await db.query("select set_config('request.jwt.claim.sub',$1,false)",[user]);await db.exec("set role authenticated");try{return await fn();}finally{await db.exec("reset role");}}

describe("direct team scope",()=>{
 it("lets an admin create a revisioned team",async()=>{
  const result=await asUser(ADMIN,async()=>(await db.query<{team_id:string;revision:number;member_count:number}>("select * from save_team($1,$2,$3,$4,$5,$6,$7,$8)",[A,null,"litigation","Uyuşmazlık Çözümü",MANAGER_M,[LEARNER_M],0,"İlk ekip kurulumu"])).rows[0]);
  teamId=result.team_id;expect(result).toMatchObject({revision:1,member_count:1});
 });
 it("limits manager reads to direct current team members",async()=>{
  await asUser(MANAGER,async()=>{
   expect((await db.query<{id:string}>("select id from memberships order by id")).rows.map(x=>x.id)).toEqual([MANAGER_M,LEARNER_M]);
   expect((await db.query<{membership_id:string}>("select membership_id from enrollments")).rows.map(x=>x.membership_id)).toEqual([LEARNER_M]);
   expect((await db.query("select * from teams")).rows).toHaveLength(1);
   expect((await db.query("select * from learning_assignments")).rows).toHaveLength(1);
  });
 });
 it("does not let a manager mutate team scope",async()=>{
  await asUser(MANAGER,async()=>expect(db.query("select * from save_team($1,$2,$3,$4,$5,$6,$7,$8)",[A,teamId,"litigation","Değişiklik",MANAGER_M,[OTHER_M],1,"Yetkisiz değişiklik"])).rejects.toThrow(/TEAM_MANAGE_FORBIDDEN/));
 });
 it("rejects foreign tenant members and stale revisions",async()=>{
  await asUser(ADMIN,async()=>{
   await expect(db.query("select * from save_team($1,$2,$3,$4,$5,$6,$7,$8)",[A,teamId,"litigation","Ekip",MANAGER_M,[FOREIGN_M],1,"Tenant dışı üye"])).rejects.toThrow(/TEAM_MEMBERS_INVALID/);
   await expect(db.query("select * from save_team($1,$2,$3,$4,$5,$6,$7,$8)",[A,teamId,"litigation","Ekip",MANAGER_M,[OTHER_M],9,"Eski revision"])).rejects.toThrow(/REVISION_CONFLICT/);
  });
 });
 it("updates direct scope atomically",async()=>{
  await asUser(ADMIN,async()=>expect((await db.query<{revision:number}>("select * from save_team($1,$2,$3,$4,$5,$6,$7,$8)",[A,teamId,"litigation","Uyuşmazlık Ekibi",MANAGER_M,[OTHER_M],1,"Ekip rotasyonu"])).rows[0].revision).toBe(2));
  await asUser(MANAGER,async()=>{
   expect((await db.query<{id:string}>("select id from memberships order by id")).rows.map(x=>x.id)).toEqual([MANAGER_M,OTHER_M]);
   expect((await db.query<{membership_id:string}>("select membership_id from enrollments")).rows.map(x=>x.membership_id)).toEqual([OTHER_M]);
  });
 });
});
