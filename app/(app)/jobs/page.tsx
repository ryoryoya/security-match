import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireSession } from "@/lib/auth";
import JobCard from "@/components/job-card";
import type { Job } from "@/lib/types";
import { PREFECTURES } from "@/lib/types";

export default async function JobsListPage({
  searchParams,
}: {
  searchParams: Promise<{ prefecture?: string; status?: string }>;
}) {
  await requireSession();
  const supabase = await createClient();
  const sp = await searchParams;

  let query = supabase
    .from("jobs")
    .select("*")
    .order("work_date", { ascending: true });

  if (sp.prefecture) query = query.eq("prefecture", sp.prefecture);
  query = query.eq("status", sp.status ?? "open");

  const { data: jobs, error } = await query;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-slate-900">案件一覧</h1>
        <Link
          href="/jobs/new"
          className="bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium px-4 py-2 rounded-md transition"
        >
          + 案件を投稿
        </Link>
      </div>

      <form
        method="get"
        className="bg-white border border-slate-200 rounded-lg p-4 flex flex-wrap gap-3"
      >
        <div>
          <label className="block text-xs text-slate-500 mb-1">都道府県</label>
          <select
            name="prefecture"
            defaultValue={sp.prefecture ?? ""}
            className="rounded border border-slate-300 px-3 py-1.5 text-sm bg-white"
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
          <label className="block text-xs text-slate-500 mb-1">
            ステータス
          </label>
          <select
            name="status"
            defaultValue={sp.status ?? "open"}
            className="rounded border border-slate-300 px-3 py-1.5 text-sm bg-white"
          >
            <option value="open">募集中</option>
            <option value="filled">マッチング済み</option>
            <option value="closed">終了</option>
          </select>
        </div>
        <div className="flex items-end">
          <button
            type="submit"
            className="bg-slate-900 text-white text-sm px-4 py-1.5 rounded hover:bg-slate-700"
          >
            絞り込み
          </button>
        </div>
      </form>

      {error && <p className="text-sm text-red-600">{error.message}</p>}

      {jobs && jobs.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {(jobs as Job[]).map((j) => (
            <JobCard key={j.id} job={j} />
          ))}
        </div>
      ) : (
        <div className="bg-white border border-dashed border-slate-300 rounded-lg p-10 text-center text-sm text-slate-500">
          条件に合う案件はまだありません。
        </div>
      )}
    </div>
  );
}
