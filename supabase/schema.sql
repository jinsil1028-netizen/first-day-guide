create table public.guide_links (
  id uuid primary key default gen_random_uuid(),
  encrypted_guide text not null check (octet_length(encrypted_guide) between 38 and 4100000),
  created_at timestamptz not null default now()
);

alter table public.guide_links enable row level security;
revoke all on public.guide_links from public, anon, authenticated;
grant select, insert on public.guide_links to service_role;
create index guide_links_created_at_idx on public.guide_links (created_at);

create function public.save_guide_link(envelope text)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  guide_id uuid;
begin
  -- Serialize the quota check and insert so concurrent requests cannot exceed the limits.
  perform pg_advisory_xact_lock(901726443);
  if pg_total_relation_size('public.guide_links'::regclass) + octet_length(envelope) > 209715200
     or (select count(*) from public.guide_links where created_at >= now() - interval '1 minute') >= 60
  then
    raise sqlstate 'PT429' using message = 'Guide storage limit reached';
  end if;

  insert into public.guide_links (encrypted_guide)
  values (envelope)
  returning id into guide_id;
  return guide_id;
end;
$$;

revoke execute on function public.save_guide_link(text) from public, anon, authenticated;
grant execute on function public.save_guide_link(text) to service_role;
