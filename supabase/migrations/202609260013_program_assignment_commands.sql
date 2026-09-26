-- EP06: versioned program authoring, assignment expansion and learner progress commands.
begin;

alter table public.programs
  add column if not exists current_version integer not null default 1 check(current_version > 0);

alter table public.learning_assignments
  add column if not exists request_key uuid,
  add column if not exists request_hash text;
create unique index if not exists learning_assignment_request_key
  on public.learning_assignments(tenant_id,request_key) where request_key is not null;

alter table public.enrollments
  add column if not exists progress_detail jsonb not null default '{"completed_step_ids":[]}'::jsonb
  check(jsonb_typeof(progress_detail)='object');

create table public.program_versions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  program_id uuid not null,
  version integer not null check(version > 0),
  state text not null default 'draft' check(state in ('draft','published','archived')),
  definition jsonb not null default '{"items":[]}'::jsonb,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz,
  unique(tenant_id,id),
  unique(program_id,version),
  foreign key(tenant_id,program_id) references public.programs(tenant_id,id),
  check(jsonb_typeof(definition)='object'),
  check(jsonb_typeof(definition->'items')='array'),
  check((state='published' and published_at is not null) or state<>'published')
);
create index program_versions_tenant_program on public.program_versions(tenant_id,program_id,version desc);
create unique index program_one_published_version on public.program_versions(program_id) where state='published';

-- Preserve programs created before versioned authoring was introduced.
insert into public.program_versions(tenant_id,program_id,version,state,definition,created_by,published_at)
select p.tenant_id,p.id,p.current_version,
  case when p.status='published' then 'published' else 'draft' end,
  jsonb_build_object('items',coalesce((
    select jsonb_agg(jsonb_build_object(
      'id',pi.id,'kind','course','courseId',pi.course_id,'title',c.title,
      'required',pi.required,'position',pi.position,'sourceType',c.source_type
    ) order by pi.position)
    from public.program_items pi join public.courses c on c.tenant_id=pi.tenant_id and c.id=pi.course_id
    where pi.tenant_id=p.tenant_id and pi.program_id=p.id
  ),'[]'::jsonb)),
  p.created_by,case when p.status='published' then coalesce(p.updated_at,p.created_at) else null end
from public.programs p
on conflict(program_id,version) do nothing;

alter table public.program_versions enable row level security;
create policy program_version_read on public.program_versions for select to authenticated using(
  private.is_active_member(tenant_id) and (
    state='published' or private.has_role(tenant_id,'tenant_admin') or private.has_role(tenant_id,'instructor')
  )
);
revoke all on public.program_versions from anon,authenticated;
grant select on public.program_versions to authenticated;

create function public.save_program_draft(
  target_tenant uuid,
  target_program uuid,
  program_title text,
  program_description text,
  program_mode text,
  program_definition jsonb,
  expected_revision integer
)
returns table(program_id uuid,revision integer,version integer)
language plpgsql security definer set search_path='' as $$
declare p public.programs%rowtype; next_version integer; current_state text;
begin
  if not (private.has_role(target_tenant,'tenant_admin') or private.has_role(target_tenant,'instructor')) then
    raise exception 'PROGRAM_MANAGE_FORBIDDEN' using errcode='42501';
  end if;
  if program_title is null or length(btrim(program_title)) not between 2 and 180
    or program_mode not in ('ordered','flexible','conditional')
    or program_definition is null or jsonb_typeof(program_definition)<>'object'
    or jsonb_typeof(program_definition->'items')<>'array'
    or jsonb_array_length(program_definition->'items')>500 then
    raise exception 'PROGRAM_DRAFT_INVALID' using errcode='22023';
  end if;

  if target_program is null then
    insert into public.programs(tenant_id,title,description,mode,status,created_by,current_version)
    values(target_tenant,btrim(program_title),coalesce(program_description,''),program_mode,'draft',(select auth.uid()),1)
    returning * into p;
    next_version:=1;
  else
    select * into p from public.programs x where x.tenant_id=target_tenant and x.id=target_program for update;
    if p.id is null then raise exception 'PROGRAM_NOT_FOUND' using errcode='P0002'; end if;
    if p.revision<>expected_revision then raise exception 'REVISION_CONFLICT' using errcode='40001'; end if;
    select v.state into current_state from public.program_versions v
      where v.tenant_id=target_tenant and v.program_id=p.id and v.version=p.current_version;
    next_version:=case when current_state='published' then p.current_version+1 else p.current_version end;
    update public.programs set title=btrim(program_title),description=coalesce(program_description,''),mode=program_mode,
      current_version=next_version,updated_at=now(),revision=public.programs.revision+1
      where id=p.id returning * into p;
  end if;

  insert into public.program_versions(tenant_id,program_id,version,state,definition,created_by)
  values(target_tenant,p.id,next_version,'draft',program_definition,(select auth.uid()))
  on conflict on constraint program_versions_program_id_version_key
  do update set definition=excluded.definition,updated_at=now();

  insert into public.audit_events(tenant_id,actor_user_id,acting_role,action,resource_kind,resource_id,redacted_diff)
  values(target_tenant,(select auth.uid()),case when private.has_role(target_tenant,'tenant_admin') then 'tenant_admin' else 'instructor' end,
    'program.draft_saved','program',p.id,jsonb_build_object('version',next_version,'item_count',jsonb_array_length(program_definition->'items')));
  return query select p.id,p.revision,next_version;
end; $$;

create function public.publish_program(target_tenant uuid,target_program uuid,expected_revision integer)
returns table(program_id uuid,revision integer,version integer,published_at timestamptz)
language plpgsql security definer set search_path='' as $$
declare p public.programs%rowtype; v public.program_versions%rowtype;
begin
  if not (private.has_role(target_tenant,'tenant_admin') or private.has_role(target_tenant,'instructor')) then
    raise exception 'PROGRAM_MANAGE_FORBIDDEN' using errcode='42501';
  end if;
  select * into p from public.programs x where x.tenant_id=target_tenant and x.id=target_program for update;
  if p.id is null then raise exception 'PROGRAM_NOT_FOUND' using errcode='P0002'; end if;
  if p.revision<>expected_revision then raise exception 'REVISION_CONFLICT' using errcode='40001'; end if;
  select * into v from public.program_versions x where x.tenant_id=target_tenant and x.program_id=p.id and x.version=p.current_version for update;
  if v.id is null or v.state<>'draft' or jsonb_array_length(v.definition->'items')=0 then
    raise exception 'PROGRAM_NOT_READY' using errcode='22023';
  end if;
  update public.program_versions pv set state='archived' where pv.program_id=p.id and pv.state='published';
  update public.program_versions set state='published',published_at=now(),updated_at=now() where id=v.id returning * into v;
  update public.programs set status='published',updated_at=now(),revision=public.programs.revision+1 where id=p.id returning * into p;
  insert into public.audit_events(tenant_id,actor_user_id,acting_role,action,resource_kind,resource_id,redacted_diff)
  values(target_tenant,(select auth.uid()),case when private.has_role(target_tenant,'tenant_admin') then 'tenant_admin' else 'instructor' end,
    'program.published','program',p.id,jsonb_build_object('version',v.version));
  return query select p.id,p.revision,v.version,v.published_at;
end; $$;

create function public.assign_program(
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

create function public.record_enrollment_progress(
  target_tenant uuid,target_enrollment uuid,completed_step_ids text[],total_steps integer,
  result_score numeric,expected_revision integer
)
returns table(enrollment_id uuid,state text,progress numeric,revision integer)
language plpgsql security definer set search_path='' as $$
declare e public.enrollments%rowtype; actor_member uuid; normalized text[]; next_progress numeric;
begin
  select m.id into actor_member from public.memberships m where m.tenant_id=target_tenant and m.user_id=(select auth.uid()) and m.status='active';
  select * into e from public.enrollments x where x.tenant_id=target_tenant and x.id=target_enrollment for update;
  if e.id is null then raise exception 'ENROLLMENT_NOT_FOUND' using errcode='P0002'; end if;
  if actor_member is null or (e.membership_id<>actor_member and not (private.has_role(target_tenant,'tenant_admin') or private.has_role(target_tenant,'instructor'))) then
    raise exception 'ENROLLMENT_PROGRESS_FORBIDDEN' using errcode='42501';
  end if;
  if e.revision<>expected_revision then raise exception 'REVISION_CONFLICT' using errcode='40001'; end if;
  if total_steps not between 1 and 500 or completed_step_ids is null or exists(select 1 from unnest(completed_step_ids) x where x is null or length(btrim(x)) not between 1 and 200)
    or result_score is not null and result_score not between 0 and 100 then raise exception 'ENROLLMENT_PROGRESS_INVALID' using errcode='22023'; end if;
  select coalesce(array_agg(distinct btrim(x) order by btrim(x)),'{}') into normalized from unnest(completed_step_ids) x;
  if cardinality(normalized)>total_steps then raise exception 'ENROLLMENT_PROGRESS_INVALID' using errcode='22023'; end if;
  next_progress:=round(cardinality(normalized)::numeric*100/total_steps,2);
  if next_progress<e.progress then raise exception 'ENROLLMENT_PROGRESS_REGRESSION' using errcode='22023'; end if;
  update public.enrollments set progress=next_progress,score=coalesce(result_score,score),
    progress_detail=jsonb_build_object('completed_step_ids',to_jsonb(normalized),'total_steps',total_steps),
    state=case when next_progress=100 then 'completed' else 'in_progress' end,
    started_at=coalesce(started_at,now()),completed_at=case when next_progress=100 then coalesce(completed_at,now()) else null end,
    last_activity_at=now(),revision=public.enrollments.revision+1
  where id=e.id returning * into e;
  insert into public.audit_events(tenant_id,actor_user_id,acting_role,action,resource_kind,resource_id,redacted_diff)
  values(target_tenant,(select auth.uid()),case when e.membership_id=actor_member then 'learner' else 'learning_admin' end,
    case when e.state='completed' then 'enrollment.completed' else 'enrollment.progressed' end,'enrollment',e.id,
    jsonb_build_object('progress',e.progress,'completed_step_count',cardinality(normalized)));
  return query select e.id,e.state,e.progress,e.revision;
end; $$;

revoke all on function public.save_program_draft(uuid,uuid,text,text,text,jsonb,integer),
  public.publish_program(uuid,uuid,integer),
  public.assign_program(uuid,uuid,text,jsonb,boolean,timestamptz,numeric,uuid),
  public.record_enrollment_progress(uuid,uuid,text[],integer,numeric,integer) from public,anon;
grant execute on function public.save_program_draft(uuid,uuid,text,text,text,jsonb,integer),
  public.publish_program(uuid,uuid,integer),
  public.assign_program(uuid,uuid,text,jsonb,boolean,timestamptz,numeric,uuid),
  public.record_enrollment_progress(uuid,uuid,text[],integer,numeric,integer) to authenticated;

commit;
