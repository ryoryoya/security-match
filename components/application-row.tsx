"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Application, Company } from "@/lib/types";

export default function ApplicationRow({
  application,
  applicantCompany,
  isJobOwner,
  jobId,
  jobOwnerCompanyId,
}: {
  application: Application;
  applicantCompany: Company | null;
  isJobOwner: boolean;
  jobId: string;
  jobOwnerCompanyId: string;
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

  async function startChat() {
    if (!applicantCompany) return;
    setLoading(true);
    const supabase = createClient();

    // Deterministic pair ordering so (A,B) and (B,A) don't create duplicates.
    const a = jobOwnerCompanyId < applicantCompany.id ? jobOwnerCompanyId : applicantCompany.id;
    const b = jobOwnerCompanyId < applicantCompany.id ? applicantCompany.id : jobOwnerCompanyId;

    // Try to find an existing thread first
    const { data: existing } = await supabase
      .from("message_threads")
      .select("id")
      .eq("job_id", jobId)
      .eq("company_a_id", a)
      .eq("company_b_id", b)
      .maybeSingle();

    let threadId = existing?.id;
    if (!threadId) {
      const { data, error } = await supabase
        .from("message_threads")
        .insert({ job_id: jobId, company_a_id: a, company_b_id: b })
        .select("id")
        .single();
      if (error) {
        setLoading(false);
        alert(error.message);
        return;
      }
      threadId = data.id;
    }
    setLoading(false);
    router.push(`/messages/${threadId}`);
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
      {isJobOwner && (
        <div className="flex gap-2 mt-3 flex-wrap">
          {application.status === "pending" && (
            <>
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
            </>
          )}
          <button
            onClick={startChat}
            disabled={loading}
            className="border border-brand-500 text-brand-300 text-sm px-3 py-1.5 rounded hover:bg-sky-500/10"
          >
            チャットで連絡
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
