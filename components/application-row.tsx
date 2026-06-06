"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Application, Company } from "@/lib/types";

export default function ApplicationRow({
  application,
  applicantCompany,
  isJobOwner,
}: {
  application: Application;
  applicantCompany: Company | null;
  isJobOwner: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function updateStatus(status: "accepted" | "rejected") {
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.rpc("update_application_status", {
      p_application_id: application.id,
      p_status: status,
    });
    setLoading(false);
    if (error) {
      alert(error.message);
      return;
    }
    router.refresh();
  }

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
        <StatusPill status={application.status} />
      </div>
      {application.status === "accepted" && applicantCompany && (
        <div className="mt-3 bg-emerald-500/10 border border-emerald-800 rounded p-3 space-y-1">
          <p className="text-xs text-emerald-300 font-medium">担当者連絡先</p>
          <p className="text-sm text-white">
            担当者: {applicantCompany.contact_person ?? "未登録"}
          </p>
          <p className="text-sm text-white">
            電話番号:{" "}
            {applicantCompany.phone ? (
              <a
                href={`tel:${applicantCompany.phone}`}
                className="text-brand-300 hover:underline"
              >
                {applicantCompany.phone}
              </a>
            ) : (
              "未登録"
            )}
          </p>
        </div>
      )}
      {isJobOwner && application.status === "pending" && (
        <div className="flex gap-2 mt-3 flex-wrap">
          <button
            onClick={() => updateStatus("accepted")}
            disabled={loading}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm px-3 py-1.5 rounded disabled:opacity-50"
          >
            承認
          </button>
          <button
            onClick={() => updateStatus("rejected")}
            disabled={loading}
            className="border border-slate-600 text-slate-200 text-sm px-3 py-1.5 rounded hover:bg-slate-700"
          >
            却下
          </button>
        </div>
      )}
    </div>
  );
}

function StatusPill({ status }: { status: Application["status"] }) {
  const map = {
    pending: { label: "承認待ち", cls: "bg-amber-500/15 text-amber-200 border-amber-800" },
    accepted: { label: "承認済み", cls: "bg-emerald-500/15 text-emerald-300 border-emerald-800" },
    rejected: { label: "却下", cls: "bg-slate-700 text-slate-400 border-slate-600" },
  } as const;
  const s = map[status];
  return (
    <span className={`text-xs border rounded px-2 py-0.5 shrink-0 ${s.cls}`}>
      {s.label}
    </span>
  );
}
