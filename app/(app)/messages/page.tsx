import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Company, Job, MessageThread } from "@/lib/types";

export default async function MessagesPage() {
  const session = await requireSession();
  const supabase = await createClient();

  const { data: threads } = await supabase
    .from("message_threads")
    .select("*")
    .or(
      `company_a_id.eq.${session.company.id},company_b_id.eq.${session.company.id}`
    )
    .order("created_at", { ascending: false });

  const threadList = (threads ?? []) as MessageThread[];

  const otherCompanyIds = Array.from(
    new Set(
      threadList.map((t) =>
        t.company_a_id === session.company.id ? t.company_b_id : t.company_a_id
      )
    )
  );
  const jobIds = Array.from(new Set(threadList.map((t) => t.job_id)));

  const { data: companies } = otherCompanyIds.length
    ? await supabase.from("companies").select("*").in("id", otherCompanyIds)
    : { data: [] as Company[] };
  const { data: jobs } = jobIds.length
    ? await supabase.from("jobs").select("id,title,work_date").in("id", jobIds)
    : { data: [] as Pick<Job, "id" | "title" | "work_date">[] };

  const companyMap = new Map(
    ((companies ?? []) as Company[]).map((c) => [c.id, c])
  );
  const jobMap = new Map(
    ((jobs ?? []) as Pick<Job, "id" | "title" | "work_date">[]).map((j) => [
      j.id,
      j,
    ])
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-100">メッセージ</h1>
      {threadList.length > 0 ? (
        <div className="bg-slate-800 border border-slate-700 rounded-lg divide-y divide-slate-700">
          {threadList.map((t) => {
            const otherId =
              t.company_a_id === session.company.id
                ? t.company_b_id
                : t.company_a_id;
            const other = companyMap.get(otherId);
            const job = jobMap.get(t.job_id);
            return (
              <Link
                key={t.id}
                href={`/messages/${t.id}`}
                className="block p-4 hover:bg-slate-700"
              >
                <p className="font-semibold text-slate-100">
                  {other?.name ?? "(会社)"}
                </p>
                <p className="text-sm text-slate-300 mt-1">
                  案件: {job?.title ?? "-"}
                </p>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="bg-slate-800 border border-dashed border-slate-700 rounded-lg p-10 text-center text-sm text-slate-400">
          まだメッセージスレッドはありません。案件の応募承認時に「チャットで連絡」から開始できます。
        </div>
      )}
    </div>
  );
}
