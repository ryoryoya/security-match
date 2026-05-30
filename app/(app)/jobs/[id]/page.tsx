import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Application, Company, Job } from "@/lib/types";
import ApplyBox from "@/components/apply-box";
import ApplicationRow from "@/components/application-row";

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireSession();
  const supabase = await createClient();

  const { data: job } = await supabase
    .from("jobs")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!job) notFound();

  const { data: jobCompany } = await supabase
    .from("companies")
    .select("*")
    .eq("id", job.company_id)
    .single();

  const isMine = job.company_id === session.company.id;

  // Only visible if involved (RLS enforces)
  const { data: applications } = await supabase
    .from("applications")
    .select("*")
    .eq("job_id", id)
    .order("created_at", { ascending: false });

  // Companies info for applications (applicant side)
  const applicantIds = Array.from(
    new Set((applications ?? []).map((a) => a.applicant_company_id))
  );
  const { data: applicantCompanies } = applicantIds.length
    ? await supabase.from("companies").select("*").in("id", applicantIds)
    : { data: [] as Company[] };

  const companiesMap = new Map(
    ((applicantCompanies ?? []) as Company[]).map((c) => [c.id, c])
  );

  const myApplication = (applications ?? []).find(
    (a) => a.applicant_company_id === session.company.id
  );

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <p className="text-sm text-slate-500">{(jobCompany as Company)?.name}</p>
        <h1 className="text-2xl font-bold text-slate-900 mt-1">
          {(job as Job).title}
        </h1>
      </div>

      <section className="bg-white border border-slate-200 rounded-lg p-6 space-y-3">
        <Info label="作業日">{formatDate((job as Job).work_date)}</Info>
        <Info label="時間">
          {(job as Job).start_time && (job as Job).end_time
            ? `${(job as Job).start_time!.slice(0, 5)} 〜 ${(job as Job).end_time!.slice(0, 5)}`
            : "未指定"}
        </Info>
        <Info label="場所">
          {[(job as Job).prefecture, (job as Job).location]
            .filter(Boolean)
            .join(" ") || "-"}
        </Info>
        <Info label="必要人数">{(job as Job).required_count} 名</Info>
        <Info label="単価">
          ¥{(job as Job).unit_price.toLocaleString()}
          {(job as Job).price_type === "hourly" ? " / 時" : " / 日"}
        </Info>
        <Info label="ステータス">{statusLabel((job as Job).status)}</Info>
        {(job as Job).description && (
          <div>
            <p className="text-sm text-slate-500 mb-1">業務詳細</p>
            <p className="whitespace-pre-wrap text-sm text-slate-700">
              {(job as Job).description}
            </p>
          </div>
        )}
      </section>

      {!isMine && (job as Job).status === "open" && (
        <ApplyBox
          jobId={(job as Job).id}
          companyId={session.company.id}
          existing={myApplication ?? null}
        />
      )}

      {isMine && (
        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-3">
            応募一覧 ({(applications ?? []).length})
          </h2>
          {applications && applications.length > 0 ? (
            <div className="space-y-3">
              {(applications as Application[]).map((app) => (
                <ApplicationRow
                  key={app.id}
                  application={app}
                  applicantCompany={
                    companiesMap.get(app.applicant_company_id) ?? null
                  }
                  isJobOwner
                  jobId={(job as Job).id}
                  jobOwnerCompanyId={(job as Job).company_id}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white border border-dashed border-slate-300 rounded-lg p-8 text-center text-sm text-slate-500">
              まだ応募はありません。
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function Info({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3">
      <dt className="text-sm text-slate-500 w-20 shrink-0">{label}</dt>
      <dd className="text-sm text-slate-900">{children}</dd>
    </div>
  );
}

function formatDate(d: string) {
  const date = new Date(d);
  return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
}

function statusLabel(status: Job["status"]) {
  return { open: "募集中", filled: "充足", closed: "終了" }[status];
}
