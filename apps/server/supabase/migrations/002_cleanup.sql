-- AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
-- Housekeeping: delete demo sessions not seen for 7 days. Their rows (readings, symptoms, routine events, alerts
-- and actions, reports) go with them through ON DELETE CASCADE. Scheduled daily with pg_cron when the extension
-- is available; otherwise run `select public.delete_stale_sessions();` by hand.
-- Run once in the Supabase SQL editor (project NASA_Space_Apps).

create or replace function public.delete_stale_sessions()
returns integer
language sql
security definer
set search_path = public
as $$
  with gone as (
    delete from public.sessions
    where last_seen_at < now() - interval '7 days'
    returning 1
  )
  select count(*)::integer from gone;
$$;

-- Only the server (service role) and the scheduler may run it.
revoke all on function public.delete_stale_sessions() from public, anon, authenticated;

do $$
begin
  if exists (select 1 from pg_available_extensions where name = 'pg_cron') then
    create extension if not exists pg_cron with schema pg_catalog;
    -- Daily at 03:17 UTC. Scheduling again under the same name replaces the job, so this file can be re-run.
    perform cron.schedule('missionvitals-delete-stale-sessions', '17 3 * * *', 'select public.delete_stale_sessions();');
  else
    raise notice 'pg_cron is not available on this database: run select public.delete_stale_sessions(); by hand.';
  end if;
end;
$$;
