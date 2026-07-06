-- 設定画面のプロフィール更新（通知先メール等）が "permission denied for table profiles"
-- になっていた原因。authenticated ロールに UPDATE の GRANT が欠けていたため付与する。
-- RLS の profiles_update_self (id = auth.uid()) により自分の行のみ更新可。
GRANT UPDATE ON public.profiles TO authenticated;
