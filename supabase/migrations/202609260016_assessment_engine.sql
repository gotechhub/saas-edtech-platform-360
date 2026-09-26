-- EP07: versioned assessment authoring, protected answer keys and server-side grading.
begin;

create table public.assessments (
  id uuid primary key default gen_random_uuid(),tenant_id uuid not null references public.tenants(id),
  title text not null check(length(title) between 2 and 180),status text not null default 'draft' check(status in ('draft','published','retired')),
  current_version integer not null default 1 check(current_version>0),pass_score numeric(5,2) not null default 70 check(pass_score between 0 and 100),
  max_attempts integer not null default 2 check(max_attempts between 1 and 20),time_limit_minutes integer not null default 30 check(time_limit_minutes between 1 and 480),
  created_by uuid references auth.users(id),created_at timestamptz not null default now(),updated_at timestamptz not null default now(),revision integer not null default 1,
  unique(tenant_id,id)
);
create table public.assessment_versions (
  id uuid primary key default gen_random_uuid(),tenant_id uuid not null,assessment_id uuid not null,version integer not null check(version>0),
  state text not null default 'draft' check(state in ('draft','published','archived')),instructions text not null default '',
  created_by uuid references auth.users(id),created_at timestamptz not null default now(),published_at timestamptz,
  unique(tenant_id,id),unique(assessment_id,version),foreign key(tenant_id,assessment_id) references public.assessments(tenant_id,id),
  check((state='published' and published_at is not null) or state<>'published')
);
create unique index assessment_one_published_version on public.assessment_versions(assessment_id) where state='published';
create table public.assessment_questions (
  id uuid primary key default gen_random_uuid(),tenant_id uuid not null,assessment_version_id uuid not null,position integer not null check(position>0),
  kind text not null check(kind in ('single_choice','multiple_choice','true_false')),prompt text not null check(length(prompt) between 2 and 2000),
  options jsonb not null check(jsonb_typeof(options)='array' and jsonb_array_length(options) between 2 and 12),points numeric(8,2) not null default 1 check(points>0 and points<=1000),
  unique(tenant_id,id),unique(assessment_version_id,position),foreign key(tenant_id,assessment_version_id) references public.assessment_versions(tenant_id,id) on delete cascade
);
create table private.assessment_answer_keys (
  question_id uuid primary key references public.assessment_questions(id) on delete cascade,
  correct_answer jsonb not null,explanation text not null default '',created_at timestamptz not null default now()
);
create table public.assessment_sittings (
  id uuid primary key default gen_random_uuid(),tenant_id uuid not null,assessment_id uuid not null,assessment_version_id uuid not null,
  enrollment_id uuid not null,membership_id uuid not null,attempt_no integer not null check(attempt_no>0),
  state text not null default 'in_progress' check(state in ('in_progress','submitted','expired','abandoned')),
  started_at timestamptz not null default now(),expires_at timestamptz not null,submitted_at timestamptz,score numeric(5,2),success boolean,revision integer not null default 1,
  unique(tenant_id,id),unique(enrollment_id,assessment_id,attempt_no),
  foreign key(tenant_id,assessment_id) references public.assessments(tenant_id,id),
  foreign key(tenant_id,assessment_version_id) references public.assessment_versions(tenant_id,id),
  foreign key(tenant_id,enrollment_id) references public.enrollments(tenant_id,id),
  foreign key(tenant_id,membership_id) references public.memberships(tenant_id,id),
  check(expires_at>started_at)
);
create table public.assessment_responses (
  id uuid primary key default gen_random_uuid(),tenant_id uuid not null,sitting_id uuid not null,question_id uuid not null,
  answer jsonb not null,is_correct boolean not null,awarded_points numeric(8,2) not null default 0,created_at timestamptz not null default now(),
  unique(sitting_id,question_id),foreign key(tenant_id,sitting_id) references public.assessment_sittings(tenant_id,id) on delete cascade,
  foreign key(tenant_id,question_id) references public.assessment_questions(tenant_id,id)
);

alter table public.assessments enable row level security;
alter table public.assessment_versions enable row level security;
alter table public.assessment_questions enable row level security;
alter table public.assessment_sittings enable row level security;
alter table public.assessment_responses enable row level security;
create policy assessment_read on public.assessments for select to authenticated using(private.is_active_member(tenant_id) and (status='published' or private.has_role(tenant_id,'tenant_admin') or private.has_role(tenant_id,'instructor')));
create policy assessment_version_read on public.assessment_versions for select to authenticated using(private.is_active_member(tenant_id) and (state='published' or private.has_role(tenant_id,'tenant_admin') or private.has_role(tenant_id,'instructor')));
create policy assessment_question_read on public.assessment_questions for select to authenticated using(private.is_active_member(tenant_id) and exists(select 1 from public.assessment_versions v where v.id=assessment_version_id and v.tenant_id=assessment_questions.tenant_id and (v.state='published' or private.has_role(v.tenant_id,'tenant_admin') or private.has_role(v.tenant_id,'instructor'))));
create policy assessment_sitting_read on public.assessment_sittings for select to authenticated using(private.owns_enrollment(tenant_id,enrollment_id) or private.has_role(tenant_id,'tenant_admin') or private.has_role(tenant_id,'instructor'));
create policy assessment_response_read on public.assessment_responses for select to authenticated using(exists(select 1 from public.assessment_sittings s where s.id=sitting_id and s.tenant_id=assessment_responses.tenant_id and (private.owns_enrollment(s.tenant_id,s.enrollment_id) or private.has_role(s.tenant_id,'tenant_admin') or private.has_role(s.tenant_id,'instructor'))));
revoke all on public.assessments,public.assessment_versions,public.assessment_questions,public.assessment_sittings,public.assessment_responses from anon,authenticated;
grant select on public.assessments,public.assessment_versions,public.assessment_questions,public.assessment_sittings,public.assessment_responses to authenticated;

create function public.save_assessment_draft(target_tenant uuid,target_assessment uuid,assessment_title text,instructions text,
  required_pass_score numeric,allowed_attempts integer,limit_minutes integer,questions jsonb,expected_revision integer)
returns table(assessment_id uuid,revision integer,version integer,question_count integer)
language plpgsql security definer set search_path='' as $$
declare a public.assessments%rowtype; v public.assessment_versions%rowtype; item jsonb; qid uuid; pos integer:=0; next_version integer; current_state text;
begin
  if not (private.has_role(target_tenant,'tenant_admin') or private.has_role(target_tenant,'instructor')) then raise exception 'ASSESSMENT_MANAGE_FORBIDDEN' using errcode='42501'; end if;
  if assessment_title is null or length(btrim(assessment_title)) not between 2 and 180 or required_pass_score not between 0 and 100 or allowed_attempts not between 1 and 20
    or limit_minutes not between 1 and 480 or questions is null or jsonb_typeof(questions)<>'array' or jsonb_array_length(questions) not between 1 and 100 then
    raise exception 'ASSESSMENT_DRAFT_INVALID' using errcode='22023'; end if;
  if target_assessment is null then
    insert into public.assessments(tenant_id,title,pass_score,max_attempts,time_limit_minutes,created_by)
    values(target_tenant,btrim(assessment_title),required_pass_score,allowed_attempts,limit_minutes,(select auth.uid())) returning * into a;
    next_version:=1;
  else
    select * into a from public.assessments x where x.tenant_id=target_tenant and x.id=target_assessment for update;
    if a.id is null then raise exception 'ASSESSMENT_NOT_FOUND' using errcode='P0002'; end if;
    if a.revision<>expected_revision then raise exception 'REVISION_CONFLICT' using errcode='40001'; end if;
    select x.state into current_state from public.assessment_versions x where x.assessment_id=a.id and x.version=a.current_version;
    next_version:=case when current_state='published' then a.current_version+1 else a.current_version end;
    update public.assessments set title=btrim(assessment_title),pass_score=required_pass_score,max_attempts=allowed_attempts,
      time_limit_minutes=limit_minutes,current_version=next_version,updated_at=now(),revision=public.assessments.revision+1 where id=a.id returning * into a;
  end if;
  insert into public.assessment_versions(tenant_id,assessment_id,version,state,instructions,created_by)
    values(target_tenant,a.id,next_version,'draft',coalesce(instructions,''),(select auth.uid()))
    on conflict on constraint assessment_versions_assessment_id_version_key do update set instructions=excluded.instructions
    returning * into v;
  delete from private.assessment_answer_keys k using public.assessment_questions q where k.question_id=q.id and q.assessment_version_id=v.id;
  delete from public.assessment_questions q where q.assessment_version_id=v.id;
  for item in select value from jsonb_array_elements(questions) loop
    pos:=pos+1;
    if item->>'kind' not in ('single_choice','multiple_choice','true_false') or length(btrim(coalesce(item->>'prompt',''))) not between 2 and 2000
      or jsonb_typeof(item->'options')<>'array' or jsonb_array_length(item->'options') not between 2 and 12 or not (item ? 'correctAnswer') then
      raise exception 'ASSESSMENT_QUESTION_INVALID' using errcode='22023'; end if;
    insert into public.assessment_questions(tenant_id,assessment_version_id,position,kind,prompt,options,points)
      values(target_tenant,v.id,pos,item->>'kind',btrim(item->>'prompt'),item->'options',coalesce((item->>'points')::numeric,1)) returning id into qid;
    insert into private.assessment_answer_keys(question_id,correct_answer,explanation) values(qid,item->'correctAnswer',coalesce(item->>'explanation',''));
  end loop;
  insert into public.audit_events(tenant_id,actor_user_id,acting_role,action,resource_kind,resource_id,redacted_diff)
  values(target_tenant,(select auth.uid()),case when private.has_role(target_tenant,'tenant_admin') then 'tenant_admin' else 'instructor' end,
    'assessment.draft_saved','assessment',a.id,jsonb_build_object('version',next_version,'question_count',pos));
  return query select a.id,a.revision,next_version,pos;
end; $$;

create function public.publish_assessment(target_tenant uuid,target_assessment uuid,expected_revision integer)
returns table(assessment_id uuid,revision integer,version integer)
language plpgsql security definer set search_path='' as $$
declare a public.assessments%rowtype; v public.assessment_versions%rowtype; count_questions integer;
begin
  if not (private.has_role(target_tenant,'tenant_admin') or private.has_role(target_tenant,'instructor')) then raise exception 'ASSESSMENT_MANAGE_FORBIDDEN' using errcode='42501'; end if;
  select * into a from public.assessments x where x.tenant_id=target_tenant and x.id=target_assessment for update;
  if a.id is null then raise exception 'ASSESSMENT_NOT_FOUND' using errcode='P0002'; end if;
  if a.revision<>expected_revision then raise exception 'REVISION_CONFLICT' using errcode='40001'; end if;
  select * into v from public.assessment_versions x where x.assessment_id=a.id and x.version=a.current_version for update;
  select count(*) into count_questions from public.assessment_questions q where q.assessment_version_id=v.id;
  if v.id is null or v.state<>'draft' or count_questions=0 then raise exception 'ASSESSMENT_NOT_READY' using errcode='22023'; end if;
  update public.assessment_versions av set state='archived' where av.assessment_id=a.id and av.state='published';
  update public.assessment_versions av set state='published',published_at=now() where av.id=v.id;
  update public.assessments set status='published',updated_at=now(),revision=public.assessments.revision+1 where id=a.id returning * into a;
  insert into public.audit_events(tenant_id,actor_user_id,acting_role,action,resource_kind,resource_id,redacted_diff)
  values(target_tenant,(select auth.uid()),case when private.has_role(target_tenant,'tenant_admin') then 'tenant_admin' else 'instructor' end,'assessment.published','assessment',a.id,jsonb_build_object('version',v.version));
  return query select a.id,a.revision,v.version;
end; $$;

create function public.begin_assessment(target_tenant uuid,target_assessment uuid,target_enrollment uuid)
returns table(sitting_id uuid,attempt_no integer,expires_at timestamptz,questions jsonb)
language plpgsql security definer set search_path='' as $$
declare a public.assessments%rowtype; v public.assessment_versions%rowtype; member uuid; sitting public.assessment_sittings%rowtype; used integer;
begin
  select e.membership_id into member from public.enrollments e where e.tenant_id=target_tenant and e.id=target_enrollment and private.owns_enrollment(e.tenant_id,e.id);
  if member is null then raise exception 'ASSESSMENT_ENROLLMENT_FORBIDDEN' using errcode='42501'; end if;
  select * into a from public.assessments x where x.tenant_id=target_tenant and x.id=target_assessment and x.status='published';
  if a.id is null then raise exception 'ASSESSMENT_NOT_PUBLISHED' using errcode='P0002'; end if;
  select * into v from public.assessment_versions x where x.assessment_id=a.id and x.state='published';
  select * into sitting from public.assessment_sittings s where s.enrollment_id=target_enrollment and s.assessment_id=a.id and s.state='in_progress' and s.expires_at>now() order by s.attempt_no desc limit 1;
  if sitting.id is null then
    update public.assessment_sittings x set state='expired',revision=x.revision+1 where x.enrollment_id=target_enrollment and x.assessment_id=a.id and x.state='in_progress' and x.expires_at<=now();
    select count(*) into used from public.assessment_sittings s where s.enrollment_id=target_enrollment and s.assessment_id=a.id;
    if used>=a.max_attempts then raise exception 'ASSESSMENT_ATTEMPT_LIMIT' using errcode='22023'; end if;
    insert into public.assessment_sittings(tenant_id,assessment_id,assessment_version_id,enrollment_id,membership_id,attempt_no,expires_at)
      values(target_tenant,a.id,v.id,target_enrollment,member,used+1,now()+make_interval(mins=>a.time_limit_minutes)) returning * into sitting;
  end if;
  return query select sitting.id,sitting.attempt_no,sitting.expires_at,coalesce((select jsonb_agg(jsonb_build_object('id',q.id,'position',q.position,'kind',q.kind,'prompt',q.prompt,'options',q.options,'points',q.points) order by q.position) from public.assessment_questions q where q.assessment_version_id=sitting.assessment_version_id),'[]'::jsonb);
end; $$;

create function public.submit_assessment(target_tenant uuid,target_sitting uuid,answers jsonb,expected_revision integer)
returns table(sitting_id uuid,score numeric,success boolean,attempt_no integer,remaining_attempts integer)
language plpgsql security definer set search_path='' as $$
declare s public.assessment_sittings%rowtype; a public.assessments%rowtype; q public.assessment_questions%rowtype; key jsonb; answer jsonb; earned numeric:=0; total numeric:=0; passed boolean;
begin
  if answers is null or jsonb_typeof(answers)<>'object' or (select count(*) from jsonb_object_keys(answers))>100 then raise exception 'ASSESSMENT_ANSWERS_INVALID' using errcode='22023'; end if;
  select * into s from public.assessment_sittings x where x.tenant_id=target_tenant and x.id=target_sitting for update;
  if s.id is null or not private.owns_enrollment(target_tenant,s.enrollment_id) then raise exception 'ASSESSMENT_SITTING_FORBIDDEN' using errcode='42501'; end if;
  if s.revision<>expected_revision then raise exception 'REVISION_CONFLICT' using errcode='40001'; end if;
  if s.state<>'in_progress' or s.expires_at<=now() then raise exception 'ASSESSMENT_SITTING_CLOSED' using errcode='22023'; end if;
  select * into a from public.assessments x where x.id=s.assessment_id;
  for q in select * from public.assessment_questions x where x.assessment_version_id=s.assessment_version_id order by x.position loop
    select k.correct_answer into key from private.assessment_answer_keys k where k.question_id=q.id;
    answer:=answers -> q.id::text; total:=total+q.points;
    if answer is not null and answer=key then earned:=earned+q.points; end if;
    insert into public.assessment_responses(tenant_id,sitting_id,question_id,answer,is_correct,awarded_points)
      values(target_tenant,s.id,q.id,coalesce(answer,'null'::jsonb),answer is not null and answer=key,case when answer is not null and answer=key then q.points else 0 end);
  end loop;
  s.score:=round(case when total=0 then 0 else earned*100/total end,2); passed:=s.score>=a.pass_score;
  update public.assessment_sittings x set state='submitted',submitted_at=now(),score=s.score,success=passed,revision=x.revision+1 where x.id=s.id returning * into s;
  update public.enrollments e set score=greatest(coalesce(e.score,0),s.score),last_activity_at=now(),revision=e.revision+1 where e.id=s.enrollment_id;
  insert into public.audit_events(tenant_id,actor_user_id,acting_role,action,resource_kind,resource_id,redacted_diff)
    values(target_tenant,(select auth.uid()),'learner','assessment.submitted','assessment_sitting',s.id,jsonb_build_object('score',s.score,'success',passed,'attempt_no',s.attempt_no));
  return query select s.id,s.score,passed,s.attempt_no,greatest(a.max_attempts-s.attempt_no,0);
end; $$;

revoke all on function public.save_assessment_draft(uuid,uuid,text,text,numeric,integer,integer,jsonb,integer),public.publish_assessment(uuid,uuid,integer),public.begin_assessment(uuid,uuid,uuid),public.submit_assessment(uuid,uuid,jsonb,integer) from public,anon;
grant execute on function public.save_assessment_draft(uuid,uuid,text,text,numeric,integer,integer,jsonb,integer),public.publish_assessment(uuid,uuid,integer),public.begin_assessment(uuid,uuid,uuid),public.submit_assessment(uuid,uuid,jsonb,integer) to authenticated;

commit;
