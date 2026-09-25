-- Normalize beta identities to the current Supabase email identity shape.
begin;
update auth.users
set confirmation_token='',recovery_token='',email_change='',email_change_token_new='',email_change_token_current='',
    phone_change='',phone_change_token='',reauthentication_token='',
    is_super_admin=false,is_sso_user=false,is_anonymous=false,email_change_confirm_status=0,updated_at=now()
where id::text like 'a1000000-0000-4000-8000-00000000000%';
delete from auth.identities where user_id::text like 'a1000000-0000-4000-8000-00000000000%';
insert into auth.identities(id,provider_id,user_id,identity_data,provider,last_sign_in_at,created_at,updated_at)
select u.id,u.id::text,u.id,jsonb_build_object('sub',u.id::text,'email',u.email,'email_verified',true,'phone_verified',false),'email',now(),now(),now()
from auth.users u where u.id::text like 'a1000000-0000-4000-8000-00000000000%';
commit;