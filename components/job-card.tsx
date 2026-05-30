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
        <StatusBadge status={job.status} />
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
    filled: { label: "充足", cls: "bg-slate-100 text-slate-600 border-slate-200" },
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

function formatDate(d: string) {
  const date = new Date(d);
  return `${date.getMonth() + 1}/${date.getDate()}`;
}
