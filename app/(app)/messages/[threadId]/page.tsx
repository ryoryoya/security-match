import { notFound } from "next/navigation";
import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import ChatWindow from "@/components/chat-window";
import type { Company, Job, Message } from "@/lib/types";

export default async function ThreadPage({
  params,
}: {
  params: Promise<{ threadId: string }>;
}) {
  const { threadId } = await params;
  const session = await requireSession();
  const supabase = await createClient();

  const { data: thread } = await supabase
    .from("message_threads")
    .select("*")
    .eq("id", threadId)
    .maybeSingle();

  if (!thread) notFound();

  const otherCompanyId =
    thread.company_a_id === session.company.id
      ? thread.company_b_id
      : thread.company_a_id;

  const [{ data: otherCompany }, { data: job }, { data: messages }] =
    await Promise.all([
      supabase.from("companies").select("*").eq("id", otherCompanyId).single(),
      supabase
        .from("jobs")
        .select("id,title,work_date")
        .eq("id", thread.job_id)
        .single(),
      supabase
        .from("messages")
        .select("*")
        .eq("thread_id", threadId)
        .order("created_at", { ascending: true }),
    ]);

  return (
    <div className="max-w-3xl h-[calc(100vh-3rem)] flex flex-col">
      <div className="mb-4">
        <Link
          href="/messages"
          className="text-sm text-slate-400 hover:text-white"
        >
          ← メッセージ一覧
        </Link>
        <h1 className="text-xl font-bold text-white mt-1">
          {(otherCompany as Company)?.name}
        </h1>
        <p className="text-sm text-slate-400">
          案件:{" "}
          <Link
            href={`/jobs/${thread.job_id}`}
            className="text-brand-300 hover:underline"
          >
            {(job as Pick<Job, "id" | "title" | "work_date">)?.title}
          </Link>
        </p>
      </div>
      <ChatWindow
        threadId={threadId}
        myCompanyId={session.company.id}
        myUserId={session.userId}
        initialMessages={(messages ?? []) as Message[]}
      />
    </div>
  );
}
