import { createClient } from "@/lib/supabase/server";
import { requireSession } from "@/lib/auth";
import JobRow, { JobRowHeader } from "@/components/job-row";
import type { Job, ShiftType } from "@/lib/types";
import { PREFECTURES, SHIFT_LABEL } from "@/lib/types";

// 終了案件（work_date が過ぎた案件）の一覧。
// 直近 90 日以内のものを新しい順に表示する。
// 90 日を超えたものは pg_cron により DB 側で自動削除される。
export default async function ArchivedJobsPage({
  searchParams,
}: {
  searchParams: Promise<{
    prefecture?: string;
    shift?: string;
  }>;
}) {
  await requireSession();
  const supabase = await createClient();
  const sp = await searchParams;

  const validShifts: ShiftType[] = ["day", "night", "business_trip"];
  const shiftFilter = validShifts.includes(sp.shift as ShiftType)
    ? (sp.shift as ShiftType)
    : undefined;

  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const cutoff = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  let query = supabase
    .from("jobs")
    .select("*")
    .lt("work_date", today)
    .gte("work_date", cutoff);
  if (sp.prefecture) query = query.eq("prefecture", sp.prefecture);
  if (shiftFilter) query = query.eq("shift_type", shiftFilter);
  query = query
    .order("work_date", { ascending: false })
    .order("start_time", { ascending: false, nullsFirst: false });

  const { data: jobs, error } = await query;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-white">過去案件一覧</h1>
        <p className="text-xs text-slate-400">
          作業日が過ぎた案件をここに表示します。90日経過後は自動削除されます。
        </p>
      </div>

      <form
        method="get"
        className="bg-slate-800 border border-slate-700 rounded-lg p-4 flex flex-wrap gap-3"
      >
        <div>
          <label className="block text-xs text-slate-400 mb-1">都道府県</label>
          <select
            name="prefecture"
            defaultValue={sp.prefecture ?? ""}
            className="rounded border border-white px-3 py-1.5 text-sm bg-white text-slate-900"
          >
            <option value="">すべて</option>
            {PREFECTURES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">勤務区分</label>
          <select
            name="shift"
            defaultValue={shiftFilter ?? ""}
            className="rounded border border-white px-3 py-1.5 text-sm bg-white text-slate-900"
          >
            <option value="">すべて</option>
            {(Object.keys(SHIFT_LABEL) as ShiftType[]).map((s) => (
              <option key={s} value={s}>
                {SHIFT_LABEL[s]}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end">
          <button
            type="submit"
            className="bg-slate-700 text-white text-sm px-4 py-1.5 rounded hover:bg-slate-600"
          >
            適用
          </button>
        </div>
      </form>

      {error && <p className="text-sm text-red-300">{error.message}</p>}

      {jobs && jobs.length > 0 ? (
        <div>
          <JobRowHeader />
          <div className="space-y-2 mt-2">
            {(jobs as Job[]).map((j) => (
              <JobRow key={j.id} job={j} />
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-slate-800 border border-dashed border-slate-700 rounded-lg p-10 text-center text-sm text-slate-400">
          直近90日以内の終了案件はありません。
        </div>
      )}
    </div>
  );
}
