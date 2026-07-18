begin;

-- A Super Admin may permanently delete a resource immediately from the admin
-- panel. The Edge Function still requires an AAL2 session and an exact
-- `DELETE <resource-id>` confirmation before this service-role-only boundary
-- can be reached.
create or replace function public.permanently_delete_resource(
  target_resource_id uuid,
  actor_user_id uuid,
  supplied_storage_objects jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  resource_record public.resources%rowtype;
  job_id uuid;
begin
  if auth.role() <> 'service_role' then
    raise exception using errcode = '42501', message = 'Service role is required';
  end if;

  if jsonb_typeof(supplied_storage_objects) <> 'array'
     or not exists (
       select 1
       from public.user_roles
       join public.profiles on profiles.id = user_roles.user_id
       where user_roles.user_id = actor_user_id
         and user_roles.role = 'super_admin'::public.app_role
         and profiles.account_status = 'active'::public.account_status
     ) then
    raise exception using errcode = '42501', message = 'An active super administrator is required';
  end if;

  select *
  into resource_record
  from public.resources
  where id = target_resource_id
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'Resource was not found';
  end if;

  insert into public.resource_deletion_jobs(resource_id, actor_id, storage_objects)
  values (target_resource_id, actor_user_id, supplied_storage_objects)
  returning id into job_id;

  insert into public.audit_events(
    campus_id,
    actor_id,
    action,
    entity_type,
    entity_id,
    metadata
  )
  values (
    resource_record.campus_id,
    actor_user_id,
    'resource.permanently_deleted',
    'resource',
    target_resource_id,
    jsonb_build_object(
      'cleanup_job_id', job_id,
      'previous_status', resource_record.status,
      'authorized_role', 'super_admin',
      'immediate_deletion', true
    )
  );

  delete from public.resources where id = target_resource_id;
  return job_id;
end;
$$;

revoke all on function public.permanently_delete_resource(uuid,uuid,jsonb)
from public, anon, authenticated;
grant execute on function public.permanently_delete_resource(uuid,uuid,jsonb)
to service_role;

comment on function public.permanently_delete_resource(uuid,uuid,jsonb) is
  'Immediately and permanently deletes one resource for an active Super Admin through the trusted Edge Function boundary.';

commit;
