"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Application } from "@/lib/types";

interface Toast {
  id: string;
  jobId: string;
  jobTitle: string;
  applicantName: string;
}

/**
 * Mounted once in the (app) layout. Subscribes to applications INSERTs and
 * shows a toast when a new application arrives for one of our own jobs.
 *
 * RLS lets both the applicant company and the job-owner company SELECT the
 * row, so realtime delivers the INSERT to both. We filter client-side: if
 * applicant_company_id is our own, we made it, so ignore.
 */
export default function RealtimeNotifier({
  myCompanyId,
}: {
  myCompanyId: string;
}) {
  const router = useRouter();
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`applications:notify:${myCompanyId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "applications" },
        async (payload) => {
          const app = payload.new as Application;
          // Skip our own applications (we are the applicant, not the recipient).
          if (app.applicant_company_id === myCompanyId) return;

          // Fetch job + applicant for the toast body. RLS already guarantees
          // we only receive rows for jobs we own, so this lookup is safe.
          const [{ data: job }, { data: company }] = await Promise.all([
            supabase
              .from("jobs")
              .select("id,title,company_id")
              .eq("id", app.job_id)
              .maybeSingle(),
            supabase
              .from("companies")
              .select("name")
              .eq("id", app.applicant_company_id)
              .maybeSingle(),
          ]);

          // Extra safety net: only notify when the job is ours.
          if (!job || job.company_id !== myCompanyId) return;

          const toast: Toast = {
            id: app.id,
            jobId: job.id,
            jobTitle: job.title,
            applicantName: company?.name ?? "他社",
          };
          setToasts((prev) => [...prev, toast]);
          setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== toast.id));
          }, 8000);

          // Refresh server components so the sidebar badge and any visible
          // application lists pick up the new row.
          router.refresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [myCompanyId, router]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map((t) => (
        <Link
          key={t.id}
          href={`/jobs/${t.jobId}`}
          onClick={() =>
            setToasts((prev) => prev.filter((x) => x.id !== t.id))
          }
          className="block bg-slate-800 border border-brand-500 rounded-lg shadow-lg px-4 py-3 hover:bg-slate-700"
        >
          <p className="text-xs text-brand-300 font-medium">新着応募</p>
          <p className="text-sm text-white font-semibold mt-0.5 truncate">
            {t.applicantName}
          </p>
          <p className="text-xs text-slate-300 mt-0.5 truncate">
            案件: {t.jobTitle}
          </p>
        </Link>
      ))}
    </div>
  );
}
