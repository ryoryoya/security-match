-- 出張など複数日案件の作業期間に対応するため終了日カラムを追加。
-- 単日案件では null（work_date が作業日）。
ALTER TABLE public.jobs ADD COLUMN work_end_date date;

COMMENT ON COLUMN public.jobs.work_end_date IS '出張など複数日案件の終了日。単日案件では null（work_date が作業日）。';

ALTER TABLE public.jobs ADD CONSTRAINT jobs_work_end_date_after_start
  CHECK (work_end_date IS NULL OR work_date IS NULL OR work_end_date >= work_date);
