-- EP02: invitation lifecycle and narrow membership/role commands.
-- Requires the pgcrypto extension installed by 202609240003_learning_runtime.sql.
begin;

create table public.invitations (
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null references public.tenants(id),
 email_normalized text not null check(email_normalized=lower(btrim(email_normalized)) and length(email_normalized) between 5 and 254),
 token_hash text not null unique,expires_at timestamptz not null,
 status text not null default 'pending' check(status in ('pending','accepted','revoked','expired')),
 invited_role_keys text[] not null check(cardinality(invited_role_keys) between 1 and 5),
 invited_group_ids uuid[] not null default '{}',
 request_key uuid not null,request_hash text not null,
 accepted_at timestamptz,accepted_by uuid references auth.users(id),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 invited_by uuid not null references auth.users(id),revision integer not null default 1 check(revision>0),
 unique(tenant_id,id),unique(tenant_id,request_key)
);
create unique index one_pending_invitation_per_email
 on public.invitations(tenant_id,email_normalized) where status='pending';
create index invitations_expiry on public.invitations(status,expires_at);

create table public.audit_events (
 id bigint generated always as identity primary key,tenant_id uuid not null references public.tenants(id),
 actor_user_id uuid references auth.users(id),acting_role text not null,
 action text not null,resource_kind text not null,resource_id uuid,
 reason text,trace_id uuid not null default gen_random_uuid(),redacted_diff jsonb not null default '{}',
 occurred_at timestamptz not null default now(),
 check(jsonb_typeof(redacted_diff)='object')
);
create index audit_events_tenant_time on public.audit_events(tenant_id,occurred_at desc,id desc);

alter table public.invitations enable row level security;
alter table public.audit_events enable row level security;
create policy invitation_admin_read on public.invitations for select to authenticated using(
 private.has_role(tenant_id,'tenant_admin'));
create policy audit_admin_read on public.audit_events for select to authenticated using(
 private.has_role(tenant_id,'tenant_admin'));
revoke all on public.invitations,public.audit_events from anon,authenticated;
grant select on public.invitations,public.audit_events to authenticated;

create function private.normalized_role_keys(target_tenant uuid,requested text[]) returns text[]
language plpgsql stable security definer set search_path='' as $$
declare result text[];
begin
 if requested is null or cardinality(requested) not between 1 and 5 or exists(
  select 1 from unnest(requested) k where k is null or k!~'^[a-z][a-z0-9_]{1,49}$' or k='platform_admin'
 ) then raise exception 'ROLE_SET_INVALID' using errcode='22023'; end if;
 select array_agg(distinct k order by k) into result from unnest(requested) k;
 if (select count(*) from public.roles r where r.tenant_id=target_tenant and r.key=any(result))<>cardinality(result) then
  raise exception 'ROLE_SET_INVALID' using errcode='22023';
 end if;
 return result;
end;
$$;

create function public.invite_member(target_tenant uuid,email text,role_keys text[],idempotency_key uuid)
returns table(invitation_id uuid,invitation_status text,invitation_expires_at timestamptz)
language plpgsql security definer set search_path='' as $$
declare normalized_email text; normalized_roles text[]; token uuid; fingerprint text; existing public.invitations%rowtype; created public.invitations%rowtype;
begin
 if not private.has_role(target_tenant,'tenant_admin') then raise exception 'MEMBER_MANAGE_FORBIDDEN' using errcode='42501'; end if;
 normalized_email:=lower(btrim(email));
 if normalized_email!~'^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' or length(normalized_email)>254 then
  raise exception 'INVITATION_EMAIL_INVALID' using errcode='22023';
 end if;
 normalized_roles:=private.normalized_role_keys(target_tenant,role_keys);
 fingerprint:=encode(public.digest(convert_to(normalized_email||'|'||array_to_string(normalized_roles,','),'UTF8'),'sha256'),'hex');
 select * into existing from public.invitations i where i.tenant_id=target_tenant and i.request_key=idempotency_key;
 if found then
  if existing.request_hash<>fingerprint then raise exception 'IDEMPOTENCY_CONFLICT' using errcode='23505'; end if;
  return query select existing.id,existing.status,existing.expires_at; return;
 end if;
 update public.invitations set status='revoked',updated_at=now(),revision=revision+1
  where tenant_id=target_tenant and email_normalized=normalized_email and status='pending';
 token:=gen_random_uuid();
 insert into public.invitations(tenant_id,email_normalized,token_hash,expires_at,invited_role_keys,request_key,request_hash,invited_by)
 values(target_tenant,normalized_email,encode(public.digest(convert_to(token::text,'UTF8'),'sha256'),'hex'),now()+interval '48 hours',normalized_roles,idempotency_key,fingerprint,(select auth.uid()))
 returning * into created;
 insert into private.jobs(tenant_id,kind,dedupe_key,payload)
 values(target_tenant,'member_invitation',created.id::text,jsonb_build_object('invitation_id',created.id,'email',normalized_email,'token',token));
 insert into public.audit_events(tenant_id,actor_user_id,acting_role,action,resource_kind,resource_id,redacted_diff)
 values(target_tenant,(select auth.uid()),'tenant_admin','member.invited','invitation',created.id,
  jsonb_build_object('role_keys',normalized_roles,'email_domain',split_part(normalized_email,'@',2)));
 return query select created.id,created.status,created.expires_at;
end;
$$;

create function public.accept_member_invitation(invitation_token uuid)
returns table(membership_id uuid,tenant_id uuid,membership_status text,revision integer)
language plpgsql security definer set search_path='' as $$
declare invitation public.invitations%rowtype; current_email text; member public.memberships%rowtype;
begin
 select lower(btrim(u.email)) into current_email from auth.users u where u.id=(select auth.uid());
 if current_email is null then raise exception 'AUTH_EMAIL_REQUIRED' using errcode='28000'; end if;
 select * into invitation from public.invitations i
  where i.token_hash=encode(public.digest(convert_to(invitation_token::text,'UTF8'),'sha256'),'hex') for update;
 if not found or invitation.status<>'pending' or invitation.expires_at<=now() then
  raise exception 'INVITATION_INVALID' using errcode='28000';
 end if;
 if invitation.email_normalized<>current_email then raise exception 'INVITATION_INVALID' using errcode='28000'; end if;
 select * into member from public.memberships m where m.tenant_id=invitation.tenant_id and m.user_id=(select auth.uid()) for update;
 if found and member.status in ('suspended','left') then raise exception 'MEMBERSHIP_REVIEW_REQUIRED' using errcode='55000'; end if;
 if not found then
  insert into public.memberships(tenant_id,user_id,status,joined_at,created_by)
   values(invitation.tenant_id,(select auth.uid()),'active',now(),invitation.invited_by) returning * into member;
 elsif member.status<>'active' then
  update public.memberships set status='active',joined_at=coalesce(public.memberships.joined_at,now()),updated_at=now(),revision=public.memberships.revision+1
   where id=member.id returning * into member;
 end if;
 insert into public.role_assignments(tenant_id,membership_id,role_id,created_by)
  select invitation.tenant_id,member.id,r.id,invitation.invited_by from public.roles r
  where r.tenant_id=invitation.tenant_id and r.key=any(invitation.invited_role_keys)
 on conflict do nothing;
 update public.invitations set status='accepted',accepted_at=now(),accepted_by=(select auth.uid()),updated_at=now(),revision=public.invitations.revision+1
  where id=invitation.id;
 insert into public.audit_events(tenant_id,actor_user_id,acting_role,action,resource_kind,resource_id,redacted_diff)
 values(invitation.tenant_id,(select auth.uid()),'invitee','member.activated','membership',member.id,
  jsonb_build_object('invitation_id',invitation.id,'role_keys',invitation.invited_role_keys));
 return query select member.id,member.tenant_id,member.status,member.revision;
end;
$$;

create function public.replace_member_roles(target_tenant uuid,target_membership uuid,role_keys text[],expected_revision integer,reason text)
returns table(membership_id uuid,revision integer)
language plpgsql security definer set search_path='' as $$
declare member public.memberships%rowtype; actor_member uuid; normalized_roles text[]; removes_admin boolean;
begin
 if not private.has_role(target_tenant,'tenant_admin') then raise exception 'MEMBER_MANAGE_FORBIDDEN' using errcode='42501'; end if;
 select m.id into actor_member from public.memberships m where m.tenant_id=target_tenant and m.user_id=(select auth.uid()) and m.status='active';
 if actor_member=target_membership then raise exception 'SELF_ROLE_CHANGE_FORBIDDEN' using errcode='42501'; end if;
 select * into member from public.memberships m where m.tenant_id=target_tenant and m.id=target_membership for update;
 if not found then raise exception 'MEMBER_NOT_FOUND' using errcode='P0002'; end if;
 if member.revision<>expected_revision then raise exception 'REVISION_CONFLICT' using errcode='40001'; end if;
 normalized_roles:=private.normalized_role_keys(target_tenant,role_keys);
 select exists(select 1 from public.role_assignments ra join public.roles r on r.id=ra.role_id and r.tenant_id=ra.tenant_id
  where ra.tenant_id=target_tenant and ra.membership_id=target_membership and r.key='tenant_admin')
  and not ('tenant_admin'=any(normalized_roles)) into removes_admin;
 if removes_admin and (select count(*) from public.role_assignments ra join public.roles r on r.id=ra.role_id and r.tenant_id=ra.tenant_id
  join public.memberships m on m.id=ra.membership_id and m.tenant_id=ra.tenant_id
  where ra.tenant_id=target_tenant and r.key='tenant_admin' and m.status='active')<=1 then
  raise exception 'LAST_ADMIN_PROTECTED' using errcode='55000';
 end if;
 delete from public.role_assignments where tenant_id=target_tenant and role_assignments.membership_id=target_membership;
 insert into public.role_assignments(tenant_id,membership_id,role_id,created_by)
  select target_tenant,target_membership,r.id,(select auth.uid()) from public.roles r
  where r.tenant_id=target_tenant and r.key=any(normalized_roles);
 update public.memberships set updated_at=now(),revision=memberships.revision+1 where id=target_membership returning * into member;
 insert into private.jobs(tenant_id,kind,dedupe_key,payload) values(target_tenant,'auth_session_refresh',member.id::text||':'||member.revision,jsonb_build_object('user_id',member.user_id));
 insert into public.audit_events(tenant_id,actor_user_id,acting_role,action,resource_kind,resource_id,reason,redacted_diff)
 values(target_tenant,(select auth.uid()),'tenant_admin','member.roles_replaced','membership',member.id,left(nullif(btrim(reason),''),2000),jsonb_build_object('role_keys',normalized_roles));
 return query select member.id,member.revision;
end;
$$;

create function public.set_member_status(target_tenant uuid,target_membership uuid,new_status text,expected_revision integer,reason text)
returns table(membership_id uuid,membership_status text,revision integer)
language plpgsql security definer set search_path='' as $$
declare member public.memberships%rowtype; actor_member uuid; is_admin boolean;
begin
 if not private.has_role(target_tenant,'tenant_admin') then raise exception 'MEMBER_MANAGE_FORBIDDEN' using errcode='42501'; end if;
 if new_status not in ('active','suspended','left') or length(coalesce(btrim(reason),''))<3 then
  raise exception 'MEMBER_STATUS_INVALID' using errcode='22023'; end if;
 select m.id into actor_member from public.memberships m where m.tenant_id=target_tenant and m.user_id=(select auth.uid()) and m.status='active';
 if actor_member=target_membership then raise exception 'SELF_STATUS_CHANGE_FORBIDDEN' using errcode='42501'; end if;
 select * into member from public.memberships m where m.tenant_id=target_tenant and m.id=target_membership for update;
 if not found then raise exception 'MEMBER_NOT_FOUND' using errcode='P0002'; end if;
 if member.revision<>expected_revision then raise exception 'REVISION_CONFLICT' using errcode='40001'; end if;
 select exists(select 1 from public.role_assignments ra join public.roles r on r.id=ra.role_id and r.tenant_id=ra.tenant_id
  where ra.tenant_id=target_tenant and ra.membership_id=target_membership and r.key='tenant_admin') into is_admin;
 if new_status<>'active' and is_admin and (select count(*) from public.role_assignments ra join public.roles r on r.id=ra.role_id and r.tenant_id=ra.tenant_id
  join public.memberships m on m.id=ra.membership_id and m.tenant_id=ra.tenant_id
  where ra.tenant_id=target_tenant and r.key='tenant_admin' and m.status='active')<=1 then
  raise exception 'LAST_ADMIN_PROTECTED' using errcode='55000';
 end if;
 update public.memberships set status=new_status,updated_at=now(),left_at=case when new_status='left' then now() else null end,
  revision=memberships.revision+1 where id=target_membership returning * into member;
 if new_status<>'active' then
  update public.learning_sessions s set revoked_at=coalesce(s.revoked_at,now()) from public.attempts a,public.enrollments e
   where s.attempt_id=a.id and a.enrollment_id=e.id and e.membership_id=target_membership and s.revoked_at is null;
 end if;
 insert into private.jobs(tenant_id,kind,dedupe_key,payload) values(target_tenant,'auth_session_revoke',member.id::text||':'||member.revision,jsonb_build_object('user_id',member.user_id));
 insert into public.audit_events(tenant_id,actor_user_id,acting_role,action,resource_kind,resource_id,reason,redacted_diff)
 values(target_tenant,(select auth.uid()),'tenant_admin','member.status_changed','membership',member.id,left(btrim(reason),2000),jsonb_build_object('status',new_status));
 return query select member.id,member.status,member.revision;
end;
$$;

revoke all on function private.normalized_role_keys(uuid,text[]) from public;
revoke all on function public.invite_member(uuid,text,text[],uuid),public.accept_member_invitation(uuid),
 public.replace_member_roles(uuid,uuid,text[],integer,text),public.set_member_status(uuid,uuid,text,integer,text) from public,anon;
grant execute on function public.invite_member(uuid,text,text[],uuid),public.accept_member_invitation(uuid),
 public.replace_member_roles(uuid,uuid,text[],integer,text),public.set_member_status(uuid,uuid,text,integer,text) to authenticated;

commit;
