-- 新規案件投稿（jobs INSERT）時にメール通知を送るためのトリガー。
--
-- 仕組み:
--   jobs への INSERT
--     -> notify_edge_function()（既存。vault の webhook_secret を読み、
--        pg_net で Edge Function `send-notification` に POST する）
--     -> Edge Function が Resend 経由で、ネットワーク内の他社（notification_email
--        を設定済みの profiles）へメール送信する。
--
-- 前提（すでに構築済み）:
--   - Edge Function `send-notification` がデプロイ済み
--   - トリガー関数 public.notify_edge_function() が存在
--   - vault に webhook_secret が登録済み
--   - 拡張 pg_net が有効
--
-- Edge Function 側のシークレット（Supabase Dashboard で要設定）:
--   RESEND_API_KEY, WEBHOOK_SECRET（vault の webhook_secret と一致させる）,
--   FROM_EMAIL（任意）, APP_URL（任意）

drop trigger if exists trg_notify_job_created on public.jobs;

create trigger trg_notify_job_created
  after insert on public.jobs
  for each row
  execute function public.notify_edge_function();
