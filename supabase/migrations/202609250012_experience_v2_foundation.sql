-- UXV2 tenant experience, versioned theme assets and scoped mobile editor sessions.
begin;

alter table public.portals
  add column if not exists experience_version text not null default 'v1'
  check (experience_version in ('v1','v2'));

create table public.portal_theme_versions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  portal_id uuid not null,
  version integer not null check(version > 0),
  state text not null check(state in ('draft','published','retired')),
  name text not null check(length(name) between 2 and 120),
  mode text not null default 'system' check(mode in ('system','light','dark')),
  tokens jsonb not null default '{}',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  published_at timestamptz,
  unique(portal_id,version),
  unique(tenant_id,id),
  foreign key(tenant_id,portal_id) references public.portals(tenant_id,id),
  check(jsonb_typeof(tokens)='object'),
  check((state='published' and published_at is not null) or state<>'published')
);
create unique index portal_theme_one_published on public.portal_theme_versions(portal_id) where state='published';

create table public.portal_asset_bindings (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  portal_id uuid not null,
  theme_version_id uuid not null,
  slot text not null check(slot in ('logo_light','logo_dark','favicon','login_hero','dashboard_hero','email_logo','certificate_logo')),
  asset_path text not null check(length(asset_path) between 3 and 500 and asset_path !~ '[\r\n]'),
  alt_text text not null default '' check(length(alt_text)<=300),
  focal_x numeric(5,4) not null default .5 check(focal_x between 0 and 1),
  focal_y numeric(5,4) not null default .5 check(focal_y between 0 and 1),
  created_at timestamptz not null default now(),
  unique(theme_version_id,slot),
  unique(tenant_id,id),
  foreign key(tenant_id,portal_id) references public.portals(tenant_id,id),
  foreign key(tenant_id,theme_version_id) references public.portal_theme_versions(tenant_id,id)
);

create table public.member_experience_preferences (
  tenant_id uuid not null,
  membership_id uuid not null,
  theme_mode text not null default 'system' check(theme_mode in ('system','light','dark')),
  density text not null default 'comfortable' check(density in ('comfortable','compact')),
  reduce_motion boolean not null default false,
  locale text not null default 'tr' check(locale in ('tr','en')),
  updated_at timestamptz not null default now(),
  primary key(tenant_id,membership_id),
  foreign key(tenant_id,membership_id) references public.memberships(tenant_id,id)
);

create table private.mobile_devices (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id),
  membership_id uuid not null,
  platform text not null check(platform in ('ios','android')),
  push_token_hash text not null check(length(push_token_hash)=64),
  push_enabled boolean not null default false,
  last_seen_at timestamptz not null default now(),
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  unique(tenant_id,push_token_hash),
  foreign key(tenant_id,membership_id) references public.memberships(tenant_id,id)
);

create table private.mobile_editor_sessions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id),
  membership_id uuid not null,
  user_id uuid not null references auth.users(id),
  ticket_hash text not null unique check(length(ticket_hash)=64),
  editor text not null check(editor in ('goauthoring','certificate','report')),
  return_path text not null check(length(return_path) between 2 and 501 and return_path ~ '^/[a-zA-Z0-9/_?=&.-]+$'),
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now(),
  foreign key(tenant_id,membership_id) references public.memberships(tenant_id,id),
  check(expires_at <= created_at + interval '60 seconds')
);
create index mobile_editor_session_expiry on private.mobile_editor_sessions(expires_at) where consumed_at is null;

alter table public.portal_theme_versions enable row level security;
alter table public.portal_asset_bindings enable row level security;
alter table public.member_experience_preferences enable row level security;
alter table private.mobile_devices enable row level security;
alter table private.mobile_editor_sessions enable row level security;

create policy portal_theme_read on public.portal_theme_versions for select to authenticated using(
  private.is_active_member(tenant_id) and (state='published' or private.has_role(tenant_id,'tenant_admin'))
);
create policy portal_asset_read on public.portal_asset_bindings for select to authenticated using(
  private.is_active_member(tenant_id) and exists(
    select 1 from public.portal_theme_versions t where t.id=theme_version_id and t.tenant_id=portal_asset_bindings.tenant_id
    and (t.state='published' or private.has_role(t.tenant_id,'tenant_admin'))
  )
);
create policy member_experience_own on public.member_experience_preferences for all to authenticated
using(membership_id in (select m.id from public.memberships m where m.tenant_id=member_experience_preferences.tenant_id and m.user_id=(select auth.uid()) and m.status='active'))
with check(membership_id in (select m.id from public.memberships m where m.tenant_id=member_experience_preferences.tenant_id and m.user_id=(select auth.uid()) and m.status='active'));

revoke all on public.portal_theme_versions,public.portal_asset_bindings,public.member_experience_preferences from anon,authenticated;
grant select on public.portal_theme_versions,public.portal_asset_bindings to authenticated;
grant select,insert,update on public.member_experience_preferences to authenticated;

create function public.set_portal_experience(target_tenant uuid,new_version text,expected_revision integer,reason text)
returns table(portal_id uuid,experience_version text,revision integer)
language plpgsql security definer set search_path='' as $$
declare portal public.portals%rowtype;
begin
  if not private.has_role(target_tenant,'tenant_admin') then raise exception 'PORTAL_EXPERIENCE_FORBIDDEN' using errcode='42501'; end if;
  if new_version not in ('v1','v2') or reason is null or length(btrim(reason)) not between 3 and 2000 then raise exception 'PORTAL_EXPERIENCE_INVALID' using errcode='22023'; end if;
  select * into portal from public.portals p where p.tenant_id=target_tenant for update;
  if portal.id is null then raise exception 'PORTAL_NOT_FOUND' using errcode='P0002'; end if;
  if portal.revision<>expected_revision then raise exception 'STALE_REVISION' using errcode='40001'; end if;
  update public.portals set experience_version=new_version,revision=public.portals.revision+1,updated_at=now() where id=portal.id returning * into portal;
  insert into public.audit_events(tenant_id,actor_user_id,acting_role,action,resource_kind,resource_id,reason,redacted_diff)
  values(target_tenant,(select auth.uid()),'tenant_admin','portal.experience_changed','portal',portal.id,left(btrim(reason),2000),jsonb_build_object('experience_version',new_version));
  return query select portal.id,portal.experience_version,portal.revision;
end; $$;

create function public.create_mobile_editor_session(target_tenant uuid,editor_name text,return_to text)
returns table(id uuid,ticket uuid,expires_at timestamptz)
language plpgsql security definer set search_path='' as $$
declare member_id uuid; session_id uuid:=gen_random_uuid(); raw_ticket uuid:=gen_random_uuid(); expiry timestamptz:=now()+interval '60 seconds';
begin
  select m.id into member_id from public.memberships m where m.tenant_id=target_tenant and m.user_id=(select auth.uid()) and m.status='active';
  if member_id is null or not (private.has_role(target_tenant,'tenant_admin') or private.has_role(target_tenant,'instructor')) then raise exception 'EDITOR_SESSION_FORBIDDEN' using errcode='42501'; end if;
  if editor_name not in ('goauthoring','certificate','report') or return_to is null or (length(return_to) not between 2 and 501 or return_to !~ '^/[a-zA-Z0-9/_?=&.-]+$') then raise exception 'EDITOR_SESSION_INVALID' using errcode='22023'; end if;
  delete from private.mobile_editor_sessions s where s.expires_at<now()-interval '5 minutes';
  insert into private.mobile_editor_sessions(id,tenant_id,membership_id,user_id,ticket_hash,editor,return_path,expires_at)
  values(session_id,target_tenant,member_id,(select auth.uid()),encode(public.digest(convert_to(raw_ticket::text,'UTF8'),'sha256'),'hex'),editor_name,return_to,expiry);
  insert into public.audit_events(tenant_id,actor_user_id,acting_role,action,resource_kind,resource_id,redacted_diff)
  values(target_tenant,(select auth.uid()),case when private.has_role(target_tenant,'tenant_admin') then 'tenant_admin' else 'instructor' end,'mobile.editor_session_created','mobile_editor_session',session_id,jsonb_build_object('editor',editor_name));
  return query select session_id,raw_ticket,expiry;
end; $$;

create function public.consume_mobile_editor_session(raw_ticket uuid)
returns table(tenant_id uuid,membership_id uuid,editor text,return_path text)
language plpgsql security definer set search_path='' as $$
declare session private.mobile_editor_sessions%rowtype;
begin
  select * into session from private.mobile_editor_sessions s
  where s.ticket_hash=encode(public.digest(convert_to(raw_ticket::text,'UTF8'),'sha256'),'hex')
    and s.user_id=(select auth.uid()) and s.consumed_at is null and s.expires_at>now()
  for update;
  if session.id is null then raise exception 'EDITOR_SESSION_INVALID_OR_EXPIRED' using errcode='42501'; end if;
  update private.mobile_editor_sessions set consumed_at=now() where id=session.id;
  return query select session.tenant_id,session.membership_id,session.editor,session.return_path;
end; $$;

revoke all on function public.set_portal_experience(uuid,text,integer,text),public.create_mobile_editor_session(uuid,text,text),public.consume_mobile_editor_session(uuid) from public,anon;
grant execute on function public.set_portal_experience(uuid,text,integer,text),public.create_mobile_editor_session(uuid,text,text),public.consume_mobile_editor_session(uuid) to authenticated;

insert into public.portal_theme_versions(id,tenant_id,portal_id,version,state,name,mode,tokens,published_at)
values(
  'c3000000-0000-4000-8000-000000000001',
  'c1000000-0000-4000-8000-000000000001',
  'c2000000-0000-4000-8000-000000000001',
  1,'published','Oguz Law Academy · Experience V2','system',
  '{"primary":"#173A63","accent":"#C6A66A","surface":"#FFFFFF","fontSans":"Inter Variable","fontEditorial":"Source Serif 4"}',
  now()
) on conflict(portal_id,version) do update set name=excluded.name,tokens=excluded.tokens;

insert into public.portal_asset_bindings(tenant_id,portal_id,theme_version_id,slot,asset_path,alt_text)
values
('c1000000-0000-4000-8000-000000000001','c2000000-0000-4000-8000-000000000001','c3000000-0000-4000-8000-000000000001','logo_light','/assets/brand/oguz-law-academy-navy.png','Oguz Law Academy'),
('c1000000-0000-4000-8000-000000000001','c2000000-0000-4000-8000-000000000001','c3000000-0000-4000-8000-000000000001','logo_dark','/assets/brand/oguz-law-academy-white.png','Oguz Law Academy')
on conflict(theme_version_id,slot) do update set asset_path=excluded.asset_path,alt_text=excluded.alt_text;

commit;

