-- anon（未ログイン）ロールには profiles への書き込みは不要。RLS に加え
-- テーブルレベルでも書き込み権限を剥がしておく。
REVOKE INSERT, UPDATE, DELETE ON public.profiles FROM anon;
