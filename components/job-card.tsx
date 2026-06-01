import Link from "next/link";
import type { Job } from "@/lib/types";

export default function JobCard({
  job,
  mine = false,
}: {
  job: Job;
  mine?: boolean;
}) {
  return (
    <Link
      href={`/jobs/${job.id}`}
      className="block bg-white border border-slate-200 rounded-lg p-4 hover:border-brand-500 hover:shadow-sm transition"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-semibold text-slate-900 line-clamp-1">
          {job.title}
        </h3>
        <div className="flex items-center gap-1 shrink-0">
          {job.status === "open" && isUrgent(job) && <UrgentBadge />}
          <StatusBadge status={job.status} />
        </div>
      </div>
      <dl className="text-sm text-slate-600 space-y-1">
        <Row label="日時">
          {formatDate(job.work_date)}
          {job.start_time && job.end_time
            ? ` ${job.start_time.slice(0, 5)}〜${job.end_time.slice(0, 5)}`
            : ""}
        </Row>
        <Row label="場所">
          {[job.prefecture, job.location].filter(Boolean).join(" ") || "-"}
        </Row>
        <Row label="必要人数">{job.required_count} 名</Row>
        <Row label="単価">
          ¥{job.unit_price.toLocaleString()}
          {job.price_type === "hourly" ? " / 時" : " / 日"}
        </Row>
      </dl>
      {mine && (
        <p className="mt-2 text-xs text-brand-600">自社投稿</p>
      )}
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
      <dt className="text-slate-500 w-16 shrink-0">{label}</dt>
      <dd className="min-w-0 truncate">{children}</dd>
    </div>
  );
}

function StatusBadge({ status }: { status: Job["status"] }) {
  const map: Record<Job["status"], { label: string; cls: string }> = {
    open: { label: "募集中", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    filled: { label: "マッチング済み", cls: "bg-sky-50 text-sky-700 border-sky-200" },
    closed: { label: "終了", cls: "bg-slate-100 text-slate-500 border-slate-200" },
  };
  const s = map[status];
  return (
    <span
      className={`text-xs px-2 py-0.5 rounded border ${s.cls} shrink-0`}
    >
      {s.label}
    </span>
  );
}

function UrgentBadge() {
  return (
    <span className="text-xs px-2 py-0.5 rounded border bg-red-600 text-white border-red-700 font-semibold animate-pulse shrink-0">
      至急
    </span>
  );
}

export function isUrgent(job: Pick<Job, "work_date" | "start_time">): boolean {
  const start = jobStartDate(job);
  if (!start) return false;
  const diffMs = start.getTime() - Date.now();
  return diffMs > 0 && diffMs <= 24 * 60 * 60 * 1000;
}

function jobStartDate(job: Pick<Job, "work_date" | "start_time">): Date | null {
  if (!job.work_date) return null;
  const time = job.start_time ?? "00:00:00";
  // work_date は YYYY-MM-DD 想定。ローカル時間として解釈する。
  const iso = `${job.work_date}T${time.length === 5 ? time + ":00" : time}`;
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d;
}

function formatDate(d: string) {
  const date = new Date(d);
  return `${date.getMonth() + 1}/${date.getDate()}`;
}
