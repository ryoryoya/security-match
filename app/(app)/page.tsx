import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import JobCard from "@/components/job-card";
import type { Job } from "@/lib/types";

export default async function DashboardPage() {
  const session = await requireSession();
  const supabase = await createClient();

  const [
    { data: recentJobs },
    { data: myOpenJobs },
    { count: myFilledCount },
  ] = await Promise.all([
    supabase
      .from("jobs")
      .select("*")
      .eq("status", "open")
      .neq("company_id", session.company.id)
      .order("work_date", { ascending: true })
      .limit(5),
    supabase
      .from("jobs")
      .select("*")
      .eq("company_id", session.company.id)
      .eq("status", "open")
      .order("work_date", { ascending: true })
      .limit(5),
    supabase
      .from("jobs")
      .select("id", { count: "exact", head: true })
      .eq("company_id", session.company.id)
      .eq("status", "filled"),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">
          こんにちは、{session.profile.display_name ?? ""}さん
        </h1>
        <p className="text-sm text-slate-400 mt-1">{session.company.name}</p>
      </div>

      <section className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <StatCard
          label="自社の募集中案件"
          value={(myOpenJobs ?? []).length}
          href="/my-jobs"
        />
        <StatCard
          label="マッチング済み案件"
          value={myFilledCount ?? 0}
          href="/my-jobs"
        />
        <StatCard
          label="公開中の他社案件"
          value={(recentJobs ?? []).length}
          href="/jobs"
        />
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-white">
            最新の他社案件
          </h2>
          <Link
            href="/jobs"
            className="text-sm text-brand-300 hover:underline"
          >
            すべて見る →
          </Link>
        </div>
        {recentJobs && recentJobs.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2">
            {(recentJobs as Job[]).map((j) => (
              <JobCard key={j.id} job={j} />
            ))}
          </div>
        ) : (
          <EmptyCard>現在、他社からの募集案件はありません。</EmptyCard>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold text-white mb-3">
          自社の募集中案件
        </h2>
        {myOpenJobs && myOpenJobs.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2">
            {(myOpenJobs as Job[]).map((j) => (
              <JobCard key={j.id} job={j} mine />
            ))}
          </div>
        ) : (
          <EmptyCard>
            募集中の案件はありません。{" "}
            <Link href="/jobs/new" className="text-brand-300 hover:underline">
              案件を投稿する
            </Link>
          </EmptyCard>
        )}
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  href,
}: {
  label: string;
  value: number;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="bg-slate-800 border border-slate-700 rounded-lg p-4 hover:border-brand-500 transition"
    >
      <p className="text-xs text-slate-400">{label}</p>
      <p className="text-2xl font-bold text-white mt-1">{value}</p>
    </Link>
  );
}

function EmptyCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-slate-800 border border-dashed border-slate-700 rounded-lg p-6 text-center text-sm text-slate-400">
      {children}
    </div>
  );
}
