import type { Application, Company, Profile } from "@/lib/types";

export default function ApplicationRow({
  application,
  applicantCompany,
  applicantProfile,
}: {
  application: Application;
  applicantCompany: Company | null;
  applicantProfile: Profile | null;
}) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-white">
            {applicantCompany?.name ?? "(不明な会社)"}
          </p>
          <p className="text-sm text-slate-200 mt-1">
            出せる人数: <strong>{application.offered_count} 名</strong>
          </p>
          {application.note && (
            <p className="text-sm text-slate-200 mt-1 whitespace-pre-wrap">
              {application.note}
            </p>
          )}
        </div>
        <span className="text-xs border rounded px-2 py-0.5 shrink-0 bg-emerald-500/15 text-emerald-300 border-emerald-800">
          マッチング成立
        </span>
      </div>
      <div className="mt-3 bg-emerald-500/10 border border-emerald-800 rounded p-3 space-y-1">
        <p className="text-xs text-emerald-300 font-medium">担当者連絡先</p>
        <p className="text-sm text-white">
          担当者: {applicantProfile?.display_name ?? "未登録"}
        </p>
        <p className="text-sm text-white">
          電話番号:{" "}
          {applicantProfile?.phone ? (
            <a
              href={`tel:${applicantProfile.phone}`}
              className="text-brand-300 hover:underline"
            >
              {applicantProfile.phone}
            </a>
          ) : (
            "未登録"
          )}
        </p>
      </div>
    </div>
  );
}
