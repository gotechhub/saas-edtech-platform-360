-- Core LMS domain. Browser clients stay read-only until command RPCs are added.
begin;

create table public.courses (
 id uuid primary key default gen_random_uuid(),
 tenant_id uuid not null references public.tenants(id),
 title text not null check(length(title) between 2 and 180),
 summary text not null default '',
 category text not null,
 source_type text not null check(source_type in ('native','scorm12','scorm2004','xapi','video','live','document','link')),
 status text not null default 'draft' check(status in ('draft','review','published','retired')),
 required_default boolean not null default false,
 duration_minutes integer not null default 0 check(duration_minutes between 0 and 100000),
 current_version integer not null default 1 check(current_version>0),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 created_by uuid references auth.users(id),revision integer not null default 1 check(revision>0),
 unique(tenant_id,id),unique(tenant_id,title)
);
create index courses_catalog on public.courses(tenant_id,status,category);

create table public.course_versions (
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null,
 course_id uuid not null,version integer not null check(version>0),
 status text not null default 'draft' check(status in ('draft','review','published','archived')),
 content jsonb not null default '{}',launch_uri text,package_sha256 text,
 published_at timestamptz,created_at timestamptz not null default now(),
 created_by uuid references auth.users(id),
 unique(tenant_id,id),unique(course_id,version),
 foreign key(tenant_id,course_id) references public.courses(tenant_id,id),
 check(package_sha256 is null or package_sha256~'^[a-f0-9]{64}$')
);

create table public.programs (
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null references public.tenants(id),
 title text not null check(length(title) between 2 and 180),description text not null default '',
 mode text not null default 'ordered' check(mode in ('ordered','flexible','conditional')),
 status text not null default 'draft' check(status in ('draft','published','retired')),
 certificate_template_id uuid,created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 created_by uuid references auth.users(id),revision integer not null default 1 check(revision>0),
 unique(tenant_id,id)
);
create table public.program_items (
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null,
 program_id uuid not null,course_id uuid not null,position integer not null check(position>=0),
 required boolean not null default true,unlock_rule jsonb not null default '{}',
 unique(tenant_id,id),unique(program_id,position),
 foreign key(tenant_id,program_id) references public.programs(tenant_id,id),
 foreign key(tenant_id,course_id) references public.courses(tenant_id,id)
);

create table public.learning_assignments (
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null references public.tenants(id),
 course_id uuid,program_id uuid,title text not null,
 audience_type text not null check(audience_type in ('everyone','team','role','membership','dynamic')),
 audience_rule jsonb not null default '{}',required boolean not null default false,
 due_at timestamptz,pass_score numeric(5,2) check(pass_score between 0 and 100),
 reminder_rule jsonb not null default '{}',status text not null default 'draft' check(status in ('draft','scheduled','active','closed','cancelled')),
 starts_at timestamptz,created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 created_by uuid references auth.users(id),revision integer not null default 1 check(revision>0),
 unique(tenant_id,id),
 foreign key(tenant_id,course_id) references public.courses(tenant_id,id),
 foreign key(tenant_id,program_id) references public.programs(tenant_id,id),
 check((course_id is not null)::integer+(program_id is not null)::integer=1)
);
create index assignment_schedule on public.learning_assignments(tenant_id,status,due_at);

create table public.enrollments (
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null,
 assignment_id uuid not null,membership_id uuid not null,
 state text not null default 'assigned' check(state in ('assigned','in_progress','completed','failed','waived','expired')),
 progress numeric(5,2) not null default 0 check(progress between 0 and 100),score numeric(5,2) check(score between 0 and 100),
 assigned_at timestamptz not null default now(),started_at timestamptz,completed_at timestamptz,last_activity_at timestamptz,
 certificate_id uuid,attempt_count integer not null default 0 check(attempt_count>=0),revision integer not null default 1 check(revision>0),
 unique(tenant_id,id),unique(assignment_id,membership_id),
 foreign key(tenant_id,assignment_id) references public.learning_assignments(tenant_id,id),
 foreign key(tenant_id,membership_id) references public.memberships(tenant_id,id)
);
create index enrollment_learner_queue on public.enrollments(tenant_id,membership_id,state,last_activity_at);

create table public.learning_resources (
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null references public.tenants(id),
 title text not null check(length(title) between 2 and 180),description text not null default '',
 resource_type text not null check(resource_type in ('document','template','video','checklist','link')),
 topic text not null,status text not null default 'draft' check(status in ('draft','published','retired')),
 storage_path text,external_url text,created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 created_by uuid references auth.users(id),revision integer not null default 1 check(revision>0),
 unique(tenant_id,id),check(storage_path is not null or external_url is not null)
);

alter table public.courses enable row level security;
alter table public.course_versions enable row level security;
alter table public.programs enable row level security;
alter table public.program_items enable row level security;
alter table public.learning_assignments enable row level security;
alter table public.enrollments enable row level security;
alter table public.learning_resources enable row level security;

create policy course_read on public.courses for select to authenticated using(
 private.is_active_member(tenant_id) and (status='published' or private.has_role(tenant_id,'tenant_admin') or private.has_role(tenant_id,'instructor')));
create policy course_version_read on public.course_versions for select to authenticated using(
 private.is_active_member(tenant_id) and (status='published' or private.has_role(tenant_id,'tenant_admin') or private.has_role(tenant_id,'instructor')));
create policy program_read on public.programs for select to authenticated using(
 private.is_active_member(tenant_id) and (status='published' or private.has_role(tenant_id,'tenant_admin') or private.has_role(tenant_id,'instructor')));
create policy program_item_read on public.program_items for select to authenticated using(
 private.is_active_member(tenant_id) and exists(select 1 from public.programs p where p.id=program_id and p.tenant_id=program_items.tenant_id));
create policy enrollment_read on public.enrollments for select to authenticated using(
 private.is_active_member(tenant_id) and (
  membership_id in (select m.id from public.memberships m where m.tenant_id=enrollments.tenant_id and m.user_id=(select auth.uid()))
  or private.has_role(tenant_id,'tenant_admin') or private.has_role(tenant_id,'instructor') or private.has_role(tenant_id,'line_manager')));
create policy learning_assignment_read on public.learning_assignments for select to authenticated using(
 private.is_active_member(tenant_id) and (
  private.has_role(tenant_id,'tenant_admin') or private.has_role(tenant_id,'instructor') or private.has_role(tenant_id,'line_manager')
  or exists(select 1 from public.enrollments e join public.memberships m on m.tenant_id=e.tenant_id and m.id=e.membership_id
    where e.assignment_id=learning_assignments.id and e.tenant_id=learning_assignments.tenant_id and m.user_id=(select auth.uid()))));
create policy learning_resource_read on public.learning_resources for select to authenticated using(
 private.is_active_member(tenant_id) and (status='published' or private.has_role(tenant_id,'tenant_admin') or private.has_role(tenant_id,'instructor')));

revoke all on public.courses,public.course_versions,public.programs,public.program_items,public.learning_assignments,public.enrollments,public.learning_resources from anon,authenticated;
grant select on public.courses,public.course_versions,public.programs,public.program_items,public.learning_assignments,public.enrollments,public.learning_resources to authenticated;
commit;
