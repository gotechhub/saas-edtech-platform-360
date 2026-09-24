-- EP01 foundation. Run with the Supabase migration owner, never a web service key.
begin;
create schema if not exists private;
revoke all on schema private from public;

create table public.industry_packs (
 id uuid primary key default gen_random_uuid(), key text not null unique,
 name text not null, status text not null check(status in ('draft','published','retired'))
);
create table public.pack_versions (
 id uuid primary key default gen_random_uuid(), pack_id uuid not null references public.industry_packs(id),
 version integer not null check(version>0), manifest jsonb not null default '{}', published_at timestamptz,
 unique(pack_id,version)
);
create table public.tenants (
 id uuid primary key default gen_random_uuid(), name text not null,
 status text not null check(status in ('provisioning','demo','active','suspended','archived')),
 default_locale text not null default 'tr', timezone text not null default 'Europe/Istanbul',
 industry_pack_version_id uuid not null references public.pack_versions(id),
 demo_expires_at timestamptz, created_at timestamptz not null default now()
);
create table public.memberships (
 id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.tenants(id),
 user_id uuid not null references auth.users(id), status text not null check(status in ('invited','active','suspended','left')),
 joined_at timestamptz,left_at timestamptz,job_title text,professional_level text,bio text,
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 created_by uuid references auth.users(id),revision integer not null default 1 check(revision>0),
 unique(tenant_id,user_id),unique(tenant_id,id)
);
create index memberships_user_active on public.memberships(user_id,tenant_id) where status='active';
create table public.roles (
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null references public.tenants(id),
 key text not null,label text not null,is_system boolean not null default true,
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 created_by uuid references auth.users(id),revision integer not null default 1 check(revision>0),
 unique(tenant_id,key),unique(tenant_id,id)
);
create table public.role_assignments (
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null references public.tenants(id),
 membership_id uuid not null,role_id uuid not null,valid_until timestamptz,
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 created_by uuid references auth.users(id),revision integer not null default 1 check(revision>0),
 unique(tenant_id,id),unique(membership_id,role_id),
 foreign key(tenant_id,membership_id) references public.memberships(tenant_id,id),
 foreign key(tenant_id,role_id) references public.roles(tenant_id,id)
);
create table public.portals (
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null unique references public.tenants(id),
 industry_segment text not null check(industry_segment~'^[a-z][a-z0-9-]{1,49}$'),
 slug text not null check(slug~'^[a-z][a-z0-9-]{1,62}$'),primary_host text not null,
 status text not null check(status in ('draft','published','suspended')),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 created_by uuid references auth.users(id),revision integer not null default 1 check(revision>0),
 unique(primary_host,industry_segment,slug),unique(tenant_id,id)
);

-- Helpers use auth.uid(), never a caller-supplied user or UI role. All relations qualified.
create function private.is_active_member(target uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.memberships m join public.tenants t on t.id=m.tenant_id
 where m.tenant_id=target and m.user_id=(select auth.uid()) and m.status='active'
 and t.status in ('demo','active') and (t.status<>'demo' or t.demo_expires_at is null or t.demo_expires_at>now()));
$$;
create function private.has_role(target uuid,role_key text) returns boolean
language sql stable security definer set search_path='' as $$
 select private.is_active_member(target) and exists(
 select 1 from public.memberships m join public.role_assignments a on a.tenant_id=m.tenant_id and a.membership_id=m.id
 join public.roles r on r.tenant_id=a.tenant_id and r.id=a.role_id
 where m.tenant_id=target and m.user_id=(select auth.uid()) and m.status='active'
 and r.key=role_key and (a.valid_until is null or a.valid_until>now()));
$$;
revoke all on function private.is_active_member(uuid),private.has_role(uuid,text) from public;
grant usage on schema private to authenticated;
grant execute on function private.is_active_member(uuid),private.has_role(uuid,text) to authenticated;

alter table public.industry_packs enable row level security;
alter table public.pack_versions enable row level security;
alter table public.tenants enable row level security;
alter table public.memberships enable row level security;
alter table public.roles enable row level security;
alter table public.role_assignments enable row level security;
alter table public.portals enable row level security;
create policy tenant_read on public.tenants for select to authenticated using(private.is_active_member(id));
create policy portal_read on public.portals for select to authenticated using(private.is_active_member(tenant_id));
create policy membership_read on public.memberships for select to authenticated using(
 private.is_active_member(tenant_id) and (user_id=(select auth.uid()) or private.has_role(tenant_id,'tenant_admin')));
create policy role_read on public.roles for select to authenticated using(private.is_active_member(tenant_id));
create policy assignment_read on public.role_assignments for select to authenticated using(
 private.has_role(tenant_id,'tenant_admin') or (private.is_active_member(tenant_id) and membership_id in
 (select m.id from public.memberships m where m.user_id=(select auth.uid()) and m.tenant_id=role_assignments.tenant_id)));
create policy pack_read on public.industry_packs for select to authenticated using(status='published');
create policy pack_version_read on public.pack_versions for select to authenticated using(published_at is not null);
-- Read-only until scoped command RPCs are implemented in EP02. No browser role assignment.
revoke all on public.tenants,public.memberships,public.roles,public.role_assignments,public.portals,public.industry_packs,public.pack_versions from anon,authenticated;
grant select on public.tenants,public.memberships,public.roles,public.role_assignments,public.portals,public.industry_packs,public.pack_versions to authenticated;

-- Transactional outbox primitive. Kept private, not exposed via PostgREST.
create table private.jobs (
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null references public.tenants(id),
 kind text not null,payload jsonb not null default '{}',dedupe_key text not null,
 state text not null default 'queued' check(state in ('queued','running','done','failed')),
 attempts integer not null default 0,max_attempts integer not null default 5 check(max_attempts between 1 and 20),
 available_at timestamptz not null default now(),lease_until timestamptz,lease_token uuid,
 created_at timestamptz not null default now(),unique(tenant_id,kind,dedupe_key)
);
create index jobs_claim on private.jobs(state,available_at,lease_until);
alter table private.jobs enable row level security;
create function private.claim_job() returns setof private.jobs
language sql security definer set search_path='' as $$
 update private.jobs set state='failed',lease_token=null,lease_until=null
 where attempts>=max_attempts and ((state='running' and lease_until<now()) or state='queued');
 with candidate as (
 select id from private.jobs where attempts<max_attempts and
 ((state='queued' and available_at<=now()) or (state='running' and lease_until<now()))
 order by available_at,id for update skip locked limit 1
 ) update private.jobs j set state='running',attempts=j.attempts+1,
 lease_until=now()+interval '60 seconds',lease_token=gen_random_uuid()
 from candidate c where j.id=c.id returning j.*;
$$;
create function private.complete_job(job_id uuid,fence uuid) returns boolean
language sql security definer set search_path='' as $$
 with done as (update private.jobs set state='done',lease_until=null,lease_token=null
 where id=job_id and state='running' and lease_token=fence and lease_until>now() returning id)
 select exists(select 1 from done);
$$;
revoke all on all tables in schema private from public,anon,authenticated;
revoke all on function private.claim_job(),private.complete_job(uuid,uuid) from public,anon,authenticated;
-- Worker login/credentials and queue adapter intentionally not provisioned here.
commit;
