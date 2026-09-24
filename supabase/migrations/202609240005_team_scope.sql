-- EP02: direct-team organization scope for line managers.
begin;

create table public.teams (
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null references public.tenants(id),
 code text not null check(code~'^[a-z][a-z0-9_-]{1,39}$'),
 name text not null check(length(name) between 2 and 160),manager_membership_id uuid not null,
 status text not null default 'active' check(status in ('active','archived')),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 created_by uuid references auth.users(id),revision integer not null default 1 check(revision>0),
 unique(tenant_id,id),unique(tenant_id,code),
 foreign key(tenant_id,manager_membership_id) references public.memberships(tenant_id,id)
);

create table public.team_members (
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null,
 team_id uuid not null,membership_id uuid not null,
 valid_from timestamptz not null default now(),valid_until timestamptz,
 created_at timestamptz not null default now(),created_by uuid references auth.users(id),
 unique(tenant_id,id),unique(team_id,membership_id),
 foreign key(tenant_id,team_id) references public.teams(tenant_id,id),
 foreign key(tenant_id,membership_id) references public.memberships(tenant_id,id),
 check(valid_until is null or valid_until>valid_from)
);
create index team_members_active on public.team_members(tenant_id,membership_id,team_id) where valid_until is null;

alter table public.teams enable row level security;
alter table public.team_members enable row level security;

create function private.is_direct_manager(target_tenant uuid,target_membership uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select private.is_active_member(target_tenant) and exists(
  select 1 from public.memberships manager
  join public.teams t on t.tenant_id=manager.tenant_id and t.manager_membership_id=manager.id and t.status='active'
  join public.team_members tm on tm.tenant_id=t.tenant_id and tm.team_id=t.id
  where manager.tenant_id=target_tenant and manager.user_id=(select auth.uid()) and manager.status='active'
   and tm.membership_id=target_membership and tm.valid_from<=now() and (tm.valid_until is null or tm.valid_until>now())
   and private.has_role(target_tenant,'line_manager'));
$$;
revoke all on function private.is_direct_manager(uuid,uuid) from public;
grant execute on function private.is_direct_manager(uuid,uuid) to authenticated;

create policy team_read on public.teams for select to authenticated using(
 private.has_role(tenant_id,'tenant_admin') or (
  private.is_active_member(tenant_id) and manager_membership_id in (
   select m.id from public.memberships m where m.tenant_id=teams.tenant_id and m.user_id=(select auth.uid()) and m.status='active')));
create policy team_member_read on public.team_members for select to authenticated using(
 private.has_role(tenant_id,'tenant_admin') or exists(
  select 1 from public.teams t join public.memberships m on m.tenant_id=t.tenant_id and m.id=t.manager_membership_id
  where t.tenant_id=team_members.tenant_id and t.id=team_members.team_id and t.status='active'
   and m.user_id=(select auth.uid()) and m.status='active' and private.has_role(t.tenant_id,'line_manager')));
revoke all on public.teams,public.team_members from anon,authenticated;
grant select on public.teams,public.team_members to authenticated;

-- Add direct-team membership visibility without widening the existing own/admin policy.
create policy membership_manager_read on public.memberships for select to authenticated using(
 private.is_direct_manager(tenant_id,id));

-- Replace the early coarse line_manager rules with direct-team scope.
drop policy enrollment_read on public.enrollments;
create policy enrollment_read on public.enrollments for select to authenticated using(
 private.is_active_member(tenant_id) and (
  membership_id in (select m.id from public.memberships m where m.tenant_id=enrollments.tenant_id and m.user_id=(select auth.uid()))
  or private.has_role(tenant_id,'tenant_admin') or private.has_role(tenant_id,'instructor')
  or private.is_direct_manager(tenant_id,membership_id)));

drop policy learning_assignment_read on public.learning_assignments;
create policy learning_assignment_read on public.learning_assignments for select to authenticated using(
 private.is_active_member(tenant_id) and (
  private.has_role(tenant_id,'tenant_admin') or private.has_role(tenant_id,'instructor')
  or exists(select 1 from public.enrollments e join public.memberships m on m.tenant_id=e.tenant_id and m.id=e.membership_id
    where e.assignment_id=learning_assignments.id and e.tenant_id=learning_assignments.tenant_id and m.user_id=(select auth.uid()))
  or exists(select 1 from public.enrollments e where e.assignment_id=learning_assignments.id
    and e.tenant_id=learning_assignments.tenant_id and private.is_direct_manager(e.tenant_id,e.membership_id))));

create function public.save_team(target_tenant uuid,target_team uuid,team_code text,team_name text,
 manager_membership uuid,member_memberships uuid[],expected_revision integer,reason text)
returns table(team_id uuid,revision integer,member_count integer)
language plpgsql security definer set search_path='' as $$
declare normalized_code text; normalized_name text; normalized_members uuid[]; team public.teams%rowtype; found_count integer;
begin
 if not private.has_role(target_tenant,'tenant_admin') then raise exception 'TEAM_MANAGE_FORBIDDEN' using errcode='42501'; end if;
 normalized_code:=lower(btrim(team_code)); normalized_name:=btrim(team_name);
 if normalized_code!~'^[a-z][a-z0-9_-]{1,39}$' or length(normalized_name) not between 2 and 160
  or length(coalesce(btrim(reason),''))<3 then raise exception 'TEAM_INPUT_INVALID' using errcode='22023'; end if;
 if member_memberships is null or cardinality(member_memberships)>500 or manager_membership=any(coalesce(member_memberships,'{}'::uuid[])) then
  raise exception 'TEAM_MEMBERS_INVALID' using errcode='22023'; end if;
 select coalesce(array_agg(distinct x order by x),'{}'::uuid[]) into normalized_members from unnest(member_memberships) x;
 select count(*) into found_count from public.memberships m where m.tenant_id=target_tenant and m.id=manager_membership and m.status='active'
  and exists(select 1 from public.role_assignments ra join public.roles r on r.id=ra.role_id and r.tenant_id=ra.tenant_id
   where ra.tenant_id=target_tenant and ra.membership_id=m.id and r.key='line_manager' and (ra.valid_until is null or ra.valid_until>now()));
 if found_count<>1 then raise exception 'TEAM_MANAGER_INVALID' using errcode='22023'; end if;
 select count(*) into found_count from public.memberships m where m.tenant_id=target_tenant and m.id=any(normalized_members) and m.status='active';
 if found_count<>cardinality(normalized_members) then raise exception 'TEAM_MEMBERS_INVALID' using errcode='22023'; end if;

 if target_team is null then
  if expected_revision<>0 then raise exception 'REVISION_CONFLICT' using errcode='40001'; end if;
  insert into public.teams(tenant_id,code,name,manager_membership_id,created_by)
   values(target_tenant,normalized_code,normalized_name,manager_membership,(select auth.uid())) returning * into team;
 else
  select * into team from public.teams t where t.tenant_id=target_tenant and t.id=target_team for update;
  if not found then raise exception 'TEAM_NOT_FOUND' using errcode='P0002'; end if;
  if team.revision<>expected_revision then raise exception 'REVISION_CONFLICT' using errcode='40001'; end if;
  update public.teams set code=normalized_code,name=normalized_name,manager_membership_id=manager_membership,
   updated_at=now(),revision=public.teams.revision+1 where id=target_team returning * into team;
 end if;
 delete from public.team_members where team_members.team_id=team.id;
 insert into public.team_members(tenant_id,team_id,membership_id,created_by)
  select target_tenant,team.id,x,(select auth.uid()) from unnest(normalized_members) x;
 insert into public.audit_events(tenant_id,actor_user_id,acting_role,action,resource_kind,resource_id,reason,redacted_diff)
 values(target_tenant,(select auth.uid()),'tenant_admin','team.saved','team',team.id,left(btrim(reason),2000),
  jsonb_build_object('code',normalized_code,'manager_membership_id',manager_membership,'member_count',cardinality(normalized_members)));
 return query select team.id,team.revision,cardinality(normalized_members);
end;
$$;

revoke all on function public.save_team(uuid,uuid,text,text,uuid,uuid[],integer,text) from public,anon;
grant execute on function public.save_team(uuid,uuid,text,text,uuid,uuid[],integer,text) to authenticated;

commit;
