-- Keep contributor identifiers private while allowing the MFA-protected admin
-- resource manager to search and paginate resources without direct owner_id
-- column privileges.

begin;

create or replace function public.list_admin_resources(
  search_query text,
  status_filter public.resource_status,
  program_filter uuid,
  term_filter uuid,
  subject_filter uuid,
  contributor_filter uuid,
  created_from timestamptz,
  created_to timestamptz,
  sort_by text,
  page_number integer,
  page_size integer
)
returns table (
  id uuid,
  title text,
  status public.resource_status,
  created_at timestamptz,
  program_id uuid,
  term_id uuid,
  subject_id uuid,
  owner_id uuid,
  download_count bigint,
  total_count bigint
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null or not public.is_platform_admin() then
    raise exception using errcode = '42501', message = 'Administrator role with MFA is required';
  end if;

  if page_number < 1 or page_size < 1 or page_size > 50 then
    raise exception using errcode = '22023', message = 'Invalid pagination';
  end if;
  if sort_by not in ('recent', 'oldest', 'title', 'popular') then
    raise exception using errcode = '22023', message = 'Invalid sort order';
  end if;

  return query
  select
    resources.id,
    resources.title,
    resources.status,
    resources.created_at,
    resources.program_id,
    resources.term_id,
    resources.subject_id,
    resources.owner_id,
    resources.download_count,
    count(*) over() as total_count
  from public.resources
  where (nullif(trim(search_query), '') is null or resources.title ilike '%' || trim(search_query) || '%')
    and (status_filter is null or resources.status = status_filter)
    and (program_filter is null or resources.program_id = program_filter)
    and (term_filter is null or resources.term_id = term_filter)
    and (subject_filter is null or resources.subject_id = subject_filter)
    and (contributor_filter is null or resources.owner_id = contributor_filter)
    and (created_from is null or resources.created_at >= created_from)
    and (created_to is null or resources.created_at < created_to)
  order by
    case when sort_by = 'title' then lower(resources.title) end asc,
    case when sort_by = 'oldest' then resources.created_at end asc,
    case when sort_by = 'popular' then resources.download_count end desc,
    case when sort_by in ('recent', 'popular') then resources.created_at end desc,
    resources.id asc
  offset ((page_number - 1) * page_size)
  limit page_size;
end;
$$;

revoke all on function public.list_admin_resources(text,public.resource_status,uuid,uuid,uuid,uuid,timestamptz,timestamptz,text,integer,integer) from public, anon;
grant execute on function public.list_admin_resources(text,public.resource_status,uuid,uuid,uuid,uuid,timestamptz,timestamptz,text,integer,integer) to authenticated;

comment on function public.list_admin_resources(text,public.resource_status,uuid,uuid,uuid,uuid,timestamptz,timestamptz,text,integer,integer) is
  'MFA-protected admin resource listing that does not expose owner_id through browser table grants.';

commit;
