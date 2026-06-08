import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Job } from "@/lib/types";
import JobCard from "@/components/job-card";

export default async function MyJobsPage() {
  const session = await requireSession();
  const supabase = await createClient();
  const { data: jobs } = await supabase
    .from("jobs")
    .select("*")
    .eq("company_id", session.company.id)
    .order("work_date", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-white">自社投稿案件</h1>
        <Link
          href="/jobs/new"
          className="bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium px-4 py-2 rounded"
        >
          + 新規募集
        </Link>
      </div>

      {jobs && jobs.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {(jobs as Job[]).map((j) => (
            <JobCard key={j.id} job={j} mine />
          ))}
        </div>
      ) : (
        <div className="bg-slate-800 border border-dashed border-slate-700 rounded-lg p-10 text-center text-sm text-slate-400">
          まだ自社案件はありません。
        </div>
      )}
    </div>
  );
}
