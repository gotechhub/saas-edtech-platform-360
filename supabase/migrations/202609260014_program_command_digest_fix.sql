-- Hosted Supabase installs pgcrypto outside public. Assignment fingerprints are
-- non-secret idempotency material, so use PostgreSQL's built-in deterministic hash.
begin;

create or replace function public.assign_program(
  target_tenant uuid,target_program uuid,audience_type text,audience_rule jsonb,
  assignment_required boolean,due_at timestamptz,pass_score numeric,idempotency_key uuid
)
returns table(assignment_id uuid,enrollment_count integer,revision integer)
language plpgsql security definer set search_path='' as $$
declare p public.programs%rowtype; a public.learning_assignments%rowtype; fingerprint text; affected integer;
begin
  if not private.has_role(target_tenant,'tenant_admin') then raise exception 'PROGRAM_ASSIGN_FORBIDDEN' using errcode='42501'; end if;
  if audience_type not in ('everyone','team','role','membership') or audience_rule is null or jsonb_typeof(audience_rule)<>'object'
    or due_at is null or due_at<=now() or pass_score not between 0 and 100 or idempotency_key is null then
    raise exception 'PROGRAM_ASSIGNMENT_INVALID' using errcode='22023';
  end if;
  select * into p from public.programs x where x.tenant_id=target_tenant and x.id=target_program and x.status='published';
  if p.id is null then raise exception 'PROGRAM_NOT_PUBLISHED' using errcode='22023'; end if;
  fingerprint:=md5(target_program::text||'|'||audience_type||'|'||audience_rule::text||'|'||due_at::text||'|'||assignment_required::text||'|'||pass_score::text);
  select * into a from public.learning_assignments x where x.tenant_id=target_tenant and x.request_key=idempotency_key;
  if a.id is not null then
    if a.request_hash<>fingerprint then raise exception 'IDEMPOTENCY_CONFLICT' using errcode='23505'; end if;
    select count(*)::integer into affected from public.enrollments e where e.tenant_id=target_tenant and e.assignment_id=a.id;
    return query select a.id,affected,a.revision; return;
  end if;
  insert into public.learning_assignments(tenant_id,program_id,title,audience_type,audience_rule,required,due_at,pass_score,status,starts_at,created_by,request_key,request_hash)
  values(target_tenant,p.id,p.title,audience_type,audience_rule,assignment_required,due_at,pass_score,'active',now(),(select auth.uid()),idempotency_key,fingerprint)
  returning * into a;
  insert into public.enrollments(tenant_id,assignment_id,membership_id)
  select target_tenant,a.id,m.id from public.memberships m
  where m.tenant_id=target_tenant and m.status='active' and (
    audience_type='everyone'
    or (audience_type='role' and exists(select 1 from public.role_assignments ra join public.roles r on r.id=ra.role_id and r.tenant_id=ra.tenant_id where ra.tenant_id=target_tenant and ra.membership_id=m.id and r.key=audience_rule->>'role'))
    or (audience_type='team' and exists(select 1 from public.team_members tm join public.teams t on t.id=tm.team_id and t.tenant_id=tm.tenant_id where tm.tenant_id=target_tenant and tm.membership_id=m.id and t.code=audience_rule->>'team'))
    or (audience_type='membership' and m.id in (select value::uuid from jsonb_array_elements_text(coalesce(audience_rule->'membership_ids','[]'::jsonb))))
  ) on conflict on constraint enrollments_assignment_id_membership_id_key do nothing;
  get diagnostics affected=row_count;
  if affected=0 then raise exception 'PROGRAM_AUDIENCE_EMPTY' using errcode='22023'; end if;
  insert into public.audit_events(tenant_id,actor_user_id,acting_role,action,resource_kind,resource_id,redacted_diff)
  values(target_tenant,(select auth.uid()),'tenant_admin','program.assigned','learning_assignment',a.id,
    jsonb_build_object('program_id',p.id,'audience_type',audience_type,'enrollment_count',affected,'required',assignment_required));
  return query select a.id,affected,a.revision;
end; $$;

revoke all on function public.assign_program(uuid,uuid,text,jsonb,boolean,timestamptz,numeric,uuid) from public,anon;
grant execute on function public.assign_program(uuid,uuid,text,jsonb,boolean,timestamptz,numeric,uuid) to authenticated;

commit;
