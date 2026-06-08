-- 終了案件（work_date が過ぎた案件）を 90 日経過後に自動削除する。
-- pg_cron で毎日 03:00 (UTC) に実行。
--
-- 適用方法:
--   Supabase Dashboard の SQL Editor で実行するか、
--   `supabase db push` で適用してください。

-- 1. pg_cron 拡張を有効化
create extension if not exists pg_cron with schema extensions;

-- 2. 古い終了案件を削除する関数
create or replace function public.delete_expired_jobs()
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.jobs
  where work_date is not null
    and work_date < (current_date - interval '90 days')::date;
$$;

-- 3. 既存の同名ジョブがあれば一旦解除（再適用のため）
do $$
begin
  perform cron.unschedule('delete-expired-jobs');
exception
  when others then null;
end$$;

-- 4. 毎日 03:00 UTC に delete_expired_jobs を実行
select cron.schedule(
  'delete-expired-jobs',
  '0 3 * * *',
  $$select public.delete_expired_jobs();$$
);
