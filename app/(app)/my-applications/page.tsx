import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Application, ApplicationStatus, Job } from "@/lib/types";
import { SHIFT_LABEL } from "@/lib/types";

type ApplicationWithJob = Application & { jobs: Job | null };

export default async function MyApplicationsPage() {
  const session = await requireSession();
  const supabase = await createClient();

  const { data } = await supabase
    .from("applications")
    .select("*, jobs(*)")
    .eq("applicant_company_id", session.company.id)
    .order("created_at", { ascending: false });

  const applications = (data ?? []) as ApplicationWithJob[];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-white">応募履歴</h1>
        <Link
          href="/jobs"
          className="bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium px-4 py-2 rounded"
        >
          案件を探す
        </Link>
      </div>

      {applications.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {applications.map((app) => (
            <ApplicationCard key={app.id} application={app} />
          ))}
        </div>
      ) : (
        <div className="bg-slate-800 border border-dashed border-slate-700 rounded-lg p-10 text-center text-sm text-slate-400">
          まだ応募した案件はありません。
        </div>
      )}
    </div>
  );
}

function ApplicationCard({ application }: { application: ApplicationWithJob }) {
  const job = application.jobs;

  if (!job) {
    return (
      <div className="block bg-slate-800 border border-slate-700 rounded-lg p-4 opacity-60">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-slate-300 line-clamp-1">
            （削除された案件）
          </h3>
          <ApplicationStatusBadge status={application.status} />
        </div>
        <p className="text-xs text-slate-400">
          応募日: {formatDateTime(application.created_at)}
        </p>
      </div>
    );
  }

  return (
    <Link
      href={`/jobs/${job.id}`}
      className="block bg-slate-800 border border-slate-700 rounded-lg p-4 hover:border-brand-500 hover:shadow-sm transition"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-semibold text-white line-clamp-1">{job.title}</h3>
        <div className="flex items-center gap-1 shrink-0">
          {job.shift_type && (
            <span className="text-xs px-2 py-0.5 rounded border bg-slate-700 text-slate-200 border-slate-600">
              {SHIFT_LABEL[job.shift_type]}
            </span>
          )}
          <ApplicationStatusBadge status={application.status} />
        </div>
      </div>
      <dl className="text-sm text-slate-200 space-y-1">
        <Row label="日時">
          {job.work_date ? formatDate(job.work_date) : "未定"}
          {job.start_time && job.end_time
            ? ` ${job.start_time.slice(0, 5)}〜${job.end_time.slice(0, 5)}`
            : ""}
        </Row>
        <Row label="場所">
          {[job.prefecture, job.location].filter(Boolean).join(" ") || "-"}
        </Row>
        <Row label="応募人数">{application.offered_count} 名</Row>
        {application.note && <Row label="メモ">{application.note}</Row>}
      </dl>
      <p className="mt-2 text-xs text-slate-400">
        応募日: {formatDateTime(application.created_at)}
      </p>
    </Link>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-2">
      <dt className="text-slate-400 w-20 shrink-0">{label}</dt>
      <dd className="min-w-0 truncate">{children}</dd>
    </div>
  );
}

function ApplicationStatusBadge({ status }: { status: ApplicationStatus }) {
  const map: Record<ApplicationStatus, { label: string; cls: string }> = {
    pending: {
      label: "処理中",
      cls: "bg-amber-500/15 text-amber-300 border-amber-800",
    },
    accepted: {
      label: "マッチング成立",
      cls: "bg-emerald-500/15 text-emerald-300 border-emerald-800",
    },
    rejected: {
      label: "破談",
      cls: "bg-slate-700 text-slate-400 border-slate-600",
    },
  };
  const s = map[status];
  return (
    <span className={`text-xs px-2 py-0.5 rounded border ${s.cls} shrink-0`}>
      {s.label}
    </span>
  );
}

function formatDate(d: string) {
  const date = new Date(d);
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function formatDateTime(d: string) {
  const date = new Date(d);
  return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}
