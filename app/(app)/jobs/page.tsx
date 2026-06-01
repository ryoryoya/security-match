import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireSession } from "@/lib/auth";
import JobRow, { JobRowHeader } from "@/components/job-row";
import type { Job } from "@/lib/types";
import { PREFECTURES } from "@/lib/types";

type Sort = "date_asc" | "price_desc" | "created_desc";

const SORTS: { value: Sort; label: string }[] = [
  { value: "date_asc", label: "日付の近い順" },
  { value: "price_desc", label: "単価の高い順" },
  { value: "created_desc", label: "新着順" },
];

export default async function JobsListPage({
  searchParams,
}: {
  searchParams: Promise<{ prefecture?: string; status?: string; sort?: string }>;
}) {
  await requireSession();
  const supabase = await createClient();
  const sp = await searchParams;

  const sort: Sort = SORTS.some((s) => s.value === sp.sort)
    ? (sp.sort as Sort)
    : "date_asc";

  let query = supabase.from("jobs").select("*");
  if (sp.prefecture) query = query.eq("prefecture", sp.prefecture);
  query = query.eq("status", sp.status ?? "open");

  if (sort === "price_desc") {
    query = query.order("unit_price", { ascending: false });
  } else if (sort === "created_desc") {
    query = query.order("created_at", { ascending: false });
  } else {
    query = query
      .order("work_date", { ascending: true })
      .order("start_time", { ascending: true, nullsFirst: false });
  }

  const { data: jobs, error } = await query;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-white">案件一覧</h1>
        <Link
          href="/jobs/new"
          className="bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium px-4 py-2 rounded-md transition"
        >
          + 案件を投稿
        </Link>
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
            className="rounded border border-slate-600 px-3 py-1.5 text-sm bg-slate-800 text-white"
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
          <label className="block text-xs text-slate-400 mb-1">
            ステータス
          </label>
          <select
            name="status"
            defaultValue={sp.status ?? "open"}
            className="rounded border border-slate-600 px-3 py-1.5 text-sm bg-slate-800 text-white"
          >
            <option value="open">募集中</option>
            <option value="filled">マッチング済み</option>
            <option value="closed">終了</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">並び順</label>
          <select
            name="sort"
            defaultValue={sort}
            className="rounded border border-slate-600 px-3 py-1.5 text-sm bg-slate-800 text-white"
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
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
          条件に合う案件はまだありません。
        </div>
      )}
    </div>
  );
}
