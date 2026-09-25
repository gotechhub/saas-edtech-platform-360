-- Public tenant profile names for role-scoped member directories.
begin;
alter table public.memberships add column if not exists display_name text;
update public.memberships set display_name=case id
 when 'e1000000-0000-4000-8000-000000000001' then 'Ayşe Demir'
 when 'e1000000-0000-4000-8000-000000000002' then 'Prof. Dr. Kerem Aydın'
 when 'e1000000-0000-4000-8000-000000000003' then 'Selin Kaya'
 when 'e1000000-0000-4000-8000-000000000004' then 'Mert Yılmaz'
 when 'e1000000-0000-4000-8000-000000000005' then 'Derya Çetin'
 when 'e1000000-0000-4000-8000-000000000006' then 'Oguz Law Academy Yöneticisi'
 else display_name end
where tenant_id='c1000000-0000-4000-8000-000000000001';
alter table public.memberships add constraint memberships_display_name_length check(display_name is null or length(display_name) between 2 and 160) not valid;
alter table public.memberships validate constraint memberships_display_name_length;
commit;