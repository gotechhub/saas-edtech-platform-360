-- Complete required Auth email-user fields for the removable beta identities.
begin;
update auth.users
set confirmation_token='',recovery_token='',email_change='',email_change_token_new='',
    recovery_sent_at=coalesce(recovery_sent_at,now()),last_sign_in_at=coalesce(last_sign_in_at,now()),updated_at=now()
where id in (
 'a1000000-0000-4000-8000-000000000001','a1000000-0000-4000-8000-000000000002',
 'a1000000-0000-4000-8000-000000000003','a1000000-0000-4000-8000-000000000004',
 'a1000000-0000-4000-8000-000000000005'
);
commit;