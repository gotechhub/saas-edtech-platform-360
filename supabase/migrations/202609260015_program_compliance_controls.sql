-- EP06: auditable program rollback drafts and enrollment waiver lifecycle.
begin;

alter table public.enrollments
  add column if not exists state_before_waiver text
    check(state_before_waiver is null or state_before_waiver in ('assigned','in_progress','failed','expired')),
  add column if not exists waived_at timestamptz,
  add column if not exists waived_by uuid references auth.users(id),
  add column if not exists waiver_reason text,
  add column if not exists waiver_expires_at timestamptz;

alter table public.enrollments
  add constraint enrollment_waiver_consistency check(
    (state='waived' and waived_at is not null and waived_by is not null and waiver_reason is not null and state_before_waiver is not null)
    or
    (state<>'waived' and waived_at is null and waived_by is null and waiver_reason is null and waiver_expires_at is null and state_before_waiver is null)
  ) not valid;
alter table public.enrollments validate constraint enrollment_waiver_consistency;

create function public.rollback_program_version(
  target_tenant uuid,
  target_program uuid,
  source_version integer,
  expected_revision integer,
  rollback_reason text
)
returns table(program_id uuid,revision integer,version integer,restored_from_version integer)
language plpgsql security definer set search_path='' as $$
declare p public.programs%rowtype; source public.program_versions%rowtype; next_version integer;
begin
  if not (private.has_role(target_tenant,'tenant_admin') or private.has_role(target_tenant,'instructor')) then
    raise exception 'PROGRAM_ROLLBACK_FORBIDDEN' using errcode='42501';
  end if;
  if source_version is null or source_version<1 or rollback_reason is null or length(btrim(rollback_reason)) not between 5 and 500 then
    raise exception 'PROGRAM_ROLLBACK_INVALID' using errcode='22023';
  end if;
  select * into p from public.programs x where x.tenant_id=target_tenant and x.id=target_program for update;
  if p.id is null then raise exception 'PROGRAM_NOT_FOUND' using errcode='P0002'; end if;
  if p.revision<>expected_revision then raise exception 'REVISION_CONFLICT' using errcode='40001'; end if;
  select * into source from public.program_versions x
    where x.tenant_id=target_tenant and x.program_id=p.id and x.version=source_version and x.state in ('published','archived');
  if source.id is null then raise exception 'PROGRAM_VERSION_NOT_RESTORABLE' using errcode='22023'; end if;
  select coalesce(max(v.version),0)+1 into next_version from public.program_versions v where v.program_id=p.id;
  insert into public.program_versions(tenant_id,program_id,version,state,definition,created_by)
  values(target_tenant,p.id,next_version,'draft',source.definition,(select auth.uid()));
  update public.programs set current_version=next_version,updated_at=now(),revision=public.programs.revision+1
    where id=p.id returning * into p;
  insert into public.audit_events(tenant_id,actor_user_id,acting_role,action,resource_kind,resource_id,redacted_diff)
  values(target_tenant,(select auth.uid()),case when private.has_role(target_tenant,'tenant_admin') then 'tenant_admin' else 'instructor' end,
    'program.rollback_draft_created','program',p.id,
    jsonb_build_object('source_version',source_version,'draft_version',next_version,'reason',btrim(rollback_reason)));
  return query select p.id,p.revision,next_version,source_version;
end; $$;

create function public.set_enrollment_waiver(
  target_tenant uuid,
  target_enrollment uuid,
  waive boolean,
  expected_revision integer,
  reason text,
  expires_at timestamptz default null
)
returns table(enrollment_id uuid,state text,revision integer,waiver_expires_at timestamptz)
language plpgsql security definer set search_path='' as $$
declare e public.enrollments%rowtype; restored_state text;
begin
  if not private.has_role(target_tenant,'tenant_admin') then
    raise exception 'ENROLLMENT_WAIVER_FORBIDDEN' using errcode='42501';
  end if;
  if reason is null or length(btrim(reason)) not between 5 and 500 or (expires_at is not null and expires_at<=now()) then
    raise exception 'ENROLLMENT_WAIVER_INVALID' using errcode='22023';
  end if;
  select * into e from public.enrollments x where x.tenant_id=target_tenant and x.id=target_enrollment for update;
  if e.id is null then raise exception 'ENROLLMENT_NOT_FOUND' using errcode='P0002'; end if;
  if e.revision<>expected_revision then raise exception 'REVISION_CONFLICT' using errcode='40001'; end if;
  if waive then
    if e.state in ('completed','waived') then raise exception 'ENROLLMENT_WAIVER_STATE_INVALID' using errcode='22023'; end if;
    update public.enrollments set
      state_before_waiver=e.state,state='waived',waived_at=now(),waived_by=(select auth.uid()),
      waiver_reason=btrim(reason),waiver_expires_at=expires_at,last_activity_at=now(),revision=public.enrollments.revision+1
      where id=e.id returning * into e;
  else
    if e.state<>'waived' then raise exception 'ENROLLMENT_WAIVER_STATE_INVALID' using errcode='22023'; end if;
    restored_state:=coalesce(e.state_before_waiver,'assigned');
    update public.enrollments set
      state=restored_state,state_before_waiver=null,waived_at=null,waived_by=null,waiver_reason=null,waiver_expires_at=null,
      last_activity_at=now(),revision=public.enrollments.revision+1
      where id=e.id returning * into e;
  end if;
  insert into public.audit_events(tenant_id,actor_user_id,acting_role,action,resource_kind,resource_id,redacted_diff)
  values(target_tenant,(select auth.uid()),'tenant_admin',case when waive then 'enrollment.waived' else 'enrollment.waiver_revoked' end,
    'enrollment',e.id,jsonb_build_object('reason',btrim(reason),'expires_at',expires_at,'state',e.state));
  return query select e.id,e.state,e.revision,e.waiver_expires_at;
end; $$;

revoke all on function public.rollback_program_version(uuid,uuid,integer,integer,text),
  public.set_enrollment_waiver(uuid,uuid,boolean,integer,text,timestamptz) from public,anon;
grant execute on function public.rollback_program_version(uuid,uuid,integer,integer,text),
  public.set_enrollment_waiver(uuid,uuid,boolean,integer,text,timestamptz) to authenticated;

commit;
