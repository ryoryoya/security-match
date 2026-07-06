import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const resendKey = Deno.env.get("RESEND_API_KEY") ?? "";
const fromEmail = Deno.env.get("FROM_EMAIL") ?? "security-match <onboarding@resend.dev>";
const appUrl = Deno.env.get("APP_URL") ?? "http://localhost:3000";
const webhookSecret = Deno.env.get("WEBHOOK_SECRET") ?? "";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

interface WebhookPayload {
  type: string;
  table: string;
  record: Record<string, unknown>;
}

Deno.serve(async (req: Request) => {
  if (!webhookSecret) {
    console.error("WEBHOOK_SECRET env var is not configured; refusing all requests");
    return new Response(JSON.stringify({ error: "server misconfigured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
  const provided = req.headers.get("x-webhook-secret") ?? "";
  if (!timingSafeEqual(provided, webhookSecret)) {
    console.warn("unauthorized call from", req.headers.get("x-forwarded-for"));
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const payload = (await req.json()) as WebhookPayload;

    let result: { sent: number } = { sent: 0 };
    if (payload.table === "jobs" && payload.type === "INSERT") {
      result = await handleJobCreated(payload.record);
    } else if (payload.table === "applications" && payload.type === "INSERT") {
      result = await handleApplicationCreated(payload.record);
    } else if (
      payload.table === "applications" &&
      payload.type === "UPDATE" &&
      (payload.record.status === "accepted" || payload.record.status === "rejected")
    ) {
      result = await handleApplicationStatusChanged(payload.record);
    }

    return new Response(JSON.stringify({ ok: true, ...result }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("handler error:", err);
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

async function handleJobCreated(job: Record<string, unknown>) {
  const companyId = job.company_id as string;
  const { data: ownerCompany } = await supabase
    .from("companies")
    .select("name")
    .eq("id", companyId)
    .maybeSingle();

  const { data: recipients } = await supabase
    .from("profiles")
    .select("notification_email")
    .neq("company_id", companyId)
    .not("notification_email", "is", null);

  const emails = Array.from(
    new Set(
      (recipients ?? [])
        .map((r: { notification_email: string | null }) => r.notification_email)
        .filter((e): e is string => !!e)
    )
  );
  if (emails.length === 0) return { sent: 0 };

  const title = String(job.title ?? "");
  const workDate = workPeriod(String(job.work_date ?? ""), String(job.work_end_date ?? ""));
  const prefecture = String(job.prefecture ?? "");
  const location = String(job.location ?? "");
  const requiredCount = Number(job.required_count ?? 0);
  const unitPrice = Number(job.unit_price ?? 0);
  const priceType = String(job.price_type ?? "daily");
  const ownerName = ownerCompany?.name ?? "";

  const html = `<div style="font-family:-apple-system,sans-serif;max-width:560px;color:#0f172a;"><h2 style="color:#253a8c;">新規案件が投稿されました</h2><p><strong>${esc(ownerName)}</strong> が新しい案件を投稿しました。</p><table cellpadding="8" style="border-collapse:collapse;width:100%;font-size:14px;"><tr><td style="background:#f1f5f9;width:32%;">タイトル</td><td>${esc(title)}</td></tr><tr><td style="background:#f1f5f9;">作業日</td><td>${esc(workDate)}</td></tr><tr><td style="background:#f1f5f9;">場所</td><td>${esc((prefecture+" "+location).trim()||"-")}</td></tr><tr><td style="background:#f1f5f9;">必要人数</td><td>${requiredCount} 名</td></tr><tr><td style="background:#f1f5f9;">単価</td><td>¥${unitPrice.toLocaleString()}${priceType==="hourly"?"/時":"/日"}</td></tr></table><p style="margin-top:24px;"><a href="${appUrl}/jobs/${job.id}" style="display:inline-block;background:#3b5bdb;color:white;padding:10px 20px;text-decoration:none;border-radius:6px;">アプリで確認</a></p></div>`;

  await sendMail({ to: emails, subject: `【新規案件】${ownerName}: ${title}`, html });
  return { sent: emails.length };
}

async function handleApplicationCreated(app: Record<string, unknown>) {
  const jobId = app.job_id as string;
  const applicantCompanyId = app.applicant_company_id as string;

  const { data: job } = await supabase.from("jobs").select("title, company_id").eq("id", jobId).maybeSingle();
  if (!job) return { sent: 0 };

  const { data: applicant } = await supabase.from("companies").select("name").eq("id", applicantCompanyId).maybeSingle();

  const { data: recipients } = await supabase.from("profiles").select("notification_email").eq("company_id", job.company_id as string).not("notification_email", "is", null);

  const emails = Array.from(new Set((recipients ?? []).map((r: { notification_email: string | null }) => r.notification_email).filter((e): e is string => !!e)));
  if (emails.length === 0) return { sent: 0 };

  const jobTitle = String(job.title ?? "");
  const applicantName = applicant?.name ?? "";
  const offeredCount = Number(app.offered_count ?? 0);
  const note = String(app.note ?? "");

  const html = `<div style="font-family:-apple-system,sans-serif;max-width:560px;color:#0f172a;"><h2 style="color:#253a8c;">応募が届きました</h2><p>案件「<strong>${esc(jobTitle)}</strong>」に <strong>${esc(applicantName)}</strong> から応募がありました。</p><table cellpadding="8" style="border-collapse:collapse;width:100%;font-size:14px;"><tr><td style="background:#f1f5f9;width:32%;">出せる人数</td><td>${offeredCount} 名</td></tr><tr><td style="background:#f1f5f9;">メモ</td><td>${esc(note)}</td></tr></table><p style="margin-top:24px;"><a href="${appUrl}/jobs/${jobId}" style="display:inline-block;background:#3b5bdb;color:white;padding:10px 20px;text-decoration:none;border-radius:6px;">承認画面へ</a></p></div>`;

  await sendMail({ to: emails, subject: `【応募あり】${applicantName}: ${jobTitle}`, html });
  return { sent: emails.length };
}

async function handleApplicationStatusChanged(app: Record<string, unknown>) {
  const jobId = app.job_id as string;
  const applicantCompanyId = app.applicant_company_id as string;
  const status = String(app.status ?? "");
  const offeredCount = Number(app.offered_count ?? 0);

  const { data: job } = await supabase
    .from("jobs")
    .select("title, company_id, work_date, work_end_date, prefecture, location")
    .eq("id", jobId)
    .maybeSingle();
  if (!job) return { sent: 0 };

  const { data: ownerCompany } = await supabase
    .from("companies")
    .select("name")
    .eq("id", job.company_id as string)
    .maybeSingle();

  const { data: recipients } = await supabase
    .from("profiles")
    .select("notification_email")
    .eq("company_id", applicantCompanyId)
    .not("notification_email", "is", null);

  const emails = Array.from(
    new Set(
      (recipients ?? [])
        .map((r: { notification_email: string | null }) => r.notification_email)
        .filter((e): e is string => !!e)
    )
  );
  if (emails.length === 0) return { sent: 0 };

  const jobTitle = String(job.title ?? "");
  const workDate = workPeriod(String(job.work_date ?? ""), String(job.work_end_date ?? ""));
  const prefecture = String(job.prefecture ?? "");
  const location = String(job.location ?? "");
  const ownerName = ownerCompany?.name ?? "";

  const isAccepted = status === "accepted";
  const subjectTag = isAccepted ? "【応募承認】" : "【応募不採用】";
  const headline = isAccepted
    ? "応募が承認されました"
    : "応募が不採用となりました";
  const bodyMsg = isAccepted
    ? `案件「<strong>${esc(jobTitle)}</strong>」への応募が <strong>${esc(ownerName)}</strong> により承認されました。チャットで詳細を調整してください。`
    : `案件「<strong>${esc(jobTitle)}</strong>」への応募は、<strong>${esc(ownerName)}</strong> より今回は見送られました。他の案件もご確認ください。`;
  const headerColor = isAccepted ? "#16a34a" : "#dc2626";
  const btnLabel = isAccepted ? "チャットを開く" : "他の案件を見る";
  const btnUrl = isAccepted ? `${appUrl}/jobs/${jobId}` : `${appUrl}/jobs`;

  const html = `<div style="font-family:-apple-system,sans-serif;max-width:560px;color:#0f172a;"><h2 style="color:${headerColor};">${headline}</h2><p>${bodyMsg}</p><table cellpadding="8" style="border-collapse:collapse;width:100%;font-size:14px;"><tr><td style="background:#f1f5f9;width:32%;">案件</td><td>${esc(jobTitle)}</td></tr><tr><td style="background:#f1f5f9;">作業日</td><td>${esc(workDate)}</td></tr><tr><td style="background:#f1f5f9;">場所</td><td>${esc((prefecture+" "+location).trim()||"-")}</td></tr><tr><td style="background:#f1f5f9;">出せる人数</td><td>${offeredCount} 名</td></tr></table><p style="margin-top:24px;"><a href="${btnUrl}" style="display:inline-block;background:#3b5bdb;color:white;padding:10px 20px;text-decoration:none;border-radius:6px;">${btnLabel}</a></p></div>`;

  await sendMail({ to: emails, subject: `${subjectTag}${ownerName}: ${jobTitle}`, html });
  return { sent: emails.length };
}

async function sendMail({ to, subject, html }: { to: string[]; subject: string; html: string }) {
  if (!resendKey) {
    throw new Error("RESEND_API_KEY is not set");
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: fromEmail, to, subject, html }),
  });
  const text = await res.text();
  if (!res.ok) {
    console.error("Resend API error:", res.status, text);
    throw new Error(`Resend API error ${res.status}: ${text}`);
  }
  console.log("sent to", to.length, "recipients");
}

function esc(s: string): string {
  return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

function workPeriod(workDate: string, workEndDate: string): string {
  if (workEndDate && workEndDate !== workDate) return `${workDate} 〜 ${workEndDate}`;
  return workDate;
}
