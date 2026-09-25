-- Supabase Auth currently emits the $2a$ bcrypt marker for password users.
begin;
update auth.users
set encrypted_password='$2a$'||substring(encrypted_password from 5),updated_at=now()
where id::text like 'a1000000-0000-4000-8000-00000000000%' and encrypted_password like '$2b$%';
commit;