import Link from "next/link";
import type { Job } from "@/lib/types";
import { isUrgent } from "@/components/job-card";

const GRID_COLS = "md:grid-cols-[7rem_1fr_6rem_8rem_minmax(0,2fr)_7rem]";

export function JobRowHeader() {
  return (
    <div
      className={`hidden md:grid ${GRID_COLS} gap-4 px-4 py-2 text-xs font-medium text-slate-500 border-b border-slate-200`}
    >
      <div>日時</div>
      <div>場所</div>
      <div className="text-right">必要人数</div>
      <div className="text-right">単価</div>
      <div>案件名</div>
      <div className="text-right">状態</div>
    </div>
  );
}

export default function JobRow({
  job,
  mine = false,
}: {
  job: Job;
  mine?: boolean;
}) {
  const urgent = job.status === "open" && isUrgent(job);
  return (
    <Link
      href={`/jobs/${job.id}`}
      className={`group block bg-white border ${
        urgent ? "border-l-4 border-l-red-500" : ""
      } border-slate-200 rounded-lg hover:border-brand-500 hover:shadow-sm transition`}
    >
      <div className={`grid grid-cols-1 ${GRID_COLS} gap-2 md:gap-4 px-4 py-3 md:items-center`}>
        <Cell label="日時">
          <span className="font-medium md:font-normal">{formatDate(job.work_date)}</span>
          {job.start_time && job.end_time && (
            <span className="text-slate-500">
              {" "}
              {job.start_time.slice(0, 5)}〜{job.end_time.slice(0, 5)}
            </span>
          )}
        </Cell>
        <Cell label="場所">
          {[job.prefecture, job.location].filter(Boolean).join(" ") || "-"}
        </Cell>
        <Cell label="必要人数" align="right">
          {job.required_count} 名
        </Cell>
        <Cell label="単価" align="right">
          <span className="font-medium">¥{job.unit_price.toLocaleString()}</span>
          <span className="text-slate-500">
            {job.price_type === "hourly" ? " / 時" : " / 日"}
          </span>
        </Cell>
        <Cell label="案件">
          <span className="font-semibold text-slate-900 line-clamp-1">{job.title}</span>
        </Cell>
        <div className="flex md:justify-end items-center gap-1 flex-wrap">
          {urgent && (
            <span className="text-xs px-2 py-0.5 rounded bg-red-600 text-white font-semibold animate-pulse shrink-0">
              至急
            </span>
          )}
          <StatusBadge status={job.status} />
          {mine && (
            <span className="text-xs text-brand-600 shrink-0">自社</span>
          )}
        </div>
      </div>
    </Link>
  );
}

function Cell({
  label,
  align,
  children,
}: {
  label: string;
  align?: "right";
  children: React.ReactNode;
}) {
  return (
    <div
      className={`text-sm text-slate-700 min-w-0 ${
        align === "right" ? "md:text-right" : ""
      }`}
    >
      <span className="md:hidden text-xs text-slate-500 mr-1">{label}:</span>
      <span className="break-words md:truncate md:block">{children}</span>
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
    <span className={`text-xs px-2 py-0.5 rounded border shrink-0 ${s.cls}`}>
      {s.label}
    </span>
  );
}

function formatDate(d: string) {
  const date = new Date(d);
  return `${date.getMonth() + 1}/${date.getDate()}`;
}
