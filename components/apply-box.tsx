"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Application } from "@/lib/types";

export default function ApplyBox({
  jobId,
  companyId,
  existing,
}: {
  jobId: string;
  companyId: string;
  existing: Application | null;
}) {
  const router = useRouter();
  const [offered, setOffered] = useState(existing?.offered_count ?? 1);
  const [note, setNote] = useState(existing?.note ?? "");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    setError(null);
    setLoading(true);
    const supabase = createClient();
    // Split payloads: INSERT carries identity, UPDATE only the editable fields.
    // Authenticated role no longer has GRANT UPDATE on job_id / applicant_company_id
    // (security hardening), so including them in UPDATE would 403.
    const { error } = existing
      ? await supabase
          .from("applications")
          .update({ offered_count: offered, note })
          .eq("id", existing.id)
      : await supabase.from("applications").insert({
          job_id: jobId,
          applicant_company_id: companyId,
          offered_count: offered,
          note,
        });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.refresh();
  }

  async function cancel() {
    if (!existing) return;
    if (!confirm("応募を取り消しますか？")) return;
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("applications")
      .delete()
      .eq("id", existing.id);
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.refresh();
  }

  return (
    <section className="bg-sky-500/10 border border-sky-800 rounded-lg p-6">
      <h2 className="text-lg font-semibold text-brand-300 mb-1">
        {existing ? "応募内容を更新" : "この案件に応募する"}
      </h2>
      {existing && (
        <p className="text-xs text-brand-300 mb-3">
          現在の状態: {statusLabel(existing.status)}
        </p>
      )}
      <div className="space-y-3">
        <div>
          <label className="block text-sm text-slate-200 mb-1">
            出せる人数
          </label>
          <input
            type="number"
            min={1}
            value={offered}
            onChange={(e) => setOffered(parseInt(e.target.value, 10) || 1)}
            className="w-32 rounded-md border border-slate-600 bg-slate-800 text-slate-100 placeholder:text-slate-500 px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm text-slate-200 mb-1">一言メモ</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            className="w-full rounded-md border border-slate-600 bg-slate-800 text-slate-100 placeholder:text-slate-500 px-3 py-2"
            placeholder="例: 交通誘導2級保有者2名出せます"
          />
        </div>
        {error && (
          <p className="text-sm text-red-300 bg-red-500/10 border border-red-800 rounded px-3 py-2">
            {error}
          </p>
        )}
        <div className="flex gap-2">
          <button
            onClick={submit}
            disabled={loading}
            className="bg-brand-500 hover:bg-brand-600 text-white font-medium px-4 py-2 rounded disabled:opacity-50"
          >
            {loading ? "送信中..." : existing ? "更新" : "応募する"}
          </button>
          {existing && (
            <button
              onClick={cancel}
              disabled={loading}
              className="border border-red-800 text-red-300 px-4 py-2 rounded hover:bg-red-500/10"
            >
              応募取消
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

function statusLabel(s: Application["status"]) {
  return { pending: "承認待ち", accepted: "承認済み", rejected: "却下" }[s];
}
