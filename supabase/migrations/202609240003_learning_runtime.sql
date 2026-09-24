-- Tenant-bound learning runtime: attempt, short-lived session and immutable events.
-- Browser clients can only use the two narrow RPCs at the bottom of this file.
begin;

create extension if not exists pgcrypto;

create table public.attempts (
 id uuid primary key default gen_random_uuid(),
 tenant_id uuid not null,
 enrollment_id uuid not null,
 attempt_no integer not null check(attempt_no > 0),
 state text not null default 'in_progress' check(state in ('in_progress','submitted','graded','abandoned')),
 started_at timestamptz not null default now(),submitted_at timestamptz,graded_at timestamptz,
 score_bp integer check(score_bp between 0 and 10000),success boolean,completion boolean,
 revision integer not null default 1 check(revision > 0),
 unique(tenant_id,id),unique(enrollment_id,attempt_no),
 foreign key(tenant_id,enrollment_id) references public.enrollments(tenant_id,id)
);
create index attempts_enrollment on public.attempts(tenant_id,enrollment_id,attempt_no desc);

create table public.learning_sessions (
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null,
 attempt_id uuid not null,nonce_hash text not null unique,
 expires_at timestamptz not null,revoked_at timestamptz,
 last_sequence bigint not null default 0 check(last_sequence >= 0),last_seen_at timestamptz,
 created_at timestamptz not null default now(),
 unique(tenant_id,id),
 foreign key(tenant_id,attempt_id) references public.attempts(tenant_id,id),
 check(expires_at > created_at)
);
create unique index one_active_learning_session_per_attempt
 on public.learning_sessions(attempt_id) where revoked_at is null;

create table public.learning_events (
 id bigint generated always as identity primary key,
 tenant_id uuid not null,event_id uuid not null,session_id uuid not null,attempt_id uuid not null,
 event_type text not null check(event_type in ('content.started','block.viewed','interaction.submitted','content.completed','runtime.commit')),
 schema_version integer not null default 1 check(schema_version = 1),sequence bigint not null check(sequence > 0),
 occurred_at timestamptz not null,received_at timestamptz not null default now(),
 payload jsonb not null check(jsonb_typeof(payload)='object'),payload_hash text not null,
 unique(event_id),unique(session_id,sequence),unique(tenant_id,id),
 foreign key(tenant_id,session_id) references public.learning_sessions(tenant_id,id),
 foreign key(tenant_id,attempt_id) references public.attempts(tenant_id,id)
);
create index learning_events_attempt on public.learning_events(tenant_id,attempt_id,sequence);

create table public.interaction_records (
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null,
 event_id uuid not null unique,attempt_id uuid not null,block_id uuid not null,
 response jsonb not null,elapsed_seconds integer not null default 0 check(elapsed_seconds between 0 and 86400),
 created_at timestamptz not null default now(),
 unique(tenant_id,id),
 foreign key(tenant_id,attempt_id) references public.attempts(tenant_id,id),
 foreign key(event_id) references public.learning_events(event_id)
);

create table public.progress_snapshots (
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null,
 enrollment_id uuid not null,completion_bp integer not null default 0 check(completion_bp between 0 and 10000),
 last_object_key text,measured_seconds integer not null default 0 check(measured_seconds >= 0),
 reported_seconds integer check(reported_seconds is null or reported_seconds >= 0),last_event_at timestamptz,
 revision integer not null default 1 check(revision > 0),
 unique(tenant_id,id),unique(enrollment_id),
 foreign key(tenant_id,enrollment_id) references public.enrollments(tenant_id,id)
);

create table public.completion_records (
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null,
 enrollment_id uuid not null,attempt_id uuid not null,policy_version integer not null check(policy_version > 0),
 completed_at timestamptz not null,success boolean not null,
 provenance text not null check(provenance in ('reported','verified')),
 evidence jsonb not null default '{}' check(jsonb_typeof(evidence)='object'),
 created_at timestamptz not null default now(),
 unique(tenant_id,id),unique(enrollment_id,attempt_id,policy_version,provenance),
 foreign key(tenant_id,enrollment_id) references public.enrollments(tenant_id,id),
 foreign key(tenant_id,attempt_id) references public.attempts(tenant_id,id)
);

alter table public.attempts enable row level security;
alter table public.learning_sessions enable row level security;
alter table public.learning_events enable row level security;
alter table public.interaction_records enable row level security;
alter table public.progress_snapshots enable row level security;
alter table public.completion_records enable row level security;

create function private.owns_enrollment(target_tenant uuid,target_enrollment uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select private.is_active_member(target_tenant) and exists(
  select 1 from public.enrollments e join public.memberships m
   on m.tenant_id=e.tenant_id and m.id=e.membership_id
  where e.tenant_id=target_tenant and e.id=target_enrollment
   and m.user_id=(select auth.uid()) and m.status='active');
$$;
revoke all on function private.owns_enrollment(uuid,uuid) from public;
grant execute on function private.owns_enrollment(uuid,uuid) to authenticated;

create policy attempt_read on public.attempts for select to authenticated using(
 private.owns_enrollment(tenant_id,enrollment_id)
 or private.has_role(tenant_id,'tenant_admin') or private.has_role(tenant_id,'instructor'));
create policy session_read on public.learning_sessions for select to authenticated using(exists(
 select 1 from public.attempts a where a.id=attempt_id and a.tenant_id=learning_sessions.tenant_id
 and private.owns_enrollment(a.tenant_id,a.enrollment_id)));
create policy event_read on public.learning_events for select to authenticated using(exists(
 select 1 from public.attempts a where a.id=attempt_id and a.tenant_id=learning_events.tenant_id
 and private.owns_enrollment(a.tenant_id,a.enrollment_id)));
create policy interaction_read on public.interaction_records for select to authenticated using(exists(
 select 1 from public.attempts a where a.id=attempt_id and a.tenant_id=interaction_records.tenant_id
 and private.owns_enrollment(a.tenant_id,a.enrollment_id)));
create policy progress_read on public.progress_snapshots for select to authenticated using(
 private.owns_enrollment(tenant_id,enrollment_id)
 or private.has_role(tenant_id,'tenant_admin') or private.has_role(tenant_id,'instructor'));
create policy completion_read on public.completion_records for select to authenticated using(
 private.owns_enrollment(tenant_id,enrollment_id)
 or private.has_role(tenant_id,'tenant_admin') or private.has_role(tenant_id,'instructor'));

revoke all on public.attempts,public.learning_sessions,public.learning_events,
 public.interaction_records,public.progress_snapshots,public.completion_records from anon,authenticated;
grant select on public.attempts,public.learning_sessions,public.learning_events,
 public.interaction_records,public.progress_snapshots,public.completion_records to authenticated;

create function public.begin_learning_session(target_enrollment uuid)
returns table(session_id uuid,session_token uuid,attempt_id uuid,expires_at timestamptz)
language plpgsql security definer set search_path='' as $$
declare
 current_tenant uuid; current_attempt uuid; next_attempt integer; token uuid; expiry timestamptz;
begin
 select e.tenant_id into current_tenant
 from public.enrollments e join public.learning_assignments a
  on a.tenant_id=e.tenant_id and a.id=e.assignment_id
 where e.id=target_enrollment and a.status='active' and a.course_id is not null
  and private.owns_enrollment(e.tenant_id,e.id)
 for update of e;
 if current_tenant is null then raise exception 'LEARNING_ENROLLMENT_NOT_FOUND' using errcode='P0002'; end if;

 select a.id into current_attempt from public.attempts a
 where a.enrollment_id=target_enrollment and a.state='in_progress'
 order by a.attempt_no desc limit 1 for update;
 if current_attempt is null then
  select coalesce(max(a.attempt_no),0)+1 into next_attempt from public.attempts a where a.enrollment_id=target_enrollment;
  insert into public.attempts(tenant_id,enrollment_id,attempt_no)
   values(current_tenant,target_enrollment,next_attempt) returning id into current_attempt;
  update public.enrollments set state='in_progress',started_at=coalesce(started_at,now()),
   last_activity_at=now(),attempt_count=next_attempt,revision=revision+1 where id=target_enrollment;
 end if;

 update public.learning_sessions set revoked_at=coalesce(public.learning_sessions.revoked_at,now())
  where public.learning_sessions.attempt_id=current_attempt and public.learning_sessions.revoked_at is null;
 token:=gen_random_uuid(); expiry:=now()+interval '2 hours';
 return query insert into public.learning_sessions(tenant_id,attempt_id,nonce_hash,expires_at)
  values(current_tenant,current_attempt,encode(public.digest(convert_to(token::text,'UTF8'),'sha256'),'hex'),expiry)
  returning id,token,current_attempt,public.learning_sessions.expires_at;
end;
$$;

create function public.ingest_learning_events(session_token uuid,event_batch jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
 runtime_session public.learning_sessions%rowtype; runtime_attempt public.attempts%rowtype;
 item jsonb; eid uuid; seq bigint; kind text; occurred timestamptz; body jsonb; body_hash text;
 previous public.learning_events%rowtype; accepted uuid[]:='{}'; persisted bigint; enrollment uuid;
 block uuid; elapsed integer;
begin
 if jsonb_typeof(event_batch)<>'array' or jsonb_array_length(event_batch) not between 1 and 50 then
  raise exception 'LEARNING_EVENT_BATCH_INVALID' using errcode='22023';
 end if;
 select * into runtime_session from public.learning_sessions s
  where s.nonce_hash=encode(public.digest(convert_to(session_token::text,'UTF8'),'sha256'),'hex')
   and s.revoked_at is null and s.expires_at>now() for update;
 if not found then raise exception 'LEARNING_SESSION_INVALID' using errcode='28000'; end if;
 select * into runtime_attempt from public.attempts a where a.id=runtime_session.attempt_id;
 enrollment:=runtime_attempt.enrollment_id;
 if not private.owns_enrollment(runtime_session.tenant_id,enrollment) then
  raise exception 'LEARNING_SESSION_INVALID' using errcode='28000';
 end if;
 persisted:=runtime_session.last_sequence;

 for item in select value from jsonb_array_elements(event_batch) loop
  begin
   eid:=(item->>'event_id')::uuid; seq:=(item->>'sequence')::bigint;
   kind:=item->>'type'; occurred:=(item->>'occurred_at')::timestamptz; body:=item->'payload';
  exception when others then raise exception 'LEARNING_EVENT_INVALID' using errcode='22023'; end;
  if eid is null or seq<1 or kind not in ('content.started','block.viewed','interaction.submitted','content.completed','runtime.commit')
   or occurred is null or occurred>now()+interval '5 minutes' or occurred<now()-interval '30 days'
   or body is null or jsonb_typeof(body)<>'object' then
   raise exception 'LEARNING_EVENT_INVALID' using errcode='22023';
  end if;
  body_hash:=encode(public.digest(convert_to(kind||'|'||seq::text||'|'||occurred::text||'|'||body::text,'UTF8'),'sha256'),'hex');
  select * into previous from public.learning_events e where e.event_id=eid;
  if found then
   if previous.session_id<>runtime_session.id or previous.payload_hash<>body_hash then
    raise exception 'LEARNING_EVENT_CONFLICT' using errcode='23505';
   end if;
   accepted:=array_append(accepted,eid); persisted:=greatest(persisted,previous.sequence); continue;
  end if;
  if seq<>persisted+1 then raise exception 'LEARNING_EVENT_SEQUENCE' using errcode='22000'; end if;

  if kind='block.viewed' and ((body->>'visible_seconds')::integer not between 0 and 30 or nullif(body->>'block_id','') is null) then
   raise exception 'LEARNING_EVENT_PAYLOAD_INVALID' using errcode='22023';
  elsif kind='interaction.submitted' then
   begin block:=(body->>'block_id')::uuid; elapsed:=coalesce((body->>'elapsed_seconds')::integer,0);
   exception when others then raise exception 'LEARNING_EVENT_PAYLOAD_INVALID' using errcode='22023'; end;
   if block is null or elapsed not between 0 and 86400 or not (body ? 'response') then
    raise exception 'LEARNING_EVENT_PAYLOAD_INVALID' using errcode='22023';
   end if;
  elsif kind='runtime.commit' and (body->>'profile'<>'scorm12_single_v1' or jsonb_typeof(body->'changes')<>'object') then
   raise exception 'LEARNING_EVENT_PAYLOAD_INVALID' using errcode='22023';
  end if;

  insert into public.learning_events(tenant_id,event_id,session_id,attempt_id,event_type,sequence,occurred_at,payload,payload_hash)
   values(runtime_session.tenant_id,eid,runtime_session.id,runtime_attempt.id,kind,seq,occurred,body,body_hash);
  if kind='interaction.submitted' then
   insert into public.interaction_records(tenant_id,event_id,attempt_id,block_id,response,elapsed_seconds)
    values(runtime_session.tenant_id,eid,runtime_attempt.id,block,body->'response',elapsed);
  end if;
  insert into public.progress_snapshots(tenant_id,enrollment_id,last_object_key,measured_seconds,last_event_at)
   values(runtime_session.tenant_id,enrollment,body->>'object_key',case when kind='block.viewed' then (body->>'visible_seconds')::integer else 0 end,occurred)
  on conflict(enrollment_id) do update set
   last_object_key=coalesce(excluded.last_object_key,public.progress_snapshots.last_object_key),
   measured_seconds=public.progress_snapshots.measured_seconds+excluded.measured_seconds,
   last_event_at=greatest(public.progress_snapshots.last_event_at,excluded.last_event_at),revision=public.progress_snapshots.revision+1;
  if kind='content.completed' then
   update public.attempts set state='submitted',submitted_at=coalesce(submitted_at,now()),revision=revision+1 where id=runtime_attempt.id;
  end if;
  accepted:=array_append(accepted,eid); persisted:=seq;
 end loop;
 update public.learning_sessions set last_sequence=persisted,last_seen_at=now() where id=runtime_session.id;
 update public.enrollments set last_activity_at=now(),revision=revision+1 where id=enrollment;
 return jsonb_build_object('accepted_event_ids',to_jsonb(accepted),'persisted_sequence',persisted,'server_time',now());
end;
$$;

revoke all on function public.begin_learning_session(uuid),public.ingest_learning_events(uuid,jsonb) from public,anon;
grant execute on function public.begin_learning_session(uuid),public.ingest_learning_events(uuid,jsonb) to authenticated;

commit;
